export type CompatibilityIssueKind = 'browser' | 'version' | 'feature' | 'css' | 'storage';

export type CompatibilitySeverity = 'critical' | 'warning';

export interface CompatibilityIssue {
  id: string;
  title: string;
  description: string;
  kind: CompatibilityIssueKind;
  severity: CompatibilitySeverity;
}

export interface DetectedBrowserInfo {
  name: string;
  version: string | null;
  majorVersion: number | null;
  engine: string;
  isMobile: boolean;
  userAgent: string;
}

export interface BrowserCompatibilityReport {
  isCompatible: boolean;
  browser: DetectedBrowserInfo;
  issues: CompatibilityIssue[];
  criticalCount: number;
  warningCount: number;
  isSimulated: boolean;
  checkedAt: string;
}

export interface BrowserFeatureMatrix {
  promise: boolean;
  promiseAllSettled: boolean;
  mapAndSet: boolean;
  symbol: boolean;
  fetch: boolean;
  abortController: boolean;
  urlApi: boolean;
  textEncoder: boolean;
  intlDateTime: boolean;
  resizeObserver: boolean;
  intersectionObserver: boolean;
  mutationObserver: boolean;
  cssSupports: boolean;
  cssCustomProperties: boolean;
  cssGrid: boolean;
  cssFlexGap: boolean;
  cssWhereSelector: boolean;
  localStorageAvailable: boolean;
}

export interface BrowserEnvironmentInput {
  userAgent?: string;
  search?: string;
  features?: Partial<BrowserFeatureMatrix>;
}

export const FORCE_ENTRY_STORAGE_KEY = 'wikizero_force_browser_entry_v1';

// Fallback em memória caso localStorage e sessionStorage estejam bloqueados pelo navegador
let inMemoryForcedEntry = false;

function extractVersion(ua: string, regex: RegExp): { full: string | null; major: number | null } {
  const match = ua.match(regex);
  if (!match || !match[1]) {
    return { full: null, major: null };
  }
  const full = match[1];
  const majorNum = parseInt(full.split('.')[0], 10);
  return {
    full,
    major: Number.isFinite(majorNum) ? majorNum : null,
  };
}

/**
 * Identifica o navegador, versão e motor de renderização a partir do User-Agent.
 */
export function parseBrowserFromUserAgent(rawUa: string): DetectedBrowserInfo {
  const ua = (rawUa || '').trim();
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|kaios/i.test(ua);

  // 1. Internet Explorer (6 a 11)
  if (/MSIE\s+\d+|Trident\/\d+/i.test(ua)) {
    const msie = extractVersion(ua, /MSIE\s+(\d+(?:\.\d+)?)/i);
    const tridentRv = extractVersion(ua, /rv:(\d+(?:\.\d+)?)/i);
    const ver = msie.full ? msie : tridentRv;
    return {
      name: 'Internet Explorer',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Trident',
      isMobile,
      userAgent: ua,
    };
  }

  // 2. Microsoft Edge Legado (EdgeHTML, anterior ao Edge Chromium)
  if (/Edge\/\d+/i.test(ua) && !/Edg(?:A|iOS)?\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /Edge\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Microsoft Edge Legado (EdgeHTML)',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'EdgeHTML',
      isMobile,
      userAgent: ua,
    };
  }

  // 3. Opera Mini / Presto
  if (/Opera Mini/i.test(ua) || /Presto\//i.test(ua)) {
    const ver = extractVersion(ua, /(?:Opera Mini|Version|Opera)\/(\d+(?:\.\d+)?)/i);
    return {
      name: /Opera Mini/i.test(ua) ? 'Opera Mini' : 'Opera (Presto)',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Presto',
      isMobile,
      userAgent: ua,
    };
  }

  // 4. Navegadores de texto, embutidos antigos ou legados específicos
  if (/IEMobile|Windows Phone/i.test(ua)) {
    const ver = extractVersion(ua, /IEMobile\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Internet Explorer Mobile',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Trident Mobile',
      isMobile: true,
      userAgent: ua,
    };
  }

  if (/BlackBerry|BB10/i.test(ua)) {
    const ver = extractVersion(ua, /Version\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'BlackBerry Browser',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'WebKit Legado',
      isMobile: true,
      userAgent: ua,
    };
  }

  if (/Symbian|NokiaBrowser/i.test(ua)) {
    const ver = extractVersion(ua, /NokiaBrowser\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Nokia / Symbian Browser',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'WebKit Legado',
      isMobile: true,
      userAgent: ua,
    };
  }

  if (/PaleMoon\//i.test(ua) || /Goanna\//i.test(ua)) {
    const ver = extractVersion(ua, /PaleMoon\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Pale Moon',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Goanna',
      isMobile,
      userAgent: ua,
    };
  }

  if (/PhantomJS\//i.test(ua)) {
    const ver = extractVersion(ua, /PhantomJS\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'PhantomJS',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'WebKit Legado',
      isMobile: false,
      userAgent: ua,
    };
  }

  if (/(?:Lynx|Links|w3m)\//i.test(ua) || /^Links\s/i.test(ua)) {
    return {
      name: 'Navegador em Modo Texto',
      version: null,
      majorVersion: null,
      engine: 'Terminal',
      isMobile: false,
      userAgent: ua,
    };
  }

  if (/KAIOS\//i.test(ua)) {
    const ver = extractVersion(ua, /KAIOS\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'KaiOS Browser',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Gecko Legado',
      isMobile: true,
      userAgent: ua,
    };
  }

  // 5. Microsoft Edge (Chromium)
  if (/Edg(?:A|iOS)?\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /Edg(?:A|iOS)?\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Microsoft Edge',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Blink',
      isMobile,
      userAgent: ua,
    };
  }

  // 6. Samsung Internet
  if (/SamsungBrowser\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /SamsungBrowser\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Samsung Internet',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Blink',
      isMobile: true,
      userAgent: ua,
    };
  }

  // 7. Opera (Chromium)
  if (/OPR\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /OPR\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Opera',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Blink',
      isMobile,
      userAgent: ua,
    };
  }

  // 8. UC Browser
  if (/UCBrowser\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /UCBrowser\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'UC Browser',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'U3 / Blink',
      isMobile: true,
      userAgent: ua,
    };
  }

  // 9. Vivaldi
  if (/Vivaldi\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /Vivaldi\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Vivaldi',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'Blink',
      isMobile,
      userAgent: ua,
    };
  }

  // 10. Mozilla Firefox
  if (/Firefox\/\d+/i.test(ua) || /FxiOS\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /(?:Firefox|FxiOS)\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Mozilla Firefox',
      version: ver.full,
      majorVersion: ver.major,
      engine: /FxiOS/i.test(ua) ? 'WebKit' : 'Gecko',
      isMobile,
      userAgent: ua,
    };
  }

  // 11. Android Stock Browser legado (Android + AppleWebKit sem Chrome/Chromium)
  if (/Android/i.test(ua) && /AppleWebKit/i.test(ua) && !/Chrome\/\d+|CriOS\/\d+|Edg/i.test(ua)) {
    const ver = extractVersion(ua, /Version\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Android Browser Legado',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'WebKit Legado',
      isMobile: true,
      userAgent: ua,
    };
  }

  // 12. Google Chrome / Chromium
  if (/Chrome\/\d+|CriOS\/\d+/i.test(ua)) {
    const ver = extractVersion(ua, /(?:Chrome|CriOS)\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Google Chrome',
      version: ver.full,
      majorVersion: ver.major,
      engine: /CriOS/i.test(ua) ? 'WebKit' : 'Blink',
      isMobile,
      userAgent: ua,
    };
  }

  // 13. Apple Safari
  if (/Safari\/\d+/i.test(ua) && !/Chrome|CriOS|Chromium/i.test(ua)) {
    const ver = extractVersion(ua, /Version\/(\d+(?:\.\d+)?)/i);
    return {
      name: 'Apple Safari',
      version: ver.full,
      majorVersion: ver.major,
      engine: 'WebKit',
      isMobile,
      userAgent: ua,
    };
  }

  return {
    name: 'Navegador Desconhecido',
    version: null,
    majorVersion: null,
    engine: 'Desconhecido',
    isMobile,
    userAgent: ua,
  };
}

function parseVersionFloat(version: string | null): number | null {
  if (!version) return null;
  const parts = version.split('.');
  const major = parseInt(parts[0], 10);
  const minor = parts[1] ? parseInt(parts[1], 10) : 0;
  if (!Number.isFinite(major)) return null;
  return major + (Number.isFinite(minor) ? minor / 100 : 0);
}

/**
 * Coleta os recursos reais disponíveis no ambiente de execução do navegador.
 */
export function collectRuntimeFeatures(): BrowserFeatureMatrix {
  if (typeof window === 'undefined') {
    return {
      promise: true,
      promiseAllSettled: true,
      mapAndSet: true,
      symbol: true,
      fetch: true,
      abortController: true,
      urlApi: true,
      textEncoder: true,
      intlDateTime: true,
      resizeObserver: true,
      intersectionObserver: true,
      mutationObserver: true,
      cssSupports: true,
      cssCustomProperties: true,
      cssGrid: true,
      cssFlexGap: true,
      cssWhereSelector: true,
      localStorageAvailable: true,
    };
  }

  const hasCssSupports =
    typeof window.CSS !== 'undefined' && typeof window.CSS.supports === 'function';

  const safeCssSupports = (prop: string, val?: string): boolean => {
    if (!hasCssSupports) return false;
    try {
      return val !== undefined ? window.CSS.supports(prop, val) : window.CSS.supports(prop);
    } catch {
      return false;
    }
  };

  let localStorageAvailable = false;
  try {
    if (typeof window.localStorage !== 'undefined') {
      const probeKey = '__wikizero_compat_probe__';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      localStorageAvailable = true;
    }
  } catch {
    localStorageAvailable = false;
  }

  return {
    promise: typeof Promise === 'function',
    promiseAllSettled: typeof Promise !== 'undefined' && typeof Promise.allSettled === 'function',
    mapAndSet: typeof Map === 'function' && typeof Set === 'function',
    symbol: typeof Symbol === 'function',
    fetch: typeof window.fetch === 'function',
    abortController: typeof window.AbortController === 'function',
    urlApi: typeof window.URL === 'function' && typeof window.URLSearchParams === 'function',
    textEncoder: typeof window.TextEncoder === 'function',
    intlDateTime:
      typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function',
    resizeObserver: typeof window.ResizeObserver === 'function',
    intersectionObserver: typeof window.IntersectionObserver === 'function',
    mutationObserver: typeof window.MutationObserver === 'function',
    cssSupports: hasCssSupports,
    cssCustomProperties: safeCssSupports('--wikizero-test', '0'),
    cssGrid: safeCssSupports('display', 'grid'),
    cssFlexGap: safeCssSupports('display', 'flex') && safeCssSupports('gap', '1px'),
    cssWhereSelector: safeCssSupports('selector(:where(a))'),
    localStorageAvailable,
  };
}

const LEGACY_BLOCKED_ENGINES = new Set([
  'Trident',
  'Trident Mobile',
  'EdgeHTML',
  'Presto',
  'Goanna',
  'WebKit Legado',
  'Gecko Legado',
  'Terminal',
]);

/**
 * Avalia se o navegador e o ambiente atendem aos requisitos mínimos do Wiki-site.
 */
export function evaluateBrowserCompatibility(
  env?: BrowserEnvironmentInput
): BrowserCompatibilityReport {
  const ua =
    env?.userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');

  const search =
    env?.search ??
    (typeof window !== 'undefined' ? window.location.search || '' : '');

  const browser = parseBrowserFromUserAgent(ua);
  const runtimeFeatures = collectRuntimeFeatures();
  const features: BrowserFeatureMatrix = {
    ...runtimeFeatures,
    ...(env?.features || {}),
  };

  const issues: CompatibilityIssue[] = [];

  // Modo explícito de simulação via query string (?compatTest=incompatible ou ?simulateIncompatibleBrowser=1)
  let isSimulated = false;
  if (search) {
    try {
      const params = new URLSearchParams(search);
      if (
        params.get('compatTest') === 'incompatible' ||
        params.get('simulateIncompatibleBrowser') === '1'
      ) {
        isSimulated = true;
        issues.push({
          id: 'simulated-incompatibility',
          title: 'Modo de teste de incompatibilidade ativo',
          description:
            'A verificação foi acionada manualmente pelo parâmetro de teste na URL para validar o bloqueio e a opção de forçar entrada.',
          kind: 'browser',
          severity: 'critical',
        });
      }
    } catch {
      // Ignora erro de URLSearchParams em ambientes restritos
    }
  }

  // 1. Verificação de motores e navegadores legados conhecidos
  if (LEGACY_BLOCKED_ENGINES.has(browser.engine)) {
    issues.push({
      id: 'legacy-browser-engine',
      title: `Navegador ou motor legado detectado (${browser.name})`,
      description:
        `O motor ${browser.engine} não recebe mais suporte de padrões modernos (ES2022, React 19 e CSS moderno), o que impede o funcionamento seguro da enciclopédia.`,
      kind: 'browser',
      severity: 'critical',
    });
  }

  // 2. Verificação de versões mínimas em navegadores modernos
  const major = browser.majorVersion;
  if (major !== null) {
    if (
      (browser.name === 'Google Chrome' ||
        browser.name === 'Microsoft Edge' ||
        browser.name === 'Vivaldi') &&
      major < 90
    ) {
      issues.push({
        id: 'outdated-chromium-version',
        title: `${browser.name} versão ${browser.version} desatualizada`,
        description:
          'O Wiki-site requer Chromium 90 ou superior para renderizar seletores CSS modernos, o editor wikitexto e ferramentas interativas.',
        kind: 'version',
        severity: 'critical',
      });
    } else if (browser.name === 'Mozilla Firefox' && major < 90) {
      issues.push({
        id: 'outdated-firefox-version',
        title: `Mozilla Firefox versão ${browser.version} desatualizada`,
        description:
          'É necessário Firefox 90 ou superior para garantir compatibilidade com as camadas CSS e APIs JavaScript do site.',
        kind: 'version',
        severity: 'critical',
      });
    } else if (browser.name === 'Opera' && major < 76) {
      issues.push({
        id: 'outdated-opera-version',
        title: `Opera versão ${browser.version} desatualizada`,
        description:
          'É necessário Opera 76 ou superior para suporte completo aos recursos da enciclopédia.',
        kind: 'version',
        severity: 'critical',
      });
    } else if (browser.name === 'Samsung Internet' && major < 15) {
      issues.push({
        id: 'outdated-samsung-version',
        title: `Samsung Internet versão ${browser.version} desatualizada`,
        description:
          'É necessário Samsung Internet 15 ou superior para o carregamento correto da interface.',
        kind: 'version',
        severity: 'critical',
      });
    } else if (browser.name === 'UC Browser' && major < 13) {
      issues.push({
        id: 'outdated-uc-version',
        title: `UC Browser versão ${browser.version} desatualizada`,
        description:
          'Versões antigas do UC Browser comprimem ou bloqueiam scripts essenciais da aplicação.',
        kind: 'version',
        severity: 'critical',
      });
    } else if (browser.name === 'Apple Safari') {
      const floatVer = parseVersionFloat(browser.version);
      if (floatVer !== null && floatVer < 14.01) {
        issues.push({
          id: 'outdated-safari-version',
          title: `Apple Safari versão ${browser.version} desatualizada`,
          description:
            'É necessário Safari 14.1 ou superior para suporte a Flexbox Gap, seletores :where() e APIs modernas.',
          kind: 'version',
          severity: 'critical',
        });
      }
    }
  }

  // 3. Verificação real de APIs da Plataforma Web (Feature Detection)
  const missingJsApis: string[] = [];
  if (!features.promise || !features.promiseAllSettled) missingJsApis.push('Promise / allSettled');
  if (!features.mapAndSet || !features.symbol) missingJsApis.push('Map / Set / Symbol');
  if (!features.fetch) missingJsApis.push('Fetch API');
  if (!features.abortController) missingJsApis.push('AbortController');
  if (!features.urlApi) missingJsApis.push('URL / URLSearchParams');
  if (!features.textEncoder) missingJsApis.push('TextEncoder');
  if (!features.intlDateTime) missingJsApis.push('Intl.DateTimeFormat');

  if (missingJsApis.length > 0) {
    issues.push({
      id: 'missing-js-apis',
      title: 'APIs JavaScript essenciais ausentes',
      description: `Este navegador não disponibiliza recursos básicos exigidos pelo sistema: ${missingJsApis.join(', ')}.`,
      kind: 'feature',
      severity: 'critical',
    });
  }

  const missingObservers: string[] = [];
  if (!features.resizeObserver) missingObservers.push('ResizeObserver');
  if (!features.intersectionObserver) missingObservers.push('IntersectionObserver');
  if (!features.mutationObserver) missingObservers.push('MutationObserver');

  if (missingObservers.length > 0) {
    issues.push({
      id: 'missing-dom-observers',
      title: 'Observadores de DOM não suportados',
      description: `Recursos de layout e rolagem ausentes: ${missingObservers.join(', ')}.`,
      kind: 'feature',
      severity: 'critical',
    });
  }

  // 4. Verificação de CSS moderno (necessário para Tailwind v4 e layout responsivo)
  if (!features.cssSupports) {
    issues.push({
      id: 'missing-css-supports',
      title: 'Suporte a CSS moderno indisponível',
      description:
        'O navegador não possui a API CSS.supports para validar variáveis CSS, Grid e seletores modernos.',
      kind: 'css',
      severity: 'critical',
    });
  } else {
    const missingCss: string[] = [];
    if (!features.cssCustomProperties) missingCss.push('Variáveis CSS');
    if (!features.cssGrid) missingCss.push('CSS Grid');
    if (!features.cssFlexGap) missingCss.push('Flexbox Gap');
    if (!features.cssWhereSelector) missingCss.push('Seletor :where()');

    if (missingCss.length > 0) {
      issues.push({
        id: 'missing-css-features',
        title: 'Recursos de estilo CSS incompatíveis',
        description: `Este navegador não suporta propriedades visuais usadas no layout do Wiki-site: ${missingCss.join(', ')}.`,
        kind: 'css',
        severity: 'critical',
      });
    }
  }

  // 5. Verificação de armazenamento local (aviso não bloqueante por si só, pois modo anônimo pode restringir)
  if (!features.localStorageAvailable) {
    issues.push({
      id: 'restricted-storage',
      title: 'Armazenamento local (localStorage) restrito ou bloqueado',
      description:
        'Preferências de tema, rascunhos do editor e histórico de leitura podem não ser salvos entre sessões.',
      kind: 'storage',
      severity: 'warning',
    });
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    isCompatible: criticalCount === 0,
    browser,
    issues,
    criticalCount,
    warningCount,
    isSimulated,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Verifica se o usuário optou por forçar a entrada no Wiki-site apesar do aviso de incompatibilidade.
 */
export function isBrowserCompatibilityForced(): boolean {
  if (inMemoryForcedEntry) return true;

  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search || '');
    if (params.get('forceBrowser') === '1' || params.get('forcarEntrada') === '1') {
      inMemoryForcedEntry = true;
      return true;
    }
  } catch {
    // Ignora
  }

  try {
    if (window.sessionStorage?.getItem(FORCE_ENTRY_STORAGE_KEY) === '1') {
      return true;
    }
  } catch {
    // Ignora
  }

  try {
    if (window.localStorage?.getItem(FORCE_ENTRY_STORAGE_KEY) === '1') {
      return true;
    }
  } catch {
    // Ignora
  }

  return false;
}

/**
 * Registra a decisão do usuário de forçar a entrada (em caso de falso positivo / erro positivo).
 */
export function setBrowserCompatibilityForced(persistAcrossSessions: boolean): void {
  inMemoryForcedEntry = true;

  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage?.setItem(FORCE_ENTRY_STORAGE_KEY, '1');
  } catch {
    // Ignora restrições de sessionStorage
  }

  if (persistAcrossSessions) {
    try {
      window.localStorage?.setItem(FORCE_ENTRY_STORAGE_KEY, '1');
    } catch {
      // Ignora restrições de localStorage
    }
  }
}

/**
 * Remove a preferência de entrada forçada para permitir uma nova verificação limpa.
 */
export function clearBrowserCompatibilityForce(): void {
  inMemoryForcedEntry = false;

  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage?.removeItem(FORCE_ENTRY_STORAGE_KEY);
  } catch {
    // Ignora
  }

  try {
    window.localStorage?.removeItem(FORCE_ENTRY_STORAGE_KEY);
  } catch {
    // Ignora
  }
}
