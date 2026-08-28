import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3,
  Share2,
  Printer,
  History,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  Type,
  List,
  Eye,
  Calendar,
  User,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  FileCode,
  BookOpen,
  Copy,
} from 'lucide-react';
import { WikiArticle, WikiPage, UserProfile } from '../types';
import { parseWikitext, TocItem } from '../utils/wikitextParser';

interface ArticleViewerProps {
  article: WikiArticle;
  page?: WikiPage | null;
  user: UserProfile | null;
  onEdit: (article: WikiArticle) => void;
  onDelete: (articleId: string) => void;
  onNavigateToPage: (pageUid: string) => void;
  onNavigateToArticleByTitle: (title: string) => void;
  onBack: () => void;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({
  article,
  page,
  user,
  onEdit,
  onDelete,
  onNavigateToPage,
  onNavigateToArticleByTitle,
  onBack,
}) => {
  const [fontSize, setFontSize] = useState<number>(15);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [activeTab, setActiveTab] = useState<'article' | 'source' | 'info'>('article');
  const [sourceCopied, setSourceCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse wikitext
  const { html, toc } = parseWikitext(article.descricao);

  // Intercept internal wiki links
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-wiki-target]');
      if (target) {
        e.preventDefault();
        const wikiTarget = target.getAttribute('data-wiki-target');
        if (wikiTarget) {
          onNavigateToArticleByTitle(wikiTarget);
        }
      }
    };

    el.addEventListener('click', handleLinkClick);
    return () => el.removeEventListener('click', handleLinkClick);
  }, [article.descricao, onNavigateToArticleByTitle]);

  // Handle Speech Reader
  const toggleSpeech = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!window.speechSynthesis) {
      alert('Seu navegador não suporta sintetizador de voz nativo.');
      return;
    }

    window.speechSynthesis.cancel();
    // Strip wikitext symbols for clean speech
    const cleanText = `${article.titulo}. ${article.descricao.replace(/[\=\*\[\]\#\{\}\|]/g, ' ')}`;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = article.idioma === 'Português' ? 'pt-BR' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [article.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySource = () => {
    navigator.clipboard.writeText(article.descricao);
    setSourceCopied(true);
    setTimeout(() => setSourceCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([`# ${article.titulo}\n\n${article.descricao}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.titulo.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(article, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.titulo.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in select-none">
      {/* High Density Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 flex-wrap">
          <button
            onClick={onBack}
            className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-semibold"
          >
            <ArrowLeft size={13} /> Principal
          </button>
          <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
          {page && (
            <>
              <button
                onClick={() => onNavigateToPage(page.uid)}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
              >
                {page.titulo}
              </button>
              <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
            </>
          )}
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
            {article.titulo}
          </span>
        </div>

        {/* High Density Toolbar Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(article)}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow-xs"
          >
            <Edit3 size={12} />
            Editar
          </button>

          <button
            onClick={toggleSpeech}
            title={isPlayingAudio ? 'Parar leitura por voz' : 'Ouvir artigo por voz'}
            className={`p-1 rounded border border-slate-200 dark:border-slate-700 transition ${
              isPlayingAudio
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isPlayingAudio ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <button
            onClick={handleShare}
            title="Copiar link do artigo"
            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
          </button>

          <button
            onClick={handlePrint}
            title="Imprimir artigo"
            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:block"
          >
            <Printer size={13} />
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            title="Histórico de revisões"
            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <History size={13} />
          </button>

          <button
            onClick={handleExportMarkdown}
            title="Exportar Markdown"
            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:block"
          >
            <Download size={13} />
          </button>

          {user && (
            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir o artigo "${article.titulo}"?`)) {
                  onDelete(article.id);
                }
              }}
              title="Excluir artigo"
              className="p-1 rounded border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* High Density Article Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('article')}
          className={`px-3 py-1.5 border-b-2 transition ${
            activeTab === 'article'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Artigo
        </button>
        <button
          onClick={() => setActiveTab('source')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1 ${
            activeTab === 'source'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode size={13} /> Ver Código-Fonte
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-1.5 border-b-2 transition ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Informações da Página
        </button>
      </div>

      {/* Main Article Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Article Content Pane (3 columns) */}
        <article className="lg:col-span-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-7 shadow-xs">
          {activeTab === 'article' && (
            <>
              {/* Article Header */}
              <header className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {article.categoria || 'Geral'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Versão {article.versao || 1}.0
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-normal font-serif-heading text-slate-900 dark:text-white leading-tight">
                  {article.titulo}
                </h1>

                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <User size={11} />
                    <span>Autor: <strong className="text-slate-700 dark:text-slate-300">{article.autor || 'Anônimo'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={11} />
                    <span>Atualizado: {new Date(article.dataEdicao || article.dataCriacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={11} />
                    <span>{article.visualizacoes || 1} visualizações</span>
                  </div>
                </div>

                {/* Reading font adjuster */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Type size={11} /> TAMANHO:
                  </span>
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {[14, 15, 17, 19].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition ${
                          fontSize === s
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {s === 14 ? 'A-' : s === 15 ? 'A' : s === 17 ? 'A+' : 'A++'}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              {/* Rendered HTML Content */}
              <div
                ref={contentRef}
                style={{ fontSize: `${fontSize}px` }}
                className="wiki-rendered-content font-wiki-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* Article Footer */}
              <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                <div>
                  Doc ID: <code className="font-mono text-slate-600 dark:text-slate-300">{article.id}</code> (Coleção: <code className="font-mono text-slate-600 dark:text-slate-300">{article.pageUid}</code>)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(article)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Editar este artigo
                  </button>
                  <span>•</span>
                  <button
                    onClick={handleExportJson}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    JSON Raw
                  </button>
                </div>
              </footer>
            </>
          )}

          {activeTab === 'source' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCode size={14} className="text-blue-600" />
                  Código-fonte em sintaxe Wikitext / MediaWiki
                </h3>
                <button
                  onClick={handleCopySource}
                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                >
                  {sourceCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {sourceCopied ? 'Copiado!' : 'Copiar Wikitext'}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                {article.descricao}
              </pre>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Metadados e Informações Técnicas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Título do Artigo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{article.titulo}</span>
                </div>
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Coleção / Page UID</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{article.pageUid}</span>
                </div>
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Data de Criação</span>
                  <span className="text-slate-800 dark:text-slate-200">{new Date(article.dataCriacao).toLocaleString('pt-BR')}</span>
                </div>
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Última Edição</span>
                  <span className="text-slate-800 dark:text-slate-200">{new Date(article.dataEdicao).toLocaleString('pt-BR')}</span>
                </div>
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tamanho do Wikitext</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{article.descricao.length} bytes</span>
                </div>
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Licença de Publicação</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">GNU General Public License v3.0</span>
                </div>
              </div>
            </div>
          )}
        </article>

        {/* Table of Contents & Sidebar info (1 column) */}
        <aside className="space-y-4 sticky top-16">
          {/* Table of contents */}
          {toc.length > 0 && (
            <div className="bg-[#f8f9fa] dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                  <List size={12} /> Índice
                </h3>
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold"
                >
                  {showToc ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {showToc && (
                <nav className="space-y-1 text-xs max-h-72 overflow-y-auto pr-1">
                  {toc.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      style={{ paddingLeft: `${(item.level - 1) * 8 + 4}px` }}
                      className="w-full text-left py-0.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded transition truncate block text-[11px]"
                    >
                      {item.level === 1 ? '▪ ' : '– '}
                      {item.text}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          )}

          {/* Quick Encyclopedia Box */}
          <div className="bg-[#fffdf0] dark:bg-[#1a1708] border border-[#eaddc5] dark:border-[#52441a] rounded p-3 text-xs text-[#855e00] dark:text-[#e0c46b] space-y-2">
            <h4 className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono">
              <span>📖</span> Licença & Uso
            </h4>
            <p className="leading-snug text-[11px]">
              Artigo disponível sob a <strong>GNU General Public License v3.0</strong>. Conteúdo enciclopédico livre.
            </p>
          </div>
        </aside>
      </div>

      {/* Revision History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xl overflow-hidden animate-in zoom-in-95 text-xs">
            <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-mono">
                <History size={15} className="text-blue-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Histórico de Revisões</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-white/70 hover:text-white p-0.5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-[55vh] overflow-y-auto space-y-2">
              {(article.historico && article.historico.length > 0) ? (
                article.historico.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      <span>{new Date(h.data).toLocaleString('pt-BR')}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {h.autor}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      "{h.resumo}"
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Tamanho: {h.tamanho} bytes
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Nenhuma revisão intermediária registrada para este artigo.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
