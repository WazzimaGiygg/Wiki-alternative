import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Users,
  Edit3,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  RefreshCw,
  Database,
  Eye,
  PieChart as PieChartIcon,
  Filter,
  ExternalLink,
  ChevronRight,
  Award,
  Sparkles,
  BookOpen,
  X,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { WikiArticle, WikiPage, UserProfile, RecentChangeEntry } from '../types';
import { StorageService } from '../services/storageService';

export interface WikiStatisticsPanelProps {
  pages: WikiPage[];
  articles: WikiArticle[];
  currentUser?: UserProfile | null;
  onNavigate?: (view: any) => void;
  onCreateArticleClick?: () => void;
  onSelectArticle?: (articleId: string) => void;
}

export type TimeRange = '7d' | '14d' | '30d' | '90d' | 'all';
export type GrowthMetricView = 'combined' | 'cumulative' | 'daily_articles' | 'daily_edits';
export type CategoryViewMode = 'dual' | 'donut' | 'bars';
export type CategorySortMode = 'views' | 'articles' | 'avg_views';

export interface DailyDataPoint {
  date: string;
  displayDate: string;
  newArticles: number;
  newEdits: number;
  newUsers: number;
  cumulativeArticles: number;
  cumulativeEdits: number;
  cumulativeUsers: number;
  activeContributors: number;
}

export interface CategoryViewsData {
  name: string;
  totalViews: number;
  articleCount: number;
  avgViews: number;
  sharePercent: number;
  color: string;
  articles: WikiArticle[];
  topArticle?: {
    id: string;
    titulo: string;
    visualizacoes: number;
  };
}

// Paleta curada de alta acessibilidade e contraste para as categorias
export const CATEGORY_COLORS = [
  '#2563eb', // Azul real
  '#059669', // Esmeralda
  '#7c3aed', // Roxo vívido
  '#d97706', // Âmbar / Ouro
  '#0891b2', // Ciano
  '#dc2626', // Carmim / Vermelho
  '#db2777', // Rosa fúcsia
  '#4f46e5', // Índigo
  '#65a30d', // Lima
  '#ea580c', // Laranja
  '#0d9488', // Pato / Teal
  '#64748b', // Ardósia
];

export const WikiStatisticsPanel: React.FC<WikiStatisticsPanelProps> = ({
  pages: fallbackPages,
  articles: fallbackArticles,
  currentUser,
  onNavigate,
  onCreateArticleClick,
  onSelectArticle,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [growthMetricView, setGrowthMetricView] = useState<GrowthMetricView>('combined');
  const [categoryViewMode, setCategoryViewMode] = useState<CategoryViewMode>('dual');
  const [categorySortMode, setCategorySortMode] = useState<CategorySortMode>('views');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Dados reais sincronizados diretamente com o Firestore
  const [realArticles, setRealArticles] = useState<WikiArticle[]>(fallbackArticles || []);
  const [realUsers, setRealUsers] = useState<UserProfile[]>([]);
  const [realCollections, setRealCollections] = useState<WikiPage[]>(fallbackPages || []);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [recentChanges, setRecentChanges] = useState<RecentChangeEntry[]>([]);

  // Metadados da conexão com Firebase Firestore
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [databaseId, setDatabaseId] = useState<string>(
    'ai-studio-wikizeroenciclop-0a14dc90-3ab3-47bc-8306-ca5bc2953699'
  );
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sincronização direta com coleções reais do Firestore
  const syncWithFirebase = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stats, rc] = await Promise.all([
        StorageService.getFirebaseRealStatistics(),
        StorageService.getRecentChanges().catch(() => []),
      ]);

      if (stats) {
        setIsFirebaseConnected(stats.connected);
        if (stats.databaseId) setDatabaseId(stats.databaseId);
        if (stats.latencyMs) setLatencyMs(stats.latencyMs);
        if (stats.lastSyncTimestamp) setLastSyncTime(stats.lastSyncTimestamp);

        if (stats.articles && stats.articles.length > 0) {
          setRealArticles(stats.articles);
        } else if (fallbackArticles && fallbackArticles.length > 0) {
          setRealArticles(fallbackArticles);
        }

        if (stats.users && stats.users.length > 0) {
          setRealUsers(stats.users);
        }

        if (stats.collections && stats.collections.length > 0) {
          setRealCollections(stats.collections);
        } else if (fallbackPages && fallbackPages.length > 0) {
          setRealCollections(fallbackPages);
        }

        if (stats.auditLogs) {
          setAuditLogs(stats.auditLogs);
        }
      }

      setRecentChanges(Array.isArray(rc) ? rc : []);
    } catch (err) {
      console.warn('[WikiStatisticsPanel] Erro ao carregar estatísticas do Firebase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackArticles, fallbackPages]);

  useEffect(() => {
    syncWithFirebase();

    // Inscrever no listener em tempo real (onSnapshot) para atualizar métricas automaticamente
    const unsubscribe = StorageService.subscribeToFirebaseStatistics((realtimeData) => {
      if (realtimeData.articles && realtimeData.articles.length > 0) {
        setRealArticles(realtimeData.articles);
      }
      if (realtimeData.users && realtimeData.users.length > 0) {
        setRealUsers(realtimeData.users);
      }
      if (realtimeData.collections && realtimeData.collections.length > 0) {
        setRealCollections(realtimeData.collections);
      }
      setLastSyncTime(realtimeData.timestamp || new Date().toISOString());
    });

    return () => {
      unsubscribe();
    };
  }, [syncWithFirebase]);

  // Lista consolidada de artigos
  const currentArticles = useMemo(() => {
    if (realArticles && realArticles.length > 0) return realArticles;
    if (fallbackArticles && fallbackArticles.length > 0) return fallbackArticles;
    return [];
  }, [realArticles, fallbackArticles]);

  // Total Real de Artigos
  const totalArticles = useMemo(() => {
    return currentArticles.length;
  }, [currentArticles]);

  // Total Real de Edições
  const totalEdits = useMemo(() => {
    let editsCount = 0;
    currentArticles.forEach((art) => {
      if (art.historico && art.historico.length > 0) {
        editsCount += art.historico.length;
      } else {
        editsCount += 1;
      }
    });

    if (auditLogs.length > 0) {
      const editLogs = auditLogs.filter(
        (l) => l.action === 'article_edited' || l.action === 'article_created'
      ).length;
      editsCount = Math.max(editsCount, editLogs);
    }

    const rcEdits = recentChanges.filter((rc) => rc.type !== 'new_collection').length;
    return Math.max(editsCount, rcEdits, totalArticles);
  }, [currentArticles, auditLogs, recentChanges, totalArticles]);

  // Total Real de Usuários
  const totalUsersCount = useMemo(() => {
    const userIds = new Set<string>();
    realUsers.forEach((u) => {
      if (u.uid) userIds.add(u.uid);
      if (u.username) userIds.add(u.username.toLowerCase());
    });
    if (currentUser?.uid) userIds.add(currentUser.uid);
    if (currentUser?.username) userIds.add(currentUser.username.toLowerCase());

    currentArticles.forEach((art) => {
      if (art.autorUid) userIds.add(art.autorUid);
      if (art.autor) userIds.add(art.autor.toLowerCase());
    });
    return Math.max(userIds.size, realUsers.length, 1);
  }, [realUsers, currentUser, currentArticles]);

  // Coleções reais rastreadas
  const totalCollectionsCount = useMemo(() => {
    return Math.max(realCollections.length, fallbackPages.length, 1);
  }, [realCollections, fallbackPages]);

  // =========================================================================
  // 1. CÁLCULO DA DISTRIBUIÇÃO DE VISUALIZAÇÕES POR CATEGORIA (RECHARTS)
  // =========================================================================
  const categoryStats = useMemo(() => {
    const categoryMap = new Map<string, { totalViews: number; articles: WikiArticle[] }>();
    let grandTotalViews = 0;

    currentArticles.forEach((art) => {
      let cat = (art.categoria || '').trim();
      if (!cat) {
        // Tentar extrair de wikitext [[Categoria:xxx]]
        const match = art.descricao?.match(/\[\[Categoria:([^\]|]+)(?:\|[^\]]*)?\]\]/i);
        if (match && match[1]) {
          cat = match[1].trim();
        } else {
          cat = 'Geral';
        }
      }

      const views = typeof art.visualizacoes === 'number' && art.visualizacoes >= 0 ? art.visualizacoes : 1;
      grandTotalViews += views;

      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { totalViews: 0, articles: [] });
      }
      const entry = categoryMap.get(cat)!;
      entry.totalViews += views;
      entry.articles.push(art);
    });

    if (grandTotalViews === 0) grandTotalViews = 1;

    const list: CategoryViewsData[] = Array.from(categoryMap.entries()).map(([name, data], index) => {
      const sortedArts = [...data.articles].sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
      const top = sortedArts[0];
      const avgViews = Math.round(data.totalViews / data.articles.length);
      const sharePercent = Number(((data.totalViews / grandTotalViews) * 100).toFixed(1));

      return {
        name,
        totalViews: data.totalViews,
        articleCount: data.articles.length,
        avgViews,
        sharePercent,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        articles: sortedArts,
        topArticle: top
          ? {
              id: top.id,
              titulo: top.titulo,
              visualizacoes: top.visualizacoes || 1,
            }
          : undefined,
      };
    });

    // Ordenação configurável
    if (categorySortMode === 'articles') {
      list.sort((a, b) => b.articleCount - a.articleCount);
    } else if (categorySortMode === 'avg_views') {
      list.sort((a, b) => b.avgViews - a.avgViews);
    } else {
      list.sort((a, b) => b.totalViews - a.totalViews);
    }

    const mostViewedCategory = [...list].sort((a, b) => b.totalViews - a.totalViews)[0] || null;
    const mostPopulatedCategory = [...list].sort((a, b) => b.articleCount - a.articleCount)[0] || null;
    const avgViewsPerArticleOverall = Math.round(grandTotalViews / Math.max(1, currentArticles.length));

    return {
      categories: list,
      grandTotalViews,
      totalCategories: list.length,
      mostViewedCategory,
      mostPopulatedCategory,
      avgViewsPerArticleOverall,
    };
  }, [currentArticles, categorySortMode]);

  // Categoria ativa filtrada
  const activeSelectedCategoryData = useMemo(() => {
    if (!selectedCategory) return null;
    return categoryStats.categories.find((c) => c.name === selectedCategory) || null;
  }, [selectedCategory, categoryStats.categories]);

  // =========================================================================
  // 2. GERAÇÃO DA SÉRIE TEMPORAL DE CRESCIMENTO DIÁRIO DE ARTIGOS (RECHARTS)
  // =========================================================================
  const toDateKey = (rawDate?: string): string | null => {
    if (!rawDate) return null;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  const chartData: DailyDataPoint[] = useMemo(() => {
    const days =
      timeRange === '7d'
        ? 7
        : timeRange === '14d'
        ? 14
        : timeRange === '30d'
        ? 30
        : timeRange === '90d'
        ? 90
        : 180;

    const now = new Date();
    const windowDateKeys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      windowDateKeys.push(d.toISOString().split('T')[0]);
    }
    const startDateKey = windowDateKeys[0];

    // Artigos criados por data
    const articlesByDate: Record<string, number> = {};
    let articlesCreatedBeforeWindow = 0;

    currentArticles.forEach((art) => {
      const createdKey = toDateKey(art.dataCriacao);
      if (createdKey) {
        if (createdKey < startDateKey) {
          articlesCreatedBeforeWindow++;
        } else {
          articlesByDate[createdKey] = (articlesByDate[createdKey] || 0) + 1;
        }
      } else {
        articlesCreatedBeforeWindow++;
      }
    });

    // Edições por data
    const editsByDate: Record<string, number> = {};
    let editsDoneBeforeWindow = 0;

    currentArticles.forEach((art) => {
      if (art.historico && art.historico.length > 0) {
        art.historico.forEach((h) => {
          const hKey = toDateKey(h.data);
          if (hKey) {
            if (hKey < startDateKey) {
              editsDoneBeforeWindow++;
            } else {
              editsByDate[hKey] = (editsByDate[hKey] || 0) + 1;
            }
          } else {
            editsDoneBeforeWindow++;
          }
        });
      } else {
        const editKey = toDateKey(art.dataEdicao || art.dataCriacao);
        if (editKey) {
          if (editKey < startDateKey) {
            editsDoneBeforeWindow++;
          } else {
            editsByDate[editKey] = (editsByDate[editKey] || 0) + 1;
          }
        } else {
          editsDoneBeforeWindow++;
        }
      }
    });

    recentChanges.forEach((rc) => {
      const rcKey = toDateKey(rc.data);
      if (rcKey && rcKey >= startDateKey) {
        editsByDate[rcKey] = (editsByDate[rcKey] || 0) + 1;
      }
    });

    // Usuários por data
    const usersByDate: Record<string, number> = {};
    let usersRegisteredBeforeWindow = 0;

    realUsers.forEach((u) => {
      const uKey = toDateKey(u.createdAt);
      if (uKey) {
        if (uKey < startDateKey) {
          usersRegisteredBeforeWindow++;
        } else {
          usersByDate[uKey] = (usersByDate[uKey] || 0) + 1;
        }
      } else {
        usersRegisteredBeforeWindow++;
      }
    });

    // Construção cumulativa dia a dia
    let runningArticles = articlesCreatedBeforeWindow;
    let runningEdits = editsDoneBeforeWindow;
    let runningUsers = usersRegisteredBeforeWindow;

    const points: DailyDataPoint[] = [];

    windowDateKeys.forEach((isoDate, idx) => {
      const dateObj = new Date(isoDate + 'T12:00:00Z');
      const day = dateObj.getUTCDate();
      const month = dateObj
        .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
        .replace('.', '');
      const displayDate = `${day} ${month}`;

      const newArticles = articlesByDate[isoDate] || 0;
      const newEdits = editsByDate[isoDate] || 0;
      const newUsers = usersByDate[isoDate] || 0;

      runningArticles += newArticles;
      runningEdits += newEdits;
      runningUsers += newUsers;

      const isToday = idx === windowDateKeys.length - 1;
      const finalArticles = isToday ? Math.max(runningArticles, totalArticles) : runningArticles;
      const finalEdits = isToday ? Math.max(runningEdits, totalEdits) : runningEdits;
      const finalUsers = isToday ? Math.max(runningUsers, totalUsersCount) : runningUsers;

      const activeContributors = Math.max(
        (newArticles > 0 ? 1 : 0) + (newEdits > 0 ? 1 : 0) + (newUsers > 0 ? 1 : 0),
        1
      );

      points.push({
        date: isoDate,
        displayDate,
        newArticles,
        newEdits,
        newUsers,
        cumulativeArticles: finalArticles,
        cumulativeEdits: finalEdits,
        cumulativeUsers: finalUsers,
        activeContributors,
      });
    });

    return points;
  }, [
    timeRange,
    currentArticles,
    recentChanges,
    realUsers,
    totalArticles,
    totalEdits,
    totalUsersCount,
  ]);

  // Estatísticas de crescimento do período selecionado
  const growthStats = useMemo(() => {
    if (chartData.length < 2) {
      return {
        articlesAdded: 0,
        editsAdded: 0,
        usersAdded: 0,
        pct: '0.0',
        avgArticlesPerDay: '0.0',
        peakDay: { date: 'Hoje', count: 0 },
      };
    }

    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    const articlesAdded = Math.max(0, lastPoint.cumulativeArticles - firstPoint.cumulativeArticles);
    const editsAdded = chartData.reduce((acc, p) => acc + p.newEdits, 0);
    const usersAdded = chartData.reduce((acc, p) => acc + p.newUsers, 0);

    const avgArticlesPerDay = (articlesAdded / chartData.length).toFixed(1);
    const startArticles = firstPoint.cumulativeArticles;
    const pct = startArticles > 0 ? ((articlesAdded / startArticles) * 100).toFixed(1) : '0.0';

    // Dia de pico de criação
    let maxNew = 0;
    let peakDate = chartData[chartData.length - 1].displayDate;
    chartData.forEach((p) => {
      if (p.newArticles >= maxNew) {
        maxNew = p.newArticles;
        peakDate = p.displayDate;
      }
    });

    return {
      articlesAdded,
      editsAdded,
      usersAdded,
      pct,
      avgArticlesPerDay,
      peakDay: { date: peakDate, count: maxNew },
    };
  }, [chartData]);

  const formattedSyncTime = useMemo(() => {
    try {
      const d = new Date(lastSyncTime);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Agora';
    }
  }, [lastSyncTime]);

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 font-sans">
      {/* ========================================================================= */}
      {/* HEADER DO DASHBOARD COM STATUS EM TEMPO REAL                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Dashboard de Estatísticas da Enciclopédia
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoramento contínuo de crescimento de artigos e distribuição de visualizações por categoria.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Firestore Ativo</span>
              <span className="font-mono text-[11px] opacity-75">({latencyMs}ms)</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
              <Database size={12} className="text-blue-500 shrink-0" />
              <span className="truncate max-w-[220px] sm:max-w-none">{databaseId}</span>
            </span>
          </div>
        </div>

        {/* Controles de Janela Temporal & Botão de Sincronização */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            {(
              [
                { id: '7d', label: '7 Dias' },
                { id: '14d', label: '14 Dias' },
                { id: '30d', label: '30 Dias' },
                { id: '90d', label: '90 Dias' },
                { id: 'all', label: 'Tudo' },
              ] as { id: TimeRange; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTimeRange(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  timeRange === item.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={syncWithFirebase}
            disabled={isLoading}
            title={`Sincronizado às ${formattedSyncTime}. Clique para atualizar.`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-blue-500' : 'text-slate-500'} />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="text-[11px] font-mono text-slate-400">{formattedSyncTime}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARDS PRINCIPAIS DE METRICAS E RESUMO (KPIS)                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total de Artigos */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition hover:border-blue-400/60 dark:hover:border-blue-600/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Total de Artigos</span>
            <FileText size={16} className="text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {totalArticles.toLocaleString()}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={13} />
              +{growthStats.articlesAdded}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalCollectionsCount} coleções catalogadas
          </p>
        </div>

        {/* Card 2: Visualizações Totais */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition hover:border-emerald-400/60 dark:hover:border-emerald-600/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Visualizações Totais</span>
            <Eye size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {categoryStats.grandTotalViews.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">leituras</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Média de <strong>{categoryStats.avgViewsPerArticleOverall}</strong> views / verbete
          </p>
        </div>

        {/* Card 3: Crescimento Diário */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition hover:border-amber-400/60 dark:hover:border-amber-600/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Crescimento Diário</span>
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              +{growthStats.pct}%
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {growthStats.avgArticlesPerDay} / dia
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Pico de <strong>{growthStats.peakDay.count}</strong> em {growthStats.peakDay.date}
          </p>
        </div>

        {/* Card 4: Categorias Ativas */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition hover:border-purple-400/60 dark:hover:border-purple-600/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Categorias Ativas</span>
            <PieChartIcon size={16} className="text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {categoryStats.totalCategories}
            </span>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              domínios
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate" title={categoryStats.mostViewedCategory?.name || 'Geral'}>
            Líder: <strong>{categoryStats.mostViewedCategory?.name || 'Geral'}</strong>
          </p>
        </div>

        {/* Card 5: Colaboradores & Edições */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition hover:border-indigo-400/60 dark:hover:border-indigo-600/60 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Edições & Autores</span>
            <Edit3 size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {totalEdits.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              revisões
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <strong>{totalUsersCount}</strong> autores registrados
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: CRESCIMENTO DIÁRIO DE ARTIGOS (RECHARTS)                        */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Crescimento Diário de Artigos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evolução temporal dia a dia da produção e publicação de novos verbetes.
              </p>
            </div>
          </div>

          {/* Seletor de Métrica do Gráfico de Crescimento */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setGrowthMetricView('combined')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                growthMetricView === 'combined'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Combinado
            </button>
            <button
              type="button"
              onClick={() => setGrowthMetricView('cumulative')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                growthMetricView === 'cumulative'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Acumulado
            </button>
            <button
              type="button"
              onClick={() => setGrowthMetricView('daily_articles')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                growthMetricView === 'daily_articles'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Novos / Dia
            </button>
            <button
              type="button"
              onClick={() => setGrowthMetricView('daily_edits')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                growthMetricView === 'daily_edits'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Edições / Dia
            </button>
          </div>
        </div>

        {/* Container do Gráfico Recharts de Crescimento */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {growthMetricView === 'daily_articles' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<DailyGrowthTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={() => 'Novos Artigos Criados no Dia'}
                />
                <Bar dataKey="newArticles" name="Novos Artigos" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : growthMetricView === 'daily_edits' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<DailyGrowthTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={() => 'Edições e Revisões no Dia'}
                />
                <Bar dataKey="newEdits" name="Edições Realizadas" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : growthMetricView === 'cumulative' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulativeArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  allowDecimals={false}
                />
                <Tooltip content={<DailyGrowthTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={() => 'Total de Artigos Acumulados'}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeArticles"
                  name="Artigos Acumulados"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCumulativeArticles)"
                />
              </AreaChart>
            ) : (
              /* Visão Combinada: Curva Acumulada + Barras Diárias */
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulativeCombined" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDailyNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<DailyGrowthTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) =>
                    val === 'cumulativeArticles'
                      ? 'Total de Artigos'
                      : val === 'newArticles'
                      ? 'Novos Artigos / Dia'
                      : val
                  }
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeArticles"
                  name="Total de Artigos"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCumulativeCombined)"
                />
                <Area
                  type="monotone"
                  dataKey="newArticles"
                  name="Novos Artigos / Dia"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDailyNew)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Rodapé Informativo da Série Temporal */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>
              Período selecionado: <strong>+{growthStats.articlesAdded}</strong> novos artigos criados (média de <strong>{growthStats.avgArticlesPerDay}</strong> / dia) e <strong>+{growthStats.editsAdded}</strong> edições gravadas.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onCreateArticleClick && (
              <button
                type="button"
                onClick={onCreateArticleClick}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Criar novo artigo</span>
                <ArrowUpRight size={13} />
              </button>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('recent-changes')}
                className="text-slate-600 dark:text-slate-300 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver mudanças recentes</span>
                <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 2: DISTRIBUIÇÃO DE VISUALIZAÇÕES POR CATEGORIA (RECHARTS)          */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PieChartIcon size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Distribuição de Visualizações por Categoria
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Divisão proporcional do tráfego e leituras acumuladas entre os domínios do conhecimento.
              </p>
            </div>
          </div>

          {/* Controles de Visualização: Rosca (Donut) vs Barras vs Dupla */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setCategoryViewMode('dual')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  categoryViewMode === 'dual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Visão Dupla
              </button>
              <button
                type="button"
                onClick={() => setCategoryViewMode('donut')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  categoryViewMode === 'donut'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Rosca
              </button>
              <button
                type="button"
                onClick={() => setCategoryViewMode('bars')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  categoryViewMode === 'bars'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ranking
              </button>
            </div>

            {/* Ordenação das Categorias */}
            <select
              value={categorySortMode}
              onChange={(e) => setCategorySortMode(e.target.value as CategorySortMode)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="views">Ordenar: Mais Vistas</option>
              <option value="articles">Ordenar: Mais Artigos</option>
              <option value="avg_views">Ordenar: Média / Artigo</option>
            </select>
          </div>
        </div>

        {/* Grade de Gráficos Recharts (Donut + Barras Horizontais) */}
        <div
          className={`grid gap-4 ${
            categoryViewMode === 'dual' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* Gráfico 1: Rosca / Donut de Visualizações por Categoria */}
          {(categoryViewMode === 'dual' || categoryViewMode === 'donut') && (
            <div
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative ${
                categoryViewMode === 'dual' ? 'lg:col-span-5' : 'w-full'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Proporção de Tráfego (% do Total)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {categoryStats.totalCategories} categorias
                </span>
              </div>

              <div className="w-full h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats.categories}
                      dataKey="totalViews"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      animationDuration={800}
                      onClick={(entry) => {
                        if (entry && entry.name) {
                          setSelectedCategory(selectedCategory === entry.name ? null : entry.name);
                        }
                      }}
                    >
                      {categoryStats.categories.map((entry, index) => (
                        <Cell
                          key={`cat-cell-${index}`}
                          fill={entry.color}
                          stroke={selectedCategory === entry.name ? '#0f172a' : '#ffffff'}
                          strokeWidth={selectedCategory === entry.name ? 2.5 : 1.5}
                          className="cursor-pointer transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryPieTooltip grandTotalViews={categoryStats.grandTotalViews} />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro do Gráfico Donut com Total de Visualizações */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                    Total
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {categoryStats.grandTotalViews.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    visualizações
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-2">
                Dica: passe o cursor sobre as fatias para ver detalhes ou clique para filtrar.
              </p>
            </div>
          )}

          {/* Gráfico 2: Ranking de Barras Horizontais (Recharts) */}
          {(categoryViewMode === 'dual' || categoryViewMode === 'bars') && (
            <div
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
                categoryViewMode === 'dual' ? 'lg:col-span-7' : 'w-full'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ranking de Volume de Visualizações
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Top {Math.min(8, categoryStats.categories.length)} categorias
                </span>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={categoryStats.categories.slice(0, 8)}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) =>
                        Number(val) >= 1000 ? `${(Number(val) / 1000).toFixed(1)}k` : String(val)
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      width={125}
                      tickLine={false}
                      tickFormatter={(name) => (name.length > 16 ? `${name.substring(0, 15)}…` : name)}
                    />
                    <Tooltip content={<CategoryBarTooltip />} />
                    <Bar
                      dataKey="totalViews"
                      name="Visualizações"
                      radius={[0, 6, 6, 0]}
                      onClick={(data) => {
                        if (data && data.name) {
                          setSelectedCategory(selectedCategory === data.name ? null : data.name);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {categoryStats.categories.slice(0, 8).map((entry, idx) => (
                        <Cell
                          key={`hbar-${idx}`}
                          fill={entry.color}
                          opacity={selectedCategory && selectedCategory !== entry.name ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FILTRO ATIVO / DRILLDOWN DA CATEGORIA SELECIONADA                          */}
        {/* ========================================================================= */}
        {activeSelectedCategoryData && (
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: activeSelectedCategoryData.color }}
                />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  Categoria Selecionada: {activeSelectedCategoryData.name}
                </h4>
                <span className="text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                  {activeSelectedCategoryData.sharePercent}% do tráfego
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer p-1 rounded-md hover:bg-white dark:hover:bg-slate-800 transition"
              >
                <X size={14} />
                <span>Limpar filtro</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Visualizações</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {activeSelectedCategoryData.totalViews.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Artigos</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {activeSelectedCategoryData.articleCount}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Média / Artigo</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {activeSelectedCategoryData.avgViews.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Participação</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {activeSelectedCategoryData.sharePercent}%
                </span>
              </div>
            </div>

            {/* Listagem de Artigos pertencentes a esta categoria */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                Artigos nesta categoria ({activeSelectedCategoryData.articles.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {activeSelectedCategoryData.articles.map((art, idx) => (
                  <div
                    key={art.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 hover:border-blue-400 transition"
                  >
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">#{idx + 1}</span>
                      {onSelectArticle ? (
                        <button
                          type="button"
                          onClick={() => onSelectArticle(art.id)}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate text-left cursor-pointer"
                          title={art.titulo}
                        >
                          {art.titulo}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={art.titulo}>
                          {art.titulo}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1">
                      <Eye size={11} className="text-slate-400" />
                      {(art.visualizacoes || 1).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TABELA / LISTA DETALHADA DE TODAS AS CATEGORIAS                          */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
              Quadro Comparativo de Categorias & Leituras
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {categoryStats.categories.length} domínios catalogados
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {categoryStats.categories.map((cat, index) => {
              const isSelected = selectedCategory === cat.name;

              return (
                <div
                  key={cat.name}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                  className={`p-3 sm:p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {/* Nome da Categoria e Posição no Ranking */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          ({cat.articleCount} {cat.articleCount === 1 ? 'artigo' : 'artigos'})
                        </span>
                      </div>

                      {/* Barra de Progresso de Participação de Visualizações */}
                      <div className="mt-1.5 flex items-center gap-2 max-w-md">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(4, cat.sharePercent)}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-semibold text-slate-500 shrink-0">
                          {cat.sharePercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas e Artigo Mais Lido */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="font-bold font-mono text-sm text-slate-900 dark:text-white block">
                        {cat.totalViews.toLocaleString()} views
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ~{cat.avgViews.toLocaleString()} / artigo
                      </span>
                    </div>

                    {cat.topArticle && (
                      <div className="text-right max-w-[160px] hidden md:block">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">
                          Mais Lido
                        </span>
                        {onSelectArticle ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cat.topArticle) onSelectArticle(cat.topArticle.id);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block text-right font-medium max-w-[160px] cursor-pointer"
                            title={cat.topArticle.titulo}
                          >
                            {cat.topArticle.titulo}
                          </button>
                        ) : (
                          <span
                            className="text-xs text-slate-700 dark:text-slate-300 truncate block text-right font-medium max-w-[160px]"
                            title={cat.topArticle.titulo}
                          >
                            {cat.topArticle.titulo}
                          </span>
                        )}
                      </div>
                    )}

                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// =========================================================================
// TOOLTIPS CUSTOMIZADOS DO RECHARTS (COM CONTRASTE TOTAL E TEMA ESCURO/CLARO)
// =========================================================================

const DailyGrowthTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xl text-xs font-sans space-y-2 min-w-[180px]">
        <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
          <Calendar size={13} className="text-blue-500" />
          <span>{label}</span>
        </p>

        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => {
            const color = item.color || item.fill || '#2563eb';
            const name =
              item.name === 'cumulativeArticles' || item.name === 'Total de Artigos' || item.name === 'Artigos Acumulados'
                ? 'Total Acumulado'
                : item.name === 'newArticles' || item.name === 'Novos Artigos' || item.name === 'Novos Artigos / Dia'
                ? 'Novos no Dia'
                : item.name === 'newEdits' || item.name === 'Edições Realizadas'
                ? 'Edições no Dia'
                : item.name;

            return (
              <div key={`growth-tt-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{name}:</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {Number(item.value).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CategoryPieTooltip = ({ active, payload, grandTotalViews }: any) => {
  if (active && payload && payload.length) {
    const data: CategoryViewsData = payload[0].payload;
    const views = Number(data.totalViews || 0);
    const percent = grandTotalViews > 0 ? ((views / grandTotalViews) * 100).toFixed(1) : '0';

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xl text-xs font-sans space-y-2 min-w-[200px]">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-slate-900 dark:text-white truncate">{data.name}</span>
        </div>

        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Visualizações:</span>
            <span className="font-bold text-slate-900 dark:text-white">{views.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Participação:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{percent}%</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Total de Artigos:</span>
            <span className="font-bold text-slate-900 dark:text-white">{data.articleCount}</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Média / Artigo:</span>
            <span className="font-bold text-slate-900 dark:text-white">~{data.avgViews.toLocaleString()}</span>
          </div>
        </div>

        {data.topArticle && (
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
            <span className="text-slate-400 block font-mono">Mais Lido:</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold truncate block">
              {data.topArticle.titulo}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CategoryBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: CategoryViewsData = payload[0].payload;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs font-sans space-y-1.5 min-w-[190px]">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-slate-900 dark:text-white truncate">{data.name}</span>
        </div>

        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Visualizações:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {Number(data.totalViews).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Tráfego Total:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.sharePercent}%</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
            <span>Artigos:</span>
            <span className="font-bold text-slate-900 dark:text-white">{data.articleCount}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
