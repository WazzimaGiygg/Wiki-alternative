import React from 'react';
import {
  ExternalLink,
  Heart,
  Shield,
  Lock,
  FileText,
  Globe2,
  History,
  AlertTriangle,
  ShieldCheck,
  LifeBuoy,
  Smartphone,
  Monitor,
  Gavel,
} from 'lucide-react';
import { ViewMode, DeviceMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { FooterBadges } from './FooterBadges';
import { formatExternalUrl } from '../utils/linkUtils';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  deviceMode?: DeviceMode;
  onToggleDeviceMode?: (mode: DeviceMode) => void;
  onOpenLanguagesModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  deviceMode = 'auto',
  onToggleDeviceMode,
  onOpenLanguagesModal,
}) => {
  const { currentLanguage, t } = useLanguage();

  return (
    <footer className="mt-12 bg-[#f8f9fa] dark:bg-[#0b0f17] border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 py-6 pb-24 md:pb-6 transition-colors select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Official Wikimedia-style Mobile / Desktop View Selector Bar */}
        <div className="bg-slate-200/70 dark:bg-slate-850 p-2 rounded-lg flex flex-wrap items-center justify-between gap-2 border border-slate-300/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Modo de Exibição:
            </span>
            <span className="text-[10px] text-slate-500">
              (Escolha como deseja visualizar a enciclopédia)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-footer-mobile-view"
              onClick={() => onToggleDeviceMode?.('mobile')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                deviceMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
              title="Ativar layout e navegação otimizados para smartphones e telas touch"
            >
              <Smartphone size={13} />
              <span>Versão móvel</span>
              {deviceMode === 'mobile' && <span className="text-[9px] bg-blue-500 text-white px-1 rounded-xs uppercase">Ativo</span>}
            </button>

            <button
              id="btn-footer-desktop-view"
              onClick={() => onToggleDeviceMode?.('desktop')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                deviceMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
              title="Ativar layout completo e painéis de computador"
            >
              <Monitor size={13} />
              <span>Versão para computador</span>
              {deviceMode === 'desktop' && <span className="text-[9px] bg-blue-500 text-white px-1 rounded-xs uppercase">Ativo</span>}
            </button>
          </div>
        </div>

        {/* Top Info & Navigation Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Servidor Firestore e Cache Operacional" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              WazzimaGiygg / WikiZero v3.3
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              id="btn-footer-site-updates"
              onClick={() => onNavigate('site-updates')}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              title="Ver notas de versão e melhorias do sistema"
            >
              <span>Notas de Versão & Atualizações</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Enciclopédia Livre</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.nativeName}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <a
              href={formatExternalUrl("https://support.wazzimagiygg.com/")}
              target="_blank"
              rel="noopener noreferrer"
              title="Central Oficial de Suporte, Atendimento e Abertura de Tickets dos Serviços WazzimaGiygg"
              className="hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60 transition shadow-xs"
            >
              <LifeBuoy size={12} className="text-indigo-600 dark:text-indigo-400" />
              <span>Suporte & Tickets</span>
              <ExternalLink size={9} />
            </a>
            <button
              onClick={() => onNavigate('recent-changes')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
            >
              <History size={11} className="text-cyan-500" /> {t('sidebar.recent_changes')}
            </button>
            <button
              onClick={() => onNavigate('arbitration')}
              title="Conselho de Arbitragem da WikiZero — Julgamento de ações de Usuários, Moderadores e Administradores"
              className="hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60 transition"
            >
              <Gavel size={11} className="text-purple-600 dark:text-purple-400" />
              <span>Conselho de Arbitragem (ArbCom)</span>
            </button>
            <button
              onClick={() => onNavigate('privacy')}
              title="Conformidade integral com LGPD (Lei nº 13.709/2018) e Marco Civil da Internet (Lei nº 12.965/2014)"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 transition"
            >
              <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>LGPD & Marco Civil</span>
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
              href={formatExternalUrl("https://github.com/WazzimaGiygg/Wiki-alternative")}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 underline underline-offset-2 font-medium"
            >
              GitHub <ExternalLink size={10} />
            </a>
            <a
              href={formatExternalUrl("https://wazzimagiygg.com/averdade/")}
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
                href={formatExternalUrl("https://creativecommons.org/licenses/by-sa/4.0/")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)
              </a>
              {' '}e{' '}
              <a
                href={formatExternalUrl("https://www.gnu.org/licenses/gpl-3.0.html")}
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
                href={formatExternalUrl("https://firebase.google.com/products/firestore")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                Google Firebase (Cloud Firestore DB)
              </a>
              {' '}• Domínio via{' '}
              <a
                href={formatExternalUrl("https://www.godaddy.com")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                GoDaddy
              </a>
              {' '}• Central de Suporte & Tickets:{' '}
              <a
                href={formatExternalUrl("https://support.wazzimagiygg.com/")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                support.wazzimagiygg.com
              </a>
              {' '}• Em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong> e o <strong>Marco Civil (Lei nº 12.965/2014)</strong>. DPO: pedrohenriquecardonaperes@gmail.com
            </p>
          </div>

          {/* 88x31 px MediaWiki, LGPD & MCI, Google AI Studio, Creative Commons & DeepSeek Badges */}
          <FooterBadges onNavigate={onNavigate} />
        </div>
      </div>
    </footer>
  );
};


