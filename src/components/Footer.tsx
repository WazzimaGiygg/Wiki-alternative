import React from 'react';
import { ExternalLink, Heart, Shield, Lock, FileText, Globe2 } from 'lucide-react';
import { ViewMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  onOpenLanguagesModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLanguagesModal }) => {
  const { currentLanguage, t } = useLanguage();

  return (
    <footer className="mt-12 bg-[#f8f9fa] dark:bg-[#0b0f17] border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 py-4 transition-colors select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Servidor Firestore e Cache Operacional" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              WazzimaGiygg / WikiZero v3.0
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Enciclopédia Livre e Aberta</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.nativeName}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
            >
              <Lock size={11} /> {t('sidebar.privacy')}
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
            >
              <FileText size={11} /> {t('sidebar.terms')}
            </button>
            <button
              onClick={() => onNavigate('donation')}
              className="hover:text-rose-500 flex items-center gap-1"
            >
              <Heart size={11} className="text-rose-500" /> {t('sidebar.donations')}
            </button>
            <a
              href="https://github.com/WazzimaGiygg/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 underline underline-offset-2"
            >
              GitHub <ExternalLink size={10} />
            </a>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
          <p>
            Conteúdo sob licença{' '}
            <a
              href="https://www.gnu.org/licenses/gpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              GNU GPL v3.0
            </a>
            . WikiZero Enciclopédia Aberta © 2026.
          </p>
          <div className="flex items-center gap-2">
            <span>DPO: pedrohenriquecardonaperes@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

