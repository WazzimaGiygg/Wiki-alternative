import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  X,
  Users,
  Shield,
  Crown,
  Clock,
  Check,
  CheckCheck,
  Smile,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  Circle,
  Sparkles,
  UserCheck,
  Radio,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { UserChatConversation, UserChatMessage, UserProfile } from '../types';
import { UserChatService } from '../services/userChatService';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';

interface UserChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  initialTargetUser?: UserProfile | null;
  onNavigateToUser?: (identifier: string) => void;
  onOpenExtensionsManager?: () => void;
  onLoginClick?: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '👏', '🎉', '💡', '🔥', '😊', '🤝'];

export const UserChatModal: React.FC<UserChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTargetUser,
  onNavigateToUser,
  onOpenExtensionsManager,
  onLoginClick,
}) => {
  const chatService = useMemo(() => UserChatService.getInstance(), []);
  const extensionManager = useMemo(() => ExtensionManager.getInstance(), []);

  // Estado da extensão sincronizada pelo burocrata
  const [isChatExtensionEnabled, setIsChatExtensionEnabled] = useState<boolean>(() =>
    extensionManager.isUserChatEnabled()
  );

  // Escuta mudanças de estado da extensão em tempo real (multi-dispositivo / Firebase)
  useEffect(() => {
    const unsub = extensionManager.subscribe(() => {
      setIsChatExtensionEnabled(extensionManager.isUserChatEnabled());
    });
    return unsub;
  }, [extensionManager]);

  const [activeTab, setActiveTab] = useState<'conversations' | 'search'>('conversations');
  const [conversations, setConversations] = useState<UserChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<UserChatConversation | null>(null);
  const [messages, setMessages] = useState<UserChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isBureaucrat = isUserBureaucrat(currentUser);

  // Inscreve na lista de conversas em tempo real quando aberto e autenticado
  useEffect(() => {
    if (!isOpen || !currentUser || currentUser.isGuest) return;

    const unsub = chatService.subscribeToConversations(currentUser.uid, (convs) => {
      setConversations(convs);

      // Se temos uma conversa ativa, atualiza a referência dela
      setActiveConversation((prev) => {
        if (!prev) return null;
        return convs.find((c) => c.id === prev.id) || prev;
      });
    });

    return () => unsub();
  }, [isOpen, currentUser, chatService]);

  // Se um initialTargetUser for passado ao abrir o modal, inicializa a conversa com ele
  useEffect(() => {
    if (isOpen && currentUser && !currentUser.isGuest && initialTargetUser && initialTargetUser.uid !== currentUser.uid) {
      chatService
        .getOrCreateConversation(currentUser, initialTargetUser)
        .then((conv) => {
          setActiveConversation(conv);
          setActiveTab('conversations');
        })
        .catch((e) => console.warn('Erro ao abrir conversa inicial:', e));
    }
  }, [isOpen, currentUser, initialTargetUser, chatService]);

  // Inscreve nas mensagens em tempo real da conversa ativa
  useEffect(() => {
    if (!isOpen || !activeConversation) {
      setMessages([]);
      return;
    }

    const unsub = chatService.subscribeToMessages(activeConversation.id, (msgs) => {
      setMessages(msgs);
    });

    // Marca como lida para o usuário atual
    if (currentUser) {
      chatService.markChatAsRead(activeConversation.id, currentUser.uid);
    }

    return () => unsub();
  }, [isOpen, activeConversation?.id, currentUser, chatService]);

  // Auto-scroll ao receber ou enviar mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Busca de usuários com debounce
  useEffect(() => {
    if (activeTab !== 'search') return;

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await chatService.searchUsers(searchQuery, currentUser?.uid);
        setSearchResults(results);
      } catch (err) {
        console.warn('Erro na busca de usuários:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, currentUser?.uid, chatService]);

  // Identifica o outro participante da conversa ativa
  const recipient = useMemo(() => {
    if (!activeConversation || !currentUser) return null;
    const otherUid = activeConversation.participants.find((uid) => uid !== currentUser.uid);
    if (!otherUid) return null;
    return activeConversation.participantDetails[otherUid] || null;
  }, [activeConversation, currentUser]);

  const handleStartChatWithUser = async (targetUser: UserProfile) => {
    if (!currentUser || currentUser.isGuest) return;
    try {
      const conv = await chatService.getOrCreateConversation(currentUser, targetUser);
      setActiveConversation(conv);
      setActiveTab('conversations');
    } catch (e) {
      console.error('Falha ao iniciar chat com usuário:', e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !activeConversation || !recipient || !messageInput.trim() || isSending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setIsSending(true);
    setShowEmojiPicker(false);

    try {
      await chatService.sendMessage(activeConversation.id, currentUser, recipient, textToSend);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return conversations.reduce((acc, c) => acc + (c.unreadCounts?.[currentUser.uid] || 0), 0);
  }, [conversations, currentUser]);

  const handleToggleExtensionQuick = async () => {
    if (!isBureaucrat || !currentUser) return;
    const targetState = !isChatExtensionEnabled;
    const res = targetState
      ? await extensionManager.activateExtension('UserChatExtension', currentUser)
      : await extensionManager.deactivateExtension('UserChatExtension', currentUser);

    if (res.success) {
      setIsChatExtensionEnabled(targetState);
    }
  };

  const getRoleBadge = (role?: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('burocrata')) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          <Crown size={10} className="text-amber-600" /> Burocrata
        </span>
      );
    }
    if (r.includes('admin') || r.includes('administrador') || r.includes('superadmin')) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
          <Shield size={10} className="text-blue-600" /> Admin
        </span>
      );
    }
    if (r.includes('moderador')) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
          Moderador
        </span>
      );
    }
    if (r.includes('editor')) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          Editor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
        Membro
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in select-none font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[760px] flex flex-col overflow-hidden">
        {/* Header Principal do Chat */}
        <header className="px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shadow-xs">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  <span>Chat em Tempo Real</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 font-semibold uppercase">
                    v3.09
                  </span>
                </h2>
                {isChatExtensionEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Firebase Live</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-full bg-red-500/20 text-red-200 border border-red-400/30">
                    <Lock size={9} />
                    <span>Desabilitado por Burocrata</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100 opacity-90 truncate max-w-md">
                Conversas diretas entre membros registrados sincronizadas pelo Firebase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isBureaucrat && (
              <button
                type="button"
                onClick={handleToggleExtensionQuick}
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isChatExtensionEnabled
                    ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
                title="Burocrata: Alternar permissão do chat em toda a Wiki no Firebase"
              >
                <Crown size={12} />
                <span>{isChatExtensionEnabled ? 'Desabilitar Chat (Burocrata)' : 'Habilitar Chat'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar janela de chat"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Banner de Aviso caso a Extensão esteja Desativada pelo Burocrata */}
        {!isChatExtensionEnabled ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-4 bg-slate-50 dark:bg-slate-900/90">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md">
              <Lock size={32} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Chat em Tempo Real Desativado
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                A funcionalidade de chat entre usuários está temporariamente suspensa pelo <strong>Conselho de Burocratas</strong> através da extensão sincronizada no Firebase.
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Extensão: UserChatExtension • Status: Desativada na nuvem
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
                  <span>Reativar Chat no Firebase Agora</span>
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
                    Abrir Painel de Extensões
                  </button>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                Aguarde a reativação pelo administrador ou burocrata responsável.
              </div>
            )}
          </div>
        ) : !currentUser || currentUser.isGuest ? (
          /* Aviso para visitantes não logados */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50 dark:bg-slate-900/90">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md">
              <Users size={32} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Exclusivo para Usuários Registrados
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Para conversar em tempo real com outros editores e pesquisadores da comunidade WikiWorldWeb, você precisa entrar com sua conta registrada.
              </p>
            </div>
            {onLoginClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-2"
              >
                <UserCheck size={16} />
                <span>Fazer Login / Criar Conta</span>
              </button>
            )}
          </div>
        ) : (
          /* Visualização de Chat Ativo (Split View Master-Detail) */
          <div className="flex-1 flex overflow-hidden">
            {/* PAINEL ESQUERDO: Lista de conversas e busca de membros */}
            <aside
              className={`w-full sm:w-80 md:w-88 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/60 shrink-0 ${
                activeConversation ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {/* Abas: Conversas vs Buscar Usuários */}
              <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('conversations')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'conversations'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare size={13} />
                  <span>Conversas</span>
                  {totalUnreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'search'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Search size={13} />
                  <span>Buscar Usuários</span>
                </button>
              </div>

              {/* Conteúdo da Aba Ativa */}
              {activeTab === 'conversations' ? (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <MessageSquare size={18} />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nenhuma conversa ativa
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Encontre outros editores da comunidade para trocar ideias ou colaborar.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('search')}
                        className="mt-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                      >
                        Buscar Usuários Agora
                      </button>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const otherUid = conv.participants.find((uid) => uid !== currentUser.uid);
                      const otherDetails = otherUid ? conv.participantDetails[otherUid] : null;
                      const isSelected = activeConversation?.id === conv.id;
                      const unread = conv.unreadCounts?.[currentUser.uid] || 0;

                      return (
                        <div
                          key={conv.id}
                          onClick={() => setActiveConversation(conv)}
                          className={`p-3 flex items-center gap-2.5 cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-l-3 border-blue-600'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-850'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {otherDetails?.photoURL ? (
                              <img
                                src={otherDetails.photoURL}
                                alt={otherDetails.displayName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-2xs">
                                {(otherDetails?.displayName || otherDetails?.username || '?').substring(0, 2)}
                              </div>
                            )}
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute bottom-0 right-0" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {otherDetails?.displayName || otherDetails?.username || 'Usuário'}
                              </span>
                              {conv.lastMessage && (
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {new Date(conv.lastMessage.timestamp).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {conv.lastMessage?.text || 'Nova conversa iniciada'}
                              </p>
                              {unread > 0 && (
                                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Aba de Busca de Usuários */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nome, @username ou cargo..."
                        autoFocus
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                    {isSearching ? (
                      <div className="p-6 text-center text-slate-400 space-y-2">
                        <RefreshCw size={18} className="animate-spin mx-auto text-blue-500" />
                        <p className="text-xs">Buscando usuários cadastrados...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 space-y-1">
                        <Users size={20} className="mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-semibold">Nenhum usuário encontrado</p>
                        <p className="text-[11px] text-slate-500">Tente buscar por outro termo.</p>
                      </div>
                    ) : (
                      searchResults.map((usr) => (
                        <div
                          key={usr.uid}
                          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-between gap-2 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {usr.photoURL ? (
                              <img
                                src={usr.photoURL}
                                alt={usr.displayName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0 shadow-2xs">
                                {(usr.displayName || usr.username || '?').substring(0, 2)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {usr.displayName || usr.username}
                                </span>
                                {getRoleBadge(usr.role)}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                                @{usr.username || usr.uid.substring(0, 8)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartChatWithUser(usr)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs transition cursor-pointer flex items-center gap-1"
                          >
                            <MessageSquare size={12} />
                            <span>Conversar</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </aside>

            {/* PAINEL DIREITO: Área da Conversa Ativa */}
            <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
              {activeConversation && recipient ? (
                <>
                  {/* Topo da Conversa */}
                  <header className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveConversation(null)}
                        className="sm:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Voltar à lista de conversas"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {recipient.photoURL ? (
                        <img
                          src={recipient.photoURL}
                          alt={recipient.displayName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {(recipient.displayName || recipient.username || '?').substring(0, 2)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {recipient.displayName || recipient.username}
                          </h3>
                          {getRoleBadge(recipient.role)}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Conectado em tempo real</span>
                        </span>
                      </div>
                    </div>

                    {onNavigateToUser && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToUser(recipient.uid);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 flex items-center gap-1 transition cursor-pointer"
                        title="Visualizar perfil público do usuário"
                      >
                        <ExternalLink size={12} />
                        <span className="hidden sm:inline">Ver Perfil</span>
                      </button>
                    )}
                  </header>

                  {/* Fluxo de Mensagens */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc] dark:bg-[#0b1120]">
                    {messages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                          <Sparkles size={20} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Início da conversa com {recipient.displayName}
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          As mensagens enviadas aqui são criptografadas e sincronizadas em tempo real via Firebase Firestore.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderUid === currentUser.uid;
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-md px-3.5 py-2 rounded-2xl text-xs shadow-2xs leading-relaxed break-words ${
                                isMe
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>

                              {/* Rodapé da Bolha */}
                              <div
                                className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                  isMe ? 'text-blue-200' : 'text-slate-400'
                                } font-mono`}
                              >
                                <span>
                                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMe && (
                                  <CheckCheck size={12} className="text-blue-200" />
                                )}
                              </div>
                            </div>

                            {/* Reações com Emojis */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {Object.entries(msg.reactions).map(([emoji, uids]) => {
                                  if (!uids || uids.length === 0) return null;
                                  const reactedByMe = uids.includes(currentUser.uid);
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() =>
                                        chatService.toggleMessageReaction(
                                          activeConversation.id,
                                          msg.id,
                                          emoji,
                                          currentUser.uid
                                        )
                                      }
                                      className={`px-1.5 py-0.5 rounded-full text-[11px] border transition flex items-center gap-1 ${
                                        reactedByMe
                                          ? 'bg-blue-100 dark:bg-blue-950 border-blue-400 text-blue-800 dark:text-blue-200 font-bold'
                                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[10px]">{uids.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Barra de Envio de Mensagem */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 shrink-0 relative"
                  >
                    {/* Gaveta de Emojis rápidos */}
                    {showEmojiPicker && (
                      <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg flex items-center gap-1.5 flex-wrap animate-in fade-in slide-in-from-bottom-2">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setMessageInput((prev) => prev + emoji);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-base cursor-pointer transition"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                          showEmojiPicker
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Inserir emojis rápidos"
                      >
                        <Smile size={18} />
                      </button>

                      <div className="flex-1 relative">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={`Mensagem para ${recipient.displayName || recipient.username}... (Enter para enviar)`}
                          rows={1}
                          maxLength={2000}
                          className="w-full max-h-32 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                        />
                        {messageInput.length > 1500 && (
                          <span className="absolute right-2 bottom-1.5 text-[9px] font-mono text-slate-400">
                            {messageInput.length}/2000
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm ${
                          messageInput.trim() && !isSending
                            ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                        title="Enviar mensagem"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* Estado vazio sem conversa selecionada */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#f8fafc] dark:bg-[#0b1120]">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                    <MessageSquare size={28} />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Nenhuma conversa selecionada
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Selecione uma conversa ao lado ou busque um usuário registrado para iniciar um diálogo em tempo real.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Search size={14} />
                    <span>Procurar Membros para Conversar</span>
                  </button>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};
