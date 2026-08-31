import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  RotateCcw,
  Sparkles,
  MessageSquare,
  Link2,
  Star,
  Tag,
  ThumbsUp,
  Folder,
  Send,
} from 'lucide-react';
import {
  WikiArticle,
  WikiPage,
  UserProfile,
  ArticleHistoryItem,
  ArticleRatingData,
} from '../types';
import { parseWikitext, TocItem } from '../utils/wikitextParser';
import { formatExternalUrl } from '../utils/linkUtils';
import { ArticleHistoryView } from './ArticleHistoryView';
import { TalkPageView } from './TalkPageView';
import { WhatLinksHereView } from './WhatLinksHereView';
import { MobileArticleTOC } from './MobileArticleTOC';
import { StorageService } from '../services/storageService';

interface ArticleViewerProps {
  article: WikiArticle;
  page?: WikiPage | null;
  user: UserProfile | null;
  allArticles?: WikiArticle[];
  allPages?: WikiPage[];
  onEdit: (article: WikiArticle) => void;
  onDelete: (articleId: string) => void;
  onNavigateToPage: (pageUid: string) => void;
  onNavigateToArticleByTitle: (title: string) => void;
  onNavigateToArticleById?: (articleId: string) => void;
  onNavigateToUser?: (identifier: string) => void;
  onBack: () => void;
  onRestoreRevision?: (historyItem: ArticleHistoryItem) => void;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({
  article,
  page,
  user,
  allArticles = [],
  allPages = [],
  onEdit,
  onDelete,
  onNavigateToPage,
  onNavigateToArticleByTitle,
  onNavigateToArticleById,
  onNavigateToUser,
  onBack,
  onRestoreRevision,
}) => {
  const [fontSize, setFontSize] = useState<number>(15);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'article' | 'talk' | 'source' | 'history' | 'what-links-here' | 'info'
  >('article');
  const [sourceCopied, setSourceCopied] = useState(false);
  const [isWatched, setIsWatched] = useState(() => StorageService.isWatched(article.id));
  const [ratingData, setRatingData] = useState<ArticleRatingData>(() =>
    StorageService.getArticleRating(article.id)
  );
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Parse wikitext (with callouts, refs, categories, infoboxes)
  const { html, toc, references, categories } = useMemo(
    () => parseWikitext(article.descricao),
    [article.descricao]
  );

  // Sync watched status on article change
  useEffect(() => {
    setIsWatched(StorageService.isWatched(article.id));
    setRatingData(StorageService.getArticleRating(article.id));
    setHasRated(false);
  }, [article.id]);

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
        return;
      }

      // Safeguard for any external link click
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor && !anchor.hasAttribute('data-wiki-target')) {
        const href = anchor.getAttribute('href');
        if (href && /^https?:\/\//i.test(href)) {
          const redirectUrl = formatExternalUrl(href);
          anchor.setAttribute('href', redirectUrl);
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('rel', 'noopener noreferrer');
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
    const blob = new Blob([`# ${article.titulo}\n\n${article.descricao}`], {
      type: 'text/markdown',
    });
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

  const handleToggleWatchlist = () => {
    const watched = StorageService.toggleWatchlist(article);
    setIsWatched(watched);
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.submitRating(article.id, selectedRating, ratingComment, user);
    setRatingData(updated);
    setHasRated(true);
    setRatingComment('');
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const historyCount = article.historico?.length || 1;
  const talkThreads = StorageService.getTalkThreads(article.id);
  const backlinks = StorageService.getBacklinks(article.titulo, allArticles);

  // All extracted or explicitly assigned categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    if (article.categoria) set.add(article.categoria);
    categories.forEach((c) => set.add(c));
    return Array.from(set);
  }, [article.categoria, categories]);

  const handleRestore = (item: ArticleHistoryItem) => {
    if (onRestoreRevision) {
      onRestoreRevision(item);
    } else {
      const restoredArticle: WikiArticle = {
        ...article,
        descricao: item.conteudo || article.descricao,
      };
      onEdit(restoredArticle);
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
          {/* Watchlist Star Toggle */}
          <button
            onClick={handleToggleWatchlist}
            title={isWatched ? 'Remover da Lista de Páginas Vigiadas' : 'Adicionar à Lista de Páginas Vigiadas (Watchlist)'}
            className={`p-1.5 rounded border transition flex items-center gap-1 text-xs font-semibold ${
              isWatched
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star size={13} fill={isWatched ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{isWatched ? 'Vigiando' : 'Vigiar'}</span>
          </button>

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
            className={`p-1.5 rounded border border-slate-200 dark:border-slate-700 transition ${
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
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
          </button>

          <button
            onClick={handlePrint}
            title="Imprimir artigo"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:block"
          >
            <Printer size={13} />
          </button>

          <button
            onClick={handleExportMarkdown}
            title="Exportar Markdown"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:block"
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
              className="p-1.5 rounded border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* MediaWiki / Fandom High-Density Tab Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('article')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'article'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen size={13} /> Artigo
        </button>

        <button
          onClick={() => setActiveTab('talk')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'talk'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare size={13} />
          <span>Discussão</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {talkThreads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('source')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1 whitespace-nowrap ${
            activeTab === 'source'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode size={13} /> Ver Código-Fonte
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History size={13} />
          <span>Histórico</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {historyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('what-links-here')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'what-links-here'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Link2 size={13} />
          <span>Páginas Afluentes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {backlinks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Informações da Página
        </button>
      </div>

      {/* Tab: Talk Page */}
      {activeTab === 'talk' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs">
          <TalkPageView
            article={article}
            user={user}
            onNavigateToArticle={onNavigateToArticleById}
          />
        </div>
      )}

      {/* Tab: What Links Here */}
      {activeTab === 'what-links-here' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs">
          <WhatLinksHereView
            currentArticle={article}
            allArticles={allArticles}
            allPages={allPages}
            onNavigateToArticle={(id) => onNavigateToArticleById?.(id)}
            onNavigateToPage={onNavigateToPage}
          />
        </div>
      )}

      {/* Tab: History View */}
      {activeTab === 'history' && (
        <ArticleHistoryView
          article={article}
          onRestoreRevision={handleRestore}
          onEditArticle={() => onEdit(article)}
        />
      )}

      {/* Tab: Source Code View */}
      {activeTab === 'source' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCode size={14} className="text-blue-600" />
              Código-fonte em sintaxe Wikitext / MediaWiki / Fandom
            </h3>
            <button
              onClick={handleCopySource}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700"
            >
              {sourceCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              {sourceCopied ? 'Copiado!' : 'Copiar Wikitext'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
            {article.descricao}
          </pre>
        </div>
      )}

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 shadow-xs space-y-4 text-xs">
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
              <span className="text-slate-800 dark:text-slate-200">
                {new Date(article.dataCriacao).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Última Edição</span>
              <span className="text-slate-800 dark:text-slate-200">
                {new Date(article.dataEdicao || article.dataCriacao).toLocaleString('pt-BR')}
              </span>
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

      {/* Main Tab: Article View */}
      {activeTab === 'article' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          {/* Article Content Pane (3 columns) */}
          <article className="lg:col-span-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-7 shadow-xs space-y-6">
            {/* Article Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {article.categoria || 'Geral'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Versão {article.versao || 1}.0
                </span>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                  <Star size={10} fill="currentColor" /> {ratingData.averageScore.toFixed(1)}/5 ({ratingData.totalVotes} votos)
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-normal font-serif-heading text-slate-900 dark:text-white leading-tight">
                {article.titulo}
              </h1>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <User size={11} />
                  <span>
                    Autor:{' '}
                    {onNavigateToUser && article.autor ? (
                      <button
                        onClick={() => onNavigateToUser(article.autor)}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                      >
                        {article.autor}
                      </button>
                    ) : (
                      <strong className="text-slate-700 dark:text-slate-300">
                        {article.autor || 'Anônimo'}
                      </strong>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  <span>
                    Atualizado:{' '}
                    {new Date(article.dataEdicao || article.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>
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

            {/* Wikidot / Fandom Categories Footer Bar */}
            {allCategories.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 flex-wrap not-prose">
                <div className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  <Folder size={13} className="text-amber-500" />
                  <span>Categorias:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium text-[11px]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fandom-Style Community Rating & Feedback Box */}
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 not-prose">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" fill="currentColor" />
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 font-serif-heading">
                    Avaliação Comunitária do Artigo
                  </h4>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Média: <strong>{ratingData.averageScore.toFixed(1)}</strong> / 5.0 ({ratingData.totalVotes} votos)
                </div>
              </div>

              {!hasRated ? (
                <form onSubmit={handleSubmitRating} className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Sua nota:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelectedRating(star)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition"
                        >
                          <Star
                            size={18}
                            className={star <= selectedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Deixe um comentário sobre a qualidade ou precisão do artigo..."
                      className="flex-1 text-xs px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                    >
                      <Send size={11} /> Avaliar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <Check size={14} /> Obrigado pelo seu feedback! Sua avaliação ajuda a aprimorar a qualidade enciclopédica.
                </div>
              )}

              {/* Recent Community Comments */}
              {ratingData.feedbacks && ratingData.feedbacks.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                    Comentários Recentes de Leitores:
                  </span>
                  {ratingData.feedbacks.slice(0, 3).map((fb, idx) => (
                    <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded text-slate-700 dark:text-slate-300 flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">{fb.autor}:</strong> “{fb.comentario}”
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0 text-[10px]">
                        ★ {fb.nota}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                  onClick={() => setActiveTab('talk')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Discussão ({talkThreads.length})
                </button>
                <span>•</span>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Histórico ({historyCount})
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

            {/* Quick Special Links Navigation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-3 text-xs space-y-2">
              <h4 className="font-bold text-[11px] uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>🛠 Ferramentas</span>
              </h4>
              <ul className="space-y-1 text-[11px]">
                <li>
                  <button
                    onClick={() => setActiveTab('what-links-here')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <Link2 size={11} /> Páginas Afluentes ({backlinks.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('talk')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <MessageSquare size={11} /> Página de Discussão ({talkThreads.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('source')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <FileCode size={11} /> Ver Código-Fonte
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('info')}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <Sparkles size={11} /> Metadados da Página
                  </button>
                </li>
              </ul>
            </div>

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
      )}

      {/* Floating Bottom TOC and Reader Controls on Mobile */}
      {activeTab === 'article' && (
        <MobileArticleTOC
          toc={toc}
          fontSize={fontSize}
          isPlayingAudio={isPlayingAudio}
          isWatched={isWatched}
          onFontSizeChange={setFontSize}
          onToggleSpeech={toggleSpeech}
          onToggleWatch={handleToggleWatchlist}
          onShare={handleShare}
        />
      )}
    </div>
  );
};
