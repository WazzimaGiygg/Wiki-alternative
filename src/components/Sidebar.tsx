import React from 'react';
import {
  Home,
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
} from 'lucide-react';
import { ViewMode, DeviceMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';

interface SidebarProps {
  currentView: ViewMode;
  isCollapsed: boolean;
  deviceMode?: DeviceMode;
  onToggleCollapse: () => void;
  onNavigate: (view: ViewMode) => void;
  onRandomPage: () => void;
  onCreatePageClick: () => void;
  totalPages: number;
  totalArticles: number;
  onOpenLanguagesModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  isCollapsed,
  deviceMode = 'auto',
  onToggleCollapse,
  onNavigate,
  onRandomPage,
  onCreatePageClick,
  totalPages,
  totalArticles,
  onOpenLanguagesModal,
}) => {
  const { currentLanguage, t } = useLanguage();

  const visibilityClass =
    deviceMode === 'mobile'
      ? 'hidden'
      : deviceMode === 'desktop'
      ? 'flex'
      : 'hidden md:flex';

  return (
    <aside
      id="desktop-sidebar"
      className={`relative flex-col bg-[#f8f9fa] dark:bg-[#0b0f17] border-r border-slate-200 dark:border-slate-800 transition-all duration-200 z-30 select-none ${visibilityClass} ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        className="absolute -right-3 top-4 w-5 h-5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition z-40"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* Navigation Section: Principal */}
        <div>
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>{t('sidebar.navigation')}</span>
            </h3>
          )}
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
