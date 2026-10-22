import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Filter,
  ArrowRight,
  BookOpen,
  Calendar,
  Folder,
  Eye,
  FileText,
  Sparkles,
  PlusCircle,
  X,
  Clock,
  RotateCcw,
  List,
  LayoutGrid,
  FileQuestion,
  User as UserIcon,
  Palette,
  GitCommit,
  Check,
  CheckCircle2,
  ExternalLink,
  Shield,
  Crown,
  FileCode,
  Tag,
  ChevronRight,
  Layers,
  Sparkle,
} from 'lucide-react';
import { WikiArticle, WikiPage, UserProfile, AppTheme, SystemUpdateEntry } from '../types';
import { getCleanExcerpt } from '../utils/wikitextParser';
import {
  UnifiedSearchService,
  SearchSector,
  SEARCH_SECTORS,
  THEME_SEARCH_CATALOG,
  ThemeCatalogItem,
  DiffSearchResultItem,
} from '../services/unifiedSearchService';
import { StorageService } from '../services/storageService';
import { GitHubDiffService, GitHubCommitSummary } from '../services/githubDiffService';

interface AdvancedSearchViewProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  user: UserProfile | null;
  initialQuery?: string;
  theme?: AppTheme;
  onSearchQueryChange?: (query: string) => void;
  onSelectArticle: (articleId: string) => void;
  onSelectPage: (pageUid: string) => void;
  onOpenNewEditor: (title?: string) => void;
  onNavigateHome: () => void;
  onNavigateTo404?: (query: string) => void;
  // 3.05.6.c Ações Diretas por Setor
  onSetTheme?: (theme: AppTheme) => void;
  onNavigateToUser?: (identifier: string) => void;
  onNavigate?: (view: any) => void;
}

type SearchScope = 'all' | 'title' | 'content' | 'tags';
type SortOption = 'relevance' | 'newest' | 'oldest' | 'views' | 'title' | 'size';
type TimeRangeOption = 'all' | '7d' | '30d' | '365d';

export const AdvancedSearchView: React.FC<AdvancedSearchViewProps> = ({
  articles,
  pages,
  initialQuery = '',
  theme = 'light',
  onSearchQueryChange,
  onSelectArticle,
  onSelectPage,
  onOpenNewEditor,
  onNavigateHome,
  onNavigateTo404,
  onSetTheme,
  onNavigateToUser,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPageUid, setSelectedPageUid] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Estado para armazenar usuários, commits e atualizações carregados
  const [communityUsers, setCommunityUsers] = useState<UserProfile[]>([]);
  const [gitCommits, setGitCommits] = useState<GitHubCommitSummary[]>([]);
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdateEntry[]>([]);
  const [themeAppliedNotice, setThemeAppliedNotice] = useState<string | null>(null);

  // Carrega dados de outros setores na montagem
  useEffect(() => {
    let isMounted = true;

    StorageService.getCommunityUsers().then((u) => {
      if (isMounted && Array.isArray(u)) {
        setCommunityUsers(u);
      }
    });

    GitHubDiffService.getRecentCommits(35).then((c) => {
      if (isMounted && Array.isArray(c)) {
        setGitCommits(c);
      }
    });

    const updates = StorageService.getSystemUpdates();
    if (isMounted && Array.isArray(updates)) {
      setSystemUpdates(updates);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Histórico de pesquisas recentes
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wikizero_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sincroniza query inicial se alterar externamente
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== searchTerm) {
      setSearchTerm(initialQuery);
    }
  }, [initialQuery]);

  // Salva no histórico quando busca
  const recordSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('wikizero_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('wikizero_search_history');
    } catch {}
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    recordSearch(searchTerm);
    if (onSearchQueryChange) {
      onSearchQueryChange(searchTerm);
    }
  };

  const handleTermClick = (term: string) => {
    setSearchTerm(term);
    recordSearch(term);
    if (onSearchQueryChange) {
      onSearchQueryChange(term);
    }
  };

  // Análise da query para detecção do setor por prefixo tag (3.05.6.c)
  const parsedQuery = useMemo(() => {
    return UnifiedSearchService.parseQuery(searchTerm);
  }, [searchTerm]);

  const activeSector = parsedQuery.sector;
  const cleanQuery = parsedQuery.cleanQuery;

  // Troca de setor pelos botões de pílula (pills)
  const handleSelectSector = (sector: SearchSector) => {
    const newFormatted = UnifiedSearchService.formatQueryWithSector(sector, cleanQuery);
    setSearchTerm(newFormatted);
    if (onSearchQueryChange) {
      onSearchQueryChange(newFormatted);
    }
  };

  // Limpa prefixo de tag mantendo o termo limpo
  const handleClearSectorTag = () => {
    setSearchTerm(cleanQuery);
    if (onSearchQueryChange) {
      onSearchQueryChange(cleanQuery);
    }
  };

  // Lista dinâmica de categorias e idiomas existentes nos artigos
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.categoria && a.categoria.trim()) set.add(a.categoria.trim());
      if (a.tags) {
        a.tags.forEach((t) => {
          if (t && t.trim()) set.add(t.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [articles]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.idioma && a.idioma.trim()) set.add(a.idioma.trim());
    });
    return Array.from(set).sort();
  }, [articles]);

  // Executa busca unificada completa
  const unifiedResults = useMemo(() => {
    return UnifiedSearchService.searchAll({
      query: searchTerm,
      articles,
      pages,
      users: communityUsers,
      commits: gitCommits,
      updates: systemUpdates,
    });
  }, [searchTerm, articles, pages, communityUsers, gitCommits, systemUpdates]);

  // Filtra e calcula pontuação de relevância para Artigos (com filtros avançados opcionais)
  const filteredArticles = useMemo(() => {
    const rawArticles = unifiedResults.articles;
    const now = new Date().getTime();

    // Aplica filtros avançados de artigos
    const candidates = rawArticles.filter((article) => {
      if (!article) return false;

      // Categoria
      if (selectedCategory !== 'all') {
        const matchesCategory =
          article.categoria?.toLowerCase() === selectedCategory.toLowerCase() ||
          article.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
        if (!matchesCategory) return false;
      }

      // Coleção / Page UID
      if (selectedPageUid !== 'all' && article.pageUid !== selectedPageUid) {
        return false;
      }

      // Idioma
      if (selectedLanguage !== 'all' && article.idioma && article.idioma !== selectedLanguage) {
        return false;
      }

      // Período de tempo
      if (timeRange !== 'all') {
        const artDate = new Date(article.dataCriacao || article.dataEdicao || '').getTime();
        if (!isNaN(artDate)) {
          const diffDays = (now - artDate) / (1000 * 60 * 60 * 24);
          if (timeRange === '7d' && diffDays > 7) return false;
          if (timeRange === '30d' && diffDays > 30) return false;
          if (timeRange === '365d' && diffDays > 365) return false;
        }
      }

      // Escopo de busca refinado (caso ativo)
      if (cleanQuery && searchScope !== 'all') {
        const qLower = cleanQuery.toLowerCase();
        const titleLower = (article.titulo || '').toLowerCase();
        const contentLower = (article.descricao || '').toLowerCase();
        const summaryLower = (article.resumo || '').toLowerCase();
        const tagsLower = (article.tags || []).map((t) => t.toLowerCase()).join(' ');

        if (searchScope === 'title') {
          return titleLower.includes(qLower);
        }
        if (searchScope === 'content') {
          return contentLower.includes(qLower) || summaryLower.includes(qLower);
        }
        if (searchScope === 'tags') {
          return (
            (article.categoria && article.categoria.toLowerCase().includes(qLower)) ||
            tagsLower.includes(qLower)
          );
        }
      }

      return true;
    });

    // Ordenação
    candidates.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.dataCriacao || '').getTime() || 0;
        const dateB = new Date(b.dataCriacao || '').getTime() || 0;
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.dataCriacao || '').getTime() || 0;
        const dateB = new Date(b.dataCriacao || '').getTime() || 0;
        return dateA - dateB;
      }
      if (sortBy === 'views') {
        return (b.visualizacoes || 0) - (a.visualizacoes || 0);
      }
      if (sortBy === 'title') {
        return (a.titulo || '').localeCompare(b.titulo || '');
      }
      if (sortBy === 'size') {
        return (b.descricao?.length || 0) - (a.descricao?.length || 0);
      }
      return 0; // relevance já ordenado por padrão
    });

    return candidates;
  }, [
    unifiedResults.articles,
    selectedCategory,
    selectedPageUid,
    selectedLanguage,
    timeRange,
    searchScope,
    cleanQuery,
    sortBy,
  ]);

  // Função auxiliar para destacar termos de pesquisa
  const renderHighlightedText = (text: string, maxLen?: number) => {
    if (!text) return '';
    let displayText = maxLen ? getCleanExcerpt(text, maxLen) : text;
    const highlightTarget = cleanQuery.trim();
    if (!highlightTarget) return <span>{displayText}</span>;

    const words = highlightTarget
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (words.length === 0) return <span>{displayText}</span>;

    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = displayText.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-amber-200 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 font-semibold px-0.5 rounded-xs"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Ação de aplicar tema diretamente do card de Skin
  const handleApplySkin = (skinId: AppTheme, skinName: string) => {
    if (onSetTheme) {
      onSetTheme(skinId);
      setThemeAppliedNotice(skinName);
      setTimeout(() => {
        setThemeAppliedNotice(null);
      }, 3500);
    }
  };

  const hasActiveFilters =
    searchScope !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPageUid !== 'all' ||
    selectedLanguage !== 'all' ||
    timeRange !== 'all' ||
    sortBy !== 'relevance';

  const handleResetFilters = () => {
    setSearchScope('all');
    setSelectedCategory('all');
    setSelectedPageUid('all');
    setSelectedLanguage('all');
    setTimeRange('all');
    setSortBy('relevance');
  };

  const isStardew = theme === 'stardew';
  const isGenshin = theme === 'genshin';
  const isWin1 = theme === 'win1';
  const isWin95 = theme === 'win95';
  const isWinXP = theme === 'winxp';
  const isAndroid = theme === 'android15';
  const isRepo = theme === 'repo';
  const isNokia = theme === 'nokia3310';

  // Cálculos de totais gerais
  const totalResultsCount =
    activeSector === 'all'
      ? filteredArticles.length +
        unifiedResults.users.length +
        unifiedResults.themes.length +
        unifiedResults.diffs.length +
        unifiedResults.collections.length
      : activeSector === 'article'
      ? filteredArticles.length
      : activeSector === 'user'
      ? unifiedResults.users.length
      : activeSector === 'skin'
      ? unifiedResults.themes.length
      : activeSector === 'diff'
      ? unifiedResults.diffs.length
      : unifiedResults.collections.length;

  return (
    <div className="space-y-6">
      {/* Toast flutuante de sucesso ao aplicar tema */}
      {themeAppliedNotice && (
        <div className="fixed top-18 right-4 z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-purple-600 text-white shadow-xl text-xs font-semibold border border-purple-400">
            <Palette size={16} className="text-purple-200" />
            <span>
              Tema <strong>"{themeAppliedNotice}"</strong> aplicado com sucesso!
            </span>
          </div>
        </div>
      )}

      {/* 1. Header da Página de Busca Unificada */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isWin1
            ? 'bg-white border-2 border-black !rounded-none text-black font-mono shadow-none'
            : isWin95
            ? 'win95-window'
            : isWinXP
            ? 'winxp-window'
            : isNokia
            ? 'bg-[#b7cc98] border-2 border-[#1f281b] text-[#1f281b] !rounded-none shadow-[3px_3px_0px_#1f281b] font-mono'
            : isGenshin
            ? 'bg-[#151a2d] border-[#d3bc8e]/40 text-[#f2dfb7]'
            : isStardew
            ? 'stardew-box bg-[#fffaf0]'
            : isRepo
            ? 'repo-box bg-[#090d14] border-2 border-[#f59e0b]/60 text-slate-100 font-mono shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isWin95
                    ? 'win95-sunken bg-white text-black'
                    : isNokia
                    ? 'bg-[#1f281b] text-[#c2d6a4] !rounded-none shadow-[1px_1px_0px_#1f281b]'
                    : isGenshin
                    ? 'bg-[#212946] text-[#e0c48e]'
                    : isStardew
                    ? 'bg-[#5c3716] text-[#ffd54f]'
                    : isRepo
                    ? 'bg-[#151c28] text-[#f59e0b] border border-[#f59e0b]/50'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                }`}
              >
                <Search size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <span>Busca Unificada da Enciclopédia</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    3.05.6.c Tags
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pesquise globalmente ou diferencie por prefixo:{' '}
                  <code className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">User:</code>,{' '}
                  <code className="text-purple-600 dark:text-purple-400 font-semibold font-mono">Skin:</code>,{' '}
                  <code className="text-amber-600 dark:text-amber-400 font-semibold font-mono">Diff:</code>,{' '}
                  <code className="text-cyan-600 dark:text-cyan-400 font-semibold font-mono">Collection:</code> ou{' '}
                  <code className="text-slate-600 dark:text-slate-400 font-semibold font-mono">Article:</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{showFilters ? 'Ocultar Filtros de Artigo' : 'Filtros de Artigo'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-0.5" />
              )}
            </button>

            <button
              onClick={() => onOpenNewEditor(cleanQuery || searchTerm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Novo Artigo</span>
            </button>
          </div>
        </div>

        {/* 1.1 Barra de Seleção de Setores (Pills 3.05.6.c) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Setores:
          </span>

          {/* Tudo */}
          <button
            type="button"
            onClick={() => handleSelectSector('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSector === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>🌐 Tudo</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSector === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              {unifiedResults.counts.all}
            </span>
          </button>

          {/* User: Usuários */}
          <button
            type="button"
            onClick={() => handleSelectSector('user')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSector === 'user'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/60'
            }`}
          >
            <UserIcon size={13} />
            <span>User: Usuários</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSector === 'user' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 dark:bg-emerald-900'
              }`}
            >
              {unifiedResults.counts.user}
            </span>
          </button>

          {/* Skin: Temas */}
          <button
            type="button"
            onClick={() => handleSelectSector('skin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSector === 'skin'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50/60 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100/60'
            }`}
          >
            <Palette size={13} />
            <span>Skin: Temas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSector === 'skin' ? 'bg-purple-700 text-white' : 'bg-purple-200 dark:bg-purple-900'
              }`}
            >
              {unifiedResults.counts.skin}
            </span>
          </button>

          {/* Diff: Commits */}
          <button
            type="button"
            onClick={() => handleSelectSector('diff')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSector === 'diff'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100/60'
            }`}
          >
            <GitCommit size={13} />
            <span>Diff: Commits</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSector === 'diff' ? 'bg-amber-700 text-white' : 'bg-amber-200 dark:bg-amber-900'
              }`}
            >
              {unifiedResults.counts.diff}
            </span>
          </button>

          {/* Collection: Coleções */}
          <button
            type="button"
            onClick={() => handleSelectSector('collection')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSector === 'collection'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                : 'bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100/60'
            }`}
          >
            <Folder size={13} />
            <span>Collection: Coleções</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSector === 'collection' ? 'bg-cyan-700 text-white' : 'bg-cyan-200 dark:bg-cyan-900'
              }`}
            >
              {unifiedResults.counts.collection}
            </span>
          </button>

          {/* Article: Artigos */}
          <button
            type="button"
            onClick={() => handleSelectSector('article')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeSector === 'article'
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <FileText size={13} />
            <span>Article: Artigos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSector === 'article' ? 'bg-slate-800 text-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              {unifiedResults.counts.article}
            </span>
          </button>
        </div>

        {/* 1.2 Formulário Principal de Pesquisa com Tag Visual */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"
            />

            {/* Badge de Tag Ativa dentro do Input */}
            {parsedQuery.rawTag && (
              <div className="absolute left-9 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                <span>{parsedQuery.rawTag}</span>
                <button
                  type="button"
                  onClick={handleClearSectorTag}
                  className="hover:text-rose-600 transition"
                  title="Remover prefixo e pesquisar em Tudo"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearchQueryChange) onSearchQueryChange(e.target.value);
              }}
              placeholder="Digite o que procura ou use tags: User: Pedro, Skin: Win95, Diff: 3.05, Collection: Ciência..."
              className={`w-full ${
                parsedQuery.rawTag ? 'pl-28' : 'pl-10'
              } pr-10 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isWin95
                  ? 'win95-sunken bg-white text-black font-mono'
                  : isGenshin
                  ? 'bg-[#101423] border-[#d3bc8e]/50 text-[#f2dfb7] placeholder:text-[#a0947d]'
                  : isStardew
                  ? 'bg-[#fffdf7] border-[#6b401b] text-[#3e2613] placeholder:text-[#8a6843]'
                  : isRepo
                  ? 'bg-[#06080e] border-2 border-[#f59e0b]/80 text-[#22d3ee] placeholder:text-[#22d3ee]/40 font-mono focus:border-[#22d3ee]'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400'
              }`}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  if (onSearchQueryChange) onSearchQueryChange('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
                title="Limpar campo"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shrink-0 ${
              isWin95
                ? 'win95-button'
                : isGenshin
                ? 'genshin-gold-btn text-black'
                : isStardew
                ? 'stardew-btn'
                : isRepo
                ? 'repo-btn px-6'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            <Search size={16} />
            <span>Buscar</span>
          </button>
        </form>

        {/* 1.3 Atalhos rápidos de tags e sugestões */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles size={13} className="text-amber-500" />
            Atalhos por Tag:
          </span>

          <button
            type="button"
            onClick={() => handleTermClick('User: WazzimaGiygg')}
            className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer font-mono"
          >
            User: WazzimaGiygg
          </button>

          <button
            type="button"
            onClick={() => handleTermClick('Skin: Windows 95')}
            className="px-2 py-0.5 rounded-md text-[11px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer font-mono"
          >
            Skin: Windows 95
          </button>

          <button
            type="button"
            onClick={() => handleTermClick('Diff: 3.05')}
            className="px-2 py-0.5 rounded-md text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer font-mono"
          >
            Diff: 3.05
          </button>

          <button
            type="button"
            onClick={() => handleTermClick('Collection: Ciência')}
            className="px-2 py-0.5 rounded-md text-[11px] bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition cursor-pointer font-mono"
          >
            Collection: Ciência
          </button>

          <button
            type="button"
            onClick={() => handleTermClick('Inteligência Artificial')}
            className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Inteligência Artificial
          </button>

          {recentSearches.length > 0 && (
            <div className="w-full flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Clock size={12} />
                Histórico recente:
              </span>
              {recentSearches.map((hist) => (
                <button
                  key={hist}
                  type="button"
                  onClick={() => handleTermClick(hist)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {hist}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[10px] text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
              >
                Limpar histórico
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Painel de Filtros Avançados (específico de artigos) */}
      {showFilters && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isWin95
              ? 'win95-window'
              : isGenshin
              ? 'bg-[#161c32] border-[#d3bc8e]/40 text-[#f2dfb7]'
              : isStardew
              ? 'stardew-box bg-[#fef9ee]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold tracking-tight">Filtros Refinados para Artigos</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw size={12} />
                <span>Restaurar filtros padrão</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-xs">
            {/* Escopo de Busca */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Onde pesquisar no artigo:
              </label>
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as SearchScope)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todo o verbete (título, texto e tags)</option>
                <option value="title">Apenas no título</option>
                <option value="content">Apenas no corpo do texto</option>
                <option value="tags">Apenas em tags e categorias</option>
              </select>
            </div>

            {/* Coleção / Namespace */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Coleção Temática:
              </label>
              <select
                value={selectedPageUid}
                onChange={(e) => setSelectedPageUid(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todas as coleções ({pages.length})</option>
                {pages.map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {p.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Categoria / Assunto:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todas as categorias ({availableCategories.length})</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Idioma */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Idioma do Artigo:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Todos os idiomas ({availableLanguages.length})</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Período / Data */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Data de Criação:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Qualquer data</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="365d">Último ano</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Ordenar Artigos por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="relevance">Mais Relevantes (Relevância)</option>
                <option value="views">Mais Visualizados</option>
                <option value="newest">Mais Recentes</option>
                <option value="oldest">Mais Antigos</option>
                <option value="title">Ordem Alfabética (A-Z)</option>
                <option value="size">Tamanho do Artigo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Barra de Status dos Resultados & Modo de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {totalResultsCount} {totalResultsCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </span>
          {cleanQuery && (
            <span className="text-slate-500 dark:text-slate-400">
              para <span className="font-semibold text-blue-600 dark:text-blue-400">"{cleanQuery}"</span>
            </span>
          )}
          {parsedQuery.rawTag && (
            <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Filtro ativo: {parsedQuery.rawTag}
            </span>
          )}
          <span className="text-slate-400 hidden md:inline">• Busca efetuada em 0.01s</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Exibir como:</span>
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              title="Modo Cartões"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              title="Modo Lista Enciclopédica"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. SEÇÃO: SKINS E TEMAS VISUAIS (Quando activeSector === 'skin' ou activeSector === 'all' e há matches) */}
      {(activeSector === 'skin' || (activeSector === 'all' && unifiedResults.themes.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-purple-200 dark:border-purple-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <Palette size={16} />
              </div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Aparências, Skins & Temas</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  {unifiedResults.themes.length}
                </span>
              </h2>
            </div>
            {activeSector === 'all' && (
              <button
                onClick={() => handleSelectSector('skin')}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Filtrar apenas Skins (Skin:)</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {unifiedResults.themes.map((skin) => {
              const isCurrent = theme === skin.id;
              return (
                <div
                  key={skin.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between hover:shadow-md ${
                    isCurrent
                      ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-400/30 bg-purple-50/40 dark:bg-purple-950/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                  }`}
                >
                  <div>
                    {/* Header do Card da Skin */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-xs"
                          style={{ backgroundColor: skin.accentColor }}
                        />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {skin.category}
                        </span>
                        {skin.era && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {skin.era}
                          </span>
                        )}
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 size={11} />
                          Ativo
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">ID: {skin.id}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mb-0.5">
                      {renderHighlightedText(skin.name)}
                    </h3>
                    <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mb-1.5 line-clamp-1">
                      {skin.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-3">
                      {renderHighlightedText(skin.description)}
                    </p>

                    {/* Features da Skin */}
                    {skin.features && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {skin.features.map((feat, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ação Direta de Ativação do Tema */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Prefixo: Skin:{skin.id}</span>
                    <button
                      type="button"
                      onClick={() => handleApplySkin(skin.id, skin.name)}
                      disabled={isCurrent}
                      className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      <Palette size={12} />
                      <span>{isCurrent ? 'Tema Ativo' : 'Aplicar Tema'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SEÇÃO: USUÁRIOS E PERFIS (Quando activeSector === 'user' ou activeSector === 'all' e há matches) */}
      {(activeSector === 'user' || (activeSector === 'all' && unifiedResults.users.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200 dark:border-emerald-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <UserIcon size={16} />
              </div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Usuários, Editores & Administradores</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {unifiedResults.users.length}
                </span>
              </h2>
            </div>
            {activeSector === 'all' && (
              <button
                onClick={() => handleSelectSector('user')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Filtrar apenas Usuários (User:)</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {unifiedResults.users.map((u) => {
              const identifier = u.username || u.displayName || u.uid;
              const roleColor =
                u.role === 'admin'
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300'
                  : u.role === 'moderador'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300';

              return (
                <div
                  key={u.uid}
                  onClick={() => onNavigateToUser && onNavigateToUser(identifier)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between hover:shadow-md group"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base shrink-0 border border-emerald-200 dark:border-emerald-800">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt={u.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (u.displayName || u.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                            {renderHighlightedText(u.displayName || u.username || 'Usuário')}
                          </h3>
                          {u.role === 'admin' && <Crown size={13} className="text-amber-500" />}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate">
                          @{u.username || 'sem_username'}
                        </p>
                      </div>
                    </div>

                    {/* Badges de Função e Grupo */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleColor}`}>
                        {u.role ? u.role.toUpperCase() : 'MEMBRO'}
                      </span>
                      {u.group && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          {u.group}
                        </span>
                      )}
                      {(u.reputationScore !== undefined || (u as any).reputation !== undefined) && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          ★ {u.reputationScore ?? (u as any).reputation} rep
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    {u.bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                        {renderHighlightedText(u.bio, 110)}
                      </p>
                    )}
                  </div>

                  {/* Ação de Navegar ao Perfil */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Membro da Comunidade</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Ver Perfil <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. SEÇÃO: DIFFS E COMMITS DE CÓDIGO (Quando activeSector === 'diff' ou activeSector === 'all' e há matches) */}
      {(activeSector === 'diff' || (activeSector === 'all' && unifiedResults.diffs.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <GitCommit size={16} />
              </div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Diffs de Código & Commits do Sistema</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                  {unifiedResults.diffs.length}
                </span>
              </h2>
            </div>
            {activeSector === 'all' && (
              <button
                onClick={() => handleSelectSector('diff')}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Filtrar apenas Diffs (Diff:)</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {unifiedResults.diffs.map((diff) => (
              <div
                key={diff.id}
                onClick={() => onNavigate && onNavigate('site-updates')}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between hover:shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {diff.sha ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          git:{diff.sha.slice(0, 7)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {diff.version || 'RELEASE'}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {diff.type === 'github_commit' ? 'GitHub Commit' : 'System Release'}
                      </span>
                    </div>

                    {/* Stats de Adições / Deleções */}
                    {(diff.additions !== undefined || diff.deletions !== undefined) && (
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
                        {diff.additions !== undefined && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{diff.additions}
                          </span>
                        )}
                        {diff.deletions !== undefined && (
                          <span className="text-rose-600 dark:text-rose-400">
                            -{diff.deletions}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1 font-mono">
                    {renderHighlightedText(diff.title)}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {renderHighlightedText(diff.summary, 140)}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(diff.date || '').toLocaleDateString('pt-BR')}
                    </span>
                    <span>por {diff.author}</span>
                  </div>

                  <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Inspecionar Diff <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SEÇÃO: COLEÇÕES E HUBS (Quando activeSector === 'collection' ou activeSector === 'all' e há matches) */}
      {(activeSector === 'collection' ||
        (activeSector === 'all' && unifiedResults.collections.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-cyan-200 dark:border-cyan-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                <Folder size={16} />
              </div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Coleções & Hubs Temáticos</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300">
                  {unifiedResults.collections.length}
                </span>
              </h2>
            </div>
            {activeSector === 'all' && (
              <button
                onClick={() => handleSelectSector('collection')}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Filtrar apenas Coleções (Collection:)</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {unifiedResults.collections.map((page) => (
              <div
                key={page.uid}
                onClick={() => onSelectPage(page.uid)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all cursor-pointer flex flex-col justify-between hover:shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      Coleção
                    </span>
                    {page.categoria && (
                      <span className="text-[10px] text-slate-400">{page.categoria}</span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1.5">
                    {renderHighlightedText(page.titulo)}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {renderHighlightedText(page.descricao || 'Coleção de artigos da enciclopédia')}
                  </p>

                  {page.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {page.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-[10px]">UID: {page.uid}</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Abrir Coleção <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. SEÇÃO: ARTIGOS DA ENCICLOPÉDIA (Quando activeSector === 'article' ou activeSector === 'all') */}
      {(activeSector === 'article' || activeSector === 'all') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                <FileText size={16} />
              </div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Artigos da Enciclopédia</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredArticles.length}
                </span>
              </h2>
            </div>
            {activeSector === 'all' && filteredArticles.length > 0 && (
              <button
                onClick={() => handleSelectSector('article')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>Filtrar apenas Artigos (Article:)</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {filteredArticles.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article) => {
                  const page = pages.find((p) => p.uid === article.pageUid);
                  return (
                    <div
                      key={article.id}
                      onClick={() => onSelectArticle(article.id)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                        isWin95
                          ? 'win95-window'
                          : isGenshin
                          ? 'bg-[#181e36] border-[#d3bc8e]/40 hover:border-[#d3bc8e] text-[#f2dfb7]'
                          : isStardew
                          ? 'stardew-box bg-[#fffdf8] hover:bg-[#fff7e6]'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {page && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPage(page.uid);
                                }}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
                              >
                                <Folder size={10} />
                                {page.titulo}
                              </span>
                            )}
                            {article.categoria && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                {article.categoria}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {article.visualizacoes !== undefined && (
                              <span className="flex items-center gap-1" title="Visualizações">
                                <Eye size={11} />
                                {article.visualizacoes}
                              </span>
                            )}
                            <span>{(article.descricao?.length || 0).toLocaleString()} carac.</span>
                          </div>
                        </div>

                        {/* Título do Artigo com Highlight */}
                        <h3 className="font-serif-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5">
                          {renderHighlightedText(article.titulo)}
                        </h3>

                        {/* Trecho / Excerpt com Highlight */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-3">
                          {renderHighlightedText(article.resumo || article.descricao, 220)}
                        </p>
                      </div>

                      {/* Footer do Card */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(article.dataCriacao || '').toLocaleDateString('pt-BR')}
                          </span>
                          {article.autor && (
                            <span className="truncate max-w-[120px]">por {article.autor}</span>
                          )}
                        </div>

                        <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          Ler verbete <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Modo Compacto / Enciclopédico */
              <div
                className={`rounded-xl border divide-y divide-slate-100 dark:divide-slate-800 ${
                  isWin95
                    ? 'win95-window'
                    : isGenshin
                    ? 'bg-[#181e36] border-[#d3bc8e]/40 divide-[#d3bc8e]/20'
                    : isStardew
                    ? 'stardew-box bg-[#fffdf8]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {filteredArticles.map((article, idx) => {
                  const page = pages.find((p) => p.uid === article.pageUid);
                  return (
                    <div
                      key={article.id}
                      onClick={() => onSelectArticle(article.id)}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                          <h3 className="font-serif-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {renderHighlightedText(article.titulo)}
                          </h3>
                          {article.categoria && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {article.categoria}
                            </span>
                          )}
                          {page && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                              [{page.titulo}]
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {renderHighlightedText(article.resumo || article.descricao, 160)}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 text-[11px] text-slate-400 gap-1">
                        <div className="flex items-center gap-2">
                          {article.visualizacoes !== undefined && (
                            <span className="flex items-center gap-1">
                              <Eye size={11} />
                              {article.visualizacoes}
                            </span>
                          )}
                          <span>{new Date(article.dataCriacao || '').toLocaleDateString('pt-BR')}</span>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 group-hover:underline">
                          Abrir <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeSector === 'article' ? (
            /* Estado vazio específico para artigos */
            <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
              Nenhum artigo enciclopédico corresponde a "{cleanQuery}".
            </div>
          ) : null}
        </div>
      )}

      {/* 9. ESTADO VAZIO GLOBAL (Quando nada foi encontrado em nenhum setor) */}
      {totalResultsCount === 0 && (
        <div
          className={`p-10 rounded-2xl border text-center transition-all ${
            isWin95
              ? 'win95-window'
              : isGenshin
              ? 'bg-[#181e36] border-[#d3bc8e]/40 text-[#f2dfb7]'
              : isStardew
              ? 'stardew-box bg-[#fffdf8]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Search size={28} />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Nenhum resultado encontrado no setor {parsedQuery.rawTag ? parsedQuery.rawTag : 'selecionado'}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Não encontramos itens correspondentes a{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              "{cleanQuery || searchTerm || 'aos filtros selecionados'}"
            </span>
            . Experimente alternar para o setor "🌐 Tudo", verificar a digitação ou criar um novo verbete!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {parsedQuery.rawTag && (
              <button
                onClick={handleClearSectorTag}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              >
                <Search size={15} />
                <span>Pesquisar em Todos os Setores (Tudo)</span>
              </button>
            )}

            {cleanQuery && (
              <button
                onClick={() => onOpenNewEditor(cleanQuery)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>Criar o artigo "{cleanQuery}"</span>
              </button>
            )}

            {cleanQuery && onNavigateTo404 && (
              <button
                onClick={() => onNavigateTo404(cleanQuery)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition cursor-pointer"
              >
                <FileQuestion size={14} />
                <span>Ver página 404 deste artigo</span>
              </button>
            )}

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Limpar filtros</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <BookOpen size={14} />
              <span>Voltar à Página Principal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
