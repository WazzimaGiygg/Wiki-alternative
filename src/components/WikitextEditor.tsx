import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image,
  Code,
  Quote,
  Table,
  LayoutTemplate,
  Save,
  X,
  Eye,
  Columns,
  Sparkles,
  HelpCircle,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileDown,
  FileCheck,
  ShieldCheck,
  Clock,
  AlertTriangle,
  BookOpen,
  Lock,
  Code2,
  ExternalLink,
  Search,
  Replace,
  ReplaceAll,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  WholeWord,
  Wrench,
  Puzzle,
  LogIn,
  ShieldAlert,
  Braces,
  Underline,
  Minus,
  Check,
  Type,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WikiArticle, WikiPage, UserProfile, DailyEditLimitStatus, CustomEditorPluginConfig, WikiTemplate } from '../types';
import { ExtensionManager } from '../core/ExtensionManager';
import { parseWikitext } from '../utils/wikitextParser';
import { StorageService } from '../services/storageService';
import { templateService } from '../services/templateService';
import { PermissionService, EditPermissionStatus } from '../services/PermissionService';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { BotAgentService } from '../services/botAgentService';
import { FULL_MODEL_ARTICLE_WIKITEXT } from '../data/curatedArticles';
import { SaveReasonModal } from './SaveReasonModal';
import { PdfExportModal } from './PdfExportModal';
import { PdfPreviewModal } from './PdfPreviewModal';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { GeminiChatbotDrawer } from './GeminiChatbotDrawer';
import { ResearchEthicsFormSection } from './ResearchEthicsFormSection';
import { ResearchEthicsCommitteeInfo } from '../types/ethics';
import { CitationModal, ExistingNamedRef } from './CitationModal';
import { CitationValidatorPanel } from './CitationValidatorPanel';
import {
  validateWikitextCitations,
  CitationIssue,
  fixAllCitationsWithPlaceholders,
} from '../utils/citationValidator';
import { CitationHoverTooltip, CitationTooltipData } from './CitationHoverTooltip';
import { EditConflictModal } from './EditConflictModal';
import { InfoboxTutorialModal, InfoboxModalTab } from './InfoboxTutorialModal';
import { PredefinicoesModal } from './PredefinicoesModal';
import {
  FormattedWikitextPane,
  FormattedWikitextPaneHandle,
  ActiveWikitextFormats,
} from './FormattedWikitextPane';
import {
  looksLikeWikitext,
  normalizePastedHtmlForWikiEditor,
} from '../utils/wikitextFormattedBridge';

interface WikitextEditorProps {
  initialArticle?: WikiArticle | null;
  defaultPageUid?: string;
  pages: WikiPage[];
  user: UserProfile | null;
  onSave: (
    articleData: Partial<WikiArticle> & { titulo: string; pageUid: string; descricao: string },
    editSummary: string,
    isMinor?: boolean,
    conflictOptions?: {
      baseVersion?: number;
      baseContent?: string;
      forceOverwrite?: boolean;
    }
  ) => Promise<void>;
  onCancel: () => void;
  onOpenLoginModal?: () => void;
  onOpenPremiumModal?: (quotaType?: 'chats' | 'images' | 'notebook') => void;
  onOpenNotebookModal?: () => void;
  onDirtyChange?: (isDirty: boolean, isNew: boolean) => void;
}

export const WikitextEditor: React.FC<WikitextEditorProps> = ({
  initialArticle,
  defaultPageUid,
  pages,
  user,
  onSave,
  onCancel,
  onOpenLoginModal,
  onOpenPremiumModal,
  onOpenNotebookModal,
  onDirtyChange,
}) => {
  const [titulo, setTitulo] = useState(initialArticle?.titulo || '');
  const [pageUid, setPageUid] = useState(
    initialArticle?.pageUid || defaultPageUid || pages[0]?.uid || 'metro_sp'
  );
  const [categoria, setCategoria] = useState(initialArticle?.categoria || 'Geral');
  const [idioma, setIdioma] = useState(initialArticle?.idioma || 'Português');

  // Rastreamento da revisão-base ao abrir o editor para detecção de conflitos de concorrência
  const baseVersionRef = useRef<number>(initialArticle?.versao || 1);
  const baseContentRef = useRef<string>(initialArticle?.descricao || '');

  useEffect(() => {
    baseVersionRef.current = initialArticle?.versao || 1;
    baseContentRef.current = initialArticle?.descricao || '';
  }, [initialArticle]);

  // Estado do modal interativo de resolução de conflito de edição
  const [conflictModalData, setConflictModalData] = useState<{
    serverArticle: WikiArticle;
    baseVersion: number;
    yourWikitext: string;
    baseWikitext: string;
    editSummary: string;
    isMinor?: boolean;
  } | null>(null);

  const [descricao, setDescricao] = useState(
    initialArticle?.descricao ||
      `= Título da Página =
Este é o início do seu novo artigo enciclopédico na '''WikiWorldWeb'''.

== Introdução ==
Escreva aqui o contexto e os principais conceitos. Utilize a sintaxe MediaWiki para formatar o texto.

== Características ==
* Primeiro ponto com marcadores
* Segundo ponto importante

== Veja Também ==
* [[História do Metrô de São Paulo|Artigo Relacionado]]`
  );

  // View modes: 'visual' (Formatted Page) | 'edit' (Raw Wikitext Code) | 'split' (50/50) | 'preview'
  const [viewMode, setViewMode] = useState<'visual' | 'edit' | 'split' | 'preview'>('visual');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [showGeminiDrawer, setShowGeminiDrawer] = useState(false);
  const [showInsertWikitextModal, setShowInsertWikitextModal] = useState(false);
  const [customWikitextCode, setCustomWikitextCode] = useState('');
  const [insertModalTab, setInsertModalTab] = useState<'edit' | 'preview'>('edit');
  const [dailyLimitStatus, setDailyLimitStatus] = useState<DailyEditLimitStatus | null>(null);
  const [comiteEtica, setComiteEtica] = useState<ResearchEthicsCommitteeInfo | undefined>(initialArticle?.comiteEtica);
  const [showEthicsModal, setShowEthicsModal] = useState(false);

  // Plugins de botões dinâmicos registrados por extensões
  const [editorPlugins, setEditorPlugins] = useState<CustomEditorPluginConfig[]>(() =>
    ExtensionManager.getInstance().getActiveEditorPlugins()
  );

  useEffect(() => {
    const updatePlugins = () => {
      setEditorPlugins(ExtensionManager.getInstance().getActiveEditorPlugins());
    };
    const unsub = ExtensionManager.getInstance().subscribe(updatePlugins);
    return () => unsub();
  }, []);

  // Find & Replace state (Ctrl+H)
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [findReplaceFeedback, setFindReplaceFeedback] = useState<string | null>(null);

  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Citation Tool state
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationSelectedText, setCitationSelectedText] = useState('');
  const [citationFeedback, setCitationFeedback] = useState<string | null>(null);
  const [showCitationValidator, setShowCitationValidator] = useState(true);

  // Live Citation Hover Tooltip state
  const [hoverTooltipData, setHoverTooltipData] = useState<CitationTooltipData | null>(null);
  const [hoverTooltipPos, setHoverTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estado de controle de alterações não salvas e modal de confirmação de saída
  const isNewArticle = !initialArticle;
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  const isModeratorOrAdmin = !!(user && (user.role === 'admin' || user.role === 'moderador'));
  const currentSelectedPage = pages.find((p) => p.uid === pageUid);
  const isArticleLocked = !!initialArticle?.isLocked;
  const isPageLocked = !!currentSelectedPage?.isLocked;
  const isTargetLocked = (isArticleLocked || isPageLocked) && !isModeratorOrAdmin;

  const editPermission = useMemo<EditPermissionStatus>(() => {
    return PermissionService.getEditPermissionStatus(
      user,
      initialArticle || (currentSelectedPage ? { ...currentSelectedPage, namespace: 'main' } : null)
    );
  }, [user, initialArticle, currentSelectedPage]);

  const [securityWarningModal, setSecurityWarningModal] = useState<{ title: string; message: string; requiresLogin?: boolean } | null>(null);
  const [showInfoboxModal, setShowInfoboxModal] = useState<boolean>(false);
  const [infoboxModalTab, setInfoboxModalTab] = useState<InfoboxModalTab>('catalog');
  const [showPredefinicoesModal, setShowPredefinicoesModal] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formattedPaneRef = useRef<FormattedWikitextPaneHandle>(null);
  const syncSourceRef = useRef<'code' | 'formatted' | null>(null);
  const lastFocusedPaneRef = useRef<'code' | 'formatted'>('formatted');

  // Modo interno da aba Página Formatada / Divisão ('editable' = Interativa, 'preview' = Leitura Final)
  const [formattedPaneMode, setFormattedPaneMode] = useState<'editable' | 'preview'>('editable');
  const [activeFormats, setActiveFormats] = useState<ActiveWikitextFormats>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    blockTag: '',
    unorderedList: false,
    orderedList: false,
  });

  // Drawers interativos da barra de formatação (Link, Tabela, Imagem) sem window.prompt
  const [activeToolbarDrawer, setActiveToolbarDrawer] = useState<'none' | 'link' | 'table' | 'image'>('none');
  const [quickLinkType, setQuickLinkType] = useState<'internal' | 'external'>('internal');
  const [quickLinkTarget, setQuickLinkTarget] = useState('');
  const [quickLinkLabel, setQuickLinkLabel] = useState('');
  const [quickTableRows, setQuickTableRows] = useState(3);
  const [quickTableCols, setQuickTableCols] = useState(3);
  const [quickTableHeader, setQuickTableHeader] = useState(true);
  const [quickTableCaption, setQuickTableCaption] = useState('');
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [quickImageCaption, setQuickImageCaption] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  const handleApplyFromGemini = (wikitext: string, mode: 'insert' | 'replace') => {
    syncSourceRef.current = 'code';
    if (mode === 'replace') {
      setDescricao(wikitext);
    } else {
      setDescricao((prev) => (prev ? `${prev}\n\n${wikitext}` : wikitext));
    }
  };

  const refreshDailyLimit = async () => {
    if (user) {
      try {
        const status = await StorageService.getDailyEditLimitStatus(user);
        setDailyLimitStatus(status);
      } catch (err) {
        console.warn('Erro ao verificar limite diário de edições:', err);
      }
    } else {
      setDailyLimitStatus(null);
    }
  };

  useEffect(() => {
    refreshDailyLimit();
  }, [user]);

  // Auto-save draft in localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (titulo || descricao) {
        StorageService.saveDraft({ title: titulo, content: descricao, pageUid });
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [titulo, descricao, pageUid]);

  // Sincronização reativa de predefinições customizadas para pré-visualização ao vivo
  const [customTemplates, setCustomTemplates] = useState<WikiTemplate[]>(() =>
    templateService.getCachedTemplatesSync()
  );

  useEffect(() => {
    const unsubscribe = templateService.subscribe((updated) => {
      setCustomTemplates(updated);
    });
    templateService.refreshFromFirestore().catch(() => {
      // Fallback silencioso para cache local
    });
    return unsubscribe;
  }, []);

  // Real-time parse for preview and read-only final view
  const { html: renderedHtml } = useMemo(
    () => parseWikitext(descricao, undefined, titulo, customTemplates),
    [descricao, titulo, customTemplates]
  );

  // Word and Char calculations
  const charCount = descricao.length;
  const previousLength = initialArticle?.descricao ? initialArticle.descricao.length : 0;
  const wordCount = descricao.trim() ? descricao.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Detecta se existem alterações não salvas ou se é um novo artigo em edição
  const hasUnsavedChanges = useCallback(() => {
    if (isSavedSuccessfully) return false;

    if (isNewArticle) {
      return Boolean(titulo.trim() || (descricao && descricao.trim()));
    }

    const titleChanged = titulo.trim() !== (initialArticle?.titulo || '').trim();
    const contentChanged = descricao.trim() !== (initialArticle?.descricao || '').trim();
    const pageChanged = pageUid !== (initialArticle?.pageUid || defaultPageUid);
    const categoryChanged = categoria !== (initialArticle?.categoria || 'Geral');
    const languageChanged = idioma !== (initialArticle?.idioma || 'Português');

    return titleChanged || contentChanged || pageChanged || categoryChanged || languageChanged;
  }, [
    isSavedSuccessfully,
    isNewArticle,
    initialArticle,
    titulo,
    descricao,
    pageUid,
    defaultPageUid,
    categoria,
    idioma,
  ]);

  // Propaga status de alterações pendentes para componentes pais
  useEffect(() => {
    const dirty = hasUnsavedChanges();
    onDirtyChange?.(dirty, isNewArticle);
  }, [hasUnsavedChanges, isNewArticle, onDirtyChange]);

  // Alerta nativo de saída do navegador caso o usuário tente fechar a aba ou recarregar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'Você possui alterações não salvas que serão perdidas.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const isFormattedPaneActive = useCallback(() => {
    if (formattedPaneMode !== 'editable') return false;
    if (viewMode === 'visual') return true;
    if (viewMode === 'split') return lastFocusedPaneRef.current === 'formatted';
    return false;
  }, [viewMode, formattedPaneMode]);

  const showTempPasteFeedback = useCallback((msg: string) => {
    setPasteFeedback(msg);
    setTimeout(() => {
      setPasteFeedback((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  // Inserção inteligente de Wikitexto já formatado ou bruto no painel ativo (Visual ou Código)
  const insertFormattedWikitextSnippet = useCallback(
    (wikitext: string, placement?: 'block' | 'inline') => {
      if (!wikitext) return;

      if (isFormattedPaneActive() && formattedPaneRef.current) {
        formattedPaneRef.current.insertRawWikitextSnippet(wikitext, placement);
        return;
      }

      const trimmed = wikitext.trim();
      const shouldWrapNewlines =
        placement === 'block' ||
        (placement !== 'inline' &&
          (trimmed.includes('\n') ||
            /^(?:\{\||\{\{(?:infobox|info\/|aviso|nota|ambox|navbox|citacao|citação|esboço|esboco|portal|reflist)|={1,6}\s|<pre|<gallery)/i.test(
              trimmed
            )));

      const el = textareaRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const prefix = shouldWrapNewlines && start > 0 && descricao[start - 1] !== '\n' ? '\n' : '';
        const suffix =
          shouldWrapNewlines && end < descricao.length && descricao[end] !== '\n' ? '\n' : '';
        const inserted = `${prefix}${trimmed}${suffix}`;
        const nextContent = descricao.substring(0, start) + inserted + descricao.substring(end);
        syncSourceRef.current = 'code';
        setDescricao(nextContent);
        setTimeout(() => {
          el.focus();
          const caret = start + inserted.length;
          el.setSelectionRange(caret, caret);
        }, 20);
      } else {
        syncSourceRef.current = 'code';
        setDescricao((prev) =>
          prev ? `${prev}${shouldWrapNewlines ? '\n\n' : ' '}${trimmed}` : trimmed
        );
      }
    },
    [descricao, isFormattedPaneActive]
  );

  // Roteador unificado da barra de formatação entre Página Formatada e Código Wikitexto
  const insertWikitext = (before: string, after: string = '', defaultPlaceholder: string = '') => {
    if (isFormattedPaneActive() && formattedPaneRef.current) {
      if (before === "'''") {
        formattedPaneRef.current.applyFormat('bold');
        return;
      } else if (before === "''") {
        formattedPaneRef.current.applyFormat('italic');
        return;
      } else if (before === '<u>') {
        formattedPaneRef.current.applyFormat('underline');
        return;
      } else if (before === '~~' || before === '<s>') {
        formattedPaneRef.current.applyFormat('strikethrough');
        return;
      } else if (before === '= ') {
        formattedPaneRef.current.applyFormat('heading1');
        return;
      } else if (before === '== ') {
        formattedPaneRef.current.applyFormat('heading2');
        return;
      } else if (before === '=== ') {
        formattedPaneRef.current.applyFormat('heading3');
        return;
      } else if (before.startsWith('* ')) {
        formattedPaneRef.current.applyFormat('bulletList');
        return;
      } else if (before.startsWith('# ')) {
        formattedPaneRef.current.applyFormat('orderedList');
        return;
      } else if (before.startsWith('> ')) {
        formattedPaneRef.current.applyFormat('blockquote');
        return;
      } else if (before === '`') {
        formattedPaneRef.current.applyFormat('inlineCode');
        return;
      } else if (before.trim() === '----') {
        formattedPaneRef.current.applyFormat('hr');
        return;
      } else if (before.startsWith('[[')) {
        formattedPaneRef.current.applyFormat('wikilink');
        return;
      } else {
        const snippet = `${before}${defaultPlaceholder}${after}`;
        insertFormattedWikitextSnippet(snippet);
        return;
      }
    }

    const el = textareaRef.current;
    if (!el) {
      syncSourceRef.current = 'code';
      setDescricao((prev) => `${prev}${before}${defaultPlaceholder}${after}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = descricao.substring(start, end) || defaultPlaceholder;

    const replacement = `${before}${selected}${after}`;
    const nextContent = descricao.substring(0, start) + replacement + descricao.substring(end);

    syncSourceRef.current = 'code';
    setDescricao(nextContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 20);
  };

  // Atalhos de teclado no textarea de código (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!editPermission.allowed) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        insertWikitext("'''", "'''", 'texto em negrito');
      } else if (key === 'i') {
        e.preventDefault();
        insertWikitext("''", "''", 'texto em itálico');
      } else if (key === 'u') {
        e.preventDefault();
        insertWikitext('<u>', '</u>', 'texto sublinhado');
      } else if (key === 'k') {
        e.preventDefault();
        setActiveToolbarDrawer((prev) => (prev === 'link' ? 'none' : 'link'));
      }
    }
  };

  // Intercepta colagem de texto já formatado (HTML rico de Docs/Word/Sites) no textarea de código
  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!editPermission.allowed) return;
    const htmlData = e.clipboardData.getData('text/html');
    const plainData = e.clipboardData.getData('text/plain');

    // Se o texto puro já for Wikitexto explícito, deixa colar literalmente no modo código
    if (plainData && looksLikeWikitext(plainData)) {
      return;
    }

    if (htmlData) {
      const normalized = normalizePastedHtmlForWikiEditor(htmlData);
      if (normalized.hasRichFormatting && normalized.wikitext.trim()) {
        e.preventDefault();
        insertFormattedWikitextSnippet(normalized.wikitext, 'inline');
        showTempPasteFeedback('Texto já formatado colado e convertido para sintaxe Wikitexto.');
      }
    }
  };

  const builtQuickLinkSyntax = useMemo(() => {
    const target = quickLinkTarget.trim();
    const label = quickLinkLabel.trim();
    if (quickLinkType === 'internal') {
      const safeTarget = target || 'Página_principal';
      return label && label !== safeTarget.replace(/_/g, ' ')
        ? `[[${safeTarget}|${label}]]`
        : `[[${safeTarget}]]`;
    }
    const safeUrl = target
      ? /^(?:https?:\/\/|mailto:)/i.test(target)
        ? target
        : `https://${target}`
      : 'https://exemplo.com';
    return label ? `[${safeUrl} ${label}]` : `[${safeUrl} Título do Link]`;
  }, [quickLinkType, quickLinkTarget, quickLinkLabel]);

  const builtQuickTableSyntax = useMemo(() => {
    const cols = Math.max(1, Math.min(8, quickTableCols));
    const rows = Math.max(1, Math.min(10, quickTableRows));
    const lines: string[] = ['{| class="wikitable"'];
    if (quickTableCaption.trim()) {
      lines.push(`|+ ${quickTableCaption.trim()}`);
    }
    if (quickTableHeader) {
      const headers = Array.from({ length: cols }, (_, i) => `Coluna ${i + 1}`).join(' !! ');
      lines.push(`! ${headers}`);
    }
    for (let r = 0; r < rows; r++) {
      lines.push('|-');
      const cells = Array.from({ length: cols }, (_, c) => `Célula ${r + 1}.${c + 1}`).join(' || ');
      lines.push(`| ${cells}`);
    }
    lines.push('|}');
    return lines.join('\n');
  }, [quickTableRows, quickTableCols, quickTableHeader, quickTableCaption]);

  const builtQuickImageSyntax = useMemo(() => {
    const url = quickImageUrl.trim() || 'Nome_do_arquivo.png';
    const caption = quickImageCaption.trim() || 'Legenda da imagem';
    if (/^https?:\/\//i.test(url) || url.startsWith('/')) {
      return `![${caption}](${url})`;
    }
    return `[[Ficheiro:${url}|thumb|${caption}]]`;
  }, [quickImageUrl, quickImageCaption]);

  // Detects if the article already contains a references section
  const hasReferencesSection = useMemo(() => {
    return /(?:==\s*Refer[êe]ncias\s*==|<references\s*\/>|\{\{reflist\}\}|\{\{Reflist\}\})/i.test(descricao);
  }, [descricao]);

  // Extract all existing named references in the article (e.g. <ref name="xyz">)
  const existingNamedRefs = useMemo<ExistingNamedRef[]>(() => {
    const list: ExistingNamedRef[] = [];
    const seen = new Set<string>();
    const regex = /<ref\s+name=["']([^"']+)["'](?:>([\s\S]*?)<\/ref>|\s*\/>)/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(descricao)) !== null) {
      const name = m[1].trim();
      if (!seen.has(name)) {
        seen.add(name);
        const rawContent = (m[2] || '').replace(/<[^>]*>/g, '').trim();
        list.push({
          name,
          preview: rawContent ? (rawContent.length > 60 ? rawContent.substring(0, 60) + '...' : rawContent) : `Referência "${name}"`,
        });
      }
    }
    return list;
  }, [descricao]);

  // Opens citation modal and captures any currently selected text
  const handleOpenCitationModal = () => {
    let selText = '';
    if (isFormattedPaneActive() && formattedPaneRef.current) {
      selText = formattedPaneRef.current.getSelectedText();
    } else if (textareaRef.current) {
      const el = textareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start !== end) {
        selText = descricao.substring(start, end).trim();
      }
    }
    setCitationSelectedText(selText);
    setShowCitationModal(true);
  };

  // Handles citation insertion and automatic references section generation
  const handleInsertCitation = (citationWikitext: string, autoGenerateSection: boolean) => {
    if (!citationWikitext) return;

    let sectionGenerated = false;

    if (isFormattedPaneActive() && formattedPaneRef.current) {
      formattedPaneRef.current.insertRawWikitextSnippet(citationWikitext, 'inline');
      if (autoGenerateSection) {
        const alreadyHasSection = /(?:==\s*Refer[êe]ncias\s*==|<references\s*\/>|\{\{reflist\}\}|\{\{Reflist\}\})/i.test(descricao);
        if (!alreadyHasSection) {
          syncSourceRef.current = 'code';
          setDescricao((prev) => `${prev.trimEnd()}\n\n== Referências ==\n{{reflist}}`);
          sectionGenerated = true;
        }
      }
    } else {
      let updatedContent = descricao;
      const el = textareaRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = descricao.substring(start, end);
        const replacement = selected ? `${selected}${citationWikitext}` : citationWikitext;
        updatedContent =
          descricao.substring(0, start) +
          replacement +
          descricao.substring(end);
      } else {
        updatedContent = `${descricao} ${citationWikitext}`;
      }

      if (autoGenerateSection) {
        const alreadyHasSection = /(?:==\s*Refer[êe]ncias\s*==|<references\s*\/>|\{\{reflist\}\}|\{\{Reflist\}\})/i.test(updatedContent);
        if (!alreadyHasSection) {
          updatedContent = `${updatedContent.trimEnd()}\n\n== Referências ==\n{{reflist}}`;
          sectionGenerated = true;
        }
      }

      syncSourceRef.current = 'code';
      setDescricao(updatedContent);
      setTimeout(() => {
        el?.focus();
      }, 60);
    }

    const msg = sectionGenerated
      ? 'Citação inserida com sucesso! A seção "== Referências ==" foi gerada automaticamente no final do artigo.'
      : 'Citação inserida com sucesso no texto!';
    setCitationFeedback(msg);
    setTimeout(() => setCitationFeedback(null), 5000);
  };

  // Validador automático de citações e referências em tempo real
  const citationValidation = useMemo(() => {
    return validateWikitextCitations(descricao);
  }, [descricao]);

  // Resumo de status em tempo real: marcadores válidos (verde) vs quebrados ou ausentes (vermelho)
  const citationMarkersSummary = useMemo(() => {
    const issues = citationValidation.issues;
    const hasRefSection = citationValidation.hasReferencesSection;
    const total = citationValidation.totalCitations;

    const brokenIssues = issues.filter((i) => i.severity === 'error');
    const warningIssues = issues.filter((i) => i.severity === 'warning');

    const undefinedOrUnclosedCount = issues.filter(
      (i) => i.type === 'undefined_named_ref' || i.type === 'unclosed_ref_tag' || i.type === 'empty_ref_tag'
    ).length;

    // Se a seção de referências estiver ausente no final, as citações no texto não possuem onde listar
    const brokenCount = !hasRefSection && total > 0 ? total : undefinedOrUnclosedCount;
    const validCount = Math.max(0, total - brokenCount);

    return {
      total,
      validCount: hasRefSection ? validCount : 0,
      brokenCount: hasRefSection ? brokenCount : total,
      hasRefSection,
      errorCount: brokenIssues.length,
      warningCount: warningIssues.length,
      isValid: citationValidation.isValid && hasRefSection && total > 0,
    };
  }, [citationValidation]);

  const handleApplyCitationFix = (newWikitext: string, successMessage: string) => {
    syncSourceRef.current = 'code';
    setDescricao(newWikitext);
    setCitationFeedback(successMessage);
    setTimeout(() => setCitationFeedback(null), 4000);
  };

  const handleHighlightCitationIssue = (issue: CitationIssue) => {
    if (viewMode === 'visual' || viewMode === 'preview') {
      setViewMode('split');
    }

    setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;

      el.focus();

      if (issue.startIndex !== undefined && issue.endIndex !== undefined && issue.startIndex >= 0) {
        el.setSelectionRange(issue.startIndex, issue.endIndex);
      } else if (issue.matchText) {
        const idx = descricao.indexOf(issue.matchText);
        if (idx !== -1) {
          el.setSelectionRange(idx, idx + issue.matchText.length);
        }
      } else if (issue.line) {
        const lines = descricao.split('\n');
        let charPos = 0;
        for (let i = 0; i < Math.min(issue.line - 1, lines.length); i++) {
          charPos += lines[i].length + 1;
        }
        const lineLen = lines[issue.line - 1]?.length || 0;
        el.setSelectionRange(charPos, charPos + lineLen);
      }

      if (issue.line) {
        const approxLineHeight = 18;
        const targetScrollTop = Math.max(0, (issue.line - 4) * approxLineHeight);
        el.scrollTop = targetScrollTop;
      }

      setCitationFeedback(`Inconsistência destacada: ${issue.title} (Linha ${issue.line || 1})`);
      setTimeout(() => setCitationFeedback(null), 4000);
    }, 100);
  };

  // 'Fix Citations': Cruza todas as tags com a seção de Referências e adiciona entradas pendentes como placeholders
  const handleFixCitations = () => {
    const result = fixAllCitationsWithPlaceholders(descricao);
    syncSourceRef.current = 'code';
    setDescricao(result.updatedWikitext);

    let msg = 'Citações cruzadas com sucesso! Entradas pendentes foram adicionadas como placeholders na seção de Referências.';
    if (result.fixedIssuesDescriptions.length > 0) {
      msg = result.fixedIssuesDescriptions.join(' • ');
    }
    setCitationFeedback(msg);
    setTimeout(() => setCitationFeedback(null), 6000);
  };

  // Live hover preview handler for citation markers in visual and split/preview modes
  const handleCitationHover = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const footnoteEl = target.closest(
      '.wiki-footnote, [data-ref-tooltip], a[id^="cite_ref-"]'
    ) as HTMLElement | null;

    if (footnoteEl) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      const rect = footnoteEl.getBoundingClientRect();
      const rawTooltip =
        footnoteEl.getAttribute('data-ref-tooltip') ||
        footnoteEl.getAttribute('title') ||
        '';
      const rawIndex = footnoteEl.getAttribute('data-ref-index');
      const rawName = footnoteEl.getAttribute('data-ref-name');
      const isError =
        footnoteEl.getAttribute('data-ref-error') === 'true' ||
        footnoteEl.classList.contains('text-rose-600') ||
        rawTooltip.includes('Erro de Citação');

      setHoverTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setHoverTooltipData({
        index: rawIndex ? parseInt(rawIndex, 10) : undefined,
        name: rawName || undefined,
        tooltipText: rawTooltip,
        isError,
      });
    } else {
      if (!isTooltipHovered) {
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => {
          if (!isTooltipHovered) {
            setHoverTooltipData(null);
            setHoverTooltipPos(null);
          }
        }, 180);
      }
    }
  };

  const handleCitationLeave = () => {
    if (!isTooltipHovered) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => {
        if (!isTooltipHovered) {
          setHoverTooltipData(null);
          setHoverTooltipPos(null);
        }
      }, 250);
    }
  };

  // Live hover preview when hovering / clicking cursor in raw wikitext textarea
  const handleTextareaCitationHover = () => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const refRegex = /<ref(?:\s+name=["']([^"']+)["'])?(?:\s*\/>|>([\s\S]*?)<\/ref>)/gi;
    let m: RegExpExecArray | null;
    let matchedTag: {
      name?: string;
      content: string;
      isSelfClosing: boolean;
      start: number;
      end: number;
    } | null = null;

    while ((m = refRegex.exec(descricao)) !== null) {
      if (pos >= m.index && pos <= m.index + m[0].length) {
        matchedTag = {
          name: m[1]?.trim(),
          content: m[2]?.trim() || '',
          isSelfClosing: m[0].endsWith('/>'),
          start: m.index,
          end: m.index + m[0].length,
        };
        break;
      }
    }

    if (matchedTag) {
      const elRect = el.getBoundingClientRect();
      let previewText = matchedTag.content;
      let isError = false;
      let idx: number | undefined;

      if (matchedTag.name) {
        const found = citationValidation.referencesList.find((r) => r.name === matchedTag?.name);
        if (found) {
          previewText = found.content;
          idx = found.index;
        } else if (matchedTag.isSelfClosing) {
          isError = true;
          previewText = `Marcador de citação <ref name="${matchedTag.name}" /> sem definição correspondente no artigo. Use o botão 'Fix Citations' para gerar a entrada correspondente.`;
        }
      }

      setHoverTooltipPos({
        x: elRect.left + Math.min(elRect.width / 2, 280),
        y: elRect.top + 40,
      });
      setHoverTooltipData({
        index: idx,
        name: matchedTag.name,
        tooltipText: previewText.replace(/<[^>]*>/g, '') || `Referência "${matchedTag.name}"`,
        isError,
      });
    }
  };

  // Alternância de modo (FormattedWikitextPane já mantém `descricao` sincronizada continuamente)
  const handleSwitchMode = (newMode: 'visual' | 'edit' | 'split' | 'preview') => {
    if (newMode === 'edit') {
      lastFocusedPaneRef.current = 'code';
    } else if (newMode === 'visual') {
      lastFocusedPaneRef.current = 'formatted';
    }
    setViewMode(newMode);
  };

  const handleOpenSaveModal = async () => {
    if (!editPermission.allowed) {
      if (editPermission.requiresLogin && onOpenLoginModal) {
        onOpenLoginModal();
        return;
      }
      setSecurityWarningModal({
        title: 'Edição Não Autorizada',
        message: editPermission.message,
        requiresLogin: editPermission.requiresLogin,
      });
      return;
    }

    if (!titulo.trim()) {
      setSecurityWarningModal({
        title: 'Título Obrigatório',
        message: 'Por favor, informe o título do artigo antes de salvar.',
      });
      return;
    }

    if (!descricao.trim()) {
      setSecurityWarningModal({
        title: 'Conteúdo Obrigatório',
        message: 'O conteúdo do artigo não pode ficar vazio.',
      });
      return;
    }

    // Validação do limite diário de 5 edições para editores (exceção para moderadores e administradores)
    if (user) {
      try {
        const status = await StorageService.getDailyEditLimitStatus(user);
        setDailyLimitStatus(status);
        if (!status.allowed && !status.isExempt) {
          setSecurityWarningModal({
            title: 'Limite Diário Atingido',
            message: 'Limite diário atingido: Usuários com papel de editor podem realizar até 5 edições por dia (com exceção de moderadores e administradores). Seu limite será renovado à meia-noite.',
          });
          return;
        }
      } catch (e) {
        console.warn('Erro ao consultar status de limite:', e);
      }
    }

    setShowSaveModal(true);
  };

  const handleCancelClick = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardModal(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    onDirtyChange?.(false, isNewArticle);
    StorageService.clearDraft();
    onCancel();
  };

  const handleConfirmSave = async (editSummary: string, isMinor: boolean) => {
    setIsSaving(true);
    let finalDescricao = descricao;
    try {

      // 4.1.1.18C.1 & 4.1.1.11E.1 & 4.1.1.E0.1 / 4.1.1-L8.3: Interceptação e Auditoria por Bots
      const botCheck = BotAgentService.processArticleOnSave(
        {
          id: initialArticle?.id,
          titulo: titulo.trim(),
          pageUid,
          categoria,
          idioma,
          descricao: finalDescricao,
        },
        initialArticle || null,
        user || null
      );

      if (!botCheck.canSave) {
        setIsSaving(false);
        setSecurityWarningModal({
          title: 'Bloqueio de Integridade',
          message: botCheck.rejectionReason || 'Edição bloqueada pelo sistema de robôs e integridade da WikiWorldWeb.',
        });
        return;
      }

      // Higienização automática por LGPD (removendo números de cartão/CPF desnecessários)
      if (botCheck.sanitizedArticle.descricao && botCheck.sanitizedArticle.descricao !== finalDescricao) {
        finalDescricao = botCheck.sanitizedArticle.descricao;
        syncSourceRef.current = 'code';
        setDescricao(finalDescricao);
      }

      let finalCategoria = categoria;
      if (botCheck.sanitizedArticle.categoria && botCheck.sanitizedArticle.categoria !== categoria) {
        finalCategoria = botCheck.sanitizedArticle.categoria;
        setCategoria(finalCategoria);
      }

      await onSave(
        {
          id: initialArticle?.id,
          titulo: titulo.trim(),
          pageUid,
          categoria: finalCategoria,
          idioma,
          descricao: finalDescricao,
          resumo: editSummary || finalDescricao.slice(0, 140) + '...',
          comiteEtica,
        },
        editSummary,
        isMinor,
        {
          baseVersion: baseVersionRef.current,
          baseContent: baseContentRef.current,
        }
      );

      // Launch celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }

      StorageService.clearDraft();
      setIsSavedSuccessfully(true);
      onDirtyChange?.(false, isNewArticle);
    } catch (err: any) {
      console.error('Erro ao salvar artigo:', err);

      // Detecção de Conflito de Edição Concorrente
      if (err?.name === 'EditConflictError' || err?.currentServerArticle) {
        setConflictModalData({
          serverArticle: err.currentServerArticle,
          baseVersion: err.baseVersion ?? baseVersionRef.current,
          yourWikitext: finalDescricao,
          baseWikitext: err.baseContent ?? baseContentRef.current,
          editSummary,
          isMinor,
        });
        return;
      }

      setSecurityWarningModal({
        title: 'Erro ao Salvar Artigo',
        message: err?.message || 'Ocorreu um erro ao salvar o artigo.',
      });
    } finally {
      setIsSaving(false);
      refreshDailyLimit();
    }
  };

  // Helper para escapar caracteres de Regex no Localizar
  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Calcula ocorrências em tempo real no conteúdo do artigo
  const matches = useMemo(() => {
    if (!findQuery) return [];
    try {
      let pattern = escapeRegExp(findQuery);
      if (matchWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const regex = new RegExp(pattern, matchCase ? 'g' : 'gi');
      const results: { start: number; end: number; text: string }[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(descricao)) !== null) {
        results.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
        });
        if (regex.lastIndex === match.index) {
          regex.lastIndex++;
        }
      }
      return results;
    } catch (e) {
      return [];
    }
  }, [descricao, findQuery, matchCase, matchWholeWord]);

  // Navega até a ocorrência e seleciona no textarea se visível
  const goToMatch = (index: number) => {
    if (matches.length === 0) return;
    const newIdx = (index + matches.length) % matches.length;
    setCurrentMatchIdx(newIdx);
    const m = matches[newIdx];
    if (m && textareaRef.current && (viewMode === 'edit' || viewMode === 'split')) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(m.start, m.end);

      const textBefore = descricao.substring(0, m.start);
      const linesBefore = textBefore.split('\n').length;
      const approxLineHeight = 18;
      const targetScrollTop = Math.max(0, (linesBefore - 4) * approxLineHeight);
      textareaRef.current.scrollTop = targetScrollTop;
    }
  };

  // Substitui a ocorrência atual
  const handleReplaceCurrent = () => {
    if (matches.length === 0) {
      setFindReplaceFeedback('Nenhuma ocorrência encontrada.');
      return;
    }
    const safeIdx = Math.min(Math.max(0, currentMatchIdx), matches.length - 1);
    const m = matches[safeIdx];
    if (!m) return;

    const newContent = descricao.substring(0, m.start) + replaceQuery + descricao.substring(m.end);
    syncSourceRef.current = 'code';
    setDescricao(newContent);

    setFindReplaceFeedback('1 ocorrência substituída.');
    setTimeout(() => setFindReplaceFeedback(null), 2500);

    setTimeout(() => {
      if (textareaRef.current && (viewMode === 'edit' || viewMode === 'split')) {
        const nextStart = m.start;
        const nextEnd = nextStart + replaceQuery.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextStart, nextEnd);
      }
    }, 50);
  };

  // Substitui todas as ocorrências
  const handleReplaceAll = () => {
    if (matches.length === 0) {
      setFindReplaceFeedback('Nenhuma ocorrência encontrada.');
      return;
    }
    const count = matches.length;
    let pattern = escapeRegExp(findQuery);
    if (matchWholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    const regex = new RegExp(pattern, matchCase ? 'g' : 'gi');
    const newContent = descricao.replace(regex, replaceQuery);
    syncSourceRef.current = 'code';
    setDescricao(newContent);

    setCurrentMatchIdx(0);
    setFindReplaceFeedback(`${count} ocorrência${count > 1 ? 's' : ''} substituída${count > 1 ? 's' : ''}!`);
    setTimeout(() => setFindReplaceFeedback(null), 3000);
  };

  // Abre ou foca a ferramenta de Localizar e Substituir (Ctrl+H)
  const openFindReplace = () => {
    setShowFindReplace(true);
    let selected = '';
    if (viewMode === 'edit' || viewMode === 'split') {
      const el = textareaRef.current;
      if (el && el.selectionStart !== el.selectionEnd) {
        selected = descricao.substring(el.selectionStart, el.selectionEnd);
      }
    } else if (viewMode === 'visual' && formattedPaneRef.current) {
      selected = formattedPaneRef.current.getSelectedText();
    }

    if (selected.trim() && !selected.includes('\n')) {
      setFindQuery(selected.trim());
      setCurrentMatchIdx(0);
    }

    setTimeout(() => {
      findInputRef.current?.focus();
      findInputRef.current?.select();
    }, 50);
  };

  // Atalhos de teclado globais no Editor: CTRL+S (Salvar artigo) e CTRL+H (Localizar e Substituir)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora atalhos se modais de diálogo estiverem abertas
      if (showSaveModal || showPdfModal || showInsertWikitextModal) return;

      // ESC fecha a barra de localizar e substituir se estiver aberta
      if (e.key === 'Escape' && showFindReplace) {
        setShowFindReplace(false);
        if (viewMode === 'edit' || viewMode === 'split') {
          textareaRef.current?.focus();
        } else if (viewMode === 'visual') {
          formattedPaneRef.current?.focus();
        }
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      // Atalho CTRL+S / CMD+S: Salvar artigo
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        e.stopPropagation();

        if (!editPermission.allowed) {
          setSecurityWarningModal({
            title: 'Edição Não Autorizada',
            message: editPermission.message,
            requiresLogin: editPermission.requiresLogin,
          });
          return;
        }

        if (dailyLimitStatus && !dailyLimitStatus.isExempt && !dailyLimitStatus.allowed) {
          setSecurityWarningModal({
            title: 'Limite Diário Atingido',
            message: 'Você atingiu o limite de 5 edições diárias para o perfil de editor. Suas edições serão renovadas à meia-noite.',
          });
          return;
        }

        handleOpenSaveModal();
      }
      // Atalho CTRL+H / CMD+H: Localizar e Substituir
      else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        e.stopPropagation();
        openFindReplace();
      }
      // Atalho adicional conveniente CTRL+F / CMD+F: Localizar
      else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        e.stopPropagation();
        openFindReplace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showSaveModal,
    showPdfModal,
    showInsertWikitextModal,
    showFindReplace,
    titulo,
    descricao,
    pageUid,
    viewMode,
    isSaving,
    isTargetLocked,
    dailyLimitStatus,
    user,
    findQuery,
    replaceQuery,
    matches,
  ]);

  return (
    <div className="w-full space-y-3 animate-in fade-in select-none">
      {/* Save Reason Modal (Mandatory on save) */}
      <SaveReasonModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleConfirmSave}
        isNewArticle={!initialArticle}
        currentTitle={titulo}
        previousLength={previousLength}
        newLength={descricao.length}
        user={user}
      />

      {/* Modal do Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP) */}
      {showEthicsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowEthicsModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Comitê de Ética em Pesquisa com Seres Humanos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Conformidade regulatória para artigos que envolvem voluntários humanos (Resoluções CNS 466/12 e 510/16)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEthicsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <ResearchEthicsFormSection
              value={comiteEtica}
              onChange={setComiteEtica}
              contextTitle="Artigo Enciclopédico"
            />

            {/* Ações do Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!comiteEtica || !comiteEtica.envolveSeresHumanos) {
                    setSecurityWarningModal({
                      title: 'Comitê de Ética',
                      message: 'Configure os dados do Comitê de Ética antes de inserir a predefinição.',
                    });
                    return;
                  }
                  const cepCode = `\n\n== Comitê de Ética em Pesquisa com Seres Humanos ==\n` +
                    `* '''Situação Ética:''' ${comiteEtica.statusEtica === 'aprovado' ? 'Aprovado pelo CEP/CONEP' : comiteEtica.statusEtica === 'dispensado' ? 'Dispensado de Apreciação Ética (Res. CNS 510/2016)' : 'Em Tramitação'}\n` +
                    (comiteEtica.nomeComite ? `* '''Comitê Responsável:''' ${comiteEtica.nomeComite}\n` : '') +
                    (comiteEtica.numeroCaae ? `* '''Número do CAAE:''' ${comiteEtica.numeroCaae}\n` : '') +
                    (comiteEtica.numeroParecer ? `* '''Número do Parecer:''' ${comiteEtica.numeroParecer}\n` : '') +
                    (comiteEtica.dataAprovacao ? `* '''Data de Aprovação:''' ${comiteEtica.dataAprovacao}\n` : '') +
                    `* '''Resolução de Referência:''' ${comiteEtica.resolucaoRegulamentadora || 'Resolução CNS nº 466/2012'}\n`;
                  syncSourceRef.current = 'code';
                  setDescricao((prev) => prev + cepCode);
                  setShowEthicsModal(false);
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Inserir Seção no Texto Wikitext
              </button>

              <button
                type="button"
                onClick={() => setShowEthicsModal(false)}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              >
                Concluir e Salvar Dados Éticos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Warning Modal */}
      {securityWarningModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSecurityWarningModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {securityWarningModal.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">Segurança &middot; RBAC WikiWorldWeb</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSecurityWarningModal(null)}
                aria-label="Fechar"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {securityWarningModal.message}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {securityWarningModal.requiresLogin && onOpenLoginModal && (
                <button
                  type="button"
                  onClick={() => {
                    setSecurityWarningModal(null);
                    onOpenLoginModal();
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                >
                  <LogIn size={13} />
                  <span>Fazer Login com Google</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSecurityWarningModal(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Status Banner when editing is unauthorized */}
      {!editPermission.allowed && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in ${
            editPermission.reasonCode === 'ANONYMOUS'
              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
              : editPermission.reasonCode === 'LOCKED_ARTICLE'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/80 dark:bg-black/40 shrink-0">
              {editPermission.reasonCode === 'ANONYMOUS' && <LogIn size={18} className="text-blue-600 dark:text-blue-400" />}
              {editPermission.reasonCode === 'LOCKED_ARTICLE' && <Lock size={18} className="text-amber-600 dark:text-amber-400" />}
              {editPermission.reasonCode !== 'ANONYMOUS' && editPermission.reasonCode !== 'LOCKED_ARTICLE' && (
                <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold">
                {editPermission.reasonCode === 'ANONYMOUS' && 'Modo Visualização (Usuário Não Autenticado)'}
                {editPermission.reasonCode === 'LOCKED_ARTICLE' && 'Artigo Protegido pela Moderação'}
                {editPermission.reasonCode === 'BANNED' && 'Conta Suspensa'}
                {editPermission.reasonCode === 'REVOKED' && 'Permissão de Edição Revogada'}
                {editPermission.reasonCode === 'RESTRICTED_NAMESPACE' && 'Namespace Administrativo Restrito'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {editPermission.message}
              </p>
            </div>
          </div>
          {editPermission.requiresLogin && onOpenLoginModal && (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-98"
            >
              <LogIn size={13} />
              <span>Fazer Login com Google</span>
            </button>
          )}
        </div>
      )}

      {/* Editor Header Bar */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              {initialArticle ? `Editando: ${initialArticle.titulo}` : 'Criar Novo Artigo'}
            </h2>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alterne livremente entre o <strong>Editor de Código Wikitexto</strong> e a <strong>Página Formatada (Visual)</strong>.
              </p>

              {dailyLimitStatus && (
                dailyLimitStatus.isExempt ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/80"
                    title="Moderadores e Administradores não possuem restrição de cota diária de edições."
                  >
                    <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                    Edições ilimitadas (Moderador/Admin)
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      !dailyLimitStatus.allowed
                        ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800'
                        : dailyLimitStatus.remaining <= 1
                        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                        : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
                    }`}
                    title={dailyLimitStatus.resetTimeMessage}
                  >
                    <Clock size={12} />
                    Cota diária de editor: {dailyLimitStatus.count}/5 usadas ({dailyLimitStatus.remaining} restantes hoje)
                  </span>
                )
              )}
            </div>
          </div>

          {/* View mode toggle & Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Primary Mode Toggle: Visual vs Code vs Split vs Preview */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleSwitchMode('visual')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                  viewMode === 'visual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
                }`}
                title="Editor Visual / Página Formatada"
              >
                <FileText size={13} />
                <span>Página Formatada</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('edit')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                  viewMode === 'edit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
                }`}
                title="Código-Fonte MediaWiki"
              >
                <FileCode size={13} />
                <span>Código Wikitexto</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('split')}
                className={`hidden md:flex px-2 py-1 text-xs font-semibold rounded transition items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Código e Prévia lado a lado"
              >
                <Columns size={12} /> Divisão
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('preview')}
                className={`px-2 py-1 text-xs font-semibold rounded transition flex items-center gap-1 ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Prévia Completa"
              >
                <Eye size={12} /> Prévia
              </button>
            </div>

            {/* Botão de Auxílio do Chatbot Gemini AI Studio */}
            <button
              type="button"
              onClick={() => setShowGeminiDrawer(true)}
              className="px-2.5 py-1 rounded bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 hover:from-blue-700 hover:to-indigo-800 text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer border border-blue-400/30"
              title="Chatbot Gemini (Google AI Studio) - Auxílio para criação, redação e estruturação de artigos"
            >
              <Sparkles size={13} className="text-amber-300 animate-pulse shrink-0" />
              <span>Chatbot Gemini</span>
            </button>

            {/* Botão de Integração do Gemini Notebook */}
            <button
              type="button"
              onClick={() => {
                if (onOpenNotebookModal) {
                  onOpenNotebookModal();
                } else {
                  setShowGeminiDrawer(true);
                }
              }}
              className="px-2.5 py-1 rounded bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer border border-purple-400/30"
              title="Gemini Notebook - Síntese de múltiplas fontes e inserção automática no artigo"
            >
              <BookOpen size={13} className="text-amber-300 shrink-0" />
              <span>Gemini Notebook</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="px-2 py-1 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
              title="Exportar rascunho/artigo para PDF"
            >
              <FileDown size={13} className="text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>

            {/* Botão de Pré-visualizar PDF com Cabeçalho Padronizado */}
            <button
              type="button"
              onClick={() => setShowPdfPreviewModal(true)}
              className="px-2.5 py-1 rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Pré-visualizar documento formatado em PDF com o cabeçalho personalizado"
            >
              <FileText size={13} className="text-blue-600 dark:text-blue-400" />
              <span>Pré-visualizar PDF</span>
            </button>

            {/* Botão de Comitê de Ética em Pesquisa com Seres Humanos */}
            <button
              type="button"
              onClick={() => setShowEthicsModal(true)}
              className={`px-2.5 py-1 rounded border transition text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer ${
                comiteEtica?.envolveSeresHumanos && comiteEtica.statusEtica !== 'nao_se_aplica'
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP / Plataforma Brasil)"
            >
              <ShieldCheck size={13} className={comiteEtica?.envolveSeresHumanos && comiteEtica.statusEtica !== 'nao_se_aplica' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'} />
              <span>
                {comiteEtica?.envolveSeresHumanos && comiteEtica.statusEtica !== 'nao_se_aplica'
                  ? `CEP: ${comiteEtica.statusEtica === 'aprovado' ? 'Aprovado' : comiteEtica.statusEtica === 'dispensado' ? 'Dispensado' : 'Em Análise'}`
                  : 'Comitê de Ética'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1"
            >
              <HelpCircle size={13} />
              <span className="hidden sm:inline">Ajuda</span>
            </button>

            <button
              type="button"
              onClick={handleCancelClick}
              className="px-2.5 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Banner de Bloqueio da Moderação (Se o artigo ou a coleção estiverem protegidos) */}
        {isTargetLocked && (
          <div className="mt-3 p-3 rounded border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-xs">
            <Lock size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold uppercase tracking-wider font-mono text-amber-800 dark:text-amber-300">
                  {isArticleLocked ? 'Artigo Protegido pela Moderação' : 'Coleção Bloqueada pela Moderação'}
                </strong>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded font-mono font-semibold">
                  Edição Restrita a Moderadores & Admins
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {isArticleLocked
                  ? `Este verbete foi bloqueado pela moderação (${initialArticle?.lockReason || 'proteção editorial'}). Usuários comuns não possuem permissão para salvar alterações neste artigo.`
                  : `A coleção "${currentSelectedPage?.titulo}" está bloqueada pela moderação. Não é permitido criar novos artigos nesta coleção.`}
              </p>
            </div>
          </div>
        )}

        {/* Banner de Aviso de Limite Diário de 5 Edições Atingido */}
        {dailyLimitStatus && !dailyLimitStatus.isExempt && !dailyLimitStatus.allowed && (
          <div className="mt-3 p-3 rounded border border-red-200 dark:border-red-900/80 bg-red-50/90 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold uppercase tracking-wider font-mono text-red-800 dark:text-red-300">
                  Limite Diário de Edições Atingido (5/5)
                </strong>
                <span className="text-[10px] bg-red-200 dark:bg-red-900/80 text-red-800 dark:text-red-200 px-1.5 py-0.2 rounded font-mono font-semibold">
                  Bloqueio Temporário de Edição
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                Usuários com cargo de <strong>Editor</strong> possuem um limite diário de até <strong>5 edições por dia</strong> para manutenção da integridade da enciclopédia (com exceção de <strong>moderadores</strong> e <strong>administradores</strong>, que são isentos).
              </p>
              <p className="text-[10px] font-mono text-red-600 dark:text-red-400">
                Suas edições serão renovadas automaticamente à meia-noite (00:00).
              </p>
            </div>
          </div>
        )}

        {/* High Density Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 font-mono">
              Título do Artigo *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Metropolitano de São Paulo"
              className="w-full px-2.5 py-1 text-xs rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 font-mono">
              Coleção / Tópico *
            </label>
            <select
              value={pageUid}
              onChange={(e) => setPageUid(e.target.value)}
              className="w-full px-2.5 py-1 text-xs rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {pages.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.titulo} ({p.uid})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MediaWiki Quick Cheat Sheet Accordion */}
      {showCheatSheet && (
        <div className="bg-[#fffdf0] dark:bg-[#1a1708] border border-[#eaddc5] dark:border-[#52441a] rounded p-3 text-xs text-[#855e00] dark:text-[#e0c46b] space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#eaddc5] dark:border-[#52441a] pb-1">
            <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1 font-mono">
              <span>📖</span> Guia Rápido de Sintaxe Wikitexto & Edição Visual
            </h3>
            <button
              onClick={() => setShowCheatSheet(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[10px]">
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Cabeçalhos:</span>
              <div>= Título 1 =</div>
              <div>== Seção 2 ==</div>
              <div>=== Subseção 3 ===</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Estilo:</span>
              <div>'''Negrito'''</div>
              <div>''Itálico''</div>
              <div>~~Riscado~~</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Links:</span>
              <div>[[Nome do Artigo]]</div>
              <div>[[Destino|Texto visível]]</div>
              <div>[http://url link externo]</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="font-sans font-bold text-slate-900 dark:text-white block mb-0.5">Listas:</span>
              <div>* Item com marcador</div>
              <div># Item numerado</div>
              <div>&gt; Citação</div>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#eaddc5] dark:border-[#52441a] flex flex-wrap items-center gap-3 text-[11px] font-sans">
            <span className="font-bold text-slate-800 dark:text-slate-200">Atalhos do Editor:</span>
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold shadow-xs">Ctrl+S</kbd>
              <span>Salvar e publicar artigo</span>
            </span>
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold shadow-xs">Ctrl+H</kbd>
              <span>Abrir Localizar e Substituir</span>
            </span>
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold shadow-xs">Esc</kbd>
              <span>Fechar barra de busca</span>
            </span>
          </div>
        </div>
      )}

      {/* Editor Workspace */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden flex flex-col">
        {/* Formatting Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 p-1.5 flex items-center gap-1 flex-wrap overflow-x-auto">
          {/* Headers */}
          <button
            type="button"
            onClick={() => insertWikitext('= ', ' =', 'Título Principal')}
            title="Título Principal (H1)"
            className={`p-1.5 rounded font-semibold cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.blockTag === 'h1'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Heading1 size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('== ', ' ==', 'Seção Principal')}
            title="Seção Principal (H2)"
            className={`p-1.5 rounded font-semibold cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.blockTag === 'h2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('=== ', ' ===', 'Subseção')}
            title="Subseção (H3)"
            className={`p-1.5 rounded font-semibold cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.blockTag === 'h3'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Heading3 size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Inline Formats */}
          <button
            type="button"
            onClick={() => insertWikitext("'''", "'''", 'texto em negrito')}
            title="Negrito (Ctrl+B)"
            className={`p-1.5 rounded font-bold cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.bold
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext("''", "''", 'texto em itálico')}
            title="Itálico (Ctrl+I)"
            className={`p-1.5 rounded italic cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.italic
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('<u>', '</u>', 'texto sublinhado')}
            title="Sublinhado (Ctrl+U)"
            className={`p-1.5 rounded cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.underline
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('~~', '~~', 'texto riscado')}
            title="Riscado (~~)"
            className={`p-1.5 rounded cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.strikethrough
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Strikethrough size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => insertWikitext('* ', '', 'Item com marcador')}
            title="Lista com marcadores (*)"
            className={`p-1.5 rounded cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.unorderedList
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('# ', '', 'Item numerado')}
            title="Lista numerada (#)"
            className={`p-1.5 rounded cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.orderedList
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('> ', '', 'Citação em destaque')}
            title="Citação em destaque (>)"
            className={`p-1.5 rounded cursor-pointer transition ${
              isFormattedPaneActive() && activeFormats.blockTag === 'blockquote'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('\n----\n', '', '')}
            title="Linha horizontal separadora (----)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer transition"
          >
            <Minus size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Links, Images & Inline Code */}
          <button
            type="button"
            onClick={() => setActiveToolbarDrawer((prev) => (prev === 'link' ? 'none' : 'link'))}
            title="Construtor de Link Interno/Externo (Ctrl+K)"
            className={`p-1.5 rounded cursor-pointer transition ${
              activeToolbarDrawer === 'link'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <LinkIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() => setActiveToolbarDrawer((prev) => (prev === 'image' ? 'none' : 'image'))}
            title="Inserir Imagem ou Ficheiro MediaWiki"
            className={`p-1.5 rounded cursor-pointer transition ${
              activeToolbarDrawer === 'image'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Image size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertWikitext('`', '`', 'código')}
            title="Código inline (`)"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 cursor-pointer transition"
          >
            <Code size={14} />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Citation Tool Button */}
          <button
            type="button"
            onClick={handleOpenCitationModal}
            title="Inserir Citação / Referência (gera automaticamente a seção de Referências)"
            className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded text-xs font-semibold flex items-center gap-1.5 border border-amber-300 dark:border-amber-700 transition cursor-pointer shadow-2xs"
          >
            <Quote size={13} className="text-amber-600 dark:text-amber-400" />
            <span>Citar</span>
          </button>

          {/* Botão do Validador de Citações */}
          <button
            type="button"
            onClick={() => setShowCitationValidator((prev) => !prev)}
            title="Validador Automático de Citações e Referências (verifica se todos os marcadores possuem entradas correspondentes)"
            className={`px-2.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
              !citationValidation.isValid
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100'
                : citationValidation.issues.length > 0
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck
              size={13}
              className={
                !citationValidation.isValid
                  ? 'text-rose-600 dark:text-rose-400'
                  : citationValidation.issues.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }
            />
            <span>Validador</span>
            {citationValidation.issues.length > 0 ? (
              <span
                className={`text-[9.5px] font-mono px-1 py-0.2 rounded font-bold ${
                  !citationValidation.isValid ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {citationValidation.issues.length}
              </span>
            ) : (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">✓</span>
            )}
          </button>

          {/* Botão Fix Citations (Cruza todas as tags com a seção de Referências e adiciona placeholders) */}
          <button
            type="button"
            onClick={handleFixCitations}
            title="Fix Citations: Cruza todas as tags com a seção de Referências e adiciona entradas pendentes como placeholders no final"
            className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
          >
            <Wrench size={12} className="text-white" />
            <span>Fix Citations</span>
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Infobox & Table Templates */}
          <button
            type="button"
            onClick={() => setActiveToolbarDrawer((prev) => (prev === 'table' ? 'none' : 'table'))}
            title="Construtor Rápido de Tabela MediaWiki"
            className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 border cursor-pointer transition ${
              activeToolbarDrawer === 'table'
                ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Table size={12} /> Tabela
          </button>
          <button
            type="button"
            id="btn-editor-infobox-catalog"
            onClick={() => {
              setInfoboxModalTab('catalog');
              setShowInfoboxModal(true);
            }}
            title="Inserir Infobox: escolha entre 22 tipos (Usuário, Biografia, País, Software, Hardware, Animal, Planeta, Personagem e mais)"
            className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <LayoutTemplate size={12} /> Infoboxes
          </button>
          <button
            type="button"
            id="btn-editor-predefinicoes"
            onClick={() => setShowPredefinicoesModal(true)}
            title="Inserir Predefinições MediaWiki ({{Sem-fontes}}, {{Navbox}}, {{Ambox}}, {{Portal}}, {{Citar web}}, etc.)"
            className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Braces size={12} /> Predefinições
          </button>
          <button
            type="button"
            id="btn-editor-infobox-tutorial"
            onClick={() => {
              setInfoboxModalTab('tutorial');
              setShowInfoboxModal(true);
            }}
            title="Tutorial de como usar Infoboxes e lista completa de variáveis"
            className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <BookOpen size={12} /> Tutorial Infobox
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomWikitextCode('');
              setInsertModalTab('edit');
              setShowInsertWikitextModal(true);
            }}
            title="Inserir Código Wikitexto (converte e exibe formatado no artigo)"
            className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition"
          >
            <Code2 size={12} /> Inserir Wikitexto
          </button>

          {/* Botões Dinâmicos Registrados por Extensões do Editor */}
          {editorPlugins.map((btn) => (
            <button
              key={btn.buttonId}
              type="button"
              onClick={() => insertWikitext(btn.snippetTemplate)}
              title={btn.tooltip || `Extensão: ${btn.label}`}
              className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
            >
              <Puzzle size={11} className="text-purple-600 dark:text-purple-400" />
              <span>{btn.label}</span>
            </button>
          ))}

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Botão Localizar e Substituir (Ctrl+H) */}
          <button
            type="button"
            onClick={() => {
              if (showFindReplace) {
                setShowFindReplace(false);
              } else {
                openFindReplace();
              }
            }}
            title="Localizar e Substituir no artigo (Atalho: Ctrl+H)"
            className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
              showFindReplace
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Replace size={12} />
            <span>Localizar / Substituir</span>
            <kbd
              className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                showFindReplace ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              Ctrl+H
            </kbd>
          </button>
        </div>

        {/* Interactive Toolbar Drawers: Construtor de Link, Construtor de Tabela, Inserir Imagem */}
        {activeToolbarDrawer === 'link' && (
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/80 p-2.5 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <LinkIcon size={13} /> Construtor de Link MediaWiki
              </span>
              <button
                type="button"
                onClick={() => setActiveToolbarDrawer('none')}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setQuickLinkType('internal')}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold cursor-pointer ${
                    quickLinkType === 'internal'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Interno ([[...]])
                </button>
                <button
                  type="button"
                  onClick={() => setQuickLinkType('external')}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold cursor-pointer ${
                    quickLinkType === 'external'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Externo ([http...])
                </button>
              </div>
              <input
                type="text"
                value={quickLinkTarget}
                onChange={(e) => setQuickLinkTarget(e.target.value)}
                placeholder={
                  quickLinkType === 'internal'
                    ? 'Título do artigo interno'
                    : 'https://exemplo.com'
                }
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={quickLinkLabel}
                onChange={(e) => setQuickLinkLabel(e.target.value)}
                placeholder="Texto exibido (opcional)"
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-blue-700 dark:text-blue-300">
                {builtQuickLinkSyntax}
              </code>
              <button
                type="button"
                onClick={() => {
                  insertFormattedWikitextSnippet(builtQuickLinkSyntax, 'inline');
                  setActiveToolbarDrawer('none');
                  setQuickLinkTarget('');
                  setQuickLinkLabel('');
                }}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Check size={13} />
                <span>Inserir Link</span>
              </button>
            </div>
          </div>
        )}

        {activeToolbarDrawer === 'table' && (
          <div className="bg-teal-50/80 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-800/80 p-2.5 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <Table size={13} /> Construtor Rápido de Tabela MediaWiki
              </span>
              <button
                type="button"
                onClick={() => setActiveToolbarDrawer('none')}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                <span>Linhas:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quickTableRows}
                  onChange={(e) => setQuickTableRows(Number(e.target.value) || 1)}
                  className="w-14 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                <span>Colunas:</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={quickTableCols}
                  onChange={(e) => setQuickTableCols(Number(e.target.value) || 1)}
                  className="w-14 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </label>
              <input
                type="text"
                value={quickTableCaption}
                onChange={(e) => setQuickTableCaption(e.target.value)}
                placeholder="Legenda da tabela (opcional)"
                className="flex-1 min-w-[160px] px-2.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quickTableHeader}
                  onChange={(e) => setQuickTableHeader(e.target.checked)}
                />
                <span>Linha de cabeçalho (!)</span>
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <pre className="flex-1 min-w-[220px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto max-h-24">
                {builtQuickTableSyntax}
              </pre>
              <button
                type="button"
                onClick={() => {
                  insertFormattedWikitextSnippet(builtQuickTableSyntax, 'block');
                  setActiveToolbarDrawer('none');
                }}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Check size={13} />
                <span>Inserir Tabela</span>
              </button>
            </div>
          </div>
        )}

        {activeToolbarDrawer === 'image' && (
          <div className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 p-2.5 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <Image size={13} /> Inserir Imagem / Ficheiro
              </span>
              <button
                type="button"
                onClick={() => setActiveToolbarDrawer('none')}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={quickImageUrl}
                onChange={(e) => setQuickImageUrl(e.target.value)}
                placeholder="Nome do ficheiro (ex: Mapa.png) ou URL https://..."
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
              />
              <input
                type="text"
                value={quickImageCaption}
                onChange={(e) => setQuickImageCaption(e.target.value)}
                placeholder="Legenda / texto alternativo"
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <code className="px-2 py-1 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {builtQuickImageSyntax}
              </code>
              <button
                type="button"
                onClick={() => {
                  insertFormattedWikitextSnippet(builtQuickImageSyntax, 'block');
                  setActiveToolbarDrawer('none');
                  setQuickImageUrl('');
                  setQuickImageCaption('');
                }}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Check size={13} />
                <span>Inserir Imagem</span>
              </button>
            </div>
          </div>
        )}

        {/* Real-time 'Validation Status' summary at the bottom of the toolbar */}
        <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Header */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Validation Status:
              </span>
              {citationMarkersSummary.total === 0 ? (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-sans font-medium text-[11px]">
                  <FileCheck size={12} className="text-slate-400" />
                  <span>Sem marcadores</span>
                </span>
              ) : citationMarkersSummary.brokenCount === 0 && citationMarkersSummary.hasRefSection ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800 font-sans font-bold text-[11px]">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Citações Válidas (100% Íntegras)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-300 dark:border-rose-800 font-sans font-bold text-[11px] animate-pulse">
                  <AlertCircle size={12} className="text-rose-600" />
                  <span>Inconsistências Encontradas</span>
                </span>
              )}
            </div>

            <span className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:inline" />

            {/* Visual breakdown: Green = Valid, Red = Broken/Missing */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Green indicator: Valid */}
              <span
                title="Citações válidas (destacadas em verde no editor) com definição correspondente e seção de referências ativa"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>{citationMarkersSummary.validCount} Válidas (Verde)</span>
              </span>

              {/* Red indicator: Broken / Missing */}
              <span
                title="Citações quebradas ou ausentes (destacadas em vermelho no editor): tags sem fechamento, sem definição ou sem seção de referências"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border shadow-2xs ${
                  citationMarkersSummary.brokenCount > 0
                    ? 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-700 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    citationMarkersSummary.brokenCount > 0 ? 'bg-rose-600 animate-ping' : 'bg-slate-400'
                  }`}
                ></span>
                <span>{citationMarkersSummary.brokenCount} Quebradas / Ausentes (Vermelho)</span>
              </span>

              {/* References Section indicator */}
              <span
                title="Status da presença da seção '== Referências ==' com o marcador {{reflist}}"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
                  citationMarkersSummary.hasRefSection
                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                }`}
              >
                <span>{citationMarkersSummary.hasRefSection ? '✓ == Referências == Presente' : '✗ == Referências == Ausente'}</span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {citationMarkersSummary.brokenCount > 0 && (
              <button
                type="button"
                onClick={handleFixCitations}
                title="Corrigir referências quebradas e adicionar entradas pendentes automaticamente como placeholders"
                className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95"
              >
                <Wrench size={10} />
                <span>Fix Citations</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCitationValidator((prev) => !prev)}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10.5px] transition cursor-pointer"
            >
              <span>{showCitationValidator ? 'Ocultar Painel' : 'Expandir Validador'}</span>
            </button>
          </div>
        </div>

        {/* Painel Interativo de Localizar e Substituir (Atalho: Ctrl+H) */}
        {showFindReplace && (
          <div className="bg-slate-100/95 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 sm:px-3 text-xs animate-in slide-in-from-top-1 duration-150 shadow-inner">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Campo Localizar */}
                <div className="relative flex items-center min-w-[200px] flex-1 sm:flex-initial sm:w-60">
                  <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={findInputRef}
                    type="text"
                    value={findQuery}
                    onChange={(e) => {
                      setFindQuery(e.target.value);
                      setCurrentMatchIdx(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          goToMatch(currentMatchIdx - 1);
                        } else {
                          goToMatch(currentMatchIdx + 1);
                        }
                      } else if (e.key === 'Escape') {
                        setShowFindReplace(false);
                      }
                    }}
                    placeholder="Localizar no texto..."
                    className="w-full pl-8 pr-16 py-1 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  {/* Contador de ocorrências */}
                  <div className="absolute right-2 text-[10px] font-mono select-none">
                    {findQuery.trim() ? (
                      matches.length > 0 ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {currentMatchIdx + 1}/{matches.length}
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold">0/0</span>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Controles de Navegação e Filtros */}
                <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => goToMatch(currentMatchIdx - 1)}
                    disabled={matches.length === 0}
                    title="Ocorrência anterior (Shift+Enter)"
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToMatch(currentMatchIdx + 1)}
                    disabled={matches.length === 0}
                    title="Próxima ocorrência (Enter)"
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronDown size={14} />
                  </button>

                  <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => setMatchCase(!matchCase)}
                    title="Diferenciar maiúsculas e minúsculas (Aa)"
                    className={`p-1 rounded transition text-[11px] font-bold cursor-pointer ${
                      matchCase
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <CaseSensitive size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchWholeWord(!matchWholeWord)}
                    title="Coincidir palavra inteira"
                    className={`p-1 rounded transition text-[11px] font-bold cursor-pointer ${
                      matchWholeWord
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <WholeWord size={14} />
                  </button>
                </div>

                {/* Campo Substituir */}
                <div className="relative flex items-center min-w-[200px] flex-1 sm:flex-initial sm:w-60">
                  <Replace size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={replaceInputRef}
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleReplaceCurrent();
                      } else if (e.key === 'Escape') {
                        setShowFindReplace(false);
                      }
                    }}
                    placeholder="Substituir por..."
                    className="w-full pl-8 pr-2 py-1 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Botões de Substituição */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleReplaceCurrent}
                    disabled={matches.length === 0}
                    title="Substituir a ocorrência selecionada"
                    className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-white shadow-xs transition cursor-pointer"
                  >
                    <Replace size={12} />
                    <span>Substituir</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReplaceAll}
                    disabled={matches.length === 0}
                    title="Substituir todas as ocorrências encontradas no artigo"
                    className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-white shadow-xs transition cursor-pointer"
                  >
                    <ReplaceAll size={12} />
                    <span>Substituir Tudo</span>
                  </button>
                </div>

                {/* Feedback dinâmico */}
                {findReplaceFeedback && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold animate-in fade-in">
                    {findReplaceFeedback}
                  </span>
                )}
              </div>

              {/* Botão de Fechar e Atalho */}
              <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                <span className="text-[10px] font-mono text-slate-400">
                  <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Esc</kbd> fechar
                </span>
                <button
                  type="button"
                  onClick={() => setShowFindReplace(false)}
                  title="Fechar Localizar e Substituir (Esc)"
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback de colagem de texto formatado / Wikitexto */}
        {pasteFeedback && (
          <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-800/80 px-3.5 py-2 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{pasteFeedback}</span>
            </span>
            <button
              type="button"
              onClick={() => setPasteFeedback(null)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-300 p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Feedback de inserção de citação */}
        {citationFeedback && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800/80 px-3.5 py-2 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>{citationFeedback}</span>
            </span>
            <button
              type="button"
              onClick={() => setCitationFeedback(null)}
              className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Validador Automático de Citações e Referências */}
        {showCitationValidator && (
          <CitationValidatorPanel
            validationResult={citationValidation}
            onApplyFix={handleApplyCitationFix}
            currentWikitext={descricao}
            onOpenCitationModal={handleOpenCitationModal}
            onHighlightInEditor={handleHighlightCitationIssue}
          />
        )}

        {/* Content Editing Canvas */}
        <div className="min-h-[440px] flex flex-col">
          {/* 1. VISUAL FORMATTED PAGE MODE (WYSIWYG com bridge atômico sem perda) */}
          {viewMode === 'visual' && (
            <div className="p-4 sm:p-6 flex-1 flex flex-col bg-white dark:bg-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <Type size={13} />
                  <span>Página Formatada (Edição Visual Direta · Sincronizada com Wikitexto)</span>
                </span>
                <div className="flex items-center gap-2">
                  {draftSaved && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono font-bold">
                      <CheckCircle2 size={11} /> Rascunho salvo
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormattedPaneMode('editable')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                        formattedPaneMode === 'editable'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Interativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormattedPaneMode('preview')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                        formattedPaneMode === 'preview'
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Leitura Final
                    </button>
                  </div>
                </div>
              </div>

              {formattedPaneMode === 'editable' ? (
                <FormattedWikitextPane
                  ref={formattedPaneRef}
                  value={descricao}
                  onChange={setDescricao}
                  disabled={!editPermission.allowed}
                  articleTitle={titulo}
                  customTemplates={customTemplates}
                  syncSourceRef={syncSourceRef}
                  onFocusPane={() => {
                    lastFocusedPaneRef.current = 'formatted';
                  }}
                  onActiveFormatsChange={setActiveFormats}
                  onMouseMove={handleCitationHover}
                  onMouseLeave={handleCitationLeave}
                  onPasteFeedback={showTempPasteFeedback}
                />
              ) : (
                <div
                  onMouseMove={handleCitationHover}
                  onMouseLeave={handleCitationLeave}
                  className="wiki-rendered-content font-wiki-body text-xs flex-1 min-h-[420px] max-h-[600px] p-4 sm:p-5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-y-auto leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderedHtml) }}
                />
              )}
            </div>
          )}

          {/* 2. RAW WIKITEXT CODE MODE */}
          {viewMode === 'edit' && (
            <div className="p-3 flex-1 flex flex-col bg-white dark:bg-slate-950">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 flex-wrap gap-1">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold">CÓDIGO-FONTE WIKITEXTO:</span>
                  {citationMarkersSummary.total > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {citationMarkersSummary.validCount} válidas (verde)
                      </span>
                      {citationMarkersSummary.brokenCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {citationMarkersSummary.brokenCount} quebradas (vermelho)
                        </span>
                      )}
                    </span>
                  )}
                </span>
                {draftSaved && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={11} /> Rascunho salvo
                  </span>
                )}
              </div>

              {/* Strip interativo com marcadores coloridos */}
              {citationValidation.referencesList.length > 0 && (
                <div className="mb-2 flex items-center gap-1 overflow-x-auto py-1 px-1.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px]">
                  <span className="font-mono font-bold text-slate-400 shrink-0 uppercase tracking-wider text-[9.5px]">
                    Marcadores:
                  </span>
                  {citationValidation.referencesList.map((ref) => {
                    const isValid = citationMarkersSummary.hasRefSection && ref.content.length > 0;
                    return (
                      <button
                        key={ref.index}
                        type="button"
                        onClick={() => {
                          const el = textareaRef.current;
                          if (!el) return;
                          const targetText = ref.name ? `<ref name="${ref.name}"` : `<ref>${ref.content.substring(0, 15)}`;
                          const idx = descricao.indexOf(targetText);
                          if (idx !== -1) {
                            el.focus();
                            el.setSelectionRange(idx, idx + targetText.length);
                            const lines = descricao.substring(0, idx).split('\n').length;
                            el.scrollTop = Math.max(0, (lines - 4) * 18);
                          }
                        }}
                        title={isValid ? `Citação [${ref.index}] válida (destacada em verde). Clique para localizar no texto.` : `Citação [${ref.index}] quebrada/ausente (destacada em vermelho). Clique para localizar.`}
                        className={`px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                          isValid
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`}></span>
                        <span>[{ref.index}{ref.name ? `: ${ref.name}` : ''}]</span>
                        <span>{isValid ? '✓' : '⚠'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={descricao}
                disabled={!editPermission.allowed}
                onFocus={() => {
                  lastFocusedPaneRef.current = 'code';
                }}
                onChange={(e) => {
                  syncSourceRef.current = 'code';
                  setDescricao(e.target.value);
                }}
                onKeyDown={handleTextareaKeyDown}
                onPaste={handleTextareaPaste}
                onSelect={handleTextareaCitationHover}
                onClick={handleTextareaCitationHover}
                onKeyUp={handleTextareaCitationHover}
                placeholder="Escreva seu artigo aqui ou cole texto já formatado (Ctrl+V converte automaticamente para Wikitexto)..."
                className="w-full flex-1 min-h-[380px] p-3 text-xs font-mono-code bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y leading-relaxed"
              />
            </div>
          )}

          {/* 3. SPLIT VIEW (CÓDIGO + EDIÇÃO FORMATADA BIDIRECIONAL) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 flex-1">
              <div className="p-3 flex flex-col">
                <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between flex-wrap gap-1">
                  <span className="flex items-center gap-1">
                    <span className="font-bold">CÓDIGO WIKITEXTO:</span>
                    {citationMarkersSummary.total > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                          {citationMarkersSummary.validCount} verdes
                        </span>
                        {citationMarkersSummary.brokenCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                            {citationMarkersSummary.brokenCount} vermelhas
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  {draftSaved && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Salvo</span>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={descricao}
                  disabled={!editPermission.allowed}
                  onFocus={() => {
                    lastFocusedPaneRef.current = 'code';
                  }}
                  onChange={(e) => {
                    syncSourceRef.current = 'code';
                    setDescricao(e.target.value);
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  onPaste={handleTextareaPaste}
                  onSelect={handleTextareaCitationHover}
                  onClick={handleTextareaCitationHover}
                  onKeyUp={handleTextareaCitationHover}
                  placeholder="Código-fonte MediaWiki..."
                  className="w-full flex-1 min-h-[420px] p-2.5 text-xs font-mono-code bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="p-3 flex flex-col bg-white dark:bg-slate-950">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Type size={13} />
                    <span>Edição Formatada (Visual)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormattedPaneMode('editable')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                        formattedPaneMode === 'editable'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Interativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormattedPaneMode('preview')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                        formattedPaneMode === 'preview'
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Leitura Final
                    </button>
                  </div>
                </div>

                {formattedPaneMode === 'editable' ? (
                  <FormattedWikitextPane
                    ref={formattedPaneRef}
                    value={descricao}
                    onChange={setDescricao}
                    disabled={!editPermission.allowed}
                    articleTitle={titulo}
                    customTemplates={customTemplates}
                    syncSourceRef={syncSourceRef}
                    onFocusPane={() => {
                      lastFocusedPaneRef.current = 'formatted';
                    }}
                    onActiveFormatsChange={setActiveFormats}
                    onMouseMove={handleCitationHover}
                    onMouseLeave={handleCitationLeave}
                    onPasteFeedback={showTempPasteFeedback}
                    minHeightClassName="min-h-[420px]"
                  />
                ) : (
                  <div
                    onMouseMove={handleCitationHover}
                    onMouseLeave={handleCitationLeave}
                    className="wiki-rendered-content font-wiki-body text-xs flex-1 min-h-[420px] max-h-[600px] p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-y-auto leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderedHtml) }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 4. FULL PREVIEW MODE */}
          {viewMode === 'preview' && (
            <div
              onMouseMove={handleCitationHover}
              onMouseLeave={handleCitationLeave}
              className="p-6 overflow-y-auto max-h-[600px] bg-white dark:bg-slate-950"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1 font-mono">
                <Eye size={12} /> Pré-visualização Completa da Página
              </div>
              <div
                className="wiki-rendered-content font-wiki-body text-xs"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderedHtml) }}
              />
            </div>
          )}
        </div>

        {/* High Density Bottom Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live statistics */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>
              Palavras: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong>
            </span>
            <span>
              Bytes: <strong className="text-slate-800 dark:text-slate-200">{charCount}</strong>
            </span>
            <span className="hidden sm:inline">~{readingTimeMin} min de leitura</span>
          </div>

          {/* Save Button with Mandatory Reason Trigger */}
          <div className="flex items-center gap-2">
            {dailyLimitStatus && !dailyLimitStatus.isExempt && (
              <span className={`text-[11px] font-mono hidden md:inline-flex items-center gap-1 ${
                !dailyLimitStatus.allowed ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}>
                <Clock size={11} />
                {dailyLimitStatus.count}/5 edições hoje
              </span>
            )}

            <button
              type="button"
              onClick={handleCancelClick}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition flex items-center gap-1 shadow-xs"
            >
              <FileDown size={13} className="text-rose-600 dark:text-rose-400" />
              <span>Exportar PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSaveModal}
              disabled={isSaving || !editPermission.allowed || (dailyLimitStatus !== null && !dailyLimitStatus.isExempt && !dailyLimitStatus.allowed)}
              title={
                !editPermission.allowed
                  ? editPermission.message
                  : dailyLimitStatus && !dailyLimitStatus.isExempt && !dailyLimitStatus.allowed
                  ? 'Você atingiu o limite de 5 edições diárias para o perfil de editor. Moderadores e administradores têm edições ilimitadas.'
                  : 'Salvar e Publicar Alterações (Atalho: Ctrl+S)'
              }
              className={`px-4 py-1.5 text-xs font-semibold rounded transition flex items-center gap-1.5 flex-shrink-0 shadow-xs cursor-pointer ${
                !editPermission.allowed
                  ? 'bg-slate-400 dark:bg-slate-700 text-white cursor-not-allowed opacity-80'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {!editPermission.allowed ? (
                editPermission.reasonCode === 'ANONYMOUS' ? <LogIn size={13} /> : <Lock size={13} />
              ) : (
                <Save size={13} />
              )}
              <span>
                {isSaving
                  ? 'Salvando...'
                  : !editPermission.allowed
                  ? editPermission.reasonCode === 'ANONYMOUS'
                    ? 'Entrar para Salvar'
                    : editPermission.reasonCode === 'LOCKED_ARTICLE'
                    ? 'Bloqueado pela Moderação'
                    : 'Edição Não Autorizada'
                  : 'Salvar e Publicar Alterações'}
              </span>
              {editPermission.allowed && (
                <kbd className="hidden sm:inline text-[9px] font-mono px-1 py-0.2 rounded bg-black/25 text-white/90 ml-1">
                  Ctrl+S
                </kbd>
              )}
            </button>
          </div>
        </div>

        {/* Compliance & Ethics Bar */}
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            <span>
              É proibido expor <strong>nomes civis de pessoas reais</strong> sem base legal; alinhamento absoluto à <strong>LGPD (Lei 13.709/2018)</strong>, <strong>GDPR</strong> e direitos autorais.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/?uid=Special:NoRealNamesLGPD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Ética: Sem Nomes Reais &amp; LGPD</span>
              <ExternalLink size={10} />
            </a>
            <a
              href="/?uid=Special:EditingEthics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Ver Regras de Ética de Edição</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Modal para Inserção de Código Wikitexto (converte e exibe formatado no artigo) */}
      {showInsertWikitextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                  <Code2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">
                    Inserir Código Wikitexto no Artigo
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cole qualquer código MediaWiki (tabelas, fichas, predefinições). O sistema converte e renderiza a versão formatada diretamente no artigo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInsertWikitextModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mr-1">
                Modelos Rápidos:
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomWikitextCode(
                    '{|\n class="wikitable"\n! Coluna 1 !! Coluna 2 !! Coluna 3\n|-\n| Dado 1A || Dado 1B || Dado 1C\n|-\n| Dado 2A || Dado 2B || Dado 2C\n|}'
                  );
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
              >
                📊 Tabela
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWikitextCode(
                    `{{Infobox\n| Nome = ${titulo || 'Título do Artigo'}\n| Subtítulo = Descrição Geral\n| Cor = azul\n| Imagem = /logo.png\n| Legenda = Legenda da Imagem\n| Seção1 = Dados Principais\n| Origem = Brasil\n| Status = Ativo\n| Rodapé = Verbete WikiWorldWeb\n}}`
                  );
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                📋 Infobox Geral
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWikitextCode(
                    `{{Info/Usuário\n| Nome = ${user?.displayName || 'Seu Pseudônimo'}\n| Subtítulo = Conta Oficial · WikiWorldWeb\n| Cor = azul\n| Ícone = 👤\n| Seção1 = Identificação\n| Cargo = Editor(a)\n| Status = Ativo\n| Idiomas = Português\n| Rodapé = Perfil WikiWorldWeb\n}}`
                  );
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                👤 Info/Usuário
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWikitextCode(
                    `{{Info/Software\n| Nome = ${titulo || 'Nome do Software'}\n| Subtítulo = Projeto de Software\n| Cor = ciano\n| Seção1 = Especificações\n| Linguagem = TypeScript\n| Licença = GNU GPL v3.0\n| Status = Ativo\n}}`
                  );
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                💻 Info/Software
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWikitextCode(
                    '{{Aviso\n| Texto = Este artigo ou seção contém informações em desenvolvimento e expansão contínua.\n}}'
                  );
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
              >
                ⚠️ Caixa de Aviso
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWikitextCode(
                    '{{Citação\n| Texto = O conhecimento é livre e compartilhado por todos os colaboradores.\n| Autor = Comunidade WikiWorldWeb\n}}'
                  );
                }}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
              >
                💬 Citação
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWikitextCode(FULL_MODEL_ARTICLE_WIKITEXT);
                }}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
              >
                📖 Artigo Modelo Completo
              </button>
            </div>

            {/* Modal Body with Tab Switcher */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setInsertModalTab('edit')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                    insertModalTab === 'edit'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileCode size={13} />
                  Código Wikitexto
                </button>
                <button
                  type="button"
                  onClick={() => setInsertModalTab('preview')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                    insertModalTab === 'preview'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Eye size={13} />
                  Prévia Formatada Instantânea
                </button>
              </div>

              {insertModalTab === 'edit' ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                    Cole ou digite o código Wikitexto aqui:
                  </label>
                  <textarea
                    rows={8}
                    value={customWikitextCode}
                    onChange={(e) => setCustomWikitextCode(e.target.value)}
                    placeholder="Cole aqui o código MediaWiki, tabelas {| ... |}, predefinições {{ ... }}, etc."
                    className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                    Resultado Formatado que será inserido no artigo:
                  </label>
                  <div
                    className="wiki-rendered-content font-wiki-body text-xs p-4 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-[160px] overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(parseWikitext(customWikitextCode || '*(nenhum código informado ainda)*').html),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {customWikitextCode.trim()
                  ? `${customWikitextCode.trim().length} caracteres prontos para formatação.`
                  : 'Cole ou selecione um modelo acima.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInsertWikitextModal(false)}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!customWikitextCode.trim()}
                  onClick={() => {
                    insertFormattedWikitextSnippet(customWikitextCode);
                    setShowInsertWikitextModal(false);
                    setCustomWikitextCode('');
                  }}
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} />
                  Inserir Formatado no Artigo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal for Draft / Editing Article */}
      {showPdfModal && (
        <PdfExportModal
          article={{
            id: initialArticle?.id || 'draft-article',
            titulo: titulo || 'Artigo Sem Título',
            descricao: descricao,
            categoria: categoria || 'Geral',
            pageUid: pageUid || 'geral',
            idioma: idioma || 'Português',
            autor: user?.displayName || user?.username || 'Editor WikiWorldWeb',
            dataCriacao: initialArticle?.dataCriacao || new Date().toISOString(),
            dataEdicao: new Date().toISOString(),
            versao: initialArticle?.versao || 1,
          }}
          pageName={pages.find((p) => p.uid === pageUid)?.titulo || 'WikiWorldWeb'}
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {/* PDF Preview Modal with Standard Header & Metrics */}
      {showPdfPreviewModal && (
        <PdfPreviewModal
          article={{
            id: initialArticle?.id || 'draft-article',
            titulo: titulo || 'Artigo Sem Título',
            descricao: descricao,
            categoria: categoria || 'Geral',
            pageUid: pageUid || 'geral',
            idioma: idioma || 'Português',
            autor: user?.displayName || user?.username || 'Editor WikiWorldWeb',
            dataCriacao: initialArticle?.dataCriacao || new Date().toISOString(),
            dataEdicao: new Date().toISOString(),
            versao: initialArticle?.versao || 1,
          }}
          pageName={pages.find((p) => p.uid === pageUid)?.titulo || 'WikiWorldWeb Enciclopédia'}
          isOpen={showPdfPreviewModal}
          onClose={() => setShowPdfPreviewModal(false)}
        />
      )}

      {/* Assistente Chatbot Gemini em Modo Artigo */}
      <GeminiChatbotDrawer
        isOpen={showGeminiDrawer}
        onClose={() => setShowGeminiDrawer(false)}
        currentUser={user}
        contextMode="article"
        currentArticle={{
          titulo: titulo || 'Novo Artigo',
          categoria: categoria || 'Geral',
          pageUid: pageUid || 'geral',
          descricao,
        }}
        onApplyToArticle={handleApplyFromGemini}
        onOpenLoginModal={onOpenLoginModal}
        onOpenPremiumModal={onOpenPremiumModal}
        onOpenNotebook={() => {
          setShowGeminiDrawer(false);
          if (onOpenNotebookModal) onOpenNotebookModal();
        }}
      />

      {/* Modal de Confirmação de Alterações Não Salvas */}
      <UnsavedChangesModal
        isOpen={showDiscardModal}
        isNewArticle={isNewArticle}
        articleTitle={titulo}
        onStay={() => setShowDiscardModal(false)}
        onDiscardAndLeave={handleConfirmDiscard}
        onSave={() => {
          setShowDiscardModal(false);
          handleOpenSaveModal();
        }}
      />

      {/* Ferramenta de Citação e Inserção de Referências */}
      <CitationModal
        isOpen={showCitationModal}
        onClose={() => setShowCitationModal(false)}
        onInsert={handleInsertCitation}
        hasReferencesSection={hasReferencesSection}
        existingNamedRefs={existingNamedRefs}
        initialSelectedText={citationSelectedText}
      />

      {/* Live Tooltip Preview ao passar o mouse sobre marcadores de citação */}
      <CitationHoverTooltip
        data={hoverTooltipData}
        position={hoverTooltipPos}
        visible={!!hoverTooltipData && !!hoverTooltipPos}
        onFixCitation={handleFixCitations}
        onNavigateToRef={(idx) => {
          if (idx) {
            const el = document.getElementById(`cite_note-${idx}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        onMouseEnterTooltip={() => {
          setIsTooltipHovered(true);
          if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        }}
        onMouseLeaveTooltip={() => {
          setIsTooltipHovered(false);
          setHoverTooltipData(null);
          setHoverTooltipPos(null);
        }}
      />

      {/* Modal Interativo de Conflito de Edição (Diff e 3-Way Merge) */}
      {conflictModalData && (
        <EditConflictModal
          isOpen={!!conflictModalData}
          serverArticle={conflictModalData.serverArticle}
          baseVersion={conflictModalData.baseVersion}
          yourWikitext={conflictModalData.yourWikitext}
          baseWikitext={conflictModalData.baseWikitext}
          onClose={() => setConflictModalData(null)}
          onApplyMergedText={(mergedText) => {
            syncSourceRef.current = 'code';
            setDescricao(mergedText);
            baseVersionRef.current = conflictModalData.serverArticle.versao || baseVersionRef.current;
            baseContentRef.current = conflictModalData.serverArticle.descricao || '';
            setConflictModalData(null);
          }}
          onForceOverwrite={async () => {
            const dataToForce = {
              id: initialArticle?.id,
              titulo: titulo.trim(),
              pageUid,
              categoria,
              idioma,
              descricao,
              resumo: conflictModalData.editSummary || descricao.slice(0, 140) + '...',
              comiteEtica,
            };
            setConflictModalData(null);
            setIsSaving(true);
            try {
              await onSave(dataToForce, conflictModalData.editSummary, conflictModalData.isMinor, {
                forceOverwrite: true,
              });
              setIsSavedSuccessfully(true);
              onDirtyChange?.(false, isNewArticle);
            } catch (forceErr: any) {
              setSecurityWarningModal({
                title: 'Erro ao Forçar Gravação',
                message: forceErr?.message || 'Falha ao forçar sobrescrita.',
              });
            } finally {
              setIsSaving(false);
            }
          }}
          onDiscardMyChanges={() => {
            syncSourceRef.current = 'code';
            setDescricao(conflictModalData.serverArticle.descricao || '');
            baseVersionRef.current = conflictModalData.serverArticle.versao || 1;
            baseContentRef.current = conflictModalData.serverArticle.descricao || '';
            setConflictModalData(null);
          }}
        />
      )}

      {/* Modal de Catálogo de Infoboxes, Variáveis & Tutorial */}
      <InfoboxTutorialModal
        isOpen={showInfoboxModal}
        onClose={() => setShowInfoboxModal(false)}
        initialTab={infoboxModalTab}
        initialTemplateId="geral"
        defaultTitle={titulo || undefined}
        onInsertWikitext={(snippet) => insertFormattedWikitextSnippet(snippet, 'block')}
      />

      {/* Modal de Predefinições MediaWiki ({{...}}) */}
      <PredefinicoesModal
        isOpen={showPredefinicoesModal}
        onClose={() => setShowPredefinicoesModal(false)}
        user={user}
        onInsertWikitext={(snippet, placement) =>
          insertFormattedWikitextSnippet(snippet, placement)
        }
      />
    </div>
  );
};
