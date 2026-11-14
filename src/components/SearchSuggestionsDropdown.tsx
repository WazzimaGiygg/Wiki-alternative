import React from 'react';
import { SearchSuggestItem } from '../services/fullTextSearchService';
import { BookOpen, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

interface SearchSuggestionsDropdownProps {
  isOpen: boolean;
  query: string;
  suggestions: SearchSuggestItem[];
  selectedIndex: number;
  onSelectSuggestion: (item: SearchSuggestItem) => void;
  onSelectAllResults: () => void;
  onClose: () => void;
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  isOpen,
  query,
  suggestions,
  selectedIndex,
  onSelectSuggestion,
  onSelectAllResults,
  onClose,
}) => {
  if (!isOpen || !query.trim()) return null;

  const cleanQuery = query.trim();

  // Helper to highlight matching letters in titles
  const highlightMatches = (text: string, term: string) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 not-prose"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {suggestions.length > 0 ? (
          <div>
            <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Sugestões Instantâneas ({suggestions.length})</span>
              <span className="flex items-center gap-1 font-normal lowercase text-[9px]">
                <CornerDownLeft size={10} /> enter para abrir
              </span>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={item.id}
                    onClick={() => onSelectSuggestion(item)}
                    className={`px-3 py-2 cursor-pointer transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <BookOpen
                      size={15}
                      className={`shrink-0 mt-0.5 ${
                        isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs truncate">
                          {highlightMatches(item.titulo, cleanQuery)}
                        </span>
                        {item.categoria && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0">
                            {item.categoria}
                          </span>
                        )}
                      </div>
                      {item.snippet && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-sans leading-tight">
                          {highlightMatches(item.snippet, cleanQuery)}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum artigo com o termo exato.
          </div>
        )}

        {/* Action footer */}
        <div className="p-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={onSelectAllResults}
            className="flex-1 text-left px-2 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/60 transition flex items-center justify-between group cursor-pointer"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles size={12} className="text-amber-500" />
              <span>Ver todos os resultados para <strong>"{cleanQuery}"</strong></span>
            </span>
            <ArrowRight size={13} className="shrink-0 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
