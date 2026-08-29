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
} from 'lucide-react';
import { ViewMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentView: ViewMode;
  isCollapsed: boolean;
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
  onToggleCollapse,
  onNavigate,
  onRandomPage,
  onCreatePageClick,
  totalPages,
  totalArticles,
  onOpenLanguagesModal,
}) => {
  const { currentLanguage, t } = useLanguage();

  return (
    <aside
      className={`relative flex flex-col bg-[#f8f9fa] dark:bg-[#0b0f17] border-r border-slate-200 dark:border-slate-800 transition-all duration-200 z-30 select-none ${
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
