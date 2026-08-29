import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image,
  Code,
  Quote,
  Table,
  LayoutTemplate,
  Save,
  X,
  Eye,
  Columns,
  Sparkles,
  HelpCircle,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WikiArticle, WikiPage, UserProfile } from '../types';
import { parseWikitext } from '../utils/wikitextParser';
import { StorageService } from '../services/storageService';
import { SaveReasonModal } from './SaveReasonModal';
import { htmlToWikitext } from '../utils/wikitextConverters';

interface WikitextEditorProps {
  initialArticle?: WikiArticle | null;
  defaultPageUid?: string;
  pages: WikiPage[];
  user: UserProfile | null;
  onSave: (
    articleData: Partial<WikiArticle> & { titulo: string; pageUid: string; descricao: string },
    editSummary: string,
    isMinor?: boolean
  ) => Promise<void>;
  onCancel: () => void;
}

export const WikitextEditor: React.FC<WikitextEditorProps> = ({
  initialArticle,
  defaultPageUid,
  pages,
  user,
  onSave,
  onCancel,
}) => {
  const [titulo, setTitulo] = useState(initialArticle?.titulo || '');
  const [pageUid, setPageUid] = useState(
    initialArticle?.pageUid || defaultPageUid || pages[0]?.uid || 'metro_sp'
  );
  const [categoria, setCategoria] = useState(initialArticle?.categoria || 'Geral');
  const [idioma, setIdioma] = useState(initialArticle?.idioma || 'Português');
  const [descricao, setDescricao] = useState(
    initialArticle?.descricao ||
      `= Título da Página =
Este é o início do seu novo artigo enciclopédico na '''WikiZero'''.

== Introdução ==
Escreva aqui o contexto e os principais conceitos. Utilize a sintaxe MediaWiki para formatar o texto.

== Características ==
* Primeiro ponto com marcadores
* Segundo ponto importante

== Veja Também ==
* [[História do Metrô de São Paulo|Artigo Relacionado]]`
  );

  // View modes: 'visual' (Formatted Page) | 'edit' (Raw Wikitext Code) | 'split' (50/50) | 'preview'
  const [viewMode, setViewMode] = useState<'visual' | 'edit' | 'split' | 'preview'>('visual');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);

  // Auto-save draft in localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (titulo || descricao) {
        StorageService.saveDraft({ title: titulo, content: descricao, pageUid });
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [titulo, descricao, pageUid]);

  // Real-time parse for preview and visual editor initial HTML
  const { html: renderedHtml } = parseWikitext(descricao);

  // Sync HTML into visual editor when entering visual mode
  useEffect(() => {
    if (viewMode === 'visual' && visualEditorRef.current) {
      if (visualEditorRef.current.innerHTML !== renderedHtml) {
        visualEditorRef.current.innerHTML = renderedHtml;
      }
    }
  }, [viewMode]);

  // Word and Char calculations
  const charCount = descricao.length;
  const previousLength = initialArticle?.descricao ? initialArticle.descricao.length : 0;
  const wordCount = descricao.trim() ? descricao.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Insertion Helper for Code Editor
  const insertWikitext = (before: string, after: string = '', defaultPlaceholder: string = '') => {
    if (viewMode === 'visual') {
      // Apply in visual mode via document.execCommand
      if (before === "'''") {
        document.execCommand('bold', false);
      } else if (before === "''") {
        document.execCommand('italic', false);
      } else if (before === '~~') {
        document.execCommand('strikeThrough', false);
      } else if (before.startsWith('= ')) {
        document.execCommand('formatBlock', false, 'h1');
      } else if (before.startsWith('== ')) {
        document.execCommand('formatBlock', false, 'h2');
      } else if (before.startsWith('=== ')) {
        document.execCommand('formatBlock', false, 'h3');
      } else if (before.startsWith('* ')) {
        document.execCommand('insertUnorderedList', false);
      } else if (before.startsWith('# ')) {
        document.execCommand('insertOrderedList', false);
      } else if (before.startsWith('> ')) {
        document.execCommand('formatBlock', false, 'blockquote');
      } else if (before.startsWith('[[')) {
        const linkTarget = prompt('Digite o título do artigo interno para o link:', 'Metropolitano de São Paulo');
        if (linkTarget) {
          document.execCommand('createLink', false, `#wiki/${encodeURIComponent(linkTarget)}`);
        }
      } else {
        // Generic insertion in visual editor
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const node = document.createTextNode(`${before}${defaultPlaceholder}${after}`);
          range.insertNode(node);
        }
      }
      handleVisualEditorInput();
      return;
    }

    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = descricao.substring(start, end) || defaultPlaceholder;

    const replacement = `${before}${selected}${after}`;
    const nextContent = descricao.substring(0, start) + replacement + descricao.substring(end);

    setDescricao(nextContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  // Handler for visual editor changes
  const handleVisualEditorInput = () => {
    if (!visualEditorRef.current) return;
    const newHtml = visualEditorRef.current.innerHTML;
    const convertedWikitext = htmlToWikitext(newHtml);
    if (convertedWikitext) {
      setDescricao(convertedWikitext);
    }
  };

  const handleOpenSaveModal = () => {
    if (!titulo.trim()) {
      alert('Por favor, informe o título do artigo antes de salvar.');
      return;
    }
    if (!descricao.trim()) {
      alert('O conteúdo do artigo não pode ficar vazio.');
      return;
    }

    // Sync any pending changes from visual editor
    if (viewMode === 'visual' && visualEditorRef.current) {
      handleVisualEditorInput();
    }

    setShowSaveModal(true);
  };

  const handleConfirmSave = async (editSummary: string, isMinor: boolean) => {
    setIsSaving(true);
    try {
      await onSave(
        {
          id: initialArticle?.id,
          titulo: titulo.trim(),
          pageUid,
          categoria,
          idioma,
          descricao,
          resumo: editSummary || descricao.slice(0, 140) + '...',
        },
        editSummary,
        isMinor
      );

      // Launch celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }

      StorageService.clearDraft();
    } catch (err) {
      console.error('Erro ao salvar artigo:', err);
      alert('Ocorreu um erro ao salvar o artigo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3 animate-in fade-in select-none">
      {/* Save Reason Modal (Mandatory on save) */}
      <SaveReasonModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleConfirmSave}
        isNewArticle={!initialArticle}
        currentTitle={titulo}
        previousLength={previousLength}
        newLength={descricao.length}
        user={user}
      />

      {/* Editor Header Bar */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              {initialArticle ? `Editando: ${initialArticle.titulo}` : 'Criar Novo Artigo'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Alterne livremente entre o <strong>Editor de Código Wikitexto</strong> e a <strong>Página Formatada (Visual)</strong>.
            </p>
          </div>

          {/* View mode toggle & Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Primary Mode Toggle: Visual vs Code vs Split vs Preview */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setViewMode('visual');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                  viewMode === 'visual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
                }`}
                title="Editor Visual / Página Formatada"
              >
                <FileText size={13} />
                <span>Página Formatada</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                  viewMode === 'edit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
                }`}
                title="Código-Fonte MediaWiki"
              >
                <FileCode size={13} />
                <span>Código Wikitexto</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`hidden md:flex px-2 py-1 text-xs font-semibold rounded transition items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Código e Prévia lado a lado"
              >
                <Columns size={12} /> Divisão
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 text-xs font-semibold rounded transition flex items-center gap-1 ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Prévia Completa"
              >
                <Eye size={12} /> Prévia
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1"
            >
              <HelpCircle size={13} />
              <span className="hidden sm:inline">Ajuda</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* High Density Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 font-mono">
              Título do Artigo *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Metropolitano de São Paulo"
              className="w-full px-2.5 py-1 text-xs rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 font-mono">
              Coleção / Tópico *
            </label>
            <select
              value={pageUid}
              onChange={(e) => setPageUid(e.target.value)}
              className="w-full px-2.5 py-1 text-xs rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {pages.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.titulo} ({p.uid})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MediaWiki Quick Cheat Sheet Accordion */}
      {showCheatSheet && (
        <div className="bg-[#fffdf0] dark:bg-[#1a1708] border border-[#eaddc5] dark:border-[#52441a] rounded p-3 text-xs text-[#855e00] dark:text-[#e0c46b] space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#eaddc5] dark:border-[#52441a] pb-1">
            <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1 font-mono">
              <span>📖</span> Guia Rápido de Sintaxe Wikitexto & Edição Visual
            </h3>
            <button
              onClick={() => setShowCheatSheet(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[10px]">
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Cabeçalhos:</span>
              <div>= Título 1 =</div>
              <div>== Seção 2 ==</div>
              <div>=== Subseção 3 ===</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Estilo:</span>
              <div>'''Negrito'''</div>
              <div>''Itálico''</div>
              <div>~~Riscado~~</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Links:</span>
              <div>[[Nome do Artigo]]</div>
              <div>[[Destino|Texto visível]]</div>
              <div>[http://url link externo]</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Listas:</span>
              <div>* Item com marcador</div>
              <div># Item numerado</div>
              <div>&gt; Citação</div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Workspace */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden flex flex-col">
        {/* Formatting Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 p-1.5 flex items-center gap-1 flex-wrap overflow-x-auto">
          {/* Headers */}
          <button
            type="button"
            onClick={() => insertWikitext('= ', ' =', 'Título Principal')}
            title="Título Principal (H1)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-semibold"
          >
            <Heading1 size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('== ', ' ==', 'Seção Principal')}
            title="Seção Principal (H2)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-semibold"
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('=== ', ' ===', 'Subseção')}
            title="Subseção (H3)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-semibold"
          >
            <Heading3 size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Inline Formats */}
          <button
            type="button"
            onClick={() => insertWikitext("'''", "'''", 'texto em negrito')}
            title="Negrito (''')"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext("''", "''", 'texto em itálico')}
            title="Itálico ('')"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('~~', '~~', 'texto riscado')}
            title="Riscado (~~)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Strikethrough size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => insertWikitext('* ', '', 'Item com marcador')}
            title="Lista com marcadores (*)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('# ', '', 'Item numerado')}
            title="Lista numerada (#)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('> ', '', 'Citação em destaque')}
            title="Citação em destaque (>)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Quote size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Links & Blocks */}
          <button
            type="button"
            onClick={() => insertWikitext('[[', ']]', 'Título do Artigo')}
            title="Link Interno ([[...]])"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <LinkIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() =>
              insertWikitext(
                '![Legenda da imagem](',
                ')',
                'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'
              )
            }
            title="Imagem (![alt](url))"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Image size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('`', '`', 'código')}
            title="Código inline (`)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Code size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Infobox & Table Templates */}
          <button
            type="button"
            onClick={() =>
              insertWikitext(
                '{\n| class="wikitable"\n! Coluna 1 !! Coluna 2\n|-\n| Linha 1A || Linha 1B\n|-\n| Linha 2A || Linha 2B\n|}'
              )
            }
            title="Inserir Tabela MediaWiki"
            className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
          >
            <Table size={12} /> Tabela
          </button>
          <button
            type="button"
            onClick={() =>
              insertWikitext(
                '{{Infobox\n| Nome = ' +
                  (titulo || 'Título') +
                  '\n| Campo 1 = Informação 1\n| Campo 2 = Informação 2\n}}'
              )
            }
            title="Inserir Caixa de Informações (Infobox)"
            className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
          >
            <LayoutTemplate size={12} /> Infobox
          </button>
        </div>

        {/* Content Editing Canvas */}
        <div className="min-h-[440px] flex flex-col">
          {/* 1. VISUAL FORMATTED PAGE MODE (WYSIWYG) */}
          {viewMode === 'visual' && (
            <div className="p-4 sm:p-6 flex-1 flex flex-col bg-white dark:bg-slate-950">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                  <FileText size={13} /> MODO PÁGINA FORMATADA (EDIÇÃO VISUAL DIRETA)
                </span>
                {draftSaved && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={11} /> Rascunho salvo
                  </span>
                )}
              </div>

              {/* Editable Formatted Page */}
              <div
                ref={visualEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleVisualEditorInput}
                onBlur={handleVisualEditorInput}
                className="wiki-rendered-content font-wiki-body text-xs flex-1 min-h-[380px] p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-y-auto leading-relaxed"
              />
            </div>
          )}

          {/* 2. RAW WIKITEXT CODE MODE */}
          {viewMode === 'edit' && (
            <div className="p-3 flex-1 flex flex-col bg-white dark:bg-slate-950">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>CÓDIGO-FONTE WIKITEXTO:</span>
                {draftSaved && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={11} /> Rascunho salvo
                  </span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Escreva seu artigo aqui usando sintaxe MediaWiki..."
                className="w-full flex-1 min-h-[380px] p-3 text-xs font-mono-code bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed"
              />
            </div>
          )}

          {/* 3. SPLIT VIEW (CODE + LIVE PREVIEW) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 flex-1">
              <div className="p-3 flex flex-col">
                <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                  <span>CÓDIGO-FONTE:</span>
                  {draftSaved && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Salvo</span>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full flex-1 min-h-[380px] p-2.5 text-xs font-mono-code bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 overflow-y-auto max-h-[520px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1 font-mono">
                  <Eye size={12} /> Pré-visualização em Tempo Real
                </div>
                <div
                  className="wiki-rendered-content font-wiki-body text-xs"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            </div>
          )}

          {/* 4. FULL PREVIEW MODE */}
          {viewMode === 'preview' && (
            <div className="p-6 overflow-y-auto max-h-[600px] bg-white dark:bg-slate-950">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1 font-mono">
                <Eye size={12} /> Pré-visualização Completa da Página
              </div>
              <div
                className="wiki-rendered-content font-wiki-body text-xs"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          )}
        </div>

        {/* High Density Bottom Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live statistics */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>
              Palavras: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong>
            </span>
            <span>
              Bytes: <strong className="text-slate-800 dark:text-slate-200">{charCount}</strong>
            </span>
            <span className="hidden sm:inline">~{readingTimeMin} min de leitura</span>
          </div>

          {/* Save Button with Mandatory Reason Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSaveModal}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 shadow-xs"
            >
              <Save size={13} />
              {isSaving ? 'Salvando...' : 'Salvar e Publicar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
