import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import { ExtensionManager } from './core/ExtensionManager';
import { StorageService } from './services/storageService';
import './index.css';
import './print.css';

// Inicializa o carregamento dinâmico das extensões do WikiZero
ExtensionManager.getInstance().loadExtensionsFromGlob().catch((err) => {
  console.error('[WikiZero] Falha ao carregar extensões:', err);
});

/**
 * Exibe um banner/toast elegante e não-intrusivo informando ao usuário que uma nova versão
 * da WikiZero está pronta e permite aplicar a atualização imediatamente.
 */
function showUpdateNotificationToast(onApplyUpdate: () => void): void {
  if (typeof document === 'undefined') return;

  const TOAST_ID = 'wikizero-sw-update-toast';
  if (document.getElementById(TOAST_ID)) return; // Evita duplicação

  // Registra no sistema de notificações do usuário para visualização também no sino do cabeçalho
  try {
    StorageService.addNotification({
      title: '🚀 Nova Versão da WikiZero Disponível!',
      message: 'Uma atualização foi baixada e está pronta para uso. Clique em Atualizar para reiniciar e aplicar.',
      type: 'info',
      link: 'site-updates',
    });
  } catch (err) {
    console.warn('[WikiZero SW] Aviso ao registrar notificação no StorageService:', err);
  }

  // Notifica a aplicação React caso outros componentes desejem reagir
  try {
    window.dispatchEvent(
      new CustomEvent('wikizero:sw-update-available', {
        detail: { applyUpdate: onApplyUpdate },
      })
    );
  } catch (_) {}

  // Criação do elemento visual de notificação flutuante
  const container = document.createElement('div');
  container.id = TOAST_ID;
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'assertive');
  container.className =
    'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] max-w-sm w-[calc(100vw-2rem)] sm:w-96 ' +
    'bg-slate-900/95 text-white border border-blue-500/40 rounded-2xl shadow-2xl p-4 ' +
    'backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans select-none';

  container.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #1d4ed8); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(37,99,235,0.4);">
        <span style="font-size: 20px;">🚀</span>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(59,130,246,0.2); color: #93c5fd; border: 1px solid rgba(147,197,253,0.3); padding: 2px 6px; border-radius: 6px;">
            Atualização Pronta
          </span>
          <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">WikiZero v3.05</span>
        </div>
        <h4 style="font-size: 14px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0; line-height: 1.3;">
          Nova versão da WikiZero disponível!
        </h4>
        <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 12px 0; line-height: 1.4;">
          Uma nova versão da enciclopédia foi baixada em segundo plano. Deseja reiniciar agora para aplicar as novidades e correções?
        </p>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="wikizero-sw-btn-update" style="flex: 1; background: #2563eb; hover:background: #1d4ed8; color: #ffffff; border: none; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(37,99,235,0.3); transition: all 0.2s;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            Atualizar Agora
          </button>
          <button id="wikizero-sw-btn-dismiss" style="background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
            Mais tarde
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Ações dos botões
  const btnUpdate = container.querySelector('#wikizero-sw-btn-update');
  const btnDismiss = container.querySelector('#wikizero-sw-btn-dismiss');

  btnUpdate?.addEventListener('click', () => {
    if (btnUpdate instanceof HTMLButtonElement) {
      btnUpdate.disabled = true;
      btnUpdate.innerText = 'Atualizando...';
    }
    onApplyUpdate();
  });

  btnDismiss?.addEventListener('click', () => {
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';
    container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(() => {
      container.remove();
    }, 200);
  });
}

/**
 * Monitoramento completo do ciclo de vida do Service Worker (PWA)
 * Notifica proativamente o usuário quando houver novas versões prontas para ativação.
 */
function setupServiceWorkerUpdateMonitoring(): void {
  if (typeof window === 'undefined') return;

  // 1. Registro inteligente e monitoramento via vite-plugin-pwa
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.info('[WikiZero SW] 🔔 Nova versão da WikiZero pronta para instalação!');
        showUpdateNotificationToast(() => {
          updateSW(true);
        });
      },
      onOfflineReady() {
        console.info('[WikiZero SW] ✅ WikiZero cacheada e pronta para navegação offline.');
      },
      onRegisteredSW(swScriptUrl, registration) {
        console.info('[WikiZero SW] Service Worker registrado:', swScriptUrl);
        if (registration) {
          // Checagem periódica a cada 45 minutos enquanto o usuário utiliza a aplicação
          setInterval(() => {
            registration
              .update()
              .catch((err) => console.debug('[WikiZero SW] Checagem periódica de atualização:', err));
          }, 45 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.warn('[WikiZero SW] Erro ao registrar Service Worker:', error);
      },
    });
  } catch (err) {
    console.warn('[WikiZero SW] Aviso na inicialização do registerSW virtual:', err);
  }

  // 2. Monitoramento nativo via navigator.serviceWorker para capturar atualizações em segundo plano
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) return;

        // Caso já exista uma versão baixada esperando ativação (waiting)
        if (registration.waiting) {
          console.info('[WikiZero SW] Versão prévia aguardando ativação no Service Worker.');
          showUpdateNotificationToast(() => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            window.location.reload();
          });
        }

        // Monitora quando uma nova versão começar a ser baixada e for instalada
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            // Se foi instalada e já existia um controlador ativo, uma nova versão está disponível!
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[WikiZero SW] Nova versão da WikiZero instalada em segundo plano!');
              showUpdateNotificationToast(() => {
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              });
            }
          });
        });
      })
      .catch((err) => {
        console.debug('[WikiZero SW] Falha ao inspecionar registro de Service Worker nativo:', err);
      });

    // Atualização sob demanda quando a página recuperar foco ou conexão de rede
    window.addEventListener('online', () => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
      }
    });

    // Recarrega automaticamente caso o controller seja atualizado por skipWaiting
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.info('[WikiZero SW] Controlador atualizado. Recarregando para aplicar nova versão...');
        window.location.reload();
      }
    });
  }
}

// Inicializa o monitoramento do Service Worker
setupServiceWorkerUpdateMonitoring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
