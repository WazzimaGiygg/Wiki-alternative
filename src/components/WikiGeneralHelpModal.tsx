import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  X,
  Keyboard,
  Compass,
  Maximize,
  Minimize,
  Edit3,
  Shield,
  Crown,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Check,
  CheckCheck,
  Copy,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';
import {
  WikiHelpStructure,
  WikiHelpSection,
  WikiHelpTopic,
  WikiHelpShortcut,
  DEFAULT_HELP_STRUCTURE,
  getHelpContent,
  saveCustomHelpContent,
  resetHelpContentToDefault,
  generateHelpContentTsCode,
} from '../extensions/general-help/defaultHelpContent';
import { fullscreenManager } from '../utils/fullscreenManager';

interface WikiGeneralHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onNavigateToView?: (view: string) => void;
  onOpenExtensionsManager?: () => void;
}

export const WikiGeneralHelpModal: React.FC<WikiGeneralHelpModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateToView,
  onOpenExtensionsManager,
}) => {
  const extensionManager = useMemo(() => ExtensionManager.getInstance(), []);
  const isBureaucrat = isUserBureaucrat(currentUser);

  // Estado da extensão de Ajuda Geral sincronizada pelo burocrata (3.05.3.ad)
  const [isHelpExtensionEnabled, setIsHelpExtensionEnabled] = useState<boolean>(() =>
    extensionManager.isGeneralHelpEnabled()
  );

  useEffect(() => {
    const unsub = extensionManager.subscribe(() => {
      setIsHelpExtensionEnabled(extensionManager.isGeneralHelpEnabled());
    });
    return unsub;
  }, [extensionManager]);

  // Estrutura de conteúdo da ajuda (3.05.8.a)
  const [helpData, setHelpData] = useState<WikiHelpStructure>(() => getHelpContent());
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modo de edição do burocrata (3.05.8.a)
  const [isBureaucratEditing, setIsBureaucratEditing] = useState<boolean>(false);
  const [editingContent, setEditingContent] = useState<WikiHelpStructure>(() => getHelpContent());
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Estado de tela cheia (3.05.8.b)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(fullscreenManager.isFullscreen());
  useEffect(() => {
    const unsub = fullscreenManager.subscribe((fs) => setIsFullscreen(fs));
    return unsub;
  }, []);

  // Recarrega ajuda ao abrir
  useEffect(() => {
    if (isOpen) {
      const data = getHelpContent();
      setHelpData(data);
      setEditingContent(data);
    }
  }, [isOpen]);

  // Lista de seções e tópicos filtrados por busca
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      if (selectedSectionId === 'all') return helpData.sections;
      return helpData.sections.filter((s) => s.id === selectedSectionId);
    }

    return helpData.sections
      .map((sec) => {
        const matchesSection =
          sec.title.toLowerCase().includes(query) ||
          sec.description.toLowerCase().includes(query);

        const matchingTopics = sec.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.content.toLowerCase().includes(query) ||
            (t.summary && t.summary.toLowerCase().includes(query)) ||
            (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
        );

        if (matchesSection) return sec;
        if (matchingTopics.length > 0) {
          return {
            ...sec,
            topics: matchingTopics,
          };
        }
        return null;
      })
      .filter(Boolean) as WikiHelpSection[];
  }, [helpData, selectedSectionId, searchQuery]);

  // Atalhos de teclado filtrados
  const filteredShortcuts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return helpData.globalShortcuts;
    return helpData.globalShortcuts.filter(
      (sc) =>
        sc.key.toLowerCase().includes(query) ||
        sc.action.toLowerCase().includes(query) ||
        sc.description.toLowerCase().includes(query)
    );
  }, [helpData, searchQuery]);

  // Ação de alternar extensão pelo burocrata (3.05.3.ad)
  const handleToggleExtensionQuick = async () => {
    if (!isBureaucrat || !currentUser) return;
    const targetState = !isHelpExtensionEnabled;
    const res = targetState
      ? await extensionManager.activateExtension('GeneralHelpExtension', currentUser)
      : await extensionManager.deactivateExtension('GeneralHelpExtension', currentUser);

    if (res.success) {
      setIsHelpExtensionEnabled(targetState);
    }
  };

  // Salvar edições do burocrata
  const handleSaveBureaucratEdits = () => {
    const ok = saveCustomHelpContent(editingContent);
    if (ok) {
      setHelpData(editingContent);
      setEditSuccessMsg('Alterações salvas com sucesso na memória da Wiki!');
      setTimeout(() => setEditSuccessMsg(null), 3500);
      setIsBureaucratEditing(false);
    }
  };

  // Restaurar padrão dos arquivos locais
  const handleResetToDefault = () => {
    if (window.confirm('Deseja realmente restaurar o conteúdo padrão original dos arquivos da extensão?')) {
      const def = resetHelpContentToDefault();
      setHelpData(def);
      setEditingContent(def);
      setEditSuccessMsg('Conteúdo restaurado para o padrão original de defaultHelpContent.ts!');
      setTimeout(() => setEditSuccessMsg(null), 3500);
      setIsBureaucratEditing(false);
    }
  };

  // Copiar código TypeScript para o clipboard
  const handleCopyTsCode = () => {
    const code = generateHelpContentTsCode(editingContent);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none font-sans animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[820px] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Cabeçalho Principal do Modal */}
        <header className="px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shadow-xs">
              <HelpCircle size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <span>Central de Ajuda Geral & Manual do Usuário</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 font-semibold uppercase">
                    F1
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/40 font-semibold">
                    v{helpData.version || '3.05.8'}
                  </span>
                </h2>
                {isHelpExtensionEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Extensão Ativa</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-full bg-red-500/20 text-red-200 border border-red-400/30">
                    <Lock size={9} />
                    <span>Desativada pelo Burocrata</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100 opacity-90 truncate max-w-xl">
                Guia de navegação, atalhos do sistema (F1/F11), bloqueio preventivo (F7/F12) e edição de wikitexto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Tela Cheia Integrado (3.05.8.b) */}
            <button
              type="button"
              onClick={() => fullscreenManager.toggleFullscreen()}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isFullscreen
                  ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title="Alternar Modo Tela Cheia do Wiki-Site (F11)"
            >
              {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
              <span className="hidden sm:inline">{isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia (F11)'}</span>
            </button>

            {/* Alternância Rápida para Burocratas (3.05.3.ad) */}
            {isBureaucrat && (
              <button
                type="button"
                onClick={handleToggleExtensionQuick}
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isHelpExtensionEnabled
                    ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
                title="Burocrata: Alternar permissão da ajuda geral na nuvem Firebase"
              >
                <Crown size={12} />
                <span>{isHelpExtensionEnabled ? 'Desativar Ajuda (Burocrata)' : 'Ativar Ajuda (Burocrata)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar manual de ajuda (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Banner se a extensão estiver desativada pelo Burocrata (3.05.3.ad) */}
        {!isHelpExtensionEnabled ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-4 bg-slate-50 dark:bg-slate-900/90">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md">
              <Lock size={32} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ajuda Geral (F1) Desativada na Wiki
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                A abertura da Central de Ajuda pelo atalho <strong>F1</strong> e pela interface foi desativada temporariamente pelo <strong>Conselho de Burocratas</strong> através da extensão <code>GeneralHelpExtension</code> sincronizada no Firebase.
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Extensão: GeneralHelpExtension • Status: Desativada pelo Sysop
              </p>
            </div>

            {isBureaucrat ? (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleExtensionQuick}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Crown size={14} />
                  <span>Reativar Ajuda Geral no Firebase Agora</span>
                </button>
                {onOpenExtensionsManager && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenExtensionsManager();
                    }}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Gerenciador de Extensões
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Voltar à Wiki
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Barra de Busca e Ações Rápidas */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar na ajuda (ex: atalhos, F11, wikitexto, F7, tela cheia)..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Botões do Burocrata: Editar Conteúdo / Ver Código Local (3.05.8.a) */}
              <div className="flex items-center gap-2">
                {isBureaucrat && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsBureaucratEditing(!isBureaucratEditing)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        isBureaucratEditing
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                      }`}
                      title="Editar estrutura da ajuda nos arquivos locais (3.05.8.a)"
                    >
                      <Crown size={12} />
                      <span>{isBureaucratEditing ? 'Sair do Editor de Ajuda' : 'Editar Ajuda (Burocrata)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCodeModal(true)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                      title="Exibir código TypeScript para o arquivo local defaultHelpContent.ts"
                    >
                      <FileCode size={13} />
                      <span className="hidden sm:inline">Código Arquivo Local</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mensagem de Feedback de Salvamento */}
            {editSuccessMsg && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {/* Banner de Teclas de Atalho com Destaque para F1, F11 e F7/F12 */}
            <div className="px-4 py-2 bg-gradient-to-r from-slate-100 to-indigo-50/60 dark:from-slate-850 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Keyboard size={12} className="text-blue-500" />
                  <span>Atalhos Rápidos:</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  F1: Ajuda
                </span>
                <button
                  type="button"
                  onClick={() => fullscreenManager.toggleFullscreen()}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition cursor-pointer"
                  title="Clique para alternar Tela Cheia"
                >
                  F11: Tela Cheia
                </button>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-300" title="Caret browsing bloqueado para manter estabilidade">
                  F7: Bloqueado
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 font-mono text-[10px] font-semibold text-red-700 dark:text-red-300" title="DevTools bloqueado por diretriz de segurança">
                  F12: Bloqueado
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-slate-500 text-[10px]">
                <span>Pressione <strong>Esc</strong> para fechar</span>
              </div>
            </div>

            {/* Painel do Editor de Burocrata (Requisito 3.05.8.a) */}
            {isBureaucratEditing ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3 flex items-start gap-3">
                  <Crown size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold text-amber-900 dark:text-amber-200">
                      Modo Editor do Burocrata (Arquivos Locais da Extensão - 3.05.8.a)
                    </h4>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                      Aqui você pode personalizar a estrutura, seções e tópicos do manual de ajuda. As alterações são salvas localmente e você pode exportar o código TypeScript para atualizar o arquivo <code>src/extensions/general-help/defaultHelpContent.ts</code>.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSaveBureaucratEdits}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
                      >
                        <Save size={13} />
                        <span>Salvar Conteúdo da Ajuda</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                      >
                        <RotateCcw size={13} />
                        <span>Restaurar Padrão do Arquivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyTsCode}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition"
                      >
                        {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código TypeScript'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Formulário de Edição Geral */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Título da Ajuda Geral
                    </label>
                    <input
                      type="text"
                      value={editingContent.title}
                      onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Subtítulo / Descrição Resumida
                    </label>
                    <input
                      type="text"
                      value={editingContent.subtitle}
                      onChange={(e) => setEditingContent({ ...editingContent, subtitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Editor das Seções */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono">
                    Seções Estruturadas ({editingContent.sections.length})
                  </h4>
                  {editingContent.sections.map((sec, sIdx) => (
                    <div
                      key={sec.id}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                            #{sIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const updated = [...editingContent.sections];
                              updated[sIdx].title = e.target.value;
                              setEditingContent({ ...editingContent, sections: updated });
                            }}
                            className="font-bold text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex-1 max-w-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newTopic: WikiHelpTopic = {
                              id: `novo-topico-${Date.now()}`,
                              title: 'Novo Tópico de Ajuda',
                              content: 'Descreva aqui o conteúdo informativo para os leitores e editores.',
                              summary: 'Resumo explicativo rápido.',
                              tags: ['geral'],
                            };
                            const updated = [...editingContent.sections];
                            updated[sIdx].topics.push(newTopic);
                            setEditingContent({ ...editingContent, sections: updated });
                          }}
                          className="px-2 py-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg flex items-center gap-1 cursor-pointer transition"
                        >
                          <Plus size={11} />
                          <span>Adicionar Tópico</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {sec.topics.map((t, tIdx) => (
                          <div
                            key={t.id}
                            className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={t.title}
                                onChange={(e) => {
                                  const updated = [...editingContent.sections];
                                  updated[sIdx].topics[tIdx].title = e.target.value;
                                  setEditingContent({ ...editingContent, sections: updated });
                                }}
                                className="font-semibold text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editingContent.sections];
                                  updated[sIdx].topics.splice(tIdx, 1);
                                  setEditingContent({ ...editingContent, sections: updated });
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                                title="Remover tópico"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={t.content}
                              onChange={(e) => {
                                const updated = [...editingContent.sections];
                                updated[sIdx].topics[tIdx].content = e.target.value;
                                setEditingContent({ ...editingContent, sections: updated });
                              }}
                              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Visualizador Normal da Ajuda Geral */
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Menu Lateral de Seções */}
                <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex flex-col shrink-0 overflow-y-auto">
                  <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Categorias de Ajuda
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {helpData.sections.length} seções
                    </span>
                  </div>

                  <nav className="p-2 space-y-1 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionId('all');
                        setSelectedTopicId(null);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        selectedSectionId === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <BookOpen size={14} />
                      <span className="flex-1 truncate">Todos os Tópicos</span>
                    </button>

                    {helpData.sections.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => {
                          setSelectedSectionId(sec.id);
                          setSelectedTopicId(null);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                          selectedSectionId === sec.id
                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ChevronRight size={13} className="shrink-0 opacity-70" />
                        <span className="flex-1 truncate">{sec.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 shrink-0">
                          {sec.topics.length}
                        </span>
                      </button>
                    ))}
                  </nav>

                  {/* Informação sobre arquivos locais no rodapé lateral */}
                  <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-[10px] text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles size={11} className="text-blue-500" />
                      <span>Arquivos Locais da Extensão</span>
                    </div>
                    <p className="font-mono text-[9px] text-slate-400 truncate">
                      src/extensions/general-help/
                    </p>
                  </div>
                </aside>

                {/* Conteúdo Principal dos Tópicos */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {/* Seção de Atalhos Globais quando em "Todos os Tópicos" ou "atalhos-e-bloqueios" */}
                  {(selectedSectionId === 'all' || selectedSectionId === 'atalhos-e-bloqueios') && (
                    <section className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Keyboard size={18} className="text-blue-600 dark:text-blue-400" />
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                              Tabela de Atalhos do Sistema & Comandos Bloqueados
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Status de execução das teclas F1 (Ajuda), F11 (Tela Cheia) e bloqueio de F7 e F12
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {filteredShortcuts.map((sc, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-1 transition ${
                              sc.status === 'blocked'
                                ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-[11px] shadow-2xs">
                                {sc.key}
                              </span>
                              <span
                                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                                  sc.status === 'blocked'
                                    ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                }`}
                              >
                                {sc.status === 'blocked' ? 'Bloqueado (3.05.7.a)' : 'Ativo'}
                              </span>
                            </div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {sc.action}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                              {sc.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Renderização das Seções e Tópicos */}
                  {filteredSections.map((sec) => (
                    <section key={sec.id} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <Compass size={16} className="text-blue-500" />
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {sec.title}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          • {sec.topics.length} artigos
                        </span>
                      </div>

                      <div className="space-y-4">
                        {sec.topics.map((t) => (
                          <article
                            key={t.id}
                            className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                  {t.title}
                                </h4>
                                {t.summary && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {t.summary}
                                  </p>
                                )}
                              </div>
                              {t.tags && (
                                <div className="flex flex-wrap gap-1">
                                  {t.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Conteúdo Formatado em Texto / Markdown */}
                            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-2 font-sans">
                              {t.content}
                            </div>

                            {/* Dicas e Recomendações */}
                            {t.tips && t.tips.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1 text-xs text-blue-900 dark:text-blue-200">
                                <span className="font-bold text-[11px] flex items-center gap-1 text-blue-700 dark:text-blue-300">
                                  <Sparkles size={12} />
                                  <span>Dica Prática:</span>
                                </span>
                                {t.tips.map((tip, idx) => (
                                  <p key={idx} className="text-[11px] leading-snug">
                                    • {tip}
                                  </p>
                                ))}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}

                  {filteredSections.length === 0 && (
                    <div className="text-center py-12 space-y-2 text-slate-500">
                      <AlertCircle size={32} className="mx-auto text-slate-400" />
                      <p className="text-xs font-semibold">Nenhum tópico encontrado para sua busca.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedSectionId('all');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 underline cursor-pointer"
                      >
                        Limpar filtros e exibir tudo
                      </button>
                    </div>
                  )}
                </main>
              </div>
            )}
          </>
        )}

        {/* Modal de Exibição de Código TypeScript para os Arquivos Locais (3.05.8.a) */}
        {showCodeModal && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-white shadow-2xl">
              <div className="p-3 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <FileCode size={16} className="text-blue-400" />
                  <span className="font-bold text-xs font-mono">
                    src/extensions/general-help/defaultHelpContent.ts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-3 flex-1 overflow-y-auto">
                <p className="text-xs text-slate-300 mb-2">
                  Você pode copiar o código gerado abaixo para atualizar diretamente o arquivo físico da extensão:
                </p>
                <pre className="text-[10px] font-mono bg-black/60 p-3 rounded-lg border border-slate-800 overflow-x-auto text-emerald-400 select-all">
                  {generateHelpContentTsCode(editingContent)}
                </pre>
              </div>
              <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyTsCode}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copiado para Área de Transferência' : 'Copiar Código Completo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé Informativo */}
        <footer className="px-4 py-2 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span>WikiZero Documentação Técnica</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline font-mono">
              Última atualização: {new Date(helpData.lastUpdated).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">
              Pressione F1 para abrir/fechar • F11 Tela Cheia
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
