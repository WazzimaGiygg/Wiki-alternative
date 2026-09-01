import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  FileText,
  Star,
  BarChart2,
  Folder,
  Search,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Calendar,
  History,
  Trash2,
  Hash,
  Download,
  BookOpen,
  MessageSquare,
  Vote,
  Scale,
  UserX,
  Users,
  Upload,
  Image as ImageIcon,
  Gavel,
} from 'lucide-react';
import { WikiArticle, WikiPage, WatchlistItem, UserProfile } from '../types';
import { StorageService } from '../services/storageService';

interface SpecialPagesViewProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  user: UserProfile | null;
  onNavigateToArticle: (articleId: string) => void;
  onNavigateToPage: (pageUid: string) => void;
  onNavigateToUser?: (username: string) => void;
  onNavigateToContactAdmin?: () => void;
  onNavigateToPromotionRequests?: () => void;
  onNavigateToUnblockRequests?: () => void;
  onNavigateToCheckUser?: (username?: string) => void;
  onNavigateToUsersList?: () => void;
  onNavigateToUpload?: () => void;
  onNavigateToFilesList?: () => void;
  onNavigateToArbitration?: () => void;
  initialTab?: 'all' | 'orphans' | 'watchlist' | 'stats' | 'stubs' | 'categories';
}

export const SpecialPagesView: React.FC<SpecialPagesViewProps> = ({
  articles,
  pages,
  user,
  onNavigateToArticle,
  onNavigateToPage,
  onNavigateToUser,
  onNavigateToContactAdmin,
  onNavigateToPromotionRequests,
  onNavigateToUnblockRequests,
  onNavigateToCheckUser,
  onNavigateToUsersList,
  onNavigateToUpload,
  onNavigateToFilesList,
  onNavigateToArbitration,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'orphans' | 'watchlist' | 'stats' | 'stubs' | 'categories'>(
    initialTab
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => StorageService.getWatchlist());

  // Calculate Orphan pages (articles with 0 incoming links)
  const orphanArticles = useMemo(() => {
    return articles.filter((art) => {
      const backlinks = StorageService.getBacklinks(art.titulo, articles);
      return backlinks.length === 0;
    });
  }, [articles]);

  // Calculate Stubs (short articles < 800 bytes or tagged with Esboço)
  const stubArticles = useMemo(() => {
    return articles.filter(
      (art) =>
        art.descricao.length < 800 ||
        art.descricao.includes('{{Esboço') ||
        art.descricao.includes('{{Stub')
    );
  }, [articles]);

  // Categories aggregation
  const categoryMap = useMemo(() => {
    const map = new Map<string, WikiArticle[]>();
    articles.forEach((art) => {
      const cat = art.categoria || 'Geral';
      const list = map.get(cat) || [];
      list.push(art);
      map.set(cat, list);
    });
    return map;
  }, [articles]);

  // General Wiki Statistics
  const stats = useMemo(() => {
    const totalBytes = articles.reduce((acc, a) => acc + (a.descricao?.length || 0), 0);
    const totalViews = articles.reduce((acc, a) => acc + (a.visualizacoes || 0), 0);
    const totalRevisions = articles.reduce((acc, a) => acc + (a.historico?.length || 1), 0);
    const totalWords = articles.reduce(
      (acc, a) => acc + (a.descricao ? a.descricao.trim().split(/\s+/).length : 0),
      0
    );

    const authorMap: Record<string, number> = {};
    articles.forEach((a) => {
      const author = a.autor || 'Anônimo';
      authorMap[author] = (authorMap[author] || 0) + 1;
    });

    const topAuthors = Object.entries(authorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalArticles: articles.length,
      totalPages: pages.length,
      totalBytes,
      totalViews,
      totalRevisions,
      totalWords,
      avgBytes: Math.round(totalBytes / (articles.length || 1)),
      topAuthors,
    };
  }, [articles, pages]);

  // Filtered A-Z articles
  const sortedArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => a.titulo.localeCompare(b.titulo))
      .filter((a) => a.titulo.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [articles, searchQuery]);

  const handleToggleWatch = (art: WikiArticle) => {
    StorageService.toggleWatchlist(art);
    setWatchlist(StorageService.getWatchlist());
  };

  const handleExportFullDump = () => {
    const dump = {
      project: 'WikiZero Enciclopédia Aberta',
      version: '3.0',
      timestamp: new Date().toISOString(),
      articles,
      pages,
      stats,
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WikiZero_Full_Database_Dump_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in select-none">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white font-serif-heading text-lg">
            <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
            <span>Páginas Especiais (Special:SpecialPages)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Painel central de relatórios de conteúdo, ontologia, páginas órfãs, lista de vigilância e estatísticas.
          </p>
        </div>

        <button
          onClick={handleExportFullDump}
          className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs flex-shrink-0"
        >
          <Download size={13} /> Exportar Dump JSON
        </button>
      </div>

      {/* Admin & Community Special Portals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {onNavigateToUpload && (
          <button
            onClick={onNavigateToUpload}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-blue-600 text-white shrink-0">
              <Upload size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate group-hover:underline">
                Special:Upload
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Carregar Ficheiro/Imagem
              </div>
            </div>
          </button>
        )}

        {onNavigateToFilesList && (
          <button
            onClick={onNavigateToFilesList}
            className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-indigo-600 text-white shrink-0">
              <ImageIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate group-hover:underline">
                Special:Files
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Galeria de Ficheiros
              </div>
            </div>
          </button>
        )}

        {onNavigateToUsersList && (
          <button
            onClick={onNavigateToUsersList}
            className="p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-purple-600 text-white shrink-0">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate group-hover:underline">
                Special:ListUsers
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Lista de Usuários
              </div>
            </div>
          </button>
        )}

        {onNavigateToContactAdmin && (
          <button
            onClick={onNavigateToContactAdmin}
            className="p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-blue-600 text-white shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate group-hover:underline">
                Special:ContactAdmin
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Fale com a Administração
              </div>
            </div>
          </button>
        )}

        {onNavigateToPromotionRequests && (
          <button
            onClick={onNavigateToPromotionRequests}
            className="p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-purple-600 text-white shrink-0">
              <Vote size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate group-hover:underline">
                Special:PromotionRequests
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Pedidos de Promoção (RFA)
              </div>
            </div>
          </button>
        )}

        {onNavigateToUnblockRequests && (
          <button
            onClick={onNavigateToUnblockRequests}
            className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-amber-600 text-white shrink-0">
              <Scale size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate group-hover:underline">
                Special:UnblockRequests
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Recursos de Desbloqueio
              </div>
            </div>
          </button>
        )}

        {onNavigateToArbitration && (
          <button
            onClick={onNavigateToArbitration}
            className="p-3 rounded-lg border border-purple-300 dark:border-purple-800/80 bg-purple-100/60 dark:bg-purple-950/40 hover:bg-purple-200/60 dark:hover:bg-purple-900/50 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-purple-700 text-white shrink-0">
              <Gavel size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-950 dark:text-purple-200 truncate group-hover:underline">
                Special:Arbitration
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                Conselho de Arbitragem (ArbCom)
              </div>
            </div>
          </button>
        )}

        {onNavigateToCheckUser && (
          <button
            onClick={() => onNavigateToCheckUser()}
            className="p-3 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-left transition flex items-center gap-2.5 group"
          >
            <div className="p-2 rounded-md bg-rose-600 text-white shrink-0">
              <UserX size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate group-hover:underline">
                Special:CheckUser
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Verificador de Contas
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={13} /> Todas as Páginas ({articles.length})
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'watchlist'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Star size={13} className="text-amber-500" /> Páginas Vigiadas ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('orphans')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'orphans'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle size={13} className="text-amber-500" /> Páginas Órfãs ({orphanArticles.length})
        </button>

        <button
          onClick={() => setActiveTab('stubs')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'stubs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles size={13} className="text-cyan-500" /> Esboços & Curtos ({stubArticles.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Folder size={13} /> Categorias ({categoryMap.size})
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'stats'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 size={13} /> Estatísticas do Sistema
        </button>
      </div>

      {/* Tab 1: All Pages A-Z */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por título de artigo..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Exibindo {sortedArticles.length} de {articles.length} páginas
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {sortedArticles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 text-left"
                  >
                    <FileText size={13} />
                    <span>{art.titulo}</span>
                  </button>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{art.categoria || 'Geral'}</span>
                    <span>•</span>
                    <span>{art.descricao?.length || 0} bytes</span>
                    <span>•</span>
                    <span>v{art.versao || 1}</span>
                    <span>•</span>
                    <span>{art.visualizacoes || 0} visualizações</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleWatch(art)}
                    title={StorageService.isWatched(art.id) ? 'Remover da Lista de Páginas Vigiadas' : 'Vigiar este artigo'}
                    className={`p-1.5 rounded transition ${
                      StorageService.isWatched(art.id)
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Star size={14} fill={StorageService.isWatched(art.id) ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                  >
                    Ler <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <Star size={14} className="text-amber-500" fill="currentColor" />
              Sua Lista de Páginas Vigiadas
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Você pode clicar na estrela ⭐ no topo de qualquer artigo para acompanhá-lo aqui e ser notificado quando novas revisões ou discussões ocorrerem.
            </p>
          </div>

          {watchlist.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
              <Star size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhum artigo vigiado no momento
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Para vigiar uma página, abra qualquer artigo e clique no ícone de estrela na barra superior.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {watchlist.map((item) => (
                <div
                  key={item.articleId}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
                >
                  <div>
                    <button
                      onClick={() => onNavigateToArticle(item.articleId)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 text-left"
                    >
                      <Star size={13} className="text-amber-500" fill="currentColor" />
                      <span>{item.articleTitle}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      Vigiado desde {new Date(item.dataAdicionado).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const art = articles.find((a) => a.id === item.articleId);
                        if (art) handleToggleWatch(art);
                      }}
                      title="Desvigiar página"
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded transition"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => onNavigateToArticle(item.articleId)}
                      className="px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1"
                    >
                      Abrir Artigo <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Orphan Pages */}
      {activeTab === 'orphans' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              Páginas Órfãs (Sem Afluentes)
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Páginas órfãs são artigos enciclopédicos que não possuem links internos vindos de outros artigos. Ajudar a conectar esses artigos com referências cruzadas melhora a navegabilidade de toda a comunidade WikiZero.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {orphanArticles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
              >
                <div>
                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                  >
                    <FileText size={13} />
                    <span>{art.titulo}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {art.resumo || art.descricao.slice(0, 100)}...
                  </p>
                </div>

                <button
                  onClick={() => onNavigateToArticle(art.id)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 flex-shrink-0"
                >
                  Conectar / Editar <ArrowRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Stubs & Short Articles */}
      {activeTab === 'stubs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-cyan-900 dark:text-cyan-300 mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-500" />
              Artigos em Esboço e Páginas Curtas
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Estes artigos contêm informações introdutórias fundamentais, mas necessitam de ampliação com mais seções, tabelas, caixas de informação ou referências.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {stubArticles.map((art) => (
              <div
                key={art.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
              >
                <div>
                  <button
                    onClick={() => onNavigateToArticle(art.id)}
                    className="text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
                  >
                    <span>🧩 {art.titulo}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Tamanho: {art.descricao.length} bytes • Categoria: {art.categoria || 'Geral'}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToArticle(art.id)}
                  className="px-2.5 py-1 text-xs rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition flex items-center gap-1 flex-shrink-0 shadow-xs"
                >
                  Expandir Artigo <ArrowRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from(categoryMap.entries()).map(([cat, arts]) => (
              <div
                key={cat}
                className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Folder size={14} className="text-amber-500" />
                    <span>{cat}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-bold">
                    {arts.length} {arts.length === 1 ? 'artigo' : 'artigos'}
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {arts.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => onNavigateToArticle(a.id)}
                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate block text-left w-full text-[11px]"
                      >
                        • {a.titulo}
                      </button>
                    </li>
                  ))}
                  {arts.length > 4 && (
                    <li className="text-[10px] text-slate-400 italic">
                      + {arts.length - 4} outros artigos
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Statistics */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {stats.totalArticles}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Artigos Totais
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {stats.totalRevisions}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Revisões Salvas
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {stats.totalWords.toLocaleString('pt-BR')}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Palavras Totais
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {(stats.totalBytes / 1024).toFixed(1)} KB
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono font-bold">
                Volume de Texto
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
              <BarChart2 size={14} className="text-blue-600" />
              Principais Contribuidores da Enciclopédia
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {stats.topAuthors.map(([author, count], idx) => (
                <div key={author} className="py-2 flex items-center justify-between">
                  {onNavigateToUser ? (
                    <button
                      onClick={() => onNavigateToUser(author)}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{idx + 1}.</span>
                      <span>User:{author}</span>
                    </button>
                  ) : (
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {idx + 1}. {author}
                    </span>
                  )}
                  <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                    {count} {count === 1 ? 'artigo' : 'artigos'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
