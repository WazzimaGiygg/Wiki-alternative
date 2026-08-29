import React from 'react';
import { ExternalLink, Heart, Shield, Lock, FileText, Globe2, History, AlertTriangle } from 'lucide-react';
import { ViewMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { FooterBadges } from './FooterBadges';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  onOpenLanguagesModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLanguagesModal }) => {
  const { currentLanguage, t } = useLanguage();

  return (
    <footer className="mt-12 bg-[#f8f9fa] dark:bg-[#0b0f17] border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 py-5 transition-colors select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Top Info & Navigation Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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
              onClick={() => onNavigate('recent-changes')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
            >
              <History size={11} className="text-cyan-500" /> {t('sidebar.recent_changes')}
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
            >
              <Lock size={11} /> {t('sidebar.privacy')}
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
            >
              <FileText size={11} /> {t('sidebar.terms')}
            </button>
            <button
              onClick={() => onNavigate('donation')}
              className="hover:text-rose-500 flex items-center gap-1 font-medium"
            >
              <Heart size={11} className="text-rose-500" /> {t('sidebar.donations')}
            </button>
            <a
              href="https://github.com/WazzimaGiygg/Wiki-alternative"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 underline underline-offset-2 font-medium"
            >
              GitHub <ExternalLink size={10} />
            </a>
            <a
              href="https://wazzimagiygg.com/averdade/"
              target="_blank"
              rel="noopener noreferrer"
              title="Dossiê e Investigação dos abusos da Wikipédia contra o usuário WazzimaGiygg"
              className="hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 transition"
            >
              <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400" />
              <span>Dossiê & Investigação Wikipédia</span>
              <ExternalLink size={9} />
            </a>
          </div>
        </div>

        {/* Bottom Legal & MediaWiki-Style Badges Row */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="space-y-1 text-center md:text-left text-[10px] text-slate-400 font-mono">
            <p>
              O texto está disponível sob a licença{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)
              </a>
              {' '}e{' '}
              <a
                href="https://www.gnu.org/licenses/gpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                GNU GPL v3.0
              </a>
              .
            </p>
            <p className="text-slate-500 dark:text-slate-500">
              WikiZero Enciclopédia Aberta © 2026. Infraestrutura e Banco de Dados alimentados por{' '}
              <a
                href="https://firebase.google.com/products/firestore"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                Google Firebase (Cloud Firestore DB)
              </a>
              . DPO: pedrohenriquecardonaperes@gmail.com
            </p>
          </div>

          {/* 88x31 px MediaWiki, Google AI Studio, Creative Commons & DeepSeek Badges */}
          <FooterBadges />
        </div>
      </div>
    </footer>
  );
};


