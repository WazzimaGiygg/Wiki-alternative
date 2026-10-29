/**
 * @file src/components/FirstVisitNewsPopupModal.tsx
 * @description Modal exibido no primeiro acesso do usuário ao Wiki-site,
 * controlado pela extensão FirstVisitNewsPopupExtension (4.1.1.Y5.4).
 * Permite alteração do HTML e desativação pelo burocrata.
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Settings,
  Eye,
  Info,
} from 'lucide-react';
import { ExtensionManager } from '../core/ExtensionManager';
import { UserProfile } from '../types';
import { DEFAULT_FIRST_VISIT_HTML } from '../extensions/first-visit-news-popup';

interface FirstVisitNewsPopupModalProps {
  currentUser?: UserProfile | null;
  onNavigateToExtensions?: () => void;
  forcePreview?: boolean;
  onClosePreview?: () => void;
}

export const FirstVisitNewsPopupModal: React.FC<FirstVisitNewsPopupModalProps> = ({
  currentUser,
  onNavigateToExtensions,
  forcePreview = false,
  onClosePreview,
}) => {
  const extensionManager = ExtensionManager.getInstance();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const isBureaucrat = !!(
    currentUser &&
    (currentUser.role === 'admin' ||
      currentUser.email === 'pedrohenriquecardonaperes@gmail.com' ||
      (currentUser.group && currentUser.group.toLowerCase().includes('burocrata')))
  );

  const extSettings = extensionManager.getFirstVisitPopupSettings();
  const isExtensionEnabled = extensionManager.isFirstVisitPopupEnabled();

  const isEnabled = extSettings.popupEnabled !== false && isExtensionEnabled;
  const title = extSettings.popupTitle || 'Comunicado Oficial & Atualizações da WikiZero';
  const badgeLabel = extSettings.badgeLabel || 'INFORMATIVO OFICIAL';
  const htmlContent = extSettings.customHtmlCode || DEFAULT_FIRST_VISIT_HTML;
  const showOnlyOnFirstVisit = extSettings.showOnlyOnFirstVisit !== false;
  const popupVersion = extSettings.popupVersion || 'v4.1.1-news';
  const buttonLabel = extSettings.buttonLabel || 'Entendido e Continuar';

  const storageKey = `wikizero_first_visit_news_seen_${popupVersion}`;

  useEffect(() => {
    if (forcePreview) {
      setIsOpen(true);
      return;
    }

    if (!isEnabled) {
      setIsOpen(false);
      return;
    }

    if (showOnlyOnFirstVisit) {
      try {
        const seen = localStorage.getItem(storageKey);
        if (seen === 'true') {
          return;
        }
      } catch {
        // Ignora erro de localStorage
      }
    }

    // Delay breve de 650ms para que a página monte de forma fluida antes de exibir o anúncio
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 650);

    return () => clearTimeout(timer);
  }, [isEnabled, showOnlyOnFirstVisit, storageKey, forcePreview]);

  const handleClose = () => {
    if (showOnlyOnFirstVisit && dontShowAgain && !forcePreview) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // Ignora
      }
    }
    setIsOpen(false);
    if (forcePreview && onClosePreview) {
      onClosePreview();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-visit-news-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Cabeçalho do Popup */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 shadow-xs">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider font-mono">
                  {badgeLabel}
                </span>
                <span className="text-[10px] font-mono text-blue-200 opacity-80">
                  {popupVersion}
                </span>
                {forcePreview && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                    Modo Pré-visualização
                  </span>
                )}
              </div>
              <h2
                id="first-visit-news-title"
                className="text-lg md:text-xl font-bold font-serif-heading text-white mt-0.5"
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Fechar comunicado"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Status para Burocratas */}
        {isBureaucrat && (
          <div className="px-6 py-2 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/40 flex items-center justify-between text-xs text-purple-900 dark:text-purple-300">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Extensão 4.1.1.Y5.4: Código HTML gerenciado pelo Conselho de Burocratas</span>
            </div>
            {onNavigateToExtensions && (
              <button
                onClick={() => {
                  handleClose();
                  onNavigateToExtensions();
                }}
                className="flex items-center gap-1 font-bold underline hover:text-purple-700 dark:hover:text-purple-200 transition cursor-pointer"
              >
                <Settings size={12} />
                <span>Editar no Painel de Extensões</span>
              </button>
            )}
          </div>
        )}

        {/* Corpo do Conteúdo HTML Customizado */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Renderização do HTML Personalizado inserido pelo Burocrata */}
          <div
            className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:my-2 prose-a:text-blue-600 dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Rodapé e Ação de Confirmação */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
            />
            <span>Não exibir novamente este comunicado nesta versão</span>
          </label>

          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>{buttonLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
