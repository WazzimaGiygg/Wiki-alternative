import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Lock, Crown } from 'lucide-react';
import { UserProfile } from '../types';
import { UserChatService } from '../services/userChatService';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';

interface UserChatFloatingButtonProps {
  currentUser: UserProfile | null;
  onOpenChat: () => void;
}

export const UserChatFloatingButton: React.FC<UserChatFloatingButtonProps> = ({
  currentUser,
  onOpenChat,
}) => {
  const chatService = useMemo(() => UserChatService.getInstance(), []);
  const extensionManager = useMemo(() => ExtensionManager.getInstance(), []);

  const [isEnabled, setIsEnabled] = useState<boolean>(() =>
    extensionManager.isUserChatEnabled()
  );
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Escuta ativação/desativação da extensão em tempo real
  useEffect(() => {
    const unsub = extensionManager.subscribe(() => {
      setIsEnabled(extensionManager.isUserChatEnabled());
    });
    return unsub;
  }, [extensionManager]);

  // Escuta contagem de mensagens não lidas
  useEffect(() => {
    if (!currentUser || currentUser.isGuest) {
      setUnreadCount(0);
      return;
    }

    const unsub = chatService.subscribeToConversations(currentUser.uid, (convs) => {
      const count = convs.reduce(
        (acc, c) => acc + (c.unreadCounts?.[currentUser.uid] || 0),
        0
      );
      setUnreadCount(count);
    });

    return () => unsub();
  }, [currentUser, chatService]);

  const isBureaucrat = isUserBureaucrat(currentUser);

  // Se a extensão estiver desativada e o usuário não for burocrata, oculta o botão flutuante
  if (!isEnabled && !isBureaucrat) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onOpenChat}
      className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer no-print select-none ${
        !isEnabled
          ? 'bg-amber-600 hover:bg-amber-700 text-white border-2 border-amber-300'
          : unreadCount > 0
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-400/30'
          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
      }`}
      title={
        !isEnabled
          ? 'Chat Desativado por Burocrata (Clique para gerenciar)'
          : unreadCount > 0
          ? `${unreadCount} nova(s) mensagem(ns) no chat`
          : 'Abrir Chat em Tempo Real'
      }
    >
      <div className="relative">
        {!isEnabled ? (
          <Lock size={16} className="text-amber-200" />
        ) : (
          <MessageSquare size={16} className={unreadCount > 0 ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
        )}
        {unreadCount > 0 && isEnabled && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 absolute -top-1 -right-1 animate-pulse" />
        )}
      </div>

      <span className="text-xs font-bold tracking-tight">
        {!isEnabled ? 'Chat (Desativado)' : 'Chat'}
      </span>

      {unreadCount > 0 && isEnabled && (
        <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold">
          {unreadCount}
        </span>
      )}

      {isBureaucrat && !isEnabled && (
        <Crown size={12} className="text-amber-200" />
      )}
    </button>
  );
};
