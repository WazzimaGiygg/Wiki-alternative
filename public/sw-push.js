/**
 * WikiWorldWeb - Service Worker Push Notification Handler
 * (Update 3.05 - Requisito 6)
 *
 * Gerencia notificações push nativas no Service Worker para alertar usuários sobre:
 * 1. Novos comentários em suas discussões (páginas de discussão / talk pages)
 * 2. Edições pendentes de revisão e propostas editoriais
 * 3. Ações interativas em notificações (abrir discussão, revisar edição, fechar)
 */

self.addEventListener('install', (event) => {
  // Ativação imediata do novo Service Worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Reivindica clientes imediatamente para controlar abas abertas
  event.waitUntil(self.clients.claim());
});

/**
 * Tratamento de eventos PUSH recebidos pelo Service Worker
 */
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'WikiWorldWeb - Notificação';
  const type = data.type || (data.data && data.data.type) || 'general';

  // Configuração de botões de ação com base no tipo de notificação
  let actions = [];
  if (type === 'comment' || type === 'discussion') {
    actions = [
      { action: 'open_discussion', title: '💬 Ver Discussão' },
      { action: 'dismiss', title: 'Dispensar' },
    ];
  } else if (type === 'pending_edit' || type === 'edit') {
    actions = [
      { action: 'view_edit', title: '📝 Revisar Edição' },
      { action: 'dismiss', title: 'Dispensar' },
    ];
  } else {
    actions = [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Fechar' },
    ];
  }

  const options = {
    body: data.body || data.message || 'Você possui uma nova atualização na WikiWorldWeb.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.png',
    tag: data.tag || `wiki-notif-${Date.now()}`,
    renotify: data.renotify !== false,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: data.timestamp || Date.now(),
    vibrate: [120, 80, 120],
    data: {
      url: data.url || data.link || '/',
      type: type,
      id: data.id || `push-${Date.now()}`,
      articleId: data.articleId,
      threadId: data.threadId,
      ...data.data,
    },
    actions: actions,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Tratamento de cliques em notificações nativas
 */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const notifData = notification.data || {};
  const targetUrl = notifData.url || '/';

  // Fecha a notificação imediatamente
  notification.close();

  // Ação de dispensar
  if (action === 'dismiss' || action === 'close') {
    return;
  }

  // Foco ou abertura de nova janela com direcionamento inteligente
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se houver uma aba existente da WikiWorldWeb aberta, traz para primeiro plano
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client && targetUrl && targetUrl !== '/') {
              client.navigate(targetUrl);
            }
            // Envia mensagem informando à aplicação sobre a notificação clicada
            client.postMessage({
              type: 'WIKI_NOTIFICATION_CLICKED',
              action: action,
              data: notifData,
            });
            return;
          }
        }

        // Se nenhuma janela estiver aberta, abre uma nova
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

/**
 * Fechamento de notificação pelo usuário
 */
self.addEventListener('notificationclose', (event) => {
  const notifData = event.notification.data || {};
  // Opcional: telemetria local de fechamento
});

/**
 * Comunicação direta da página web com o Service Worker
 * Permite que o frontend acione notificações nativas via registration.showNotification
 */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === 'SHOW_NOTIFICATION' && payload) {
    const title = payload.title || 'WikiWorldWeb - Notificação';
    const notifType = payload.type || 'general';

    let actions = [];
    if (notifType === 'comment' || notifType === 'discussion') {
      actions = [
        { action: 'open_discussion', title: '💬 Ver Discussão' },
        { action: 'dismiss', title: 'Dispensar' },
      ];
    } else if (notifType === 'pending_edit' || notifType === 'edit') {
      actions = [
        { action: 'view_edit', title: '📝 Revisar Edição' },
        { action: 'dismiss', title: 'Dispensar' },
      ];
    } else {
      actions = [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Fechar' },
      ];
    }

    const options = {
      body: payload.body || payload.message || '',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/favicon.png',
      tag: payload.tag || `wiki-sw-${Date.now()}`,
      renotify: payload.renotify !== false,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      timestamp: Date.now(),
      vibrate: [100, 50, 100],
      data: {
        url: payload.url || payload.link || '/',
        type: notifType,
        ...payload.data,
      },
      actions: actions,
    };

    self.registration
      .showNotification(title, options)
      .then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
      .catch((err) => {
        console.warn('[SW Push] Erro ao exibir notificação nativa:', err);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: String(err) });
        }
      });
  } else if (type === 'PING') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'PONG', version: '3.05.0', pushReady: true });
    }
  } else if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
