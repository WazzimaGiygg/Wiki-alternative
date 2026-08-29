import React from 'react';
import { Home, Search, Shuffle, Edit3, Menu, Bell } from 'lucide-react';
import { ViewMode } from '../types';

interface MobileBottomNavProps {
  currentView: ViewMode;
  unreadNotificationsCount?: number;
  onNavigate: (view: ViewMode) => void;
  onOpenSearch: () => void;
  onRandomPage: () => void;
  onOpenNewArticle: () => void;
  onOpenMenuDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  unreadNotificationsCount = 0,
  onNavigate,
  onOpenSearch,
  onRandomPage,
  onOpenNewArticle,
  onOpenMenuDrawer,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navegação móvel principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-lg transition-transform md:hidden pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      {/* 1. Início / Hub */}
      <button
        id="btn-mobile-nav-hub"
        onClick={() => onNavigate('hub')}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium transition active:scale-95 ${
          currentView === 'hub'
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-full transition ${currentView === 'hub' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
          <Home size={19} className={currentView === 'hub' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
        </div>
        <span className="mt-0.5 tracking-tight">Início</span>
      </button>

      {/* 2. Buscar (Modal dedicado touch-friendly) */}
      <button
        id="btn-mobile-nav-search"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition active:scale-95"
      >
        <div className="p-1 rounded-full">
          <Search size={19} className="stroke-[1.8]" />
        </div>
        <span className="mt-0.5 tracking-tight">Buscar</span>
      </button>

      {/* 3. Criar / Novo Artigo (Ação de destaque) */}
      <button
        id="btn-mobile-nav-editor"
        onClick={onOpenNewArticle}
        className="flex flex-col items-center justify-center -mt-3.5 flex-none px-2 group active:scale-95 transition"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 group-hover:from-blue-700 group-hover:to-indigo-700">
          <Edit3 size={18} className="stroke-[2.2]" />
        </div>
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">Criar</span>
      </button>

      {/* 4. Artigo Aleatório */}
      <button
        id="btn-mobile-nav-random"
        onClick={onRandomPage}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition active:scale-95"
        title="Artigo Aleatório"
      >
        <div className="p-1 rounded-full">
          <Shuffle size={19} className="stroke-[1.8]" />
        </div>
        <span className="mt-0.5 tracking-tight">Aleatório</span>
      </button>

      {/* 5. Menu / Gaveta Completa */}
      <button
        id="btn-mobile-nav-drawer"
        onClick={onOpenMenuDrawer}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition active:scale-95 relative"
      >
        <div className="p-1 rounded-full relative">
          <Menu size={19} className="stroke-[1.8]" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute 0 top-0 right-0 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </div>
        <span className="mt-0.5 tracking-tight">Menu</span>
      </button>
    </nav>
  );
};
