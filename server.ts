import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignora se não suportado na versão
}
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  normalizeText,
  tokenizeWords,
  generateShingles,
  winnow,
  hashShingle,
  calculateContainment,
  calculateJaccard,
  extractMatchingExcerpts,
  extractCharacteristicPhrases,
  prepareSourceDocument,
  analyzeParagraphDeterministically,
  calculateWeightedOverallSimilarity,
  detectLegitimateAbntCitation,
  fetchWikipediaPtSources,
  fetchCrossrefSources,
  fetchOpenAlexSources,
  SourceQueryResult,
  SourceStatusReport,
  PreparedSourceDocument,
  ParagraphSimilarityAnalysis,
} from './src/services/similarityEngine';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of GoogleGenAI client to avoid crashes if GEMINI_API_KEY is not yet set
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('A chave GEMINI_API_KEY não foi encontrada nas variáveis de ambiente.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Fallback resiliente para garantir disponibilidade contra indisponibilidade ou picos temporários
async function generateWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  params: {
    contents: any;
    config?: any;
  },
  timeoutMs = 25000
) {
  // Modelo estável e de resposta ultra-rápida no Google AI Studio
  const requested = primaryModel || 'gemini-2.5-flash';
  // Sanitiza modelos descontinuados que retornam 404 (como gemini-2.5-flash-lite ou pro)
  const safePrimary = (requested.includes('lite') || requested.includes('pro'))
    ? 'gemini-2.5-flash'
    : requested;

  const modelsToTry = [
    safePrimary,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastErr: any = null;
  for (const modelName of modelsToTry) {
    try {
      // Timeout seguro por modelo para não travar a experiência do usuário
      const response = await Promise.race([
        ai.models.generateContent({
          ...params,
          model: modelName,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tempo limite excedido ao comunicar com ${modelName}`)), timeoutMs)
        ),
      ]);
      return { response: response as any, usedModel: modelName };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Tentativa com modelo ${modelName} falhou:`, err?.message || err);
      lastErr = err;
    }
  }
  throw lastErr;
}

// -------------------------------------------------------------
// Firebase ID Token Verification & Rate Limiting (Antiplagiarism Protection)
// -------------------------------------------------------------
let cachedFirebaseApiKey: string | null = null;
function getFirebaseApiKey(): string | null {
  if (cachedFirebaseApiKey) return cachedFirebaseApiKey;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg && cfg.apiKey) {
        cachedFirebaseApiKey = cfg.apiKey;
        return cachedFirebaseApiKey;
      }
    }
  } catch (err) {
    console.error('Erro ao ler firebase-applet-config.json:', err);
  }
  return process.env.VITE_FIREBASE_API_KEY || null;
}

export async function verifyFirebaseIdToken(
  token: string
): Promise<{ uid: string; email?: string } | null> {
  if (!token || typeof token !== 'string') return null;
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    console.warn('[Auth] Firebase API Key não configurada para verificação de token.');
    return null;
  }

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`[Auth] Falha na validação do token Firebase (status ${res.status}):`, errBody);
      return null;
    }

    const data = (await res.json()) as { users?: Array<{ localId: string; email?: string }> };
    if (data.users && data.users.length > 0 && data.users[0].localId) {
      return {
        uid: data.users[0].localId,
        email: data.users[0].email,
      };
    }
    return null;
  } catch (err) {
    console.error('[Auth] Erro ao verificar token Firebase:', err);
    return null;
  }
}

// Limite em memória por usuário: máximo 10 requisições a cada 10 minutos
const antiplagiarismRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkAntiplagiarismRateLimit(
  userUid: string,
  maxRequests = 10,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = antiplagiarismRateLimits.get(userUid);
  if (!record || now > record.resetAt) {
    antiplagiarismRateLimits.set(userUid, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  record.count += 1;
  return { allowed: true };
}

// -------------------------------------------------------------
// API Routes: Wikimedia Foundation IP Check & Security
// -------------------------------------------------------------

const WMF_IPV4_CIDRS = [
  '185.15.56.0/22',
  '91.198.174.0/24',
  '195.200.68.0/24',
  '193.46.90.0/24',
  '198.35.26.0/23',
  '208.80.152.0/22',
  '103.102.166.0/24',
  '185.71.138.0/24',
];

const WMF_IPV6_CIDRS = [
  '2a02:ec80::/29',
  '2620:0:860::/46',
  '2001:df2:e500::/48',
];

function checkIpv4Cidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const toNum = (s: string) => {
    const parts = s.trim().split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const o = parseInt(parts[i], 10);
      if (isNaN(o) || o < 0 || o > 255) return null;
      n = (n << 8) + o;
    }
    return n >>> 0;
  };

  const ipNum = toNum(ip);
  const rangeNum = toNum(rangeIp);
  if (ipNum === null || rangeNum === null) return false;
  if (prefix === 0) return true;
  const mask = (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

function checkIpv6Cidr(ip: string, cidr: string): boolean {
  try {
    const [rangeIp, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 128) return false;

    const toBigInt = (raw: string): bigint | null => {
      let clean = raw.trim().toLowerCase();
      if (clean.includes('.')) {
        const lastCol = clean.lastIndexOf(':');
        if (lastCol !== -1) {
          const v4Part = clean.slice(lastCol + 1).split('.');
          if (v4Part.length === 4) {
            const v4Num =
              (parseInt(v4Part[0], 10) << 24) +
              (parseInt(v4Part[1], 10) << 16) +
              (parseInt(v4Part[2], 10) << 8) +
              parseInt(v4Part[3], 10);
            const hex = (v4Num >>> 0).toString(16).padStart(8, '0');
            clean = `${clean.slice(0, lastCol)}:${hex.slice(0, 4)}:${hex.slice(4)}`;
          }
        }
      }
      const halves = clean.split('::');
      let groups: string[] = [];
      if (halves.length === 2) {
        const l = halves[0] ? halves[0].split(':') : [];
        const r = halves[1] ? halves[1].split(':') : [];
        const m = 8 - (l.length + r.length);
        if (m < 0) return null;
        groups = [...l, ...new Array(m).fill('0'), ...r];
      } else if (halves.length === 1) {
        groups = clean.split(':');
        if (groups.length !== 8) return null;
      } else {
        return null;
      }
      let res = 0n;
      for (const g of groups) {
        res = (res << 16n) + BigInt(parseInt(g || '0', 16));
      }
      return res;
    };

    const ipBig = toBigInt(ip);
    const rangeBig = toBigInt(rangeIp);
    if (ipBig === null || rangeBig === null) return false;
    if (prefix === 0) return true;
    const shift = 128n - BigInt(prefix);
    return (ipBig >> shift) === (rangeBig >> shift);
  } catch {
    return false;
  }
}

function evaluateWikimediaIp(rawIp: string): { isWikimedia: boolean; matchedRange?: string } {
  let ip = (rawIp || '').trim();
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip.startsWith('[') && ip.includes(']')) ip = ip.slice(1, ip.indexOf(']'));
  if (ip.includes(':') && ip.indexOf(':') === ip.lastIndexOf(':') && ip.includes('.')) {
    ip = ip.split(':')[0];
  }

  for (const cidr of WMF_IPV4_CIDRS) {
    if (checkIpv4Cidr(ip, cidr)) {
      return { isWikimedia: true, matchedRange: cidr };
    }
  }
  for (const cidr of WMF_IPV6_CIDRS) {
    if (checkIpv6Cidr(ip, cidr)) {
      return { isWikimedia: true, matchedRange: cidr };
    }
  }
  return { isWikimedia: false };
}

app.all('/api/auth/check-wikimedia-ip', async (req: Request, res: Response) => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const reqIp = (typeof req.query.ip === 'string' && req.query.ip) || (req.body && req.body.ip);

  let clientIp = (reqIp ||
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
    (typeof realIp === 'string' ? realIp.trim() : '') ||
    req.socket.remoteAddress ||
    '127.0.0.1') as string;

  if (clientIp.startsWith('::ffff:')) clientIp = clientIp.replace('::ffff:', '');

  const check = evaluateWikimediaIp(clientIp);

  // Verificação adicional opcional de hostname reverso
  let reverseHost: string | null = null;
  if (!check.isWikimedia && clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
    try {
      const hostnames = await dns.promises.reverse(clientIp);
      if (Array.isArray(hostnames) && hostnames.length > 0) {
        reverseHost = hostnames[0];
        if (
          reverseHost.endsWith('.wikimedia.org') ||
          reverseHost.endsWith('.wmnet') ||
          reverseHost.endsWith('.wmflabs.org') ||
          reverseHost.endsWith('.wikipedia.org')
        ) {
          check.isWikimedia = true;
          check.matchedRange = 'rDNS: ' + reverseHost;
        }
      }
    } catch {
      // Ignora falha de DNS reverso
    }
  }

  res.json({
    isWikimedia: check.isWikimedia,
    blocked: check.isWikimedia,
    ip: clientIp,
    matchedRange: check.matchedRange || null,
    reverseHost,
    asn: 'AS14907',
    org: 'Wikimedia Foundation, Inc.',
    reason: check.isWikimedia
      ? 'O login foi bloqueado para este endereço de IP por pertencer à infraestrutura oficial da Wikimedia Foundation (AS14907).'
      : null,
  });
});

// -------------------------------------------------------------
// Rota de serviço do documento oficial em PDF:
// "Irregularidades da Wikipédia e Wikimedia Foundation"
// -------------------------------------------------------------
app.get([
  '/api/documents/irregularidades-wikipedia.pdf',
  '/api/documents/irregularidades-wikipedia',
  '/api/documents/irregularidades-pdf',
  '/documents/Irregularidades da Wikipédia e Wikimedia Foundation.pdf',
  '/documents/irregularidades-wikipedia-wikimedia-foundation.pdf',
  '/Irregularidades da Wikipédia e Wikimedia Foundation.pdf',
  '/irregularidades-wikipedia-wikimedia-foundation.pdf'
], (req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), 'public', 'Irregularidades da Wikipédia e Wikimedia Foundation.pdf');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"');
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: 'Documento PDF não encontrado.' });
});

// -------------------------------------------------------------
// API Routes: VPN, Proxy & Tor Connection Check & Blocking
// -------------------------------------------------------------

const SERVER_VPN_ASNS = [
  'AS9009',   // M247 Ltd
  'AS60068',  // Datacamp Limited
  'AS202425', // IP Volume inc / NordVPN
  'AS136787', // TEFINCOM S.A. / NordVPN
  'AS42303',  // Mullvad VPN
  'AS39351',  // Mullvad
  'AS62371',  // Proton AG
  'AS209854', // Proton AG
  'AS35908',  // Private Internet Access
  'AS61317',  // PIA
  'AS205461', // CyberGhost / Kape
  'AS200052', // ExpressVPN
  'AS394711', // ExpressVPN
  'AS208323', // ExpressVPN
  'AS206092', // Windscribe
  'AS11878',  // Tzulo Inc
  'AS20473',  // Choopa / Vultr
  'AS14061',  // DigitalOcean
  'AS63949',  // Linode / Akamai
  'AS16276',  // OVH SAS
  'AS35540',  // OVH
  'AS24940',  // Hetzner Online
  'AS16265',  // Leaseweb
  'AS28753',  // Leaseweb
  'AS59711',  // Leaseweb
  'AS46562',  // Performive
  'AS208294', // Tor Project
  'AS13335',  // Cloudflare
  'AS15169',  // Google Cloud
  'AS16509',  // Amazon AWS
  'AS8075',   // Microsoft Azure
  'AS31898',  // Oracle Cloud
];

const SERVER_VPN_CIDRS = [
  '185.156.172.0/22',
  '185.220.100.0/22', // Tor Exit nodes
  '185.220.101.0/24', // Tor Exit nodes
  '185.220.102.0/24', // Tor Exit nodes
  '176.10.99.0/24',   // Tor Exit nodes
  '193.138.218.0/24', // Mullvad
  '194.242.110.0/24', // Mullvad
  '185.213.154.0/24', // Mullvad
  '185.159.157.0/24', // Proton
  '185.159.158.0/24', // Proton
  '149.102.242.0/24', // Proton
  '185.107.56.0/24',  // Proton
  '195.181.160.0/22', // Datacamp
  '185.156.174.0/23', // M247
];

const vpnIpCache = new Map<string, { data: any; timestamp: number }>();
const VPN_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de cache

app.all('/api/security/check-vpn', async (req: Request, res: Response) => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const reqIp = (typeof req.query.ip === 'string' && req.query.ip) || (req.body && req.body.ip);

  let clientIp = (reqIp ||
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
    (typeof realIp === 'string' ? realIp.trim() : '') ||
    req.socket.remoteAddress ||
    '127.0.0.1') as string;

  if (clientIp.startsWith('::ffff:')) clientIp = clientIp.replace('::ffff:', '');
  if (clientIp.startsWith('[') && clientIp.includes(']')) clientIp = clientIp.slice(1, clientIp.indexOf(']'));
  if (clientIp.includes(':') && clientIp.indexOf(':') === clientIp.lastIndexOf(':') && clientIp.includes('.')) {
    clientIp = clientIp.split(':')[0];
  }

  // Verificar cache em memória
  const cached = vpnIpCache.get(clientIp);
  if (cached && Date.now() - cached.timestamp < VPN_CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  // 1. Checagem em CIDRs conhecidos de VPN/Tor
  for (const cidr of SERVER_VPN_CIDRS) {
    if (checkIpv4Cidr(clientIp, cidr)) {
      const isTor = cidr.startsWith('185.220.');
      const result = {
        ip: clientIp,
        isVpn: !isTor,
        isProxy: true,
        isTor: isTor,
        isHosting: true,
        blocked: true,
        confidence: 'high',
        riskScore: isTor ? 99 : 94,
        provider: isTor ? 'Tor Project Exit Node' : 'Servidor VPN Comercial',
        matchedCidr: cidr,
        reason: isTor
          ? `Endereço IP identificado como Nó de Saída Tor (${cidr}). Autenticações anônimas não são permitidas na Wiki.`
          : `Endereço IP pertencente à faixa registrada de servidor VPN (${cidr}). O login com VPN está desabilitado por política comunitária.`,
        checkedAt: new Date().toISOString(),
      };
      vpnIpCache.set(clientIp, { data: result, timestamp: Date.now() });
      return res.json(result);
    }
  }

  // 2. Lookup de DNS Reverso
  let reverseDns: string | null = null;
  let isVpnByDns = false;
  let isTorByDns = false;
  let isHostingByDns = false;
  let detectedProvider: string | null = null;

  if (clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
    try {
      const hostnames = await dns.promises.reverse(clientIp);
      if (Array.isArray(hostnames) && hostnames.length > 0) {
        reverseDns = hostnames[0].toLowerCase();
        if (reverseDns.includes('tor') || reverseDns.includes('exit')) {
          isTorByDns = true;
          isVpnByDns = true;
          detectedProvider = 'Tor Exit Node';
        } else if (
          reverseDns.includes('vpn') ||
          reverseDns.includes('m247') ||
          reverseDns.includes('datacamp') ||
          reverseDns.includes('mullvad') ||
          reverseDns.includes('nordvpn') ||
          reverseDns.includes('proton') ||
          reverseDns.includes('expressvpn') ||
          reverseDns.includes('proxy') ||
          reverseDns.includes('tunnel')
        ) {
          isVpnByDns = true;
          detectedProvider = 'Rede VPN Comercial (' + hostnames[0] + ')';
        } else if (
          reverseDns.includes('hosting') ||
          reverseDns.includes('vps') ||
          reverseDns.includes('linode') ||
          reverseDns.includes('digitalocean') ||
          reverseDns.includes('hetzner') ||
          reverseDns.includes('ovh') ||
          reverseDns.includes('leaseweb') ||
          reverseDns.includes('amazon') ||
          reverseDns.includes('googleusercontent') ||
          reverseDns.includes('azure')
        ) {
          isHostingByDns = true;
          detectedProvider = 'Datacenter / Servidor em Nuvem';
        }
      }
    } catch {
      // Ignora falha de DNS reverso
    }
  }

  // 3. Consulta à API de inteligência de IP com timeout rígido de 2.5s
  let apiData: any = null;
  if (!clientIp.startsWith('127.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const apiResp = await fetch(
        `http://ip-api.com/json/${clientIp}?fields=status,message,country,city,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (apiResp.ok) {
        apiData = await apiResp.json();
      }
    } catch {
      // Falha ou timeout na API externa
    }
  }

  const isProxyFromApi = apiData?.proxy === true;
  const isHostingFromApi = apiData?.hosting === true;
  const orgAsUpper = `${apiData?.as || ''} ${apiData?.org || ''} ${apiData?.isp || ''}`.toUpperCase();

  let isKnownAsn = false;
  for (const asn of SERVER_VPN_ASNS) {
    if (orgAsUpper.includes(asn)) {
      isKnownAsn = true;
      break;
    }
  }

  const isVpn = isVpnByDns || isProxyFromApi || isKnownAsn;
  const isTor = isTorByDns || orgAsUpper.includes('TOR') || (reverseDns && reverseDns.includes('tor'));
  const isHosting = isHostingByDns || isHostingFromApi || isKnownAsn;
  const isBlocked = isVpn || isTor || isProxyFromApi || (isHosting && !apiData?.mobile);

  const riskScore = isTor ? 99 : isProxyFromApi ? 95 : isKnownAsn ? 90 : isVpn ? 88 : isHosting ? 80 : 10;
  const confidence = (isProxyFromApi || isKnownAsn || isVpnByDns) ? 'high' : isHosting ? 'medium' : 'low';

  const provider = detectedProvider || apiData?.org || apiData?.isp || (isBlocked ? 'Provedor de VPN / Datacenter' : 'Conexão Residencial Comum');

  let reason = 'Conexão residencial verificada. Autenticação permitida na WikiWorldWeb.';
  if (isBlocked) {
    if (isTor) {
      reason = 'Conexão através da rede Tor detectada. Por razões de transparência editorial e prevenção de vandalismo anônimo, o login está bloqueado.';
    } else if (isVpn || isProxyFromApi) {
      reason = `Conexão através de VPN ou Proxy anônimo detectada (${provider}). O login na WikiWorldWeb está desabilitado para conexões VPN para prevenir contas fantoches (sockpuppets) e evasão de bloqueios.`;
    } else if (isHosting) {
      reason = `Conexão originada de servidor em Datacenter/Hosting (${provider}). O acesso de usuário requer endereço IP de conexão residencial ou móvel legítima.`;
    }
  }

  const finalResult = {
    ip: clientIp,
    isVpn: !!isVpn,
    isProxy: !!(isProxyFromApi || isVpnByDns),
    isTor: !!isTor,
    isHosting: !!isHosting,
    blocked: !!isBlocked,
    confidence,
    riskScore,
    provider,
    asn: apiData?.as || undefined,
    org: apiData?.org || undefined,
    country: apiData?.country || undefined,
    city: apiData?.city || undefined,
    reverseDns: reverseDns || apiData?.reverse || undefined,
    reason,
    checkedAt: new Date().toISOString(),
  };

  // Salvar no cache em memória
  vpnIpCache.set(clientIp, { data: finalResult, timestamp: Date.now() });

  res.json(finalResult);
});

// -------------------------------------------------------------
// API Routes: Wikimedia Foundation Admin Nicknames Security
// -------------------------------------------------------------

const PRIORITY_WMF_ADMINS = ['Chronus', 'LittleSunshine', 'Johannnes89', 'Teles', 'Conde Edmond Dantés'];

const ALL_WMF_ADMINS = [
  ...PRIORITY_WMF_ADMINS,
  'Conde Edmond Dantes',
  'Érico', 'Erico', 'Alberto leoncio', 'Albertoleoncio', 'Athena in Wonderland',
  'Beria Lima', 'Beria', 'RadiX', 'Fabiano', 'Gogan', 'GoEThe', 'Leonprimer',
  'Stuckkey', 'DarwIn', 'He7d3r', 'HV', 'Vitor Mazuco', 'Chicocvenancio',
  'Mwalcoff', 'JMagalhães', 'JMagalhaes', 'João Xavier', 'Joao Xavier', 'HCa',
  'GFontenelle', 'Escaravelho', 'Luizdl', 'EVitor', 'DARIO SEVERI', 'Alchimista',
  'Rei-artur', 'TXiKi', 'Geno-V', 'Nemo bis', 'Taketa', 'Trijnstel', 'DerHexer',
  'Vituzzu', 'Callanecc', 'Stryn', 'Billinghurst', 'Mardetanha', 'Hasley', 'MF-Warburg',
  'Superzerocool', 'DanCharly', 'Jimbo Wales', 'Jimmy Wales', 'Drmies', 'Fram',
  'Bishonen', 'Barkeep49', 'Moneytrees', 'Yamla', 'Kudpung', 'Primefac', 'Taivo',
  'Cyberpower678', 'Materialscientist', 'Widr', 'Gilliam', 'Favonian', 'Ymblanter',
  'Ladsgroup', 'Kaldari', 'DannyS712', 'WikiSysop', 'WMFOffice', 'Wikimedia Foundation'
];

function normStr(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

app.all('/api/auth/check-wikimedia-admin', (req: Request, res: Response) => {
  const username = (typeof req.query.username === 'string' && req.query.username) || (req.body && req.body.username) || '';
  const email = (typeof req.query.email === 'string' && req.query.email) || (req.body && req.body.email) || '';

  const testNorm = normStr(username);
  const emailPrefixNorm = email.includes('@') ? normStr(email.split('@')[0]) : '';

  let matched: string | null = null;
  let isPriority = false;

  for (const prio of PRIORITY_WMF_ADMINS) {
    const pNorm = normStr(prio);
    if (testNorm === pNorm || (emailPrefixNorm && emailPrefixNorm === pNorm)) {
      matched = prio;
      isPriority = true;
      break;
    }
  }

  if (!matched) {
    for (const admin of ALL_WMF_ADMINS) {
      const aNorm = normStr(admin);
      if (aNorm.length <= 3) {
        if (testNorm === aNorm || (emailPrefixNorm && emailPrefixNorm === aNorm)) {
          matched = admin;
          break;
        }
      } else if (testNorm === aNorm || (emailPrefixNorm && emailPrefixNorm === aNorm)) {
        matched = admin;
        break;
      }
    }
  }

  res.json({
    isBlocked: !!matched,
    matchedAdmin: matched,
    isPriority,
    reason: matched
      ? `O nickname '${matched}' possui bloqueio institucional por constar na lista de administradores/operadores da Wikimedia Foundation.`
      : null,
  });
});

// -------------------------------------------------------------
// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.get('/api/ping', (req: Request, res: Response) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  res.json({
    status: 'online',
    timestamp: Date.now(),
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// -------------------------------------------------------------
// API Routes: Firebase Rules & Security Backup (Requisitos 3.05.9.c & 3.05.9.d)
// -------------------------------------------------------------

// Obter regras ativas do Firestore e metadados em JSON (3.05.9.c)
app.get('/api/firebase/rules', (req: Request, res: Response) => {
  try {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');

    let rulesContent = '';
    if (fs.existsSync(rulesPath)) {
      rulesContent = fs.readFileSync(rulesPath, 'utf-8');
    }

    let blueprint = null;
    if (fs.existsSync(blueprintPath)) {
      try {
        blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
      } catch {}
    }

    let config = null;
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {}
    }

    res.json({
      success: true,
      service: 'cloud.firestore',
      rulesVersion: '2',
      rulesContent,
      rulesLinesCount: rulesContent.split('\n').length,
      projectId: config?.projectId || 'wzzm-ce3fc',
      firestoreDatabaseId: config?.firestoreDatabaseId || 'ai-studio-wikizeroenciclop-0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      blueprint,
      config,
      exportedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Falha ao ler regras do Firebase' });
  }
});

// Salvar / atualizar regras do Firestore enviadas em JSON (3.05.9.d)
app.post('/api/firebase/rules', (req: Request, res: Response) => {
  try {
    const { rulesContent, rules } = req.body;
    const contentToSave = rulesContent || rules;

    if (!contentToSave || typeof contentToSave !== 'string') {
      return res.status(400).json({ success: false, error: 'Conteúdo de regras firestore.rules inválido ou ausente no JSON.' });
    }

    // Validação mínima de segurança de sintaxe
    if (!contentToSave.includes('rules_version') || !contentToSave.includes('service cloud.firestore')) {
      return res.status(400).json({
        success: false,
        error: 'O JSON fornecido não contém uma declaração válida de regras Firestore (esperado rules_version e service cloud.firestore).'
      });
    }

    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    fs.writeFileSync(rulesPath, contentToSave, 'utf-8');

    res.json({
      success: true,
      message: 'Regras firestore.rules atualizadas com sucesso no servidor!',
      linesCount: contentToSave.split('\n').length,
      savedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Falha ao gravar firestore.rules' });
  }
});

// API Routes: Gemini Chatbot (Google AI Studio)
// -------------------------------------------------------------

// 1. Status do Chatbot e Variável GEMINI_API_KEY (Requisito 3.05.3.ag)
app.get('/api/gemini/status', (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = !!apiKey;
  const maskedKey = hasKey
    ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
    : null;

  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    variableName: 'GEMINI_API_KEY',
    defaultModel: 'gemini-3.8-flash',
    appletId: '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
    provider: 'Google AI Studio & Gemini API',
    maskedKey,
    serverSideProxy: true,
    recommendedModels: [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-4-argon',
      'gemini-3.1-flash-lite',
      'gemini-3.1-flash-lite-image',
      'gemini-3.8-flash-lite-tts',
      'gemini-3.5-transcribe',
    ],
  });
});

// 1.1 Teste de Ping e Diagnóstico da variável GEMINI_API_KEY (Requisito 3.05.3.ag)
app.post('/api/gemini/test-ping', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const ai = getGemini();
    const testModel = req.body?.model || 'gemini-3.8-flash';
    const prompt = req.body?.prompt || 'Responda em uma frase curta confirmando que a variável GEMINI_API_KEY está ativa e funcionando no servidor da Wiki.';

    const { response, usedModel } = await generateWithFallback(
      ai,
      testModel,
      {
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      },
      15000
    );

    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      variable: 'GEMINI_API_KEY',
      model: usedModel || testModel,
      latencyMs,
      reply: response.text || 'Conexão GEMINI_API_KEY operacional.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erro no teste de ping GEMINI_API_KEY:', err);
    res.status(500).json({
      success: false,
      variable: 'GEMINI_API_KEY',
      error: err?.message || 'Falha ao conectar à API do Gemini usando GEMINI_API_KEY.',
      details: err?.toString(),
    });
  }
});

// 2. Chatbot Geral & Assistente de Criação de Conteúdo com Identidade de Usuário, Imagens e Oferta de Planos
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      context = {},
      chatbotId = '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      customSystemInstruction,
      model = 'gemini-2.5-flash',
      image = null,
      userId = null,
      userEmail = null,
      userDisplayName = null,
      userRole = 'visitante',
      isGuest = false,
      isPremium = false,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem obrigatória.' });
    }

    const ai = getGemini();

    // Monta a instrução de sistema adaptada para a WikiZero, AI Studio e identidade do usuário
    let systemInstruction = `Você é o Chatbot Assistente Oficial da WikiZero, alimentado pelo Google AI Studio (Chatbot ID: "${chatbotId}").
Sua principal função é auxiliar leitores, redatores e administradores na enciclopédia WikiZero em:
1. Criação e estruturação de coleções de artigos (páginas WikiPage com título, UID slug, descrição, categoria, emoji de ícone e tags).
2. Criação, expansão, revisão e redação de artigos enciclopédicos completos usando formatação sintática MediaWiki / Wikitext.
3. Fornecer explicações neutras, verificáveis, com tom enciclopédico de alta qualidade, sem alucinações.
4. Análise visual de documentos, mapas, manuscritos, infográficos e imagens enviadas pelo usuário para redação de verbetes.

Diretrizes de Formatação de Wikitext para WikiZero:
- Títulos de seções: "= Título Principal =", "== Seção Principal ==", "=== Subseção ===", "==== Tópico ====".
- Negrito: '''texto''', Itálico: ''texto''.
- Links internos da wiki: [[Nome do Artigo]] ou [[Nome do Artigo|Texto Visível]].
- Listas: * para marcadores não ordenados, # para listas numeradas.
- Caixas e destaques: use blocos limpos.
- Citações e referências: <ref>Fonte confiável</ref>.
- Seja cordial, objetivo e ofereça exemplos prontos para copiar e colar no editor.`;

    // DIRETRIZ CRÍTICA DE IDENTIDADE E AUTENTICAÇÃO DO USUÁRIO
    if (userId && !isGuest) {
      systemInstruction += `\n\n[SESSÃO AUTENTICADA - USUÁRIO LOGADO]:
- Identificador do Usuário (ID): "${userId}"
- Nome / Exibição: "${userDisplayName || 'Usuário WikiZero'}"
- E-mail: "${userEmail || 'não especificado'}"
- Papel / Função na WikiZero: "${userRole}"
- Status da Assinatura: ${isPremium ? '💎 GEMINI PREMIUM (Acesso Ilimitado a Chats, Visão Computacional e Gemini Notebook)' : 'PLANO GRATUITO (Sujeito a limites diários de uso)'}

INSTRUÇÃO DE CONDUTA PARA USUÁRIO LOGADO:
Ao fazer qualquer consulta ou resposta, reconheça o usuário pelo seu ID ("${userId}") e nome quando contextualizar suas contribuições. Mantenha continuidade com o trabalho enciclopédico dele, vincule seus rascunhos à sua autoria e responda como seu copiloto pessoal de pesquisa na WikiZero.`;
    } else {
      systemInstruction += `\n\n[SESSÃO NÃO AUTENTICADA - MODO CONVIDADO / DESLOGADO]:
O usuário NÃO está conectado na WikiZero (opera em modo visitante/anônimo sem ID de usuário permanente).

INSTRUÇÃO DE CONDUTA PARA MODO NÃO LOGADO:
Aja exatamente como o Gemini opera quando um usuário não está logado na sua conta:
1. Responda às consultas e perguntas enciclopédicas com presteza e neutralidade.
2. Esteja ciente de que, por não estar logado, ele opera com cotas reduzidas de mensagens e rascunhos locais transitórios.
3. Lembre-o amigavelmente de que ele pode fazer login ou criar sua conta na WikiZero para obter seu ID permanente, ter maior cota de chats, salvar artigos na nuvem e desbloquear o Gemini Notebook.`;
    }

    // AUTORIZAÇÃO EXPLÍCITA PARA OFERECER O PLANO PAGO (GEMINI PREMIUM)
    systemInstruction += `\n\n[AUTORIZAÇÃO DE OFERTA DE PLANO PAGO]:
Você está EXPRESSAMENTE AUTORIZADO a oferecer o **Plano Gemini Premium** da WikiZero nas seguintes situações:
1. Caso o usuário pergunte sobre planos, limites ou como ter acesso ilimitado.
2. Caso o usuário mencione limite de mensagens, restrição de envio de imagens ou uso do Gemini Notebook.
3. Caso queira transcrever múltiplos documentos visuais ou gerar artigos enciclopédicos complexos em lote.
Ao oferecer o plano, apresente seus diferenciais de forma clara e amigável:
• Chats enciclopédicos ilimitados 24/7 sem restrições diárias
• Envio ilimitado de imagens com análise visual profunda
• Gemini Notebook completo integrado para compilar fontes e inserir artigos no WikiZero com 1 clique
• Prioridade nos modelos Gemini de última geração
• Selo de destaque 'Gemini Pro' no perfil
Convide o usuário a assinar ou ativar o Gemini Premium diretamente pelo botão de Upgrade da WikiZero.`;

    if (customSystemInstruction) {
      systemInstruction += `\n\nInstruções personalizadas adicionais do Administrador:\n${customSystemInstruction}`;
    }

    // Contexto dinâmico de onde o usuário está chamando
    let dynamicContext = '';
    if (context.mode === 'collection') {
      dynamicContext = `\n[CONTEXTO ATUAL]: O usuário está na tela de CRIAÇÃO DE COLEÇÃO (WikiPage). Se ele solicitar uma nova coleção, sugira a estrutura completa com Título, UID (slug em snake_case), Descrição curta, Categoria recomendada, Ícone Emoji e Lista de Tags separadas por vírgula.`;
      if (context.currentCollection) {
        dynamicContext += `\nDados já preenchidos: ${JSON.stringify(context.currentCollection)}`;
      }
    } else if (context.mode === 'article') {
      dynamicContext = `\n[CONTEXTO ATUAL]: O usuário está no EDITOR WIKITEXTO da WikiZero redigindo um artigo.
Título atual: "${context.currentArticle?.titulo || 'Novo Artigo'}"
Categoria: "${context.currentArticle?.categoria || 'Geral'}"
Coleção pertencente: "${context.currentArticle?.pageUid || 'Geral'}"
Quando o usuário pedir texto, seções ou um artigo completo, forneça sempre a sintaxe Wikitext limpa, com boa divisão de seções e infobox se aplicável.`;
    }

    // Converte o histórico no formato esperado pelo Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    // Adiciona o histórico recente (limite de 8 mensagens para manter agilidade)
    const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'model') {
        const parts: any[] = [{ text: msg.content }];
        if (msg.imageUrl && msg.imageUrl.startsWith('data:')) {
          const mime = msg.imageMimeType || 'image/jpeg';
          const base64Data = msg.imageUrl.includes(';base64,') ? msg.imageUrl.split(';base64,')[1] : msg.imageUrl;
          parts.push({
            inlineData: {
              mimeType: mime,
              data: base64Data,
            },
          });
        }
        contents.push({
          role: msg.role,
          parts,
        });
      }
    }

    // Mensagem atual com o contexto e imagem multimodal opcional
    const currentParts: any[] = [{ text: message + (dynamicContext ? `\n\n${dynamicContext}` : '') }];

    if (image && image.data) {
      const mime = image.mimeType || 'image/jpeg';
      const base64Data = image.data.includes(';base64,') ? image.data.split(';base64,')[1] : image.data;
      currentParts.push({
        inlineData: {
          mimeType: mime,
          data: base64Data,
        },
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const { response, usedModel } = await generateWithFallback(
      ai,
      model || 'gemini-2.5-flash',
      {
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      }
    );

    const reply = response.text || 'Sem resposta gerada pelo assistente.';

    // Se o contexto for 'collection', tenta extrair sugestão estruturada caso haja
    let suggestedData: any = null;
    if (context.mode === 'collection' && (reply.includes('UID') || reply.includes('slug') || reply.includes('{'))) {
      const jsonMatch = reply.match(/\{[\s\S]*"titulo"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          suggestedData = JSON.parse(jsonMatch[0]);
        } catch {
          // parse falhou silenciosamente
        }
      }
    }

    // Detecta se a resposta oferece o plano pago
    const mentionsPremium = reply.toLowerCase().includes('gemini premium') || reply.toLowerCase().includes('plano pago');

    res.json({
      reply,
      chatbotId,
      model: usedModel || model,
      suggestedData,
      offerPremium: mentionsPremium,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/chat:', err);
    const isQuota = err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('429') || err?.status === 429;
    if (isQuota) {
      return res.json({
        reply: '⚠️ **Aviso de Cota Temporária da IA**: O limite de requisições por minuto/dia do plano gratuito do Google Gemini foi atingido para este projeto. Por favor, aguarde alguns instantes (cerca de 20 a 60 segundos) e envie sua mensagem novamente.',
        chatbotId: req.body?.chatbotId || '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
        model: 'gemini-cota-limit',
        suggestedData: null,
        offerPremium: true,
      });
    }
    res.status(500).json({
      error: err.message || 'Erro ao processar solicitação com o Chatbot Gemini.',
      details: err.toString(),
    });
  }
});

// 2.1 Rota especializada: Gemini Notebook - Síntese e Inserção de Artigos no Wiki
app.post('/api/gemini/notebook-synthesize', async (req: Request, res: Response) => {
  try {
    const {
      sources = [],
      action = 'full_article',
      customPrompt = '',
      targetArticleTitle = '',
      userId = null,
      userEmail = null,
      userDisplayName = null,
      isGuest = false,
      isPremium = false,
    } = req.body;

    const ai = getGemini();

    let sourcesText = '';
    if (Array.isArray(sources) && sources.length > 0) {
      sourcesText = sources
        .map((s: any, idx: number) => {
          return `--- FONTE [${idx + 1}]: "${s.title || 'Sem título'}" (Tipo: ${s.type || 'texto'}) ---\n${s.content || ''}\n`;
        })
        .join('\n\n');
    } else {
      sourcesText = 'Nenhuma fonte externa fornecida; utilize a base enciclopédica geral do Gemini com rigor de neutralidade e factualidade.';
    }

    let actionInstruction = '';
    if (action === 'full_article') {
      actionInstruction = `Gere um ARTIGO ENCICLOPÉDICO COMPLETO em Wikitext formatado para a WikiZero, com Introdução rica, Seções enciclopédicas (= Título =, == Seção ==, === Subseção ===), Infobox se couber, e referências com <ref>...</ref>.`;
    } else if (action === 'section') {
      actionInstruction = `Gere uma SEÇÃO APROFUNDADA em sintaxe Wikitext, pronta para ser inserida como nova seção no artigo "${targetArticleTitle || 'do artigo'}".`;
    } else if (action === 'infobox') {
      actionInstruction = `Extraia todos os dados quantitativos e factuais das fontes e gere uma TABELA / INFOBOX estruturada em sintaxe Wikitext ({| class="wikitable" ... |}).`;
    } else if (action === 'timeline') {
      actionInstruction = `Construa uma LINHA DO TEMPO / CRONOLOGIA histórica detalhada e verificável baseada nas fontes fornecidas, formatada com listas e datas precisas em Wikitext.`;
    } else if (action === 'fact_check') {
      actionInstruction = `Faça uma AUDITORIA FACTUAL E VERIFICAÇÃO DE FONTES, destacando dados confirmados, incongruências e grau de confiabilidade para a enciclopédia WikiZero.`;
    } else {
      actionInstruction = customPrompt || `Sintetize as informações das fontes em sintaxe Wikitext limpa e verificável para a enciclopédia WikiZero.`;
    }

    const systemInstruction = `Você é o motor de IA do GEMINI NOTEBOOK integrado à WikiZero (Google AI Studio).
Sua missão é atuar como pesquisador enciclopédico e assistente editorial sênior.
Você analisa múltiplas fontes de pesquisa (artigos WikiZero, transcrições, textos externos, dados de imagens), cruza as informações com rigor factual e gera conteúdo enciclopédico impecável em WIKITEXT.
${userId ? `[USUÁRIO REGISTRADO]: ${userDisplayName || 'Usuário'} (ID: ${userId})` : `[MODO VISITANTE / NÃO AUTENTICADO]`}
${isPremium ? `[PLANO GEMINI PREMIUM: SÍNTESE PROFUNDA SEM RESTRIÇÕES]` : `[PLANO GRATUITO]`}

DIRETRIZES DE WIKITEXT:
- Utilize cabeçalhos formais: == Seção ==, === Subseção ===
- Utilize links internos no padrão MediaWiki: [[Nome do Artigo]] ou [[Nome do Artigo|Texto]]
- Negrito com 3 apóstrofos ('''termo''') e itálico com 2 (''termo'')
- Listas com * ou #
- Infoboxes ou tabelas com {| class="wikitable" ... |}

Ao final da resposta, inclua um bloco delimitado estritamente com um resumo em português:
###RESUMO###
(Resumo de 2 a 3 frases explicando o que foi sintetizado e as fontes utilizadas)
###FIM_RESUMO###`;

    const prompt = `FONTES DE PESQUISA DO CADERNO:
${sourcesText}

INSTRUÇÃO EDITORIAL:
${actionInstruction}
${customPrompt ? `\nInstruções extras do usuário: "${customPrompt}"` : ''}
${targetArticleTitle ? `\nArtigo de destino na WikiZero: "${targetArticleTitle}"` : ''}`;

    const { response, usedModel } = await generateWithFallback(
      ai,
      'gemini-2.5-flash',
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      }
    );

    const fullOutput = response.text || '';
    let wikitext = fullOutput;
    let summary = '';

    const resumoMatch = fullOutput.match(/###RESUMO###([\s\S]*?)###FIM_RESUMO###/);
    if (resumoMatch) {
      summary = resumoMatch[1].trim();
      wikitext = fullOutput.replace(/###RESUMO###[\s\S]*?###FIM_RESUMO###/, '').trim();
    } else {
      summary = 'Síntese gerada com sucesso pelo Gemini Notebook a partir das fontes fornecidas.';
    }

    res.json({
      wikitext,
      summary,
      suggestedTitle: targetArticleTitle || 'Novo Artigo do Gemini Notebook',
      suggestedCategory: 'Geral',
      model: usedModel,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/notebook-synthesize:', err);
    res.status(500).json({
      error: err.message || 'Erro ao processar síntese no Gemini Notebook.',
      details: err.toString(),
    });
  }
});

// 3. Rota especializada: Gerador de Artigo Completo em Wikitext
app.post('/api/gemini/generate-article', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      category = 'Geral',
      keywords = '',
      language = 'Português',
      chatbotId = '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      userInstructions = '',
    } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'O tema do artigo é obrigatório.' });
    }

    const ai = getGemini();

    const prompt = `Você é o redator enciclopédico sênior da WikiZero e assistente de IA do Google AI Studio (Chatbot ID: "${chatbotId}").
Por favor, redija um artigo enciclopédico COMPLETO, neutro, detalhado e estruturado sobre o tema: "${topic}".

Parâmetros adicionais:
- Categoria: ${category}
- Idioma: ${language}
- Palavras-chave / Foco: ${keywords || 'Abrangente'}
${userInstructions ? `- Instruções extras: ${userInstructions}` : ''}

ESTRUTURA OBRIGATÓRIA EM SINTAXE WIKITEXT:
1. Título principal: = ${topic} =
2. Parágrafo introdutório de definição clara em negrito (ex: '''${topic}''' é...).
3. Seção: == Contexto e Origem == ou == História ==
4. Seção: == Características Principais == ou == Descrição Técnica ==
5. Seção com lista com marcadores (* item) detalhando aspectos essenciais.
6. Seção: == Impacto e Relevância Cultural / Científica ==
7. Seção: == Veja Também == com links no formato [[Artigo Relacionado]]
8. Seção: == Referências e Fontes Confiáveis ==

Responda APENAS com o texto em wikitext formatado, sem preâmbulos e sem blocos de código com crases triplas se não forem necessários, para ser inserido diretamente no editor.`;

    const { response, usedModel } = await generateWithFallback(
      ai,
      'gemini-2.5-flash',
      {
        contents: prompt,
        config: {
          temperature: 0.6,
        },
      },
      40000
    );

    const wikitext = response.text || '';

    res.json({
      title: topic,
      wikitext,
      category,
      chatbotId,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/generate-article:', err);
    res.status(500).json({
      error: err.message || 'Erro ao gerar artigo enciclopédico com Gemini.',
    });
  }
});

// 4. Rota especializada: Gerador Estruturado de Coleção de Páginas
app.post('/api/gemini/generate-collection', async (req: Request, res: Response) => {
  try {
    const {
      theme,
      chatbotId = '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      userInstructions = '',
    } = req.body;

    if (!theme || typeof theme !== 'string') {
      return res.status(400).json({ error: 'O tema da coleção é obrigatório.' });
    }

    const ai = getGemini();

    const prompt = `Você é o arquiteto de conhecimento da WikiZero configurado pelo Google AI Studio (Chatbot ID: "${chatbotId}").
O usuário quer criar uma nova COLEÇÃO TEMÁTICA (WikiPage) na WikiZero com base no tema: "${theme}".
${userInstructions ? `Instruções adicionais: ${userInstructions}` : ''}

Retorne um JSON válido e estrito com a seguinte estrutura:
{
  "titulo": "Nome elegante e formal da Coleção",
  "uid": "identificador_unico_em_snake_case_sem_acentos",
  "descricao": "Uma descrição sintética de 1 a 2 parágrafos explicando o escopo enciclopédico desta coleção de páginas.",
  "categoria": "Uma categoria geral apropriada (ex: Ciência, Tecnologia, História, Geografia, Jogos, Transporte, etc.)",
  "icon": "Um único emoji temático representativo (ex: 🚀, 📚, 🚇, 🎮, 🌿)",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Retorne APENAS o JSON puro, sem crases de markdown e sem texto antes ou depois.`;

    const { response, usedModel } = await generateWithFallback(
      ai,
      'gemini-2.5-flash',
      {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      }
    );

    const raw = response.text || '{}';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      // Fallback
      data = {
        titulo: theme,
        uid: theme.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        descricao: `Coleção enciclopédica sobre ${theme}.`,
        categoria: 'Geral',
        icon: '📄',
        tags: [theme.toLowerCase()],
      };
    }

    res.json({
      collection: data,
      chatbotId,
    });
  } catch (err: any) {
    console.error('Erro na rota /api/gemini/generate-collection:', err);
    res.status(500).json({
      error: err.message || 'Erro ao gerar coleção com Gemini.',
    });
  }
});

// =============================================================
// 5. Rota Antiplágio & Análise de TCC (4.1.1.8P.5 & 4.1.1.RW.5)
// Protegida por Token de ID Firebase, Limite de Taxa e Restrições de Tamanho
// =============================================================
app.post('/api/antiplagiarism/analyze', async (req: Request, res: Response) => {
  try {
    // 0. Autenticação Obrigatória via Firebase ID Token (verifyIdToken)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({
        error: 'Autenticação necessária. É obrigatório fornecer o token de ID do Firebase no cabeçalho Authorization para auditar trabalhos acadêmicos.',
      });
    }

    const authUser = await verifyFirebaseIdToken(token);
    if (!authUser || !authUser.uid) {
      return res.status(401).json({
        error: 'Token de autenticação do Firebase inválido ou expirado. Por favor, autentique-se novamente na WikiWorldWeb.',
      });
    }

    // 0.1 Limite de Requisições por Usuário (Rate Limiting: 10 requisições a cada 10 minutos)
    const rateCheck = checkAntiplagiarismRateLimit(authUser.uid);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Limite de requisições excedido. Você pode realizar no máximo 10 análises de TCC a cada 10 minutos. Tente novamente em ${rateCheck.retryAfter} segundos.`,
        retryAfter: rateCheck.retryAfter,
      });
    }

    // 0.2 Validação do Corpo da Requisição e Limite de Tamanho (Payload Limit: máx. 300.000 caracteres)
    const {
      text,
      title = 'Trabalho de Conclusão de Curso (TCC)',
      studentName = 'Estudante Não Informado',
      advisorName = 'Orientador Acadêmico',
      advisorEmail = '',
      advisorUid = '',
      course = 'Graduação / Pós-Graduação',
      options = {},
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'O texto do TCC para análise deve ser fornecido como string.' });
    }

    if (text.length > 300000) {
      return res.status(413).json({
        error: `Documento muito extenso (${text.length.toLocaleString('pt-BR')} caracteres). O limite máximo permitido para processamento é de 300.000 caracteres (aprox. 50.000 palavras).`,
      });
    }

    if (text.trim().length < 15) {
      return res.status(400).json({ error: 'O texto do TCC deve conter ao menos 15 caracteres para permitir uma análise minimamente significativa.' });
    }

    // 0.3 Configurações Ativas da Extensão plagiarism-checker (4.1.1.RW.5)
    const similarityAlertThreshold = typeof options.similarityAlertThreshold === 'number' ? options.similarityAlertThreshold : 15;
    const abntStrictMode = options.abntStrictMode !== false;
    const geminiDeepSemantic = options.geminiDeepSemantic !== false;

    // 1. Divisão estruturada do documento em parágrafos com ID explícito (Requisitos 3 e 4)
    const rawParagraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    if (rawParagraphs.length === 0) {
      return res.status(400).json({ error: 'O documento não contém parágrafos legíveis para análise.' });
    }

    const taggedParagraphs = rawParagraphs.map((pText, idx) => ({
      id: `p-${idx + 1}`,
      paragraphNumber: idx + 1,
      text: pText,
    }));

    // 2. Consulta a Fontes Reais Externas e Internas (MediaWiki/Wikipédia, Firestore, Crossref, OpenAlex)
    const sourceStatusList: SourceStatusReport[] = [];
    const allSourceDocuments: SourceQueryResult[] = [];

    // Extrai palavras-chave do título e do conteúdo para busca semântica
    const topicKeywords = title
      .split(/\s+/)
      .map((w: string) => w.replace(/[^\w]/g, ''))
      .filter((w: string) => w.length > 3)
      .slice(0, 5);
    const searchQuery = topicKeywords.length > 0 ? topicKeywords.join(' ') : title;

    // Helper interno para carregar artigos da própria Wiki no Firestore
    async function fetchFirestoreWikiArticles(keywords: string[]): Promise<{ sources: SourceQueryResult[]; error?: string; latencyMs: number }> {
      const start = Date.now();
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (!fs.existsSync(configPath)) {
          return { sources: [], error: 'Arquivo firebase-applet-config.json não localizado no servidor', latencyMs: 0 };
        }
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const { initializeApp, getApps } = await import('firebase/app');
        const { getAuth, signInAnonymously } = await import('firebase/auth');
        const { getFirestore, collection, getDocs, limit, query } = await import('firebase/firestore');

        const appName = 'wiki-similarity-internal';
        const app = getApps().find((a) => a.name === appName) || initializeApp(cfg, appName);
        const auth = getAuth(app);
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        const db = getFirestore(app, cfg.firestoreDatabaseId);

        const [pagesSnap, articlesSnap] = await Promise.all([
          getDocs(query(collection(db, 'pages'), limit(25))).catch(() => ({ forEach: () => {} })),
          getDocs(query(collection(db, 'articles'), limit(25))).catch(() => ({ forEach: () => {} })),
        ]);

        const results: SourceQueryResult[] = [];
        const seen = new Set<string>();

        (pagesSnap as any).forEach((doc: any) => {
          const data = doc.data();
          const pTitle = data.title || doc.id;
          const pContent = data.content || data.body || data.markdown || '';
          if (pContent && !seen.has(pTitle)) {
            seen.add(pTitle);
            results.push({
              sourceName: 'Acervo Local da Wiki (Firestore: pages)',
              sourceType: 'firestore',
              title: pTitle,
              content: `${pTitle}. ${pContent}`,
              url: `/wiki/${encodeURIComponent(pTitle.replace(/\s+/g, '_'))}`,
            });
          }
        });

        (articlesSnap as any).forEach((doc: any) => {
          const data = doc.data();
          const aTitle = data.title || data.name || doc.id;
          const aContent = data.content || data.text || '';
          if (aContent && !seen.has(aTitle)) {
            seen.add(aTitle);
            results.push({
              sourceName: 'Enciclopédia WikiWorldWeb (Firestore: articles)',
              sourceType: 'firestore',
              title: aTitle,
              content: `${aTitle}. ${aContent}`,
              url: `/artigo/${encodeURIComponent(aTitle.replace(/\s+/g, '_'))}`,
            });
          }
        });

        return { sources: results, latencyMs: Date.now() - start };
      } catch (err: any) {
        return { sources: [], error: err?.message || String(err), latencyMs: Date.now() - start };
      }
    }

    // Executa consultas concorrentes às fontes reais sem exigência de chaves
    const [wikiRes, firestoreRes, crossrefRes, openalexRes] = await Promise.all([
      fetchWikipediaPtSources(searchQuery, 4),
      fetchFirestoreWikiArticles(topicKeywords),
      fetchCrossrefSources(searchQuery, 4),
      fetchOpenAlexSources(searchQuery, 4),
    ]);

    // Registra o status de cada fonte no relatório
    sourceStatusList.push({
      source: 'wikipedia',
      displayName: 'Wikipédia Lusófona (MediaWiki API pt.wikipedia.org)',
      status: wikiRes.error ? 'failed' : wikiRes.sources.length > 0 ? 'success' : 'no_matches',
      itemsCount: wikiRes.sources.length,
      error: wikiRes.error,
      latencyMs: wikiRes.latencyMs,
    });
    allSourceDocuments.push(...wikiRes.sources);

    sourceStatusList.push({
      source: 'firestore',
      displayName: 'Artigos da Própria Wiki (Firestore Banco Real)',
      status: firestoreRes.error ? 'failed' : firestoreRes.sources.length > 0 ? 'success' : 'no_matches',
      itemsCount: firestoreRes.sources.length,
      error: firestoreRes.error,
      latencyMs: firestoreRes.latencyMs,
    });
    allSourceDocuments.push(...firestoreRes.sources);

    sourceStatusList.push({
      source: 'crossref',
      displayName: 'Crossref (DOIs, Títulos e Resumos Acadêmicos)',
      status: crossrefRes.error ? 'failed' : crossrefRes.sources.length > 0 ? 'success' : 'no_matches',
      itemsCount: crossrefRes.sources.length,
      error: crossrefRes.error,
      latencyMs: crossrefRes.latencyMs,
    });
    allSourceDocuments.push(...crossrefRes.sources);

    sourceStatusList.push({
      source: 'openalex',
      displayName: 'OpenAlex (Base Global de Artigos Científicos)',
      status: openalexRes.error ? 'failed' : openalexRes.sources.length > 0 ? 'success' : 'no_matches',
      itemsCount: openalexRes.sources.length,
      error: openalexRes.error,
      latencyMs: openalexRes.latencyMs,
    });
    allSourceDocuments.push(...openalexRes.sources);

    // 3. Extração de frases características de cada parágrafo para busca literal entre aspas
    const groundingStart = Date.now();
    let groundingError: string | undefined;
    let groundingMatchesCount = 0;
    const allCharacteristicPhrases: string[] = [];

    for (const p of taggedParagraphs) {
      const phrases = extractCharacteristicPhrases(p.text);
      for (const phrase of phrases) {
        if (phrase && phrase.length >= 18 && !allCharacteristicPhrases.includes(phrase)) {
          allCharacteristicPhrases.push(phrase);
        }
      }
    }

    // Busca entre aspas das frases características via Gemini Search Grounding
    if (allCharacteristicPhrases.length > 0) {
      try {
        const ai = getGemini();
        const sampledPhrases = allCharacteristicPhrases.slice(0, 5);
        const searchPrompt = `Pesquise na internet correspondências exatas para as seguintes frases acadêmicas entre aspas:\n${sampledPhrases.map((q) => `"${q}"`).join('\n')}\nRetorne o conteúdo e citações de artigos e repositórios encontrados.`;

        const { response } = await generateWithFallback(
          ai,
          'gemini-3.8-flash',
          {
            contents: searchPrompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          },
          30000
        );

        const groundingMeta = (response as any)?.candidates?.[0]?.groundingMetadata;
        if (groundingMeta && Array.isArray(groundingMeta.groundingChunks)) {
          for (const chunk of groundingMeta.groundingChunks) {
            if (chunk.web && chunk.web.uri) {
              const gTitle = chunk.web.title || 'Artigo / Repositório Web';
              const gSnippet = chunk.web.snippet || '';
              const gContent = `${gTitle}. ${gSnippet}`;
              allSourceDocuments.push({
                sourceName: 'Google Search Grounding (Frases entre aspas)',
                sourceType: 'web',
                title: gTitle,
                url: chunk.web.uri,
                content: gContent,
              });
              groundingMatchesCount++;
            }
          }
        }
      } catch (gErr: any) {
        groundingError = gErr?.message || String(gErr);
      }
    }

    sourceStatusList.push({
      source: 'google_grounding',
      displayName: 'Google Search Grounding (Frases Características entre Aspas)',
      status: groundingError ? 'failed' : groundingMatchesCount > 0 ? 'success' : 'no_matches',
      itemsCount: groundingMatchesCount,
      error: groundingError,
      latencyMs: Date.now() - groundingStart,
    });

    // 4. Preparação determinística dos documentos de fonte com Winnowing
    const preparedSources: PreparedSourceDocument[] = allSourceDocuments.map((src) =>
      prepareSourceDocument(src.title, src.content, src.url, src.sourceType, 5, 4)
    );

    // 5. Comparação determinística por parágrafo (k=5 shingles, containment, jaccard, trechos e isenção ABNT)
    const deterministicAnalyses: ParagraphSimilarityAnalysis[] = taggedParagraphs.map((p) =>
      analyzeParagraphDeterministically(p.id, p.paragraphNumber, p.text, preparedSources, 5, 4)
    );

    // 6. Score Geral Ponderado pelo número de palavras dos parágrafos (Requisito estrito)
    const { overallSimilarityScore, totalWords } = calculateWeightedOverallSimilarity(deterministicAnalyses);
    const originalityScore = Math.max(0, 100 - overallSimilarityScore);

    // 7. Uso do Gemini SOMENTE para explicar o achado e sugerir correção ABNT (quando geminiDeepSemantic for ativo na extensão)
    const explanationsMap = new Map<string, any>();
    if (geminiDeepSemantic) {
      try {
        const ai = getGemini();
        const explainPayload = deterministicAnalyses.map((d) => ({
          id: d.paragraphId,
          text: d.originalText,
          containmentPercent: d.containmentPercent,
          isLegitimateCitation: d.isLegitimateCitation,
          citationDetails: d.citationDetails,
          matchingExcerpts: d.matchingExcerpts.slice(0, 2).map((e) => ({
            matchedText: e.matchedText,
            sourceName: e.sourceName,
          })),
          matchedSources: d.matchedSources.slice(0, 2).map((s) => ({
            title: s.title,
            containmentPercent: s.containmentPercent,
          })),
        }));

        const explainPrompt = `Você é um avaliador de integridade acadêmica e especialista em normas ABNT (NBR 10520 e NBR 6023).
O motor determinístico de similaridade textual já calculou com exatidão matemática a contenção de shingles (k=5) para o TCC "${title}".
Sua função é gerar EXCLUSIVAMENTE explicações pedagógicas para o orientador e sugestões de correção ABNT para cada parágrafo.
Configurações ativas: abntStrictMode=${abntStrictMode}, similarityAlertThreshold=${similarityAlertThreshold}%.

REGRAS RÍGIDAS:
- NUNCA modifique ou invente porcentagens de similaridade.
- Se isLegitimateCitation for true, mantenha status "regular" (parágrafo é citação direta legítima entre aspas com autor, ano e página).
- Se containmentPercent >= ${similarityAlertThreshold} e isLegitimateCitation for false, aponte risco de atenção do orientador ou cópia literal.
- Para cada item com 'id', forneça:
  - "status": "regular" | "atencao_orientador" | "inconformidade_abnt" | "risco_plagio_critico"
  - "issueType": "sem_citacao" | "citacao_direta_sem_pagina" | "citacao_longa_sem_recuo" | "possivel_parafrase_nao_atribuida" | "copia_literal_suspeita" | "nenhum"
  - "description": explicação concisa do diagnóstico
  - "advisorNote": apontamento claro e construtivo para o orientador do TCC
  - "suggestedCorrection": sugestão de reescrita em estrita conformidade com a ABNT
  - "abntRule": norma ABNT aplicável (ex: NBR 10520 item 5.1 ou 5.3, NBR 6023)

Parágrafos auditados:
${JSON.stringify(explainPayload, null, 2)}

Retorne APENAS um JSON no seguinte formato:
{
  "explanations": [
    {
      "id": "p-1",
      "status": "regular | atencao_orientador | inconformidade_abnt | risco_plagio_critico",
      "issueType": "...",
      "description": "...",
      "advisorNote": "...",
      "suggestedCorrection": "...",
      "abntRule": "..."
    }
  ]
}`;

        const { response } = await generateWithFallback(
          ai,
          'gemini-3.8-flash',
          {
            contents: explainPrompt,
            config: {
              systemInstruction: 'Você gera apenas pareceres pedagógicos e correções ABNT sem alterar métricas calculadas.',
              responseMimeType: 'application/json',
            },
          },
          35000
        );

        const parsed = JSON.parse(response.text || '{}');
        if (Array.isArray(parsed?.explanations)) {
          for (const exp of parsed.explanations) {
            if (exp && exp.id) {
              explanationsMap.set(String(exp.id).trim(), exp);
            }
          }
        }
      } catch (explainErr: any) {
        console.warn('[Antiplagiarism API] Gemini indisponível para parecer explicativo, adotando heurísticas determinísticas ABNT:', explainErr?.message);
      }
    } else {
      console.log('[Antiplagiarism API] geminiDeepSemantic desativado nas opções da extensão. Etapa Gemini dispensada.');
    }

    // 8. Mescla dos dados determinísticos calculados com as explicações pedagógicas ABNT
    let advisorAttentionCount = 0;
    let abntIssuesCount = 0;
    let criticalCount = 0;

    const criticalThreshold = Math.max(30, similarityAlertThreshold * 1.8);
    const warningThreshold = similarityAlertThreshold;

    const finalParagraphs = deterministicAnalyses.map((d) => {
      const exp = explanationsMap.get(d.paragraphId);
      const hasQuotes = /["“][^"”]{5,}["”]/.test(d.originalText);
      const hasPage = /p\.\s*\d+|pp\.\s*\d+-\d+/i.test(d.originalText);

      let status = exp?.status;
      let issueType = exp?.issueType;
      let description = exp?.description;
      let advisorNote = exp?.advisorNote;
      let suggestedCorrection = exp?.suggestedCorrection;
      let abntRule = exp?.abntRule;

      if (d.isLegitimateCitation) {
        status = 'regular';
        issueType = 'nenhum';
        description = `Citação textual direta devidamente atribuída (${d.citationDetails?.author}, ${d.citationDetails?.year}, p. ${d.citationDetails?.page}). Isenta de plágio segundo a ABNT NBR 10520.`;
        advisorNote = 'Citação regular conforme as normas ABNT NBR 10520 (autoria, data e página indicadas).';
        suggestedCorrection = d.originalText;
        abntRule = 'ABNT NBR 10520 - Citações diretas com autoria, ano e página';
      } else if (!status || !geminiDeepSemantic) {
        if (d.containmentPercent >= criticalThreshold) {
          status = 'risco_plagio_critico';
          issueType = 'copia_literal_suspeita';
          description = `Elevada contenção textual (${d.containmentPercent}% >= limite ${criticalThreshold}%) detectada em fontes consultadas sem citação formal entre aspas.`;
          advisorNote = 'Exigir do estudante a inclusão de aspas e indicação da publicação de origem com página.';
          suggestedCorrection = `"${d.originalText}" (AUTOR, ano, p. xx).`;
          abntRule = 'ABNT NBR 10520 - Item 5.1 / Código de Ética Acadêmica';
        } else if (abntStrictMode && hasQuotes && !hasPage) {
          status = 'inconformidade_abnt';
          issueType = 'citacao_direta_sem_pagina';
          description = 'Citação textual direta sem indicação da página de origem (NBR 10520 item 5.1 - Modo ABNT Estrito).';
          advisorNote = 'Solicitar ao aluno a página exata da publicação consultada para a citação literal.';
          suggestedCorrection = d.originalText.replace(/(\((?:[A-ZÀ-Ú\s]+),\s*(?:19|20)\d{2})(\))/g, '$1, p. xx$2');
          abntRule = 'ABNT NBR 10520 - Item 5.1 (Obrigatoriedade de indicação da página em citações diretas)';
        } else if (d.containmentPercent >= warningThreshold) {
          status = 'atencao_orientador';
          issueType = 'possivel_parafrase_nao_atribuida';
          description = `Contenção (${d.containmentPercent}%) atinge o limite de alerta configurado (${warningThreshold}%).`;
          advisorNote = 'Verificar se o estudante realizou paráfrase de fonte externa sem atribuir autoria.';
          suggestedCorrection = `${d.originalText} (AUTOR, ano).`;
          abntRule = 'ABNT NBR 10520 - Item 5.2 (Citações indiretas no texto acadêmico)';
        } else {
          status = 'regular';
          issueType = 'nenhum';
          description = 'Parágrafo com redação autoral e conformidade textual.';
          advisorNote = 'Redação satisfatória para leitura do orientador.';
          suggestedCorrection = d.originalText;
          abntRule = 'ABNT NBR 10520 / NBR 6023';
        }
      }

      if (status === 'atencao_orientador') advisorAttentionCount++;
      if (status === 'inconformidade_abnt') abntIssuesCount++;
      if (status === 'risco_plagio_critico') criticalCount++;

      return {
        id: d.paragraphId,
        paragraphNumber: d.paragraphNumber,
        excerpt: d.originalText,
        wordCount: d.wordCount,
        status: status || 'regular',
        issueType: issueType || 'nenhum',
        description: description || 'Redação acadêmica auditada.',
        advisorNote: advisorNote || 'Sem pendências para o orientador.',
        suggestedCorrection: suggestedCorrection || d.originalText,
        abntRule: abntRule || 'ABNT NBR 10520 / NBR 6023',
        similarityPercentage: d.containmentPercent,
        containmentPercent: d.containmentPercent,
        jaccardPercent: d.jaccardPercent,
        isLegitimateCitation: d.isLegitimateCitation,
        citationDetails: d.citationDetails,
        matchingExcerpts: d.matchingExcerpts,
        characteristicPhrases: d.characteristicPhrases,
        matchedSourceHint: d.matchedSources.length > 0 ? d.matchedSources[0].title : undefined,
        matchedSources: d.matchedSources.map((ms) => ({
          title: ms.title,
          url: ms.url || '',
          similarityPercent: ms.containmentPercent,
          similarity: ms.containmentPercent,
          domain: ms.url ? (() => { try { return new URL(ms.url).hostname; } catch { return ms.title; } })() : ms.title,
          sourceType: ms.sourceType,
        })),
      };
    });

    let riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico' = 'baixo';
    if (criticalCount > 0 || overallSimilarityScore >= Math.max(30, similarityAlertThreshold * 1.8)) {
      riskLevel = 'critico';
    } else if (abntIssuesCount > 3 || overallSimilarityScore >= similarityAlertThreshold) {
      riskLevel = 'alto';
    } else if (advisorAttentionCount > 2 || overallSimilarityScore >= Math.max(5, similarityAlertThreshold * 0.5)) {
      riskLevel = 'moderado';
    }

    const groundingSourcesUnified = allSourceDocuments
      .filter((s) => s.url)
      .map((s) => ({
        title: s.title,
        url: s.url!,
        snippet: s.content.slice(0, 180),
        similarityPercent: undefined,
        similarity: undefined,
        domain: (() => { try { return new URL(s.url!).hostname; } catch { return s.sourceName; } })(),
        sourceType: s.sourceType,
      }));

    const fullReport = {
      id: `report-deterministic-${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      tccTitle: title,
      studentName,
      advisorName,
      advisorEmail: advisorEmail || undefined,
      advisorUid: advisorUid || undefined,
      course,
      userUid: authUser.uid,
      userEmail: authUser.email,
      totalWords,
      totalParagraphs: finalParagraphs.length,
      overallSimilarityScore,
      weightedSimilarityScore: overallSimilarityScore,
      originalityScore,
      riskLevel,
      advisorAttentionCount,
      abntIssuesCount,
      paragraphs: finalParagraphs,
      executiveSummary: `Auditoria determinística de integridade acadêmica concluída (${finalParagraphs.length} parágrafos, ${totalWords} palavras). Contenção global ponderada calculada por shingles (k=5): ${overallSimilarityScore}%, índice de originalidade autoral de ${originalityScore}%. Identificados ${advisorAttentionCount} apontamentos para o orientador e ${abntIssuesCount} inconformidades nas normas ABNT. Fontes consultadas: Wikipédia Lusófona, Firestore Wiki, Crossref, OpenAlex e busca de frases características via Google Search Grounding.`,
      generalRecommendations: [
        'Conferir paginação em todas as citações textuais diretas curtas (ABNT NBR 10520 item 5.1).',
        'Formatar citações diretas longas (> 3 linhas) em parágrafo destacado com recuo de 4 cm e fonte reduzida.',
        'Verificar se as fontes dos parágrafos com contenção textual foram devidamente referenciadas na lista bibliográfica final (NBR 6023).',
        'Citações entre aspas com indicação de autor, ano e página foram reconhecidas e isentas de acusação de plágio.',
      ],
      usedEngine: 'deterministic_shingles_sources' as const,
      engineLabel: geminiDeepSemantic
        ? 'Motor Determinístico de Shingles (k=5) + Fontes Reais + Parecer Gemini'
        : 'Motor Determinístico de Shingles (k=5) + Fontes Reais (Semântica Gemini Desativada)',
      isFallback: false,
      webGroundingSourcesCount: groundingSourcesUnified.length,
      groundingWebSources: groundingSourcesUnified,
      queriedSourcesStatus: sourceStatusList,
      optionsUsed: {
        similarityAlertThreshold,
        abntStrictMode,
        geminiDeepSemantic,
      },
    };

    return res.json({ report: fullReport });
  } catch (err: any) {
    console.error('Erro na rota /api/antiplagiarism/analyze:', err);
    res.status(500).json({ error: err.message || 'Falha ao analisar TCC.' });
  }
});

// -------------------------------------------------------------
// Servidor Vite / Estático
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });

    // Provide clean Vite client without websocket errors in container sandbox
    app.get('/@vite/client', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(`
import "/node_modules/vite/dist/client/env.mjs";

const sheetsMap = new Map();
let lastInsertedStyle;
const cspNonce = typeof document !== 'undefined' ? document.querySelector('meta[property=csp-nonce]')?.nonce : undefined;

export function updateStyle(id, content) {
  if (typeof document === 'undefined') return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (cspNonce) {
      style.setAttribute('nonce', cspNonce);
    }
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => {
        lastInsertedStyle = void 0;
      }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id) {
  if (typeof document === 'undefined') return;
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}

class FakeHMRContext {
  constructor(ownerPath) {
    this.ownerPath = ownerPath;
    this.data = {};
  }
  accept() {}
  acceptDeps() {}
  acceptExports() {}
  dispose() {}
  prune() {}
  decline() {}
  invalidate() {}
  on() {}
  off() {}
  send() {}
}

export function createHotContext(ownerPath) {
  return new FakeHMRContext(ownerPath);
}

export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') {
    return url;
  }
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}

export class ErrorOverlay extends (typeof HTMLElement !== 'undefined' ? HTMLElement : Object) {}
if (typeof customElements !== 'undefined' && !customElements.get('vite-error-overlay')) {
  customElements.define('vite-error-overlay', ErrorOverlay);
}
      `);
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WikiZero] Servidor rodando em http://0.0.0.0:${PORT} com suporte a Gemini API e AI Studio`);
  });
}

startServer();
