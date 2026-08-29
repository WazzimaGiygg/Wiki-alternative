import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Plus,
  Calendar,
  Tag,
  CheckCircle2,
  Cpu,
  Smartphone,
  ShieldCheck,
  Server,
  Palette,
  Wrench,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
  User,
  Clock,
  RefreshCw,
  Trash2,
  Check,
  Copy,
  Info,
  Terminal,
  Share2,
  FileText,
} from 'lucide-react';
import { SystemUpdateEntry, UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { useLanguage } from '../context/LanguageContext';

interface SiteUpdatesViewProps {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onSelectSpecialPage?: (page: string) => void;
}

export const SiteUpdatesView: React.FC<SiteUpdatesViewProps> = ({
  currentUser,
  onNavigateHome,
}) => {
  const { t } = useLanguage();
  const [updates, setUpdates] = useState<SystemUpdateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Update Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SystemUpdateEntry['category']>('improvement');
  const [newSummary, setNewSummary] = useState('');
  const [newHighlightsText, setNewHighlightsText] = useState('');
  const [newComponentsText, setNewComponentsText] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getSystemUpdates();
      setUpdates(data);
    } catch (err) {
      console.warn('Erro ao carregar atualizações do sistema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await StorageService.getSystemUpdates();
      setUpdates(data);
      showToast('Histórico de atualizações sincronizado com sucesso.');
    } catch (err) {
      console.warn('Erro na atualização:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyHash = (hash?: string, id?: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    showToast(`Identificador do commit copiado: ${hash}`);
  };

  const handleAddUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim() || !newTitle.trim() || !newSummary.trim()) {
      alert('Por favor, preencha os campos obrigatórios: Versão, Título e Resumo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const highlights = newHighlightsText
        .split('\n')
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      const affectedComponents = newComponentsText
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const created = await StorageService.addSystemUpdate({
        version: newVersion.startsWith('v') ? newVersion : `v${newVersion}`,
        title: newTitle,
        category: newCategory,
        author: currentUser?.displayName || currentUser?.username || 'Desenvolvedor / Administrador',
        authorRole: currentUser?.role === 'admin' ? 'Administrador do Sistema' : 'Editor de Engenharia',
        summary: newSummary,
        highlights: highlights.length > 0 ? highlights : [newSummary],
        badge: newBadge.trim() || undefined,
        affectedComponents: affectedComponents.length > 0 ? affectedComponents : undefined,
      });

      setUpdates((prev) => [created, ...prev.map((u) => ({ ...u, isLatest: false }))]);
      setShowAddModal(false);
      // Reset form
      setNewVersion('');
      setNewTitle('');
      setNewSummary('');
      setNewHighlightsText('');
      setNewComponentsText('');
      setNewBadge('');
      showToast(`Atualização ${created.version} registrada com sucesso na WikiZero!`);
    } catch (err) {
      console.error('Erro ao adicionar atualização:', err);
      alert('Não foi possível salvar a atualização. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUpdate = async (id: string, version: string) => {
    if (!window.confirm(`Tem certeza de que deseja remover o registro da versão ${version}?`)) {
      return;
    }
    try {
      await StorageService.deleteSystemUpdate(id);
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      showToast(`Registro de atualização ${version} removido.`);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(updates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wikizero_atualizacoes_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Histórico de atualizações exportado em JSON.');
  };

  // Filter updates
  const filteredUpdates = useMemo(() => {
    return updates.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.version.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.highlights.some((h) => h.toLowerCase().includes(q)) ||
        (item.affectedComponents && item.affectedComponents.some((c) => c.toLowerCase().includes(q)));

      return matchesCategory && matchesSearch;
    });
  }, [updates, selectedCategory, searchQuery]);

  const latestVersion = updates.length > 0 ? updates[0].version : 'v3.3.0';

  const getCategoryConfig = (category: SystemUpdateEntry['category']) => {
    switch (category) {
      case 'feature':
        return {
          label: 'Novidade',
          icon: Sparkles,
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
          dotBg: 'bg-emerald-500',
        };
      case 'mobile':
        return {
          label: 'Mobile & Touch',
          icon: Smartphone,
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
          dotBg: 'bg-blue-500',
        };
      case 'security':
      case 'compliance':
        return {
          label: 'Segurança & LGPD',
          icon: ShieldCheck,
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          dotBg: 'bg-amber-500',
        };
      case 'backend':
        return {
          label: 'Backend & Nuvem',
          icon: Server,
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
          dotBg: 'bg-indigo-500',
        };
      case 'design':
        return {
          label: 'Interface & Design',
          icon: Palette,
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
          dotBg: 'bg-purple-500',
        };
      case 'fix':
        return {
          label: 'Correção',
          icon: Wrench,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
          dotBg: 'bg-rose-500',
        };
      case 'improvement':
      default:
        return {
          label: 'Melhoria',
          icon: Cpu,
          badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
          dotBg: 'bg-cyan-500',
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={onNavigateHome}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          Início
        </button>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">Especial</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold">
          Atualizações do Site & Notas de Versão
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Background Subtle Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 pointer-events-none blur-3xl" />
        <div className="absolute -right-8 -bottom-8 opacity-10 text-white pointer-events-none">
          <Layers size={220} />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 backdrop-blur-xs">
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              Changelog Contínuo
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              Versão Atual: {latestVersion}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif-heading font-bold text-white tracking-tight">
            Atualizações do Site & Registro de Melhorias
          </h1>

          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            Acompanhe em tempo real cada melhoria, novidade, aprimoramento na interface móvel,
            reforço de segurança e atualização arquitetural implementada neste sistema enciclopédico.
            Transparência total em conformidade com o ecossistema de conhecimento livre.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                Total de Atualizações
              </div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {updates.length} releases
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                Última Melhoria
              </div>
              <div className="text-xs font-semibold text-white mt-1 truncate">
                {updates.length > 0 ? formatDate(updates[0].date) : 'Recente'}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                Disponibilidade
              </div>
              <div className="text-xs font-semibold text-emerald-300 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                100% Online
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                Sincronização
              </div>
              <div className="text-xs font-semibold text-white mt-1 truncate">
                Cloud Firestore & Local
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="input-search-updates"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por versão, título, componente (ex: Mobile, LGPD, v3.2.0)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-refresh-updates"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition disabled:opacity-50"
              title="Atualizar lista"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Sincronizar</span>
            </button>

            <button
              id="btn-export-updates"
              onClick={handleExportJSON}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition"
              title="Exportar dados estruturados"
            >
              <FileText size={14} />
              <span className="hidden xs:inline">Exportar</span> JSON
            </button>

            {isAdmin && (
              <button
                id="btn-open-add-update"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition active:scale-95"
              >
                <Plus size={15} />
                <span>Registrar Melhoria</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter size={12} /> Categoria:
          </span>
          {[
            { id: 'all', label: 'Todas as Atualizações' },
            { id: 'feature', label: '✨ Novidades' },
            { id: 'mobile', label: '📱 Mobile & Touch' },
            { id: 'improvement', label: '⚡ Melhorias' },
            { id: 'compliance', label: '🔒 Segurança & LGPD' },
            { id: 'backend', label: '☁️ Backend & Firestore' },
            { id: 'design', label: '🎨 Design & i18n' },
            { id: 'fix', label: '🛠️ Correções' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List of System Updates */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Carregando notas de versão e melhorias do sistema...
            </p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Info size={32} className="text-slate-400 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Nenhuma atualização encontrada para este filtro
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tente redefinir o termo de pesquisa ou selecionar outra categoria acima.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition"
            >
              Ver todas as atualizações
            </button>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 ml-2 sm:ml-4">
            {filteredUpdates.map((item, index) => {
              const catConfig = getCategoryConfig(item.category);
              const CatIcon = catConfig.icon;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[23px] sm:-left-[31px] top-4 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 ${catConfig.dotBg} shadow-xs flex items-center justify-center`}
                  >
                    {item.isLatest && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </div>

                  {/* Main Card */}
                  <article
                    id={`update-card-${item.id}`}
                    className={`bg-white dark:bg-slate-900 rounded-xl border ${
                      item.isLatest
                        ? 'border-blue-300 dark:border-blue-700/80 shadow-md ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 shadow-xs'
                    } p-5 sm:p-6 transition hover:border-slate-300 dark:hover:border-slate-700 space-y-4`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Version Badge */}
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                          {item.version}
                        </span>

                        {/* Category Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${catConfig.badgeBg}`}
                        >
                          <CatIcon size={12} />
                          <span>{catConfig.label}</span>
                        </span>

                        {/* Special Badges */}
                        {item.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                            {item.badge}
                          </span>
                        )}

                        {item.isLatest && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-white shadow-xs">
                            Recente
                          </span>
                        )}
                      </div>

                      {/* Date & Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1" title={item.date}>
                          <Calendar size={13} />
                          {formatDate(item.date)}
                        </span>
                        {item.author && (
                          <span className="hidden sm:flex items-center gap-1">
                            <User size={13} />
                            {item.author}
                          </span>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteUpdate(item.id, item.version)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition opacity-0 group-hover:opacity-100"
                            title="Excluir este registro"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-2">
                      <h2 className="text-base sm:text-lg font-serif-heading font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    {/* Highlights List */}
                    {item.highlights && item.highlights.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3.5 border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-blue-500" />
                          Principais Recursos e Melhorias Implementadas:
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                          {item.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold mt-0.5">•</span>
                              <span className="leading-snug">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer Row: Affected Components & Commit ID */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                      {/* Affected Components */}
                      {item.affectedComponents && item.affectedComponents.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 font-medium flex items-center gap-1">
                            <Code2 size={12} /> Módulos:
                          </span>
                          {item.affectedComponents.map((comp, ci) => (
                            <span
                              key={ci}
                              className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Commit Reference & Copy */}
                      {item.commitHash && (
                        <button
                          onClick={() => handleCopyHash(item.commitHash, item.id)}
                          className="flex items-center gap-1 font-mono text-[10px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded transition"
                          title="Copiar referência do commit"
                        >
                          <Terminal size={11} />
                          <span>{item.commitHash.substring(0, 12)}...</span>
                          {copiedId === item.id ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Transparency & Open Source Notice */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <Info size={15} className="text-blue-500" />
          <span>Diretrizes de Ciclo de Desenvolvimento & Transparência</span>
        </div>
        <p className="leading-relaxed">
          O sistema <strong>WikiZero / WazzimaGiygg</strong> adota práticas de entrega contínua com
          documentação detalhada de cada módulo. Todas as alterações na arquitetura, segurança,
          leis de privacidade (LGPD/Marco Civil da Internet) e usabilidade são registradas
          nesta página para consulta pública da comunidade.
        </p>
      </div>

      {/* Modal: Registrar Nova Melhoria no Sistema */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-serif-heading font-bold text-base text-slate-900 dark:text-white">
                    Registrar Nova Melhoria do Sistema
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insira uma nova nota de versão no changelog público da WikiZero
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUpdateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Versão */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Versão <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: v3.3.1 ou v3.4.0"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Categoria <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="feature">✨ Novidade (Feature)</option>
                    <option value="mobile">📱 Mobile & Touch</option>
                    <option value="improvement">⚡ Melhoria Geral</option>
                    <option value="compliance">🔒 Segurança & LGPD</option>
                    <option value="backend">☁️ Backend & Firestore</option>
                    <option value="design">🎨 Design & i18n</option>
                    <option value="fix">🛠️ Correção de Erro (Fix)</option>
                  </select>
                </div>
              </div>

              {/* Título */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Título da Atualização <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Otimização de Performance e Cache Offline no PWA"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Resumo */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Resumo Explicativo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Breve descrição do que foi modificado e benefícios para o usuário..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Destaques (um por linha) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Itens Implementados (um por linha)
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex:&#10;Implementação do cache local IndexedDB&#10;Novo botão de sincronização manual&#10;Correção de bug de rolagem no Safari"
                  value={newHighlightsText}
                  onChange={(e) => setNewHighlightsText(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              {/* Componentes Afetados & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Componentes Afetados (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Header.tsx, storageService.ts"
                    value={newComponentsText}
                    onChange={(e) => setNewComponentsText(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Tag / Selo Opcional
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Destaque, Performance, Hotfix"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar e Publicar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
