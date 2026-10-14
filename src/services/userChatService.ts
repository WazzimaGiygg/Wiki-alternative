import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getDbSafe, handleFirestoreError, OperationType } from './firebase';
import { StorageService } from './storageService';
import { UserChatConversation, UserChatMessage, UserProfile } from '../types';

const STORAGE_KEY_PREFIX = 'wikizero_chat_convs_';
const MESSAGES_KEY_PREFIX = 'wikizero_chat_msgs_';

function getLocalConversations(uid: string): UserChatConversation[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalConversations(uid: string, convs: UserChatConversation[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(convs));
  } catch {
    // Ignore storage quota limits
  }
}

function getLocalMessages(chatId: string): UserChatMessage[] {
  try {
    const raw = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(chatId: string, msgs: UserChatMessage[]): void {
  try {
    localStorage.setItem(`${MESSAGES_KEY_PREFIX}${chatId}`, JSON.stringify(msgs));
  } catch {
    // Ignore storage quota limits
  }
}

export class UserChatService {
  private static instance: UserChatService;

  public static getInstance(): UserChatService {
    if (!UserChatService.instance) {
      UserChatService.instance = new UserChatService();
    }
    return UserChatService.instance;
  }

  /**
   * Gera um ID determinístico e estável para a conversa entre dois usuários.
   */
  public getConversationId(uidA: string, uidB: string): string {
    const sorted = [uidA.trim(), uidB.trim()].sort();
    return `chat_${sorted[0]}_${sorted[1]}`;
  }

  /**
   * Busca e filtra usuários registrados na Wiki por nome, @username ou cargo para iniciar conversas.
   */
  public async searchUsers(queryText: string, currentUid?: string): Promise<UserProfile[]> {
    const allUsers = await StorageService.getCommunityUsers();
    const q = queryText.toLowerCase().trim();

    return allUsers.filter((u) => {
      if (currentUid && u.uid === currentUid) return false;
      if (u.isBanned) return false;
      if (!q) return true;

      const nameMatch = (u.displayName || '').toLowerCase().includes(q);
      const userMatch = (u.username || '').toLowerCase().includes(q);
      const roleMatch = (u.role || '').toLowerCase().includes(q);
      return nameMatch || userMatch || roleMatch;
    });
  }

  /**
   * Obtém ou inicializa uma conversa entre dois usuários registrados.
   */
  public async getOrCreateConversation(
    currentUser: UserProfile,
    targetUser: UserProfile | { uid: string; displayName: string; username: string; photoURL?: string; role?: string; email?: string }
  ): Promise<UserChatConversation> {
    const chatId = this.getConversationId(currentUser.uid, targetUser.uid);
    const db = getDbSafe();
    const now = new Date().toISOString();

    const participantDetails: UserChatConversation['participantDetails'] = {
      [currentUser.uid]: {
        uid: currentUser.uid,
        username: currentUser.username || currentUser.displayName || 'Editor',
        displayName: currentUser.displayName || currentUser.username || 'Editor',
        photoURL: currentUser.photoURL || undefined,
        role: currentUser.role || 'leitor',
        email: currentUser.email || undefined,
      },
      [targetUser.uid]: {
        uid: targetUser.uid,
        username: targetUser.username || targetUser.displayName || 'Usuário',
        displayName: targetUser.displayName || targetUser.username || 'Usuário',
        photoURL: targetUser.photoURL || undefined,
        role: targetUser.role || 'leitor',
        email: targetUser.email || undefined,
      },
    };

    const newConv: UserChatConversation = {
      id: chatId,
      participants: [currentUser.uid, targetUser.uid],
      participantDetails,
      unreadCounts: {
        [currentUser.uid]: 0,
        [targetUser.uid]: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    if (!db) {
      const local = getLocalConversations(currentUser.uid);
      const existing = local.find((c) => c.id === chatId);
      if (existing) return existing;
      local.unshift(newConv);
      saveLocalConversations(currentUser.uid, local);
      return newConv;
    }

    try {
      const chatDocRef = doc(db, 'user_chats', chatId);
      const snap = await getDoc(chatDocRef);
      if (snap.exists()) {
        return snap.data() as UserChatConversation;
      }
      await setDoc(chatDocRef, newConv);
      return newConv;
    } catch (err) {
      console.warn('[UserChatService] Erro ao obter/criar conversa no Firestore:', err);
      // Fallback local
      return newConv;
    }
  }

  /**
   * Assina em tempo real a lista de conversas do usuário atual no Firestore.
   */
  public subscribeToConversations(
    currentUid: string,
    onUpdate: (conversations: UserChatConversation[]) => void
  ): () => void {
    if (!currentUid) {
      onUpdate([]);
      return () => {};
    }

    // Carrega cache local imediatamente para exibição instantânea sem layout shift
    const initialLocal = getLocalConversations(currentUid);
    onUpdate(initialLocal);

    const db = getDbSafe();
    if (!db) {
      return () => {};
    }

    try {
      const chatsRef = collection(db, 'user_chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUid));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const remoteList: UserChatConversation[] = [];
          snap.forEach((d) => {
            const data = d.data() as UserChatConversation;
            remoteList.push(data);
          });

          // Ordena por data de atualização mais recente
          remoteList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

          saveLocalConversations(currentUid, remoteList);
          onUpdate(remoteList);
        },
        (error) => {
          console.warn('[UserChatService] Erro no listener de conversas:', error);
          // Continua exibindo dados do cache local
          onUpdate(getLocalConversations(currentUid));
        }
      );

      return unsub;
    } catch (e) {
      console.warn('[UserChatService] Falha ao iniciar subscribeToConversations:', e);
      return () => {};
    }
  }

  /**
   * Assina mensagens em tempo real de uma conversa específica.
   */
  public subscribeToMessages(
    chatId: string,
    onUpdate: (messages: UserChatMessage[]) => void
  ): () => void {
    if (!chatId) {
      onUpdate([]);
      return () => {};
    }

    // Exibe histórico local do cache imediatamente
    const initialLocal = getLocalMessages(chatId);
    onUpdate(initialLocal);

    const db = getDbSafe();
    if (!db) {
      return () => {};
    }

    try {
      const messagesRef = collection(db, 'user_chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(150));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const msgs: UserChatMessage[] = [];
          snap.forEach((d) => {
            const data = d.data() as UserChatMessage;
            msgs.push({
              ...data,
              id: d.id,
            });
          });

          saveLocalMessages(chatId, msgs);
          onUpdate(msgs);
        },
        (error) => {
          console.warn('[UserChatService] Erro no listener de mensagens:', error);
          onUpdate(getLocalMessages(chatId));
        }
      );

      return unsub;
    } catch (e) {
      console.warn('[UserChatService] Falha ao iniciar subscribeToMessages:', e);
      return () => {};
    }
  }

  /**
   * Envia uma mensagem em tempo real para a conversa entre os usuários.
   */
  public async sendMessage(
    chatId: string,
    sender: UserProfile,
    recipient: { uid: string; displayName: string; username: string; photoURL?: string; role?: string },
    text: string
  ): Promise<UserChatMessage> {
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error('A mensagem não pode estar vazia.');
    }

    const now = new Date().toISOString();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const messagePayload: UserChatMessage = {
      id: msgId,
      chatId,
      senderUid: sender.uid,
      senderName: sender.displayName || sender.username || 'Editor',
      senderPhoto: sender.photoURL || undefined,
      senderRole: sender.role || 'leitor',
      recipientUid: recipient.uid,
      text: cleanText,
      timestamp: now,
      status: 'sent',
      readBy: [sender.uid],
    };

    // 1. Atualização no cache local
    const localMsgs = getLocalMessages(chatId);
    localMsgs.push(messagePayload);
    saveLocalMessages(chatId, localMsgs);

    const db = getDbSafe();
    if (!db) {
      // Atualiza conversa local
      const localConvs = getLocalConversations(sender.uid);
      const conv = localConvs.find((c) => c.id === chatId);
      if (conv) {
        conv.lastMessage = {
          text: cleanText,
          senderUid: sender.uid,
          timestamp: now,
        };
        conv.updatedAt = now;
        saveLocalConversations(sender.uid, localConvs);
      }
      return messagePayload;
    }

    // 2. Gravação no Firestore
    try {
      const msgDocRef = doc(db, 'user_chats', chatId, 'messages', msgId);
      await setDoc(msgDocRef, messagePayload);

      // 3. Atualização do documento da conversa no Firestore
      const chatDocRef = doc(db, 'user_chats', chatId);
      const chatSnap = await getDoc(chatDocRef);

      const existingData = chatSnap.exists() ? (chatSnap.data() as UserChatConversation) : null;
      const currentRecipientUnread = existingData?.unreadCounts?.[recipient.uid] || 0;

      await setDoc(
        chatDocRef,
        {
          id: chatId,
          participants: [sender.uid, recipient.uid],
          lastMessage: {
            text: cleanText,
            senderUid: sender.uid,
            timestamp: now,
          },
          participantDetails: {
            [sender.uid]: {
              uid: sender.uid,
              username: sender.username || sender.displayName || 'Editor',
              displayName: sender.displayName || sender.username || 'Editor',
              photoURL: sender.photoURL || undefined,
              role: sender.role || 'leitor',
            },
            [recipient.uid]: {
              uid: recipient.uid,
              username: recipient.username || recipient.displayName || 'Usuário',
              displayName: recipient.displayName || recipient.username || 'Usuário',
              photoURL: recipient.photoURL || undefined,
              role: recipient.role || 'leitor',
            },
          },
          unreadCounts: {
            ...(existingData?.unreadCounts || {}),
            [sender.uid]: 0,
            [recipient.uid]: currentRecipientUnread + 1,
          },
          updatedAt: now,
        },
        { merge: true }
      );

      return messagePayload;
    } catch (error) {
      console.error('[UserChatService] Erro ao enviar mensagem:', error);
      return messagePayload;
    }
  }

  /**
   * Zera a contagem de mensagens não lidas para o usuário atual nesta conversa.
   */
  public async markChatAsRead(chatId: string, currentUid: string): Promise<void> {
    if (!chatId || !currentUid) return;

    // Zera localmente
    const localConvs = getLocalConversations(currentUid);
    const conv = localConvs.find((c) => c.id === chatId);
    if (conv && conv.unreadCounts) {
      conv.unreadCounts[currentUid] = 0;
      saveLocalConversations(currentUid, localConvs);
    }

    const db = getDbSafe();
    if (!db) return;

    try {
      const chatDocRef = doc(db, 'user_chats', chatId);
      await setDoc(
        chatDocRef,
        {
          unreadCounts: {
            [currentUid]: 0,
          },
        },
        { merge: true }
      );
    } catch (e) {
      // Erro silencioso em leitura
    }
  }

  /**
   * Adiciona reação com emoji a uma mensagem.
   */
  public async toggleMessageReaction(
    chatId: string,
    messageId: string,
    emoji: string,
    userUid: string
  ): Promise<void> {
    const db = getDbSafe();
    const localMsgs = getLocalMessages(chatId);
    const msg = localMsgs.find((m) => m.id === messageId);
    if (msg) {
      msg.reactions = msg.reactions || {};
      const usersList = msg.reactions[emoji] || [];
      if (usersList.includes(userUid)) {
        msg.reactions[emoji] = usersList.filter((u) => u !== userUid);
      } else {
        msg.reactions[emoji] = [...usersList, userUid];
      }
      saveLocalMessages(chatId, localMsgs);
    }

    if (!db) return;

    try {
      const msgDocRef = doc(db, 'user_chats', chatId, 'messages', messageId);
      const snap = await getDoc(msgDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserChatMessage;
        const currentReactions = data.reactions || {};
        const currentList = currentReactions[emoji] || [];
        let updatedList: string[];
        if (currentList.includes(userUid)) {
          updatedList = currentList.filter((u) => u !== userUid);
        } else {
          updatedList = [...currentList, userUid];
        }

        await updateDoc(msgDocRef, {
          [`reactions.${emoji}`]: updatedList,
        });
      }
    } catch (e) {
      console.warn('[UserChatService] Erro ao reagir com emoji:', e);
    }
  }
}
