import React from 'react';
import {
  Home,
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
} from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (view: ViewMode) => void;
  onRandomPage: () => void;
  onCreatePageClick: () => void;
  totalPages: number;
  totalArticles: number;
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
}) => {
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
              <span>Navegação</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('hub')}
              title="Página Principal"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'hub'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Home size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Página Principal</span>}
            </button>

            <button
              onClick={onRandomPage}
              title="Artigo Aleatório"
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
            >
              <Shuffle size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Artigo Aleatório</span>}
            </button>

            <button
              onClick={onCreatePageClick}
              title="Criar Página / Coleção"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'create-page'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Criar Coleção</span>}
            </button>

            <button
              onClick={() => onNavigate('editor')}
              title="Editor Wikitexto"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'editor'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Edit3 size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Editor Wikitexto</span>}
            </button>
          </nav>
        </div>

        {/* Section: WikiZero Institutional & LGPD */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>Legal & LGPD</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('security')}
              title="Segurança"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'security'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Shield size={15} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Segurança</span>}
            </button>

            <button
              onClick={() => onNavigate('donation')}
              title="Doações"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'donation'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Heart size={15} className="text-rose-500 dark:text-rose-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Doações</span>}
            </button>

            <button
              onClick={() => onNavigate('privacy')}
              title="Privacidade (LGPD)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'privacy'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Lock size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Privacidade (LGPD)</span>}
            </button>

            <button
              onClick={() => onNavigate('terms')}
              title="Termos de Uso"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'terms'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText size={15} className="text-slate-600 dark:text-slate-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Termos de Uso</span>}
            </button>

            <button
              onClick={() => onNavigate('mydata')}
              title="Meus Dados (Portabilidade)"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'mydata'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserCheck size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Meus Dados</span>}
            </button>
          </nav>
        </div>

        {/* Section: Modos */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 flex items-center gap-1 font-mono">
              <span>Layouts</span>
            </h3>
          )}
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('beta')}
              title="Layout Beta Moderno"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'beta'
                  ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Modo Beta 2026</span>}
            </button>

            <button
              onClick={() => onNavigate('offline')}
              title="Modo Offline"
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition ${
                currentView === 'offline'
                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <WifiOff size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Modo Offline</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* High Density Sidebar Footer Stats */}
      {!isCollapsed && (
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-1">
          <div className="flex justify-between items-center">
            <span>Coleções:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Artigos:</span>
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
