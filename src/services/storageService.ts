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
import {
  WikiPage,
  WikiArticle,
  UserProfile,
  NotificationItem,
  CookieConsent,
  RecentChangeEntry,
  TalkThread,
  TalkReply,
  ArticleRatingData,
  WatchlistItem,
} from '../types';
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
  TALK_THREADS: 'wikizero_talk_threads_v3',
  WATCHLIST: 'wikizero_watchlist_v3',
  RATINGS: 'wikizero_ratings_v3',
};

const INITIAL_TALK_THREADS: TalkThread[] = [
  {
    id: 'talk-metro-01',
    articleId: 'art-metro-01',
    titulo: 'Expansão da Linha 2-Verde até Penha e Dutra',
    autor: 'Metrofilo_SP',
    autorEmail: 'contato@metrosp.org',
    autorRole: 'editor',
    data: '2026-08-27T10:15:00Z',
    status: 'em_discussao',
    conteudo: 'Olá colegas editores! Proponho atualizarmos a seção sobre o avanço das obras do Tatuzão (tuneladora Cora Coralina) rumo à estação Penha da Linha 2-Verde com dados oficiais de 2026. Alguém possui o relatório mais recente da Companhia?',
    respostas: [
      {
        id: 'reply-1',
        autor: 'WazzimaGiygg',
        autorEmail: 'pedrohenriquecardonaperes@gmail.com',
        autorRole: 'admin',
        data: '2026-08-27T14:30:00Z',
        conteudo: 'Excelente iniciativa! Já localizei o relatório semestral de investimentos em infraestrutura. Vou estruturar uma subseção no artigo e citar as fontes em <ref>.',
        upvotes: 4,
      },
    ],
  },
  {
    id: 'talk-metro-02',
    articleId: 'art-metro-01',
    titulo: 'Padronização de referências bibliográficas do HMD',
    autor: 'Historiador_Transportes',
    autorRole: 'leitor',
    data: '2026-08-25T11:00:00Z',
    status: 'resolvido',
    conteudo: 'As menções ao consórcio alemão-brasileiro HMD (Hochtief-Montreal-Deconsult) de 1968 foram verificadas e devidamente creditadas conforme os arquivos da Biblioteca Nacional.',
    respostas: [],
  },
  {
    id: 'talk-wiki-01',
    articleId: 'art-wiki-01',
    titulo: 'Diretrizes de neutralidade e fontes secundárias',
    autor: 'WikiAdmin',
    autorEmail: 'admin@wikizero.org',
    autorRole: 'admin',
    data: '2026-08-28T09:00:00Z',
    status: 'consenso',
    conteudo: 'Lembramos a todos os contribuidores que os artigos da WikiZero devem seguir o princípio da verificabilidade e ponto de vista neutro (NPOV), similar aos pilares da Wikimedia Foundation.',
    respostas: [
      {
        id: 'reply-wiki-1',
        autor: 'Colaborador_Livre',
        autorRole: 'editor',
        data: '2026-08-28T10:45:00Z',
        conteudo: 'Concordo plenamente! Já inseri as predefinições de aviso editorial {{Aviso}} e {{Nota}} nos artigos principais.',
        upvotes: 6,
      },
    ],
  },
];

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
  if (!localStorage.getItem(STORAGE_KEYS.TALK_THREADS)) {
    localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify(INITIAL_TALK_THREADS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify([
      {
        articleId: 'art-metro-01',
        articleTitle: 'História do Metrô de São Paulo',
        pageUid: 'metro_sp',
        dataAdicionado: '2026-08-28T12:00:00Z',
      },
      {
        articleId: 'art-wiki-01',
        articleTitle: 'O que é a WikiZero?',
        pageUid: 'wikizero_info',
        dataAdicionado: '2026-08-28T12:00:00Z',
      },
    ]));
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
    editSummary?: string,
    isMinor?: boolean
  ): Promise<WikiArticle> {
    const articles = await this.getArticles();
    const now = new Date().toISOString();

    let article: WikiArticle;
    const existingIndex = articles.findIndex((a) => a.id === articleData.id);

    if (existingIndex >= 0) {
      // Update existing
      const existing = articles[existingIndex];
      const newVersion = (existing.versao || 1) + 1;
      const prevLength = existing.descricao ? existing.descricao.length : 0;
      const newLength = articleData.descricao.length;
      const deltaBytes = newLength - prevLength;

      const historyItem = {
        id: `h-${Date.now()}`,
        data: now,
        autor: user?.displayName || user?.email || 'Anônimo',
        autorEmail: user?.email,
        resumo: editSummary || 'Edição no artigo',
        tamanho: newLength,
        deltaBytes,
        versao: newVersion,
        isMinor: !!isMinor,
        conteudo: articleData.descricao,
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
      const newLength = articleData.descricao.length;
      const historyItem = {
        id: `h-${Date.now()}`,
        data: now,
        autor: user?.displayName || user?.email || 'Autor Original',
        autorEmail: user?.email,
        resumo: editSummary || 'Criação do artigo',
        tamanho: newLength,
        deltaBytes: newLength,
        versao: 1,
        isMinor: false,
        conteudo: articleData.descricao,
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

  // === TALK PAGES / PÁGINAS DE DISCUSSÃO ===
  getTalkThreads(articleId: string): TalkThread[] {
    initializeLocalStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
      const list: TalkThread[] = raw ? JSON.parse(raw) : [];
      return list.filter((t) => t.articleId === articleId);
    } catch (e) {
      console.warn('Error loading talk threads:', e);
      return [];
    }
  },

  addTalkThread(
    articleId: string,
    titulo: string,
    conteudo: string,
    user: UserProfile | null
  ): TalkThread {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
    const list: TalkThread[] = raw ? JSON.parse(raw) : [];

    const newThread: TalkThread = {
      id: `talk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      articleId,
      titulo,
      conteudo,
      autor: user ? user.displayName || user.email.split('@')[0] : 'Colaborador Anônimo',
      autorEmail: user?.email,
      autorRole: user?.role || 'leitor',
      data: new Date().toISOString(),
      status: 'aberto',
      respostas: [],
    };

    list.unshift(newThread);
    localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify(list));
    return newThread;
  },

  addTalkReply(
    threadId: string,
    conteudo: string,
    user: UserProfile | null
  ): TalkReply | null {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
    const list: TalkThread[] = raw ? JSON.parse(raw) : [];

    const thread = list.find((t) => t.id === threadId);
    if (!thread) return null;

    const newReply: TalkReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      autor: user ? user.displayName || user.email.split('@')[0] : 'Colaborador Anônimo',
      autorEmail: user?.email,
      autorRole: user?.role || 'leitor',
      conteudo,
      data: new Date().toISOString(),
      upvotes: 0,
    };

    thread.respostas.push(newReply);
    if (thread.status === 'aberto') {
      thread.status = 'em_discussao';
    }

    localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify(list));
    return newReply;
  },

  updateTalkThreadStatus(threadId: string, status: TalkThread['status']): boolean {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.TALK_THREADS);
    const list: TalkThread[] = raw ? JSON.parse(raw) : [];

    const thread = list.find((t) => t.id === threadId);
    if (!thread) return false;

    thread.status = status;
    localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify(list));
    return true;
  },

  // === WATCHLIST / PÁGINAS VIGIADAS ===
  getWatchlist(): WatchlistItem[] {
    initializeLocalStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  isWatched(articleId: string): boolean {
    const list = this.getWatchlist();
    return list.some((item) => item.articleId === articleId);
  },

  toggleWatchlist(article: WikiArticle): boolean {
    initializeLocalStorage();
    const list = this.getWatchlist();
    const index = list.findIndex((item) => item.articleId === article.id);

    let isNowWatched = false;
    if (index >= 0) {
      list.splice(index, 1);
      isNowWatched = false;
    } else {
      list.unshift({
        articleId: article.id,
        articleTitle: article.titulo,
        pageUid: article.pageUid,
        dataAdicionado: new Date().toISOString(),
      });
      isNowWatched = true;
    }

    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
    return isNowWatched;
  },

  // === COMMUNITY RATINGS & FEEDBACK ===
  getArticleRating(articleId: string): ArticleRatingData {
    initializeLocalStorage();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RATINGS);
      const ratingsMap: Record<string, ArticleRatingData> = raw ? JSON.parse(raw) : {};
      return (
        ratingsMap[articleId] || {
          articleId,
          averageScore: 4.8,
          totalVotes: 12,
          feedbacks: [
            {
              autor: 'Estudante_USP',
              nota: 5,
              comentario: 'Artigo muito completo e com referências bem estruturadas.',
              data: '2026-08-26T18:00:00Z',
            },
          ],
        }
      );
    } catch (e) {
      return {
        articleId,
        averageScore: 5.0,
        totalVotes: 1,
      };
    }
  },

  submitRating(
    articleId: string,
    nota: number,
    comentario: string,
    user: UserProfile | null
  ): ArticleRatingData {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.RATINGS);
    const ratingsMap: Record<string, ArticleRatingData> = raw ? JSON.parse(raw) : {};

    const current = ratingsMap[articleId] || {
      articleId,
      averageScore: 4.8,
      totalVotes: 10,
      feedbacks: [],
    };

    const newTotal = current.totalVotes + 1;
    const newAverage = Number(((current.averageScore * current.totalVotes + nota) / newTotal).toFixed(1));

    const feedbacks = current.feedbacks || [];
    if (comentario.trim()) {
      feedbacks.unshift({
        autor: user ? user.displayName || user.email.split('@')[0] : 'Leitor WikiZero',
        nota,
        comentario: comentario.trim(),
        data: new Date().toISOString(),
      });
    }

    const updated: ArticleRatingData = {
      articleId,
      averageScore: newAverage,
      totalVotes: newTotal,
      userScore: nota,
      feedbacks,
    };

    ratingsMap[articleId] = updated;
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratingsMap));
    return updated;
  },

  // === WHAT LINKS HERE / PÁGINAS AFLUENTES ===
  getBacklinks(targetTitle: string, allArticles: WikiArticle[]): { article: WikiArticle; snippet: string }[] {
    if (!targetTitle) return [];
    const normalizedTarget = targetTitle.toLowerCase().trim();

    const results: { article: WikiArticle; snippet: string }[] = [];

    allArticles.forEach((art) => {
      // Don't link to self
      if (art.titulo.toLowerCase() === normalizedTarget) return;

      const desc = art.descricao || '';
      // Check for [[Target]] or [[Target|Label]]
      const linkRegex = new RegExp(`\\[\\[(${escapeRegex(targetTitle)})(?:\\|[^\\]]*)?\\]\\]`, 'i');
      const match = desc.match(linkRegex);

      if (match && match.index !== undefined) {
        // Extract context snippet
        const start = Math.max(0, match.index - 40);
        const end = Math.min(desc.length, match.index + match[0].length + 40);
        let snippet = desc.slice(start, end).replace(/\n/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < desc.length) snippet = snippet + '...';

        results.push({
          article: art,
          snippet,
        });
      }
    });

    return results;
  },
};

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
