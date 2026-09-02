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
  SystemUpdateEntry,
  SockpuppetCase,
  CheckUserLogEntry,
  CheckUserAccountDetails,
  UnblockRequest,
  UnblockAppealComment,
  UnblockRequestStatus,
  PromotionRequest,
  PromotionVote,
  PromotionVoteType,
  PromotionTargetRole,
  PromotionRequestStatus,
  AdminContactTicket,
  AdminTicketMessage,
  AdminTicketCategory,
  AdminTicketStatus,
  AdminTicketPriority,
  ArbitrationCase,
  ArbitrationCaseCategory,
  ArbitrationCaseStatus,
  ArbitrationCaseTargetType,
  ArbitrationComment,
  ArbitrationDeliberation,
  ArbitrationRuling,
  ArbitrationRulingRemedy,
  ArbitrationCommitteeMember,
} from '../types';
import {
  INITIAL_PAGES,
  INITIAL_ARTICLES,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMMUNITY_USERS,
  INITIAL_USER_TALK_MESSAGES,
  INITIAL_USER_AUDIT_LOGS,
  INITIAL_SYSTEM_UPDATES,
  INITIAL_SOCKPUPPET_CASES,
  INITIAL_CHECKUSER_LOGS,
  MOCK_CHECKUSER_ACCOUNTS,
  INITIAL_UNBLOCK_REQUESTS,
  INITIAL_PROMOTION_REQUESTS,
  INITIAL_ADMIN_TICKETS,
  INITIAL_ARBITRATION_CASES,
  INITIAL_ARBITRATION_MEMBERS,
} from '../data/seedData';
import { ACTIVE_FIREBASE_CONFIG } from '../config/firebaseCustomConfig';

// Configuração ativa do Firebase derivada do arquivo de configuração do desenvolvedor (src/config/firebaseCustomConfig.ts)
export const firebaseConfig = {
  ...ACTIVE_FIREBASE_CONFIG.firebaseConfig,
  firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
};

let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let firebaseActive = false;

try {
  const app = getApps().length ? getApps()[0] : initializeApp(ACTIVE_FIREBASE_CONFIG.firebaseConfig);
  const dbId = ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId;
  db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
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
  BIRTHDATE: 'wikizero_user_birthdate_v3',
  USER_AGE: 'wikizero_user_age_v3',
  DRAFT: 'wikizero_editor_draft_v3',
  THEME: 'wikizero_theme_v3',
  RECENT_CHANGES: 'wikizero_recent_changes_v3',
  TALK_THREADS: 'wikizero_talk_threads_v3',
  WATCHLIST: 'wikizero_watchlist_v3',
  RATINGS: 'wikizero_ratings_v3',
  COMMUNITY_USERS: 'wikizero_community_users_v3',
  USER_TALK_MESSAGES: 'wikizero_user_talk_messages_v3',
  USER_AUDIT_LOGS: 'wikizero_user_audit_logs_v3',
  SYSTEM_UPDATES: 'wikizero_system_updates_v3',
  SOCKPUPPET_CASES: 'wikizero_sockpuppet_cases_v3',
  CHECKUSER_LOGS: 'wikizero_checkuser_logs_v3',
  CHECKUSER_ACCOUNTS: 'wikizero_checkuser_accounts_v3',
  UNBLOCK_REQUESTS: 'wikizero_unblock_requests_v3',
  PROMOTION_REQUESTS: 'wikizero_promotion_requests_v3',
  ADMIN_TICKETS: 'wikizero_admin_tickets_v3',
  ARBITRATION_CASES: 'wikizero_arbitration_cases_v3',
  ARBITRATION_MEMBERS: 'wikizero_arbitration_members_v3',
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
  if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_UPDATES)) {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(INITIAL_SYSTEM_UPDATES));
  } else {
    // If exists, make sure newest seed items are present and synced
    try {
      const existing: SystemUpdateEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_UPDATES) || '[]');
      const existingMap = new Map(existing.map((u) => [u.id, u]));
      let changed = false;
      for (const item of INITIAL_SYSTEM_UPDATES) {
        if (!existingMap.has(item.id)) {
          existing.push(item);
          changed = true;
        } else {
          // If title/highlights were enriched, update them
          const curr = existingMap.get(item.id)!;
          if (curr.title !== item.title || curr.highlights.length !== item.highlights.length) {
            Object.assign(curr, item);
            changed = true;
          }
        }
      }
      if (changed || existing.length > 0) {
        existing.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        existing.forEach((item, index) => {
          item.isLatest = index === 0;
        });
        localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(existing));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(INITIAL_SYSTEM_UPDATES));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.SOCKPUPPET_CASES)) {
    localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(INITIAL_SOCKPUPPET_CASES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHECKUSER_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify(INITIAL_CHECKUSER_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS)) {
    localStorage.setItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS, JSON.stringify(MOCK_CHECKUSER_ACCOUNTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.UNBLOCK_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(INITIAL_UNBLOCK_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROMOTION_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(INITIAL_PROMOTION_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS)) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(INITIAL_ADMIN_TICKETS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ARBITRATION_CASES)) {
    localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(INITIAL_ARBITRATION_CASES));
  } else {
    try {
      const existing: ArbitrationCase[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARBITRATION_CASES) || '[]');
      const existingIds = new Set(existing.map((c) => c.id));
      let changed = false;
      for (const item of INITIAL_ARBITRATION_CASES) {
        if (!existingIds.has(item.id)) {
          existing.push(item);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(existing));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(INITIAL_ARBITRATION_CASES));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.ARBITRATION_MEMBERS)) {
    localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(INITIAL_ARBITRATION_MEMBERS));
  } else {
    try {
      const existing: ArbitrationCommitteeMember[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARBITRATION_MEMBERS) || '[]');
      const existingIds = new Set(existing.map((m) => m.id));
      let changed = false;
      for (const item of INITIAL_ARBITRATION_MEMBERS) {
        if (!existingIds.has(item.id)) {
          existing.push(item);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(existing));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(INITIAL_ARBITRATION_MEMBERS));
    }
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

  calculateAge(birthdateStr?: string | null): number {
    if (!birthdateStr) return 0;
    const parts = birthdateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return Math.max(0, age);
      }
    }
    const parsed = new Date(birthdateStr);
    if (isNaN(parsed.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const m = today.getMonth() - parsed.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
      age--;
    }
    return Math.max(0, age);
  },

  isLgpdTermsAccepted(): boolean {
    const isAccepted = localStorage.getItem(STORAGE_KEYS.LGPD_TERMS) === 'true';
    const birthdate = localStorage.getItem(STORAGE_KEYS.BIRTHDATE);
    if (!isAccepted || !birthdate) return false;
    const age = this.calculateAge(birthdate);
    return age > 14;
  },

  getUserAgeInfo(): { isAccepted: boolean; birthdate: string | null; age: number } {
    const isAccepted = this.isLgpdTermsAccepted();
    const birthdate = localStorage.getItem(STORAGE_KEYS.BIRTHDATE);
    const age = this.calculateAge(birthdate);
    return { isAccepted, birthdate, age };
  },

  saveLgpdTermsAccepted(birthdate: string): { success: boolean; age: number; message?: string } {
    const age = this.calculateAge(birthdate);
    if (age <= 14) {
      return {
        success: false,
        age,
        message: 'Acesso restrito: A idade informada deve ser estritamente maior que 14 anos conforme os termos da WikiZero e LGPD.',
      };
    }
    localStorage.setItem(STORAGE_KEYS.LGPD_TERMS, 'true');
    localStorage.setItem(STORAGE_KEYS.BIRTHDATE, birthdate);
    localStorage.setItem(STORAGE_KEYS.USER_AGE, String(age));
    const user = this.getCurrentUser();
    if (user) {
      user.dataConsentimento = new Date().toISOString();
      user.birthdate = birthdate;
      this.saveUser(user);
    }
    return { success: true, age };
  },

  revokeConsent() {
    localStorage.removeItem(STORAGE_KEYS.LGPD_TERMS);
    localStorage.removeItem(STORAGE_KEYS.CONSENT);
    localStorage.removeItem(STORAGE_KEYS.BIRTHDATE);
    localStorage.removeItem(STORAGE_KEYS.USER_AGE);
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

  async adminUpdateUserName(
    targetUid: string,
    newDisplayName: string,
    legalJustification: string,
    adminUser: UserProfile | null
  ): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    // 1. Permission check: Only admin
    const isAdmin =
      adminUser?.role === 'admin' ||
      adminUser?.email === 'pedrohenriquecardonaperes@gmail.com';

    if (!isAdmin) {
      return {
        success: false,
        message: 'Acesso negado: A retificação de nome de usuário é restrita exclusivamente a Administradores (LGPD / Marco Civil).',
      };
    }

    const cleanNewName = (newDisplayName || '').trim();
    if (!cleanNewName || cleanNewName.length < 3 || cleanNewName.length > 50) {
      return {
        success: false,
        message: 'O novo nome deve conter entre 3 e 50 caracteres.',
      };
    }

    // Check illegal chars in username
    if (/[/\\#?%<>[\]|^`{}]/.test(cleanNewName)) {
      return {
        success: false,
        message: 'O nome contém caracteres inválidos para identificador de usuário.',
      };
    }

    const user = await this.getUserProfile(targetUid);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const oldName = user.displayName || user.username || user.uid;
    if (oldName.toLowerCase() === cleanNewName.toLowerCase()) {
      return { success: false, message: 'O novo nome informado é idêntico ao nome atual.' };
    }

    // Check if new name is already in use by another user
    const allCommunity = await this.getCommunityUsers();
    const isTaken = allCommunity.some(
      (u) =>
        u.uid !== user.uid &&
        (u.displayName?.toLowerCase() === cleanNewName.toLowerCase() ||
          u.username?.toLowerCase() === cleanNewName.toLowerCase())
    );
    if (isTaken) {
      return { success: false, message: `O nome "${cleanNewName}" já está em uso por outro usuário.` };
    }

    const updatedUser: UserProfile = {
      ...user,
      displayName: cleanNewName,
      username: cleanNewName.toLowerCase().replace(/\s+/g, '_'),
    };

    // Save updated user in community users & Firestore
    await this.saveCommunityUser(updatedUser);

    // If current logged-in user is this user, update localStorage current user
    const currentRaw = localStorage.getItem(STORAGE_KEYS.USER);
    if (currentRaw) {
      try {
        const parsedCurrent: UserProfile = JSON.parse(currentRaw);
        if (parsedCurrent.uid === user.uid || parsedCurrent.email === user.email) {
          localStorage.setItem(
            STORAGE_KEYS.USER,
            JSON.stringify({ ...parsedCurrent, displayName: cleanNewName, username: updatedUser.username })
          );
        }
      } catch (e) {
        console.error('Error updating current session user:', e);
      }
    }

    // Update article author and revision history references for LGPD rectification
    try {
      const articles = await this.getArticles();
      let updatedArticlesCount = 0;
      const updatedArticles = articles.map((art) => {
        let changed = false;
        let artAutor = art.autor;
        if (art.autorUid === user.uid || art.autor === oldName || (user.email && art.autorEmail === user.email)) {
          artAutor = cleanNewName;
          changed = true;
        }

        const historico = art.historico?.map((h) => {
          if (h.autor === oldName || (user.email && h.autorEmail === user.email)) {
            changed = true;
            return { ...h, autor: cleanNewName };
          }
          return h;
        });

        if (changed) {
          updatedArticlesCount++;
          return { ...art, autor: artAutor, historico };
        }
        return art;
      });

      if (updatedArticlesCount > 0) {
        localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updatedArticles));
      }
    } catch (e) {
      console.warn('Error cascading name change to articles:', e);
    }

    // Register immutable audit log entry
    const justificationText = (legalJustification || '').trim() || 'Solicitação do Titular de Dados (Art. 18, III LGPD)';
    this.logUserAuditAction(
      user.uid,
      cleanNewName,
      'lgpd_name_change',
      `Retificação Cadastral de Nome de "${oldName}" para "${cleanNewName}". Fundamento: ${justificationText}. Administrador: ${adminUser?.displayName || adminUser?.email}.`,
      adminUser
    );

    // Send talk message notice
    this.addUserTalkMessage(
      user.uid,
      cleanNewName,
      {
        titulo: `⚖️ Retificação de Nome Cadastral (LGPD / Marco Civil)`,
        conteudo: `Seu nome de exibição e identificador público foi atualizado de '''"${oldName}"''' para '''"${cleanNewName}"''' em conformidade com as diretrizes da LGPD (Art. 18, III - Retificação de Dados) e Marco Civil da Internet.\n\n'''Fundamento / Justificativa:''' ${justificationText}\n\n'''Executado por:''' ${adminUser?.displayName || 'Administração WikiZero'}.`,
        tipo: 'aviso_admin',
      },
      adminUser
    );

    return {
      success: true,
      user: updatedUser,
      message: `Nome retificado com sucesso de "${oldName}" para "${cleanNewName}" com registro em auditoria LGPD.`,
    };
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
      environmentLabel: ACTIVE_FIREBASE_CONFIG.environmentLabel,
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      appId: firebaseConfig.appId,
      messagingSenderId: firebaseConfig.messagingSenderId,
      apiKeyMasked: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 8)}...${firebaseConfig.apiKey.slice(-4)}` : 'Não configurada',
      configFileLocation: 'src/config/firebaseCustomConfig.ts',
      options: ACTIVE_FIREBASE_CONFIG.options,
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

  // === SYSTEM UPDATES & CHANGELOG ===
  async getSystemUpdates(): Promise<SystemUpdateEntry[]> {
    initializeLocalStorage();
    let updates: SystemUpdateEntry[] = [];
    try {
      updates = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_UPDATES) || '[]');
    } catch {
      updates = INITIAL_SYSTEM_UPDATES;
    }

    // Try fetching from Firestore if available
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'system_updates'));
        if (!snap.empty) {
          const firestoreUpdates: SystemUpdateEntry[] = [];
          snap.forEach((docSnap) => {
            firestoreUpdates.push(docSnap.data() as SystemUpdateEntry);
          });
          // Merge firestore updates with local updates
          const mergedMap = new Map<string, SystemUpdateEntry>();
          updates.forEach((u) => mergedMap.set(u.id, u));
          firestoreUpdates.forEach((u) => mergedMap.set(u.id, u));
          updates = Array.from(mergedMap.values());
        }
      } catch (err) {
        console.warn('Firestore getSystemUpdates background read error:', err);
      }
    }

    // Sort descending by date
    updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return updates;
  },

  async addSystemUpdate(
    entry: Omit<SystemUpdateEntry, 'id' | 'date'> & { id?: string; date?: string }
  ): Promise<SystemUpdateEntry> {
    const updates = await this.getSystemUpdates();
    const newEntry: SystemUpdateEntry = {
      id: entry.id || `upd-${Date.now()}`,
      version: entry.version.trim(),
      title: entry.title.trim(),
      date: entry.date || new Date().toISOString(),
      category: entry.category,
      author: entry.author || 'Administrador',
      authorRole: entry.authorRole || 'Sistema',
      summary: entry.summary.trim(),
      highlights: entry.highlights && entry.highlights.length > 0 ? entry.highlights : [entry.summary],
      badge: entry.badge || 'Melhoria',
      commitHash: entry.commitHash || `commit-${Math.random().toString(36).substring(2, 9)}`,
      affectedComponents: entry.affectedComponents || [],
      isLatest: true,
    };

    // Mark previous latest as false
    const updatedList = updates.map((u) => ({ ...u, isLatest: false }));
    updatedList.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(updatedList));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'system_updates', newEntry.id), {
          ...newEntry,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore addSystemUpdate background sync error:', err);
      }
    }

    return newEntry;
  },

  async deleteSystemUpdate(id: string): Promise<boolean> {
    const updates = await this.getSystemUpdates();
    const filtered = updates.filter((u) => u.id !== id);
    if (filtered.length > 0) {
      filtered[0].isLatest = true;
    }
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(filtered));

    if (firebaseActive && db) {
      try {
        await deleteDoc(doc(db, 'system_updates', id));
      } catch (err) {
        console.warn('Firestore deleteSystemUpdate error:', err);
      }
    }
    return true;
  },

  async resetSystemUpdatesToDefault(): Promise<SystemUpdateEntry[]> {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(INITIAL_SYSTEM_UPDATES));
    return INITIAL_SYSTEM_UPDATES;
  },

  // === CHECKUSER & SOCKPUPPET INVESTIGATION (EXCLUSIVO PARA MODERADORES E ADMINS) ===
  async getSockpuppetCases(): Promise<SockpuppetCase[]> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.SOCKPUPPET_CASES);
    return raw ? JSON.parse(raw) : INITIAL_SOCKPUPPET_CASES;
  },

  async saveSockpuppetCase(spiCase: SockpuppetCase): Promise<SockpuppetCase> {
    const cases = await this.getSockpuppetCases();
    const existingIndex = cases.findIndex((c) => c.id === spiCase.id || c.caseNumber === spiCase.caseNumber);
    
    if (existingIndex >= 0) {
      cases[existingIndex] = { ...cases[existingIndex], ...spiCase };
    } else {
      cases.unshift(spiCase);
    }

    localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(cases));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'sockpuppet_cases', spiCase.id), {
          ...spiCase,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore saveSockpuppetCase background sync error:', err);
      }
    }

    return spiCase;
  },

  async deleteSockpuppetCase(caseId: string): Promise<boolean> {
    const cases = await this.getSockpuppetCases();
    const filtered = cases.filter((c) => c.id !== caseId);
    localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(filtered));

    if (firebaseActive && db) {
      try {
        await deleteDoc(doc(db, 'sockpuppet_cases', caseId));
      } catch (err) {
        console.warn('Firestore deleteSockpuppetCase error:', err);
      }
    }
    return true;
  },

  async getCheckUserLogs(): Promise<CheckUserLogEntry[]> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKUSER_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_CHECKUSER_LOGS;
  },

  async logCheckUserQuery(entry: {
    target: string;
    targetType: 'username' | 'ip' | 'cidr';
    reason: string;
    performedBy: string;
    performedByRole: string;
    resultsFound: number;
  }): Promise<CheckUserLogEntry> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKUSER_LOGS);
    const logs: CheckUserLogEntry[] = raw ? JSON.parse(raw) : INITIAL_CHECKUSER_LOGS;

    const newLog: CheckUserLogEntry = {
      id: 'culog-' + Date.now(),
      target: entry.target.trim(),
      targetType: entry.targetType,
      reason: entry.reason.trim(),
      performedBy: entry.performedBy,
      performedByRole: entry.performedByRole,
      timestamp: new Date().toISOString(),
      resultsFound: entry.resultsFound,
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify(logs));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'checkuser_logs', newLog.id), {
          ...newLog,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore logCheckUserQuery sync error:', err);
      }
    }

    return newLog;
  },

  async getAllCheckUserAccounts(): Promise<Record<string, CheckUserAccountDetails>> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS);
    const accounts: Record<string, CheckUserAccountDetails> = raw ? JSON.parse(raw) : MOCK_CHECKUSER_ACCOUNTS;

    // Ensure all community users have a CheckUser details profile
    const communityUsers = await this.getCommunityUsers();
    let updated = false;

    communityUsers.forEach((u) => {
      if (!accounts[u.uid]) {
        // Generate baseline IP and User Agent based on user profile
        const isSpam = u.username.toLowerCase().includes('suspeito') || u.username.toLowerCase().includes('vandalo') || u.username.toLowerCase().includes('fantoche');
        accounts[u.uid] = {
          uid: u.uid,
          displayName: u.displayName || u.username,
          username: u.username,
          email: u.email,
          role: u.role,
          isBanned: u.isBanned || false,
          banReason: u.banReason,
          isSockpuppet: u.username.toLowerCase().includes('alt') || u.username.toLowerCase().includes('fantoche'),
          sockpuppetOf: isSpam ? 'Usuario_Suspeito' : undefined,
          createdAt: u.createdAt,
          lastActive: u.lastActive,
          reputationScore: u.reputationScore,
          ipAddresses: [
            {
              ip: isSpam ? '177.136.24.12' : `179.184.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 250)}`,
              isp: isSpam ? 'Claro Fibra / AS28573' : 'Vivo Fibra Brasil',
              location: 'São Paulo, SP, Brasil',
              lastSeen: u.lastActive,
              usageCount: 15,
            },
          ],
          userAgents: [
            {
              browser: 'Chrome 127.0.6533.119',
              os: 'Linux x86_64',
              device: 'Desktop / PC',
              raw: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/127.0.6533.119',
              lastSeen: u.lastActive,
            },
          ],
          editedArticles: [],
        };
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS, JSON.stringify(accounts));
    }

    return accounts;
  },

  async getCheckUserAccountDetails(usernameOrUid: string): Promise<CheckUserAccountDetails | null> {
    const accounts: Record<string, CheckUserAccountDetails> = await this.getAllCheckUserAccounts();
    const clean = usernameOrUid.toLowerCase().trim();

    // Check by UID
    if (accounts[usernameOrUid]) return accounts[usernameOrUid];

    // Check by username or displayName
    const allAccountsList: CheckUserAccountDetails[] = Object.values(accounts);
    const found = allAccountsList.find(
      (a: CheckUserAccountDetails) =>
        a.username.toLowerCase() === clean ||
        a.displayName.toLowerCase() === clean ||
        a.uid.toLowerCase() === clean ||
        a.email.toLowerCase() === clean
    );

    return found || null;
  },

  async performCheckUserInvestigation(
    target: string,
    targetType: 'username' | 'ip' | 'cidr',
    reason: string,
    performedBy: UserProfile
  ): Promise<{
    matchedAccounts: CheckUserAccountDetails[];
    relatedIps: string[];
    correlationScore: number;
    detectedSockpuppets: string[];
    evidenceNotes: string[];
    queryLog: CheckUserLogEntry;
  }> {
    const cleanTarget = target.trim();
    const accounts: Record<string, CheckUserAccountDetails> = await this.getAllCheckUserAccounts();
    const allAccountsList: CheckUserAccountDetails[] = Object.values(accounts);

    let matchedAccounts: CheckUserAccountDetails[] = [];
    const relatedIpsSet = new Set<string>();
    const detectedSockpuppetsSet = new Set<string>();
    const evidenceNotes: string[] = [];

    if (targetType === 'username') {
      const targetUser = allAccountsList.find(
        (a: CheckUserAccountDetails) =>
          a.username.toLowerCase() === cleanTarget.toLowerCase() ||
          a.displayName.toLowerCase() === cleanTarget.toLowerCase() ||
          a.uid.toLowerCase() === cleanTarget.toLowerCase()
      );

      if (targetUser) {
        matchedAccounts.push(targetUser);
        targetUser.ipAddresses.forEach((ip) => relatedIpsSet.add(ip.ip));

        // Find other accounts sharing these IPs or similar subnets
        const targetIps = targetUser.ipAddresses.map((i) => i.ip);
        const targetSubnets = targetIps.map((ip) => ip.split('.').slice(0, 3).join('.'));
        const targetUserAgents = targetUser.userAgents.map((ua) => ua.raw);

        allAccountsList.forEach((acc: CheckUserAccountDetails) => {
          if (acc.uid !== targetUser.uid) {
            const hasDirectIp = acc.ipAddresses.some((ip) => targetIps.includes(ip.ip));
            const hasSubnetMatch = acc.ipAddresses.some((ip) =>
              targetSubnets.some((sub) => ip.ip.startsWith(sub))
            );
            const hasUaMatch = acc.userAgents.some((ua) => targetUserAgents.includes(ua.raw));
            const hasFlaggedSockpuppet = acc.sockpuppetOf?.toLowerCase() === targetUser.username.toLowerCase();

            if (hasDirectIp || hasSubnetMatch || hasFlaggedSockpuppet || (hasUaMatch && hasSubnetMatch)) {
              matchedAccounts.push(acc);
              acc.ipAddresses.forEach((ip) => relatedIpsSet.add(ip.ip));

              if (hasDirectIp || hasFlaggedSockpuppet) {
                detectedSockpuppetsSet.add(acc.username);
              }
            }
          }
        });

        // Generate evidence notes
        if (targetIps.length > 0) {
          evidenceNotes.push(`Alvo verificado possui ${targetIps.length} endereço(s) IP registrado(s): ${targetIps.join(', ')}.`);
        }
        if (detectedSockpuppetsSet.size > 0) {
          evidenceNotes.push(`Identificadas ${detectedSockpuppetsSet.size} conta(s) com correspondência direta de rede/IP ou confissão técnica: ${Array.from(detectedSockpuppetsSet).join(', ')}.`);
        } else {
          evidenceNotes.push('Nenhuma correlação crítica imediata de endereço IP exclusivo identificada nesta consulta.');
        }
      }
    } else if (targetType === 'ip') {
      allAccountsList.forEach((acc: CheckUserAccountDetails) => {
        const matches = acc.ipAddresses.some((ip) => ip.ip === cleanTarget);
        if (matches) {
          matchedAccounts.push(acc);
          relatedIpsSet.add(cleanTarget);
          acc.ipAddresses.forEach((ip) => relatedIpsSet.add(ip.ip));
        }
      });
      evidenceNotes.push(`Busca por endereço IP exato "${cleanTarget}" encontrou ${matchedAccounts.length} conta(s) associada(s).`);
    } else if (targetType === 'cidr') {
      const baseSubnet = cleanTarget.replace('/24', '').replace('/16', '').trim();
      const subnetPrefix = baseSubnet.split('.').slice(0, 3).join('.');

      allAccountsList.forEach((acc: CheckUserAccountDetails) => {
        const matches = acc.ipAddresses.some((ip) => ip.ip.startsWith(subnetPrefix));
        if (matches) {
          matchedAccounts.push(acc);
          acc.ipAddresses.forEach((ip) => relatedIpsSet.add(ip.ip));
        }
      });
      evidenceNotes.push(`Busca por faixa CIDR "${cleanTarget}" (sub-rede ${subnetPrefix}.0/24) localizou ${matchedAccounts.length} conta(s).`);
    }

    // Correlation calculation
    let correlationScore = 0;
    if (matchedAccounts.length >= 2) {
      correlationScore = 85;
      if (detectedSockpuppetsSet.size > 0) correlationScore = 98;
    } else if (matchedAccounts.length === 1) {
      correlationScore = 15;
    }

    // Save query log
    const queryLog = await this.logCheckUserQuery({
      target: cleanTarget,
      targetType,
      reason,
      performedBy: performedBy.displayName || performedBy.username || performedBy.email.split('@')[0],
      performedByRole: performedBy.role,
      resultsFound: matchedAccounts.length,
    });

    // Also log in UserAuditLog if username
    this.logUserAuditAction(
      cleanTarget,
      cleanTarget,
      'checkuser_query',
      `Consulta CheckUser realizada (Tipo: ${targetType}). Motivo: "${reason}". Resultados: ${matchedAccounts.length} conta(s).`,
      performedBy
    );

    return {
      matchedAccounts,
      relatedIps: Array.from(relatedIpsSet),
      correlationScore,
      detectedSockpuppets: Array.from(detectedSockpuppetsSet),
      evidenceNotes,
      queryLog,
    };
  },

  async flagAccountAsSockpuppet(
    targetUid: string,
    masterUsername: string,
    adminProfile: UserProfile
  ): Promise<void> {
    // Update community users list
    const users = await this.getCommunityUsers();
    const user = users.find((u) => u.uid === targetUid);
    if (user) {
      user.isBanned = true;
      user.banType = 'permanente';
      user.banReason = `Conta fantoche confirmada (Sockpuppet de ${masterUsername}).`;
      
      const badgeTemplate = `{{Fantoche|${masterUsername}}}\n`;
      if (!user.bio?.includes('{{Fantoche')) {
        user.bio = badgeTemplate + (user.bio || 'Conta bloqueada indefinidamente por uso ilícito de contas múltiplas.');
      }
      
      await this.updateCommunityUser(user);
    }

    // Update CheckUser accounts cache
    const accounts = await this.getAllCheckUserAccounts();
    if (accounts[targetUid]) {
      accounts[targetUid].isBanned = true;
      accounts[targetUid].isSockpuppet = true;
      accounts[targetUid].sockpuppetOf = masterUsername;
      accounts[targetUid].banReason = `Fantoche (Sockpuppet) de ${masterUsername}.`;
      localStorage.setItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS, JSON.stringify(accounts));
    }

    // Add user audit log
    this.logUserAuditAction(
      targetUid,
      user ? user.username : targetUid,
      'sockpuppet_flagged',
      `Conta identificada e marcada formalmente como fantoche (Sockpuppet) de ${masterUsername}. Predefinição {{Fantoche}} aplicada.`,
      adminProfile
    );

    // Send talk page message
    if (user) {
      this.addUserTalkMessage(
        targetUid,
        user.username,
        {
          titulo: `🛑 Notificação de Bloqueio por Fantochada (Sockpuppetry)`,
          conteudo: `Sua conta foi identificada por verificação técnica CheckUser como um fantoche (sockpuppet) associado à conta principal [[User:${masterUsername}|${masterUsername}]], violando as políticas da WikiZero contra evasão de sanções e falsificação de consenso. Esta conta foi suspensa permanentemente.`,
          tipo: 'aviso_admin',
        },
        adminProfile
      );
    }
  },

  async unflagAccountAsSockpuppet(targetUid: string, adminProfile: UserProfile): Promise<void> {
    const users = await this.getCommunityUsers();
    const user = users.find((u) => u.uid === targetUid);
    if (user) {
      user.isBanned = false;
      user.banReason = undefined;
      user.banType = undefined;
      user.bio = (user.bio || '').replace(/\{\{Fantoche\|.*?\}\}\n?/g, '');
      await this.updateCommunityUser(user);
    }

    const accounts = await this.getAllCheckUserAccounts();
    if (accounts[targetUid]) {
      accounts[targetUid].isBanned = false;
      accounts[targetUid].isSockpuppet = false;
      accounts[targetUid].sockpuppetOf = undefined;
      accounts[targetUid].banReason = undefined;
      localStorage.setItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS, JSON.stringify(accounts));
    }

    this.logUserAuditAction(
      targetUid,
      user ? user.username : targetUid,
      'sockpuppet_unflagged',
      'Remoção de marcação de fantoche e desbanimento da conta após apuração ou recurso aceito.',
      adminProfile
    );
  },

  async bulkBanSockpuppets(
    targetUids: string[],
    masterUsername: string,
    reason: string,
    adminProfile: UserProfile
  ): Promise<number> {
    let count = 0;
    for (const uid of targetUids) {
      await this.flagAccountAsSockpuppet(uid, masterUsername, adminProfile);
      count++;
    }
    return count;
  },

  // === UNBLOCK REQUESTS (PEDIDOS DE DESBLOQUEIO DE CONTAS) ===
  async getUnblockRequests(): Promise<UnblockRequest[]> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.UNBLOCK_REQUESTS);
    if (!raw) return INITIAL_UNBLOCK_REQUESTS;
    try {
      const parsed: UnblockRequest[] = JSON.parse(raw);
      return parsed;
    } catch {
      return INITIAL_UNBLOCK_REQUESTS;
    }
  },

  async getUnblockRequestById(id: string): Promise<UnblockRequest | null> {
    const list = await this.getUnblockRequests();
    return list.find((req) => req.id === id) || null;
  },

  async getUnblockRequestsForUser(userUidOrUsername: string): Promise<UnblockRequest[]> {
    const list = await this.getUnblockRequests();
    const clean = userUidOrUsername.toLowerCase().trim();
    return list.filter(
      (req) =>
        req.userUid.toLowerCase() === clean ||
        req.username.toLowerCase() === clean ||
        (req.email && req.email.toLowerCase() === clean)
    );
  },

  async createUnblockRequest(
    requestData: Omit<UnblockRequest, 'id' | 'requestedAt' | 'status' | 'comments'> & {
      id?: string;
      requestedAt?: string;
    }
  ): Promise<UnblockRequest> {
    const list = await this.getUnblockRequests();
    const newRequest: UnblockRequest = {
      id: requestData.id || `unb-${Date.now().toString().slice(-4)}`,
      userUid: requestData.userUid,
      username: requestData.username,
      displayName: requestData.displayName || requestData.username,
      email: requestData.email,
      userRoleAtBan: requestData.userRoleAtBan || 'leitor',
      blockReason: requestData.blockReason || 'Suspensão por violação de conduta.',
      blockedBy: requestData.blockedBy || 'Administração',
      blockedAt: requestData.blockedAt || new Date().toISOString(),
      requestedAt: requestData.requestedAt || new Date().toISOString(),
      category: requestData.category || 'outro',
      appealJustification: requestData.appealJustification.trim(),
      commitmentToGuidelines: requestData.commitmentToGuidelines.trim(),
      ipAddress: requestData.ipAddress,
      status: 'pendente',
      urgency: requestData.urgency || 'media',
      comments: [],
      linkedSockpuppetCaseId: requestData.linkedSockpuppetCaseId,
      checkUserSummary: requestData.checkUserSummary,
    };

    list.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'unblock_requests', newRequest.id), {
          ...newRequest,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore createUnblockRequest background sync error:', err);
      }
    }

    this.logUserAuditAction(
      newRequest.userUid,
      newRequest.username,
      'unblock_request_submitted',
      `Solicitação de desbloqueio #${newRequest.id} submetida pelo usuário. Categoria: ${newRequest.category}.`,
      null
    );

    return newRequest;
  },

  async updateUnblockRequest(
    id: string,
    updates: Partial<UnblockRequest>
  ): Promise<UnblockRequest | null> {
    const list = await this.getUnblockRequests();
    const index = list.findIndex((req) => req.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
    };

    list[index] = updated;
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'unblock_requests', id), {
          ...updated,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore updateUnblockRequest error:', err);
      }
    }

    return updated;
  },

  async evaluateUnblockRequest(
    id: string,
    decision: 'unblock_full' | 'unblock_probationary' | 'rejected' | 'requested_more_info',
    notes: string,
    reviewer: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: UnblockRequest }> {
    const req = await this.getUnblockRequestById(id);
    if (!req) return { success: false, message: 'Solicitação não encontrada.' };

    const reviewerName = reviewer.displayName || reviewer.username || reviewer.email.split('@')[0];
    const reviewerRole = reviewer.role || 'moderador';
    const nowIso = new Date().toISOString();

    let newStatus: UnblockRequestStatus = 'em_analise';
    let successMessage = '';

    if (decision === 'unblock_full') {
      newStatus = 'aprovado';
      // 1. Unban user in profiles
      await this.unbanUser(req.userUid, reviewer);
      // 2. Unflag from CheckUser if exists
      await this.unflagSockpuppet(req.userUid, reviewer);

      // 3. Post notification to user's talk page
      this.addUserTalkMessage(
        req.userUid,
        req.username,
        {
          titulo: `✅ Solicitação de Desbloqueio #${req.id} APROVADA`,
          conteudo: `Sua solicitação de recurso foi avaliada e '''APROVADA''' pelo moderador '''${reviewerName}'''.\n\n'''Parecer da Moderação:'''\n${notes.trim()}\n\nSuas permissões editoriais foram integralmente restauradas. Seja bem-vindo de volta à WikiZero!`,
          tipo: 'aviso_admin',
        },
        reviewer
      );

      this.logUserAuditAction(
        req.userUid,
        req.username,
        'unblock_request_evaluated',
        `Recurso #${req.id} APROVADO com desbloqueio total por ${reviewerName}. Parecer: ${notes}`,
        reviewer
      );

      successMessage = `Conta de ${req.username} desbloqueada com sucesso! Permissões restabelecidas.`;
    } else if (decision === 'unblock_probationary') {
      newStatus = 'aprovado';
      // Unban and apply probationary permissions
      await this.unbanUser(req.userUid, reviewer);
      await this.updateUserPermissions(
        req.userUid,
        {
          canEdit: true,
          canCreate: false,
          canTalk: true,
          canDelete: false,
          canGrantBarnstars: false,
        },
        reviewer
      );

      this.addUserTalkMessage(
        req.userUid,
        req.username,
        {
          titulo: `🟡 Desbloqueio Condicional / Probatório #${req.id}`,
          conteudo: `Seu pedido de desbloqueio foi aceito sob '''Regime Probatório supervisionado'''.\n\n'''Parecer e Condições:'''\n${notes.trim()}\n\nVocê poderá editar artigos existentes e participar de discussões, mas a criação de novas páginas permanece temporariamente restrita.`,
          tipo: 'aviso_admin',
        },
        reviewer
      );

      this.logUserAuditAction(
        req.userUid,
        req.username,
        'unblock_request_evaluated',
        `Recurso #${req.id} APROVADO sob regime probatório por ${reviewerName}. Parecer: ${notes}`,
        reviewer
      );

      successMessage = `Conta de ${req.username} desbloqueada sob período probatório supervisionado.`;
    } else if (decision === 'rejected') {
      newStatus = 'recusado';

      this.addUserTalkMessage(
        req.userUid,
        req.username,
        {
          titulo: `❌ Solicitação de Desbloqueio #${req.id} INDEFERIDA`,
          conteudo: `Sua solicitação de desbloqueio foi avaliada e '''INDEFERIDA''' pelo corpo de moderação (${reviewerName}).\n\n'''Fundamentação do Indeferimento:'''\n${notes.trim()}\n\nConforme as políticas da WikiZero, um novo recurso poderá ser protocolado após decorrido o prazo regulamentar.`,
          tipo: 'aviso_admin',
        },
        reviewer
      );

      this.logUserAuditAction(
        req.userUid,
        req.username,
        'unblock_request_evaluated',
        `Recurso #${req.id} INDEFERIDO por ${reviewerName}. Motivo: ${notes}`,
        reviewer
      );

      successMessage = `Solicitação de desbloqueio indeferida. Bloqueio mantido.`;
    } else if (decision === 'requested_more_info') {
      newStatus = 'em_analise';

      this.addUserTalkMessage(
        req.userUid,
        req.username,
        {
          titulo: `🔍 Solicitação de Esclarecimentos - Recurso #${req.id}`,
          conteudo: `O moderador '''${reviewerName}''' analisou sua solicitação e requisitou os seguintes esclarecimentos antes do veredito final:\n\n''"${notes.trim()}"''\n\nPor favor, responda a este tópico ou adicione sua tréplica no formulário de recurso.`,
          tipo: 'aviso_admin',
        },
        reviewer
      );

      this.logUserAuditAction(
        req.userUid,
        req.username,
        'unblock_request_evaluated',
        `Solicitados esclarecimentos adicionais para o recurso #${req.id} por ${reviewerName}.`,
        reviewer
      );

      successMessage = `Pedido marcado como "Em Análise" e solicitação de esclarecimentos enviada ao usuário.`;
    }

    const updated = await this.updateUnblockRequest(id, {
      status: newStatus,
      resolutionDecision: decision,
      resolutionNotes: notes.trim(),
      reviewedBy: reviewerName,
      reviewedByRole: reviewerRole,
      reviewedAt: nowIso,
    });

    return {
      success: true,
      message: successMessage,
      updatedRequest: updated || undefined,
    };
  },

  async addCommentToUnblockRequest(
    requestId: string,
    text: string,
    author: UserProfile,
    isInternalNote: boolean = true
  ): Promise<UnblockAppealComment | null> {
    const req = await this.getUnblockRequestById(requestId);
    if (!req) return null;

    const newComment: UnblockAppealComment = {
      id: 'comm-' + Date.now(),
      author: author.displayName || author.username || author.email.split('@')[0],
      authorRole: author.role || 'moderador',
      authorUid: author.uid,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isInternalModeratorNote: isInternalNote,
    };

    const updatedComments = [...(req.comments || []), newComment];
    await this.updateUnblockRequest(requestId, { comments: updatedComments });
    return newComment;
  },

  // === PROMOTION REQUESTS (PEDIDOS DE PROMOÇÃO / RFA COM VOTAÇÃO DE ATÉ 10 VOTOS) ===
  async getPromotionRequests(): Promise<PromotionRequest[]> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.PROMOTION_REQUESTS);
    if (!raw) return INITIAL_PROMOTION_REQUESTS;
    try {
      const parsed: PromotionRequest[] = JSON.parse(raw);
      return parsed;
    } catch {
      return INITIAL_PROMOTION_REQUESTS;
    }
  },

  async getPromotionRequestById(id: string): Promise<PromotionRequest | null> {
    const list = await this.getPromotionRequests();
    return list.find((req) => req.id === id) || null;
  },

  async savePromotionRequest(req: PromotionRequest): Promise<PromotionRequest> {
    const list = await this.getPromotionRequests();
    const index = list.findIndex((r) => r.id === req.id);
    if (index >= 0) {
      list[index] = req;
    } else {
      list.unshift(req);
    }
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'promotion_requests', req.id), {
          ...req,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore savePromotionRequest background error:', err);
      }
    }
    return req;
  },

  async createPromotionRequest(data: {
    candidateUid: string;
    candidateUsername: string;
    candidateDisplayName: string;
    candidateEmail?: string;
    currentRole: UserRole;
    targetRole: PromotionTargetRole;
    statement: string;
    contributionsSummary: string;
    isSelfNomination?: boolean;
    nominatedBy?: string;
    nominatedByUid?: string;
    requiredApprovalRate?: number;
  }, creator: UserProfile): Promise<{ success: boolean; message: string; request?: PromotionRequest }> {
    if (creator.isBanned) {
      return { success: false, message: 'Usuários bloqueados não podem criar pedidos de promoção.' };
    }

    const list = await this.getPromotionRequests();
    
    // Check if candidate already has an active voting
    const activeExisting = list.find(
      (r) =>
        r.candidateUid === data.candidateUid &&
        r.targetRole === data.targetRole &&
        r.status === 'em_votacao'
    );
    if (activeExisting) {
      return {
        success: false,
        message: `Já existe uma candidatura em votação ativa para este usuário no cargo de ${data.targetRole}.`,
      };
    }

    const newId = `rfa-${Date.now()}`;
    const requiredRate = data.requiredApprovalRate || (data.targetRole === 'admin' ? 75 : 60);

    const newRequest: PromotionRequest = {
      id: newId,
      candidateUid: data.candidateUid,
      candidateUsername: data.candidateUsername,
      candidateDisplayName: data.candidateDisplayName,
      candidateEmail: data.candidateEmail,
      currentRole: data.currentRole,
      targetRole: data.targetRole,
      nominatedBy: data.nominatedBy || creator.displayName || creator.username,
      nominatedByUid: data.nominatedByUid || creator.uid,
      isSelfNomination: data.isSelfNomination ?? (data.candidateUid === creator.uid),
      statement: data.statement.trim(),
      contributionsSummary: data.contributionsSummary.trim(),
      requestedAt: new Date().toISOString(),
      status: 'em_votacao',
      maxVotes: 10,
      votes: [],
      requiredApprovalRate: requiredRate,
    };

    await this.savePromotionRequest(newRequest);

    // Audit log
    this.logUserAuditAction(
      data.candidateUid,
      data.candidateDisplayName,
      'promotion_created',
      `Nova candidatura comunitária para promoção a ${data.targetRole.toUpperCase()} iniciada (Limite: 10 votos). Proponente: ${newRequest.nominatedBy}.`,
      creator
    );

    // Notify candidate on Talk page if nominated by another user
    if (!newRequest.isSelfNomination) {
      this.addUserTalkMessage(
        data.candidateUid,
        data.candidateDisplayName,
        {
          titulo: `🏛️ Nomeação para ${data.targetRole === 'admin' ? 'Administrador' : 'Moderador'} da WikiZero`,
          conteudo: `Você foi formalmente indicado por '''${newRequest.nominatedBy}''' para o cargo de '''${
            data.targetRole === 'admin' ? 'Administrador (Sysop)' : 'Moderador'
          }'''. A votação comunitária de até 10 votos já está aberta na página [[Special:PromotionRequests|Pedidos de Promoção]].`,
          tipo: 'geral',
        },
        creator
      );
    }

    return {
      success: true,
      message: 'Candidatura registrada com sucesso! A votação comunitária de até 10 votos está aberta.',
      request: newRequest,
    };
  },

  async castPromotionVote(
    requestId: string,
    vote: PromotionVoteType,
    reason: string,
    voter: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: PromotionRequest }> {
    if (!voter || voter.isGuest) {
      return { success: false, message: 'É necessário estar autenticado com uma conta registrada para votar.' };
    }
    if (voter.isBanned) {
      return { success: false, message: 'Usuários com sanções ativas ou bloqueados não possuem direito a voto.' };
    }

    const cleanReason = (reason || '').trim();
    if (cleanReason.length < 8) {
      return {
        success: false,
        message: 'O motivo do voto é obrigatório e deve conter ao menos 8 caracteres explicando sua justificativa.',
      };
    }

    const req = await this.getPromotionRequestById(requestId);
    if (!req) {
      return { success: false, message: 'Pedido de promoção não encontrado.' };
    }

    if (req.status !== 'em_votacao') {
      return { success: false, message: 'Esta votação já se encontra encerrada e não aceita novos votos.' };
    }

    // Check if voter is the candidate themselves
    if (voter.uid === req.candidateUid && vote !== 'neutro') {
      return {
        success: false,
        message: 'O próprio candidato não pode votar a favor ou contra em sua própria eleição (apenas abstenção neutra é permitida).',
      };
    }

    const existingVoteIndex = req.votes.findIndex(
      (v) => v.voterUid === voter.uid || (v.voterUsername && v.voterUsername.toLowerCase() === voter.username.toLowerCase())
    );

    const isUpdating = existingVoteIndex >= 0;

    // If new vote and already has 10 votes, reject
    if (!isUpdating && req.votes.length >= req.maxVotes) {
      return {
        success: false,
        message: `Esta votação já atingiu o quórum máximo estrito de ${req.maxVotes} votos comunitários.`,
      };
    }

    const voterName = voter.displayName || voter.username || voter.email.split('@')[0];
    const voteEntry: PromotionVote = {
      id: isUpdating ? req.votes[existingVoteIndex].id : 'pvote-' + Date.now(),
      voterUid: voter.uid,
      voterUsername: voter.username,
      voterDisplayName: voterName,
      voterRole: voter.role,
      vote,
      reason: cleanReason,
      timestamp: new Date().toISOString(),
    };

    let updatedVotes = [...req.votes];
    if (isUpdating) {
      updatedVotes[existingVoteIndex] = voteEntry;
    } else {
      updatedVotes.push(voteEntry);
    }

    const updatedRequest: PromotionRequest = {
      ...req,
      votes: updatedVotes,
    };

    await this.savePromotionRequest(updatedRequest);

    // Audit log
    this.logUserAuditAction(
      req.candidateUid,
      req.candidateDisplayName,
      'promotion_voted',
      `Voto computado em RFA (${updatedVotes.length}/${req.maxVotes}): ${voterName} votou ${
        vote === 'a_favor' ? 'A FAVOR' : vote === 'contra' ? 'CONTRA' : 'NEUTRO'
      }. Motivo: "${cleanReason.slice(0, 60)}${cleanReason.length > 60 ? '...' : ''}"`,
      voter
    );

    const voteLabel = vote === 'a_favor' ? 'a favor' : vote === 'contra' ? 'contra' : 'neutro';
    return {
      success: true,
      message: isUpdating
        ? `Seu voto e justificativa foram atualizados com sucesso (${updatedVotes.length}/${req.maxVotes} votos).`
        : `Seu voto ${voteLabel} foi registrado com sucesso (${updatedVotes.length}/${req.maxVotes} votos comunitários computados).`,
      updatedRequest,
    };
  },

  async concludePromotionRequest(
    requestId: string,
    decision: 'aprovada' | 'rejeitada',
    resolutionNotes: string,
    executor: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: PromotionRequest }> {
    const isBureaucrat =
      executor.role === 'admin' || executor.email === 'pedrohenriquecardonaperes@gmail.com';

    if (!isBureaucrat) {
      return {
        success: false,
        message: 'Apenas Administradores e Burocratas podem homologar ou indeferir pedidos de promoção.',
      };
    }

    const req = await this.getPromotionRequestById(requestId);
    if (!req) {
      return { success: false, message: 'Pedido de promoção não encontrado.' };
    }

    const notes = (resolutionNotes || '').trim() || (decision === 'aprovada'
      ? `Candidatura homologada após deliberação comunitária (${req.votes.filter(v => v.vote === 'a_favor').length} a favor de ${req.votes.length} votos).`
      : 'Candidatura indeferida por não atingir quórum ou taxa de aprovação necessária.');

    const updatedRequest: PromotionRequest = {
      ...req,
      status: decision,
      closedAt: new Date().toISOString(),
      closedBy: executor.displayName || executor.username,
      closedByRole: executor.role,
      resolutionNotes: notes,
    };

    // If approved, update candidate role!
    if (decision === 'aprovada') {
      await this.updateUserRole(req.candidateUid, req.targetRole, executor);

      // Award official promotion barnstar
      const barnstarTitle =
        req.targetRole === 'admin'
          ? 'Medalha do Estatuto de Administrador (Sysop)'
          : 'Medalha do Estatuto de Moderador';
      
      const barnstarDesc =
        req.targetRole === 'admin'
          ? 'Concedida em reconhecimento à homologação pelo quórum comunitário como Administrador da WikiZero.'
          : 'Concedida em reconhecimento à homologação pelo quórum comunitário como Moderador da WikiZero.';

      await this.awardBarnstar(
        req.candidateUid,
        {
          title: barnstarTitle,
          description: barnstarDesc,
          icon: req.targetRole === 'admin' ? '👑' : '🛡️',
        },
        executor
      );

      // Send congratulations message on user talk page
      this.addUserTalkMessage(
        req.candidateUid,
        req.candidateDisplayName,
        {
          titulo: `🎉 Parabéns! Promoção a ${req.targetRole === 'admin' ? 'Administrador' : 'Moderador'} Homologada`,
          conteudo: `Prezado(a) '''${req.candidateDisplayName}''',\n\nÉ com grande satisfação que informamos que sua candidatura ao estatuto de '''${
            req.targetRole === 'admin' ? 'Administrador (Sysop)' : 'Moderador'
          }''' foi formalmente '''APROVADA E HOMOLOGADA''' pelo corpo de burocratas da WikiZero após deliberação comunitária.\n\n'''Resultado da Votação:''' ${
            req.votes.filter((v) => v.vote === 'a_favor').length
          } votos a favor, ${req.votes.filter((v) => v.vote === 'contra').length} contra e ${
            req.votes.filter((v) => v.vote === 'neutro').length
          } neutros.\n\n'''Parecer da Homologação:''' ${notes}\n\nSuas novas ferramentas já foram habilitadas na plataforma. Faça bom uso dos novos poderes e continue zelando pela integridade do nosso conhecimento livre!`,
          tipo: 'boas_vindas',
        },
        executor
      );
    } else {
      // Send encouragement message on talk page
      this.addUserTalkMessage(
        req.candidateUid,
        req.candidateDisplayName,
        {
          titulo: `📋 Notificação de Encerramento de Candidatura (${req.targetRole.toUpperCase()})`,
          conteudo: `Prezado(a) '''${req.candidateDisplayName}''',\n\nSua recente candidatura ao estatuto de ${req.targetRole} foi encerrada sem homologação no momento.\n\n'''Parecer:''' ${notes}\n\nAgradecemos profundamente sua dedicação à WikiZero e encorajamos a continuidade de suas contribuições para submissão de nova candidatura no futuro.`,
          tipo: 'aviso_admin',
        },
        executor
      );
    }

    await this.savePromotionRequest(updatedRequest);

    // Audit log
    this.logUserAuditAction(
      req.candidateUid,
      req.candidateDisplayName,
      'promotion_concluded',
      `Candidatura a ${req.targetRole.toUpperCase()} finalizada com status [${decision.toUpperCase()}]. Homologador: ${executor.displayName || executor.username}. Parecer: ${notes}`,
      executor
    );

    return {
      success: true,
      message: decision === 'aprovada'
        ? `Promoção a ${req.targetRole.toUpperCase()} homologada com sucesso! O cargo do usuário foi atualizado.`
        : 'Candidatura finalizada e indeferida.',
      updatedRequest,
    };
  },

  async deletePromotionRequest(requestId: string): Promise<boolean> {
    const list = await this.getPromotionRequests();
    const filtered = list.filter((r) => r.id !== requestId);
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(filtered));

    if (firebaseActive && db) {
      try {
        await deleteDoc(doc(db, 'promotion_requests', requestId));
      } catch (err) {
        console.warn('Firestore deletePromotionRequest error:', err);
      }
    }
    return true;
  },

  // === ADMIN CONTACT TICKETS (FALE COM A ADMINISTRAÇÃO / CENTRAL DE AJUDA & DENÚNCIAS) ===
  async getAdminTickets(): Promise<AdminContactTicket[]> {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS);
    if (!raw) return INITIAL_ADMIN_TICKETS;
    try {
      const parsed: AdminContactTicket[] = JSON.parse(raw);
      return parsed;
    } catch {
      return INITIAL_ADMIN_TICKETS;
    }
  },

  async getAdminTicketById(id: string): Promise<AdminContactTicket | null> {
    const list = await this.getAdminTickets();
    return list.find((t) => t.id === id) || null;
  },

  async saveAdminTicket(ticket: AdminContactTicket): Promise<AdminContactTicket> {
    const list = await this.getAdminTickets();
    const index = list.findIndex((t) => t.id === ticket.id);
    if (index >= 0) {
      list[index] = ticket;
    } else {
      list.unshift(ticket);
    }
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'admin_tickets', ticket.id), {
          ...ticket,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore saveAdminTicket background error:', err);
      }
    }
    return ticket;
  },

  async createAdminTicket(
    data: {
      subject: string;
      category: AdminTicketCategory;
      priority: AdminTicketPriority;
      description: string;
      relatedArticleTitle?: string;
      relatedArticleId?: string;
      evidenceLinks?: string[];
      guestName?: string;
      guestEmail?: string;
    },
    creator?: UserProfile | null
  ): Promise<{ success: boolean; message: string; ticket?: AdminContactTicket }> {
    const isGuest = !creator || creator.isGuest;
    const cleanSubject = data.subject.trim();
    const cleanDesc = data.description.trim();

    if (cleanSubject.length < 5) {
      return { success: false, message: 'O assunto do chamado deve conter ao menos 5 caracteres.' };
    }
    if (cleanDesc.length < 15) {
      return { success: false, message: 'A descrição e detalhes do chamado devem conter ao menos 15 caracteres.' };
    }

    const ticketId = `ticket-${Date.now()}`;
    const userUid = isGuest ? `guest-${Date.now().toString(36)}` : creator.uid;
    const username = isGuest
      ? (data.guestName ? data.guestName.trim().replace(/\s+/g, '_') : 'Anonimo_' + Math.floor(Math.random() * 9000 + 1000))
      : creator.username;
    const displayName = isGuest
      ? (data.guestName?.trim() || 'Visitante Anônimo')
      : (creator.displayName || creator.username);
    const email = isGuest ? data.guestEmail?.trim() : creator.email;
    const role: UserRole = isGuest ? 'convidado' : creator.role;

    const initialMessage: AdminTicketMessage = {
      id: `msg-${Date.now()}`,
      senderUid: userUid,
      senderName: displayName,
      senderRole: role,
      isStaff: role === 'admin' || role === 'moderador',
      message: cleanDesc,
      timestamp: new Date().toISOString(),
    };

    const newTicket: AdminContactTicket = {
      id: ticketId,
      subject: cleanSubject,
      category: data.category,
      priority: data.priority,
      status: 'aberto',
      userUid,
      userUsername: username,
      userDisplayName: displayName,
      userEmail: email,
      userRole: role,
      isGuestSubmission: isGuest,
      relatedArticleTitle: data.relatedArticleTitle?.trim() || undefined,
      relatedArticleId: data.relatedArticleId?.trim() || undefined,
      description: cleanDesc,
      evidenceLinks: data.evidenceLinks?.filter((l) => l.trim().length > 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedAdmin: 'WazzimaGiygg',
      assignedAdminUid: 'user-wazzima',
      messages: [initialMessage],
    };

    await this.saveAdminTicket(newTicket);

    // Audit log if creator is registered
    if (creator && !creator.isGuest) {
      this.logUserAuditAction(
        creator.uid,
        creator.displayName || creator.username,
        'other',
        `Abertura de chamado para a Administração [#${ticketId.slice(-6)}]: "${cleanSubject.slice(0, 50)}..." [Categoria: ${data.category.toUpperCase()}]`,
        creator
      );
    }

    return {
      success: true,
      message: 'Seu chamado foi enviado à equipe de administração da WikiZero com sucesso! Você receberá atualizações nesta central.',
      ticket: newTicket,
    };
  },

  async addAdminTicketMessage(
    ticketId: string,
    messageText: string,
    sender: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const cleanText = (messageText || '').trim();
    if (cleanText.length < 3) {
      return { success: false, message: 'A mensagem deve conter ao menos 3 caracteres.' };
    }

    const ticket = await this.getAdminTicketById(ticketId);
    if (!ticket) {
      return { success: false, message: 'Chamado não encontrado.' };
    }

    const isStaff =
      sender.role === 'admin' ||
      sender.role === 'moderador' ||
      sender.email === 'pedrohenriquecardonaperes@gmail.com';

    const newMessage: AdminTicketMessage = {
      id: `msg-${Date.now()}`,
      senderUid: sender.uid,
      senderName: sender.displayName || sender.username || sender.email.split('@')[0],
      senderRole: sender.role,
      isStaff,
      message: cleanText,
      timestamp: new Date().toISOString(),
    };

    // If staff answers an open ticket, update status to 'respondido' or 'em_analise'
    let newStatus = ticket.status;
    if (isStaff && ticket.status === 'aberto') {
      newStatus = 'respondido';
    } else if (!isStaff && ticket.status === 'respondido') {
      newStatus = 'em_analise';
    }

    const updatedTicket: AdminContactTicket = {
      ...ticket,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      messages: [...ticket.messages, newMessage],
    };

    await this.saveAdminTicket(updatedTicket);

    // If staff answered, notify the user talk page if registered
    if (isStaff && ticket.userUid && !ticket.isGuestSubmission) {
      this.addUserTalkMessage(
        ticket.userUid,
        ticket.userDisplayName,
        {
          titulo: `💬 Resposta da Administração no Chamado #${ticket.id.slice(-6)}`,
          conteudo: `Olá '''${ticket.userDisplayName}''',\n\nA equipe de administração da WikiZero enviou uma nova resposta ao seu chamado '''"${ticket.subject}"''':\n\n> ''${cleanText}''\n\nVocê pode acompanhar ou dar continuidade à conversa na página [[Special:ContactAdmin|Falar com a Administração]].`,
          tipo: 'aviso_admin',
        },
        sender
      );
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso.',
      updatedTicket,
    };
  },

  async updateAdminTicketStatus(
    ticketId: string,
    status: AdminTicketStatus,
    resolutionSummary: string | undefined,
    admin: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const isStaff =
      admin.role === 'admin' ||
      admin.role === 'moderador' ||
      admin.email === 'pedrohenriquecardonaperes@gmail.com';

    if (!isStaff) {
      return { success: false, message: 'Apenas moderadores e administradores podem atualizar o status de chamados.' };
    }

    const ticket = await this.getAdminTicketById(ticketId);
    if (!ticket) {
      return { success: false, message: 'Chamado não encontrado.' };
    }

    const now = new Date().toISOString();
    const isClosing = status === 'resolvido' || status === 'arquivado';

    const updatedTicket: AdminContactTicket = {
      ...ticket,
      status,
      updatedAt: now,
      closedAt: isClosing ? now : undefined,
      resolutionSummary: resolutionSummary?.trim() || ticket.resolutionSummary,
    };

    await this.saveAdminTicket(updatedTicket);

    // System audit
    this.logUserAuditAction(
      ticket.userUid,
      ticket.userDisplayName,
      'other',
      `Status do chamado #${ticket.id.slice(-6)} alterado para [${status.toUpperCase()}] por ${admin.displayName || admin.username}. ${resolutionSummary ? `Resolução: ${resolutionSummary}` : ''}`,
      admin
    );

    return {
      success: true,
      message: `Status do chamado alterado para "${status}" com sucesso.`,
      updatedTicket,
    };
  },

  async assignAdminTicket(
    ticketId: string,
    adminUid: string,
    adminName: string,
    assigner: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const ticket = await this.getAdminTicketById(ticketId);
    if (!ticket) return { success: false, message: 'Chamado não encontrado.' };

    const updatedTicket: AdminContactTicket = {
      ...ticket,
      assignedAdmin: adminName,
      assignedAdminUid: adminUid,
      updatedAt: new Date().toISOString(),
    };

    await this.saveAdminTicket(updatedTicket);
    return {
      success: true,
      message: `Chamado atribuído a ${adminName}.`,
      updatedTicket,
    };
  },

  async deleteAdminTicket(ticketId: string, admin: UserProfile): Promise<boolean> {
    const isStaff =
      admin.role === 'admin' ||
      admin.role === 'moderador' ||
      admin.email === 'pedrohenriquecardonaperes@gmail.com';

    if (!isStaff) return false;

    const list = await this.getAdminTickets();
    const filtered = list.filter((t) => t.id !== ticketId);
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(filtered));

    if (firebaseActive && db) {
      try {
        await deleteDoc(doc(db, 'admin_tickets', ticketId));
      } catch (err) {
        console.warn('Firestore deleteAdminTicket error:', err);
      }
    }
    return true;
  },

  // ========================================================
  // CONSELHO DE ARBITRAGEM (ARBCOM) - MÉTODOS DE ARMAZENAMENTO
  // ========================================================

  async getArbitrationCases(langCode?: string): Promise<ArbitrationCase[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'arbitration_cases'));
        if (!snap.empty) {
          const list: ArbitrationCase[] = [];
          snap.forEach((d) => list.push(d.data() as ArbitrationCase));
          localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(list));
          if (langCode && langCode !== 'all') {
            return list.filter((c) => c.langCode.toLowerCase() === langCode.toLowerCase());
          }
          return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      } catch (err) {
        console.warn('Firestore getArbitrationCases error, fallback to localStorage:', err);
      }
    }

    const local: ArbitrationCase[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ARBITRATION_CASES) || '[]'
    );
    if (langCode && langCode !== 'all') {
      return local
        .filter((c) => c.langCode.toLowerCase() === langCode.toLowerCase())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getArbitrationCaseById(caseId: string): Promise<ArbitrationCase | null> {
    const list = await this.getArbitrationCases();
    return list.find((c) => c.id === caseId) || null;
  },

  async saveArbitrationCase(arbCase: ArbitrationCase): Promise<void> {
    const list = await this.getArbitrationCases();
    const idx = list.findIndex((c) => c.id === arbCase.id);
    if (idx >= 0) {
      list[idx] = arbCase;
    } else {
      list.unshift(arbCase);
    }
    localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'arbitration_cases', arbCase.id), arbCase);
      } catch (err) {
        console.warn('Firestore saveArbitrationCase error:', err);
      }
    }
  },

  async createArbitrationCase(
    input: Omit<
      ArbitrationCase,
      'id' | 'caseNumber' | 'createdAt' | 'deliberations' | 'comments' | 'status'
    >
  ): Promise<{ success: boolean; message: string; createdCase?: ArbitrationCase }> {
    if (!input.title || !input.title.trim()) {
      return { success: false, message: 'O título do processo é obrigatório.' };
    }
    if (!input.targetUsername || !input.targetUsername.trim()) {
      return { success: false, message: 'O nome do usuário, moderador ou administrador alvo é obrigatório.' };
    }
    if (!input.summary || !input.summary.trim()) {
      return { success: false, message: 'O resumo dos fatos é obrigatório.' };
    }
    if (!input.evidenceWikitext || !input.evidenceWikitext.trim()) {
      return { success: false, message: 'O dossiê de provas / evidências é obrigatório.' };
    }

    const lang = (input.langCode || 'pt').toUpperCase();
    const currentYear = new Date().getFullYear();
    const existingCases = await this.getArbitrationCases(input.langCode);
    const seq = String(existingCases.length + 1).padStart(3, '0');
    const caseNumber = `ARB-${lang}-${currentYear}-${seq}`;
    const id = `arb-case-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newCase: ArbitrationCase = {
      ...input,
      id,
      caseNumber,
      status: 'aberto',
      createdAt: new Date().toISOString(),
      deliberations: [],
      comments: [],
    };

    await this.saveArbitrationCase(newCase);

    // Audit log
    await this.addAuditLogEntry({
      userId: input.requesterUid || 'anon',
      userName: input.requesterUsername || 'Anônimo',
      action: 'ticket_created',
      target: `Conselho de Arbitragem: ${caseNumber}`,
      details: `Petição protocolada contra [${input.targetType.toUpperCase()}] ${input.targetUsername} (${input.category})`,
    });

    return {
      success: true,
      message: `Processo de Arbitragem ${caseNumber} protocolado com sucesso!`,
      createdCase: newCase,
    };
  },

  async addArbitrationDeliberation(
    caseId: string,
    deliberation: Omit<ArbitrationDeliberation, 'id' | 'timestamp'>
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const newDeliberation: ArbitrationDeliberation = {
      ...deliberation,
      id: `delib-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    const existingIdx = arbCase.deliberations.findIndex(
      (d) => d.arbitratorUid === deliberation.arbitratorUid || d.arbitratorName === deliberation.arbitratorName
    );

    let updatedDelibs = [...arbCase.deliberations];
    if (existingIdx >= 0) {
      updatedDelibs[existingIdx] = newDeliberation;
    } else {
      updatedDelibs.push(newDeliberation);
    }

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      deliberations: updatedDelibs,
      status: arbCase.status === 'aberto' ? 'em_instrucao' : arbCase.status,
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: 'Voto e manifestação do árbitro registrados com sucesso.',
      updatedCase,
    };
  },

  async addArbitrationComment(
    caseId: string,
    comment: Omit<ArbitrationComment, 'id' | 'timestamp'>
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const newComment: ArbitrationComment = {
      ...comment,
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      comments: [...arbCase.comments, newComment],
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: 'Manifestação anexada aos autos do processo.',
      updatedCase,
    };
  },

  async submitArbitrationDefense(
    caseId: string,
    defenseStatement: string
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      defenseStatement,
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: 'Manifestação de defesa juntada aos autos com sucesso.',
      updatedCase,
    };
  },

  async updateArbitrationCaseStatus(
    caseId: string,
    status: ArbitrationCaseStatus,
    adminOrArbUser?: UserProfile
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      status,
      updatedAt: new Date().toISOString(),
      closedAt: (status === 'concluido' || status === 'rejeitado') ? new Date().toISOString() : arbCase.closedAt,
    };

    await this.saveArbitrationCase(updatedCase);
    return {
      success: true,
      message: `Status do processo alterado para "${status}".`,
      updatedCase,
    };
  },

  async concludeArbitrationCase(
    caseId: string,
    ruling: ArbitrationRuling
  ): Promise<{ success: boolean; message: string; updatedCase?: ArbitrationCase }> {
    const arbCase = await this.getArbitrationCaseById(caseId);
    if (!arbCase) return { success: false, message: 'Processo não encontrado.' };

    const updatedCase: ArbitrationCase = {
      ...arbCase,
      status: 'concluido',
      finalRuling: ruling,
      closedAt: ruling.closedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveArbitrationCase(updatedCase);

    // Audit log
    await this.addAuditLogEntry({
      userId: ruling.closedByArbitrator,
      userName: ruling.closedByArbitrator,
      action: 'ticket_resolved',
      target: `Acórdão ArbCom: ${arbCase.caseNumber}`,
      details: `Processo concluído com decisão de [${ruling.remedyType.toUpperCase()}]. Placar: ${ruling.votesInFavor} a favor / ${ruling.votesAgainst} contra.`,
    });

    return {
      success: true,
      message: `Acórdão final do Conselho publicado e processo ${arbCase.caseNumber} arquivado como julgado!`,
      updatedCase,
    };
  },

  async getArbitrationMembers(langCode?: string): Promise<ArbitrationCommitteeMember[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'arbitration_members'));
        if (!snap.empty) {
          const list: ArbitrationCommitteeMember[] = [];
          snap.forEach((d) => list.push(d.data() as ArbitrationCommitteeMember));
          localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(list));
          if (langCode && langCode !== 'all') {
            return list.filter((m) => m.langCode.toLowerCase() === langCode.toLowerCase());
          }
          return list;
        }
      } catch (err) {
        console.warn('Firestore getArbitrationMembers error:', err);
      }
    }

    const local: ArbitrationCommitteeMember[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ARBITRATION_MEMBERS) || '[]'
    );
    if (langCode && langCode !== 'all') {
      return local.filter((m) => m.langCode.toLowerCase() === langCode.toLowerCase());
    }
    return local;
  },

  async addArbitrationMember(
    member: Omit<ArbitrationCommitteeMember, 'id'>
  ): Promise<{ success: boolean; message: string; createdMember?: ArbitrationCommitteeMember }> {
    const list = await this.getArbitrationMembers();
    const id = `arb-${member.langCode}-${Date.now()}`;
    const newMember: ArbitrationCommitteeMember = {
      ...member,
      id,
    };
    list.push(newMember);
    localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'arbitration_members', id), newMember);
      } catch (err) {
        console.warn('Firestore addArbitrationMember error:', err);
      }
    }

    return {
      success: true,
      message: `Árbitro ${member.displayName} adicionado ao Conselho do idioma ${member.langCode.toUpperCase()}.`,
      createdMember: newMember,
    };
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
