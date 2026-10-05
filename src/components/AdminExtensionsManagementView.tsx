import React, { useState, useEffect, useMemo } from 'react';
import {
  Puzzle,
  Shield,
  Crown,
  Search,
  CheckCircle2,
  XCircle,
  Power,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Code,
  Sliders,
  Layers,
  Info,
  Clock,
  BookOpen,
  Sigma,
  FileCode,
  Layout,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  History,
  Download,
  Filter,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import { UserProfile, InstalledExtensionMeta, ExtensionCategory, ExtensionActionLog } from '../types';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';
import { StorageService } from '../services/storageService';

interface AdminExtensionsManagementViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser?: (username: string) => void;
  onBack?: () => void;
}

export const AdminExtensionsManagementView: React.FC<AdminExtensionsManagementViewProps> = ({
  currentUser,
  onNavigateToUser,
  onBack,
}) => {
  const extensionManager = ExtensionManager.getInstance();

  const [extensions, setExtensions] = useState<InstalledExtensionMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'core' | 'custom'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showHooksModal, setShowHooksModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [inspectingExtension, setInspectingExtension] = useState<InstalledExtensionMeta | null>(null);
  const [extensionToDelete, setExtensionToDelete] = useState<InstalledExtensionMeta | null>(null);

  // Notifications / feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // New extension form state
  const [addMode, setAddMode] = useState<'form' | 'catalog' | 'json'>('catalog');
  const [newExtName, setNewExtName] = useState<string>('');
  const [newExtVersion, setNewExtVersion] = useState<string>('1.0.0');
  const [newExtDesc, setNewExtDesc] = useState<string>('');
  const [newExtCategory, setNewExtCategory] = useState<ExtensionCategory>('utility');
  const [newExtAuthor, setNewExtAuthor] = useState<string>('');
  const [newExtWebsite, setNewExtWebsite] = useState<string>('');
  const [newExtScript, setNewExtScript] = useState<string>('');
  const [newExtEnabled, setNewExtEnabled] = useState<boolean>(true);
  const [jsonManifest, setJsonManifest] = useState<string>('');

  // Bureaucrat status
  const userIsBureaucrat = isUserBureaucrat(currentUser);

  // Load extensions list
  const refreshList = () => {
    const list = extensionManager.getAllInstalledExtensions();
    setExtensions(list);
  };

  useEffect(() => {
    refreshList();
    // Subscribe to extension manager events
    const unsubscribe = extensionManager.subscribe(() => {
      refreshList();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Toggle Activation / Deactivation
  const handleToggleExtension = async (ext: InstalledExtensionMeta) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas usuários com a prerrogativa de Burocrata podem ativar ou desativar extensões.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (ext.enabled) {
        const res = extensionManager.deactivateExtension(ext.name, currentUser);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      } else {
        const res = extensionManager.activateExtension(ext.name, currentUser);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
      refreshList();
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao alterar estado: ${err?.message || 'Desconhecido'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Remove Extension
  const handleConfirmDelete = async () => {
    if (!extensionToDelete) return;
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas possuem autorização para desinstalar extensões da Wiki.',
      });
      setExtensionToDelete(null);
      return;
    }

    setIsProcessing(true);
    try {
      const res = extensionManager.removeExtension(extensionToDelete.name, currentUser);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      setExtensionToDelete(null);
      refreshList();
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erro ao remover extensão: ${err?.message || 'Desconhecido'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Add Custom Extension
  const handleCreateExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Ação bloqueada: Apenas Burocratas podem adicionar novas extensões.',
      });
      return;
    }

    if (!newExtName.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe o nome da extensão.' });
      return;
    }

    const res = extensionManager.addExtension(
      {
        name: newExtName.trim(),
        version: newExtVersion.trim() || '1.0.0',
        description: newExtDesc.trim(),
        category: newExtCategory,
        author: newExtAuthor.trim() || currentUser?.displayName || currentUser?.username || 'Burocrata',
        website: newExtWebsite.trim() || undefined,
        customScript: newExtScript.trim() || undefined,
        enabled: newExtEnabled,
      },
      currentUser
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      resetAddForm();
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Handle Quick Install from Catalog
  const handleInstallFromCatalog = (catalogItem: {
    name: string;
    version: string;
    description: string;
    category: ExtensionCategory;
    author: string;
    hooks: string[];
    script?: string;
  }) => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas podem instalar extensões do catálogo.',
      });
      return;
    }

    const res = extensionManager.addExtension(
      {
        name: catalogItem.name,
        version: catalogItem.version,
        description: catalogItem.description,
        category: catalogItem.category,
        author: catalogItem.author,
        hooks: catalogItem.hooks,
        customScript: catalogItem.script,
        enabled: true,
      },
      currentUser
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setShowAddModal(false);
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Handle Import JSON Manifest
  const handleImportJson = () => {
    if (!userIsBureaucrat) {
      setFeedback({
        type: 'error',
        message: 'Apenas Burocratas podem importar manifestos de extensões.',
      });
      return;
    }

    try {
      const parsed = JSON.parse(jsonManifest);
      if (!parsed.name) {
        setFeedback({ type: 'error', message: 'O JSON deve conter ao menos o campo "name".' });
        return;
      }

      const res = extensionManager.addExtension(
        {
          name: parsed.name,
          version: parsed.version || '1.0.0',
          description: parsed.description || '',
          category: parsed.category || 'utility',
          author: parsed.author || currentUser?.displayName || 'Burocrata',
          website: parsed.website,
          customScript: parsed.customScript || parsed.script,
          hooks: Array.isArray(parsed.hooks) ? parsed.hooks : ['render:wikitext'],
          enabled: parsed.enabled !== false,
        },
        currentUser
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setShowAddModal(false);
        setJsonManifest('');
        refreshList();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: `JSON inválido: ${e?.message || 'Formato incorreto'}` });
    }
  };

  const resetAddForm = () => {
    setNewExtName('');
    setNewExtVersion('1.0.0');
    setNewExtDesc('');
    setNewExtCategory('utility');
    setNewExtAuthor('');
    setNewExtWebsite('');
    setNewExtScript('');
    setNewExtEnabled(true);
    setJsonManifest('');
  };

  // Filtered extensions
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      // Category filter
      if (selectedCategory !== 'all' && ext.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && !ext.enabled) return false;
      if (statusFilter === 'inactive' && ext.enabled) return false;
      if (statusFilter === 'core' && !ext.isCore) return false;
      if (statusFilter === 'custom' && ext.isCore) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ext.name.toLowerCase().includes(q);
        const matchesDesc = ext.description.toLowerCase().includes(q);
        const matchesAuthor = ext.author.toLowerCase().includes(q);
        const matchesHooks = ext.hooks.some((h) => h.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesAuthor && !matchesHooks) {
          return false;
        }
      }
      return true;
    });
  }, [extensions, selectedCategory, statusFilter, searchQuery]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = extensions.length;
    const active = extensions.filter((e) => e.enabled).length;
    const inactive = total - active;
    const core = extensions.filter((e) => e.isCore).length;
    const custom = total - core;
    const allHooksCount = extensionManager.getHooksAudit().length;
    return { total, active, inactive, core, custom, allHooksCount };
  }, [extensions]);

  // Pre-configured catalog extensions for quick installation
  const catalogExtensions = [
    {
      name: 'CalculatorToolExtension',
      version: '1.2.0',
      description: 'Calculadora interativa multiúso com modo padrão, científico (trigonometria, logaritmos, potências, raízes), constantes matemáticas e histórico persistente de cálculos.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Tools / Equipe WikiWorldWeb',
      hooks: ['tool:calculator_available', 'tools:registered_tools'],
      script: `// Registro de ferramenta da calculadora
hooks.addFilter('tool:calculator_available', () => true, 10, extensionName);
hooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'calculator'], 10, extensionName);`,
    },
    {
      name: 'WorldClockToolExtension',
      version: '1.3.0',
      description: 'Painel de Horário Certo Mundial com catalogação completa de fusos horários do Brasil (Brasília, Fernando de Noronha, Manaus e Acre), capitais globais e simulador/conversor temporal.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Tools / Equipe WikiWorldWeb',
      hooks: ['tool:world_clock_available', 'tools:registered_tools'],
      script: `// Registro de ferramenta de horário mundial
hooks.addFilter('tool:world_clock_available', () => true, 10, extensionName);
hooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'world-clock'], 10, extensionName);`,
    },
    {
      name: 'WeatherForecastToolExtension',
      version: '1.4.0',
      description: 'Estação meteorológica e previsão do tempo em tempo real com busca global de cidades, geolocalização, índice UV, umidade, vento e previsão estendida de 7 dias.',
      category: 'tool' as ExtensionCategory,
      author: 'WikiZero Meteorologia / Open-Meteo',
      hooks: ['tool:weather_available', 'tools:registered_tools'],
      script: `// Registro de ferramenta de previsão meteorológica
hooks.addFilter('tool:weather_available', () => true, 10, extensionName);
hooks.addFilter('tools:registered_tools', (tools) => [...(tools || []), 'weather'], 10, extensionName);`,
    },
    {
      name: 'DynamicTableFilter',
      version: '1.0.4',
      description: 'Adiciona caixas de busca e ordenação instantânea por coluna em tabelas Wikitext ({| class="wikitable").',
      category: 'interface' as ExtensionCategory,
      author: 'Equipe de Dados WikiZero',
      hooks: ['render:wikitext', 'render:html'],
      script: `// Hook de aprimoramento de tabelas
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  return text.replace(/class="wikitable"/g, 'class="wikitable sortable-table shadow-xs"');
}, 11, extensionName);`,
    },
    {
      name: 'AbbreviationGlossary',
      version: '1.1.0',
      description: 'Detecta siglas comuns (e.g. ONU, OMS, IA, USP) e anexa tooltips com significado por extenso automaticamente.',
      category: 'content' as ExtensionCategory,
      author: 'Linguística & Vocabulário',
      hooks: ['render:wikitext'],
      script: `// Glossário dinâmico de abreviaturas
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  return text.replace(/\\b(ONU|OMS|UNESCO|LGBTQIA\\+|IA|MEC|SUS)\\b/g, '<abbr title="Termo Enciclopédico" class="underline decoration-dotted font-semibold cursor-help">$1</abbr>');
}, 14, extensionName);`,
    },
    {
      name: 'PrintOptimizationCleanView',
      version: '1.2.1',
      description: 'Remove elementos de navegação e ajusta margens e fontes para geração limpa de documentos PDF e impressão física.',
      category: 'formatting' as ExtensionCategory,
      author: 'Publicações WikiWorldWeb',
      hooks: ['render:html'],
      script: `// Otimizador de impressão
hooks.addFilter('render:html', function(html) {
  return '<div class="wiki-clean-print">' + html + '</div>';
}, 25, extensionName);`,
    },
    {
      name: 'ScientificNotationFormatter',
      version: '1.0.2',
      description: 'Formata expoentes científicos e unidades do Sistema Internacional (SI) no padrão tipográfico internacional.',
      category: 'rendering' as ExtensionCategory,
      author: 'Física & Metrologia',
      hooks: ['render:wikitext'],
      script: `// Formatação de grandezas
hooks.addFilter('render:wikitext', function(text) {
  if (!text) return text;
  return text.replace(/(\\d+)\\s*(m\\/s²|km\\/h|m²|m³|cm²)/g, '$1 <span class="font-mono text-xs">$2</span>');
}, 15, extensionName);`,
    },
  ];

  // Render Category Icon
  const getCategoryIcon = (cat: ExtensionCategory) => {
    switch (cat) {
      case 'rendering':
        return <Sigma className="w-4 h-4 text-indigo-500" />;
      case 'formatting':
        return <FileCode className="w-4 h-4 text-purple-500" />;
      case 'content':
        return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'utility':
        return <Sliders className="w-4 h-4 text-amber-500" />;
      case 'interface':
        return <Layout className="w-4 h-4 text-blue-500" />;
      case 'tool':
        return <Sliders className="w-4 h-4 text-cyan-500" />;
      case 'security':
        return <Shield className="w-4 h-4 text-red-500" />;
      default:
        return <Puzzle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (cat: ExtensionCategory) => {
    switch (cat) {
      case 'rendering':
        return 'Renderização';
      case 'formatting':
        return 'Formatação';
      case 'content':
        return 'Conteúdo & Referências';
      case 'utility':
        return 'Utilitários & Métricas';
      case 'interface':
        return 'Interface';
      case 'tool':
        return 'Ferramenta';
      case 'security':
        return 'Segurança';
      default:
        return cat;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Special:Extensions
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Barramento de Módulos & Ganchos
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Puzzle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Gerenciamento de Extensões da Wiki
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Painel soberano de controle de extensões do WikiZero. De acordo com as diretrizes constitucionais,
            <strong> apenas burocratas do Conselho</strong> possuem atribuição para adicionar, remover, ativar ou desativar extensões.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHooksModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
            title="Inspecionar filtros e ações registrados no HookRegistry"
          >
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Barramento de Hooks ({stats.allHooksCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs"
            title="Histórico de ativações e remoções de extensões"
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span>Auditoria</span>
          </button>

          <button
            type="button"
            onClick={() => {
              refreshList();
              setFeedback({ type: 'info', message: 'Lista de extensões atualizada.' });
            }}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Recarregar catálogo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* ADD EXTENSION BUTTON (BUREAUCRAT ONLY) */}
          <button
            type="button"
            onClick={() => {
              if (!userIsBureaucrat) {
                setFeedback({
                  type: 'error',
                  message: 'Acesso restrito: Apenas Burocratas podem adicionar novas extensões.',
                });
                return;
              }
              setShowAddModal(true);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg shadow-sm transition ${
              userIsBureaucrat
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
            }`}
            title={
              userIsBureaucrat
                ? 'Adicionar nova extensão à Wiki'
                : 'Apenas Burocratas podem adicionar extensões'
            }
          >
            {userIsBureaucrat ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span>Nova Extensão</span>
          </button>
        </div>
      </div>

      {/* Bureaucrat Authentication Status Banner */}
      <div className="mt-4">
        {userIsBureaucrat ? (
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 flex items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-emerald-950 dark:text-emerald-100">
                  Prerrogativas de Burocrata Reconhecidas:
                </span>{' '}
                <span>
                  Você está autenticado como <strong>{currentUser?.displayName || currentUser?.username || currentUser?.email}</strong>{' '}
                  ({currentUser?.group || currentUser?.role}). Você possui poderes plenos para <strong>ativar, desativar, adicionar ou remover</strong> extensões do sistema.
                </span>
              </div>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
              Operador Autorizado
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-600 text-white shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-amber-950 dark:text-amber-100">
                  Modo de Somente Leitura (Consulta Pública):
                </span>{' '}
                <span>
                  Você está visualizando o catálogo de extensões instaladas. Por governança constitucional, apenas usuários com a atribuição de{' '}
                  <strong>Burocrata (Bureaucrat)</strong> podem modificar o estado das extensões.
                </span>
              </div>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
              Somente Leitura
            </span>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <Info className="w-4 h-4 text-blue-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Instaladas</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Ativas / Operantes
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-200 mt-1">
            {stats.active}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Desativadas</div>
          <div className="text-2xl font-bold font-mono text-slate-600 dark:text-slate-400 mt-1">
            {stats.inactive}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">Extensões Core</div>
          <div className="text-2xl font-bold font-mono text-purple-800 dark:text-purple-200 mt-1">
            {stats.core}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">Personalizadas</div>
          <div className="text-2xl font-bold font-mono text-indigo-800 dark:text-indigo-200 mt-1">
            {stats.custom}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Ganchos Ativos</div>
          <div className="text-2xl font-bold font-mono text-blue-800 dark:text-blue-200 mt-1">
            {stats.allHooksCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, descrição, gancho (e.g. render:wikitext)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="tool">Ferramentas & Utilitários</option>
            <option value="rendering">Renderização & LaTeX</option>
            <option value="formatting">Formatação & Sintaxe</option>
            <option value="content">Conteúdo & Citações</option>
            <option value="utility">Utilitários & Métricas</option>
            <option value="interface">Interface & Mobile</option>
            <option value="security">Segurança & Moderação</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativas ({stats.active})</option>
            <option value="inactive">Apenas Desativadas ({stats.inactive})</option>
            <option value="core">Apenas Nativas (Core)</option>
            <option value="custom">Apenas Personalizadas</option>
          </select>

          {/* View Layout Toggle */}
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded text-xs font-semibold ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização em Grade"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded text-xs font-semibold ${
                viewLayout === 'table'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visualização em Tabela"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Extensions Listing */}
      <div className="mt-6">
        {filteredExtensions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40">
            <Puzzle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhuma extensão encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Nenhuma extensão corresponde aos critérios de busca ou filtros selecionados.
            </p>
            {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
                className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : viewLayout === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.name}
                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs ${
                  ext.enabled
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                    : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 opacity-80'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {getCategoryIcon(ext.category)}
                        <span>{getCategoryLabel(ext.category)}</span>
                      </span>

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        v{ext.version}
                      </span>

                      {ext.isCore ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Core
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ext.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          Desativada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Author */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {ext.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mantido por: <span className="font-medium text-slate-700 dark:text-slate-300">{ext.author}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                    {ext.description}
                  </p>

                  {/* Registered Hooks Tags */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Pontos de Gancho (Hooks)</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">{ext.hooks.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ext.hooks.map((hook) => (
                        <span
                          key={hook}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {hook}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingExtension(ext)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-2 py-1 rounded transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalhes</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* BUREAUCRAT ONLY: REMOVE BUTTON (Only for non-core extensions) */}
                    {!ext.isCore && (
                      <button
                        type="button"
                        disabled={!userIsBureaucrat || isProcessing}
                        onClick={() => {
                          if (!userIsBureaucrat) {
                            setFeedback({
                              type: 'error',
                              message: 'Apenas Burocratas podem remover extensões instaladas.',
                            });
                            return;
                          }
                          setExtensionToDelete(ext);
                        }}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          userIsBureaucrat
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700'
                            : 'text-slate-400 opacity-50 cursor-not-allowed'
                        }`}
                        title={
                          userIsBureaucrat
                            ? 'Desinstalar e remover extensão'
                            : 'Apenas Burocratas podem remover extensões'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* BUREAUCRAT ONLY: TOGGLE SWITCH (ATIVAR / DESATIVAR) */}
                    <button
                      type="button"
                      disabled={!userIsBureaucrat || isProcessing}
                      onClick={() => handleToggleExtension(ext)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        !userIsBureaucrat
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : ext.enabled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                      title={
                        userIsBureaucrat
                          ? ext.enabled
                            ? 'Clique para desativar a extensão'
                            : 'Clique para ativar a extensão'
                          : 'Apenas Burocratas podem ativar/desativar extensões'
                      }
                    >
                      {!userIsBureaucrat ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Bloqueado</span>
                        </>
                      ) : ext.enabled ? (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>Ativa</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5 opacity-60" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  <tr>
                    <th className="px-4 py-3 font-bold">Extensão</th>
                    <th className="px-3 py-3 font-bold">Categoria</th>
                    <th className="px-3 py-3 font-bold">Versão</th>
                    <th className="px-3 py-3 font-bold">Autor</th>
                    <th className="px-3 py-3 font-bold">Ganchos</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Ação do Burocrata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredExtensions.map((ext) => (
                    <tr
                      key={ext.name}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {ext.name}
                          {ext.isCore && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              Core
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                          {ext.description}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          {getCategoryIcon(ext.category)}
                          <span>{getCategoryLabel(ext.category)}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-purple-700 dark:text-purple-300 font-bold">
                        v{ext.version}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400">
                        {ext.author}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {ext.hooks.length} ganchos
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        {ext.enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Desativada
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingExtension(ext)}
                            className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            title="Ver detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!ext.isCore && (
                            <button
                              type="button"
                              disabled={!userIsBureaucrat || isProcessing}
                              onClick={() => {
                                if (!userIsBureaucrat) {
                                  setFeedback({
                                    type: 'error',
                                    message: 'Apenas Burocratas podem remover extensões instaladas.',
                                  });
                                  return;
                                }
                                setExtensionToDelete(ext);
                              }}
                              className={`p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 ${
                                !userIsBureaucrat ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
                              title={
                                userIsBureaucrat
                                  ? 'Remover extensão'
                                  : 'Apenas Burocratas podem remover extensões'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={!userIsBureaucrat || isProcessing}
                            onClick={() => handleToggleExtension(ext)}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition inline-flex items-center gap-1 ${
                              !userIsBureaucrat
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                : ext.enabled
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {!userIsBureaucrat ? (
                              <Lock className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Power className="w-3 h-3" />
                            )}
                            <span>{ext.enabled ? 'Ativa' : 'Ativar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / INSTALL EXTENSION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Instalar Nova Extensão na Wiki
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prerrogativa exclusiva do Burocrata
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setAddMode('catalog')}
                className={`py-3 px-4 border-b-2 transition ${
                  addMode === 'catalog'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                1. Catálogo Oficial
              </button>
              <button
                type="button"
                onClick={() => setAddMode('form')}
                className={`py-3 px-4 border-b-2 transition ${
                  addMode === 'form'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                2. Extensão Personalizada
              </button>
              <button
                type="button"
                onClick={() => setAddMode('json')}
                className={`py-3 px-4 border-b-2 transition ${
                  addMode === 'json'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                3. Importar JSON
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {addMode === 'catalog' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Selecione um pacote de extensão pré-validado pelo Conselho de Burocratas para instalação imediata:
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {catalogExtensions.map((item) => {
                      const alreadyInstalled = extensions.some((e) => e.name === item.name);
                      return (
                        <div
                          key={item.name}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                                v{item.version}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {getCategoryLabel(item.category)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                              {item.hooks.map((h) => (
                                <span
                                  key={h}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={alreadyInstalled || !userIsBureaucrat}
                            onClick={() => handleInstallFromCatalog(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                              alreadyInstalled
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                            }`}
                          >
                            {alreadyInstalled ? 'Já Instalada' : 'Instalar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {addMode === 'form' && (
                <form onSubmit={handleCreateExtension} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome da Extensão (Sem espaços) *
                      </label>
                      <input
                        type="text"
                        value={newExtName}
                        onChange={(e) => setNewExtName(e.target.value.replace(/\s+/g, ''))}
                        placeholder="Ex: CitationValidator"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Versão (SemVer)
                      </label>
                      <input
                        type="text"
                        value={newExtVersion}
                        onChange={(e) => setNewExtVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Categoria
                      </label>
                      <select
                        value={newExtCategory}
                        onChange={(e) => setNewExtCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="utility">Utilitários & Métricas</option>
                        <option value="formatting">Formatação & Sintaxe</option>
                        <option value="content">Conteúdo & Citações</option>
                        <option value="rendering">Renderização & LaTeX</option>
                        <option value="interface">Interface</option>
                        <option value="security">Segurança</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Autor / Mantenedor
                      </label>
                      <input
                        type="text"
                        value={newExtAuthor}
                        onChange={(e) => setNewExtAuthor(e.target.value)}
                        placeholder={currentUser?.displayName || 'Burocrata'}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descrição da Funcionalidade *
                    </label>
                    <textarea
                      value={newExtDesc}
                      onChange={(e) => setNewExtDesc(e.target.value)}
                      placeholder="Explique o propósito enciclopédico desta extensão..."
                      rows={2}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Código do Gancho / Script (Opcional - JavaScript)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5 font-mono">
                      Recebe as variáveis: <code>hooks</code> (HookRegistry) e <code>extensionName</code>.
                    </p>
                    <textarea
                      value={newExtScript}
                      onChange={(e) => setNewExtScript(e.target.value)}
                      placeholder={`hooks.addFilter('render:wikitext', function(text) {\n  return text;\n}, 10, extensionName);`}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enabledCheck"
                      checked={newExtEnabled}
                      onChange={(e) => setNewExtEnabled(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <label htmlFor="enabledCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                      Ativar extensão imediatamente após o registro
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!userIsBureaucrat}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                    >
                      Registrar Extensão
                    </button>
                  </div>
                </form>
              )}

              {addMode === 'json' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Cole o manifesto JSON da extensão que deseja importar:
                  </p>
                  <textarea
                    value={jsonManifest}
                    onChange={(e) => setJsonManifest(e.target.value)}
                    placeholder={`{\n  "name": "CustomHeaderBanner",\n  "version": "1.0.0",\n  "description": "Exibe aviso no cabeçalho dos artigos",\n  "category": "interface",\n  "author": "Equipe WikiZero",\n  "hooks": ["render:html"]\n}`}
                    rows={8}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 text-purple-300 font-mono text-xs border border-slate-700 leading-relaxed"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!jsonManifest.trim() || !userIsBureaucrat}
                      onClick={handleImportJson}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                    >
                      Importar e Instalar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HOOKS INSPECTOR */}
      {showHooksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Inspeção do Barramento de Ganchos (HookRegistry)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ouvintes ativos para filtros e ações em tempo de execução
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHooksModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5">Nome do Gancho</th>
                      <th className="px-3 py-2.5">Extensão Proprietária</th>
                      <th className="px-3 py-2.5">Prioridade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {extensionManager.getHooksAudit().map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.type === 'filter'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">
                          {item.hookName}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-sans">
                          {item.extensionName}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{item.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUDIT LOGS */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Histórico de Auditoria de Extensões
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registro de ações tomadas por burocratas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {StorageService.getExtensionActionLogs().length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhuma alteração registrada até o momento.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {StorageService.getExtensionActionLogs().map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              log.action === 'activated'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : log.action === 'deactivated'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : log.action === 'added'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.extensionName}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {log.details}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Operador: <span className="font-semibold text-slate-600 dark:text-slate-300">{log.operatorUsername}</span> ({log.operatorRole})
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAILS INSPECTOR */}
      {inspectingExtension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(inspectingExtension.category)}
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {inspectingExtension.name}
                </h3>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  v{inspectingExtension.version}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingExtension(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                  Descrição
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {inspectingExtension.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                    Categoria
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {getCategoryLabel(inspectingExtension.category)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                    Status
                  </span>
                  <span
                    className={`font-bold ${
                      inspectingExtension.enabled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {inspectingExtension.enabled ? 'Ativa no Barramento' : 'Desativada'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                    Autor
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {inspectingExtension.author}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                    Tipo de Componente
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {inspectingExtension.isCore ? 'Nativo do Sistema (Core)' : 'Personalizado'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1.5">
                  Ganchos Conectados (Hooks)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingExtension.hooks.map((h) => (
                    <span
                      key={h}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-purple-700 dark:text-purple-300 font-bold"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {inspectingExtension.website && (
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                    Documentação Externa
                  </span>
                  <a
                    href={inspectingExtension.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{inspectingExtension.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {inspectingExtension.id}
              </span>
              <button
                type="button"
                onClick={() => setInspectingExtension(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {extensionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800 shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Desinstalar Extensão
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Você tem certeza de que deseja remover a extensão{' '}
              <strong className="text-slate-900 dark:text-white">{extensionToDelete.name}</strong>?
              Todos os ganchos e configurações associados serão expurgados da Wiki.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setExtensionToDelete(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
