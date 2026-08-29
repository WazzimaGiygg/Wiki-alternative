import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { WikiPage, WikiArticle, UserProfile, NotificationItem, CookieConsent, RecentChangeEntry } from '../types';
import { INITIAL_PAGES, INITIAL_ARTICLES, INITIAL_NOTIFICATIONS } from '../data/seedData';

// Configuração original do projeto
export const firebaseConfig = {
  apiKey: "AIzaSyB9GkSqTIZ0kbVsba_WOdQeVAETrF9qna0",
  authDomain: "wzzm-ce3fc.firebaseapp.com",
  projectId: "wzzm-ce3fc",
  storageBucket: "wzzm-ce3fc.appspot.com",
  messagingSenderId: "249427877153",
  appId: "1:249427877153:web:0e4297294794a5aadeb260",
};

let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let firebaseActive = false;

try {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  firebaseActive = true;
} catch (e) {
  console.warn('Firebase initialized in offline/local storage fallback mode', e);
}

const STORAGE_KEYS = {
  PAGES: 'wikizero_pages_v3',
  ARTICLES: 'wikizero_articles_v3',
  USER: 'wikizero_user_v3',
  NOTIFICATIONS: 'wikizero_notifs_v3',
  CONSENT: 'wikizero_cookie_consent_v3',
  LGPD_TERMS: 'wikizero_lgpd_accepted_v3',
  DRAFT: 'wikizero_editor_draft_v3',
  THEME: 'wikizero_theme_v3',
  RECENT_CHANGES: 'wikizero_recent_changes_v3',
};

// Seed LocalStorage if empty
function initializeLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.PAGES)) {
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(INITIAL_PAGES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ARTICLES)) {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(INITIAL_ARTICLES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
}

initializeLocalStorage();

export const StorageService = {
  // === PAGES / TOPICS ===
  async getPages(): Promise<WikiPage[]> {
    initializeLocalStorage();
    const localPages: WikiPage[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGES) || '[]');
    const articles = await this.getArticles();

    // Recompute article counts
    const updated = localPages.map((page) => ({
      ...page,
      articleCount: articles.filter((a) => a.pageUid === page.uid).length,
    }));

    return updated;
  },

  async getPage(uid: string): Promise<WikiPage | null> {
    const pages = await this.getPages();
    return pages.find((p) => p.uid.toLowerCase() === uid.toLowerCase()) || null;
  },

  async createPage(page: Omit<WikiPage, 'criadoEm' | 'articleCount'>): Promise<WikiPage> {
    const pages = await this.getPages();
    const newPage: WikiPage = {
      ...page,
      criadoEm: new Date().toISOString(),
      articleCount: 0,
      status: 'ativo',
    };

    pages.unshift(newPage);
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'documentos', newPage.uid), {
          titulo: newPage.titulo,
          descricao: newPage.descricao,
          categoria: newPage.categoria,
          criadoEm: serverTimestamp(),
          status: 'ativo',
          uid: newPage.uid,
          nome: `Coleção ${newPage.uid}`,
        });
      } catch (err) {
        console.warn('Firestore createPage background sync error:', err);
      }
    }

    return newPage;
  },

  // === ARTICLES ===
  async getArticles(): Promise<WikiArticle[]> {
    initializeLocalStorage();
    const articles: WikiArticle[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTICLES) || '[]');
    return articles;
  },

  async getArticlesByPage(pageUid: string): Promise<WikiArticle[]> {
    const articles = await this.getArticles();
    return articles.filter((a) => a.pageUid.toLowerCase() === pageUid.toLowerCase());
  },

  async getArticle(id: string): Promise<WikiArticle | null> {
    const articles = await this.getArticles();
    return articles.find((a) => a.id === id) || null;
  },

  async getArticleByTitle(title: string): Promise<WikiArticle | null> {
    const articles = await this.getArticles();
    return articles.find((a) => a.titulo.toLowerCase() === title.toLowerCase()) || null;
  },

  async saveArticle(
    articleData: Partial<WikiArticle> & { titulo: string; pageUid: string; descricao: string },
    user?: UserProfile | null,
    editSummary?: string
  ): Promise<WikiArticle> {
    const articles = await this.getArticles();
    const now = new Date().toISOString();

    let article: WikiArticle;
    const existingIndex = articles.findIndex((a) => a.id === articleData.id);

    if (existingIndex >= 0) {
      // Update existing
      const existing = articles[existingIndex];
      const newVersion = (existing.versao || 1) + 1;
      const historyItem = {
        id: `h-${Date.now()}`,
        data: now,
        autor: user?.displayName || user?.email || 'Anônimo',
        autorEmail: user?.email,
        resumo: editSummary || 'Edição no artigo',
        tamanho: articleData.descricao.length,
      };

      article = {
        ...existing,
        ...articleData,
        dataEdicao: now,
        versao: newVersion,
        historico: [historyItem, ...(existing.historico || [])],
      };
      articles[existingIndex] = article;
    } else {
      // Create new
      const id = articleData.id || `art-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const historyItem = {
        id: `h-${Date.now()}`,
        data: now,
        autor: user?.displayName || user?.email || 'Autor Original',
        autorEmail: user?.email,
        resumo: editSummary || 'Criação do artigo',
        tamanho: articleData.descricao.length,
      };

      article = {
        id,
        pageUid: articleData.pageUid,
        titulo: articleData.titulo,
        descricao: articleData.descricao,
        resumo: articleData.resumo || articleData.descricao.slice(0, 140) + '...',
        categoria: articleData.categoria || 'Geral',
        idioma: articleData.idioma || 'Português',
        autor: user?.displayName || 'Colaborador WikiZero',
        autorEmail: user?.email,
        autorUid: user?.uid,
        dataCriacao: now,
        dataEdicao: now,
        visualizacoes: 1,
        versao: 1,
        tags: articleData.tags || [],
        historico: [historyItem],
      };
      articles.unshift(article);
    }

    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));

    // Try Firestore sync if available
    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'documentos', article.pageUid, 'inevitavel', article.id), {
          titulo: article.titulo,
          descricao: article.descricao,
          resumo: article.resumo,
          categoria: article.categoria,
          idioma: article.idioma,
          autor: article.autor,
          autorUid: article.autorUid || 'anon',
          atualizadoEm: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore saveArticle sync error:', err);
      }
    }

    return article;
  },

  async deleteArticle(id: string): Promise<boolean> {
    const articles = await this.getArticles();
    const article = articles.find((a) => a.id === id);
    const filtered = articles.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(filtered));

    if (firebaseActive && db && article) {
      try {
        await deleteDoc(doc(db, 'documentos', article.pageUid, 'inevitavel', article.id));
      } catch (e) {
        console.warn('Firestore delete sync error:', e);
      }
    }
    return true;
  },

  async incrementArticleViews(id: string) {
    const articles = await this.getArticles();
    const art = articles.find((a) => a.id === id);
    if (art) {
      art.visualizacoes = (art.visualizacoes || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    }
  },

  // === USER AUTH & BAN CHECK ===
  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  createGuestUser(): UserProfile {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    const guest: UserProfile = {
      uid: guestId,
      email: `${guestId}@convidado.wikizero.com`,
      displayName: `Convidado (${guestId.substring(6, 10)})`,
      isGuest: true,
      isBanned: false,
      role: 'convidado',
      createdAt: new Date().toISOString(),
    };
    this.saveUser(guest);
    return guest;
  },

  async loginWithGoogle(): Promise<UserProfile> {
    if (!auth) {
      throw new Error('Firebase Auth não inicializado');
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const u = result.user;

    const userProfile: UserProfile = {
      uid: u.uid,
      email: u.email || '',
      displayName: u.displayName || u.email?.split('@')[0] || 'Usuário WikiZero',
      photoURL: u.photoURL || undefined,
      isGuest: false,
      isBanned: false,
      role: 'editor',
      createdAt: new Date().toISOString(),
    };

    // Check ban list
    const isBanned = await this.checkIfUserIsBanned(u.uid);
    if (isBanned) {
      userProfile.isBanned = true;
      userProfile.banReason = 'Violação das políticas de uso da comunidade WikiZero.';
    }

    this.saveUser(userProfile);
    return userProfile;
  },

  async logout(): Promise<void> {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Signout error', err);
      }
    }
    this.clearUser();
  },

  async checkIfUserIsBanned(uid: string): Promise<boolean> {
    // Simulated check or firestore query
    if (uid === 'banned_test_user') return true;
    if (firebaseActive && db) {
      try {
        const banDoc = await getDoc(doc(db, 'banned_users', uid));
        return banDoc.exists();
      } catch {
        return false;
      }
    }
    return false;
  },

  // === NOTIFICATIONS ===
  getNotifications(): NotificationItem[] {
    initializeLocalStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
  },

  markNotificationsAsRead(): NotificationItem[] {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    return list;
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'date' | 'read'>): NotificationItem[] {
    const list = this.getNotifications();
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      date: 'Agora',
      read: false,
    };
    const updated = [item, ...list];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  },

  // === COOKIES & LGPD ===
  getCookieConsent(): CookieConsent | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSENT);
    return raw ? JSON.parse(raw) : null;
  },

  saveCookieConsent(consent: Omit<CookieConsent, 'timestamp' | 'version'>): CookieConsent {
    const fullConsent: CookieConsent = {
      ...consent,
      timestamp: new Date().toISOString(),
      version: '2.0',
    };
    localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(fullConsent));
    return fullConsent;
  },

  isLgpdTermsAccepted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.LGPD_TERMS) === 'true';
  },

  saveLgpdTermsAccepted(birthdate?: string) {
    localStorage.setItem(STORAGE_KEYS.LGPD_TERMS, 'true');
    const user = this.getCurrentUser();
    if (user) {
      user.dataConsentimento = new Date().toISOString();
      user.birthdate = birthdate;
      this.saveUser(user);
    }
  },

  revokeConsent() {
    localStorage.removeItem(STORAGE_KEYS.LGPD_TERMS);
    localStorage.removeItem(STORAGE_KEYS.CONSENT);
  },

  // === EDITOR DRAFTS ===
  getDraft(): { title: string; content: string; pageUid: string } | null {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
    return raw ? JSON.parse(raw) : null;
  },

  saveDraft(draft: { title: string; content: string; pageUid: string }) {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify({ ...draft, savedAt: Date.now() }));
  },

  clearDraft() {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  },

  // === RECENT CHANGES (MUDANÇAS RECENTES) ===
  async getRecentChanges(): Promise<RecentChangeEntry[]> {
    initializeLocalStorage();
    const articles = await this.getArticles();
    const pages = await this.getPages();
    const pageMap = new Map(pages.map((p) => [p.uid, p.titulo]));

    const entries: RecentChangeEntry[] = [];

    // Custom logged changes
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEYS.RECENT_CHANGES);
      if (rawCustom) {
        const customList: RecentChangeEntry[] = JSON.parse(rawCustom);
        entries.push(...customList);
      }
    } catch (e) {
      console.warn('Error reading custom recent changes:', e);
    }

    // Compile from articles & their history items
    articles.forEach((art) => {
      if (art.historico && art.historico.length > 0) {
        // history is usually sorted latest first
        for (let i = 0; i < art.historico.length; i++) {
          const item = art.historico[i];
          const prevItem = art.historico[i + 1]; // older version
          const deltaBytes = prevItem ? item.tamanho - prevItem.tamanho : item.tamanho;
          const isCreation = !prevItem || i === art.historico.length - 1;
          const isMinor =
            !isCreation &&
            (item.resumo.toLowerCase().includes('menor') ||
              item.resumo.toLowerCase().includes('ajuste') ||
              item.resumo.toLowerCase().includes('ortograf') ||
              Math.abs(deltaBytes) <= 20);

          entries.push({
            id: `rc-${art.id}-${item.id || i}`,
            type: isCreation ? 'new_article' : isMinor ? 'minor_edit' : 'edit_article',
            articleId: art.id,
            articleTitle: art.titulo,
            pageUid: art.pageUid,
            pageTitle: pageMap.get(art.pageUid) || art.pageUid,
            autor: item.autor || art.autor || 'Colaborador',
            autorEmail: item.autorEmail || art.autorEmail,
            data: item.data || art.dataEdicao || art.dataCriacao,
            resumo: item.resumo || (isCreation ? 'Criação do artigo' : 'Edição no artigo'),
            tamanho: item.tamanho || (art.descricao ? art.descricao.length : 0),
            deltaBytes,
            versao: art.historico.length - i,
            idioma: art.idioma || 'pt',
            isMinor,
            isBot: item.autor?.toLowerCase().includes('bot'),
          });
        }
      } else {
        // Article without detailed history array
        const descLength = art.descricao ? art.descricao.length : 0;
        entries.push({
          id: `rc-${art.id}-init`,
          type: 'new_article',
          articleId: art.id,
          articleTitle: art.titulo,
          pageUid: art.pageUid,
          pageTitle: pageMap.get(art.pageUid) || art.pageUid,
          autor: art.autor || 'Colaborador',
          autorEmail: art.autorEmail,
          data: art.dataCriacao,
          resumo: 'Criação do artigo',
          tamanho: descLength,
          deltaBytes: descLength,
          versao: art.versao || 1,
          idioma: art.idioma || 'pt',
          isMinor: false,
          isBot: art.autor?.toLowerCase().includes('bot'),
        });
      }
    });

    // Add page collections creations
    pages.forEach((p) => {
      entries.push({
        id: `rc-page-${p.uid}`,
        type: 'new_collection',
        articleTitle: p.titulo,
        pageUid: p.uid,
        pageTitle: p.titulo,
        autor: p.autor || 'Admin',
        data: p.criadoEm,
        resumo: `Nova coleção criada: ${p.descricao.slice(0, 70)}...`,
        tamanho: p.descricao.length,
        deltaBytes: p.descricao.length,
        versao: 1,
        isMinor: false,
      });
    });

    // Deduplicate by ID
    const uniqueMap = new Map<string, RecentChangeEntry>();
    entries.forEach((e) => {
      if (!uniqueMap.has(e.id)) {
        uniqueMap.set(e.id, e);
      }
    });

    // Sort descending by date
    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  },

  recordRecentChange(entry: Omit<RecentChangeEntry, 'id' | 'data'>): RecentChangeEntry {
    const fullEntry: RecentChangeEntry = {
      ...entry,
      id: `rc-live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENT_CHANGES);
      const list: RecentChangeEntry[] = raw ? JSON.parse(raw) : [];
      list.unshift(fullEntry);
      // Keep last 200 entries
      localStorage.setItem(STORAGE_KEYS.RECENT_CHANGES, JSON.stringify(list.slice(0, 200)));
    } catch (e) {
      console.warn('Error recording recent change:', e);
    }

    return fullEntry;
  },
};
