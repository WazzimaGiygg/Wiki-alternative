import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  UploadCloud,
  FileCode,
  Download,
  AlertCircle,
  Eye,
  Sliders,
  X,
  Database,
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
  const [modalMode, setModalMode] = useState<'json' | 'manual'>('json');

  // Manual Form State
  const [newVersion, setNewVersion] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SystemUpdateEntry['category']>('improvement');
  const [newSummary, setNewSummary] = useState('');
  const [newHighlightsText, setNewHighlightsText] = useState('');
  const [newComponentsText, setNewComponentsText] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // JSON File & Text Import States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonInputText, setJsonInputText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notifyUsersOnImport, setNotifyUsersOnImport] = useState(true);
  const [replaceAllExisting, setReplaceAllExisting] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [jsonActiveSubTab, setJsonActiveSubTab] = useState<'upload' | 'raw'>('upload');

  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);

  // Apenas administradores e o superadmin do sistema podem gerenciar e registrar atualizações
  const isAdmin = StorageService.canManageSystemUpdates(currentUser);

  // Interpretação e validação do JSON em tempo real
  const parsedJsonResult = useMemo(() => {
    if (!jsonInputText.trim()) return null;
    return StorageService.parseSystemUpdatesJson(jsonInputText);
  }, [jsonInputText]);

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
    const unsub = StorageService.subscribeToSystemUpdates((liveUpdates) => {
      if (liveUpdates && liveUpdates.length > 0) {
        setUpdates(liveUpdates);
      }
    });
    return () => unsub();
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

  const handleSyncFirebase = async () => {
    if (!isAdmin) return;
    setIsSyncingFirebase(true);
    try {
      const res = await StorageService.syncAllSystemUpdatesToFirebase();
      if (res.success) {
        showToast(`✅ Firebase sincronizado: ${res.count} nota(s) confirmadas no Cloud Firestore.`);
      } else {
        showToast(`⚠️ Sincronização parcial com Firebase: ${res.error || 'Verifique a conexão'}`);
      }
    } catch (err: any) {
      showToast(`Erro ao sincronizar com Firebase: ${err?.message || 'Erro de rede'}`);
    } finally {
      setIsSyncingFirebase(false);
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

  const handleFileSelected = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json') && file.type && !file.type.includes('json')) {
      alert('Por favor, selecione um arquivo válido no formato JSON (.json).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setJsonInputText(content);
      setUploadedFileName(file.name);
      const sizeStr = file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
      setUploadedFileSize(sizeStr);
      showToast(`Arquivo "${file.name}" carregado e interpretado.`);
    };
    reader.onerror = () => {
      alert('Erro ao ler o arquivo JSON selecionado.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateStr = StorageService.getSystemUpdateJsonTemplate();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(templateStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'template_notas_atualizacao_wikizero.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Modelo de arquivo JSON baixado com sucesso.');
  };

  const handleLoadSampleJson = () => {
    const templateStr = StorageService.getSystemUpdateJsonTemplate();
    setJsonInputText(templateStr);
    setUploadedFileName('modelo_oficial_exemplo.json');
    setUploadedFileSize('1.9 KB');
    showToast('Exemplo oficial carregado no interpretador.');
  };

  const handleClearJson = () => {
    setJsonInputText('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Editor de JSON limpo.');
  };

  const handleConfirmJsonImport = async () => {
    if (!isAdmin) {
      alert('Acesso restrito: Apenas administradores do sistema podem registrar e sincronizar notas de atualização no Firebase.');
      return;
    }

    if (!parsedJsonResult || !parsedJsonResult.valid || parsedJsonResult.entries.length === 0) {
      alert('Nenhuma nota válida encontrada para publicação. Verifique as mensagens de erro abaixo.');
      return;
    }

    if (
      replaceAllExisting &&
      !window.confirm(
        '⚠️ ATENÇÃO: Você selecionou "Substituir histórico existente". Todas as notas anteriores no Firebase Firestore serão substituídas por este arquivo JSON. Deseja continuar?'
      )
    ) {
      return;
    }

    setIsImportingJson(true);
    try {
      const res = await StorageService.addSystemUpdatesBatch(parsedJsonResult.entries, {
        replaceAll: replaceAllExisting,
        notifyUsers: notifyUsersOnImport,
        authorFallback: currentUser?.displayName || currentUser?.username || 'Administração da WikiZero',
      });

      const updatedList = await StorageService.getSystemUpdates();
      setUpdates(updatedList);
      setShowAddModal(false);
      handleClearJson();

      if (res.firebaseSynced) {
        showToast(`🎉 Sucesso! ${res.count} nota(s) registradas e sincronizadas no Firebase Firestore (${res.firebaseSyncedCount} docs).`);
      } else {
        showToast(`⚠️ ${res.count} nota(s) salvas no cache local. Alerta Firebase: ${res.firebaseError || 'Aguardando rede'}`);
      }
    } catch (err: any) {
      console.error('Erro ao importar JSON de atualizações:', err);
      alert(`Falha ao persistir notas de atualização: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsImportingJson(false);
    }
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
              <>
                <button
                  id="btn-sync-firebase-updates"
                  onClick={handleSyncFirebase}
                  disabled={isSyncingFirebase}
                  className="px-3 py-2 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                  title="Sincronizar todos os registros de atualização com o Firebase Firestore"
                >
                  <RefreshCw size={14} className={isSyncingFirebase ? 'animate-spin' : ''} />
                  <span>{isSyncingFirebase ? 'Sincronizando...' : 'Sincronizar no Firebase'}</span>
                </button>

                <button
                  id="btn-open-json-import"
                  onClick={() => {
                    setModalMode('json');
                    setShowAddModal(true);
                  }}
                  className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition active:scale-95"
                  title="Importar e registrar notas de atualização em JSON sincronizadas no Firebase Firestore"
                >
                  <FileCode size={15} />
                  <span>Registrar JSON (Admin)</span>
                </button>

                <button
                  id="btn-open-add-update"
                  onClick={() => {
                    setModalMode('manual');
                    setShowAddModal(true);
                  }}
                  className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition active:scale-95"
                  title="Registrar manualmente uma melhoria no sistema"
                >
                  <Plus size={15} />
                  <span className="hidden sm:inline">Registrar Manual</span>
                  <span className="sm:hidden">Manual</span>
                </button>
              </>
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

      {/* Modal: Adicionar Notas de Atualização (Administração) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    modalMode === 'json'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {modalMode === 'json' ? <FileCode size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="font-serif-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    Gestão de Notas de Atualização
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      Administração
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publique melhorias no changelog público da WikiZero interpretando arquivos JSON ou preenchendo manualmente
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

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setModalMode('json')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                  modalMode === 'json'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileCode size={14} />
                <span>Arquivo JSON (Interpretação Inteligente)</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">Recomendado</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('manual')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                  modalMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Plus size={14} />
                <span>Formulário Manual</span>
              </button>
            </div>

            {/* TAB 1: JSON IMPORT & INTERPRETATION */}
            {modalMode === 'json' && (
              <div className="space-y-4 text-xs">
                {/* Drag and Drop Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                      : uploadedFileName
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  />
                  <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {uploadedFileName
                        ? `Arquivo selecionado: ${uploadedFileName}`
                        : 'Arraste e solte o arquivo .json de atualização aqui ou clique para selecionar'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {uploadedFileSize
                        ? `Tamanho: ${uploadedFileSize} • Dados prontos para interpretação`
                        : 'Suporta objetos únicos de atualização ou arrays completos com múltiplas versões'}
                    </p>
                  </div>
                  {uploadedFileName && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold underline mt-1">
                      Clique para trocar de arquivo
                    </span>
                  )}
                </div>

                {/* Editor / Visualizador do Código JSON com Ações */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Code2 size={13} />
                      <span>Conteúdo JSON Interpretado:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSampleJson}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        Carregar Exemplo Modelo
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                        title="Baixar arquivo JSON modelo para preenchimento"
                      >
                        <Download size={12} />
                        <span>Baixar Modelo (.json)</span>
                      </button>
                      {jsonInputText && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <button
                            type="button"
                            onClick={handleClearJson}
                            className="text-[11px] text-rose-500 hover:underline font-semibold"
                          >
                            Limpar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={jsonInputText}
                    onChange={(e) => setJsonInputText(e.target.value)}
                    placeholder='Cole aqui seu JSON de notas de atualização ou carregue um arquivo .json acima...'
                    className="w-full p-2.5 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Feedback de Interpretação e Validação */}
                {!jsonInputText.trim() && (
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Interpretação automática de esquemas:</span>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed">
                        O site interpreta chaves tanto em inglês (<code>version</code>, <code>title</code>, <code>summary</code>, <code>highlights</code>) quanto em português (<code>versao</code>, <code>titulo</code>, <code>resumo</code>, <code>destaques</code>). Você pode fazer upload de um arquivo ou clicar em <strong>"Carregar Exemplo Modelo"</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {parsedJsonResult && !parsedJsonResult.valid && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-300 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-200">
                      <AlertCircle size={15} />
                      <span>Erros encontrados na interpretação do JSON:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {parsedJsonResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedJsonResult && parsedJsonResult.valid && (
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {parsedJsonResult.entries.length} nota(s) de atualização interpretada(s) com sucesso!
                        </span>
                      </div>
                      <span className="text-[11px] font-mono bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-200 font-bold">
                        Schema Válido
                      </span>
                    </div>

                    {/* Preview Cards das Notas Interpretadas */}
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-1">
                        Pré-visualização das Notas que serão publicadas:
                      </div>
                      {parsedJsonResult.entries.map((entry, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {entry.version}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {entry.title}
                              </span>
                              {entry.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  {entry.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {entry.date} • Categoria: {entry.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            {entry.summary}
                          </p>

                          {entry.highlights && entry.highlights.length > 0 && (
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-700 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400">
                                Destaques ({entry.highlights.length}):
                              </span>
                              <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 list-disc pl-4">
                                {entry.highlights.slice(0, 3).map((hl, hidx) => (
                                  <li key={hidx} className="line-clamp-1">{hl}</li>
                                ))}
                                {entry.highlights.length > 3 && (
                                  <li className="text-[10px] text-slate-400 list-none italic font-semibold">
                                    + mais {entry.highlights.length - 3} item(ns)...
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {entry.affectedComponents && entry.affectedComponents.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold">Módulos:</span>
                              {entry.affectedComponents.map((comp, cidx) => (
                                <span
                                  key={cidx}
                                  className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono"
                                >
                                  {comp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opções de Publicação */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {/* Banner de Sincronização Firebase */}
                  <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Database size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      <strong>Sincronização Firebase Firestore:</strong> As notas deste arquivo JSON serão gravadas diretamente na coleção <code>system_updates</code> pelo Administrador, com replicação e subscrição reativa para todos os usuários.
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={notifyUsersOnImport}
                      onChange={(e) => setNotifyUsersOnImport(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">
                      🔔 Disparar notificação comunitária para todos os usuários da WikiZero
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={replaceAllExisting}
                      onChange={(e) => setReplaceAllExisting(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      ⚠️ Substituir todo o histórico existente por este arquivo JSON (caso desmarcado, adiciona/mescla)
                    </span>
                  </label>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmJsonImport}
                    disabled={!parsedJsonResult?.valid || isImportingJson}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    <span>
                      {isImportingJson
                        ? 'Registrando no Firebase...'
                        : `Registrar ${parsedJsonResult?.valid ? parsedJsonResult.entries.length : ''} Nota(s) no Firebase`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL FORM */}
            {modalMode === 'manual' && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};
