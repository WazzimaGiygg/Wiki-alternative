import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, X, CheckCircle2 } from 'lucide-react';

const FORCE_COMPAT_KEY = 'wikizero_force_compat';

interface CompatIssue {
  id: string;
  label: string;
  detail: string;
}

export const BrowserCompatibilityChecker: React.FC = () => {
  const [issues, setIssues] = useState<CompatIssue[]>([]);
  const [forced, setForced] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        if (window.location.search.includes('force_entry=1')) return true;
        if (window.sessionStorage?.getItem(FORCE_COMPAT_KEY) === 'true') return true;
        if (window.localStorage?.getItem(FORCE_COMPAT_KEY) === 'true') return true;
      }
    } catch {
      // Ignora bloqueio de storage
    }
    return false;
  });

  useEffect(() => {
    if (forced || typeof window === 'undefined') return;

    const detected: CompatIssue[] = [];
    const ua = navigator.userAgent || '';

    if (window.location.search.includes('compat=check')) {
      detected.push({
        id: 'manual-check',
        label: 'Modo de Verificação de Compatibilidade (?compat=check)',
        detail: 'Exibição de teste da tela de compatibilidade de navegador.',
      });
    }

    if (typeof ResizeObserver === 'undefined') {
      detected.push({
        id: 'resize-observer',
        label: 'ResizeObserver indisponível',
        detail: 'Alguns painéis e editores responsivos podem não ajustar o tamanho automaticamente.',
      });
    }

    if (typeof window.indexedDB === 'undefined') {
      detected.push({
        id: 'indexeddb',
        label: 'IndexedDB indisponível',
        detail: 'O cache local avançado offline pode ficar limitado nesta sessão ou aba anônima.',
      });
    }

    if (!window.crypto || !window.crypto.subtle) {
      // SubtleCrypto only works in HTTPS or localhost, avoid false positive on plain HTTP LAN unless actually old
      const isSecureContext = window.isSecureContext !== false;
      if (isSecureContext) {
        detected.push({
          id: 'webcrypto',
          label: 'Web Crypto API ausente',
          detail: 'Recursos de integridade e assinatura criptográfica local indisponíveis.',
        });
      }
    }

    if (/MSIE |Trident\/|Opera Mini|UCBrowser/i.test(ua)) {
      detected.push({
        id: 'legacy-engine',
        label: 'Motor de navegador legado detectado',
        detail: 'Este navegador pode apresentar falhas visuais ou lentidão no editor e PWA.',
      });
    }

    setIssues(detected);
  }, [forced]);

  const handleForceEntry = () => {
    try {
      window.sessionStorage?.setItem(FORCE_COMPAT_KEY, 'true');
    } catch {
      // ignore
    }
    try {
      window.localStorage?.setItem(FORCE_COMPAT_KEY, 'true');
    } catch {
      // ignore
    }
    setForced(true);
  };

  if (forced || issues.length === 0) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compat-dialog-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 id="compat-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                Navegador não totalmente compatível
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Alguns recursos do WikiZero podem não funcionar corretamente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleForceEntry}
            aria-label="Fechar e continuar mesmo assim"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Seu navegador não passou em todas as verificações de compatibilidade técnica do Wiki-site. Recomendamos usar uma versão atualizada do{' '}
            <strong>Google Chrome</strong>, <strong>Mozilla Firefox</strong>, <strong>Microsoft Edge</strong> ou <strong>Safari</strong>.
          </p>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <ShieldAlert size={14} />
              <span>Incompatibilidades detectadas ({issues.length})</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {issues.map((issue) => (
                <li key={issue.id} className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">• {issue.label}</span>
                  <span className="text-slate-500 dark:text-slate-400 pl-3">{issue.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
            <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Possível falso positivo?</strong> Se você usa um navegador moderno com modo restrito, extensão de privacidade ou User-Agent customizado, você pode forçar a entrada normalmente.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              Verificar novamente
            </button>
            <button
              type="button"
              onClick={handleForceEntry}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <span>Continuar mesmo assim (Forçar Entrada)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
