/**
 * WikiWorldWeb - Native Push Notification Service (Service Worker Integration)
 * (Update 3.05 - Requisito 6)
 *
 * Utiliza a API de Notificações nativa do navegador e o Service Worker para:
 * 1. Alertar usuários sobre novos comentários em discussões (Talk Pages)
 * 2. Alertar usuários e revisores sobre edições pendentes de revisão
 * 3. Gerenciar permissões nativas ('granted', 'denied', 'default')
 * 4. Permitir testes imediatos e personalização das preferências do usuário
 */

import { StorageService } from './storageService';

export interface PushPreferences {
  enabled: boolean;
  notifyOnComments: boolean;
  notifyOnPendingEdits: boolean;
  notifyOnWatchlist: boolean;
  notifyOnDailyChecklist: boolean;
  sound: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  type?: 'comment' | 'pending_edit' | 'discussion' | 'edit' | 'system' | 'checklist';
  data?: Record<string, any>;
  requireInteraction?: boolean;
}

const STORAGE_KEY_PREFS = 'wikizero_push_notif_prefs_v1';

const DEFAULT_PREFS: PushPreferences = {
  enabled: true,
  notifyOnComments: true,
  notifyOnPendingEdits: true,
  notifyOnWatchlist: true,
  notifyOnDailyChecklist: true,
  sound: true,
};

let listeners: Array<(prefs: PushPreferences) => void> = [];

export class PushNotificationService {
  /**
   * Verifica se o navegador suporta a API nativa de Notificações
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window;
  }

  /**
   * Verifica se há suporte completo com Service Worker
   */
  static isServiceWorkerSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  /**
   * Retorna o status atual da permissão de notificações do navegador
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Solicita permissão ao usuário para envio de notificações nativas
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';

    try {
      const permission = await Notification.requestPermission();

      // Se concedida, garante que o Service Worker de push está registrado
      if (permission === 'granted') {
        await this.ensureServiceWorkerRegistered();
      }

      return permission;
    } catch (err) {
      console.warn('[PushNotificationService] Falha ao solicitar permissão:', err);
      return 'denied';
    }
  }

  /**
   * Obtém as preferências locais de notificação push
   */
  static getPreferences(): PushPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (!raw) return DEFAULT_PREFS;
      return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PREFS;
    }
  }

  /**
   * Salva as preferências de notificação push
   */
  static savePreferences(prefs: Partial<PushPreferences>): PushPreferences {
    const current = this.getPreferences();
    const updated: PushPreferences = { ...current, ...prefs };
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
      listeners.forEach((fn) => fn(updated));
    } catch (e) {
      console.warn('[PushNotificationService] Erro ao salvar preferências:', e);
    }
    return updated;
  }

  /**
   * Inscreve um ouvinte para alterações nas preferências
   */
  static subscribeToPreferences(callback: (prefs: PushPreferences) => void): () => void {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((fn) => fn !== callback);
    };
  }

  /**
   * Garante o registro do Service Worker responsável pelas notificações push
   */
  static async ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;

    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
      }
      return reg;
    } catch (err) {
      console.debug('[PushNotificationService] Registro do SW de push:', err);
      return null;
    }
  }

  /**
   * Envia uma notificação nativa através do Service Worker com fallback nativo
   */
  static async sendNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isSupported()) return false;

    const prefs = this.getPreferences();
    if (!prefs.enabled) return false;

    // Respeita filtro por tipo
    if ((payload.type === 'comment' || payload.type === 'discussion') && !prefs.notifyOnComments) {
      return false;
    }
    if ((payload.type === 'pending_edit' || payload.type === 'edit') && !prefs.notifyOnPendingEdits) {
      return false;
    }
    if (payload.type === 'checklist' && !prefs.notifyOnDailyChecklist) {
      return false;
    }

    if (this.getPermission() !== 'granted') {
      return false;
    }

    const title = payload.title || 'WikiWorldWeb';
    const notifOptions: NotificationOptions & { renotify?: boolean } = {
      body: payload.body || '',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/favicon.png',
      tag: payload.tag || `wiki-${Date.now()}`,
      renotify: true,
      requireInteraction: payload.requireInteraction ?? false,
      data: {
        url: payload.url || '/',
        type: payload.type || 'general',
        ...payload.data,
      },
    };

    // 1. Tenta acionar via Service Worker ativo (Melhor prática PWA)
    try {
      const reg = await this.ensureServiceWorkerRegistered();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notifOptions);
        this.syncToAppNotifications(payload);
        return true;
      }
    } catch (swErr) {
      console.debug('[PushNotificationService] Fallback de showNotification via SW:', swErr);
    }

    // 2. Se o Service Worker tiver um controlador ativo, envia via postMessage
    if (navigator.serviceWorker?.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title,
            ...notifOptions,
            type: payload.type,
            url: payload.url,
          },
        });
        this.syncToAppNotifications(payload);
        return true;
      } catch (postErr) {
        console.debug('[PushNotificationService] Fallback de postMessage:', postErr);
      }
    }

    // 3. Fallback nativo direto do navegador (new Notification)
    try {
      const notification = new Notification(title, notifOptions);
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (payload.url && payload.url !== '/') {
          window.location.href = payload.url;
        }
      };
      this.syncToAppNotifications(payload);
      return true;
    } catch (natErr) {
      console.warn('[PushNotificationService] Falha ao disparar Notification nativa:', natErr);
      return false;
    }
  }

  /**
   * Sincroniza a notificação com a central de notificações interna do usuário
   */
  private static syncToAppNotifications(payload: PushNotificationPayload): void {
    try {
      StorageService.addNotification({
        title: payload.title,
        message: payload.body,
        type: payload.type === 'pending_edit' ? 'edit' : payload.type === 'comment' ? 'info' : 'success',
        link: payload.url,
      });
    } catch (_) {}
  }

  /**
   * Alerta o usuário sobre um novo comentário em sua discussão
   * (Requisito 6 - Novos comentários em discussões)
   */
  static async notifyNewComment(params: {
    articleTitle: string;
    commenterName: string;
    threadTitle: string;
    commentSnippet: string;
    articleId?: string;
    threadId?: string;
    url?: string;
  }): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.notifyOnComments) return false;

    const shortSnippet =
      params.commentSnippet.length > 90
        ? params.commentSnippet.slice(0, 90) + '...'
        : params.commentSnippet;

    const targetUrl =
      params.url ||
      (params.articleId
        ? `/?uid=${encodeURIComponent(params.articleId)}&tab=talk`
        : '/');

    return this.sendNotification({
      title: `💬 Novo comentário em "${params.threadTitle || params.articleTitle}"`,
      body: `${params.commenterName}: "${shortSnippet}"`,
      type: 'comment',
      tag: `talk-${params.threadId || params.articleId || 'general'}`,
      url: targetUrl,
      data: {
        articleId: params.articleId,
        threadId: params.threadId,
      },
    });
  }

  /**
   * Alerta o usuário ou moderadores sobre edições pendentes de revisão
   * (Requisito 6 - Edições pendentes)
   */
  static async notifyPendingEdit(params: {
    articleTitle: string;
    editorName: string;
    summary?: string;
    articleId?: string;
    diffBytes?: number;
    url?: string;
  }): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.notifyOnPendingEdits) return false;

    const diffText =
      params.diffBytes !== undefined
        ? ` (${params.diffBytes >= 0 ? '+' : ''}${params.diffBytes} bytes)`
        : '';
    const summaryText = params.summary ? ` • "${params.summary}"` : '';

    const targetUrl =
      params.url ||
      (params.articleId
        ? `/?uid=${encodeURIComponent(params.articleId)}&tab=history`
        : '/');

    return this.sendNotification({
      title: `📝 Edição pendente de revisão: ${params.articleTitle}`,
      body: `${params.editorName} submeteu alterações no verbete${diffText}.${summaryText}`,
      type: 'pending_edit',
      tag: `pending-edit-${params.articleId || 'general'}`,
      url: targetUrl,
      data: {
        articleId: params.articleId,
      },
    });
  }

  /**
   * 3.05.3.c: Dispara alerta nativo do Checklist Diário de Pontos
   */
  static async sendDailyChecklistReminder(pendingTasks: string[] = []): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.notifyOnDailyChecklist) return false;

    const taskText = pendingTasks.length > 0
      ? `Pendentes: ${pendingTasks.slice(0, 2).join(', ')}${pendingTasks.length > 2 ? '...' : ''}`
      : 'Complete suas metas de login, edição e avaliação para acumular pontos no ranking mensal!';

    return this.sendNotification({
      title: '🎯 Checklist Diário Disponível - WikiZero',
      body: `Você possui metas de pontos disponíveis hoje! ${taskText}`,
      type: 'checklist',
      tag: 'daily-checklist-reminder',
      url: '/?tab=checklist',
      requireInteraction: false,
    });
  }

  /**
   * 3.05.3.c: Dispara alerta nativo de pontos acumulados no checklist
   */
  static async sendChecklistPointsEarned(points: number, reason: string): Promise<boolean> {
    const prefs = this.getPreferences();
    if (!prefs.enabled || !prefs.notifyOnDailyChecklist) return false;

    const formattedPoints = points >= 1 ? `+${points.toFixed(0)}` : `+${points.toFixed(2)}`;

    return this.sendNotification({
      title: `⭐ ${formattedPoints} Ponto(s) Conquistado(s)!`,
      body: `${reason}. Seus pontos foram somados ao seu total mensal acumulado!`,
      type: 'checklist',
      tag: `checklist-points-${Date.now()}`,
      url: '/?tab=checklist',
      requireInteraction: false,
    });
  }

  /**
   * Dispara uma notificação de teste push via Service Worker para validação imediata
   */
  static async sendTestNotification(): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Seu navegador não oferece suporte nativo à API de Notificações.');
      return false;
    }

    if (this.getPermission() !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        alert(
          'Permissão de notificações não concedida. Por favor, habilite as notificações nas configurações do seu navegador para a WikiWorldWeb.'
        );
        return false;
      }
    }

    return this.sendNotification({
      title: '🔔 Teste de Notificação Push - WikiWorldWeb',
      body: 'O Service Worker está operando perfeitamente! Você receberá alertas em tempo real sobre novos comentários em discussões e edições pendentes.',
      type: 'system',
      tag: 'test-push-notification',
      url: '/',
      requireInteraction: false,
    });
  }
}
