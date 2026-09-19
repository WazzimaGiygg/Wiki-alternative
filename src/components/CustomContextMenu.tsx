import React, { useEffect, useRef } from 'react';
import { RotateCw, Home, Wrench } from 'lucide-react';

interface CustomContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onTools: () => void;
}

export const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  isOpen,
  x,
  y,
  onClose,
  onRefresh,
  onHome,
  onTools,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate boundary-safe coordinates so menu never overflows screen
  const menuWidth = 56;
  const menuHeight = 158;
  const padding = 12;

  const left = Math.max(padding, Math.min(x, window.innerWidth - menuWidth - padding));
  const top = Math.max(padding, Math.min(y, window.innerHeight - menuHeight - padding));

  return (
    <div
      id="custom-context-menu"
      ref={menuRef}
      style={{ left: `${left}px`, top: `${top}px` }}
      role="menu"
      aria-label="Menu de Ações Rápidas"
      className="fixed z-[999999] flex flex-col items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.22)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] rounded-2xl select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Símbolo: Atualizar */}
      <button
        id="context-menu-btn-refresh"
        type="button"
        role="menuitem"
        onClick={() => {
          onRefresh();
          onClose();
        }}
        title="Atualizar"
        aria-label="Atualizar"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/80 active:scale-95 transition-all duration-150 cursor-pointer group relative"
      >
        <RotateCw
          size={19}
          className="transition-transform duration-300 group-hover:rotate-180 text-blue-600 dark:text-blue-400"
        />
        {/* Subtle tooltip indicator for accessibility */}
        <span className="sr-only">Atualizar</span>
      </button>

      {/* Divisor sutil */}
      <div className="w-6 h-[1px] bg-slate-200/80 dark:bg-slate-800" />

      {/* 2. Símbolo: Página Inicial */}
      <button
        id="context-menu-btn-home"
        type="button"
        role="menuitem"
        onClick={() => {
          onHome();
          onClose();
        }}
        title="Página Inicial"
        aria-label="Página Inicial"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800/80 active:scale-95 transition-all duration-150 cursor-pointer group relative"
      >
        <Home
          size={19}
          className="transition-transform duration-200 group-hover:scale-110 text-emerald-600 dark:text-emerald-400"
        />
        <span className="sr-only">Página Inicial</span>
      </button>

      {/* Divisor sutil */}
      <div className="w-6 h-[1px] bg-slate-200/80 dark:bg-slate-800" />

      {/* 3. Símbolo: Ferramentas */}
      <button
        id="context-menu-btn-tools"
        type="button"
        role="menuitem"
        onClick={() => {
          onTools();
          onClose();
        }}
        title="Ferramentas"
        aria-label="Ferramentas"
        className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800/80 active:scale-95 transition-all duration-150 cursor-pointer group relative"
      >
        <Wrench
          size={19}
          className="transition-transform duration-200 group-hover:rotate-12 text-purple-600 dark:text-purple-400"
        />
        <span className="sr-only">Ferramentas</span>
      </button>
    </div>
  );
};
