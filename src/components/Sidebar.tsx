import React from 'react';
import {
  Home,
  Search,
  History,
  Shuffle,
  PlusCircle,
  Edit3,
  Shield,
  Heart,
  Lock,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  Sparkles,
  Globe2,
  Star,
  Users,
  Database,
  LifeBuoy,
  ExternalLink,
  Layers,
  UserX,
  Scale,
  Vote,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  Gavel,
  AlertOctagon,
  Tv,
  Palette,
  Award,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { ViewMode, DeviceMode, AppTheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface SidebarProps {
  currentView: ViewMode;
  isCollapsed: boolean;
  theme?: AppTheme;
  isDark?: boolean;
  deviceMode?: DeviceMode;
  onToggleCollapse: () => void;
  onNavigate: (view: ViewMode) => void;
  onRandomPage: () => void;
  onCreatePageClick: () => void;
  totalPages: number;
  totalArticles: number;
  onSetTheme?: (theme: AppTheme) => void;
  onOpenLanguagesModal?: () => void;
  onOpenSmartTVModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  isCollapsed,
  theme = 'light',
  isDark = false,
  deviceMode = 'auto',
  onToggleCollapse,
  onNavigate,
  onRandomPage,
  onCreatePageClick,
  totalPages,
  totalArticles,
  onSetTheme,
  onOpenLanguagesModal,
  onOpenSmartTVModal,
}) => {
  const { currentLanguage, t } = useLanguage();

  const isGoogleTheme = theme === 'google' || theme === 'google-dark';
  const isWin95 = theme === 'win95';
  const isGenshin = theme === 'genshin';
  const isAndroid = theme === 'android15';
  const isStardew = theme === 'stardew';
  const isRepo = theme === 'repo';
  const isMinecraft = theme === 'minecraft';
  const isRoblox = theme === 'roblox';
  const isNokia = theme === 'nokia3310';

  const visibilityClass =
    deviceMode === 'mobile'
      ? 'hidden'
      : deviceMode === 'desktop'
      ? 'flex'
      : 'hidden md:flex';

  return (
    <aside
      id="desktop-sidebar"
      className={`relative flex-col transition-all duration-200 z-20 select-none shrink-0 sticky top-16 self-start max-h-[calc(100vh-5rem)] overflow-hidden flex ${
        isWin95
          ? 'win95-window !border-2 !rounded-none !bg-[#c0c0c0]'
          : isNokia
          ? 'bg-[#b4c995] border-2 border-[#1f281b] !rounded-none shadow-[3px_3px_0px_#1f281b] font-mono text-[#1f281b]'
          : isRepo
          ? 'bg-[#080c13]/95 border-2 border-[#f59e0b]/50 rounded-lg shadow-[0_0_16px_rgba(245,158,11,0.15)] font-mono'
          : isMinecraft
          ? 'bg-[#1b1815]/95 border-2 border-[#3d3630] rounded-xs shadow-[0_4px_16px_rgba(0,0,0,0.6)] font-mono text-stone-200'
          : isRoblox
          ? 'bg-[#16171b]/98 border border-[#2d3036] rounded-xl shadow-lg font-sans text-white'
          : isGenshin
          ? 'bg-[#14192b]/95 border border-[#d3bc8e]/30 rounded-xl shadow-lg backdrop-blur-md'
          : isStardew
          ? 'stardew-box bg-[#fffbf2] rounded-xl'
          : isAndroid
          ? 'bg-[#1c1d21] border border-[#303338] rounded-xl shadow-xs'
          : isGoogleTheme
          ? 'bg-[#f8fafd] dark:bg-[#202124] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs'
          : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-xl shadow-2xs'
      } ${visibilityClass} ${isCollapsed ? 'w-14' : 'w-56'}`}
    >
      {/* Sidebar Header with Title & Collapse Action */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        {!isCollapsed && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            {t('sidebar.navigation')}
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className={`p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4">
        {/* Navigation Section: Principal */}
        <div>
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('hub')}
              title={t('sidebar.home')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'hub'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Home size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.home')}</span>}
            </button>

            <button
              onClick={() => onNavigate('search')}
              title="Busca Avançada de Artigos"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'search'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Search size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Busca Avançada</span>}
            </button>

            <button
              onClick={() => onNavigate('recent-changes')}
              title={t('sidebar.recent_changes')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'recent-changes'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <History size={15} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.recent_changes')}</span>}
            </button>

            <button
              onClick={onRandomPage}
              title={t('sidebar.random')}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
            >
              <Shuffle size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.random')}</span>}
            </button>

            <button
              onClick={onCreatePageClick}
              title={t('sidebar.create_collection')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'create-page'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.create_collection')}</span>}
            </button>

            <button
              onClick={() => onNavigate('editor')}
              title={t('sidebar.wikitext_editor')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'editor'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Edit3 size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.wikitext_editor')}</span>}
            </button>

            <button
              id="btn-sidebar-site-updates"
              onClick={() => onNavigate('site-updates')}
              title="Atualizações do Site & Notas de Versão"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'site-updates'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Atualizações do Site</span>
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold px-1 rounded-xs">
                    v3.3
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('appearance')}
              title="Aparência e Temas (Special:Appearance)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'appearance'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Palette size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Aparência & Temas</span>}
            </button>

            <button
              onClick={() => onNavigate('special-pages')}
              title="Páginas Especiais (Special:SpecialPages)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'special-pages'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Páginas Especiais</span>}
            </button>

            <button
              id="btn-sidebar-comparison"
              onClick={() => onNavigate('comparison')}
              title="Comparativo: WikiZero vs Wikipédia, MediaWiki e Fandom"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'comparison'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Award size={15} className="text-emerald-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Comparativo Wiki</span>}
            </button>

            <button
              id="btn-sidebar-wazzimagiygg"
              onClick={() => onNavigate('wazzimagiygg')}
              title="WazzimaGiygg: Portal Oficial, Projetos e Dossiê A Verdade"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'wazzimagiygg'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Shield size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">WazzimaGiygg</span>}
            </button>

            <button
              onClick={() => onNavigate('watchlist')}
              title="Páginas Vigiadas (Watchlist)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'watchlist'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Star size={15} className="text-amber-500 flex-shrink-0" fill={currentView === 'watchlist' ? 'currentColor' : 'none'} />
              {!isCollapsed && <span className="truncate">Páginas Vigiadas</span>}
            </button>
          </nav>
        </div>

        {/* Section: Ficheiros & Mídias */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>Ficheiros & Mídias</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('upload')}
              title="Carregar Ficheiro (Special:Upload)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'upload'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Upload size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Carregar Ficheiro</span>}
            </button>

            <button
              onClick={() => onNavigate('files-list')}
              title="Galeria de Ficheiros (Special:Files)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'files-list'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Galeria de Ficheiros</span>}
            </button>
          </nav>
        </div>

        {/* Section: Comunidade & Usuários */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>Comunidade & Usuários</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('user-page')}
              title="Página de Usuário (User:Perfil)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'user-page'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserCheck size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Página do Usuário</span>}
            </button>

            <button
              onClick={() => onNavigate('admin-users')}
              title="Diretório de Usuários (Special:ListUsers)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-users'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Users size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Diretório de Usuários</span>}
            </button>

            <button
              onClick={() => onNavigate('checkuser')}
              title="Verificador de Contas (Special:CheckUser - Fantoches)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'checkuser'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserX size={15} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">CheckUser (Fantoches)</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    MOD
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('unblock-requests')}
              title="Avaliação de Pedidos de Desbloqueio (Special:UnblockRequests)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'unblock-requests'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Scale size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Recursos de Desbloqueio</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    ADM
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('promotion-requests')}
              title="Pedidos de Promoção para Moderador e Administrador (Special:PromotionRequests - RFA)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'promotion-requests'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Vote size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Pedidos de Promoção (RFA)</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    VOTAÇÃO
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('arbitration')}
              title="Conselho de Arbitragem (Special:Arbitration - Julgamento de Usuários, Moderadores e Administradores)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'arbitration'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Gavel size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold">Conselho de Arbitragem</span>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono font-bold px-1 rounded-xs">
                    ARBCOM
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('contact-admin')}
              title="Fale com a Administração (Special:ContactAdmin - Denúncias e Suporte)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'contact-admin'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate">Falar com Administração</span>
                  <span className="text-[8px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-bold px-1 rounded-xs">
                    OFICIAL
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('emergency-contact')}
              title="Contato de Emergência em Casos Extremos (Special:EmergencyContact - Plantão e Risco Crítico)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'emergency-contact'
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800 shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertOctagon size={15} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full truncate">
                  <span className="truncate font-semibold text-rose-700 dark:text-rose-300">Contato de Emergência</span>
                  <span className="text-[8px] bg-red-600 text-white font-mono font-bold px-1 rounded-xs">
                    URGENTE
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin-firebase')}
              title="Administração do Banco Firebase (Firestore DB)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'admin-firebase'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Database size={15} className="text-amber-500 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Admin Firebase DB</span>}
            </button>
          </nav>
        </div>

        {/* Section: WikiZero Institutional & LGPD */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>{t('sidebar.legal_lgpd')}</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('security')}
              title={t('sidebar.security')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'security'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Shield size={15} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.security')}</span>}
            </button>

            <button
              onClick={() => onNavigate('donation')}
              title={t('sidebar.donations')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'donation'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Heart size={15} className="text-rose-500 dark:text-rose-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.donations')}</span>}
            </button>

            <button
              onClick={() => onNavigate('privacy')}
              title={t('sidebar.privacy')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'privacy'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Lock size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.privacy')}</span>}
            </button>

            <button
              onClick={() => onNavigate('terms')}
              title={t('sidebar.terms')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'terms'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText size={15} className="text-slate-600 dark:text-slate-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.terms')}</span>}
            </button>

            <button
              onClick={() => onNavigate('mydata')}
              title={t('sidebar.my_data')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'mydata'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserCheck size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.my_data')}</span>}
            </button>

            <a
              href={formatExternalUrl("https://support.wazzimagiygg.com/")}
              target="_blank"
              rel="noopener noreferrer"
              title="Central de Suporte e Abertura de Tickets WazzimaGiygg: https://support.wazzimagiygg.com/"
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 font-semibold transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LifeBuoy size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">Suporte & Tickets</span>}
              </div>
              {!isCollapsed && <ExternalLink size={11} className="text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 flex-shrink-0 ml-1" />}
            </a>
          </nav>
        </div>

        {/* Section: Modos */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>{t('sidebar.layouts')}</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('beta')}
              title={t('sidebar.beta_mode')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'beta'
                  ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.beta_mode')}</span>}
            </button>

            <button
              onClick={() => onNavigate('offline')}
              title={t('sidebar.offline_mode')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'offline'
                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <WifiOff size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{t('sidebar.offline_mode')}</span>}
            </button>

            {onOpenLanguagesModal && (
              <button
                onClick={onOpenLanguagesModal}
                title={t('header.change_language')}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
              >
                <Globe2 size={15} className="text-blue-500 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate flex items-center gap-1">
                    <span>{currentLanguage.flag}</span>
                    <span>{currentLanguage.nativeName}</span>
                  </span>
                )}
              </button>
            )}

            {!isCollapsed && (
              <div className="pt-2 space-y-1.5">
                <PWAInstallPrompt buttonStyle="full" />

                <button
                  onClick={() => {
                    if (onOpenSmartTVModal) {
                      onOpenSmartTVModal();
                    } else {
                      onNavigate('smart-tv');
                    }
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                  title="Disponibilidade para Smart TVs (Samsung Tizen, LG webOS, Android TV, Fire TV)"
                >
                  <div className="flex items-center gap-2">
                    <Tv size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>App Smart TV</span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">
                    10-Foot
                  </span>
                </button>

                {/* Link to Dedicated Centralized Appearance Page */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => onNavigate('appearance')}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition group shadow-2xs"
                    title="Mudar temas visuais, contraste e tipografia de forma centralizada"
                  >
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                      <span>Aparência & Temas</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold uppercase text-slate-500">
                      {theme}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* High Density Sidebar Footer Stats */}
      {!isCollapsed && (
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-1">
          <div className="flex justify-between items-center">
            <span>{t('sidebar.stats_collections')}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('sidebar.stats_articles')}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalArticles}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center">
            GNU GPL v3.0 • LGPD
          </div>
        </div>
      )}
    </aside>
  );
};
