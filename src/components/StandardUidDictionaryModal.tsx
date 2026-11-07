/**
 * @file src/components/StandardUidDictionaryModal.tsx
 * @description Modal de Dicionário e Consulta da Aplicação Primária de UIDs (4.1.1.54.7)
 * Permite aos editores, pesquisadores e burocratas inspecionar e copiar todos os 161 UIDs padronizados
 * (1.0.0-BD.001 a 1.0.0-WZ.161) e navegar diretamente aos recursos vinculados.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  X,
  Filter,
  Tag,
  Hash,
  Database,
  Layers,
  FileCode,
  Shield,
  Palette,
  GitCommit,
  BarChart2,
} from 'lucide-react';
import {
  STANDARD_UID_LIST,
  StandardUidEntry,
  StandardUidCategory,
} from '../utils/standardUidRegistry';
import { ViewMode } from '../types';

interface StandardUidDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView?: (view: ViewMode, initialTab?: string) => void;
}

export const StandardUidDictionaryModal: React.FC<StandardUidDictionaryModalProps> = ({
  isOpen,
  onClose,
  onNavigateToView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const categories: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todos (161)', icon: <Hash size={13} /> },
    { key: 'database', label: 'Bancos & Auth', icon: <Database size={13} /> },
    { key: 'frontend', label: 'Frontend & UI', icon: <Layers size={13} /> },
    { key: 'backend', label: 'Backend & Servidor', icon: <FileCode size={13} /> },
    { key: 'feature', label: 'Recursos & Módulos', icon: <Tag size={13} /> },
    { key: 'commit', label: 'Commits & Histórico', icon: <GitCommit size={13} /> },
    { key: 'metric', label: 'Métricas & Dados', icon: <BarChart2 size={13} /> },
    { key: 'theme', label: 'Temas', icon: <Palette size={13} /> },
    { key: 'legal', label: 'Legal & Governança', icon: <Shield size={13} /> },
  ];

  const filteredEntries = useMemo(() => {
    return STANDARD_UID_LIST.filter((entry) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'database' && !['database', 'auth', 'rules', 'config'].includes(entry.category)) {
          return false;
        }
        if (selectedCategory === 'frontend' && entry.category !== 'frontend') {
          return false;
        }
        if (selectedCategory === 'backend' && entry.category !== 'backend') {
          return false;
        }
        if (selectedCategory === 'feature' && entry.category !== 'feature') {
          return false;
        }
        if (selectedCategory === 'commit' && entry.category !== 'commit') {
          return false;
        }
        if (selectedCategory === 'metric' && !['metric', 'quote', 'comparison'].includes(entry.category)) {
          return false;
        }
        if (selectedCategory === 'theme' && entry.category !== 'theme') {
          return false;
        }
        if (selectedCategory === 'legal' && entry.category !== 'legal') {
          return false;
        }
      }

      // Search term filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        entry.uid.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        (entry.description && entry.description.toLowerCase().includes(q))
      );
    });
  }, [searchTerm, selectedCategory]);

  const handleCopy = (uid: string) => {
    navigator.clipboard?.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => {
      setCopiedUid((cur) => (cur === uid ? null : cur));
    }, 2000);
  };

  const handleNavigate = (entry: StandardUidEntry) => {
    if (entry.targetView && onNavigateToView) {
      onNavigateToView(entry.targetView, entry.targetTab);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="standard-uid-dict-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Hash size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="standard-uid-dict-title" className="text-sm font-bold">
                  Dicionário Oficial de UIDs Padronizados
                </h2>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
                  4.1.1.54.7
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identificação padronizada por trás de cada informação na plataforma (161 registros)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por UID (ex: 1.0.0-BD.001), nome (ex: React) ou termo..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2.5 py-1 rounded-lg font-medium shrink-0 flex items-center gap-1.5 transition cursor-pointer text-[11px] ${
                  selectedCategory === cat.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table / List Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>
              Exibindo <strong>{filteredEntries.length}</strong> de {STANDARD_UID_LIST.length} identificadores
            </span>
            <span className="font-mono text-[10px]">Padrão: 1.0.0-XX.YYY</span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum UID encontrado para a busca &quot;{searchTerm}&quot;.
              </div>
            ) : (
              filteredEntries.map((item) => {
                const isCopied = copiedUid === item.uid;
                return (
                  <div
                    key={item.uid}
                    data-uid={item.uid}
                    className="p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 shrink-0">
                          {item.uid}
                        </span>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                          {item.name}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.uid)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                        title="Copiar UID"
                      >
                        {isCopied ? <Check size={11} /> : <Copy size={11} />}
                        <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>

                      {item.targetView && onNavigateToView && (
                        <button
                          type="button"
                          onClick={() => handleNavigate(item)}
                          className="px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                          title="Ir para a tela do recurso"
                        >
                          <span>Acessar</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Total de 161 identificadores padronizados registrados</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer text-slate-700 dark:text-slate-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
