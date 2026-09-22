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
  AlertOctagon,
  ShieldAlert,
  Tv,
  Palette,
  Sparkles,
  Pickaxe,
  Gamepad2,
  Award,
  BookOpen,
  GraduationCap,
  Newspaper,
  Scale,
} from 'lucide-react';
import { ViewMode, DeviceMode, AppTheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { FooterBadges } from './FooterBadges';
import { formatExternalUrl } from '../utils/linkUtils';

interface FooterProps {
  onNavigate: (view: ViewMode) => void;
  theme?: AppTheme;
  deviceMode?: DeviceMode;
  onToggleDeviceMode?: (mode: DeviceMode) => void;
  onOpenLanguagesModal?: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onRebootWinXP?: () => void;
  onRebootWin95?: () => void;
  onOpenChromeRecommendation?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  theme = 'light',
  deviceMode = 'auto',
  onToggleDeviceMode,
  onOpenLanguagesModal,
  onSetTheme,
  onRebootWinXP,
  onRebootWin95,
  onOpenChromeRecommendation,
}) => {
  const { currentLanguage, t } = useLanguage();

  return (
    <footer className="mt-12 bg-[#f8f9fa] dark:bg-[#0b0f17] border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 py-6 pb-24 md:pb-6 transition-colors select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* R.E.P.O. Semiwork Tactical Contractor Mission Footer Strip */}
        {theme === 'repo' && (
          <div className="p-3 bg-[#070a0e] border border-[#f59e0b]/50 rounded text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-2 text-[#f59e0b]">
              <AlertTriangle size={15} className="animate-pulse" />
              <span className="font-bold">CONTRATO DE SALVAMENTO SEMIWORK // DIRETRIZ DE OPERAÇÃO</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>STATUS: SUCATA COLETADA</span>
              <span className="text-[#22d3ee]">TRANSMISSÃO TELEMÉTRICA SEGURA</span>
              <span className="text-amber-400 font-bold">R.E.P.O. v1.0.4</span>
            </div>
          </div>
        )}

        {/* Minecraft Survival Edition World Seed Footer Strip */}
        {theme === 'minecraft' && (
          <div className="p-3 bg-[#191512] border-2 border-[#55ff55]/50 rounded-xs text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_12px_rgba(85,255,85,0.15)]">
            <div className="flex items-center gap-2 text-[#55ff55]">
              <Pickaxe size={15} className="text-[#55ff55]" />
              <span className="font-bold">MINECRAFT SURVIVAL // SEED DO MUNDO: -48291039572910</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="text-[#ffaa00]">DIFICULDADE: DIFÍCIL</span>
              <span className="text-[#55ffff]">MODO HARDCORE ATIVO</span>
              <span className="text-[#55ff55] font-bold">MINECRAFT v1.21</span>
            </div>
          </div>
        )}

        {/* Roblox Experience Footer Strip */}
        {theme === 'roblox' && (
          <div className="p-3 bg-[#14151a] border border-[#00b06f]/50 rounded-lg text-xs font-sans text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_12px_rgba(0,176,111,0.15)]">
            <div className="flex items-center gap-2 text-[#00b06f]">
              <Gamepad2 size={15} className="text-[#00b06f]" />
              <span className="font-bold">ROBLOX CORPORATION // EXPERIÊNCIA WIKIZERO PLACE</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-sans">
              <span className="text-[#00a2ff]">STATUS: JOGANDO COM 14.8K AMIGOS</span>
              <span className="text-emerald-400 font-semibold">98% AVALIAÇÃO POSITIVA</span>
              <span className="text-white font-bold">ROBLOX ENGINE v624</span>
            </div>
          </div>
        )}

        {/* Nokia 3310 Monochromatic LCD Footer Strip */}
        {theme === 'nokia3310' && (
          <div className="p-3 bg-[#b4c995] border-2 border-[#1f281b] rounded-none text-xs font-mono text-[#1f281b] flex flex-wrap items-center justify-between gap-3 shadow-[2px_2px_0px_#1f281b]">
            <div className="flex items-center gap-2 text-[#1f281b]">
              <Smartphone size={15} className="text-[#1f281b]" />
              <span className="font-bold">NOKIA 3310 // DISPLAY MONOCROMÁTICO 84×48 LCD</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span>SINAL: [||||]</span>
              <span>BATERIA: [||||]</span>
              <span className="bg-[#1f281b] text-[#c2d6a4] px-1.5 py-0.5">SNAKE II PRONTO</span>
              <span>CONNECTING PEOPLE</span>
            </div>
          </div>
        )}

        {/* Windows XP Taskbar / Luna strip */}
        {theme === 'winxp' && (
          <div className="winxp-taskbar p-2 rounded-t-lg text-xs font-sans text-white flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRebootWinXP?.()}
                className="winxp-start-button flex items-center gap-1.5 px-3 py-1 font-bold text-sm tracking-wide text-white italic shadow-sm cursor-pointer"
                title="Clique para reiniciar e rever o boot clássico do Windows XP"
              >
                <svg className="w-4 h-4 not-italic" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M2 3h9v9H2z" />
                  <path fill="#7fba00" d="M13 3h9v9h-9z" />
                  <path fill="#00a4ef" d="M2 13h9v9H2z" />
                  <path fill="#ffb900" d="M13 13h9v9h-9z" />
                </svg>
                <span className="lowercase font-black">iniciar</span>
              </button>
              <span className="text-xs text-blue-100 font-medium hidden sm:inline ml-2">
                Microsoft Windows XP Professional [Versão 5.1.2600 Service Pack 3]
              </span>
            </div>
            <div className="winxp-tray flex items-center gap-3 px-3 py-1 rounded-sm text-[11px] font-medium">
              <span className="text-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conectado: 100,0 Mbps
              </span>
              <span className="text-blue-200 hidden xs:inline">Volume: 100%</span>
              <span className="bg-[#0b388f] px-2 py-0.5 rounded border border-[#1b58bf] text-white font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Windows 1.0 (1985) MS-DOS Executive Bottom Icon Area */}
        {theme === 'win1' && (
          <div className="p-2 bg-[#008080] border-t-2 border-b-2 border-black font-mono text-xs flex flex-wrap items-center justify-between gap-3 select-none text-white">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-cyan-200 tracking-wider">
                ÁREA DE ÍCONES (1985):
              </span>

              {/* Minimized Program Tiles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>⏰</span>
                  <span>CLOCK.EXE</span>
                </div>
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>♟️</span>
                  <span>REVERSI.EXE</span>
                </div>
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>📝</span>
                  <span>NOTEPAD.EXE</span>
                </div>
                <div className="border-2 border-black bg-white text-black px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>🎨</span>
                  <span>PAINT.EXE</span>
                </div>
                <div className="border-2 border-black bg-[#0000aa] text-white px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                  <span>📖</span>
                  <span>WIKIZERO.EXE [ATIVO]</span>
                </div>
              </div>
            </div>

            <div className="border-2 border-black bg-black text-emerald-400 font-mono text-[11px] px-2.5 py-1 flex items-center gap-3">
              <span>RAM: 640 KB TOTAL</span>
              <span>•</span>
              <span className="text-cyan-300">MODO REAL 8086</span>
              <span>•</span>
              <span className="text-white font-bold">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Windows 95 Retrô Taskbar Strip */}
        {theme === 'win95' && (
          <div className="p-1.5 bg-[#c0c0c0] border-t-2 border-white border-b-2 border-black font-sans text-xs flex flex-wrap items-center justify-between gap-2 select-none shadow-inner">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="win95-button flex items-center gap-1.5 px-3 py-1 font-bold text-xs"
                title="Menu Iniciar do Windows 95"
              >
                <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                  <div className="bg-[#ff0000]" />
                  <div className="bg-[#00aa00]" />
                  <div className="bg-[#0000ff]" />
                  <div className="bg-[#ffff00]" />
                </div>
                <span>Iniciar</span>
              </button>

              <div className="win95-sunken px-3 py-1 text-black font-bold text-[11px] flex items-center gap-1.5">
                <span className="text-[#000080]">📖</span>
                <span>WikiZero 95</span>
              </div>

              <div className="win95-sunken px-2.5 py-1 text-black text-[11px] flex items-center gap-1.5 bg-[#ffffcc]">
                <span>📎</span>
                <span className="font-semibold text-blue-900">Clippy (Bot Ativo)</span>
              </div>

              {onRebootWin95 && (
                <button
                  type="button"
                  onClick={onRebootWin95}
                  className="win95-button flex items-center gap-1 text-[11px] px-2 py-1 font-bold cursor-pointer"
                  title="Reiniciar e rever a tela de inicialização clássica do Windows 95"
                >
                  <span>🔄</span>
                  <span>Boot Win95</span>
                </button>
              )}
            </div>

            <div className="win95-sunken px-2.5 py-1 text-black font-mono text-[11px] flex items-center gap-2">
              <span className="text-emerald-700 font-bold" title="Modem Dial-up 28.8k conectado">
                MODEM: 28.8K
              </span>
              <span>•</span>
              <span className="font-bold">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

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

            <button
              id="btn-footer-tv-view"
              onClick={() => {
                onToggleDeviceMode?.('tv');
                onNavigate('smart-tv');
              }}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                deviceMode === 'tv'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
              title="Ativar interface 10-foot otimizada para Smart TVs e controle remoto"
            >
              <Tv size={13} />
              <span>Modo Smart TV</span>
              {deviceMode === 'tv' && <span className="text-[9px] bg-indigo-500 text-white px-1 rounded-xs uppercase">Ativo</span>}
            </button>

            {/* Link to Dedicated Centralized Appearance & Themes Page */}
            <button
              id="btn-footer-appearance-page"
              onClick={() => onNavigate('appearance')}
              className="px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs"
              title="Abrir página de personalização de aparência, temas e tipografia"
            >
              <Palette size={13} className="text-amber-500" />
              <span>Aparência & Temas</span>
            </button>
          </div>
        </div>

        {/* Top Info & Navigation Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Servidor Firestore e Cache Operacional" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              WazzimaGiygg / WikiWorldWeb v3.3
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
              id="btn-footer-library"
              onClick={() => onNavigate('library')}
              title="Wiki dos Livros & Periódicos: Catálogo de Acervo Bibliográfico, Ficha Catalográfica e Avaliações"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 transition shadow-xs"
            >
              <BookOpen size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span>Wiki dos Livros & Periódicos</span>
            </button>
            <button
              id="btn-footer-academic"
              onClick={() => onNavigate('academic')}
              title="Wiki Universitário: Repositório Institucional de Produção Científica, Teses, Google Acadêmico e Citações"
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60 transition shadow-xs"
            >
              <GraduationCap size={11} className="text-blue-600 dark:text-blue-400" />
              <span>Wiki Universitário (Repositório & Google Acadêmico)</span>
            </button>
            <button
              id="btn-footer-news"
              onClick={() => onNavigate('news')}
              title="Jornal WazzimaGiygg: Notícias, Investigações e Edição Digital Integrada"
              className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60 transition shadow-xs"
            >
              <Newspaper size={11} className="text-rose-600 dark:text-rose-400" />
              <span>Jornal WazzimaGiygg (Notícias)</span>
            </button>
            <button
              id="btn-footer-comparison"
              onClick={() => onNavigate('comparison')}
              title="Comparativo: WikiWorldWeb vs Wikipédia, MediaWiki, Fandom e Wikidot"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 transition shadow-xs"
            >
              <Award size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span>Comparativo: WikiWorldWeb vs Wikipédia / Fandom</span>
            </button>
            <button
              id="btn-footer-wazzimagiygg"
              onClick={() => onNavigate('wazzimagiygg')}
              title="WazzimaGiygg: Portal Oficial, Projetos e A Verdade sobre a Wikipédia"
              className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 transition shadow-xs"
            >
              <Shield size={11} className="text-amber-600 dark:text-amber-400" />
              <span>WazzimaGiygg (Projetos & Dossiê)</span>
            </button>
            <button
              onClick={() => onNavigate('recent-changes')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
            >
              <History size={11} className="text-cyan-500" /> {t('sidebar.recent_changes')}
            </button>
            <button
              onClick={() => onNavigate('arbitration')}
              title="Conselho de Arbitragem da WikiWorldWeb — Julgamento de ações de Usuários, Moderadores e Administradores"
              className="hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60 transition"
            >
              <Gavel size={11} className="text-purple-600 dark:text-purple-400" />
              <span>Conselho de Arbitragem (ArbCom)</span>
            </button>
            <button
              onClick={() => onNavigate('emergency-contact')}
              title="Contato de Emergência em Casos Extremos (Risco à Vida, Doxxing e Segurança de Menores)"
              className="hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/60 transition animate-pulse"
            >
              <AlertOctagon size={11} className="text-red-600 dark:text-red-400" />
              <span>Contato de Emergência</span>
            </button>
            <button
              id="btn-footer-ucoc"
              onClick={() => onNavigate('ucoc')}
              title="Universal Code of Conduct (UCoC) — Normas de convivência, diretrizes de aplicação e canal de denúncias formais"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60 transition"
            >
              <ShieldAlert size={11} className="text-indigo-600 dark:text-indigo-400" />
              <span>Código de Conduta (UCoC)</span>
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
              onClick={() => onNavigate('editing-ethics')}
              title="Regras de Ética de Edição, Adição e Contribuição (LGPD & GDPR)"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60 transition"
            >
              <Scale size={12} className="text-blue-600 dark:text-blue-400" />
              <span>Regras de Ética & Privacidade</span>
            </button>
            {onOpenChromeRecommendation && (
              <button
                id="btn-footer-chrome-recommendation"
                onClick={onOpenChromeRecommendation}
                title="Aviso de preferência e recomendação de uso do Google Chrome na WikiWorldWeb"
                className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 transition shadow-2xs"
              >
                <Sparkles size={11} className="text-amber-500" />
                <span>Recomendação do Chrome</span>
              </button>
            )}
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
              WikiWorldWeb Enciclopédia Aberta © 2026. Infraestrutura e Banco de Dados alimentados por{' '}
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


