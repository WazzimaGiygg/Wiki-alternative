import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, ALL_LANGUAGES, DEFAULT_LANGUAGE, getLanguageByCode } from '../utils/languages';
import { TranslationKey, getTranslation } from '../utils/translations';
import { ExtensionManager } from '../core/ExtensionManager';
import {
  universalI18nService,
  UniversalTranslationState,
} from '../services/universalI18nService';
import { WikiArticle, WikiPage } from '../types';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language | string) => void;
  t: (key: TranslationKey) => string;
  allLanguages: Language[];
  isRTL: boolean;
  // 3.05.10.a: Suporte i18n para tradução universal de todas as páginas e toda a Wiki-Site
  isUniversalTranslationActive: boolean;
  showOriginal: boolean;
  toggleShowOriginal: (showOriginal?: boolean) => void;
  translateText: (text: string, targetLang?: string) => string;
  translateArticle: (article: WikiArticle, targetLang?: string) => WikiArticle;
  translateArticleOnlineAsync: (article: WikiArticle, targetLang?: string) => Promise<WikiArticle>;
  translatePage: (page: WikiPage, targetLang?: string) => WikiPage;
  translateArticlesList: (articles: WikiArticle[], targetLang?: string) => WikiArticle[];
  translatePagesList: (pages: WikiPage[], targetLang?: string) => WikiPage[];
  universalState: UniversalTranslationState;
  setAutoTranslate: (enabled: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  allLanguages: ALL_LANGUAGES,
  isRTL: false,
  isUniversalTranslationActive: false,
  showOriginal: false,
  toggleShowOriginal: () => {},
  translateText: (text) => text,
  translateArticle: (art) => art,
  translateArticleOnlineAsync: async (art) => art,
  translatePage: (page) => page,
  translateArticlesList: (arts) => arts,
  translatePagesList: (pages) => pages,
  universalState: universalI18nService.getState(),
  setAutoTranslate: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(() => {
    try {
      const hooks = ExtensionManager.getInstance().getHooks();
      const defaultCode = hooks.applyFilters<string>('i18n:default_language', 'pt');
      const forceDefault = hooks.applyFilters<boolean>('i18n:force_default', false);
      const allowOverride = hooks.applyFilters<boolean>('i18n:allow_user_override', true);

      const saved = localStorage.getItem('wikizero_language');
      if (saved && allowOverride && !forceDefault) {
        return getLanguageByCode(saved);
      }
      if (forceDefault && defaultCode) {
        return getLanguageByCode(defaultCode);
      }
      if (saved && allowOverride) {
        return getLanguageByCode(saved);
      }
      // Check browser language or configured default
      const browserLang = navigator.language || navigator.languages?.[0] || defaultCode;
      return getLanguageByCode(browserLang);
    } catch (_) {
      const saved = localStorage.getItem('wikizero_language');
      return saved ? getLanguageByCode(saved) : DEFAULT_LANGUAGE;
    }
  });

  // Escuta alterações de configurações de extensões em tempo real (ex.: Burocrata mudou idioma padrão)
  useEffect(() => {
    const extensionManager = ExtensionManager.getInstance();
    const handleExtensionChange = () => {
      try {
        const hooks = extensionManager.getHooks();
        const defaultCode = hooks.applyFilters<string>('i18n:default_language', 'pt');
        const forceDefault = hooks.applyFilters<boolean>('i18n:force_default', false);
        const allowOverride = hooks.applyFilters<boolean>('i18n:allow_user_override', true);
        const saved = localStorage.getItem('wikizero_language');

        if (forceDefault || (!allowOverride && saved !== defaultCode)) {
          const newLang = getLanguageByCode(defaultCode);
          setCurrentLanguageState(newLang);
          localStorage.setItem('wikizero_language', newLang.code);
          document.documentElement.lang = newLang.code;
          document.documentElement.dir = newLang.dir || 'ltr';
        }
      } catch (e) {
        console.warn('[WikiZero i18n] Erro ao sincronizar idioma com ExtensionManager:', e);
      }
    };

    const unsubscribe = extensionManager.subscribe(handleExtensionChange);
    return () => unsubscribe();
  }, []);

  const setLanguage = (lang: Language | string) => {
    try {
      const hooks = ExtensionManager.getInstance().getHooks();
      const allowOverride = hooks.applyFilters<boolean>('i18n:allow_user_override', true);
      const defaultCode = hooks.applyFilters<string>('i18n:default_language', 'pt');

      const targetLang = typeof lang === 'string' ? getLanguageByCode(lang) : lang;

      if (!allowOverride && targetLang.code !== defaultCode) {
        console.warn('[WikiZero i18n] Alteração de idioma bloqueada pelo Burocrata.');
        return;
      }

      setCurrentLanguageState(targetLang);
      localStorage.setItem('wikizero_language', targetLang.code);

      // Update document HTML attributes
      document.documentElement.lang = targetLang.code;
      document.documentElement.dir = targetLang.dir || 'ltr';
    } catch (_) {
      const targetLang = typeof lang === 'string' ? getLanguageByCode(lang) : lang;
      setCurrentLanguageState(targetLang);
      localStorage.setItem('wikizero_language', targetLang.code);
    }
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage.code;
    document.documentElement.dir = currentLanguage.dir || 'ltr';
  }, [currentLanguage]);

  const t = (key: TranslationKey): string => {
    return getTranslation(key, currentLanguage.code);
  };

  const [universalState, setUniversalState] = useState<UniversalTranslationState>(() =>
    universalI18nService.getState()
  );

  useEffect(() => {
    universalI18nService.setTargetLanguage(currentLanguage.code);
    const unsub = universalI18nService.subscribe((st) => {
      setUniversalState({ ...st });
    });
    return () => unsub();
  }, [currentLanguage]);

  const toggleShowOriginal = (showOriginal?: boolean) => {
    universalI18nService.toggleShowOriginal(showOriginal);
  };

  const setAutoTranslate = (enabled: boolean) => {
    universalI18nService.setAutoTranslate(enabled);
  };

  const translateText = (text: string, targetLang?: string): string => {
    return universalI18nService.translateText(text, targetLang || currentLanguage.code);
  };

  const translateArticle = (article: WikiArticle, targetLang?: string): WikiArticle => {
    return universalI18nService.translateArticle(article, targetLang || currentLanguage.code);
  };

  const translateArticleOnlineAsync = async (article: WikiArticle, targetLang?: string): Promise<WikiArticle> => {
    return universalI18nService.translateArticleOnlineAsync(article, targetLang || currentLanguage.code);
  };

  const translatePage = (page: WikiPage, targetLang?: string): WikiPage => {
    return universalI18nService.translatePage(page, targetLang || currentLanguage.code);
  };

  const translateArticlesList = (articles: WikiArticle[], targetLang?: string): WikiArticle[] => {
    return universalI18nService.translateArticlesList(articles, targetLang || currentLanguage.code);
  };

  const translatePagesList = (pages: WikiPage[], targetLang?: string): WikiPage[] => {
    return universalI18nService.translatePagesList(pages, targetLang || currentLanguage.code);
  };

  const isRTL = currentLanguage.dir === 'rtl';

  const isUniversalTranslationActive =
    currentLanguage.code !== 'pt' && !universalState.showOriginal && universalState.autoTranslateAllPages;

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        allLanguages: ALL_LANGUAGES,
        isRTL,
        isUniversalTranslationActive,
        showOriginal: universalState.showOriginal,
        toggleShowOriginal,
        translateText,
        translateArticle,
        translateArticleOnlineAsync,
        translatePage,
        translateArticlesList,
        translatePagesList,
        universalState,
        setAutoTranslate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
