import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Shield,
  FileText,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Info,
  Sliders,
  Save,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';
import { CustomRuleItem, DEFAULT_OTHER_RULES } from '../extensions/other-rules';

interface OtherRulesViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const OtherRulesView: React.FC<OtherRulesViewProps> = ({
  currentUser,
  onNavigate,
  onNotify,
}) => {
  const extensionManager = ExtensionManager.getInstance();
  const [extensionTick, setExtensionTick] = useState(0);

  useEffect(() => {
    const unsub = extensionManager.subscribe(() => {
      setExtensionTick((prev) => prev + 1);
    });
    return unsub;
  }, [extensionManager]);

  const rulesData = useMemo(() => {
    return extensionManager.getOtherRulesData();
  }, [extensionManager, extensionTick]);

  const isEnabled = extensionManager.isExtensionEnabled('OtherRulesExtension');
  const userIsBureaucrat = isUserBureaucrat(currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  // Estados do Modal de Edição pelo Burocrata
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editRulesList, setEditRulesList] = useState<CustomRuleItem[]>([]);
  const [editPageTitle, setEditPageTitle] = useState('');
  const [editPageSubtitle, setEditPageSubtitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estado do formulário de nova regra
  const [newRuleNumber, setNewRuleNumber] = useState('');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<'conduta' | 'edicao' | 'seguranca' | 'direitos' | 'geral'>('geral');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRulePenalty, setNewRulePenalty] = useState('');

  // Sincroniza dados para o editor ao abrir
  const handleOpenEditor = () => {
    const currentSettings = extensionManager.getExtensionSettings('OtherRulesExtension');
    let loadedRules: CustomRuleItem[] = DEFAULT_OTHER_RULES;
    try {
      if (currentSettings.rulesRawJson) {
        const parsed = JSON.parse(currentSettings.rulesRawJson);
        if (Array.isArray(parsed)) loadedRules = parsed;
      } else if (rulesData.rules && rulesData.rules.length > 0) {
        loadedRules = rulesData.rules;
      }
    } catch {
      loadedRules = DEFAULT_OTHER_RULES;
    }

    setEditRulesList(loadedRules);
    setEditPageTitle(currentSettings.pageTitle || rulesData.title || 'Outras Regras e Diretrizes Institucionais');
    setEditPageSubtitle(
      currentSettings.pageSubtitle ||
        rulesData.subtitle ||
        'Regulamento oficial estabelecido pelo Burocrata para a Wiki.'
    );
    setShowEditorModal(true);
  };

  const handleAddRule = () => {
    if (!newRuleTitle.trim() || !newRuleDesc.trim()) {
      onNotify?.('Preencha ao menos o título e a descrição da nova regra.', 'warning');
      return;
    }

    const nextNumber = newRuleNumber.trim() || `R-${String(editRulesList.length + 1).padStart(2, '0')}`;
    const newRule: CustomRuleItem = {
      id: `regra-${Date.now()}`,
      number: nextNumber,
      title: newRuleTitle.trim(),
      category: newRuleCategory,
      description: newRuleDesc.trim(),
      penalty: newRulePenalty.trim() || undefined,
    };

    setEditRulesList([...editRulesList, newRule]);
    setNewRuleNumber('');
    setNewRuleTitle('');
    setNewRuleDesc('');
    setNewRulePenalty('');
    onNotify?.(`Regra "${newRule.number}" adicionada à lista preliminar!`, 'info');
  };

  const handleDeleteRule = (id: string) => {
    setEditRulesList(editRulesList.filter((r) => r.id !== id));
  };

  const handleSaveAllRules = async () => {
    if (!userIsBureaucrat) {
      onNotify?.('Apenas burocratas possuem autorização para alterar o regulamento.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        pageTitle: editPageTitle.trim() || 'Outras Regras e Diretrizes Institucionais',
        pageSubtitle: editPageSubtitle.trim() || 'Regulamento oficial estabelecido pelo Burocrata para a Wiki.',
        rulesRawJson: JSON.stringify(editRulesList, null, 2),
      };

      const res = await extensionManager.saveExtensionSettingsAsync(
        'OtherRulesExtension',
        payload,
        currentUser
      );

      if (res.success) {
        onNotify?.('Regras institucionais salvas e sincronizadas no Firebase com sucesso!', 'success');
        setShowEditorModal(false);
      } else {
        onNotify?.(res.message, 'error');
      }
    } catch (err: any) {
      onNotify?.(`Erro ao salvar regras: ${err?.message || 'Falha de rede'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyRule = (rule: CustomRuleItem) => {
    const text = `${rule.number}: ${rule.title}\n${rule.description}${rule.penalty ? `\nPenalidade: ${rule.penalty}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedRuleId(rule.id);
    setTimeout(() => setCopiedRuleId(null), 2500);
    onNotify?.(`Regra ${rule.number} copiada para a área de transferência!`, 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  // Regras ativas
  const activeRulesList: CustomRuleItem[] = useMemo(() => {
    if (rulesData.rules && rulesData.rules.length > 0) {
      return rulesData.rules;
    }
    const currentSettings = extensionManager.getExtensionSettings('OtherRulesExtension');
    try {
      if (currentSettings.rulesRawJson) {
        const parsed = JSON.parse(currentSettings.rulesRawJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_OTHER_RULES;
  }, [rulesData, extensionManager, extensionTick]);

  const filteredRules = useMemo(() => {
    return activeRulesList.filter((rule) => {
      const matchesCategory = selectedCategory === 'todas' || rule.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        rule.title.toLowerCase().includes(q) ||
        rule.number.toLowerCase().includes(q) ||
        rule.description.toLowerCase().includes(q) ||
        (rule.penalty && rule.penalty.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [activeRulesList, selectedCategory, searchQuery]);

  // Se a extensão estiver desativada
  if (!isEnabled) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 space-y-6 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-sm">
          <Lock size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif-heading text-slate-900 dark:text-white">
            Página de "Outras Regras" Desativada
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            A extensão <strong>OtherRulesExtension</strong> foi desabilitada pelo Burocrata nas configurações da Wiki. As diretrizes personalizadas encontram-se temporariamente suspensas.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onNavigate('hub')}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <ArrowLeft size={14} />
            <span>Voltar ao Hub</span>
          </button>
          {userIsBureaucrat && (
            <button
              onClick={() => onNavigate('admin-extensions')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <Sliders size={14} />
              <span>Gerenciar Extensões</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    todas: 'Todas as Regras',
    conduta: 'Conduta & Comunidade',
    edicao: 'Edição & Verificabilidade',
    seguranca: 'Segurança & Integridade',
    direitos: 'Direitos & Autoria',
    geral: 'Diretrizes Gerais',
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. Cabeçalho Institucional */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Scale size={11} /> Regulamento Institucional
            </span>
            <span>•</span>
            <span className="text-slate-500 dark:text-slate-400">Edição Oficial WikiWorldWeb</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-heading text-slate-900 dark:text-white tracking-tight">
            {rulesData.title || 'Outras Regras e Diretrizes Institucionais'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {rulesData.subtitle || 'Regulamento oficial estabelecido pelo Burocrata para a Wiki.'}
          </p>
        </div>

        {/* Ações do Cabeçalho */}
        <div className="flex items-center gap-2.5 flex-wrap z-10 shrink-0">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            title="Imprimir ou salvar como PDF limpo"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>

          {userIsBureaucrat && (
            <button
              onClick={handleOpenEditor}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md cursor-pointer"
              title="Personalizar, inserir e gerenciar regras (Exclusivo para Burocratas)"
            >
              <Edit2 size={14} />
              <span>Personalizar Regras</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por número, título, conteúdo ou penalidade..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Categorias Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {Object.entries(categoryLabels).map(([catKey, catLabel]) => {
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {catLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Lista de Regras Institucionais */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
            Nenhuma regra institucional encontrada para os filtros selecionados.
          </div>
        ) : (
          filteredRules.map((rule, idx) => {
            const isCopied = copiedRuleId === rule.id;

            return (
              <div
                key={rule.id || idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition group relative"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                      {rule.number}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                      {rule.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {categoryLabels[rule.category] || rule.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyRule(rule)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="Copiar regra"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-1 mb-3">
                  {rule.description}
                </p>

                {rule.penalty && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2 text-xs">
                    <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Sanção em caso de descumprimento: </span>
                      <span>{rule.penalty}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Modal de Personalização pelo Burocrata */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Personalização de "Outras Regras"
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Insira ou edite as regras conforme as decisões do Conselho de Burocratas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Título e Subtítulo Gerais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Título da Página de Regras
                  </label>
                  <input
                    type="text"
                    value={editPageTitle}
                    onChange={(e) => setEditPageTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Subtítulo Institucional
                  </label>
                  <input
                    type="text"
                    value={editPageSubtitle}
                    onChange={(e) => setEditPageSubtitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Inserir Nova Regra */}
              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                  <Plus size={15} />
                  <span>Inserir Nova Regra Personalizada</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Código / Número (ex: R-05)
                    </label>
                    <input
                      type="text"
                      value={newRuleNumber}
                      onChange={(e) => setNewRuleNumber(e.target.value)}
                      placeholder={`R-${String(editRulesList.length + 1).padStart(2, '0')}`}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Título da Diretriz
                    </label>
                    <input
                      type="text"
                      value={newRuleTitle}
                      onChange={(e) => setNewRuleTitle(e.target.value)}
                      placeholder="Ex: Respeito à Privacidade e Anonimato dos Colaboradores"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={newRuleCategory}
                      onChange={(e) => setNewRuleCategory(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    >
                      <option value="conduta">Conduta & Comunidade</option>
                      <option value="edicao">Edição & Verificabilidade</option>
                      <option value="seguranca">Segurança & Integridade</option>
                      <option value="direitos">Direitos & Autoria</option>
                      <option value="geral">Diretrizes Gerais</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sanção / Penalidade (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newRulePenalty}
                      onChange={(e) => setNewRulePenalty(e.target.value)}
                      placeholder="Ex: Advertência formal e bloqueio temporário em caso de reincidência."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição Detalhada da Regra
                  </label>
                  <textarea
                    rows={2}
                    value={newRuleDesc}
                    onChange={(e) => setNewRuleDesc(e.target.value)}
                    placeholder="Explique os requisitos, proibições e contexto da norma..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Adicionar à Lista</span>
                </button>
              </div>

              {/* Lista Atual para Revisão / Remoção */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Regras Cadastradas ({editRulesList.length})</span>
                  <span className="text-slate-400 font-normal text-[11px]">
                    Serão salvas na nuvem Firebase para todos os usuários.
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editRulesList.map((r, index) => (
                    <div
                      key={r.id || index}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {r.number}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {r.title}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({r.category})
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{r.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(r.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition"
                        title="Remover regra"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveAllRules}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Save size={14} />
                <span>{isSaving ? 'Gravando no Firebase...' : 'Salvar Regras no Firebase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
