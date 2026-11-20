import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Braces,
  BookOpen,
  Copy,
  Check,
  Plus,
  Eye,
  Layers,
  Pencil,
  Trash2,
  Save,
  Sparkles,
} from 'lucide-react';
import {
  MEDIAWIKI_PREDEFINICOES,
  PREDEFINICAO_CATEGORIES,
  MediaWikiPredefinicao,
  PredefinicaoCategoryId,
} from '../utils/predefinicoesCatalog';
import { parseWikitext } from '../utils/wikitextParser';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { TemplateService } from '../services/templateService';
import { UserProfile, WikiTemplate } from '../types';

interface PredefinicoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  onInsertWikitext: (snippet: string, placement: 'block' | 'inline') => void;
}

const CUSTOM_TEMPLATE_CATEGORIES = [
  'Formatação',
  'Caixas',
  'Avisos',
  'Tabelas',
  'Navegação',
  'Geral',
];

export const PredefinicoesModal: React.FC<PredefinicoesModalProps> = ({
  isOpen,
  onClose,
  user,
  onInsertWikitext,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom' | 'guide'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<PredefinicaoCategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MediaWikiPredefinicao>(
    MEDIAWIKI_PREDEFINICOES[0]
  );
  const [editableSnippet, setEditableSnippet] = useState<string>(
    MEDIAWIKI_PREDEFINICOES[0].snippet
  );
  const [copied, setCopied] = useState(false);

  // Estado das Predefinições Personalizadas (TemplateService)
  const [customTemplates, setCustomTemplates] = useState<WikiTemplate[]>(() =>
    TemplateService.getCachedTemplatesSync().filter(
      (t) => !TemplateService.isBuiltInParserTemplate(t.name)
    )
  );
  const [customSearch, setCustomSearch] = useState('');
  const [selectedCustom, setSelectedCustom] = useState<WikiTemplate | null>(null);
  const [customInvocationSnippet, setCustomInvocationSnippet] = useState('');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Formatação');
  const [formDescription, setFormDescription] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setEditableSnippet(selectedTemplate.snippet);
  }, [selectedTemplate]);

  useEffect(() => {
    if (!isOpen) return;
    const syncList = (list: WikiTemplate[]) => {
      const filtered = list.filter((t) => !TemplateService.isBuiltInParserTemplate(t.name));
      setCustomTemplates(filtered);
      setSelectedCustom((prev) => {
        if (!prev) return filtered[0] || null;
        return filtered.find((t) => t.id === prev.id) || filtered[0] || null;
      });
    };

    const unsubscribe = TemplateService.subscribe(syncList);
    TemplateService.refreshFromFirestore(true)
      .then(syncList)
      .catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (selectedCustom) {
      setCustomInvocationSnippet(TemplateService.buildInvocationSnippet(selectedCustom));
    } else {
      setCustomInvocationSnippet('');
    }
  }, [selectedCustom]);

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

  const filteredCustomTemplates = useMemo(() => {
    const q = customSearch.trim().toLowerCase();
    if (!q) return customTemplates;
    return customTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
    );
  }, [customTemplates, customSearch]);

  const previewHtml = useMemo(() => {
    if (!editableSnippet.trim()) return '';
    try {
      const parsed = parseWikitext(editableSnippet, undefined, undefined, customTemplates);
      return sanitizeHtml(parsed.html);
    } catch {
      return '';
    }
  }, [editableSnippet, customTemplates]);

  const customPreviewHtml = useMemo(() => {
    if (isEditingCustom) {
      if (!formContent.trim()) return '';
      const draftTpl: WikiTemplate = {
        id: editingId || 'draft-preview',
        name: formName.trim() || 'PreviaModelo',
        content: formContent,
        description: formDescription,
        category: formCategory,
        parameters: TemplateService.extractParameters(formContent),
        createdAt: '',
        updatedAt: '',
      };
      const sampleCall = TemplateService.buildInvocationSnippet(draftTpl);
      try {
        const parsed = parseWikitext(sampleCall, undefined, undefined, [
          ...customTemplates.filter((t) => t.id !== draftTpl.id),
          draftTpl,
        ]);
        return sanitizeHtml(parsed.html);
      } catch {
        return '';
      }
    }

    if (!customInvocationSnippet.trim()) return '';
    try {
      const parsed = parseWikitext(customInvocationSnippet, undefined, undefined, customTemplates);
      return sanitizeHtml(parsed.html);
    } catch {
      return '';
    }
  }, [
    isEditingCustom,
    formName,
    formContent,
    formDescription,
    formCategory,
    editingId,
    customInvocationSnippet,
    customTemplates,
  ]);

  if (!isOpen) return null;

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const handleInsertCatalog = () => {
    onInsertWikitext(editableSnippet, selectedTemplate.placement);
    onClose();
  };

  const handleInsertCustom = () => {
    if (!customInvocationSnippet.trim()) return;
    onInsertWikitext(customInvocationSnippet, 'block');
    onClose();
  };

  const startCreateCustom = () => {
    setEditingId(null);
    setFormName('');
    setFormCategory('Formatação');
    setFormDescription('');
    setFormContent(
      "{{Nota|'''{{{título|{{{1|Título do Bloco}}}}}}''' — {{{texto|{{{2|Escreva a mensagem aqui.}}}}}}}"
    );
    setFormError(null);
    setIsEditingCustom(true);
  };

  const startEditCustom = (tpl: WikiTemplate) => {
    setEditingId(tpl.id);
    setFormName(tpl.name);
    setFormCategory(tpl.category || 'Geral');
    setFormDescription(tpl.description || '');
    setFormContent(tpl.content);
    setFormError(null);
    setIsEditingCustom(true);
  };

  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);
    try {
      let saved: WikiTemplate;
      if (editingId) {
        saved = await TemplateService.updateTemplate(editingId, {
          name: formName,
          category: formCategory,
          description: formDescription,
          content: formContent,
        });
      } else {
        saved = await TemplateService.createTemplate({
          name: formName,
          category: formCategory,
          description: formDescription,
          content: formContent,
          authorUid: user?.uid,
          authorName: user?.displayName || user?.username || undefined,
        });
      }
      setSelectedCustom(saved);
      setIsEditingCustom(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar predefinição.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    try {
      await TemplateService.deleteTemplate(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao excluir predefinição.');
    }
  };

  const canModifyTemplate = (tpl: WikiTemplate) => {
    if (!user) return true; // Permite gerenciamento no cache local mesmo deslogado
    if (user.role === 'admin' || user.role === 'moderador') return true;
    if (!tpl.authorUid || tpl.authorUid === 'anonymous') return true;
    return tpl.authorUid === user.uid;
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
                Use predefinições nativas ou crie modelos reutilizáveis com expansão dinâmica {'{{Nome|parâmetro}}'}
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
        <div className="px-4 pt-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Braces size={13} />
            Nativas ({MEDIAWIKI_PREDEFINICOES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'custom'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            Personalizadas ({customTemplates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={13} />
            Como Usar
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
                    onClick={() => handleCopyText(editableSnippet)}
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
        ) : activeTab === 'custom' ? (
          /* Custom User Templates Tab (TemplateService CRUD + Live Transclusion) */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar: Custom Templates List */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0 max-h-[38vh] md:max-h-none">
              <div className="p-3 space-y-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={startCreateCustom}
                  className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus size={14} />
                  Nova Predefinição Personalizada
                </button>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={customSearch}
                    onChange={(e) => setCustomSearch(e.target.value)}
                    placeholder="Filtrar modelos criados..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredCustomTemplates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <p>Nenhuma predefinição personalizada encontrada.</p>
                    <button
                      type="button"
                      onClick={startCreateCustom}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Criar primeira predefinição
                    </button>
                  </div>
                ) : (
                  filteredCustomTemplates.map((tpl) => {
                    const isSelected = !isEditingCustom && selectedCustom?.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setIsEditingCustom(false);
                          setSelectedCustom(tpl);
                          setConfirmDeleteId(null);
                        }}
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-l-2 border-l-blue-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Sparkles size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {`{{${tpl.name}}}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">
                              {tpl.category || 'Geral'}
                            </span>
                          </div>
                          {tpl.description && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {tpl.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Create/Edit Form OR Selected Custom Template Preview */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
              {isEditingCustom ? (
                <form onSubmit={handleSaveCustom} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {editingId ? 'Editar Predefinição' : 'Criar Nova Predefinição'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingCustom(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  {formError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Nome da Predefinição *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: FichaTécnica ou DicaRápida"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Categoria
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CUSTOM_TEMPLATE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Descrição curta
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Explique quando usar este modelo..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Conteúdo Wikitexto da Predefinição * (use {'{{{1|padrão}}}'} ou {'{{{param|padrão}}}'})
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="{{Nota|'''{{{título|{{{1|Título}}}}}}''' — {{{texto|{{{2|Conteúdo}}}}}}}"
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Parâmetros detectados:{' '}
                      {TemplateService.extractParameters(formContent).length > 0
                        ? TemplateService.extractParameters(formContent)
                            .map((p) => `{{{${p}}}}`)
                            .join(', ')
                        : 'nenhum (modelo estático)'}
                    </p>
                  </div>

                  {/* Live Preview of Draft Template */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Eye size={12} />
                      Pré-visualização da expansão
                    </div>
                    <div
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: customPreviewHtml }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustom(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formSaving}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save size={13} />
                      {formSaving ? 'Salvando...' : 'Salvar Predefinição'}
                    </button>
                  </div>
                </form>
              ) : selectedCustom ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {`{{${selectedCustom.name}}}`}
                      </h3>
                      {selectedCustom.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {selectedCustom.description}
                        </p>
                      )}
                      {selectedCustom.authorName && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Criado por {selectedCustom.authorName} • Categoria: {selectedCustom.category || 'Geral'}
                        </p>
                      )}
                    </div>
                    {canModifyTemplate(selectedCustom) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditCustom(selectedCustom)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        {confirmDeleteId === selectedCustom.id ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(selectedCustom.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                          >
                            Confirmar exclusão
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(selectedCustom.id)}
                            className="px-2 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live Preview of Expanded Template */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Eye size={12} />
                      Pré-visualização no ArticleViewer
                    </div>
                    <div
                      className="p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: customPreviewHtml }}
                    />
                  </div>

                  {/* Editable Invocation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Chamada Wikitexto (personalize os parâmetros antes de inserir)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleCopyText(customInvocationSnippet)}
                        className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <textarea
                      value={customInvocationSnippet}
                      onChange={(e) => setCustomInvocationSnippet(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Underlying Template Definition */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Código-fonte da Predefinição
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {selectedCustom.content}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-xs text-slate-500 dark:text-slate-400 space-y-3">
                  <Layers size={28} className="text-slate-300 dark:text-slate-600" />
                  <p>Selecione uma predefinição ao lado ou crie um novo modelo reutilizável.</p>
                  <button
                    type="button"
                    onClick={startCreateCustom}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                  >
                    Criar Predefinição
                  </button>
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
                Predefinições são modelos reutilizáveis invocados com chaves duplas{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                  {'{{NomeDaPredefinição|parâmetro}}'}
                </code>
                . Você pode usar as predefinições nativas ou criar suas próprias na aba{' '}
                <strong>Personalizadas</strong> — o <code>ArticleViewer</code> expande tudo automaticamente.
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
                  {'{{Dica|Atenção|Sempre cite fontes confiáveis.}}\n{{Cartão|Resumo|Texto explicativo}}'}
                </pre>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  3. Parâmetros nomeados (chave=valor)
                </h4>
                <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {'{{Dica|título=Boas práticas|texto=Use links internos.}}\n{{Ambox|tipo=aviso|título=Atenção|texto=...}}'}
                </pre>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  4. Criando seu próprio modelo reutilizável
                </h4>
                <pre className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {'{{{1|valor padrão}}} — 1º parâmetro posicional\n{{{título|Sem título}}} — parâmetro nomeado\n<noinclude>Só aparece na documentação</noinclude>'}
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
              onClick={handleInsertCatalog}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={14} />
              Inserir no Editor
            </button>
          )}
          {activeTab === 'custom' && !isEditingCustom && selectedCustom && (
            <button
              type="button"
              onClick={handleInsertCustom}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={14} />
              Inserir {`{{${selectedCustom.name}}}`} no Editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
