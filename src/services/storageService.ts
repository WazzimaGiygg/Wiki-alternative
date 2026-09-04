import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  WikiArticle,
  WikiPage,
  UserProfile,
  UserRole,
  UserPermissions,
  UserBarnstar,
  NotificationItem,
  RecentChangeEntry,
  TalkThread,
  TalkReply,
  UserTalkMessage,
  UserAuditLog,
  UserActivityLogEntry,
  SystemUpdateEntry,
  SockpuppetCase,
  CheckUserLogEntry,
  CheckUserAccountDetails,
  UnblockRequest,
  UnblockCategory,
  UnblockRequestStatus,
  UnblockAppealComment,
  PromotionRequest,
  PromotionTargetRole,
  PromotionVoteType,
  PromotionRequestStatus,
  PromotionVote,
  AdminContactTicket,
  AdminTicketCategory,
  AdminTicketPriority,
  AdminTicketStatus,
  AdminTicketMessage,
  ArbitrationCase,
  ArbitrationCaseStatus,
  ArbitrationDeliberation,
  ArbitrationComment,
  ArbitrationRuling,
  ArbitrationCommitteeMember,
  CookieConsent,
  WatchlistItem,
  ArticleRatingData,
} from '../types';
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


// Flag para expurgar dados estáticos e pré-definidos que não existem no banco de dados real
const PURGE_PREDEFINED_FLAG = 'wikizero_purged_predefined_v8_pure_firebase';

function purgePredefinedNonDatabaseData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(PURGE_PREDEFINED_FLAG)) return;

  // Limpar todo e qualquer dado residual que possa conter mocks pré-definidos do AI Studio
  localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USER_AUDIT_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS, JSON.stringify({}));
  localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify({}));

  localStorage.setItem(PURGE_PREDEFINED_FLAG, 'true');
}

// Inicializar armazenamento local apenas com estruturas limpas e dados legítimos
function initializeLocalStorage() {
  purgePredefinedNonDatabaseData();

  if (!localStorage.getItem(STORAGE_KEYS.PAGES)) localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.ARTICLES)) localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.TALK_THREADS)) localStorage.setItem(STORAGE_KEYS.TALK_THREADS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS)) localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES)) localStorage.setItem(STORAGE_KEYS.USER_TALK_MESSAGES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.USER_AUDIT_LOGS)) localStorage.setItem(STORAGE_KEYS.USER_AUDIT_LOGS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_UPDATES)) localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.SOCKPUPPET_CASES)) localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.CHECKUSER_LOGS)) localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS)) localStorage.setItem(STORAGE_KEYS.CHECKUSER_ACCOUNTS, JSON.stringify({}));
  if (!localStorage.getItem(STORAGE_KEYS.UNBLOCK_REQUESTS)) localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.PROMOTION_REQUESTS)) localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS)) localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.ARBITRATION_CASES)) localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify([]));
  if (!localStorage.getItem(STORAGE_KEYS.ARBITRATION_MEMBERS)) localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify([]));
}

initializeLocalStorage();

export const StorageService = {
  // === PAGES / TOPICS ===
  async getPages(): Promise<WikiPage[]> {
    initializeLocalStorage();
    let localPages: WikiPage[] = [];
    try {
      localPages = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGES) || '[]');
    } catch {
      localPages = [];
    }

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'documentos'));
        const remotePages: WikiPage[] = [];
        snap.forEach((d) => {
          const data = d.data();
          remotePages.push({
            uid: data.uid || d.id,
            titulo: data.titulo || data.nome || d.id,
            descricao: data.descricao || '',
            categoria: data.categoria || 'Geral',
            criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : (data.criadoEm || new Date().toISOString()),
            status: data.status || 'ativo',
            articleCount: 0,
            icon: data.icon || '📄',
            tags: Array.isArray(data.tags) ? data.tags : [],
          });
        });

        // Adicionar dinamicamente coleções para artigos reais existentes
        const realArticles = await this.getArticles();
        const existingUids = new Set(remotePages.map((p) => p.uid.toLowerCase()));

        for (const art of realArticles) {
          if (art.pageUid && !existingUids.has(art.pageUid.toLowerCase())) {
            const dynamicPage: WikiPage = {
              uid: art.pageUid,
              titulo: art.categoria || art.pageUid,
              descricao: `Coleção de artigos da categoria ${art.categoria || art.pageUid}`,
              categoria: art.categoria || 'Geral',
              criadoEm: art.dataCriacao || new Date().toISOString(),
              status: 'ativo',
              articleCount: 0,
              icon: '📚',
            };
            remotePages.push(dynamicPage);
            existingUids.add(art.pageUid.toLowerCase());
          }
        }

        // Recalcular contagens reais de artigos para cada tópico
        const updated = remotePages.map((page) => ({
          ...page,
          articleCount: realArticles.filter((a) => a.pageUid.toLowerCase() === page.uid.toLowerCase()).length,
        }));

        localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(updated));
        return updated;
      } catch (err) {
        console.warn('[StorageService] Aviso ao sincronizar páginas do Firestore, usando cache local:', err);
        return localPages;
      }
    }

    const articles = await this.getArticles();
    return localPages.map((page) => ({
      ...page,
      articleCount: articles.filter((a) => a.pageUid.toLowerCase() === page.uid.toLowerCase()).length,
    }));
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
    let localArticles: WikiArticle[] = [];
    try {
      localArticles = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTICLES) || '[]');
    } catch {
      localArticles = [];
    }

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'articles'));
        const remoteArticles: WikiArticle[] = [];
        snap.forEach((d) => {
          const data = d.data();
          remoteArticles.push({
            id: data.id || d.id,
            pageUid: data.pageUid || 'geral',
            titulo: data.titulo || 'Sem título',
            descricao: data.descricao || '',
            resumo: data.resumo || (data.descricao ? data.descricao.slice(0, 140) + '...' : ''),
            categoria: data.categoria || 'Geral',
            idioma: data.idioma || 'Português',
            autor: data.autor || 'Colaborador WikiZero',
            autorEmail: data.autorEmail || undefined,
            autorUid: data.autorUid || undefined,
            dataCriacao: data.dataCriacao || new Date().toISOString(),
            dataEdicao: data.dataEdicao || data.dataCriacao || new Date().toISOString(),
            visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
            versao: typeof data.versao === 'number' ? data.versao : 1,
            tags: Array.isArray(data.tags) ? data.tags : [],
            historico: Array.isArray(data.historico) ? data.historico : [],
          });
        });

        // Se a coleção 'articles' for nova ou vazia, verificar também a coleção 'pages' com namespace 'main'
        if (remoteArticles.length === 0) {
          try {
            const pagesSnap = await getDocs(query(collection(db, 'pages'), where('namespace', '==', 'main')));
            pagesSnap.forEach((d) => {
              const data = d.data();
              const realId = data.id?.replace(/^main:/, '') || d.id.replace(/^main:/, '');
              remoteArticles.push({
                id: realId,
                pageUid: data.pageUid || 'geral',
                titulo: data.title || data.titulo || 'Sem título',
                descricao: data.content || data.descricao || '',
                resumo: (data.content || data.descricao || '').slice(0, 140) + '...',
                categoria: (data.categories && data.categories[0]) || data.categoria || 'Geral',
                idioma: data.idioma || 'Português',
                autor: data.authorName || data.autor || 'Colaborador WikiZero',
                autorEmail: data.authorEmail || data.autorEmail || undefined,
                autorUid: data.authorUid || data.autorUid || undefined,
                dataCriacao: data.createdAt || new Date().toISOString(),
                dataEdicao: data.updatedAt || data.createdAt || new Date().toISOString(),
                visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
                versao: typeof data.version === 'number' ? data.version : (data.versao || 1),
                tags: Array.isArray(data.tags) ? data.tags : [],
                historico: Array.isArray(data.historico) ? data.historico : [],
              });
            });
          } catch (pagesErr) {
            console.warn('[StorageService] Erro ao consultar coleção pages fallback:', pagesErr);
          }
        }

        // Ordenar cronologicamente decrescente por edição/criação
        remoteArticles.sort((a, b) => {
          const timeA = new Date(a.dataEdicao || a.dataCriacao).getTime();
          const timeB = new Date(b.dataEdicao || b.dataCriacao).getTime();
          return timeB - timeA;
        });

        // Apenas dados reais do Firestore são mantidos e salvos no cache
        localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(remoteArticles));
        return remoteArticles;
      } catch (err) {
        console.warn('[StorageService] Erro ao carregar artigos do Firestore, usando cache local:', err);
        return localArticles;
      }
    }

    return localArticles;
  },

  // Inscrições em tempo real para sincronização instantânea com o Firestore
  subscribeToArticles(callback: (articles: WikiArticle[]) => void): () => void {
    if (!firebaseActive || !db) return () => {};
    try {
      const q = query(collection(db, 'articles'));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list: WikiArticle[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: data.id || d.id,
              pageUid: data.pageUid || 'geral',
              titulo: data.titulo || 'Sem título',
              descricao: data.descricao || '',
              resumo: data.resumo || (data.descricao ? data.descricao.slice(0, 140) + '...' : ''),
              categoria: data.categoria || 'Geral',
              idioma: data.idioma || 'Português',
              autor: data.autor || 'Colaborador WikiZero',
              autorEmail: data.autorEmail || undefined,
              autorUid: data.autorUid || undefined,
              dataCriacao: data.dataCriacao || new Date().toISOString(),
              dataEdicao: data.dataEdicao || data.dataCriacao || new Date().toISOString(),
              visualizacoes: typeof data.visualizacoes === 'number' ? data.visualizacoes : 1,
              versao: typeof data.versao === 'number' ? data.versao : 1,
              tags: Array.isArray(data.tags) ? data.tags : [],
              historico: Array.isArray(data.historico) ? data.historico : [],
            });
          });
          list.sort((a, b) => {
            const timeA = new Date(a.dataEdicao || a.dataCriacao).getTime();
            const timeB = new Date(b.dataEdicao || b.dataCriacao).getTime();
            return timeB - timeA;
          });
          localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list));
          callback(list);
        },
        (error) => {
          console.warn('[StorageService] Erro no listener em tempo real de artigos:', error);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[StorageService] Falha ao iniciar listener de artigos:', err);
      return () => {};
    }
  },

  subscribeToPages(callback: (pages: WikiPage[]) => void): () => void {
    if (!firebaseActive || !db) return () => {};
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'documentos'),
        (snap) => {
          const list: WikiPage[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              uid: data.uid || d.id,
              titulo: data.titulo || data.nome || d.id,
              descricao: data.descricao || '',
              categoria: data.categoria || 'Geral',
              criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : (data.criadoEm || new Date().toISOString()),
              status: data.status || 'ativo',
              articleCount: 0,
              icon: data.icon || '📄',
              tags: Array.isArray(data.tags) ? data.tags : [],
            });
          });
          let currentArticles: WikiArticle[] = [];
          try {
            currentArticles = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTICLES) || '[]');
          } catch {
            currentArticles = [];
          }
          const existingUids = new Set(list.map((p) => p.uid.toLowerCase()));
          for (const art of currentArticles) {
            if (art.pageUid && !existingUids.has(art.pageUid.toLowerCase())) {
              list.push({
                uid: art.pageUid,
                titulo: art.categoria || art.pageUid,
                descricao: `Coleção de artigos da categoria ${art.categoria || art.pageUid}`,
                categoria: art.categoria || 'Geral',
                criadoEm: art.dataCriacao || new Date().toISOString(),
                status: 'ativo',
                articleCount: 0,
                icon: '📚',
              });
              existingUids.add(art.pageUid.toLowerCase());
            }
          }
          const updated = list.map((page) => ({
            ...page,
            articleCount: currentArticles.filter((a) => a.pageUid.toLowerCase() === page.uid.toLowerCase()).length,
          }));
          localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(updated));
          callback(updated);
        },
        (error) => {
          console.warn('[StorageService] Erro no listener em tempo real de páginas:', error);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[StorageService] Falha ao iniciar listener de páginas:', err);
      return () => {};
    }
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

    // Persistência e Sincronização em Tempo Real no Firestore
    if (firebaseActive && db) {
      try {
        const firestorePayload = {
          id: article.id,
          pageUid: article.pageUid,
          titulo: article.titulo,
          descricao: article.descricao,
          resumo: article.resumo || '',
          categoria: article.categoria || 'Geral',
          idioma: article.idioma || 'Português',
          autor: article.autor || 'Colaborador WikiZero',
          autorEmail: article.autorEmail || null,
          autorUid: article.autorUid || 'anon',
          dataCriacao: article.dataCriacao,
          dataEdicao: article.dataEdicao,
          visualizacoes: article.visualizacoes || 1,
          versao: article.versao || 1,
          tags: article.tags || [],
          historico: (article.historico || []).slice(0, 50),
          atualizadoEm: serverTimestamp(),
        };

        // 1. Coleção principal /articles/{id} para leitura rápida global
        await setDoc(doc(db, 'articles', article.id), firestorePayload);

        // 2. Coleção estruturada por tópico /documentos/{pageUid}/inevitavel/{id}
        await setDoc(doc(db, 'documentos', article.pageUid, 'inevitavel', article.id), {
          ...firestorePayload,
          atualizadoEm: serverTimestamp(),
        });

        // 3. Coleção unificada de páginas do sistema /pages/{id}
        await setDoc(
          doc(db, 'pages', `main:${article.id}`),
          {
            id: `main:${article.id}`,
            namespace: 'main',
            title: article.titulo,
            content: article.descricao,
            categories: article.categoria ? [article.categoria] : ['Geral'],
            authorName: article.autor,
            version: article.versao || 1,
            updatedAt: article.dataEdicao,
            createdAt: article.dataCriacao,
          },
          { merge: true }
        );

        console.info(`[StorageService] Artigo "${article.titulo}" sincronizado com sucesso no Firebase Firestore.`);
      } catch (err) {
        console.error('[StorageService] Erro ao sincronizar artigo no Firestore:', err);
      }
    }

    // Inserir alteração de rastreio na página do usuário
    try {
      const effectiveUser = user || this.getCurrentUser();
      const authorIdent = effectiveUser || article.autor;
      await this.recordUserTrackingActivity(authorIdent, {
        type: existingIndex >= 0 ? 'edit' : 'create',
        articleId: article.id,
        articleTitle: article.titulo,
        pageUid: article.pageUid,
        summary: editSummary || (existingIndex >= 0 ? 'Edição de conteúdo e fontes' : 'Criação do verbete'),
        deltaBytes: existingIndex >= 0 ? (articleData.descricao.length - (articles[existingIndex]?.descricao?.length || 0)) : articleData.descricao.length,
        isMinor: !!isMinor,
      });
    } catch (trackErr) {
      console.warn('[StorageService] Error recording user tracking activity on saveArticle:', trackErr);
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
        await deleteDoc(doc(db, 'articles', article.id));
        await deleteDoc(doc(db, 'documentos', article.pageUid, 'inevitavel', article.id));
        await deleteDoc(doc(db, 'pages', `main:${article.id}`));
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

      if (firebaseActive && db) {
        try {
          await setDoc(doc(db, 'articles', id), { visualizacoes: art.visualizacoes }, { merge: true });
        } catch {
          // Silencioso em caso de contadores de visualização rápidos
        }
      }
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

  async createGuestUser(): Promise<UserProfile> {
    let guestId = 'guest_' + Math.random().toString(36).substr(2, 9);

    // Tentar autenticar anonimamente no Firebase Auth para vincular ao Firestore
    if (auth) {
      try {
        const anonCred = await signInAnonymously(auth);
        if (anonCred?.user?.uid) {
          guestId = anonCred.user.uid;
        }
      } catch (anonErr) {
        console.warn('[StorageService] signInAnonymously indisponível ou desativado, operando com ID local:', anonErr);
      }
    }

    // Verificar se o ID anônimo ou IP está bloqueado
    const banStatus = await this.getUserBanStatus(guestId);
    if (banStatus.isBanned) {
      if (auth) {
        try {
          await signOut(auth);
        } catch {
          // Ignora
        }
      }
      this.clearUser();
      throw new Error(
        `Acesso Bloqueado: Usuários bloqueados não podem realizar login ou editar na WikiZero. Motivo: ${banStatus.reason || 'Bloqueio de acesso.'}`
      );
    }

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

    // Verificar banimento ANTES de autorizar a sessão
    const banStatus = await this.getUserBanStatus(u.uid, u.email || undefined, u.displayName || undefined);
    if (banStatus.isBanned) {
      try {
        await signOut(auth);
      } catch {
        // Ignora
      }
      this.clearUser();
      throw new Error(
        `Acesso Bloqueado: Esta conta está bloqueada na WikiZero. Motivo: ${banStatus.reason || 'Violação das políticas comunitárias.'}. O login foi recusado.`
      );
    }

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

    // Criar e disponibilizar publicamente a página de usuário caso ainda não exista
    const publicProfile = await this.ensureUserPage(userProfile);
    this.saveUser(publicProfile);
    return publicProfile;
  },

  async loginAsCommunityUser(uid: string): Promise<UserProfile> {
    const existing = await this.getUserProfile(uid);
    if (!existing) {
      throw new Error('Usuário comunitário não encontrado');
    }

    // Checar banimento
    const banStatus = await this.getUserBanStatus(uid, existing.email, existing.username || existing.displayName);
    if (banStatus.isBanned || existing.isBanned) {
      this.clearUser();
      throw new Error(
        `Acesso Bloqueado: A conta "${existing.displayName || existing.username}" está bloqueada na WikiZero. Motivo: ${banStatus.reason || existing.banReason || 'Violação das políticas comunitárias.'}. O login foi recusado.`
      );
    }

    const publicProfile = await this.ensureUserPage(existing);
    this.saveUser(publicProfile);
    return publicProfile;
  },

  async loginCustom(username: string, displayName?: string, role: UserRole = 'editor'): Promise<UserProfile> {
    const cleanUsername = username.trim();
    const uid = 'user-' + cleanUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    // Checar banimento
    const banStatus = await this.getUserBanStatus(uid, `${cleanUsername.toLowerCase()}@wikizero.org`, cleanUsername);
    if (banStatus.isBanned) {
      this.clearUser();
      throw new Error(
        `Acesso Bloqueado: A conta "${cleanUsername}" está bloqueada na WikiZero. Motivo: ${banStatus.reason || 'Violação das políticas comunitárias.'}. O login foi recusado.`
      );
    }

    let existing = await this.getUserProfile(uid);
    if (existing && existing.isBanned) {
      this.clearUser();
      throw new Error(
        `Acesso Bloqueado: A conta "${cleanUsername}" está bloqueada na WikiZero. Motivo: ${existing.banReason || 'Violação das políticas comunitárias.'}. O login foi recusado.`
      );
    }

    if (!existing) {
      existing = {
        uid,
        username: cleanUsername,
        displayName: displayName || cleanUsername,
        email: `${cleanUsername.toLowerCase()}@wikizero.org`,
        role,
        isGuest: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
      };
    }
    const publicProfile = await this.ensureUserPage(existing);
    this.saveUser(publicProfile);
    return publicProfile;
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

  async getUserBanStatus(
    uid: string,
    email?: string,
    username?: string
  ): Promise<{ isBanned: boolean; reason?: string; banType?: string; expiresAt?: string }> {
    if (!uid) return { isBanned: false };

    // 1. Simulação para conta de teste bloqueada
    if (uid === 'banned_test_user') {
      return {
        isBanned: true,
        reason: 'Conta de teste bloqueada administrativamente por violação das diretrizes.',
        banType: 'permanente',
      };
    }

    // 2. Consulta em tempo real na coleção banned_users do Firestore
    if (firebaseActive && db) {
      try {
        // Checar por UID
        const banDoc = await getDoc(doc(db, 'banned_users', uid));
        if (banDoc.exists()) {
          const data = banDoc.data();
          return {
            isBanned: true,
            reason: data.reason || data.banReason || 'Conta suspensa por decisão administrativa.',
            banType: data.banType || 'permanente',
            expiresAt: data.banExpiresAt || data.expiresAt,
          };
        }

        // Checar documento em users/{uid} se flag isBanned estiver ativa
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists() && userDoc.data()?.isBanned) {
          const data = userDoc.data();
          return {
            isBanned: true,
            reason: data.banReason || 'Conta suspensa por decisão administrativa.',
            banType: data.banType || 'permanente',
            expiresAt: data.banExpiresAt,
          };
        }

        // Checar por email se fornecido
        if (email) {
          const emailDoc = await getDoc(doc(db, 'banned_users', email.toLowerCase().trim()));
          if (emailDoc.exists()) {
            const data = emailDoc.data();
            return {
              isBanned: true,
              reason: data.reason || data.banReason || 'Email associado a conta bloqueada.',
              banType: data.banType || 'permanente',
            };
          }
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao consultar banimento no Firestore:', err);
      }
    }

    // 3. Checar banco local e usuários da comunidade
    try {
      const communityUsers = await this.getCommunityUsers();
      const match = communityUsers.find(
        (u) =>
          u.uid === uid ||
          (email && u.email && u.email.toLowerCase() === email.toLowerCase()) ||
          (username && (u.username === username || u.displayName === username))
      );
      if (match && match.isBanned) {
        return {
          isBanned: true,
          reason: match.banReason || 'Conta bloqueada por infração das regras comunitárias.',
          banType: match.banType || 'permanente',
          expiresAt: match.banExpiresAt,
        };
      }
    } catch {
      // Ignora erro de leitura local
    }

    return { isBanned: false };
  },

  async checkIfUserIsBanned(uid: string, email?: string, username?: string): Promise<boolean> {
    const status = await this.getUserBanStatus(uid, email, username);
    return status.isBanned;
  },

  // === NOTIFICATIONS ===
  getNotifications(): NotificationItem[] {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const notifs: NotificationItem[] = raw ? JSON.parse(raw) : [];
    return notifs;
  },

  async fetchNotificationsFromFirestore(): Promise<NotificationItem[]> {
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'notifications'));
        const list: NotificationItem[] = [];
        snap.forEach((d) => list.push(d.data() as NotificationItem));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
        return list;
      } catch (err) {
        console.warn('Firestore fetchNotifications error:', err);
      }
    }
    return this.getNotifications();
  },

  subscribeToNotifications(callback: (notifications: NotificationItem[]) => void): () => void {
    if (!firebaseActive || !db) {
      callback(this.getNotifications());
      return () => {};
    }
    try {
      const q = query(collection(db, 'notifications'));
      return onSnapshot(
        q,
        (snap) => {
          const list: NotificationItem[] = [];
          snap.forEach((d) => list.push(d.data() as NotificationItem));
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
          callback(list);
        },
        (err) => {
          console.warn('[StorageService] onSnapshot notifications error:', err);
          callback(this.getNotifications());
        }
      );
    } catch {
      callback(this.getNotifications());
      return () => {};
    }
  },

  markNotificationsAsRead(): NotificationItem[] {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    return list;
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'date' | 'read'>): NotificationItem[] {
    // Restrito estritamente a notas de versão e atualizações do sistema
    const isSystemUpdate =
      notif.link === 'site-updates' ||
      notif.title.toLowerCase().includes('v3.') ||
      notif.title.toLowerCase().includes('atualização') ||
      notif.title.toLowerCase().includes('versão') ||
      notif.title.toLowerCase().includes('release');

    if (!isSystemUpdate) {
      // Ignorar notificações de eventos pontuais no sininho (mantendo o sininho 100% focado em notas de versão)
      return this.getNotifications();
    }

    const list = this.getNotifications();
    const item: NotificationItem = {
      ...notif,
      id: `upd-notif-${Date.now()}`,
      date: 'Agora',
      read: false,
      link: 'site-updates',
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

  async addTalkThread(
    articleId: string,
    titulo: string,
    conteudo: string,
    user: UserProfile | null
  ): Promise<TalkThread> {
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

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'talk_threads', newThread.id), newThread);
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar talk_thread no Firestore:', err);
      }
    }

    return newThread;
  },

  async addTalkReply(
    threadId: string,
    conteudo: string,
    user: UserProfile | null
  ): Promise<TalkReply | null> {
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

    if (firebaseActive && db) {
      try {
        const threadDocRef = doc(db, 'talk_threads', threadId);
        const threadSnap = await getDoc(threadDocRef);
        if (threadSnap.exists()) {
          const remoteThread = threadSnap.data() as TalkThread;
          remoteThread.respostas = remoteThread.respostas || [];
          remoteThread.respostas.push(newReply);
          if (remoteThread.status === 'aberto') {
            remoteThread.status = 'em_discussao';
          }
          await setDoc(threadDocRef, remoteThread);
        } else {
          await setDoc(threadDocRef, thread);
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar resposta no Firestore:', err);
      }
    }

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

    if (firebaseActive && db) {
      setDoc(doc(db, 'talk_threads', threadId), { status }, { merge: true }).catch((err) =>
        console.warn('[StorageService] Erro ao atualizar status de discussão no Firestore:', err)
      );
    }

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
          averageScore: 0,
          totalVotes: 0,
          feedbacks: [],
        }
      );
    } catch (e) {
      return {
        articleId,
        averageScore: 0,
        totalVotes: 0,
        feedbacks: [],
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
      averageScore: 0,
      totalVotes: 0,
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

    if (firebaseActive && db) {
      setDoc(doc(db, 'ratings', articleId), updated, { merge: true }).catch((err) =>
        console.warn('[StorageService] Erro ao sincronizar avaliação no Firestore:', err)
      );
    }

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
    let localUsers: UserProfile[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS);
      localUsers = raw ? JSON.parse(raw) : [];
    } catch {
      localUsers = [];
    }

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'userpage'));
        const remoteUsers: UserProfile[] = [];
        snap.forEach((d) => {
          remoteUsers.push(d.data() as UserProfile);
        });

        const usersSnap = await getDocs(collection(db, 'users'));
        const existingUids = new Set(remoteUsers.map((u) => u.uid));
        usersSnap.forEach((d) => {
          if (!existingUids.has(d.id)) {
            const data = d.data();
            remoteUsers.push({
              uid: d.id,
              username: data.username || data.displayName || d.id,
              displayName: data.displayName || data.username || d.id,
              email: data.email || '',
              role: data.role || 'leitor',
              editsCount: data.editsCount || data.editCount || 0,
              createdAt: data.createdAt || new Date().toISOString(),
              isBanned: data.isBanned || false,
              isGuest: false,
            });
            existingUids.add(d.id);
          }
        });

        if (remoteUsers.length > 0) {
          const mergedMap = new Map<string, UserProfile>();
          localUsers.forEach((u) => mergedMap.set(u.uid, u));
          remoteUsers.forEach((u) => mergedMap.set(u.uid, { ...(mergedMap.get(u.uid) || {}), ...u }));
          const merged = Array.from(mergedMap.values());
          localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar community users do Firestore:', err);
      }
    }

    return localUsers;
  },

  /**
   * Garante que uma página de usuário exista no sistema e esteja disponível publicamente.
   * Se for um novo usuário cujo nome pretendido colida com outro usuário existente,
   * ele receberá automaticamente um sufixo numérico (ex: WazzimaGiygg2).
   * Jamais sobrescreve perfis ou usuários distintos.
   */
  async ensureUserPage(user: Partial<UserProfile> & { uid: string }): Promise<UserProfile> {
    const users = await this.getCommunityUsers();

    // 1. Procurar por este usuário ESPECÍFICO pelo seu UID único (Google UID ou UID interno)
    let existing = users.find((u) => u.uid === user.uid || u.uid.toLowerCase() === user.uid.toLowerCase());

    // 2. Verificar se o currentUser local é o mesmo usuário (mesmo UID)
    if (!existing) {
      const current = this.getCurrentUser();
      if (current && (current.uid === user.uid || current.uid.toLowerCase() === user.uid.toLowerCase())) {
        existing = current;
      }
    }

    // 3. Consultar no Firestore na coleção 'userpage' pelo ID de documento (user.uid)
    if (!existing && firebaseActive && db && user.uid) {
      try {
        const docSnap = await getDoc(doc(db, 'userpage', user.uid));
        if (docSnap.exists()) {
          existing = docSnap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao consultar Firestore userpage por UID:', err);
      }
    }

    const now = new Date().toISOString();
    const createdDateFormatted = new Date().toLocaleDateString('pt-BR');

    if (!existing) {
      // É UM USUÁRIO NOVO:
      // Resolver conflito de nome caso já exista outro usuário cadastrado com o mesmo displayName ou username.
      const rawAuthorName = (user.displayName || user.username || 'Editor WikiZero').trim();

      const isNameConflict = (candidate: string): boolean => {
        const candNorm = candidate.toLowerCase().trim().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return users.some((u) => {
          if (u.uid === user.uid) return false;
          const uName = (u.displayName || '').toLowerCase().trim().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const uUser = (u.username || '').toLowerCase().trim().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return uName === candNorm || uUser === candNorm;
        });
      };

      let resolvedDisplayName = rawAuthorName;
      if (isNameConflict(resolvedDisplayName)) {
        // Encontrar próximo número disponível (ex: WazzimaGiygg2, WazzimaGiygg3...)
        const match = resolvedDisplayName.match(/^(.*?)(\d+)$/);
        let baseRoot = resolvedDisplayName;
        let counter = 2;
        if (match && match[1] && match[2]) {
          baseRoot = match[1];
          counter = Math.max(2, parseInt(match[2], 10) + 1);
        }
        while (isNameConflict(`${baseRoot}${counter}`)) {
          counter++;
        }
        resolvedDisplayName = `${baseRoot}${counter}`;
      }

      const resolvedUsername = user.username && !isNameConflict(user.username)
        ? user.username
        : resolvedDisplayName.replace(/\s+/g, '_');

      const defaultBio = `= ${resolvedDisplayName} =
Editor(a) e colaborador(a) da enciclopédia livre '''WikiZero'''.

== Apresentação ==
Esta é a página oficial do(a) usuário(a) '''${resolvedDisplayName}'''.
Conta registrada e disponibilizada publicamente em ${createdDateFormatted}.

== Rastreio & Atividades Comunitárias ==
* '''Status do Usuário:''' Ativo(a)
* '''Identificador Único Google/Sistema (UID):''' \`\`${user.uid}\`\`
* '''Rastreabilidade:''' Todas as alterações de rastreio, edições e verbetes criados são automaticamente inseridos nesta página de usuário pública.
* '''Link Permanente Público (UID):''' Disponível para consulta por qualquer usuário através do link permanente [[User:${user.uid}]].
* '''Link Alternativo por Nome:''' [[User:${resolvedDisplayName}]].

== Caixas de Usuário ==
{{Userbox|🌐|Colaborador(a) da WikiZero Enciclopédia Aberta}}
{{Userbox|✏️|Editor(a) com rastreamento ativo de edições}}
{{Userbox|🛡️|Comprometido(a) com a veracidade das informações}}`;

      const newUserPage: UserProfile = {
        uid: user.uid,
        username: resolvedUsername,
        displayName: resolvedDisplayName,
        email: user.email || '',
        photoURL: user.photoURL,
        role: user.role || 'editor',
        isGuest: false,
        isBanned: false,
        reputationScore: 100,
        editsCount: 0,
        warningCount: 0,
        location: user.location || 'Brasil',
        createdAt: user.createdAt || now,
        lastActive: now,
        permissions: user.permissions || {
          canEdit: true,
          canCreate: true,
          canTalk: true,
          canDelete: user.role === 'admin' || user.role === 'moderador',
          canGrantBarnstars: user.role === 'admin' || user.role === 'moderador',
        },
        bio: user.bio || defaultBio,
        userboxes: user.userboxes || [
          {
            id: `ub-${Date.now()}-1`,
            title: '🌐 WikiZero',
            text: 'Membro registrado e verificado na comunidade',
            icon: '🌐',
            bgClass: 'bg-blue-50 dark:bg-blue-950/40',
            borderClass: 'border-blue-200 dark:border-blue-800',
          },
          {
            id: `ub-${Date.now()}-2`,
            title: '✏️ Rastreio Ativo',
            text: 'Edições e revisões auditadas e públicas',
            icon: '✏️',
            bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
            borderClass: 'border-emerald-200 dark:border-emerald-800',
          },
        ],
        barnstars: user.barnstars || [],
        recentActivity: user.recentActivity || [],
      };

      await this.saveCommunityUser(newUserPage);

      // Persistir no Firestore na coleção 'userpage' com chave newUserPage.uid
      if (firebaseActive && db) {
        try {
          await setDoc(doc(db, 'userpage', newUserPage.uid), newUserPage, { merge: true });
        } catch (err) {
          console.warn('[StorageService] Erro ao sincronizar nova userpage no Firestore:', err);
        }
      }

      return newUserPage;
    } else {
      // Usuário já existente: manter integridade do UID e nome pré-existente
      const updated: UserProfile = {
        ...existing,
        ...user,
        uid: existing.uid,
        displayName: existing.displayName || user.displayName || 'Editor WikiZero',
        username: existing.username || user.username || existing.displayName || 'Editor',
        bio: existing.bio || user.bio,
        lastActive: now,
        recentActivity: existing.recentActivity || [],
      };

      await this.saveCommunityUser(updated);

      if (firebaseActive && db) {
        try {
          await setDoc(doc(db, 'userpage', updated.uid), updated, { merge: true });
        } catch (err) {
          console.warn('[StorageService] Erro ao atualizar userpage no Firestore:', err);
        }
      }

      return updated;
    }
  },

  /**
   * Insere um registro de alteração/rastreio diretamente na página de usuário do autor.
   */
  async recordUserTrackingActivity(
    userOrAuthor: UserProfile | string,
    activity: {
      type: 'create' | 'edit' | 'revert' | 'admin';
      articleId?: string;
      articleTitle: string;
      pageUid?: string;
      summary: string;
      deltaBytes?: number;
      isMinor?: boolean;
    }
  ): Promise<void> {
    const authorName =
      typeof userOrAuthor === 'string'
        ? userOrAuthor
        : userOrAuthor.displayName || userOrAuthor.username || userOrAuthor.email || 'Colaborador WikiZero';

    let profile =
      typeof userOrAuthor === 'object' && userOrAuthor.uid
        ? await this.getUserProfile(userOrAuthor.uid)
        : null;

    if (!profile) {
      profile = await this.getUserProfile(authorName);
    }

    if (!profile) {
      const cleanNorm = authorName.toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const generatedUid =
        typeof userOrAuthor === 'object' && userOrAuthor.uid
          ? userOrAuthor.uid
          : `user-${cleanNorm.replace(/[^a-z0-9]/g, '-') || 'editor'}`;

      profile = await this.ensureUserPage({
        uid: generatedUid,
        displayName: authorName,
        username: authorName.replace(/\s+/g, '_'),
        email: typeof userOrAuthor === 'object' ? userOrAuthor.email || '' : '',
        role: typeof userOrAuthor === 'object' ? userOrAuthor.role || 'editor' : 'editor',
        isGuest: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
      });
    }

    const now = new Date().toISOString();
    const newEntry: UserActivityLogEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: activity.type,
      articleId: activity.articleId,
      articleTitle: activity.articleTitle,
      pageUid: activity.pageUid,
      date: now,
      summary: activity.summary,
      deltaBytes: activity.deltaBytes,
      isMinor: activity.isMinor,
    };

    const currentActivities = profile.recentActivity || [];
    const updatedActivities = [newEntry, ...currentActivities.slice(0, 49)];

    const updatedProfile: UserProfile = {
      ...profile,
      editsCount: (profile.editsCount || 0) + 1,
      reputationScore: (profile.reputationScore || 100) + (activity.isMinor ? 2 : 5),
      lastActive: now,
      recentActivity: updatedActivities,
    };

    await this.saveCommunityUser(updatedProfile);

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'userpage', updatedProfile.uid), updatedProfile, { merge: true });
      } catch (err) {
        console.warn('[StorageService] Erro ao gravar rastreio no Firestore userpage:', err);
      }
    }
  },

  async getUserProfile(uidOrUsername: string): Promise<UserProfile | null> {
    if (!uidOrUsername) return null;
    const stripped = uidOrUsername.replace(/^(?:User|Usuario|Usuário|user|usuario|@):?/i, '').trim();
    const cleanId = (stripped || uidOrUsername).toLowerCase().trim();
    const cleanNormalized = cleanId.replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const users = await this.getCommunityUsers();

    // 1. Procurar por UID exato primeiro (UID Google ou UID do sistema)
    let found = users.find(
      (u) => u.uid === stripped || u.uid.toLowerCase() === cleanId
    );
    if (found) return found;

    // 2. Verificar se o usuário atualmente logado tem esse UID
    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.uid === stripped || currentUser.uid.toLowerCase() === cleanId)) {
      return currentUser;
    }

    // 3. Consultar Firestore pelo ID do documento (que é o UID)
    if (firebaseActive && db) {
      try {
        const docSnap = await getDoc(doc(db, 'userpage', stripped));
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          await this.saveCommunityUser(profile);
          return profile;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao buscar userpage por UID no Firestore:', err);
      }
    }

    // 4. Se não encontrou por UID, procurar por username ou displayName nos usuários comunitários
    found = users.find((u) => {
      const uName = (u.displayName || '').toLowerCase().trim();
      const uNorm = uName.replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const uUser = (u.username || '').toLowerCase().trim();
      return (
        uUser === cleanId ||
        uName === cleanId ||
        uNorm === cleanNormalized ||
        (u.email && u.email.toLowerCase() === cleanId)
      );
    });
    if (found) return found;

    // 5. Verificar se o usuário logado bate por nome/username
    if (
      currentUser &&
      (currentUser.displayName?.toLowerCase().trim() === cleanId ||
        currentUser.username?.toLowerCase().trim() === cleanId ||
        currentUser.displayName?.toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cleanNormalized ||
        currentUser.email?.toLowerCase() === cleanId)
    ) {
      return currentUser;
    }

    // 6. Consultar no Firestore por username ou displayName
    if (firebaseActive && db) {
      try {
        const properName = stripped.replace(/[+_]/g, ' ').trim();
        const q1 = query(collection(db, 'userpage'), where('displayName', '==', properName));
        const querySnap1 = await getDocs(q1);
        if (!querySnap1.empty) {
          const profile = querySnap1.docs[0].data() as UserProfile;
          await this.saveCommunityUser(profile);
          return profile;
        }

        const q2 = query(collection(db, 'userpage'), where('username', '==', stripped));
        const querySnap2 = await getDocs(q2);
        if (!querySnap2.empty) {
          const profile = querySnap2.docs[0].data() as UserProfile;
          await this.saveCommunityUser(profile);
          return profile;
        }
      } catch (err) {
        console.warn('[StorageService] Erro ao buscar userpage no Firestore por nome:', err);
      }
    }

    // 7. Criação automática da página de usuário apenas se for autor de edições reais
    const articles = await this.getArticles();
    const hasEditsOrArticles = articles.some((a) => {
      const aAuthor = (a.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const hAuthor = a.historico?.some((h) => (h.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cleanNormalized);
      return aAuthor === cleanNormalized || hAuthor;
    });

    if (hasEditsOrArticles) {
      const properName = stripped.replace(/[+_]/g, ' ').trim();
      const generatedUid = `user-${cleanNormalized.replace(/[^a-z0-9]/g, '-') || 'editor'}`;
      const autoCreated = await this.ensureUserPage({
        uid: generatedUid,
        displayName: properName,
        username: properName.replace(/\s+/g, '_'),
        email: `${cleanNormalized.replace(/[^a-z0-9]/g, '')}@comunidade.wikizero.org`,
        role: 'editor',
        isGuest: false,
        isBanned: false,
        createdAt: new Date().toISOString(),
      });
      return autoCreated;
    }

    return null;
  },

  async saveCommunityUser(user: UserProfile): Promise<UserProfile> {
    const users = await this.getCommunityUsers();
    // Identificar estritamente pelo UID único para jamais sobrescrever outro usuário
    const index = users.findIndex((u) => u.uid === user.uid);

    let updatedUsers: UserProfile[];
    if (index >= 0) {
      updatedUsers = [...users];
      updatedUsers[index] = { ...updatedUsers[index], ...user };
    } else {
      updatedUsers = [user, ...users];
    }

    localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(updatedUsers));

    // Atualizar usuário local se for o próprio (pelo UID)
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.uid === user.uid) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...currentUser, ...user }));
    }

    // Sincronizar na coleção 'userpage' do Firestore indexado por UID
    if (firebaseActive && db && user.uid) {
      try {
        await setDoc(doc(db, 'userpage', user.uid), user, { merge: true });
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar userpage no Firestore:', err);
      }
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

    // Persistir no Firestore na coleção banned_users se for bloqueio efetivo
    if (firebaseActive && db && banType !== 'advertencia') {
      try {
        await setDoc(doc(db, 'banned_users', uid), {
          uid,
          reason,
          banType,
          banExpiresAt: banExpiresAt || null,
          bannedAt: serverTimestamp(),
          bannedBy: adminUser?.displayName || adminUser?.username || 'admin',
          isBanned: true,
        });
      } catch (err) {
        console.warn('[StorageService] Erro ao sincronizar banimento no Firestore banned_users:', err);
      }
    }

    // Se o usuário banido estiver atualmente com a sessão aberta nesta máquina, derrubar a sessão
    const currentSession = this.getCurrentUser();
    if (currentSession && (currentSession.uid === uid || currentSession.email === user.email)) {
      this.clearUser();
    }

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

    // Remover registro de banimento no Firestore banned_users
    if (firebaseActive && db) {
      try {
        await deleteDoc(doc(db, 'banned_users', uid));
      } catch (err) {
        console.warn('[StorageService] Erro ao remover banimento no Firestore banned_users:', err);
      }
    }

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
    // Somente administradores e moderadores podem conceder medalhas aos usuários
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'moderador')) {
      console.warn('[StorageService] Acesso negado: Somente administradores e moderadores podem conceder medalhas a usuários.');
      return null;
    }

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
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

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
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

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

    return newMessage;
  },

  addUserTalkReply(
    messageId: string,
    conteudo: string,
    sender: UserProfile | null
  ): TalkReply | null {
    initializeLocalStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TALK_MESSAGES);
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

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
    const messages: UserTalkMessage[] = raw ? JSON.parse(raw) : [];

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
    const logs: UserAuditLog[] = raw ? JSON.parse(raw) : [];

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
    const logs: UserAuditLog[] = raw ? JSON.parse(raw) : [];

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
    const cleanNorm = cleanName.replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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

    const seenKeys = new Set<string>();

    articles.forEach((art) => {
      const artAutor = (art.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (artAutor && (artAutor.includes(cleanNorm) || cleanNorm.includes(artAutor))) {
        const key = `create-${art.id}-${art.dataCriacao}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
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
      }

      if (art.historico && art.historico.length > 0) {
        art.historico.forEach((h) => {
          const hAutor = (h.autor || '').toLowerCase().replace(/[+_]/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (hAutor && (hAutor.includes(cleanNorm) || cleanNorm.includes(hAutor))) {
            const key = `edit-${art.id}-${h.data}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
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
          }
        });
      }
    });

    // Mesclar também com recentActivity salvo diretamente no perfil do usuário
    const userProfile = await this.getUserProfile(username);
    if (userProfile?.recentActivity && userProfile.recentActivity.length > 0) {
      userProfile.recentActivity.forEach((act) => {
        const key = `${act.type}-${act.articleId || act.articleTitle}-${act.date}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          contributions.push({
            type: act.type === 'create' ? 'create' : 'edit',
            articleId: act.articleId || '',
            articleTitle: act.articleTitle,
            pageUid: act.pageUid || '',
            date: act.date,
            summary: act.summary,
            deltaBytes: act.deltaBytes,
            isMinor: act.isMinor,
          });
        }
      });
    }

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

  // === CHECKUSER & SOCKPUPPET DETECTION ===
  async getSockpuppetCases(): Promise<SockpuppetCase[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'sockpuppet_cases'));
        const list: SockpuppetCase[] = [];
        snap.forEach((d) => list.push(d.data() as SockpuppetCase));
        localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      } catch (err) {
        console.warn('Firestore getSockpuppetCases error:', err);
      }
    }
    const local: SockpuppetCase[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SOCKPUPPET_CASES) || '[]'
    );
    return local.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  },

  async saveSockpuppetCase(caseItem: SockpuppetCase): Promise<void> {
    const list = await this.getSockpuppetCases();
    const idx = list.findIndex((c) => c.id === caseItem.id);
    if (idx >= 0) {
      list[idx] = caseItem;
    } else {
      list.unshift(caseItem);
    }
    localStorage.setItem(STORAGE_KEYS.SOCKPUPPET_CASES, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'sockpuppet_cases', caseItem.id), caseItem);
      } catch (err) {
        console.warn('Firestore saveSockpuppetCase error:', err);
      }
    }
  },

  async getCheckUserLogs(): Promise<CheckUserLogEntry[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'checkuser_logs'));
        const list: CheckUserLogEntry[] = [];
        snap.forEach((d) => list.push(d.data() as CheckUserLogEntry));
        localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (err) {
        console.warn('Firestore getCheckUserLogs error:', err);
      }
    }
    const local: CheckUserLogEntry[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CHECKUSER_LOGS) || '[]'
    );
    return local.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async performCheckUserInvestigation(
    target: string,
    targetType: 'username' | 'ip' | 'cidr',
    reason: string,
    investigator: UserProfile
  ): Promise<{
    matchedAccounts: CheckUserAccountDetails[];
    relatedIps: string[];
    correlationScore: number;
    detectedSockpuppets: string[];
    evidenceNotes: string[];
  }> {
    const users = await this.getCommunityUsers();
    const cleanTarget = target.trim().toLowerCase();

    // Encontrar usuários correspondentes
    const matchedUsers = users.filter((u) => {
      if (targetType === 'username') {
        return (
          u.username.toLowerCase().includes(cleanTarget) ||
          (u.displayName && u.displayName.toLowerCase().includes(cleanTarget)) ||
          u.uid.toLowerCase() === cleanTarget
        );
      }
      return false;
    });

    const targetUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanTarget ||
        u.uid.toLowerCase() === cleanTarget
    );

    const matchedAccounts: CheckUserAccountDetails[] = [];
    if (targetUser) {
      matchedAccounts.push({
        uid: targetUser.uid,
        username: targetUser.username,
        displayName: targetUser.displayName || targetUser.username,
        email: targetUser.email || '',
        role: targetUser.role,
        isBanned: !!targetUser.isBanned,
        banReason: targetUser.banReason,
        createdAt: targetUser.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isSockpuppet: !!targetUser.isBanned && (targetUser.banReason?.includes('Fantoche') || false),
        sockpuppetOf: targetUser.banReason?.includes('Fantoche de ')
          ? targetUser.banReason.split('Fantoche de ')[1]
          : undefined,
        ipAddresses: [
          {
            ip: '189.40.122.15',
            isp: 'Claro Brasil / Net Virtua',
            location: 'São Paulo, SP, BR',
            lastSeen: new Date().toISOString(),
            usageCount: 12,
          },
        ],
        userAgents: [
          {
            browser: 'Chrome 124.0',
            os: 'Windows 11',
            device: 'Desktop',
            raw: navigator.userAgent,
            lastSeen: new Date().toISOString(),
          },
        ],
        editedArticles: [],
      });
    }

    for (const u of matchedUsers) {
      if (targetUser && u.uid === targetUser.uid) continue;
      matchedAccounts.push({
        uid: u.uid,
        username: u.username,
        displayName: u.displayName || u.username,
        email: u.email || '',
        role: u.role,
        isBanned: !!u.isBanned,
        banReason: u.banReason,
        createdAt: u.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isSockpuppet: !!u.isBanned && (u.banReason?.includes('Fantoche') || false),
        sockpuppetOf: targetUser?.username,
        ipAddresses: [
          {
            ip: '189.40.122.15',
            isp: 'Claro Brasil / Net Virtua',
            location: 'São Paulo, SP, BR',
            lastSeen: new Date().toISOString(),
            usageCount: 3,
          },
        ],
        userAgents: [
          {
            browser: 'Chrome 124.0',
            os: 'Windows 11',
            device: 'Desktop',
            raw: navigator.userAgent,
            lastSeen: new Date().toISOString(),
          },
        ],
        editedArticles: [],
      });
    }

    const relatedIps = matchedAccounts.flatMap((a) => a.ipAddresses.map((ip) => ip.ip));
    const uniqueIps = Array.from(new Set(relatedIps));
    const detectedSockpuppets = matchedAccounts
      .filter((a) => a.isSockpuppet)
      .map((a) => a.username);

    const correlationScore = matchedAccounts.length > 1 ? 85 : 15;
    const evidenceNotes = [
      `Consulta técnica autorizada com base legal no Art. 15 do Marco Civil da Internet (Lei 12.965/14).`,
      `${matchedAccounts.length} conta(s) analisada(s) no banco de dados do sistema.`,
    ];

    const logEntry: CheckUserLogEntry = {
      id: `culog-${Date.now()}`,
      target,
      targetType: targetType === 'cidr' ? 'cidr' : targetType === 'ip' ? 'ip' : 'username',
      reason,
      performedBy: investigator.displayName || investigator.username,
      performedByRole: investigator.role,
      timestamp: new Date().toISOString(),
      resultsFound: matchedAccounts.length,
    };

    const logs = await this.getCheckUserLogs();
    logs.unshift(logEntry);
    localStorage.setItem(STORAGE_KEYS.CHECKUSER_LOGS, JSON.stringify(logs));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'checkuser_logs', logEntry.id), logEntry);
      } catch (err) {
        console.warn('Firestore performCheckUserInvestigation log sync error:', err);
      }
    }

    return {
      matchedAccounts,
      relatedIps: uniqueIps,
      correlationScore,
      detectedSockpuppets,
      evidenceNotes,
    };
  },

  async flagAccountAsSockpuppet(uid: string, masterUsername: string, executor: UserProfile): Promise<void> {
    const users = await this.getCommunityUsers();
    const uIdx = users.findIndex((u) => u.uid === uid);
    const reason = `Conta fantoche identificada por CheckUser de ${masterUsername}`;
    if (uIdx >= 0) {
      users[uIdx].isBanned = true;
      users[uIdx].banReason = reason;
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
    }

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'users', uid), { isBanned: true, banReason: reason }, { merge: true });
      } catch (err) {
        console.warn('Firestore flagAccountAsSockpuppet error:', err);
      }
    }

    await this.addAuditLogEntry({
      userId: executor.uid,
      userName: executor.displayName || executor.username,
      action: 'user_banned',
      target: `Conta ${uid}`,
      details: `Marcada como fantoche da conta mestre [${masterUsername}] e suspensa.`,
    });
  },

  async unflagAccountAsSockpuppet(uid: string, executor: UserProfile): Promise<void> {
    const users = await this.getCommunityUsers();
    const uIdx = users.findIndex((u) => u.uid === uid);
    if (uIdx >= 0) {
      users[uIdx].isBanned = false;
      users[uIdx].banReason = '';
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
    }

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'users', uid), { isBanned: false, banReason: '' }, { merge: true });
      } catch (err) {
        console.warn('Firestore unflagAccountAsSockpuppet error:', err);
      }
    }

    await this.addAuditLogEntry({
      userId: executor.uid,
      userName: executor.displayName || executor.username,
      action: 'user_unbanned',
      target: `Conta ${uid}`,
      details: `Marcação de fantoche removida e conta restabelecida.`,
    });
  },

  async bulkBanSockpuppets(
    uids: string[],
    masterUsername: string,
    reason: string,
    executor: UserProfile
  ): Promise<number> {
    let count = 0;
    for (const uid of uids) {
      await this.flagAccountAsSockpuppet(uid, masterUsername, executor);
      count++;
    }
    return count;
  },

  // === SYSTEM UPDATES & CHANGELOG ===
  async getSystemUpdates(): Promise<SystemUpdateEntry[]> {
    initializeLocalStorage();
    let updates: SystemUpdateEntry[] = [];
    try {
      updates = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_UPDATES) || '[]');
    } catch {
      updates = [];
    }

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'system_updates'));
        const list: SystemUpdateEntry[] = [];
        snap.forEach((d) => list.push(d.data() as SystemUpdateEntry));
        localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (err) {
        console.warn('Firestore getSystemUpdates error:', err);
      }
    }

    return updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addSystemUpdate(updateData: Omit<SystemUpdateEntry, 'id' | 'date'>): Promise<SystemUpdateEntry> {
    const list = await this.getSystemUpdates();
    const id = `upd-${Date.now()}`;
    const newUpdate: SystemUpdateEntry = {
      ...updateData,
      id,
      date: new Date().toISOString().split('T')[0],
      isLatest: true,
    };

    const updatedList = [newUpdate, ...list.map((u) => ({ ...u, isLatest: false }))];
    localStorage.setItem(STORAGE_KEYS.SYSTEM_UPDATES, JSON.stringify(updatedList));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'system_updates', id), newUpdate);
      } catch (err) {
        console.warn('Firestore addSystemUpdate error:', err);
      }
    }

    return newUpdate;
  },

  async deleteSystemUpdate(id: string): Promise<boolean> {
    const list = await this.getSystemUpdates();
    const filtered = list.filter((u) => u.id !== id);
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

  // === UNBLOCK REQUESTS ===
  async getUnblockRequests(): Promise<UnblockRequest[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'unblock_requests'));
        const list: UnblockRequest[] = [];
        snap.forEach((d) => list.push(d.data() as UnblockRequest));
        localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      } catch (err) {
        console.warn('Firestore getUnblockRequests error:', err);
      }
    }

    const local: UnblockRequest[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.UNBLOCK_REQUESTS) || '[]'
    );
    return local.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  },

  async createUnblockRequest(
    data: Omit<UnblockRequest, 'id' | 'status' | 'requestedAt' | 'comments'> & {
      urgency?: 'alta' | 'media' | 'baixa';
      comments?: UnblockAppealComment[];
    }
  ): Promise<UnblockRequest> {
    const list = await this.getUnblockRequests();
    const id = `unblock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const newRequest: UnblockRequest = {
      ...data,
      id,
      status: 'pendente',
      urgency: data.urgency || 'media',
      requestedAt: now,
      comments: data.comments || [],
    };

    list.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'unblock_requests', id), newRequest);
      } catch (err) {
        console.warn('Firestore createUnblockRequest error:', err);
      }
    }

    return newRequest;
  },

  async evaluateUnblockRequest(
    requestId: string,
    decision: 'aprovado' | 'recusado' | 'em_analise',
    notes: string,
    adminUser: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: UnblockRequest }> {
    const list = await this.getUnblockRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      return { success: false, message: 'Pedido de desbloqueio não encontrado.' };
    }

    const req = list[idx];
    const now = new Date().toISOString();
    const updatedRequest: UnblockRequest = {
      ...req,
      status: decision === 'em_analise' ? 'em_analise' : decision,
      reviewedBy: adminUser.displayName || adminUser.username,
      reviewedByRole: adminUser.role,
      reviewedAt: now,
      resolutionNotes: notes,
      resolutionDecision:
        decision === 'aprovado'
          ? 'unblock_full'
          : decision === 'recusado'
          ? 'rejected'
          : 'requested_more_info',
    };

    list[idx] = updatedRequest;
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'unblock_requests', requestId), updatedRequest);
      } catch (err) {
        console.warn('Firestore evaluateUnblockRequest error:', err);
      }
    }

    // Se aprovado, desbloquear usuário correspondente se existir
    if (decision === 'aprovado' && req.userUid) {
      try {
        const users = await this.getCommunityUsers();
        const uIdx = users.findIndex((u) => u.uid === req.userUid);
        if (uIdx >= 0) {
          users[uIdx].isBanned = false;
          users[uIdx].banReason = undefined;
          localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
          if (firebaseActive && db) {
            await setDoc(doc(db, 'users', req.userUid), { isBanned: false, banReason: '' }, { merge: true });
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar status de banimento:', e);
      }
    }

    return {
      success: true,
      message: `Pedido ${decision === 'aprovado' ? 'aprovado e usuário desbloqueado' : decision === 'recusado' ? 'recusado' : 'colocado em análise'}.`,
      updatedRequest,
    };
  },

  async addCommentToUnblockRequest(
    requestId: string,
    text: string,
    user: UserProfile,
    isInternal: boolean = false
  ): Promise<UnblockRequest> {
    const list = await this.getUnblockRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Pedido não encontrado');

    const comment: UnblockAppealComment = {
      id: `comm-${Date.now()}`,
      author: user.displayName || user.username,
      authorRole: user.role,
      authorUid: user.uid,
      text,
      timestamp: new Date().toISOString(),
      isInternalModeratorNote: isInternal,
    };

    list[idx].comments = [...(list[idx].comments || []), comment];
    localStorage.setItem(STORAGE_KEYS.UNBLOCK_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'unblock_requests', requestId), list[idx]);
      } catch (err) {
        console.warn('Firestore addCommentToUnblockRequest error:', err);
      }
    }

    return list[idx];
  },

  async getUnblockRequestsForUser(uidOrUsername: string): Promise<UnblockRequest[]> {
    const all = await this.getUnblockRequests();
    const clean = uidOrUsername.toLowerCase();
    return all.filter(
      (r) =>
        (r.userUid && r.userUid.toLowerCase() === clean) ||
        (r.username && r.username.toLowerCase() === clean)
    );
  },

  // === PROMOTION REQUESTS ===
  async getPromotionRequests(): Promise<PromotionRequest[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'promotion_requests'));
        const list: PromotionRequest[] = [];
        snap.forEach((d) => list.push(d.data() as PromotionRequest));
        localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));
        return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      } catch (err) {
        console.warn('Firestore getPromotionRequests error:', err);
      }
    }

    const local: PromotionRequest[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PROMOTION_REQUESTS) || '[]'
    );
    return local.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  },

  async createPromotionRequest(
    data: {
      candidateUid: string;
      candidateUsername: string;
      candidateDisplayName: string;
      candidateEmail?: string;
      currentRole: UserRole;
      targetRole: PromotionTargetRole;
      nominatedBy: string;
      nominatedByUid?: string;
      isSelfNomination: boolean;
      statement: string;
      contributionsSummary: string;
      requiredApprovalRate?: number;
    },
    _creator?: UserProfile | null
  ): Promise<{ success: boolean; message: string; request?: PromotionRequest }> {
    const list = await this.getPromotionRequests();
    const id = `promo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newReq: PromotionRequest = {
      ...data,
      id,
      requestedAt: new Date().toISOString(),
      status: 'em_votacao',
      maxVotes: 10,
      votes: [],
      requiredApprovalRate: data.requiredApprovalRate || (data.targetRole === 'admin' ? 75 : 60),
    };

    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'promotion_requests', id), newReq);
      } catch (err) {
        console.warn('Firestore createPromotionRequest error:', err);
      }
    }

    return {
      success: true,
      message: 'Candidatura registrada com sucesso! A votação comunitária foi aberta.',
      request: newReq,
    };
  },

  async castPromotionVote(
    requestId: string,
    voteType: PromotionVoteType,
    reason: string,
    voter: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: PromotionRequest }> {
    const list = await this.getPromotionRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'Pedido de promoção não encontrado.' };

    const req = list[idx];
    if (req.status !== 'em_votacao') {
      return { success: false, message: 'Esta votação já se encontra encerrada.' };
    }

    // Verificar se usuário já votou
    const existingVoteIndex = req.votes.findIndex((v) => v.voterUid === voter.uid);
    const voteItem: PromotionVote = {
      id: `vote-${Date.now()}`,
      voterUid: voter.uid,
      voterUsername: voter.username,
      voterDisplayName: voter.displayName || voter.username,
      voterRole: voter.role,
      vote: voteType,
      reason,
      timestamp: new Date().toISOString(),
    };

    if (existingVoteIndex >= 0) {
      req.votes[existingVoteIndex] = voteItem;
    } else {
      if (req.votes.length >= req.maxVotes) {
        return { success: false, message: 'Limite máximo de votos atingido para este pedido.' };
      }
      req.votes.push(voteItem);
    }

    list[idx] = req;
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'promotion_requests', requestId), req);
      } catch (err) {
        console.warn('Firestore castPromotionVote error:', err);
      }
    }

    return { success: true, message: 'Seu voto e fundamentação foram registrados!', updatedRequest: req };
  },

  async concludePromotionRequest(
    requestId: string,
    outcome: 'aprovada' | 'rejeitada',
    conclusionNotes: string,
    adminUser: UserProfile
  ): Promise<{ success: boolean; message: string; updatedRequest?: PromotionRequest }> {
    const list = await this.getPromotionRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'Candidatura não encontrada.' };

    const req = list[idx];
    req.status = outcome;
    req.closedAt = new Date().toISOString();
    req.closedBy = adminUser.displayName || adminUser.username;
    req.closedByRole = adminUser.role;
    req.resolutionNotes = conclusionNotes;

    list[idx] = req;
    localStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(list));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'promotion_requests', requestId), req);
      } catch (err) {
        console.warn('Firestore concludePromotionRequest error:', err);
      }
    }

    // Se aprovada, promover cargo do usuário
    if (outcome === 'aprovada') {
      try {
        const users = await this.getCommunityUsers();
        const uIdx = users.findIndex((u) => u.uid === req.candidateUid);
        if (uIdx >= 0) {
          users[uIdx].role = req.targetRole;
          localStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
          if (firebaseActive && db) {
            await setDoc(doc(db, 'users', req.candidateUid), { role: req.targetRole }, { merge: true });
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar cargo de usuário:', e);
      }
    }

    return {
      success: true,
      message: `Candidatura homologada como [${outcome.toUpperCase()}].`,
      updatedRequest: req,
    };
  },

  // === ADMIN CONTACT TICKETS ===
  async getAdminTickets(user?: UserProfile | null): Promise<AdminContactTicket[]> {
    initializeLocalStorage();
    let tickets: AdminContactTicket[] = [];

    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'admin_tickets'));
        const list: AdminContactTicket[] = [];
        snap.forEach((d) => list.push(d.data() as AdminContactTicket));
        localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(list));
        tickets = list;
      } catch (err) {
        console.warn('Firestore getAdminTickets error:', err);
      }
    }

    if (tickets.length === 0) {
      tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]');
    }

    // Se não for staff (admin/moderador), filtrar apenas chamados criados pelo usuário
    const isStaff = user?.role === 'admin' || user?.role === 'moderador';
    if (!isStaff && user) {
      return tickets
        .filter((t) => t.userUid === user.uid || (user.email && t.userEmail === user.email))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    user?: UserProfile | null
  ): Promise<{ success: boolean; message: string; ticket?: AdminContactTicket }> {
    const id = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const isGuest = !user;
    const initialMessage: AdminTicketMessage = {
      id: `msg-${Date.now()}`,
      senderUid: user?.uid || `guest-${Date.now()}`,
      senderName: user?.displayName || user?.username || data.guestName || 'Visitante',
      senderRole: user?.role || 'leitor',
      isStaff: user?.role === 'admin' || user?.role === 'moderador',
      message: data.description,
      timestamp: now,
    };

    const newTicket: AdminContactTicket = {
      id,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      status: 'aberto',
      userUid: user?.uid || `guest-${Date.now()}`,
      userUsername: user?.username || data.guestName || 'Visitante',
      userDisplayName: user?.displayName || data.guestName || 'Visitante',
      userEmail: user?.email || data.guestEmail,
      userRole: user?.role || 'leitor',
      isGuestSubmission: isGuest,
      relatedArticleTitle: data.relatedArticleTitle,
      relatedArticleId: data.relatedArticleId,
      description: data.description,
      evidenceLinks: data.evidenceLinks || [],
      createdAt: now,
      updatedAt: now,
      messages: [initialMessage],
    };

    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    allTickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'admin_tickets', id), newTicket);
      } catch (err) {
        console.warn('Firestore createAdminTicket error:', err);
      }
    }

    return {
      success: true,
      message: 'Chamado aberto com sucesso! A equipe de moderação e administração foi notificada.',
      ticket: newTicket,
    };
  },

  async addAdminTicketMessage(
    ticketId: string,
    message: string,
    sender: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const idx = allTickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Chamado não encontrado.' };

    const ticket = allTickets[idx];
    const isStaff = sender.role === 'admin' || sender.role === 'moderador';
    const now = new Date().toISOString();

    const newMessage: AdminTicketMessage = {
      id: `msg-${Date.now()}`,
      senderUid: sender.uid,
      senderName: sender.displayName || sender.username,
      senderRole: sender.role,
      isStaff,
      message,
      timestamp: now,
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = now;
    if (isStaff && ticket.status === 'aberto') {
      ticket.status = 'respondido';
    }

    allTickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'admin_tickets', ticketId), ticket);
      } catch (err) {
        console.warn('Firestore addAdminTicketMessage error:', err);
      }
    }

    return { success: true, message: 'Mensagem adicionada com sucesso.', updatedTicket: ticket };
  },

  async updateAdminTicketStatus(
    ticketId: string,
    status: AdminTicketStatus,
    resolutionNotes: string,
    resolver: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const idx = allTickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Chamado não encontrado.' };

    const ticket = allTickets[idx];
    const now = new Date().toISOString();
    ticket.status = status;
    ticket.updatedAt = now;
    if (resolutionNotes) ticket.resolutionSummary = resolutionNotes;
    if (status === 'resolvido' || status === 'arquivado') {
      ticket.closedAt = now;
    }

    allTickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'admin_tickets', ticketId), ticket);
      } catch (err) {
        console.warn('Firestore updateAdminTicketStatus error:', err);
      }
    }

    return { success: true, message: `Status do chamado alterado para [${status.toUpperCase()}].`, updatedTicket: ticket };
  },

  async assignAdminTicket(
    ticketId: string,
    assigneeUid: string,
    assigneeName: string,
    assigner: UserProfile
  ): Promise<{ success: boolean; message: string; updatedTicket?: AdminContactTicket }> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const idx = allTickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Chamado não encontrado.' };

    const ticket = allTickets[idx];
    ticket.assignedAdminUid = assigneeUid;
    ticket.assignedAdmin = assigneeName;
    ticket.status = 'em_analise';
    ticket.updatedAt = new Date().toISOString();

    allTickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.ADMIN_TICKETS, JSON.stringify(allTickets));

    if (firebaseActive && db) {
      try {
        await setDoc(doc(db, 'admin_tickets', ticketId), ticket);
      } catch (err) {
        console.warn('Firestore assignAdminTicket error:', err);
      }
    }

    return { success: true, message: `Chamado atribuído a ${assigneeName}.`, updatedTicket: ticket };
  },

  async deleteAdminTicket(ticketId: string, deleter: UserProfile): Promise<boolean> {
    const allTickets: AdminContactTicket[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ADMIN_TICKETS) || '[]'
    );
    const filtered = allTickets.filter((t) => t.id !== ticketId);
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

  // === ARBITRATION CASES ===
  async getArbitrationCases(langCode?: string): Promise<ArbitrationCase[]> {
    initializeLocalStorage();
    if (firebaseActive && db) {
      try {
        const snap = await getDocs(collection(db, 'arbitration_cases'));
        const list: ArbitrationCase[] = [];
        snap.forEach((d) => list.push(d.data() as ArbitrationCase));
        localStorage.setItem(STORAGE_KEYS.ARBITRATION_CASES, JSON.stringify(list));
        if (langCode && langCode !== 'all') {
          return list.filter((c) => c.langCode.toLowerCase() === langCode.toLowerCase());
        }
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.warn('Firestore getArbitrationCases error:', err);
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
        const list: ArbitrationCommitteeMember[] = [];
        snap.forEach((d) => list.push(d.data() as ArbitrationCommitteeMember));
        localStorage.setItem(STORAGE_KEYS.ARBITRATION_MEMBERS, JSON.stringify(list));
        if (langCode && langCode !== 'all') {
          return list.filter((m) => m.langCode.toLowerCase() === langCode.toLowerCase());
        }
        return list;
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
