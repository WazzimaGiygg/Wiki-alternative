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
  UserBarnstar,
  UserboxItem,
  UserPermissions,
  UserTalkMessage,
  UserAuditLog,
  UserRole,
} from '../types';
import {
  INITIAL_PAGES,
  INITIAL_ARTICLES,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMMUNITY_USERS,
  INITIAL_USER_TALK_MESSAGES,
  INITIAL_USER_AUDIT_LOGS,
} from '../data/seedData';

// Configuração oficial do projeto Firebase
export const firebaseConfig = {
  projectId: "wzzm-ce3fc",
  appId: "1:249427877153:web:a423c9abb1ef0016deb260",
  apiKey: "AIzaSyAL_MsRuFE8BGjOZU8MK-4n25iJllS-Nmc",
  authDomain: "wzzm-ce3fc.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-wikizeroenciclop-0a14dc90-3ab3-47bc-8306-ca5bc2953699",
  storageBucket: "wzzm-ce3fc.firebasestorage.app",
  messagingSenderId: "249427877153",
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
  COMMUNITY_USERS: 'wikizero_community_users_v3',
  USER_TALK_MESSAGES: 'wikizero_user_talk_messages_v3',
  USER_AUDIT_LOGS: 'wikizero_user_audit_logs_v3',
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
  if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS)) {
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(INITIAL_COMMUNITY_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(INITIAL_USER_TALK_MESSAGES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.USER_AUDIT_LOGS, JSON.stringify(INITIAL_USER_AUDIT_LOGS));
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

  // === COMMUNITY USERS / PÁGINAS DE USUÁRIO ===
  async getCommunityUsers(): Promise<UserProfile[]> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS);
    if (!raw) return INITIAL_COMMUNITY_USERS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_COMMUNITY_USERS;
    }
  },

  async getUserProfile(uidOrUsername: string): Promise<UserProfile | null> {
    if (!uidOrUsername) return null;
    const users = await this.getCommunityUsers();
    const cleanId = uidOrUsername.toLowerCase().trim();

    // Match by uid, username, or displayName
    const found = users.find(
      (u) =>
        u.uid.toLowerCase() === cleanId ||
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.displayName && u.displayName.toLowerCase() === cleanId)
    );

    if (found) return found;

    // Check if it's the current logged in user
    const currentUser = this.getCurrentUser();
    if (
      currentUser &&
      (currentUser.uid.toLowerCase() === cleanId ||
        currentUser.displayName?.toLowerCase() === cleanId ||
        currentUser.email?.toLowerCase() === cleanId)
    ) {
      return currentUser;
    }

    return null;
  },

  async saveCommunityUser(user: UserProfile): Promise<UserProfile> {
    const users = await this.getCommunityUsers();
    const index = users.findIndex((u) => u.uid === user.uid);

    let updatedUsers: UserProfile[];
    if (index >= 0) {
      updatedUsers = [...users];
      updatedUsers[index] = user;
    } else {
      updatedUsers = [user, ...users];
    }

    localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(updatedUsers));

    // Also update current user if modifying self
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.uid === user.uid) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    return user;
  },

  async updateUserRole(
    uid: string,
    newRole: UserRole,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const oldRole = user.role;
    const updated: UserProfile = {
      ...user,
      role: newRole,
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'role_change',
      `Cargo alterado de "${oldRole}" para "${newRole}" por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async banUser(
    uid: string,
    reason: string,
    banType: 'permanente' | 'temporario' | 'advertencia',
    durationDays: number | undefined,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    let banExpiresAt: string | undefined;
    if (banType === 'temporario' && durationDays) {
      const date = new Date();
      date.setDate(date.getDate() + durationDays);
      banExpiresAt = date.toISOString();
    }

    const updated: UserProfile = {
      ...user,
      isBanned: banType !== 'advertencia',
      banReason: reason,
      banType,
      banExpiresAt,
      warningCount: (user.warningCount || 0) + 1,
      permissions: {
        canEdit: false,
        canCreate: false,
        canTalk: banType === 'advertencia',
        canDelete: false,
        canGrantBarnstars: false,
      },
    };

    await this.saveCommunityUser(updated);

    const desc =
      banType === 'permanente'
        ? `Bloqueio permanente aplicado. Motivo: ${reason}`
        : banType === 'temporario'
        ? `Bloqueio temporário por ${durationDays} dias aplicado. Expira em ${banExpiresAt}. Motivo: ${reason}`
        : `Advertência formal emitida. Motivo: ${reason}`;

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      banType === 'advertencia' ? 'warning_issued' : 'ban_user',
      desc,
      adminUser
    );

    // Also leave an administrative warning topic on their talk page
    this.addUserTalkMessage(
      user.uid,
      user.displayName || user.username || user.uid,
      {
        titulo: `⚠️ Ação Administrativa: ${banType === 'advertencia' ? 'Advertência Formal' : 'Suspensão de Conta'}`,
        conteudo: `'''Motivo:''' ${reason}\n\n'''Status:''' ${
          banType === 'permanente'
            ? 'Bloqueio Permanente'
            : banType === 'temporario'
            ? `Suspensão temporária por ${durationDays} dias.`
            : 'Advertência sem bloqueio de acesso.'
        }\n\nEmitido por: ${adminUser?.displayName || 'Corpo Administrativo da WikiZero'}.`,
        tipo: 'aviso_admin',
      },
      adminUser
    );

    return updated;
  },

  async unbanUser(uid: string, adminUser: UserProfile | null): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const updated: UserProfile = {
      ...user,
      isBanned: false,
      banReason: undefined,
      banExpiresAt: undefined,
      banType: undefined,
      permissions: {
        canEdit: true,
        canCreate: true,
        canTalk: true,
        canDelete: user.role === 'admin' || user.role === 'moderador',
        canGrantBarnstars: true,
      },
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'unban_user',
      `Bloqueio revogado e permissões restauradas por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async updateUserPermissions(
    uid: string,
    permissions: Partial<UserPermissions>,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const currentPerms = user.permissions || {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: user.role === 'admin' || user.role === 'moderador',
      canGrantBarnstars: true,
    };

    const updated: UserProfile = {
      ...user,
      permissions: {
        ...currentPerms,
        ...permissions,
      },
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'permission_change',
      `Permissões atualizadas por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async resetUserBio(uid: string, adminUser: UserProfile | null): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user) return null;

    const updated: UserProfile = {
      ...user,
      bio: `= ${user.displayName || user.username} =\nPágina de usuário resetada pela moderação administrativa.`,
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'profile_reset',
      `Biografia de usuário resetada por conteúdo impróprio/spam por ${adminUser?.displayName || 'Administrador'}.`,
      adminUser
    );

    return updated;
  },

  async awardBarnstar(
    targetUid: string,
    barnstarData: Omit<UserBarnstar, 'id' | 'awardedAt'>,
    adminUser: UserProfile | null
  ): Promise<UserProfile | null> {
    const user = await this.getUserProfile(targetUid);
    if (!user) return null;

    const newBarnstar: UserBarnstar = {
      id: 'bs-' + Date.now(),
      ...barnstarData,
      awardedAt: new Date().toISOString(),
      awardedBy: adminUser?.displayName || 'Comunidade WikiZero',
      awardedByUid: adminUser?.uid,
    };

    const barnstars = [newBarnstar, ...(user.barnstars || [])];
    const updated: UserProfile = {
      ...user,
      barnstars,
      reputationScore: (user.reputationScore || 0) + 50,
    };

    await this.saveCommunityUser(updated);

    this.logUserAuditAction(
      user.uid,
      user.displayName || user.username || user.uid,
      'barnstar_awarded',
      `Condecoração concedida: "${barnstarData.title}".`,
      adminUser
    );

    // Also post notice to user talk page
    this.addUserTalkMessage(
      user.uid,
      user.displayName || user.username || user.uid,
      {
        titulo: `🏆 Nova Condecoração: ${barnstarData.title}`,
        conteudo: `Parabéns! Você recebeu uma medalha wiki:\n\n'''${barnstarData.title}'''\n''"${barnstarData.description}"''\n\nConcedida por: ${adminUser?.displayName || 'Comunidade'}.`,
        tipo: 'barnstar',
      },
      adminUser
    );

    return updated;
  },

  // === USER TALK MESSAGES / DISCUSSÃO DO USUÁRIO ===
  getUserTalkMessages(targetUidOrUsername: string): UserTalkMessage[] {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : INITIAL_USER_TALK_MESSAGES;

    const clean = targetUidOrUsername.toLowerCase().trim();
    return messages.filter(
      (m) =>
        m.targetUserUid.toLowerCase() === clean ||
        m.targetUsername.toLowerCase() === clean
    );
  },

  addUserTalkMessage(
    targetUid: string,
    targetUsername: string,
    msg: {
      titulo: string;
      conteudo: string;
      tipo: 'geral' | 'aviso_admin' | 'barnstar' | 'duvida' | 'boas_vindas';
    },
    sender: UserProfile | null
  ): UserTalkMessage {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : INITIAL_USER_TALK_MESSAGES;

    const newMessage: UserTalkMessage = {
      id: 'utalk-' + Date.now(),
      targetUserUid: targetUid,
      targetUsername: targetUsername,
      senderUid: sender?.uid,
      senderName: sender ? sender.displayName || sender.email.split('@')[0] : 'Colaborador Anônimo',
      senderEmail: sender?.email,
      senderRole: sender?.role || 'convidado',
      titulo: msg.titulo.trim(),
      conteudo: msg.conteudo.trim(),
      tipo: msg.tipo || 'geral',
      data: new Date().toISOString(),
      status: 'aberto',
      respostas: [],
    };

    messages.unshift(newMessage);
    localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(messages));

    // Send a notification to current notifications if recipient matches
    const notifs = this.getNotifications();
    notifs.unshift({
      id: 'notif-utalk-' + Date.now(),
      title: `💬 Nova mensagem na sua Discussão: "${msg.titulo}"`,
      message: `De ${newMessage.senderName}: "${msg.conteudo.slice(0, 80)}${msg.conteudo.length > 80 ? '...' : ''}"`,
      date: 'Agora',
      read: false,
      type: msg.tipo === 'aviso_admin' ? 'warning' : 'info',
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));

    return newMessage;
  },

  addUserTalkReply(
    messageId: string,
    conteudo: string,
    sender: UserProfile | null
  ): TalkReply | null {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : INITIAL_USER_TALK_MESSAGES;

    const target = messages.find((m) => m.id === messageId);
    if (!target) return null;

    const reply: TalkReply = {
      id: 'reply-' + Date.now(),
      autor: sender ? sender.displayName || sender.email.split('@')[0] : 'Colaborador Anônimo',
      autorEmail: sender?.email,
      autorRole: sender?.role || 'convidado',
      conteudo: conteudo.trim(),
      data: new Date().toISOString(),
      upvotes: 0,
    };

    target.respostas.push(reply);
    target.status = 'em_discussao';

    localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(messages));
    return reply;
  },

  updateUserTalkStatus(messageId: string, status: UserTalkMessage['status']): boolean {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : INITIAL_USER_TALK_MESSAGES;

    const target = messages.find((m) => m.id === messageId);
    if (!target) return false;

    target.status = status;
    localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify(messages));
    return true;
  },

  // === USER AUDIT LOGS ===
  getUserAuditLogs(targetUid?: string): UserAuditLog[] {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_AUDIT_LOGS);
    const logs: UserAuditLog[] = raw ? JSON.parse(raw) : INITIAL_USER_AUDIT_LOGS;

    if (!targetUid) return logs;
    const clean = targetUid.toLowerCase().trim();
    return logs.filter(
      (l) =>
        l.targetUserUid.toLowerCase() === clean ||
        l.targetUsername.toLowerCase() === clean
    );
  },

  logUserAuditAction(
    targetUserUid: string,
    targetUsername: string,
    action: UserAuditLog['action'],
    details: string,
    performedBy: UserProfile | null
  ): void {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_AUDIT_LOGS);
    const logs: UserAuditLog[] = raw ? JSON.parse(raw) : INITIAL_USER_AUDIT_LOGS;

    const newLog: UserAuditLog = {
      id: 'log-' + Date.now(),
      targetUserUid,
      targetUsername,
      action,
      details,
      performedBy: performedBy ? performedBy.displayName || performedBy.email.split('@')[0] : 'Sistema',
      performedByRole: performedBy?.role || 'admin',
      date: new Date().toISOString(),
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.USER_AUDIT_LOGS, JSON.stringify(logs));
  },

  // === USER CONTRIBUTIONS ===
  async getUserContributions(
    username: string
  ): Promise<{
    type: 'create' | 'edit';
    articleId: string;
    articleTitle: string;
    pageUid: string;
    date: string;
    summary: string;
    deltaBytes?: number;
    isMinor?: boolean;
  }[]> {
    const articles = await this.getArticles();
    const cleanName = username.toLowerCase().trim();
    const contributions: {
      type: 'create' | 'edit';
      articleId: string;
      articleTitle: string;
      pageUid: string;
      date: string;
      summary: string;
      deltaBytes?: number;
      isMinor?: boolean;
    }[] = [];

    articles.forEach((art) => {
      if (art.autor && art.autor.toLowerCase().includes(cleanName)) {
        contributions.push({
          type: 'create',
          articleId: art.id,
          articleTitle: art.titulo,
          pageUid: art.pageUid,
          date: art.dataCriacao,
          summary: art.resumo || 'Criação inicial do verbete',
          deltaBytes: (art.descricao || '').length,
        });
      }

      if (art.historico && art.historico.length > 0) {
        art.historico.forEach((h) => {
          if (h.autor && h.autor.toLowerCase().includes(cleanName)) {
            contributions.push({
              type: 'edit',
              articleId: art.id,
              articleTitle: art.titulo,
              pageUid: art.pageUid,
              date: h.data,
              summary: h.resumo || 'Edição de conteúdo e fontes',
              deltaBytes: h.deltaBytes,
              isMinor: h.isMinor,
            });
          }
        });
      }
    });

    // Sort descending by date
    return contributions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  // === FIREBASE DATABASE ADMINISTRATION (PARA ADMINISTRADORES) ===
  getFirebaseStatus() {
    return {
      active: firebaseActive,
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      apiKeyMasked: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 8)}...${firebaseConfig.apiKey.slice(-4)}` : 'Não configurada',
    };
  },

  async testFirebaseConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = Date.now();
    if (!firebaseActive || !db) {
      return { success: false, message: 'Firebase não está ativo ou instância de Firestore não inicializada.' };
    }
    try {
      const pingDoc = doc(db, '_health_check', 'ping');
      await setDoc(pingDoc, { ping: true, timestamp: serverTimestamp() });
      const snap = await getDoc(pingDoc);
      const latencyMs = Date.now() - start;
      return {
        success: snap.exists(),
        message: `Conexão com Firestore autenticada e operacional (${latencyMs}ms).`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha na conexão com Firestore: ${err?.message || err}`,
      };
    }
  },

  async syncAllToFirebase(): Promise<{ syncedPages: number; syncedArticles: number; syncedUsers: number }> {
    if (!firebaseActive || !db) {
      throw new Error('Firestore não está conectado.');
    }

    const pages = await this.getPages();
    const articles = await this.getArticles();
    const users = await this.getCommunityUsers();

    let syncedPages = 0;
    let syncedArticles = 0;
    let syncedUsers = 0;

    for (const page of pages) {
      try {
        await setDoc(doc(db, 'documentos', page.uid), {
          titulo: page.titulo,
          descricao: page.descricao,
          categoria: page.categoria,
          criadoEm: page.criadoEm || serverTimestamp(),
          status: page.status || 'ativo',
          uid: page.uid,
          autor: page.autor || 'Admin',
        });
        syncedPages++;
      } catch (e) {
        console.warn('Erro ao sincronizar página:', page.uid, e);
      }
    }

    for (const art of articles) {
      try {
        await setDoc(doc(db, 'documentos', art.pageUid, 'inevitavel', art.id), {
          id: art.id,
          pageUid: art.pageUid,
          titulo: art.titulo,
          descricao: art.descricao,
          resumo: art.resumo || '',
          categoria: art.categoria || 'Geral',
          idioma: art.idioma || 'pt',
          autor: art.autor || 'Colaborador',
          autorEmail: art.autorEmail || '',
          autorUid: art.autorUid || 'anon',
          versao: art.versao || 1,
          visualizacoes: art.visualizacoes || 1,
          dataCriacao: art.dataCriacao || new Date().toISOString(),
          atualizadoEm: serverTimestamp(),
        });
        syncedArticles++;
      } catch (e) {
        console.warn('Erro ao sincronizar artigo:', art.id, e);
      }
    }

    for (const u of users) {
      try {
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          username: u.username || u.displayName,
          role: u.role,
          isBanned: !!u.isBanned,
          banReason: u.banReason || '',
          createdAt: u.createdAt || new Date().toISOString(),
          bio: u.bio || '',
        });
        syncedUsers++;
      } catch (e) {
        console.warn('Erro ao sincronizar usuário:', u.uid, e);
      }
    }

    return { syncedPages, syncedArticles, syncedUsers };
  },

  async clearLocalCache(): Promise<void> {
    const consent = this.getCookieConsent();
    const isLgpd = this.isLgpdTermsAccepted();
    const currentUser = this.getCurrentUser();
    
    // Clear storage keys
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    
    // Restore session if existed
    if (consent) this.saveCookieConsent(consent);
    if (isLgpd) this.saveLgpdTermsAccepted();
    if (currentUser) this.saveUser(currentUser);
    
    initializeLocalStorage();
  },
};

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
