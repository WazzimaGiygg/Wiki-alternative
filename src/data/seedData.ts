import {
  WikiArticle,
  WikiPage,
  NotificationItem,
  UserProfile,
  UserTalkMessage,
  UserAuditLog,
  SystemUpdateEntry,
  SockpuppetCase,
  CheckUserLogEntry,
  CheckUserAccountDetails,
  UnblockRequest,
  PromotionRequest,
  AdminContactTicket,
  ArbitrationCase,
  ArbitrationCommitteeMember,
} from '../types';

/**
 * ============================================================================
 * WIKIZERO - DADOS BASE LIMPOS (SEM DADOS MOCK / APENAS BANCO DE DADOS FIREBASE)
 * ============================================================================
 * Todas as informações pré-definidas de exemplo criadas pelo AI Studio foram
 * removidas para garantir que 100% dos dados exibidos e consultados venham
 * exclusivamente do banco de dados Firebase Firestore em tempo real.
 */

export const INITIAL_COMMUNITY_USERS: UserProfile[] = [];
export const INITIAL_USER_TALK_MESSAGES: UserTalkMessage[] = [];
export const INITIAL_USER_AUDIT_LOGS: UserAuditLog[] = [];
export const INITIAL_CHECKUSER_LOGS: CheckUserLogEntry[] = [];
export const INITIAL_SOCKPUPPET_CASES: SockpuppetCase[] = [];
export const MOCK_CHECKUSER_ACCOUNTS: Record<string, CheckUserAccountDetails> = {};
export const INITIAL_PAGES: WikiPage[] = [];
export const INITIAL_ARTICLES: WikiArticle[] = [];
export const INITIAL_SYSTEM_UPDATES: SystemUpdateEntry[] = [
  {
    id: 'upd-4-1-1-d6-6',
    version: '4.1.1.D6.6',
    title: 'Verificação se Computador está Online, em Tempo Real',
    date: new Date().toISOString().split('T')[0],
    category: 'feature',
    author: 'Equipe de Infraestrutura WikiWorldWeb',
    authorRole: 'Engenheiro de Rede & Conectividade',
    summary: 'Monitoramento ativo em tempo real da conectividade do computador do usuário, combinando navigator.onLine do SO, probes contínuos via /api/ping com telemetria RTT precisa em milissegundos e diagnóstico detalhado do sinal.',
    highlights: [
      'Probing ativo e bidirecional na rota /api/ping com cabeçalhos anti-cache rígidos.',
      'Detecção em tempo real de queda de conexão, reconexão automática e telemetria de latência RTT em milissegundos.',
      'Classificação visual imediata da qualidade da conexão: Excelente (<120ms), Boa (120-280ms), Regular (280-500ms), Ruim (>500ms) ou Offline.',
      'Pílula de conectividade no cabeçalho com indicador dinâmico e modal de diagnóstico detalhado com métricas do adaptador (NetworkInformation API).',
      'Banner e avisos de reconexão automática com preservação contínua de rascunhos e cache offline da Wiki.',
      'Extensão OnlineStatusVerifierExtension registrada no ExtensionManager com configurações de intervalo de heartbeat e limites de alerta.'
    ],
    badge: 'Conectividade',
    affectedComponents: ['networkStatusService', 'useNetworkStatus', 'Header', 'server.ts', 'ExtensionManager', 'OfflineIndicator'],
    commitHash: 'd660e18',
    isLatest: true,
  },
  {
    id: 'upd-4-1-0',
    version: 'V4.1',
    title: 'WikiWorldWeb V4.1 - Módulo Antiplágio TCC e Segurança Acadêmica',
    date: '2026-11-05',
    category: 'feature',
    author: 'WazzimaGiygg',
    authorRole: 'Burocrata & Fundador',
    summary: 'Atualização maior V4.1 introduzindo o novo Verificador de Plágio determinístico para TCCs com shingling de 5 palavras, containment, busca em fontes reais (Crossref, OpenAlex, Wikipedia) e conformidade com normas ABNT.',
    highlights: [
      'Motor determinístico de similaridade com containment e shingling real (sem porcentagens aleatórias).',
      'Consultas a bases científicas reais: Crossref, OpenAlex e artigos da Wikipédia.',
      'Suporte a extração de PDFs via PDF.js, DOCX via Mammoth.js e OCR cliente via Tesseract.js.',
      'Proteção por regras de acesso e histórico de relatórios salvos no Firestore.'
    ],
    badge: 'Major Release',
    affectedComponents: ['similarityEngine', 'AntiplagiarismTccView', 'server.ts', 'ExtensionManager'],
    commitHash: 'v410rel',
    isLatest: false,
  }
];
export const INITIAL_UNBLOCK_REQUESTS: UnblockRequest[] = [];
export const INITIAL_PROMOTION_REQUESTS: PromotionRequest[] = [];
export const INITIAL_ADMIN_TICKETS: AdminContactTicket[] = [];
export const INITIAL_ARBITRATION_MEMBERS: ArbitrationCommitteeMember[] = [];
export const INITIAL_ARBITRATION_CASES: ArbitrationCase[] = [];
