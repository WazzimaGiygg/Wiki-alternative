import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  BrowserCompatibilityReport,
  clearBrowserCompatibilityForce,
  evaluateBrowserCompatibility,
  isBrowserCompatibilityForced,
  setBrowserCompatibilityForced,
} from '../utils/browserCompatibility';

interface BrowserCompatibilityGatekeeperProps {
  children: React.ReactNode;
  initialReport?: BrowserCompatibilityReport;
  initialForced?: boolean;
}

const RECOMMENDED_BROWSERS = [
  {
    name: 'Google Chrome',
    note: 'Versão 90 ou superior',
    url: 'https://www.google.com/chrome/',
  },
  {
    name: 'Mozilla Firefox',
    note: 'Versão 90 ou superior',
    url: 'https://www.mozilla.org/firefox/new/',
  },
  {
    name: 'Microsoft Edge',
    note: 'Baseado em Chromium (90+)',
    url: 'https://www.microsoft.com/edge',
  },
  {
    name: 'Apple Safari',
    note: 'Versão 14.1 ou superior',
    url: 'https://support.apple.com/safari',
  },
];

export const BrowserCompatibilityGatekeeper: React.FC<BrowserCompatibilityGatekeeperProps> = ({
  children,
  initialReport,
  initialForced,
}) => {
  const [report, setReport] = useState<BrowserCompatibilityReport>(() =>
    initialReport ?? evaluateBrowserCompatibility()
  );
  const [isForced, setIsForced] = useState<boolean>(() =>
    initialForced !== undefined ? initialForced : isBrowserCompatibilityForced()
  );
  const [rememberChoice, setRememberChoice] = useState<boolean>(true);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState<boolean>(false);

  const handleForceEntry = () => {
    setBrowserCompatibilityForced(rememberChoice);
    setIsForced(true);
    setIsNoticeDismissed(false);
  };

  const handleRecheck = () => {
    setReport(evaluateBrowserCompatibility());
  };

  const handleReopenGate = () => {
    clearBrowserCompatibilityForce();
    setIsForced(false);
    setReport(evaluateBrowserCompatibility());
  };

  // Navegador compatível: renderiza o Wiki-site sem interferências
  if (report.isCompatible) {
    return <>{children}</>;
  }

  // Navegador sinalizado como incompatível, porém usuário optou por forçar a entrada
  if (isForced) {
    return (
      <>
        {!isNoticeDismissed && (
          <aside
            aria-label="Aviso de entrada forçada"
            className="bg-amber-950 text-amber-50 border-b border-amber-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 z-[9999] relative font-sans"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
              <p className="leading-snug">
                <strong className="font-semibold">Entrada forçada ativa</strong>
                <span aria-hidden="true" className="mx-1.5 text-amber-400">·</span>
                <span>
                  Navegador detectado ({report.browser.name}
                  {report.browser.version ? ` ${report.browser.version}` : ''}) pode apresentar falhas visuais ou funcionais.
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleReopenGate}
                className="text-amber-200 hover:text-white underline underline-offset-2 font-medium whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Ver detalhes de compatibilidade
              </button>
              <button
                type="button"
                onClick={() => setIsNoticeDismissed(true)}
                aria-label="Dispensar aviso de entrada forçada"
                className="p-1 text-amber-200 hover:text-white rounded hover:bg-amber-900/70 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </aside>
        )}
        {children}
      </>
    );
  }

  const criticalIssues = report.issues.filter((i) => i.severity === 'critical');
  const warningIssues = report.issues.filter((i) => i.severity === 'warning');

  return (
    <main
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="browser-compat-heading"
      aria-describedby="browser-compat-desc"
      className="min-h-screen bg-[#FBF9F5] dark:bg-[#0b0f17] text-[#1C1917] dark:text-slate-100 flex flex-col justify-between px-4 py-8 sm:px-8 sm:py-12 font-sans"
    >
      <div className="w-full max-w-3xl mx-auto space-y-8">
        {/* Cabeçalho institucional limpo */}
        <header className="pb-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg font-serif-heading font-bold tracking-tight text-stone-900 dark:text-white whitespace-nowrap">
              WikiWorldWeb
            </span>
            <span aria-hidden="true" className="text-stone-300 dark:text-slate-700">·</span>
            <span className="text-xs text-stone-500 dark:text-slate-400 truncate">
              Verificação de Compatibilidade
            </span>
          </div>
          <span className="text-xs font-mono tabular-nums text-stone-500 dark:text-slate-400 whitespace-nowrap shrink-0">
            {report.criticalCount} {report.criticalCount === 1 ? 'incompatibilidade' : 'incompatibilidades'}
          </span>
        </header>

        {/* Mensagem Principal */}
        <section className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="mt-1 p-2.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-2.5 min-w-0">
              <p className="text-xs uppercase tracking-widest text-red-700 dark:text-red-400 font-semibold">
                Navegador não compatível
              </p>
              <h1
                id="browser-compat-heading"
                className="text-2xl sm:text-4xl font-serif-heading font-bold tracking-tight text-stone-900 dark:text-white leading-tight [text-wrap:balance]"
              >
                Este navegador não é compatível com o Wiki-site
              </h1>
              <p
                id="browser-compat-desc"
                className="text-sm sm:text-base text-stone-700 dark:text-slate-300 leading-relaxed max-w-2xl"
              >
                O navegador utilizado no momento não atende aos requisitos técnicos mínimos para executar a enciclopédia, o editor wikitexto e os recursos de sincronização com segurança e estabilidade.
              </p>
            </div>
          </div>
        </section>

        {/* Bloco de Ação Principal: Opção de Forçar Entrada para Erro Positivo */}
        <section
          aria-labelledby="false-positive-heading"
          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5"
        >
          <div className="space-y-1.5">
            <h2
              id="false-positive-heading"
              className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white"
            >
              Isso é um erro positivo (falso positivo)? Você pode forçar a entrada
            </h2>
            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
              Navegadores focados em privacidade, extensões que mascaram o User-Agent ou visualizadores embutidos podem ser classificados incorretamente como incompatíveis. Se você sabe que o navegador funciona corretamente, force a entrada abaixo.
            </p>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-stone-700 dark:text-slate-300 cursor-pointer select-none min-h-[40px]">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-slate-600 text-blue-700 focus:ring-blue-600 cursor-pointer"
            />
            <span>Lembrar minha escolha neste navegador e não exibir este aviso novamente</span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              id="btn-force-browser-entry"
              onClick={handleForceEntry}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span>Forçar entrada no Wiki-site</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              id="btn-recheck-browser-compat"
              onClick={handleRecheck}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg border border-stone-300 dark:border-slate-700 bg-stone-50 hover:bg-stone-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Verificar novamente</span>
            </button>
          </div>
        </section>

        {/* Diagnóstico Técnico Estruturado */}
        <section aria-labelledby="compat-diagnostics-heading" className="space-y-4">
          <h2
            id="compat-diagnostics-heading"
            className="text-xs uppercase tracking-widest text-stone-500 dark:text-slate-400 font-semibold"
          >
            Diagnóstico do Ambiente Detectado
          </h2>

          <dl className="divide-y divide-stone-200 dark:divide-slate-800 border border-stone-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm">
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <dt className="text-stone-500 dark:text-slate-400">Navegador identificado</dt>
              <dd className="font-medium text-stone-900 dark:text-slate-100">
                {report.browser.name}
                {report.browser.version ? ` · v${report.browser.version}` : ''}
              </dd>
            </div>
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <dt className="text-stone-500 dark:text-slate-400">Motor de renderização</dt>
              <dd className="font-mono text-xs text-stone-800 dark:text-slate-200">
                {report.browser.engine}
                {report.browser.isMobile ? ' · Dispositivo móvel' : ' · Desktop'}
              </dd>
            </div>
            <div className="px-4 py-3 space-y-2">
              <dt className="text-stone-500 dark:text-slate-400">Motivos da incompatibilidade</dt>
              <dd className="space-y-2.5">
                {criticalIssues.map((issue) => (
                  <div key={issue.id} className="space-y-0.5">
                    <div className="font-semibold text-red-800 dark:text-red-300">
                      {issue.title}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                ))}
                {warningIssues.map((issue) => (
                  <div key={issue.id} className="space-y-0.5 pt-1">
                    <div className="font-medium text-amber-800 dark:text-amber-300">
                      Aviso: {issue.title}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                ))}
              </dd>
            </div>
          </dl>
        </section>

        {/* Navegadores Compatíveis Recomendados */}
        <section aria-labelledby="recommended-browsers-heading" className="space-y-3">
          <h2
            id="recommended-browsers-heading"
            className="text-xs uppercase tracking-widest text-stone-500 dark:text-slate-400 font-semibold"
          >
            Navegadores Totalmente Compatíveis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RECOMMENDED_BROWSERS.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-slate-400 truncate">
                    {item.note}
                  </div>
                </div>
                <ExternalLink
                  className="w-4 h-4 text-stone-400 dark:text-slate-500 shrink-0"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </section>
      </div>

      <footer className="w-full max-w-3xl mx-auto pt-8 mt-8 border-t border-stone-200 dark:border-slate-800 text-xs text-stone-500 dark:text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>WikiWorldWeb · Enciclopédia Livre</span>
        <span className="font-mono text-[11px] truncate max-w-full">
          Se o site falhar após forçar a entrada, utilize um navegador atualizado.
        </span>
      </footer>
    </main>
  );
};
