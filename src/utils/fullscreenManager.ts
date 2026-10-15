/**
 * Fullscreen Manager Utility for WikiZero (Requisito 3.05.8.b & 3.05.7.a)
 * 
 * Gerencia o modo de tela cheia para todo o Wiki-Site com suporte cross-browser
 * e sincronização de eventos com a UI e atalhos de teclado (F11).
 */

type FullscreenSubscriber = (isFullscreen: boolean) => void;

class FullscreenManager {
  private static instance: FullscreenManager;
  private subscribers: Set<FullscreenSubscriber> = new Set();
  private _isFullscreen: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this._isFullscreen = this.checkIsFullscreen();

      const handleChange = () => {
        const nextState = this.checkIsFullscreen();
        this._isFullscreen = nextState;
        this.notify();
      };

      document.addEventListener('fullscreenchange', handleChange);
      document.addEventListener('webkitfullscreenchange', handleChange);
      document.addEventListener('mozfullscreenchange', handleChange);
      document.addEventListener('MSFullscreenChange', handleChange);
    }
  }

  public static getInstance(): FullscreenManager {
    if (!FullscreenManager.instance) {
      FullscreenManager.instance = new FullscreenManager();
    }
    return FullscreenManager.instance;
  }

  private checkIsFullscreen(): boolean {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }

  public isFullscreen(): boolean {
    return this._isFullscreen;
  }

  public async enterFullscreen(): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    const el = document.documentElement as any;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      } else {
        return false;
      }
      this._isFullscreen = true;
      this.notify();
      return true;
    } catch (err) {
      console.warn('[FullscreenManager] Falha ao entrar em tela cheia:', err);
      return false;
    }
  }

  public async exitFullscreen(): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    const doc = document as any;

    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      } else {
        return false;
      }
      this._isFullscreen = false;
      this.notify();
      return true;
    } catch (err) {
      console.warn('[FullscreenManager] Falha ao sair da tela cheia:', err);
      return false;
    }
  }

  public async toggleFullscreen(): Promise<boolean> {
    if (this.isFullscreen()) {
      return this.exitFullscreen();
    } else {
      return this.enterFullscreen();
    }
  }

  public subscribe(callback: FullscreenSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this._isFullscreen);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(this._isFullscreen);
      } catch (e) {
        console.error('[FullscreenManager] Erro no callback de tela cheia:', e);
      }
    });
  }
}

export const fullscreenManager = FullscreenManager.getInstance();
