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
  Link,
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
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WikiArticle, WikiPage, UserProfile } from '../types';
import { parseWikitext } from '../utils/wikitextParser';
import { StorageService } from '../services/storageService';

interface WikitextEditorProps {
  initialArticle?: WikiArticle | null;
  defaultPageUid?: string;
  pages: WikiPage[];
  user: UserProfile | null;
  onSave: (articleData: Partial<WikiArticle> & { titulo: string; pageUid: string; descricao: string }, editSummary: string) => Promise<void>;
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
  const [pageUid, setPageUid] = useState(initialArticle?.pageUid || defaultPageUid || pages[0]?.uid || 'metro_sp');
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
  const [resumoEdicao, setResumoEdicao] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Real-time parse for preview
  const { html } = parseWikitext(descricao);

  // Word and Char calculations
  const charCount = descricao.length;
  const wordCount = descricao.trim() ? descricao.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.ceil(wordCount / 200);

  // Insertion Helper for Wikitext toolbar
  const insertWikitext = (before: string, after: string = '', defaultPlaceholder: string = '') => {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert('Por favor, informe o título do artigo.');
      return;
    }
    if (!descricao.trim()) {
      alert('O conteúdo do artigo não pode ficar vazio.');
      return;
    }

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
          resumo: resumoEdicao || descricao.slice(0, 140) + '...',
        },
        resumoEdicao.trim() || (initialArticle ? 'Atualização de conteúdo' : 'Criação do artigo')
      );

      // Launch celebration confetti!
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
      {/* High Density Editor Header Bar */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              {initialArticle ? `Editando: ${initialArticle.titulo}` : 'Criar Novo Artigo Wikitexto'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sintaxe MediaWiki clássica com pré-visualização em tempo real e salvamento no Firestore.
            </p>
          </div>

          {/* View mode toggle & Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition ${
                  viewMode === 'edit'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Código
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition flex items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Columns size={11} /> Divisão
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition flex items-center gap-1 ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Eye size={11} /> Prévia
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
              <span>📖</span> Guia Rápido de Sintaxe MediaWiki
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

      {/* Editor Workspace (Toolbar + Split View) */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden flex flex-col">
        {/* High Density Wikitext Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 p-1.5 flex items-center gap-1 flex-wrap overflow-x-auto">
          {/* Headers */}
          <button
            type="button"
            onClick={() => insertWikitext('= ', ' =', 'Título Principal')}
            title="Título H1"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Heading1 size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('== ', ' ==', 'Seção Principal')}
            title="Seção H2"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('=== ', ' ===', 'Subseção')}
            title="Subseção H3"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Heading3 size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Formats */}
          <button
            type="button"
            onClick={() => insertWikitext("'''", "'''", 'texto em negrito')}
            title="Negrito (''')"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext("''", "''", 'texto em itálico')}
            title="Itálico ('')"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('~~', '~~', 'texto riscado')}
            title="Riscado (~~)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Strikethrough size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => insertWikitext('* ', '', 'Item da lista')}
            title="Lista com marcadores (*)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('# ', '', 'Item numerado')}
            title="Lista numerada (#)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('> ', '', 'Citação em destaque')}
            title="Citação (>)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Quote size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Links & Elements */}
          <button
            type="button"
            onClick={() => insertWikitext('[[', ']]', 'Título do Artigo')}
            title="Link Interno ([[...]])"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Link size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('![Legenda da imagem](', ')', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800')}
            title="Imagem (![alt](url))"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Image size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('`', '`', 'código')}
            title="Código inline (`)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <Code size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Infobox and Table Templates */}
          <button
            type="button"
            onClick={() =>
              insertWikitext(
                '{\n| class="wikitable"\n! Coluna 1 !! Coluna 2\n|-\n| Linha 1A || Linha 1B\n|-\n| Linha 2A || Linha 2B\n|}'
              )
            }
            title="Inserir Tabela MediaWiki"
            className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
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
            className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
          >
            <LayoutTemplate size={12} /> Infobox
          </button>
        </div>

        {/* Main Content Area: Split or Single */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 min-h-[440px]">
          {/* Editor Textarea Pane */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className={`p-3 flex flex-col ${viewMode === 'edit' ? 'col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>CÓDIGO-FONTE WIKITEXTO:</span>
                {draftSaved && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={11} /> Rascunho salvo localmente
                  </span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Escreva seu artigo aqui usando sintaxe MediaWiki..."
                className="w-full flex-1 min-h-[380px] p-2.5 text-xs font-mono-code bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Live Render Preview Pane */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`p-4 overflow-y-auto max-h-[520px] ${viewMode === 'preview' ? 'col-span-2' : ''}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1 font-mono">
                <Eye size={12} /> Pré-visualização em Tempo Real
              </div>
              <div
                className="wiki-rendered-content font-wiki-body text-xs"
                dangerouslySetInnerHTML={{ __html: html }}
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
            <span className="hidden sm:inline">
              ~{readingTimeMin} min
            </span>
          </div>

          {/* Edit summary and save button */}
          <div className="flex items-center gap-1.5 flex-1 max-w-md">
            <input
              type="text"
              value={resumoEdicao}
              onChange={(e) => setResumoEdicao(e.target.value)}
              placeholder="Resumo da edição (ex: nova seção, referências)"
              className="flex-1 px-2.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 flex-shrink-0 disabled:opacity-50 shadow-xs"
            >
              <Save size={12} />
              {isSaving ? 'Salvando...' : 'Publicar Artigo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
