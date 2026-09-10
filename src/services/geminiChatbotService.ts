import { GeminiChatbotConfig, GeminiChatMessage } from '../types';
import { getDbSafe } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const DEFAULT_GEMINI_CHATBOT_CONFIG: GeminiChatbotConfig = {
  chatbotId: '0a14dc90-3ab3-47bc-8306-ca5bc2953699', // Google AI Studio Applet / Chatbot ID padrão
  enabled: true,
  displayName: 'Gemini Wiki Assistant (AI Studio)',
  model: 'gemini-3.8-flash',
  systemInstruction:
    'Você é o assistente oficial do Google AI Studio integrado à WikiZero. Auxilie os usuários na estruturação e redação de coleções temáticas e artigos enciclopédicos completos com neutralidade, verificabilidade, sintaxe Wikitext e clareza informativa.',
  allowArticleGeneration: true,
  allowCollectionGeneration: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Sistema WikiZero',
};

const LOCAL_STORAGE_KEY = 'wikizero_gemini_chatbot_config';

export class GeminiChatbotService {
  /**
   * Obtém as configurações atuais do Chatbot Gemini.
   * Tenta carregar do Firestore (coleção system_settings / gemini_chatbot)
   * e faz fallback no localStorage / defaults.
   */
  static async getConfig(): Promise<GeminiChatbotConfig> {
    try {
      const db = getDbSafe();
      if (db) {
        const configRef = doc(db, 'system_settings', 'gemini_chatbot');
        const snap = await getDoc(configRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<GeminiChatbotConfig>;
          const merged: GeminiChatbotConfig = {
            ...DEFAULT_GEMINI_CHATBOT_CONFIG,
            ...data,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (err) {
      console.warn('[GeminiChatbotService] Falha ao consultar Firestore para config:', err);
    }

    // Fallback: localStorage
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return {
          ...DEFAULT_GEMINI_CHATBOT_CONFIG,
          ...JSON.parse(cached),
        };
      }
    } catch (err) {
      console.warn('[GeminiChatbotService] Erro ao ler localStorage:', err);
    }

    return DEFAULT_GEMINI_CHATBOT_CONFIG;
  }

  /**
   * Salva as configurações do Chatbot (apenas para usuários administradores).
   */
  static async saveConfig(
    newConfig: Partial<GeminiChatbotConfig>,
    updatedByEmail: string = 'Administrador'
  ): Promise<GeminiChatbotConfig> {
    const current = await this.getConfig();
    const updated: GeminiChatbotConfig = {
      ...current,
      ...newConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByEmail,
    };

    // Salva localmente imediatamente
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Salva no Firestore
    try {
      const db = getDbSafe();
      if (db) {
        const configRef = doc(db, 'system_settings', 'gemini_chatbot');
        await setDoc(configRef, updated, { merge: true });
      }
    } catch (err) {
      console.error('[GeminiChatbotService] Erro ao persistir no Firestore:', err);
    }

    return updated;
  }

  /**
   * Verifica a conectividade com o backend Gemini da aplicação.
   */
  static async getStatus(): Promise<{
    status: string;
    hasApiKey: boolean;
    defaultModel: string;
    appletId: string;
  }> {
    try {
      const res = await fetch('/api/gemini/status');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      return {
        status: 'error',
        hasApiKey: false,
        defaultModel: 'gemini-3.8-flash',
        appletId: '0a14dc90-3ab3-47bc-8306-ca5bc2953699',
      };
    }
  }

  /**
   * Envia uma mensagem interativa ao Chatbot do Gemini AI Studio.
   */
  static async sendMessage(params: {
    message: string;
    history?: GeminiChatMessage[];
    context?: {
      mode: 'article' | 'collection' | 'general';
      currentArticle?: {
        titulo?: string;
        categoria?: string;
        pageUid?: string;
        contentPreview?: string;
      };
      currentCollection?: {
        titulo?: string;
        categoria?: string;
        uid?: string;
      };
    };
    configOverride?: Partial<GeminiChatbotConfig>;
  }): Promise<{ reply: string; suggestedData?: any }> {
    const config = await this.getConfig();
    const activeConfig = { ...config, ...params.configOverride };

    if (!activeConfig.enabled) {
      throw new Error('O assistente Chatbot do Gemini está desativado pelo administrador.');
    }

    const payload = {
      message: params.message,
      history: params.history || [],
      context: params.context || { mode: 'general' },
      chatbotId: activeConfig.chatbotId,
      customSystemInstruction: activeConfig.systemInstruction,
      model: activeConfig.model,
    };

    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na comunicação com o Gemini (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * Gera um artigo enciclopédico completo em Wikitext.
   */
  static async generateArticle(params: {
    topic: string;
    category?: string;
    keywords?: string;
    language?: string;
    userInstructions?: string;
  }): Promise<{
    title: string;
    wikitext: string;
    category: string;
    chatbotId: string;
  }> {
    const config = await this.getConfig();

    const payload = {
      topic: params.topic,
      category: params.category || 'Geral',
      keywords: params.keywords || '',
      language: params.language || 'Português',
      userInstructions: params.userInstructions || '',
      chatbotId: config.chatbotId,
    };

    const res = await fetch('/api/gemini/generate-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao gerar artigo com o Gemini.');
    }

    return await res.json();
  }

  /**
   * Gera estruturação completa de uma nova Coleção Temática (WikiPage).
   */
  static async generateCollection(params: {
    theme: string;
    userInstructions?: string;
  }): Promise<{
    collection: {
      titulo: string;
      uid: string;
      descricao: string;
      categoria: string;
      icon: string;
      tags: string[];
    };
    chatbotId: string;
  }> {
    const config = await this.getConfig();

    const payload = {
      theme: params.theme,
      userInstructions: params.userInstructions || '',
      chatbotId: config.chatbotId,
    };

    const res = await fetch('/api/gemini/generate-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao gerar coleção com o Gemini.');
    }

    return await res.json();
  }
}
