import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Braces, BookOpen, Copy, Check, Plus, Eye } from 'lucide-react';
import {
  MEDIAWIKI_PREDEFINICOES,
  PREDEFINICAO_CATEGORIES,
  MediaWikiPredefinicao,
  PredefinicaoCategoryId,
} from '../utils/predefinicoesCatalog';
import { parseWikitext } from '../utils/wikitextParser';
import { sanitizeHtml } from '../utils/sanitizeHtml';

interface PredefinicoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertWikitext: (snippet: string, placement: 'block' | 'inline') => void;
}

export const PredefinicoesModal: React.FC<PredefinicoesModalProps> = ({
  isOpen,
  onClose,
  onInsertWikitext,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'guide'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<PredefinicaoCategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MediaWikiPredefinicao>(
    MEDIAWIKI_PREDEFINICOES[0]
  );
  const [editableSnippet, setEditableSnippet] = useState<string>(
    MEDIAWIKI_PREDEFINICOES[0].snippet
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditableSnippet(selectedTemplate.snippet);
  }, [selectedTemplate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MEDIAWIKI_PREDEFINICOES.filter((tpl) => {
      if (selectedCategory !== 'all' && tpl.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.summary.toLowerCase().includes(q) ||
        (tpl.aliases || []).some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const previewHtml = useMemo(() => {
    if (!editableSnippet.trim()) return '';
    try {
      const parsed = parseWikitext(editableSnippet);
      return sanitizeHtml(parsed.html);
    } catch {
      return '';
    }
  }, [editableSnippet]);

  if (!isOpen) return null;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(editableSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const handleInsert = () => {
    onInsertWikitext(editableSnippet, selectedTemplate.placement);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="predefinicoes-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
              <Braces size={16} />
            </div>
            <div className="min-w-0">
              <h2
                id="predefinicoes-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate"
              >
                Predefinições MediaWiki {'{{...}}'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Insira avisos Ambox, Navbox, hatnotes, portais, citações e blocos no padrão MediaWiki
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de predefinições"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-4 pt-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Braces size={13} />
            Catálogo ({MEDIAWIKI_PREDEFINICOES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={13} />
            Como Usar (Sintaxe MediaWiki)
          </button>
        </div>

        {activeTab === 'catalog' ? (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar: Search, Categories & Template List */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0 max-h-[38vh] md:max-h-none">
              <div className="p-3 space-y-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar predefinição (ex: Navbox, Sem-fontes)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-slate-700'
                    }`}
                  >
                    Todas
                  </button>
                  {PREDEFINICAO_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTemplates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma predefinição encontrada para "{searchQuery}".
                  </div>
                ) : (
                  filteredTemplates.map((tpl) => {
                    const isSelected = tpl.id === selectedTemplate.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl)}
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-l-2 border-l-blue-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-base leading-none mt-0.5 flex-shrink-0">
                          {tpl.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {`{{${tpl.name}}}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">
                              {tpl.placement === 'inline' ? 'Inline' : 'Bloco'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {tpl.summary}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Detail Pane: Live Preview, Editable Code & Params */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedTemplate.icon}</span>
                    <h3 className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      {`{{${selectedTemplate.name}}}`}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {selectedTemplate.summary}
                  </p>
                  {selectedTemplate.aliases && selectedTemplate.aliases.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Sinônimos:</span>
                      {selectedTemplate.aliases.map((alias) => (
                        <code
                          key={alias}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]"
                        >
                          {`{{${alias}}}`}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Eye size={12} />
                  Pré-visualização ao vivo
                </div>
                <div
                  className="p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>

              {/* Editable Wikitext */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="predefinicao-snippet-textarea"
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Código Wikitexto (personalize antes de inserir)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <textarea
                  id="predefinicao-snippet-textarea"
                  value={editableSnippet}
                  onChange={(e) => setEditableSnippet(e.target.value)}
                  rows={Math.min(8, Math.max(3, editableSnippet.split('\n').length + 1))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Parameters Table */}
              {selectedTemplate.params.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Parâmetros aceitos
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {selectedTemplate.params.map((p) => (
                      <div
                        key={p.name}
                        className="px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 bg-slate-50/50 dark:bg-slate-900/40"
                      >
                        <code className="font-mono font-semibold text-blue-700 dark:text-blue-400 sm:w-36 flex-shrink-0">
                          {p.name}
                          {p.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </code>
                        <span className="text-slate-700 dark:text-slate-300 flex-1">
                          {p.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MediaWiki Syntax Guide Tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base mb-1">
                Como funcionam as Predefinições na MediaWiki?
              </h3>
              <p className="leading-relaxed">
                Predefinições são blocos reutilizáveis invocados com chaves duplas{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                  {'{{Nome da Predefinição}}'}
                </code>
                . Elas padronizam avisos editoriais, caixas de navegação, referências e formatação em toda a enciclopédia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">1. Sem parâmetros</h4>
                <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {'{{Em construção}}\n{{Carece de fontes}}\n{{Referências}}'}
                </pre>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  2. Parâmetros posicionais (separados por |)
                </h4>
                <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {'{{Artigo principal|História do Brasil}}\n{{Portal|Ciência|Tecnologia}}\n{{Citação|Frase...|Autor|Obra}}'}
                </pre>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  3. Parâmetros nomeados (chave=valor)
                </h4>
                <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {'{{Sem-fontes|data=Abril de 2025}}\n{{Ambox|tipo=aviso|título=Atenção|texto=...}}'}
                </pre>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  4. Prefixo, valores padrão e tags de inclusão
                </h4>
                <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {'{{Predefinição:Esboço|Física}}\n{{{parâmetro|valor padrão}}}\n<noinclude>Documentação</noinclude>'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Fechar
          </button>
          {activeTab === 'catalog' && (
            <button
              type="button"
              onClick={handleInsert}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={14} />
              Inserir no Editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
