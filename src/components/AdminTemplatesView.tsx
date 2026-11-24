import React, { useState, useEffect, useMemo } from 'react';
import {
  Braces,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Copy,
  Check,
  Save,
  X,
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  Code2,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { UserProfile, WikiTemplate } from '../types';
import { TemplateService } from '../services/templateService';
import { parseWikitext } from '../utils/wikitextParser';
import { sanitizeHtml } from '../utils/sanitizeHtml';

export interface AdminTemplatesViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser?: (username: string) => void;
  onBack?: () => void;
}

const STANDARD_CATEGORIES = [
  'Formatação',
  'Caixas',
  'Avisos',
  'Tabelas',
  'Navegação',
  'Geral',
];

type SortOption = 'name_asc' | 'updated_desc' | 'params_desc';

export const AdminTemplatesView: React.FC<AdminTemplatesViewProps> = ({
  currentUser,
  onNavigateToUser,
  onBack,
}) => {
  const [templates, setTemplates] = useState<WikiTemplate[]>(() =>
    TemplateService.getCachedTemplatesSync()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filtros e ordenação
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Seleção e inspetor
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initial = TemplateService.getCachedTemplatesSync();
    return initial[0]?.id || null;
  });
  const [testParamValues, setTestParamValues] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modo de criação/edição
  const [editorMode, setEditorMode] = useState<'none' | 'create' | 'edit'>('none');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Formatação');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Confirmação de remoção
  const [deleteTarget, setDeleteTarget] = useState<WikiTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Feedback operacional
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [deletedSeedsCount, setDeletedSeedsCount] = useState<number>(() =>
    TemplateService.getDeletedDefaultSeedsCount()
  );

  const isAdminUser =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderador' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com' ||
    Boolean(
      currentUser?.group &&
        (currentUser.group.toLowerCase().includes('admin') ||
          currentUser.group.toLowerCase().includes('burocrata') ||
          currentUser.group.toLowerCase().includes('moderador'))
    );

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => {
      setFeedback((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  useEffect(() => {
    let active = true;

    const handleSync = (list: WikiTemplate[]) => {
      if (!active) return;
      setTemplates(list);
      setDeletedSeedsCount(TemplateService.getDeletedDefaultSeedsCount());
      setSelectedId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id || null;
      });
    };

    const unsubscribe = TemplateService.subscribe(handleSync);

    TemplateService.refreshFromFirestore(true)
      .then((list) => {
        handleSync(list);
      })
      .catch(() => {
        // Cache local já carregado como fallback seguro
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const list = await TemplateService.refreshFromFirestore(true);
      setTemplates(list);
      setDeletedSeedsCount(TemplateService.getDeletedDefaultSeedsCount());
      showToast('info', `Sincronizado com o templateService (${list.length} pré-definições).`);
    } catch {
      showToast('error', 'Não foi possível atualizar a partir do Firestore; exibindo cache local.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const availableCategories = useMemo(() => {
    const cats = new Set<string>(STANDARD_CATEGORIES);
    for (const tpl of templates) {
      if (tpl.category && tpl.category.trim()) {
        cats.add(tpl.category.trim());
      }
    }
    return Array.from(cats);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = templates.filter((tpl) => {
      if (
        categoryFilter !== 'all' &&
        (tpl.category || 'Geral').toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        (tpl.description || '').toLowerCase().includes(q) ||
        (tpl.category || '').toLowerCase().includes(q) ||
        (tpl.authorName || '').toLowerCase().includes(q) ||
        tpl.content.toLowerCase().includes(q) ||
        (tpl.parameters || []).some((p) => p.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'updated_desc') {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      if (sortBy === 'params_desc') {
        const countA = (a.parameters || TemplateService.extractParameters(a.content)).length;
        const countB = (b.parameters || TemplateService.extractParameters(b.content)).length;
        if (countB !== countA) return countB - countA;
      }
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });
  }, [templates, searchQuery, categoryFilter, sortBy]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) || filteredTemplates[0] || null,
    [templates, filteredTemplates, selectedId]
  );

  useEffect(() => {
    setTestParamValues({});
  }, [selectedTemplate?.id]);

  const metrics = useMemo(() => {
    const total = templates.length;
    const dynamicCount = templates.filter(
      (t) => (t.parameters && t.parameters.length > 0) || TemplateService.extractParameters(t.content).length > 0
    ).length;
    const activeCats = new Set(templates.map((t) => (t.category || 'Geral').trim())).size;
    const latestUpdate = templates.reduce<number>((maxTs, tpl) => {
      const ts = Date.parse(tpl.updatedAt || tpl.createdAt || '');
      return Number.isFinite(ts) && ts > maxTs ? ts : maxTs;
    }, 0);
    return {
      total,
      dynamicCount,
      activeCats,
      latestLabel: latestUpdate
        ? new Date(latestUpdate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '—',
    };
  }, [templates]);

  const liveValidation = useMemo(() => {
    if (editorMode === 'none') return null;
    return TemplateService.validateTemplate({
      name: formName,
      content: formContent,
      description: formDescription,
      allowBuiltInName:
        editorMode === 'edit' && editingTemplateId
          ? Boolean(
              templates.find((t) => t.id === editingTemplateId) &&
                TemplateService.isBuiltInParserTemplate(
                  templates.find((t) => t.id === editingTemplateId)!.name
                )
            )
          : false,
    });
  }, [editorMode, formName, formContent, formDescription, editingTemplateId, templates]);

  const editorPreviewHtml = useMemo(() => {
    if (editorMode === 'none' || !formContent.trim()) return '';
    const draft: WikiTemplate = {
      id: editingTemplateId || 'draft-admin-preview',
      name: TemplateService.normalizeTemplateName(formName) || 'PreviaModelo',
      content: formContent,
      description: formDescription,
      category: formCategory,
      parameters: TemplateService.extractParameters(formContent),
      createdAt: '',
      updatedAt: '',
    };
    const snippet = TemplateService.buildInvocationSnippet(draft);
    try {
      const pool = [...templates.filter((t) => t.id !== draft.id), draft];
      const parsed = parseWikitext(snippet, undefined, undefined, pool);
      return sanitizeHtml(parsed.html);
    } catch {
      return '';
    }
  }, [editorMode, editingTemplateId, formName, formContent, formDescription, formCategory, templates]);

  const inspectorParams = useMemo(() => {
    if (!selectedTemplate) return [];
    const params = selectedTemplate.parameters?.length
      ? selectedTemplate.parameters
      : TemplateService.extractParameters(selectedTemplate.content);
    return params.filter((p) => p !== 'content');
  }, [selectedTemplate]);

  const inspectorInvocation = useMemo(() => {
    if (!selectedTemplate) return '';
    const cleanName = TemplateService.normalizeTemplateName(selectedTemplate.name);
    if (inspectorParams.length === 0) return `{{${cleanName}}}`;

    const hasCustomTestValues = Object.values(testParamValues).some((v) => v.trim().length > 0);
    if (!hasCustomTestValues) {
      return TemplateService.buildInvocationSnippet(selectedTemplate);
    }

    const namedOnly = inspectorParams.filter((p) => !/^\d+$/.test(p));
    if (namedOnly.length > 0) {
      const args = namedOnly.map((p) => `${p}=${testParamValues[p] || `Valor de ${p}`}`);
      return `{{${cleanName}|${args.join('|')}}}`;
    }

    const positional = [...inspectorParams]
      .sort((a, b) => Number(a) - Number(b))
      .map((p) => testParamValues[p] || `Parâmetro ${p}`);
    return `{{${cleanName}|${positional.join('|')}}}`;
  }, [selectedTemplate, inspectorParams, testParamValues]);

  const inspectorPreviewHtml = useMemo(() => {
    if (!selectedTemplate || !inspectorInvocation) return '';
    try {
      const parsed = parseWikitext(inspectorInvocation, undefined, undefined, templates);
      return sanitizeHtml(parsed.html);
    } catch {
      return '';
    }
  }, [selectedTemplate, inspectorInvocation, templates]);

  const startCreate = () => {
    setEditingTemplateId(null);
    setFormName('');
    setFormCategory('Formatação');
    setFormDescription('');
    setFormContent(
      "<noinclude>Uso: <code>{{NovoModelo|título=Título|texto=Conteúdo}}</code></noinclude>\n{{Nota|'''{{{título|{{{1|Título do Bloco}}}}}}''' — {{{texto|{{{2|Escreva o conteúdo aqui.}}}}}}}}"
    );
    setEditorMode('create');
  };

  const startEdit = (tpl: WikiTemplate) => {
    setSelectedId(tpl.id);
    setEditingTemplateId(tpl.id);
    setFormName(tpl.name);
    setFormCategory(tpl.category || 'Geral');
    setFormDescription(tpl.description || '');
    setFormContent(tpl.content);
    setEditorMode('edit');
  };

  const startDuplicate = (tpl: WikiTemplate) => {
    setEditingTemplateId(null);
    setFormName(`${tpl.name} Copia`);
    setFormCategory(tpl.category || 'Geral');
    setFormDescription(tpl.description || '');
    setFormContent(tpl.content);
    setEditorMode('create');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveValidation?.valid) {
      showToast('error', liveValidation?.errors[0] || 'Corrija os erros de validação antes de salvar.');
      return;
    }

    setIsSaving(true);
    try {
      if (editorMode === 'edit' && editingTemplateId) {
        const updated = await TemplateService.updateTemplate(editingTemplateId, {
          name: formName,
          category: formCategory.trim() || 'Geral',
          description: formDescription,
          content: formContent,
        });
        setSelectedId(updated.id);
        setEditorMode('none');
        showToast('success', `Pré-definição "{{${updated.name}}}" atualizada com sucesso.`);
      } else {
        const duplicateName = templates.find(
          (t) => TemplateService.toLookupKey(t.name) === TemplateService.toLookupKey(formName)
        );
        if (duplicateName) {
          showToast(
            'error',
            `Já existe uma pré-definição cadastrada com o nome "{{${duplicateName.name}}}".`
          );
          setIsSaving(false);
          return;
        }
        const created = await TemplateService.createTemplate({
          name: formName,
          category: formCategory.trim() || 'Geral',
          description: formDescription,
          content: formContent,
          authorUid: currentUser?.uid,
          authorName: currentUser?.displayName || currentUser?.username || 'Administrador',
        });
        setSelectedId(created.id);
        setEditorMode('none');
        showToast('success', `Pré-definição "{{${created.name}}}" criada e publicada.`);
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao salvar pré-definição.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetName = deleteTarget.name;
    const targetId = deleteTarget.id;
    try {
      await TemplateService.deleteTemplate(targetId);
      setDeleteTarget(null);
      if (editingTemplateId === targetId) {
        setEditorMode('none');
        setEditingTemplateId(null);
      }
      if (selectedId === targetId) {
        const remaining = templates.filter((t) => t.id !== targetId);
        setSelectedId(remaining[0]?.id || null);
      }
      showToast('success', `Pré-definição "{{${targetName}}}" removida do sistema.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao remover pré-definição.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreDefaults = async () => {
    const restored = await TemplateService.restoreDefaultTemplates();
    setTemplates(restored);
    setDeletedSeedsCount(0);
    showToast('success', 'Modelos padrão do sistema restaurados.');
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 2000);
    } catch {
      showToast('error', 'Não foi possível copiar para a área de transferência.');
    }
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(templates, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wikiworldweb_templates_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('info', 'Arquivo JSON com todas as pré-definições exportado.');
  };

  const insertTokenIntoContent = (token: string) => {
    setFormContent((prev) => `${prev}${prev && !prev.endsWith('\n') ? ' ' : ''}${token}`);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!isAdminUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Acesso restrito à administração
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            O gerenciamento administrativo de pré-definições globais ({'Special:Templates'}) é
            reservado a administradores, burocratas e moderadores autenticados.
          </p>
          {onBack && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar à Wiki
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-16">
      {/* Top Breadcrumb & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {onBack && (
              <>
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span>Administração</span>
            <span aria-hidden="true">/</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">Special:Templates</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Braces className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Administração de Pré-Definições
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Liste, valide, edite e remova modelos reutilizáveis no padrão MediaWiki ({'{{Nome|parâmetro}}'}).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {deletedSeedsCount > 0 && (
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrões ({deletedSeedsCount})
            </button>
          )}
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Pré-Definição
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`px-4 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Fechar aviso"
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total cadastradas</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {metrics.total}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Com parâmetros dinâmicos</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {metrics.dynamicCount}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Categorias em uso</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {metrics.activeCats}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Última atualização</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {metrics.latestLabel}
          </div>
        </div>
      </div>

      {/* Inline Create / Edit Panel */}
      {editorMode !== 'none' && (
        <section
          aria-label={editorMode === 'edit' ? 'Editar pré-definição' : 'Nova pré-definição'}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900">
            <div className="flex items-center gap-2 min-w-0">
              <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {editorMode === 'edit'
                  ? `Editar Pré-Definição: {{${formName || '...'}}}`
                  : 'Cadastrar Nova Pré-Definição'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditorMode('none');
                setEditingTemplateId(null);
              }}
              aria-label="Cancelar edição"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="admin-tpl-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Nome da Pré-Definição
                  </label>
                  <input
                    id="admin-tpl-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: CaixaResumo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-tpl-category"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Categoria
                  </label>
                  <input
                    id="admin-tpl-category"
                    type="text"
                    list="admin-tpl-categories"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Formatação"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="admin-tpl-categories">
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-tpl-desc"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Descrição Editorial
                </label>
                <input
                  id="admin-tpl-desc"
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descreva a finalidade e os parâmetros aceitos por esta pré-definição"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="admin-tpl-content"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Código Wikitexto da Pré-Definição
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertTokenIntoContent('{{{1|padrão}}}')}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + {'{{{1}}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoContent('{{{titulo|Título}}}')}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + {'{{{titulo}}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoContent('<noinclude>Documentação</noinclude>')}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + {'<noinclude>'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoContent('<includeonly>...</includeonly>')}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + {'<includeonly>'}
                    </button>
                  </div>
                </div>
                <textarea
                  id="admin-tpl-content"
                  rows={8}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Validation Diagnostics */}
              {liveValidation && (
                <div className="space-y-2 text-xs">
                  {liveValidation.errors.length > 0 && (
                    <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 space-y-1">
                      {liveValidation.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {liveValidation.warnings.length > 0 && (
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 space-y-1">
                      {liveValidation.warnings.map((warn, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-slate-600 dark:text-slate-400">
                    Parâmetros detectados:{' '}
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {liveValidation.extractedParameters.length > 0
                        ? liveValidation.extractedParameters.map((p) => `{{{${p}}}}`).join(' · ')
                        : 'Nenhum parâmetro dinâmico'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode('none');
                    setEditingTemplateId(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || (liveValidation ? !liveValidation.valid : false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving
                    ? 'Salvando...'
                    : editorMode === 'edit'
                    ? 'Salvar Alterações'
                    : 'Criar Pré-Definição'}
                </button>
              </div>
            </div>

            {/* Live Preview in Editor */}
            <div className="lg:col-span-5 flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Prévia Renderizada (Transclusão)
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                  {`{{${TemplateService.normalizeTemplateName(formName) || 'PreviaModelo'}}}`}
                </span>
              </div>
              <div className="p-4 flex-1 overflow-auto min-h-[240px]">
                {editorPreviewHtml ? (
                  <div
                    className="wiki-content prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: editorPreviewHtml }}
                  />
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Digite o conteúdo wikitexto à esquerda para visualizar o resultado expandido.
                  </p>
                )}
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Search, Category Filter & Sort Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, descrição, autor ou parâmetro..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <label htmlFor="admin-tpl-sort" className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Ordenar:
            </label>
            <select
              id="admin-tpl-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name_asc">Nome (A–Z)</option>
              <option value="updated_desc">Atualizadas recentemente</option>
              <option value="params_desc">Mais parâmetros</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({templates.length})
          </button>
          {availableCategories.map((cat) => {
            const count = templates.filter(
              (t) => (t.category || 'Geral').toLowerCase() === cat.toLowerCase()
            ).length;
            if (count === 0) return null;
            const active = categoryFilter.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: List Table + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Templates Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3" aria-busy="true" aria-label="Carregando pré-definições">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Braces className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Nenhuma pré-definição encontrada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {templates.length === 0
                  ? 'Ainda não há pré-definições cadastradas no templateService.'
                  : 'Nenhum registro corresponde aos filtros atuais de busca ou categoria.'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                    }}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar Primeira Pré-Definição
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900">
                    <th className="py-2.5 px-4">Pré-definição</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3 text-right">Parâmetros</th>
                    <th className="py-2.5 px-3 text-right">Atualizada</th>
                    <th className="py-2.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredTemplates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    const paramList = (
                      tpl.parameters?.length
                        ? tpl.parameters
                        : TemplateService.extractParameters(tpl.content)
                    ).filter((p) => p !== 'content');

                    return (
                      <tr
                        key={tpl.id}
                        onClick={() => setSelectedId(tpl.id)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-3 px-4 max-w-[260px]">
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {`{{${tpl.name}}}`}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {tpl.description || 'Sem descrição cadastrada'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {tpl.category || 'Geral'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {paramList.length}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(tpl.updatedAt || tpl.createdAt)}
                        </td>
                        <td
                          className="py-3 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedId(tpl.id)}
                              title="Inspecionar e testar"
                              aria-label={`Inspecionar ${tpl.name}`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(tpl)}
                              title="Editar pré-definição"
                              aria-label={`Editar ${tpl.name}`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(tpl)}
                              title="Remover pré-definição"
                              aria-label={`Remover ${tpl.name}`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Inspector & Live Expansion Tester */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {selectedTemplate ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Header */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 truncate">
                      {`{{${selectedTemplate.name}}}`}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{selectedTemplate.category || 'Geral'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {inspectorParams.length}{' '}
                        {inspectorParams.length === 1 ? 'parâmetro' : 'parâmetros'}
                      </span>
                      <span aria-hidden="true">·</span>
                      {onNavigateToUser && selectedTemplate.authorName ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToUser(selectedTemplate.authorName!)}
                          className="hover:underline text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          {selectedTemplate.authorName}
                        </button>
                      ) : (
                        <span>{selectedTemplate.authorName || 'Sistema'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(selectedTemplate)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selectedTemplate)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 text-xs font-semibold text-red-700 dark:text-red-300 transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedTemplate.description || 'Nenhuma descrição informada para este modelo.'}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  <span>ID: {selectedTemplate.id}</span>
                  <span>Atualizada: {formatDate(selectedTemplate.updatedAt || selectedTemplate.createdAt)}</span>
                </div>
              </div>

              {/* Invocation Snippet & Parameter Test Inputs */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sintaxe de Invocação
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startDuplicate(selectedTemplate)}
                      className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Duplicar modelo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy('snippet', inspectorInvocation)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'snippet' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar Uso
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
                  {inspectorInvocation}
                </div>

                {inspectorParams.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Simular valores de parâmetros
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {inspectorParams.map((param) => (
                        <div key={param}>
                          <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                            {`{{{${param}}}}`}
                          </label>
                          <input
                            type="text"
                            value={testParamValues[param] || ''}
                            onChange={(e) =>
                              setTestParamValues((prev) => ({
                                ...prev,
                                [param]: e.target.value,
                              }))
                            }
                            placeholder={`Valor para ${param}`}
                            className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rendered Output Preview */}
              <div className="p-5 space-y-2.5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Renderização no ArticleViewer
                </div>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 overflow-x-auto">
                  {inspectorPreviewHtml ? (
                    <div
                      className="wiki-content prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: inspectorPreviewHtml }}
                    />
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Prévia indisponível para esta definição.
                    </p>
                  )}
                </div>
              </div>

              {/* Raw Source */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Código-Fonte Armazenado
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('source', selectedTemplate.content)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'source' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap break-words max-h-56">
                  {selectedTemplate.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Selecione uma pré-definição na tabela ao lado para inspecionar código-fonte, parâmetros e prévia renderizada.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-template-title"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3
                  id="delete-template-title"
                  className="text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  Remover pré-definição?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  A pré-definição{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {`{{${deleteTarget.name}}}`}
                  </span>{' '}
                  será excluída do <span className="font-mono">templateService</span> e do Firestore.
                  Artigos que ainda a referenciarem exibirão a chamada literal até serem atualizados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Removendo...' : 'Confirmar Remoção'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTemplatesView;
