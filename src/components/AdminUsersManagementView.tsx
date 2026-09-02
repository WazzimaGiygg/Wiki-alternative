import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Search,
  Filter,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Edit3,
  X,
  UserX,
  Scale,
  Vote,
  LayoutGrid,
  List,
  ShieldAlert,
  ArrowUpDown,
  UserCog,
  Check,
  SlidersHorizontal,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileCode,
  MapPin,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  PieChart,
  BarChart3,
  TrendingUp,
  UserPlus,
  Share2,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface AdminUsersManagementViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser: (identifier: string) => void;
  onNavigateToCheckUser?: (username: string) => void;
  onNavigateToUnblockRequests?: () => void;
  onNavigateToPromotionRequests?: () => void;
  onNavigateToContactAdmin?: () => void;
  onBack?: () => void;
}

type MainCategoryFilter = 'all' | 'admin' | 'moderador' | 'editor' | 'leitor' | 'outros' | 'banned';
type SortOption =
  | 'role'
  | 'name_asc'
  | 'name_desc'
  | 'reputation_desc'
  | 'reputation_asc'
  | 'barnstars_desc'
  | 'created_desc'
  | 'created_asc'
  | 'active_desc';

export const AdminUsersManagementView: React.FC<AdminUsersManagementViewProps> = ({
  currentUser,
  onNavigateToUser,
  onNavigateToCheckUser,
  onNavigateToUnblockRequests,
  onNavigateToPromotionRequests,
  onNavigateToContactAdmin,
  onBack,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // General Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<MainCategoryFilter>('all');
  const [subFilterOutros, setSubFilterOutros] = useState<'all_outros' | 'editor' | 'leitor' | 'banned'>('all_outros');
  const [sortBy, setSortBy] = useState<SortOption>('role');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table' | 'stats'>('grid');

  // Advanced Search Drawer / Panel States
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advEmailQuery, setAdvEmailQuery] = useState('');
  const [advBioQuery, setAdvBioQuery] = useState('');
  const [advLocationQuery, setAdvLocationQuery] = useState('');
  const [advRoleFilter, setAdvRoleFilter] = useState<string>('all');
  const [advMinReputation, setAdvMinReputation] = useState<string>('');
  const [advMaxReputation, setAdvMaxReputation] = useState<string>('');
  const [advBarnstarFilter, setAdvBarnstarFilter] = useState<'all' | 'with_barnstars' | 'three_plus'>('all');
  const [advBanStatusFilter, setAdvBanStatusFilter] = useState<'all' | 'active_only' | 'banned_only'>('all');
  const [advDateShortcut, setAdvDateShortcut] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [advStartDate, setAdvStartDate] = useState('');
  const [advEndDate, setAdvEndDate] = useState('');
  const [advHasLgpdConsent, setAdvHasLgpdConsent] = useState(false);
  const [advCanEditOnly, setAdvCanEditOnly] = useState(false);
  const [advCanDeleteOnly, setAdvCanDeleteOnly] = useState(false);

  // Export Feedback
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Admin Rename User Modal State (LGPD / Marco Civil)
  const [targetUserForRename, setTargetUserForRename] = useState<UserProfile | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [renameJustification, setRenameJustification] = useState('Solicitação do Titular de Dados (Art. 18, III LGPD)');
  const [customJustification, setCustomJustification] = useState('');
  const [isProcessingRename, setIsProcessingRename] = useState(false);
  const [renameFeedback, setRenameFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const isRealAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadUsers = async () => {
    setIsLoading(true);
    const communityUsers = await StorageService.getCommunityUsers();
    setUsers(communityUsers);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Compute Active Advanced Filters Count
  const activeAdvFiltersCount = useMemo(() => {
    let count = 0;
    if (advEmailQuery) count++;
    if (advBioQuery) count++;
    if (advLocationQuery) count++;
    if (advRoleFilter !== 'all') count++;
    if (advMinReputation !== '' || advMaxReputation !== '') count++;
    if (advBarnstarFilter !== 'all') count++;
    if (advBanStatusFilter !== 'all') count++;
    if (advDateShortcut !== 'all') count++;
    if (advStartDate || advEndDate) count++;
    if (advHasLgpdConsent) count++;
    if (advCanEditOnly) count++;
    if (advCanDeleteOnly) count++;
    return count;
  }, [
    advEmailQuery,
    advBioQuery,
    advLocationQuery,
    advRoleFilter,
    advMinReputation,
    advMaxReputation,
    advBarnstarFilter,
    advBanStatusFilter,
    advDateShortcut,
    advStartDate,
    advEndDate,
    advHasLgpdConsent,
    advCanEditOnly,
    advCanDeleteOnly,
  ]);

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSubFilterOutros('all_outros');
    setSortBy('role');
    setAdvEmailQuery('');
    setAdvBioQuery('');
    setAdvLocationQuery('');
    setAdvRoleFilter('all');
    setAdvMinReputation('');
    setAdvMaxReputation('');
    setAdvBarnstarFilter('all');
    setAdvBanStatusFilter('all');
    setAdvDateShortcut('all');
    setAdvStartDate('');
    setAdvEndDate('');
    setAdvHasLgpdConsent(false);
    setAdvCanEditOnly(false);
    setAdvCanDeleteOnly(false);
  };

  // Category counts
  const counts = useMemo(() => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const modCount = users.filter((u) => u.role === 'moderador').length;
    const editorCount = users.filter((u) => u.role === 'editor').length;
    const leitorCount = users.filter((u) => u.role === 'leitor' || u.role === 'convidado').length;
    const bannedCount = users.filter((u) => u.isBanned).length;
    const outrosCount = users.filter((u) => u.role !== 'admin' && u.role !== 'moderador').length;
    const totalReputation = users.reduce((acc, u) => acc + (u.reputationScore || 0), 0);
    const totalBarnstars = users.reduce((acc, u) => acc + (u.barnstars?.length || 0), 0);

    return {
      total: users.length,
      admin: adminCount,
      moderador: modCount,
      outros: outrosCount,
      editor: editorCount,
      leitor: leitorCount,
      banned: bannedCount,
      avgReputation: Math.round(totalReputation / (users.length || 1)),
      totalBarnstars,
    };
  }, [users]);

  // Rename modal handlers
  const handleOpenRenameModal = (u: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetUserForRename(u);
    setNewNameInput(u.displayName || u.username || '');
    setRenameJustification('Solicitação do Titular de Dados (Art. 18, III LGPD)');
    setCustomJustification('');
    setRenameFeedback(null);
  };

  const handleExecuteRename = async () => {
    if (!targetUserForRename) return;
    const targetName = newNameInput.trim();
    if (!targetName) {
      setRenameFeedback({ msg: 'Informe o novo nome de exibição.', type: 'error' });
      return;
    }

    const justification =
      renameJustification === 'outros'
        ? customJustification.trim() || 'Retificação Cadastral em conformidade com a LGPD e Marco Civil'
        : renameJustification;

    setIsProcessingRename(true);
    const result = await StorageService.adminUpdateUserName(
      targetUserForRename.uid,
      targetName,
      justification,
      currentUser
    );
    setIsProcessingRename(false);

    if (result.success && result.user) {
      setRenameFeedback({ msg: result.message, type: 'success' });
      await loadUsers();
      setTimeout(() => {
        setTargetUserForRename(null);
        setRenameFeedback(null);
      }, 1800);
    } else {
      setRenameFeedback({ msg: result.message, type: 'error' });
    }
  };

  // Filter and Sort Users with Full Advanced Logic
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      // 1. Primary Text Search
      const name = (u.displayName || u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();
      const location = (u.location || '').toLowerCase();
      const website = (u.website || '').toLowerCase();
      const uid = (u.uid || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      if (query) {
        const matchMain =
          name.includes(query) ||
          email.includes(query) ||
          bio.includes(query) ||
          location.includes(query) ||
          website.includes(query) ||
          uid.includes(query);
        if (!matchMain) return false;
      }

      // 2. Primary Tabs Filter
      if (selectedFilter === 'admin' && u.role !== 'admin') return false;
      if (selectedFilter === 'moderador' && u.role !== 'moderador') return false;
      if (selectedFilter === 'editor' && u.role !== 'editor') return false;
      if (selectedFilter === 'leitor' && u.role !== 'leitor' && u.role !== 'convidado') return false;
      if (selectedFilter === 'banned' && !u.isBanned) return false;
      if (selectedFilter === 'outros') {
        if (subFilterOutros === 'editor' && u.role !== 'editor') return false;
        if (subFilterOutros === 'leitor' && (u.role !== 'leitor' && u.role !== 'convidado')) return false;
        if (subFilterOutros === 'banned' && !u.isBanned) return false;
        if (subFilterOutros === 'all_outros' && (u.role === 'admin' || u.role === 'moderador')) return false;
      }

      // 3. Advanced Search Specific Criteria
      if (advEmailQuery && !email.includes(advEmailQuery.toLowerCase().trim())) return false;
      if (advBioQuery && !bio.includes(advBioQuery.toLowerCase().trim())) return false;
      if (advLocationQuery && !location.includes(advLocationQuery.toLowerCase().trim())) return false;

      if (advRoleFilter !== 'all') {
        if (advRoleFilter === 'admin' && u.role !== 'admin') return false;
        if (advRoleFilter === 'moderador' && u.role !== 'moderador') return false;
        if (advRoleFilter === 'editor' && u.role !== 'editor') return false;
        if (advRoleFilter === 'leitor' && (u.role !== 'leitor' && u.role !== 'convidado')) return false;
        if (advRoleFilter === 'banned' && !u.isBanned) return false;
      }

      // Reputation range
      const rep = u.reputationScore ?? 0;
      if (advMinReputation !== '') {
        const minVal = parseFloat(advMinReputation);
        if (!isNaN(minVal) && rep < minVal) return false;
      }
      if (advMaxReputation !== '') {
        const maxVal = parseFloat(advMaxReputation);
        if (!isNaN(maxVal) && rep > maxVal) return false;
      }

      // Barnstars
      const barnstarCount = u.barnstars?.length || 0;
      if (advBarnstarFilter === 'with_barnstars' && barnstarCount === 0) return false;
      if (advBarnstarFilter === 'three_plus' && barnstarCount < 3) return false;

      // Ban status
      if (advBanStatusFilter === 'active_only' && u.isBanned) return false;
      if (advBanStatusFilter === 'banned_only' && !u.isBanned) return false;

      // Permissions check
      if (advCanEditOnly && !u.permissions?.canEdit && u.role !== 'admin') return false;
      if (advCanDeleteOnly && !u.permissions?.canDelete && u.role !== 'admin') return false;

      // LGPD Consent
      if (advHasLgpdConsent && !u.dataConsentimento && !u.ipConsentimento) return false;

      // Date Filters
      if (u.createdAt) {
        const userDate = new Date(u.createdAt).getTime();
        const now = Date.now();

        if (advDateShortcut === 'today' && now - userDate > 24 * 60 * 60 * 1000) return false;
        if (advDateShortcut === 'week' && now - userDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (advDateShortcut === 'month' && now - userDate > 30 * 24 * 60 * 60 * 1000) return false;
        if (advDateShortcut === 'year' && now - userDate > 365 * 24 * 60 * 60 * 1000) return false;

        if (advStartDate) {
          const start = new Date(advStartDate).getTime();
          if (!isNaN(start) && userDate < start) return false;
        }
        if (advEndDate) {
          const end = new Date(advEndDate).getTime() + 24 * 60 * 60 * 1000;
          if (!isNaN(end) && userDate > end) return false;
        }
      }

      return true;
    });

    // 4. Sorting logic
    return list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        const nameA = (a.displayName || a.username || '').toLowerCase();
        const nameB = (b.displayName || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name_desc') {
        const nameA = (a.displayName || a.username || '').toLowerCase();
        const nameB = (b.displayName || b.username || '').toLowerCase();
        return nameB.localeCompare(nameA);
      }
      if (sortBy === 'reputation_desc') {
        return (b.reputationScore || 0) - (a.reputationScore || 0);
      }
      if (sortBy === 'reputation_asc') {
        return (a.reputationScore || 0) - (b.reputationScore || 0);
      }
      if (sortBy === 'barnstars_desc') {
        return (b.barnstars?.length || 0) - (a.barnstars?.length || 0);
      }
      if (sortBy === 'created_desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'created_asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'active_desc') {
        return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime();
      }

      // Default: Role hierarchy
      const roleWeight: Record<UserRole, number> = {
        admin: 5,
        moderador: 4,
        editor: 3,
        leitor: 2,
        convidado: 1,
      };
      const weightA = a.isBanned ? -1 : roleWeight[a.role] || 0;
      const weightB = b.isBanned ? -1 : roleWeight[b.role] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return (b.reputationScore || 0) - (a.reputationScore || 0);
    });
  }, [
    users,
    searchQuery,
    selectedFilter,
    subFilterOutros,
    sortBy,
    advEmailQuery,
    advBioQuery,
    advLocationQuery,
    advRoleFilter,
    advMinReputation,
    advMaxReputation,
    advBarnstarFilter,
    advBanStatusFilter,
    advDateShortcut,
    advStartDate,
    advEndDate,
    advHasLgpdConsent,
    advCanEditOnly,
    advCanDeleteOnly,
  ]);

  // Export User Directory Handlers
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredUsers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `censo-usuarios-wikizero-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportFeedback('Exportado em JSON com sucesso!');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['UID', 'Nome de Exibição', 'Nome de Usuário', 'Cargo', 'Reputação', 'Condecorações', 'Bloqueado', 'Data de Cadastro', 'Localização'];
    const rows = filteredUsers.map((u) => [
      `"${u.uid}"`,
      `"${(u.displayName || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      `"${u.role}"`,
      u.reputationScore ?? 0,
      u.barnstars?.length || 0,
      u.isBanned ? 'SIM' : 'NÃO',
      `"${u.createdAt || ''}"`,
      `"${(u.location || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `censo-usuarios-wikizero-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportFeedback('Exportado em CSV com sucesso!');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const getRoleBadge = (u: UserProfile) => {
    if (u.isBanned) {
      return {
        label: '🚫 Bloqueado',
        bg: 'bg-rose-100 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
      };
    }
    switch (u.role) {
      case 'admin':
        return {
          label: '🛡️ Administração',
          bg: 'bg-purple-100 dark:bg-purple-950/60',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800',
        };
      case 'moderador':
        return {
          label: '⚖️ Moderação',
          bg: 'bg-blue-100 dark:bg-blue-950/60',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
        };
      case 'editor':
        return {
          label: '✍️ Editor',
          bg: 'bg-emerald-100 dark:bg-emerald-950/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
        };
      case 'leitor':
        return {
          label: '📖 Leitor',
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
        };
      default:
        return {
          label: '👤 Usuário',
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onBack} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            WikiZero
          </button>
          <ChevronRight size={10} className="text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">Páginas Especiais</span>
          <ChevronRight size={10} className="text-slate-400" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">Special:ListUsers</span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
          title="Recarregar Lista do Banco"
        >
          <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          <span>{isRefreshing ? 'Atualizando...' : 'Recarregar'}</span>
        </button>
      </div>

      {/* 2. Header with KPI Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 shadow-xs">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-slate-900 dark:text-white">
                  Busca Avançada & Lista de Usuários Cadastrados
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Diretório integral de contas registradas com busca parametrizada por cargo, reputação, medalhas, datas e conformidade LGPD.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Links & Export */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {onNavigateToCheckUser && (
              <button
                onClick={() => onNavigateToCheckUser('Usuario_Suspeito')}
                className="px-2.5 py-1.5 rounded bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold flex items-center gap-1.5 transition"
              >
                <UserX size={13} />
                <span>Special:CheckUser</span>
              </button>
            )}
            {onNavigateToPromotionRequests && (
              <button
                onClick={onNavigateToPromotionRequests}
                className="px-2.5 py-1.5 rounded bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Vote size={13} />
                <span>Special:PromotionRequests</span>
              </button>
            )}
            {onNavigateToUnblockRequests && (
              <button
                onClick={onNavigateToUnblockRequests}
                className="px-2.5 py-1.5 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold flex items-center gap-1.5 transition"
              >
                <Scale size={13} />
                <span>Special:UnblockRequests</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Stat Cards / Filter Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-5">
          <button
            onClick={() => {
              setSelectedFilter('all');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'all'
                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Geral
            </div>
            <div className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white mt-0.5">
              {counts.total}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Todos os Usuários</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('admin');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'admin'
                ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-purple-50 dark:hover:bg-purple-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Shield size={11} />
              Administração
            </div>
            <div className="text-xl font-bold font-serif-heading text-purple-900 dark:text-purple-200 mt-0.5">
              {counts.admin}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Burocratas & Sysops</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('moderador');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'moderador'
                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <UserCheck size={11} />
              Moderação
            </div>
            <div className="text-xl font-bold font-serif-heading text-blue-900 dark:text-blue-200 mt-0.5">
              {counts.moderador}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Guardiões & Revisores</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('editor');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'editor'
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Edit3 size={11} />
              Editores
            </div>
            <div className="text-xl font-bold font-serif-heading text-emerald-900 dark:text-emerald-200 mt-0.5">
              {counts.editor}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Contribuidores Ativos</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('leitor');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'leitor'
                ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Users size={11} />
              Leitores
            </div>
            <div className="text-xl font-bold font-serif-heading text-amber-900 dark:text-amber-200 mt-0.5">
              {counts.leitor}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Membros da Comunidade</div>
          </button>

          <button
            onClick={() => {
              setSelectedFilter('banned');
              setViewLayout('grid');
            }}
            className={`p-3 rounded-lg border text-left transition ${
              selectedFilter === 'banned'
                ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 ring-1 ring-rose-600'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <ShieldAlert size={11} />
              Bloqueados
            </div>
            <div className="text-xl font-bold font-serif-heading text-rose-900 dark:text-rose-200 mt-0.5">
              {counts.banned}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Suspensões Vandalismo</div>
          </button>
        </div>
      </div>

      {/* 3. Search Bar, Controls & Advanced Search Trigger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome de usuário, e-mail, biografia, cidade, especialidade..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Limpar termo"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Controls: Advanced Toggle, Sort, Layouts & Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Advanced Search Panel */}
            <button
              onClick={() => setShowAdvancedSearch((prev) => !prev)}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition border ${
                showAdvancedSearch || activeAdvFiltersCount > 0
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Busca Avançada</span>
              {activeAdvFiltersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-blue-700 text-[10px] font-bold font-mono">
                  {activeAdvFiltersCount}
                </span>
              )}
              {showAdvancedSearch ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <ArrowUpDown size={12} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="role">Cargo / Hierarquia</option>
                <option value="name_asc">Nome (A-Z)</option>
                <option value="name_desc">Nome (Z-A)</option>
                <option value="reputation_desc">Maior Reputação</option>
                <option value="reputation_asc">Menor Reputação</option>
                <option value="barnstars_desc">Mais Medalhas</option>
                <option value="created_desc">Cadastro Mais Recente</option>
                <option value="created_asc">Cadastro Mais Antigo</option>
                <option value="active_desc">Última Atividade</option>
              </select>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded transition ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Exibição em Cartões"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded transition ${
                  viewLayout === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Exibição em Tabela Técnica"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewLayout('stats')}
                className={`p-1.5 rounded transition ${
                  viewLayout === 'stats'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Censo & Painel de Estatísticas"
              >
                <BarChart3 size={14} />
              </button>
            </div>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1 transition"
                title="Exportar dados filtrados em planilha CSV"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                title="Exportar dados filtrados em JSON"
              >
                <FileCode size={13} />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback alert for export */}
        {exportFeedback && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded flex items-center gap-1.5 animate-in fade-in-50">
            <CheckCircle2 size={13} />
            <span>{exportFeedback}</span>
          </div>
        )}

        {/* 4. Advanced Search Drawer / Form Panel */}
        {showAdvancedSearch && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-lg space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-blue-600" />
                Parâmetros de Busca Avançada
              </h3>
              {activeAdvFiltersCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <X size={11} /> Limpar Todos os Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Filter 1: Role / Cargo */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Cargo / Grupo:
                </label>
                <select
                  value={advRoleFilter}
                  onChange={(e) => setAdvRoleFilter(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Todos os Cargos</option>
                  <option value="admin">🛡️ Administrador (Sysop / Burocrata)</option>
                  <option value="moderador">⚖️ Moderador / Revisor</option>
                  <option value="editor">✍️ Editor Ativo</option>
                  <option value="leitor">📖 Leitor / Convidado</option>
                  <option value="banned">🚫 Bloqueado / Banido</option>
                </select>
              </div>

              {/* Filter 2: Email / Domain */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  E-mail ou Domínio:
                </label>
                <input
                  type="text"
                  value={advEmailQuery}
                  onChange={(e) => setAdvEmailQuery(e.target.value)}
                  placeholder="Ex: @gmail.com, admin..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Filter 3: Location */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Localização / Cidade:
                </label>
                <input
                  type="text"
                  value={advLocationQuery}
                  onChange={(e) => setAdvLocationQuery(e.target.value)}
                  placeholder="Ex: São Paulo, Brasil..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Filter 4: Bio / Keywords */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Biografia / Especialidade:
                </label>
                <input
                  type="text"
                  value={advBioQuery}
                  onChange={(e) => setAdvBioQuery(e.target.value)}
                  placeholder="Ex: LGPD, Ferrovias, Física..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Filter 5: Reputation Range */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Faixa de Reputação (Min - Max):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={advMinReputation}
                    onChange={(e) => setAdvMinReputation(e.target.value)}
                    placeholder="Mínimo"
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    value={advMaxReputation}
                    onChange={(e) => setAdvMaxReputation(e.target.value)}
                    placeholder="Máximo"
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Filter 6: Barnstars / Reconhecimentos */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Condecorações (Barnstars):
                </label>
                <select
                  value={advBarnstarFilter}
                  onChange={(e) => setAdvBarnstarFilter(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Qualquer quantidade</option>
                  <option value="with_barnstars">⭐ Ao menos 1 medalha</option>
                  <option value="three_plus">🏆 3 ou mais medalhas</option>
                </select>
              </div>

              {/* Filter 7: Account Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Status da Conta:
                </label>
                <select
                  value={advBanStatusFilter}
                  onChange={(e) => setAdvBanStatusFilter(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Todas as Contas</option>
                  <option value="active_only">✅ Apenas Contas Ativas (Sem Bloqueio)</option>
                  <option value="banned_only">🚫 Apenas Contas Bloqueadas</option>
                </select>
              </div>

              {/* Filter 8: Date Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Período de Cadastro:
                </label>
                <select
                  value={advDateShortcut}
                  onChange={(e) => setAdvDateShortcut(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Qualquer data</option>
                  <option value="today">Últimas 24 horas</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
                  <option value="year">Último ano</option>
                  <option value="custom">Personalizado (De/Até)...</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range when selected */}
            {advDateShortcut === 'custom' && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-mono">De:</span>
                  <input
                    type="date"
                    value={advStartDate}
                    onChange={(e) => setAdvStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-mono">Até:</span>
                  <input
                    type="date"
                    value={advEndDate}
                    onChange={(e) => setAdvEndDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Checkbox Options: LGPD & Special Permissions */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advHasLgpdConsent}
                  onChange={(e) => setAdvHasLgpdConsent(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Com Consentimento / Auditoria LGPD Registrada</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advCanEditOnly}
                  onChange={(e) => setAdvCanEditOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Com Permissão de Edição</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advCanDeleteOnly}
                  onChange={(e) => setAdvCanDeleteOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Com Permissão de Eliminação de Artigos</span>
              </label>
            </div>
          </div>
        )}

        {/* Primary Filter Tabs: All, Admin, Mod, Outros */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos os Usuários', count: counts.total },
              { id: 'admin', label: '🛡️ Administração', count: counts.admin },
              { id: 'moderador', label: '⚖️ Moderação', count: counts.moderador },
              { id: 'outros', label: '👥 Outros', count: counts.outros },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedFilter(tab.id as MainCategoryFilter);
                  if (viewLayout === 'stats') setViewLayout('grid');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  selectedFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    selectedFilter === tab.id
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sub-filters when "Outros" is selected */}
          {selectedFilter === 'outros' && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 p-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs animate-in fade-in-50">
              <span className="text-[10px] font-mono text-slate-400 px-1">Filtrar Outros:</span>
              <button
                onClick={() => setSubFilterOutros('all_outros')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'all_outros'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos ({counts.outros})
              </button>
              <button
                onClick={() => setSubFilterOutros('editor')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Editores ({counts.editor})
              </button>
              <button
                onClick={() => setSubFilterOutros('leitor')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'leitor'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Leitores ({counts.leitor})
              </button>
              <button
                onClick={() => setSubFilterOutros('banned')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  subFilterOutros === 'banned'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Bloqueados ({counts.banned})
              </button>
            </div>
          )}

          <div className="text-xs text-slate-500 font-mono">
            Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuários
          </div>
        </div>
      </div>

      {/* 5. Users Display Area */}
      {isLoading ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-mono">Carregando diretório de usuários cadastrados...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-400">
          <Users size={40} className="mx-auto mb-2 opacity-30 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 font-serif-heading">
            Nenhum usuário encontrado
          </h3>
          <p className="text-xs mt-1 max-w-md mx-auto">
            Nenhum usuário cadastrado corresponde aos critérios da busca avançada ou filtros selecionados.
          </p>
          <button
            onClick={handleClearAllFilters}
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Limpar Filtros & Ver Todos
          </button>
        </div>
      ) : viewLayout === 'stats' ? (
        /* Layout: Census Analytics & Stats */
        <div className="space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Governance Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <PieChart size={14} className="text-blue-600" />
                Distribuição de Governança
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-purple-600 font-bold">
                    <Shield size={12} /> Administração
                  </span>
                  <span className="font-mono font-bold">{counts.admin} ({Math.round((counts.admin / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full" style={{ width: `${(counts.admin / (counts.total || 1)) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-blue-600 font-bold">
                    <UserCheck size={12} /> Moderação
                  </span>
                  <span className="font-mono font-bold">{counts.moderador} ({Math.round((counts.moderador / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${(counts.moderador / (counts.total || 1)) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Edit3 size={12} /> Editores Ativos
                  </span>
                  <span className="font-mono font-bold">{counts.editor} ({Math.round((counts.editor / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: `${(counts.editor / (counts.total || 1)) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Users size={12} /> Leitores Registrados
                  </span>
                  <span className="font-mono font-bold">{counts.leitor} ({Math.round((counts.leitor / (counts.total || 1)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-full" style={{ width: `${(counts.leitor / (counts.total || 1)) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Box 2: Top Contributors by Reputation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" />
                Líderes de Reputação
              </h3>
              <div className="space-y-2">
                {[...users]
                  .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0))
                  .slice(0, 5)
                  .map((u, i) => (
                    <div
                      key={u.uid}
                      onClick={() => onNavigateToUser(u.displayName || u.username || u.uid)}
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-400 w-4">{i + 1}.</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {u.displayName || u.username}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        ⭐ {u.reputationScore ?? 0} pts
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Box 3: Top Decorated Users (Barnstars) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Award size={14} className="text-purple-600" />
                Quadro de Reconhecimento (Barnstars)
              </h3>
              <div className="space-y-2">
                {[...users]
                  .sort((a, b) => (b.barnstars?.length || 0) - (a.barnstars?.length || 0))
                  .slice(0, 5)
                  .map((u, i) => (
                    <div
                      key={u.uid}
                      onClick={() => onNavigateToUser(u.displayName || u.username || u.uid)}
                      className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-400 w-4">{i + 1}.</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {u.displayName || u.username}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 shrink-0">
                        🏆 {u.barnstars?.length || 0} medalhas
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Diretrizes da Comunidade & Transparência:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                A WikiZero promove transparência editorial com respeito integral à LGPD. Os dados exibidos referem-se à atividade pública editorial, concessão de condecorações comunitárias e controle de auditoria de cargos.
              </p>
            </div>
          </div>
        </div>
      ) : viewLayout === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const roleStyle = getRoleBadge(u);
            const userIdentifier = u.displayName || u.username || u.uid;

            return (
              <div
                key={u.uid}
                onClick={() => onNavigateToUser(userIdentifier)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-lg p-4 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Top Avatar & Name Info */}
                  <div className="flex items-start gap-3">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName || u.username}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold font-serif text-lg shrink-0 shadow-xs">
                        {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {u.displayName || u.username}
                        </h3>
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                        User:{userIdentifier}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          {roleStyle.label}
                        </span>
                        {u.reputationScore !== undefined && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-200 dark:border-amber-800">
                            ⭐ {u.reputationScore} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio Preview */}
                  {u.bio && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                      {u.bio.replace(/[{}[\]=]/g, '').slice(0, 110)}...
                    </p>
                  )}
                </div>

                {/* Bottom Meta & Admin Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-amber-500 font-bold flex items-center gap-0.5" title="Condecorações (Barnstars)">
                      <Award size={11} /> {u.barnstars?.length || 0}
                    </span>
                    {u.location && (
                      <span className="truncate max-w-[110px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5" title={u.location}>
                        <MapPin size={10} /> {u.location}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isRealAdmin && (
                      <button
                        onClick={(e) => handleOpenRenameModal(u, e)}
                        className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 transition"
                        title="Retificar Nome (LGPD Art. 18, III)"
                      >
                        <UserCog size={13} />
                      </button>
                    )}
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                      Ver Perfil <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table Layout */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Usuário / Identificador</th>
                  <th className="py-3 px-4">Cargo / Categoria</th>
                  <th className="py-3 px-4">Reputação</th>
                  <th className="py-3 px-4">Barnstars</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Data de Cadastro</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredUsers.map((u) => {
                  const roleStyle = getRoleBadge(u);
                  const userIdentifier = u.displayName || u.username || u.uid;

                  return (
                    <tr
                      key={u.uid}
                      onClick={() => onNavigateToUser(userIdentifier)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-serif text-xs">
                              {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                              {u.displayName || u.username}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">User:{userIdentifier}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          {roleStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        ⭐ {u.reputationScore ?? 0} pts
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-500">
                        🏆 {u.barnstars?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {u.location || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isRealAdmin && (
                            <button
                              onClick={(e) => handleOpenRenameModal(u, e)}
                              className="p-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 transition"
                              title="Retificar Nome (LGPD)"
                            >
                              <UserCog size={14} />
                            </button>
                          )}
                          <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition font-semibold text-xs flex items-center gap-0.5">
                            Acessar <ChevronRight size={12} />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Admin LGPD User Rename Modal */}
      {targetUserForRename && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 text-xs">
            <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono">
                <Scale size={16} className="text-purple-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Retificação Cadastral de Nome (LGPD Art. 18, III)
                </h3>
              </div>
              <button
                onClick={() => setTargetUserForRename(null)}
                className="text-white/70 hover:text-white p-0.5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200">
                A retificação de nome de usuário altera publicamente a assinatura de artigos, histórico de edições e páginas de discussão, mantendo o registro de auditoria LGPD.
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-mono">
                  Novo Nome de Exibição / Identificador:
                </label>
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-bold focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 font-mono">
                  Fundamento Legal / Justificativa:
                </label>
                <select
                  value={renameJustification}
                  onChange={(e) => setRenameJustification(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="Solicitação do Titular de Dados (Art. 18, III LGPD)">
                    Solicitação do Titular de Dados (Art. 18, III LGPD)
                  </option>
                  <option value="Adequação às Diretrizes Editoriais de Nomenclatura">
                    Adequação às Diretrizes Editoriais de Nomenclatura
                  </option>
                  <option value="Remoção de Dados Sensíveis ou Pessoais Expostos">
                    Remoção de Dados Sensíveis ou Pessoais Expostos
                  </option>
                  <option value="outros">Outro Fundamento (Personalizado)...</option>
                </select>
              </div>

              {renameJustification === 'outros' && (
                <div>
                  <textarea
                    value={customJustification}
                    onChange={(e) => setCustomJustification(e.target.value)}
                    placeholder="Descreva a justificativa jurídica ou editorial..."
                    rows={2}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {renameFeedback && (
                <div
                  className={`p-2 rounded text-[11px] ${
                    renameFeedback.type === 'success'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300'
                  }`}
                >
                  {renameFeedback.msg}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setTargetUserForRename(null)}
                className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteRename}
                disabled={isProcessingRename}
                className="px-3.5 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5"
              >
                {isProcessingRename ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Retificar e Registrar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
