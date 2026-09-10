import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Settings,
  Copy,
  Check,
  PlusCircle,
  FileText,
  Layers,
  ArrowDownToLine,
  RefreshCw,
  HelpCircle,
  Shield,
  Key,
  ChevronRight,
  Minimize2,
  Maximize2,
  Crown,
  Image as ImageIcon,
  BookOpen,
  Zap,
} from 'lucide-react';
import {
  GeminiChatbotConfig,
  GeminiChatMessage,
  UserProfile,
  WikiPage,
  WikiArticle,
} from '../types';
import {
  GeminiChatbotService,
  DEFAULT_GEMINI_CHATBOT_CONFIG,
} from '../services/geminiChatbotService';
import { GeminiQuotaService } from '../services/geminiQuotaService';

interface GeminiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  contextMode?: 'article' | 'collection' | 'general';
  currentArticle?: {
    titulo?: string;
    categoria?: string;
    pageUid?: string;
    descricao?: string;
  };
  currentCollection?: Partial<WikiPage>;
  onApplyToArticle?: (wikitext: string, mode: 'insert' | 'replace') => void;
  onApplyToCollection?: (collectionData: {
    titulo: string;
    uid: string;
    descricao: string;
    categoria: string;
    icon: string;
    tags: string[];
  }) => void;
  onOpenLoginModal?: () => void;
  onOpenPremiumModal?: (quotaType?: 'chats' | 'images' | 'notebook') => void;
  onOpenNotebook?: () => void;
}

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  contextMode = 'general',
  currentArticle,
  currentCollection,
  onApplyToArticle,
  onApplyToCollection,
  onOpenLoginModal,
  onOpenPremiumModal,
  onOpenNotebook,
}) => {
  const [messages, setMessages] = useState<GeminiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<GeminiChatbotConfig>(DEFAULT_GEMINI_CHATBOT_CONFIG);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Upload de Imagem multimodal
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    preview: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Informações de Cota do Usuário
  const quotaInfo = GeminiQuotaService.getQuotaInfo(currentUser);

  // Formulário do Administrador
  const [adminChatbotId, setAdminChatbotId] = useState('');
  const [adminEnabled, setAdminEnabled] = useState(true);
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [adminModel, setAdminModel] = useState('gemini-2.5-flash');
  const [adminSystemPrompt, setAdminSystemPrompt] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderador' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  // Carrega a configuração do chatbot
  useEffect(() => {
    const loadConfig = async () => {
      const cfg = await GeminiChatbotService.getConfig();
      setConfig(cfg);
      setAdminChatbotId(cfg.chatbotId);
      setAdminEnabled(cfg.enabled);
      setAdminDisplayName(cfg.displayName);
      setAdminModel(cfg.model);
      setAdminSystemPrompt(cfg.systemInstruction || '');
    };
    loadConfig();
  }, [isOpen]);

  // Mensagem inicial contextualizada
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let initialGreeting = `Olá! Sou o **Chatbot Assistente Gemini** integrado via Google AI Studio (**ID: \`${config.chatbotId}\`**).`;

      if (contextMode === 'collection') {
        initialGreeting += `\n\nVejo que você está criando uma nova **Coleção Temática** na WikiZero. Posso ajudá-lo a planejar o escopo, sugerir título, identificador (slug), categoria e tags! Clique em uma das sugestões abaixo ou digite seu tema.`;
      } else if (contextMode === 'article') {
        initialGreeting += `\n\nEstou pronto para auxiliá-lo na redação enciclopédica do artigo **"${currentArticle?.titulo || 'Novo Artigo'}"**. Posso redigir seções completas em sintaxe Wikitext, criar infoboxes, sugerir tópicos e referências.`;
      } else {
        initialGreeting += `\n\nComo posso ajudá-lo hoje na enciclopédia? Posso sugerir novas coleções, redigir artigos completos ou tirar dúvidas sobre formatação wikitexto.`;
      }

      setMessages([
        {
          id: 'msg-welcome',
          role: 'model',
          content: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, contextMode, config.chatbotId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    const messageText = textToSend.trim() || (selectedImage ? 'Analise a imagem enviada para criação de conteúdo na WikiZero.' : '');

    const userMessage: GeminiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: messageText,
      imageUrl: selectedImage?.preview,
      imageMimeType: selectedImage?.mimeType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    const imagePayload = selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await GeminiChatbotService.sendMessage({
        message: messageText,
        history: newHistory,
        user: currentUser,
        image: imagePayload,
        context: {
          mode: (contextMode || 'general') as 'collection' | 'article' | 'general',
          currentArticle: {
            titulo: currentArticle?.titulo,
            categoria: currentArticle?.categoria,
            pageUid: currentArticle?.pageUid,
            contentPreview: currentArticle?.descricao?.slice(0, 500),
          },
          currentCollection: {
            titulo: currentCollection?.titulo,
            categoria: currentCollection?.categoria,
            uid: currentCollection?.uid,
          },
        },
        configOverride: {
          chatbotId: config.chatbotId,
        },
      });

      const botMessage: GeminiChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        offerPremium: response.offerPremium,
        quotaExceeded: response.quotaExceeded,
        quotaType: response.quotaType,
        metadata: {
          actionType: contextMode === 'article' ? 'article' : contextMode === 'collection' ? 'collection' : 'wtext_snippet',
          suggestedData: response.suggestedData,
        },
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: GeminiChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Erro na comunicação com o Chatbot Gemini:**\n${err.message || 'Falha ao processar solicitação.'}\n\n*Dica: Verifique se a variável GEMINI_API_KEY está configurada no ambiente ou se o ID do Chatbot está correto.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido (JPEG, PNG, WEBP).');
      return;
    }

    // Verifica cota se não for premium
    if (!quotaInfo.isPremium && quotaInfo.imagesRemaining <= 0) {
      if (onOpenPremiumModal) {
        onOpenPremiumModal('images');
      } else {
        alert('Limite diário de envio de imagens atingido. Faça upgrade para o Gemini Premium.');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedImage({
        data: dataUrl,
        mimeType: file.type,
        preview: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAdminConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const updated = await GeminiChatbotService.saveConfig(
        {
          chatbotId: adminChatbotId.trim() || '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
          enabled: adminEnabled,
          displayName: adminDisplayName.trim() || 'Gemini Wiki Assistant',
          model: adminModel,
          systemInstruction: adminSystemPrompt.trim(),
        },
        currentUser?.email || currentUser?.displayName || 'Administrador'
      );
      setConfig(updated);
      setConfigSaveSuccess(true);
      setTimeout(() => {
        setConfigSaveSuccess(false);
        setShowConfigModal(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações do chatbot.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyCollectionFromResponse = (text: string) => {
    if (!onApplyToCollection) return;
    try {
      // Tenta extrair JSON do texto
      const jsonMatch = text.match(/\{[\s\S]*"titulo"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        onApplyToCollection({
          titulo: parsed.titulo || 'Nova Coleção',
          uid: parsed.uid || parsed.titulo?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'nova_colecao',
          descricao: parsed.descricao || '',
          categoria: parsed.categoria || 'Geral',
          icon: parsed.icon || '📄',
          tags: Array.isArray(parsed.tags) ? parsed.tags : ['geral'],
        });
        return;
      }
    } catch (err) {
      console.warn('Falha no parse do JSON da coleção:', err);
    }

    // Fallback básico
    onApplyToCollection({
      titulo: 'Coleção Gerada por Gemini',
      uid: 'colecao_gemini',
      descricao: text.slice(0, 200),
      categoria: 'Geral',
      icon: '✨',
      tags: ['gemini', 'ia'],
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
        {/* Backdrop sutil */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs pointer-events-auto transition-opacity duration-200"
        />

        {/* Drawer Principal */}
        <div
          className={`relative pointer-events-auto h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 shadow-2xl transition-all duration-300 z-10 ${
            isExpanded ? 'w-full md:w-[680px]' : 'w-full sm:w-[440px] md:w-[480px]'
          }`}
        >
          {/* Header do Chatbot */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles size={18} className="text-amber-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-sm tracking-tight truncate">
                    {config.displayName || 'Chatbot Gemini AI Studio'}
                  </h2>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-300/40 shrink-0">
                    AI STUDIO
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-blue-100/80 font-mono truncate">
                  <span title={`Chatbot ID: ${config.chatbotId}`}>
                    ID: <span className="text-white font-bold">{config.chatbotId}</span>
                  </span>
                  <span>•</span>
                  <span>{config.model}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && (
                <button
                  onClick={() => setShowConfigModal(true)}
                  title="Configurações do Chatbot (Administrador)"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                >
                  <Settings size={16} />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Reduzir largura' : 'Expandir largura'}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={onClose}
                title="Fechar assistente"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Faixa de Contexto Ativo */}
          <div className="bg-blue-50 dark:bg-slate-800/80 px-4 py-1.5 border-b border-blue-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 shrink-0 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              {contextMode === 'article' ? (
                <>
                  <FileText size={13} className="text-blue-600 dark:text-blue-400" />
                  <span className="truncate">
                    Modo Artigo:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {currentArticle?.titulo || 'Novo Artigo'}
                    </strong>
                  </span>
                </>
              ) : contextMode === 'collection' ? (
                <>
                  <Layers size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">Modo Criação de Coleção (WikiPage)</span>
                </>
              ) : (
                <>
                  <Bot size={13} className="text-purple-600 dark:text-purple-400" />
                  <span className="truncate">Assistente Enciclopédico Geral</span>
                </>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-mono ml-2 shrink-0 flex items-center gap-1"
              >
                <Shield size={11} />
                Editar ID
              </button>
            )}
          </div>

          {/* Faixa de Identidade do Usuário & Cotas Gemini */}
          <div className="bg-slate-50 dark:bg-slate-800/40 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
            <div className="flex items-center gap-2 truncate">
              {currentUser && !currentUser.isGuest ? (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="truncate font-medium">{currentUser.displayName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (ID: {currentUser.uid.slice(0, 6)}...)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Modo Convidado / Deslogado</span>
                  {onOpenLoginModal && (
                    <button
                      onClick={onOpenLoginModal}
                      className="underline font-bold text-[10px] ml-1 hover:text-amber-700"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {quotaInfo.isPremium ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-[10px] flex items-center gap-1 border border-amber-300/40">
                  <Crown size={11} /> Gemini Premium
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[10px]">
                    Chats: {quotaInfo.chatsRemaining}/{quotaInfo.chatsLimit}
                  </span>
                  {onOpenPremiumModal && (
                    <button
                      onClick={() => onOpenPremiumModal('chats')}
                      className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-[10px] hover:opacity-90 shadow-xs flex items-center gap-1"
                    >
                      <Crown size={10} /> Upgrade
                    </button>
                  )}
                </div>
              )}

              {onOpenNotebook && (
                <button
                  onClick={onOpenNotebook}
                  className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-semibold hover:bg-indigo-100 flex items-center gap-1"
                  title="Abrir Gemini Notebook para cruzar fontes e artigos"
                >
                  <BookOpen size={10} />
                  <span>Notebook</span>
                </button>
              )}
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles size={12} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/80 shadow-xs'
                    }`}
                  >
                    {/* Imagem enviada pelo usuário */}
                    {msg.imageUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-white/20 dark:border-slate-700 max-w-[240px]">
                        <img
                          src={msg.imageUrl}
                          alt="Imagem enviada"
                          className="w-full h-auto max-h-48 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Conteúdo formatado da mensagem */}
                    <div className="whitespace-pre-wrap select-text break-words">
                      {msg.content}
                    </div>

                    {/* Card de Oferta ou Upgrade para Gemini Premium */}
                    {!isUser && (msg.offerPremium || msg.quotaExceeded) && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-300 dark:border-amber-600/50 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                          <Crown size={14} className="text-amber-500" />
                          <span>Gemini Premium WikiZero</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {msg.quotaExceeded
                            ? 'Você atingiu o limite gratuito. Desbloqueie chats ilimitados, envio de imagens e o Gemini Notebook completo.'
                            : 'Aproveite o máximo do Google AI Studio com acesso ilimitado a modelos avançados e o Gemini Notebook.'}
                        </p>
                        {onOpenPremiumModal && (
                          <button
                            onClick={() => onOpenPremiumModal(msg.quotaType)}
                            className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Crown size={12} />
                            <span>Ver Planos & Ativar Gemini Premium</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Barra de Ações Rápidas em respostas do bot */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                        <span className="text-slate-400 dark:text-slate-500 font-mono">
                          {msg.timestamp}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="px-2 py-1 rounded bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center gap-1 transition"
                            title="Copiar texto"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={11} className="text-emerald-500" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          {/* Se estamos no editor de artigos */}
                          {contextMode === 'article' && onApplyToArticle && (
                            <>
                              <button
                                onClick={() => onApplyToArticle(msg.content, 'insert')}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 transition"
                                title="Inserir este conteúdo no artigo wikitexto"
                              >
                                <ArrowDownToLine size={11} />
                                <span>Inserir no Artigo</span>
                              </button>
                            </>
                          )}

                          {/* Se estamos na criação de coleção */}
                          {contextMode === 'collection' && onApplyToCollection && (
                            <button
                              onClick={() => handleApplyCollectionFromResponse(msg.content)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1 transition"
                              title="Preencher os campos da coleção com estes dados"
                            >
                              <Layers size={11} />
                              <span>Aplicar na Coleção</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <User size={12} />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs pl-8 italic">
                <RefreshCw size={13} className="animate-spin text-blue-600" />
                <span>Gemini pensando com o Chatbot do AI Studio...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas de Ação */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
            {contextMode === 'collection' ? (
              <>
                <button
                  onClick={() =>
                    handleSendMessage('Gere uma proposta de nova coleção enciclopédica sobre Inteligência Artificial, com título, UID, descrição, categoria, emoji e tags no formato JSON.')
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  🤖 Coleção sobre IA
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('Gere uma especificação de coleção enciclopédica completa sobre História do Brasil e suas fases.')
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  📜 Coleção História do Brasil
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('Quais são as melhores categorias e tags para organizar coleções de tecnologia e games?')
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  💡 Sugerir Categorias
                </button>
              </>
            ) : contextMode === 'article' ? (
              <>
                <button
                  onClick={() =>
                    handleSendMessage(
                      `Redija um artigo enciclopédico completo sobre "${currentArticle?.titulo || 'o tema atual'}" com seções introdução, características, histórico e sintaxe wikitext formatada.`
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  📝 Redigir Artigo Completo
                </button>
                <button
                  onClick={() =>
                    handleSendMessage(
                      `Crie uma infobox resumida em wikitexto para o artigo "${currentArticle?.titulo || 'este assunto'}" com dados principais em tabela.`
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  📊 Gerar Infobox
                </button>
                <button
                  onClick={() =>
                    handleSendMessage(
                      `Sugira 5 referências confiáveis e links para a seção "Veja Também" do artigo "${currentArticle?.titulo}".`
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  📚 Fontes e Veja Também
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    handleSendMessage('Gere ideias de novos artigos e coleções que enriqueceriam a WikiZero hoje.')
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  💡 Sugerir Artigos Faltantes
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('Como estruturar tabelas e predefinições com formatação MediaWiki na WikiZero?')
                  }
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition"
                >
                  ❓ Dicas de Wikitexto
                </button>
              </>
            )}
          </div>

          {/* Campo de Entrada de Mensagem com Suporte a Imagens Multimodais */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
            {/* Preview da Imagem Selecionada */}
            {selectedImage && (
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 w-fit">
                <img
                  src={selectedImage.preview}
                  alt="Preview"
                  className="w-10 h-10 object-cover rounded"
                  referrerPolicy="no-referrer"
                />
                <div className="text-[11px] text-slate-700 dark:text-slate-200 max-w-[180px] truncate">
                  Imagem pronta para análise
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded"
                  title="Remover imagem"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              {/* Botão Anexar Imagem */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition flex items-center justify-center shrink-0 cursor-pointer border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                title={
                  quotaInfo.isPremium
                    ? 'Anexar imagem/documento (Visão Ilimitada)'
                    : `Anexar imagem/documento (${quotaInfo.imagesRemaining}/${quotaInfo.imagesLimit} restantes hoje)`
                }
              >
                <ImageIcon size={16} />
              </button>

              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  contextMode === 'collection'
                    ? 'Peça ao chatbot ideias, títulos ou JSON para sua coleção...'
                    : contextMode === 'article'
                    ? 'Peça texto em wikitext, infobox, seções ou envie uma imagem...'
                    : 'Converse com o Chatbot Gemini AI Studio...'
                }
                rows={2}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                title="Enviar mensagem"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Configuração do Chatbot (Para Administradores) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 text-xs text-slate-800 dark:text-slate-200">
            {/* Header Modal */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm">Configurações do Chatbot Gemini (AI Studio)</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={handleSaveAdminConfig} className="p-5 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs leading-relaxed text-blue-900 dark:text-blue-200">
                <p>
                  Como <strong>administrador</strong>, você pode definir o <strong>ID do Chatbot do Google AI Studio</strong>{' '}
                  que alimentará o assistente de redação e geração de coleções em toda a WikiZero.
                </p>
              </div>

              {/* ID do Chatbot */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>ID do Chatbot do Google AI Studio:</span>
                  <span className="text-[10px] font-mono text-slate-400">Obrigatório</span>
                </label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={adminChatbotId}
                    onChange={(e) => setAdminChatbotId(e.target.value)}
                    placeholder="Ex: 0a14dc90-3ab3-47bc-8306-ca5bc2953699 ou id-customizado"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Insira o ID único do seu chatbot ou prompt configurado no Google AI Studio.
                </p>
              </div>

              {/* Ativar/Desativar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-xs">Ativar Chatbot Gemini na Wiki</div>
                  <div className="text-[10px] text-slate-500">
                    Permite que redatores usem o assistente na criação de artigos e coleções
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={adminEnabled}
                  onChange={(e) => setAdminEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Nome de Exibição */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nome de Exibição do Assistente:
                </label>
                <input
                  type="text"
                  value={adminDisplayName}
                  onChange={(e) => setAdminDisplayName(e.target.value)}
                  placeholder="Ex: Gemini AI Studio Bot"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modelo Gemini */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Modelo Gemini:
                </label>
                <select
                  value={adminModel}
                  onChange={(e) => setAdminModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Rápido, versátil e ideal para artigos)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Raciocínio aprofundado)</option>
                </select>
              </div>

              {/* Instruções do Sistema */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Instruções Adicionais do Sistema (System Prompt):
                </label>
                <textarea
                  value={adminSystemPrompt}
                  onChange={(e) => setAdminSystemPrompt(e.target.value)}
                  placeholder="Defina diretrizes editoriais específicas da sua enciclopédia para o chatbot..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {configSaveSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check size={14} />
                  <span>Configurações salvas com sucesso no Firestore e sincronizadas!</span>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Configuração</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
