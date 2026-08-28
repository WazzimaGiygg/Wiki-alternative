import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  Eye,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { WikiPage, WikiArticle, UserProfile } from '../types';

interface WikiHubProps {
  pages: WikiPage[];
  articles: WikiArticle[];
  user: UserProfile | null;
  searchQuery: string;
  onSelectPage: (pageUid: string) => void;
  onSelectArticle: (articleId: string) => void;
  onCreatePageClick: () => void;
  onCreateArticleClick: (pageUid?: string) => void;
  onOpenEditor: () => void;
}

export const WikiHub: React.FC<WikiHubProps> = ({
  pages,
  articles,
  user,
  searchQuery,
  onSelectPage,
  onSelectArticle,
  onCreatePageClick,
  onCreateArticleClick,
  onOpenEditor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Extract all categories
  const categories = ['Todas', ...Array.from(new Set(pages.map((p) => p.categoria)))];

  // Filter pages
  const filteredPages = pages.filter((page) => {
    const matchesCat = selectedCategory === 'Todas' || page.categoria === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      page.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (page.tags && page.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  // Filter articles based on search query
  const matchingArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.resumo && a.resumo.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const totalViews = articles.reduce((acc, a) => acc + (a.visualizacoes || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in select-none">
      {/* High Density Portal Header / Welcome Banner */}
      <div className="bg-[#f8f9fa] dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-xs font-mono">
                WikiZero Portal
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Enciclopédia Livre e Colaborativa
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white tracking-tight leading-tight">
              Boas-vindas à WikiZero, a enciclopédia aberta.
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Consulte artigos enciclopédicos livres, edite e crie conteúdo em sintaxe Wikitext / MediaWiki e colabore com a comunidade sob a licença GNU GPL v3.0 e total conformidade com a LGPD.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col items-center gap-2 flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={onCreatePageClick}
              className="flex-1 lg:w-48 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              Criar Nova Coleção
            </button>
            <button
              onClick={onOpenEditor}
              className="flex-1 lg:w-48 px-3 py-1.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Edit3 size={14} />
              Editor Wikitexto
            </button>
          </div>
        </div>

        {/* Dense Statistics Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">COLEÇÕES ATIVAS</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{pages.length}</span>
          </div>
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">ARTIGOS PUBLICADOS</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{articles.length}</span>
          </div>
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">LEITURAS TOTAIS</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{(totalViews + 1420).toLocaleString()}</span>
          </div>
          <div className="bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block text-[10px]">LICENÇA PÚBLICA</span>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400">GNU GPL v3</span>
          </div>
        </div>
      </div>

      {/* Matching Search Articles results (if searching) */}
      {searchQuery && (
        <div className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Resultados de busca para:</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">"{searchQuery}"</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {matchingArticles.length} resultados encontrados
            </span>
          </div>

          {matchingArticles.length === 0 ? (
            <div className="py-4 text-center text-slate-400 text-xs">
              Nenhum artigo encontrado para o termo pesquisado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {matchingArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => onSelectArticle(art.id)}
                  className="p-3 rounded border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 transition truncate">
                      {art.titulo}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {art.resumo || art.descricao.slice(0, 90)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">#{art.pageUid}</span>
                      <span>• {art.visualizacoes || 1} visualizações</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mr-1">
          Categoria:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition border ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* High Density Collections Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
              Coleções & Tópicos Enciclopédicos
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Coleções persistentes no banco de dados Firestore (`documentos`)
            </p>
          </div>
          <button
            onClick={onCreatePageClick}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Plus size={13} /> Nova Coleção
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPages.map((page) => {
            const pageArticles = articles.filter((a) => a.pageUid === page.uid);

            return (
              <div
                key={page.uid}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-600 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{page.icon || '📄'}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                        {page.categoria}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      uid: {page.uid}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectPage(page.uid)}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer font-serif-heading transition leading-snug"
                  >
                    {page.titulo}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {page.descricao}
                  </p>

                  {/* Subcollection articles preview list */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-mono">
                      Artigos ({pageArticles.length}):
                    </span>
                    {pageArticles.slice(0, 3).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => onSelectArticle(art.id)}
                        className="text-[11px] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1.5 py-0.5 truncate"
                      >
                        <span className="text-blue-600 text-[9px]">▪</span>
                        <span className="truncate">{art.titulo}</span>
                      </div>
                    ))}
                    {pageArticles.length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">
                        Nenhum artigo adicionado ainda.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    {pageArticles.length} artigo(s)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onCreateArticleClick(page.uid)}
                      title="Adicionar artigo nesta coleção"
                      className="px-2 py-1 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <Plus size={11} /> Artigo
                    </button>
                    <button
                      onClick={() => onSelectPage(page.uid)}
                      className="p-1 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition border border-blue-200 dark:border-blue-800"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
