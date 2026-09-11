import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WikiHub } from './components/WikiHub';
import { RecentChanges } from './components/RecentChanges';
import { ArticleViewer } from './components/ArticleViewer';
import { WikitextEditor } from './components/WikitextEditor';
import { SpecialPagesView } from './components/SpecialPagesView';
import { UserPageView } from './components/UserPageView';
import { AdminUsersManagementView } from './components/AdminUsersManagementView';
import { CheckUserView } from './components/CheckUserView';
import { UnblockRequestsView } from './components/UnblockRequestsView';
import { PromotionRequestsView } from './components/PromotionRequestsView';
import { ContactAdminView } from './components/ContactAdminView';
import { EmergencyContactView } from './components/EmergencyContactView';
import { FirebaseAdminDashboard } from './components/FirebaseAdminDashboard';
import { CreatePageModal } from './components/CreatePageModal';
import { GeminiChatbotDrawer } from './components/GeminiChatbotDrawer';
import { GeminiPremiumModal } from './components/GeminiPremiumModal';
import { GeminiNotebook } from './components/GeminiNotebook';
import { CookieBanner } from './components/CookieBanner';
import { BannedOverlay } from './components/BannedOverlay';
import { LgpdConsentModal } from './components/LgpdConsentModal';
import { MyDataModal } from './components/MyDataModal';
import { LanguageModal } from './components/LanguageModal';
import {
  SecurityView,
  DonationView,
  PrivacyPolicyView,
  TermsOfUseView,
  BetaModeView,
  OfflineModeView,
} from './components/InformativeViews';
import { SiteUpdatesView } from './components/SiteUpdatesView';
import { FileUploadView } from './components/FileUploadView';
import { FilePageView } from './components/FilePageView';
import { FilesGalleryView } from './components/FilesGalleryView';
import { ArbitrationCommitteeView } from './components/ArbitrationCommitteeView';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileSearchModal } from './components/MobileSearchModal';
import { MobileDrawerMenu } from './components/MobileDrawerMenu';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SmartTVView } from './components/SmartTVView';
import { SmartTVInstallModal } from './components/SmartTVInstallModal';
import { AppearanceSettingsView } from './components/AppearanceSettingsView';
import { AdvancedSearchView } from './components/AdvancedSearchView';
import { WikiCompetitorComparisonView } from './components/WikiCompetitorComparisonView';
import { WazzimaGiyggProfileView } from './components/WazzimaGiyggProfileView';
import { updateSEO } from './utils/seoManager';
import { StorageService } from './services/storageService';
import {
  WikiPage,
  WikiArticle,
  UserProfile,
  NotificationItem,
  CookieConsent,
  ViewMode,
  ArticleHistoryItem,
  DeviceMode,
  AppTheme,
} from './types';
import {
  getUidFromUrl,
  setBrowserUid,
  getCanonicalUid,
  resolveNavigationUid,
} from './utils/urlRouter';

export default function App() {
  // === STATE MANAGEMENT ===
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [cookieConsent, setCookieConsent] = useState<CookieConsent | null>(null);
  const [showLgpdModal, setShowLgpdModal] = useState<boolean>(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState<boolean>(false);
  const [showMyDataModal, setShowMyDataModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSmartTVModal, setShowSmartTVModal] = useState<boolean>(false);
  const [showGeminiChatbot, setShowGeminiChatbot] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [premiumQuotaType, setPremiumQuotaType] = useState<'chats' | 'images' | 'notebook' | undefined>();
  const [showNotebookModal, setShowNotebookModal] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<ViewMode>('hub');
  const [selectedPageUid, setSelectedPageUid] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);
  const [targetUserIdentifier, setTargetUserIdentifier] = useState<string>('WazzimaGiygg');
  const [userPageInitialTab, setUserPageInitialTab] = useState<'profile' | 'talk' | 'contributions' | 'admin'>('profile');
  const [selectedFileName, setSelectedFileName] = useState<string>('Logo_WikiZero.svg');
  const [uploadInitialTargetName, setUploadInitialTargetName] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    const saved = localStorage.getItem('wikizero_device_mode');
    if (saved === 'mobile' || saved === 'desktop' || saved === 'auto' || saved === 'tv') {
      return saved as DeviceMode;
    }
    return 'auto';
  });

  const handleToggleDeviceMode = (mode: DeviceMode) => {
    setDeviceMode(mode);
    localStorage.setItem('wikizero_device_mode', mode);
    if (mode === 'tv') {
      setCurrentView('smart-tv');
    }
  };
  // Multi-theme state supporting light, dark, google, google-dark, win95, genshin, android15, stardew, repo, minecraft, roblox, nokia3310
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('wikizero_theme_v3') as AppTheme | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'google' || saved === 'google-dark' || saved === 'win95' || saved === 'genshin' || saved === 'android15' || saved === 'stardew' || saved === 'repo' || saved === 'minecraft' || saved === 'roblox' || saved === 'nokia3310')) {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const isDark = theme === 'dark' || theme === 'google-dark' || theme === 'genshin' || theme === 'android15' || theme === 'repo' || theme === 'minecraft' || theme === 'roblox';

  // Apply appropriate theme classes to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-google', 'theme-google-dark', 'theme-win95', 'theme-genshin', 'theme-android15', 'theme-stardew', 'theme-repo', 'theme-minecraft', 'theme-roblox', 'theme-nokia3310');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'google') {
      root.classList.add('theme-google');
    } else if (theme === 'google-dark') {
      root.classList.add('dark', 'theme-google', 'theme-google-dark');
    } else if (theme === 'win95') {
      root.classList.add('theme-win95');
    } else if (theme === 'genshin') {
      root.classList.add('dark', 'theme-genshin');
    } else if (theme === 'android15') {
      root.classList.add('dark', 'theme-android15');
    } else if (theme === 'stardew') {
      root.classList.add('theme-stardew');
    } else if (theme === 'repo') {
      root.classList.add('dark', 'theme-repo');
    } else if (theme === 'minecraft') {
      root.classList.add('dark', 'theme-minecraft');
    } else if (theme === 'roblox') {
      root.classList.add('dark', 'theme-roblox');
    } else if (theme === 'nokia3310') {
      root.classList.add('theme-nokia3310');
    }

    localStorage.setItem('wikizero_theme_v3', theme);
  }, [theme]);

  // Navigate to any page/article/view/user/file by UID
  const handleNavigateByUid = (rawUid: string, mode: 'push' | 'replace' = 'push') => {
    if (!rawUid || !rawUid.trim()) {
      handleNavigate('hub');
      return;
    }

    const target = resolveNavigationUid(rawUid, articles, pages);

    switch (target.type) {
      case 'article':
        setSelectedArticleId(target.articleId);
        StorageService.incrementArticleViews(target.articleId);
        setCurrentView('article');
        break;

      case 'article-title':
        handleNavigateToArticleByTitle(target.title);
        break;

      case 'page':
        handleSelectPage(target.pageUid);
        break;

      case 'view':
        handleNavigate(target.view);
        break;

      case 'user':
        handleNavigateToUser(target.username, target.initialTab || 'profile');
        break;

      case 'file':
        handleNavigateToFile(target.fileName);
        break;

      case 'upload':
        handleNavigateToUpload(target.targetName);
        break;

      case 'checkuser':
        handleNavigateToCheckUser(target.target);
        break;

      case 'arbitration-case':
        setCurrentView('arbitration');
        break;

      case 'create-page':
        setShowCreatePageModal(true);
        break;

      case 'editor':
        if (target.articleId) {
          const art = articles.find((a) => a.id === target.articleId);
          if (art) {
            handleOpenEditorForEdit(art);
          } else {
            handleOpenNewEditor();
          }
        } else {
          handleOpenNewEditor(target.pageUid);
        }
        break;

      default:
        setCurrentView('hub');
        break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load initial data and resolve URL query ?uid=
  useEffect(() => {
    const loadData = async () => {
      const p = await StorageService.getPages();
      const a = await StorageService.getArticles();
      const u = StorageService.getCurrentUser();
      const n = StorageService.getNotifications();
      const c = StorageService.getCookieConsent();
      const lgpdAccepted = StorageService.isLgpdTermsAccepted();

      setPages(p);
      setArticles(a);
      setNotifications(n);
      setCookieConsent(c);

      // Verificar banimento do usuário em cache ao carregar
      if (u) {
        const banCheck = await StorageService.getUserBanStatus(u.uid, u.email, u.username || u.displayName);
        if (banCheck.isBanned || u.isBanned) {
          await StorageService.logout();
          setUser(null);
          console.warn('[App] Sessão revogada: usuário bloqueado por decisão administrativa.');
        } else {
          setUser(u);
          // Garantir que a página pública do usuário logado exista e esteja sincronizada
          if (!u.isGuest) {
            StorageService.ensureUserPage(u).then((verified) => {
              setUser(verified);
            }).catch((e) => console.warn('[App] ensureUserPage error on boot:', e));
          }
        }
      } else {
        setUser(null);
      }

      // Trigger LGPD term modal if not yet accepted
      if (!lgpdAccepted) {
        setShowLgpdModal(true);
      }

      // Check URL for ?uid= on first boot
      const initialUid = getUidFromUrl();
      if (initialUid) {
        const target = resolveNavigationUid(initialUid, a, p);
        switch (target.type) {
          case 'article':
            setSelectedArticleId(target.articleId);
            StorageService.incrementArticleViews(target.articleId);
            setCurrentView('article');
            break;
          case 'article-title':
            const matchArt = await StorageService.getArticleByTitle(target.title);
            if (matchArt) {
              setSelectedArticleId(matchArt.id);
              StorageService.incrementArticleViews(matchArt.id);
              setCurrentView('article');
            } else {
              setEditingArticle({
                id: '',
                pageUid: p[0]?.uid || 'wikizero_info',
                titulo: target.title,
                descricao: `= ${target.title} =\nEste artigo ainda não foi escrito. Seja o primeiro a contribuir com seu conhecimento!`,
                categoria: 'Geral',
                idioma: 'Português',
                dataCriacao: new Date().toISOString(),
              });
              setCurrentView('editor');
            }
            break;
          case 'page':
            setSelectedPageUid(target.pageUid);
            const pageArticles = a.filter((item) => item.pageUid === target.pageUid);
            if (pageArticles.length > 0) {
              setSelectedArticleId(pageArticles[0].id);
              setCurrentView('article');
            } else {
              setCurrentView('editor');
            }
            break;
          case 'view':
            setCurrentView(target.view);
            break;
          case 'user':
            setTargetUserIdentifier(target.username);
            setUserPageInitialTab(target.initialTab || 'profile');
            setCurrentView('user-page');
            break;
          case 'file':
            setSelectedFileName(target.fileName);
            setCurrentView('file-page');
            break;
          case 'upload':
            setUploadInitialTargetName(target.targetName || '');
            setCurrentView('upload');
            break;
          case 'checkuser':
            setTargetUserIdentifier(target.target);
            setCurrentView('checkuser');
            break;
          case 'arbitration-case':
            setCurrentView('arbitration');
            break;
          case 'create-page':
            setShowCreatePageModal(true);
            break;
          case 'editor':
            setCurrentView('editor');
            break;
          default:
            break;
        }
      }
    };
    loadData();

    // Inscrição em tempo real com o Firestore para sincronização entre múltiplos navegadores e sessões anônimas
    const unsubArticles = StorageService.subscribeToArticles((updatedArticles) => {
      setArticles(updatedArticles);
    });
    const unsubPages = StorageService.subscribeToPages((updatedPages) => {
      setPages(updatedPages);
    });

    return () => {
      unsubArticles();
      unsubPages();
    };
  }, []);

  // Listen to browser Back/Forward (popstate) and hash changes for deep linking
  useEffect(() => {
    const handleUrlChange = () => {
      const uid = getUidFromUrl();
      if (uid) {
        handleNavigateByUid(uid, 'replace');
      } else {
        setCurrentView('hub');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [articles, pages]);

  // Keep browser URL query string ?uid= synchronized with current application view and state
  useEffect(() => {
    if (pages.length === 0 && articles.length === 0) return;
    const currentActiveArticle = currentView === 'article'
      ? (articles.find((a) => a.id === selectedArticleId) || articles[0])
      : null;

    const canonicalUid = getCanonicalUid(currentView, {
      selectedArticle: currentActiveArticle,
      selectedPageUid,
      targetUserIdentifier,
      selectedFileName,
      uploadInitialTargetName,
    });

    setBrowserUid(canonicalUid, 'replace');
  }, [
    currentView,
    selectedArticleId,
    selectedPageUid,
    targetUserIdentifier,
    selectedFileName,
    uploadInitialTargetName,
    articles,
    pages,
  ]);

  // Keep SEO, document title, meta tags, OpenGraph and Schema.org JSON-LD dynamically in sync
  useEffect(() => {
    const currentActiveArticle =
      currentView === 'article'
        ? articles.find((a) => a.id === selectedArticleId) || null
        : null;

    const currentActivePage = selectedPageUid
      ? pages.find((p) => p.uid === selectedPageUid) || null
      : null;

    updateSEO({
      view: currentView,
      article: currentActiveArticle,
      page: currentActivePage,
      breadcrumbs: currentActiveArticle
        ? [
            { name: 'Início', url: '/?uid=hub' },
            { name: currentActivePage?.titulo || 'Coleção', url: `/?uid=${currentActiveArticle.pageUid}` },
            { name: currentActiveArticle.titulo, url: `/?uid=${currentActiveArticle.id}` },
          ]
        : undefined,
    });
  }, [currentView, selectedArticleId, selectedPageUid, articles, pages]);

  // === HANDLERS ===
  const handleSetTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
  };

  const handleToggleTheme = () => {
    if (theme === 'google') {
      setTheme('google-dark');
    } else if (theme === 'google-dark') {
      setTheme('google');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const handleNavigate = (view: ViewMode) => {
    if (view === 'user-page' && user) {
      setTargetUserIdentifier(user.uid || user.displayName || user.username);
      setUserPageInitialTab('profile');
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToFile = (fileName: string) => {
    const sanitized = fileName.replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '').replace(/\s+/g, '_');
    setSelectedFileName(sanitized);
    setCurrentView('file-page');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToUpload = (targetName?: string) => {
    if (targetName) {
      const sanitized = targetName.replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '').replace(/\s+/g, '_');
      setUploadInitialTargetName(sanitized);
    } else {
      setUploadInitialTargetName('');
    }
    setCurrentView('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNotify = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    StorageService.addNotification({
      title: type === 'success' ? '✅ Sucesso' : type === 'warning' ? '⚠️ Atenção' : 'ℹ️ Informação',
      message,
      type,
    });
    setNotifications(StorageService.getNotifications());
  };

  const handleNavigateToUser = (identifier: string, initialTab: 'profile' | 'talk' | 'contributions' | 'admin' = 'profile') => {
    setTargetUserIdentifier(identifier);
    setUserPageInitialTab(initialTab);
    setCurrentView('user-page');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCheckUser = (identifier: string) => {
    setTargetUserIdentifier(identifier);
    setCurrentView('checkuser');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPage = (pageUid: string) => {
    setSelectedPageUid(pageUid);
    const pageArticles = articles.filter((a) => a.pageUid === pageUid);
    if (pageArticles.length > 0) {
      setSelectedArticleId(pageArticles[0].id);
      StorageService.incrementArticleViews(pageArticles[0].id);
      setCurrentView('article');
    } else {
      // Prompt to create an article in this collection
      setEditingArticle(null);
      setCurrentView('editor');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    StorageService.incrementArticleViews(articleId);
    setCurrentView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToArticleByTitle = async (title: string) => {
    const art = await StorageService.getArticleByTitle(title);
    if (art) {
      setSelectedArticleId(art.id);
      StorageService.incrementArticleViews(art.id);
      setCurrentView('article');
    } else {
      // If article doesn't exist, open editor with title prefilled!
      setEditingArticle({
        id: '',
        pageUid: pages[0]?.uid || 'wikizero_info',
        titulo: title,
        descricao: `= ${title} =\nEste artigo ainda não foi escrito. Seja o primeiro a contribuir com seu conhecimento!`,
        categoria: 'Geral',
        idioma: 'Português',
        dataCriacao: new Date().toISOString(),
      });
      setCurrentView('editor');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRandomPage = () => {
    if (articles.length > 0) {
      const randomIndex = Math.floor(Math.random() * articles.length);
      const randomArticle = articles[randomIndex];
      handleSelectArticle(randomArticle.id);
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) {
      setCurrentView('search');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const query = searchQuery.trim();

    // Check if query is a UID parameter, prefix, or special route
    if (
      query.startsWith('?') ||
      /^uid=/i.test(query) ||
      /^(?:Special|User|File|Arquivo|Case|Page|CheckUser):/i.test(query) ||
      query.startsWith('@')
    ) {
      handleNavigateByUid(query);
      return;
    }

    // Direct match on article ID (e.g. art-1, art-wiki-001)
    const matchById = articles.find((a) => a.id.toLowerCase() === query.toLowerCase());
    if (matchById) {
      handleSelectArticle(matchById.id);
      return;
    }

    // Direct match on page collection UID (e.g. ferrovias)
    const matchPage = pages.find(
      (p) => p.uid.toLowerCase() === query.toLowerCase() || p.titulo.toLowerCase() === query.toLowerCase()
    );
    if (matchPage) {
      handleSelectPage(matchPage.uid);
      return;
    }

    // Navigate to Advanced Search View with results, filters, and highlighters
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers
  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = async (loggedUser: UserProfile) => {
    const banCheck = await StorageService.getUserBanStatus(
      loggedUser.uid,
      loggedUser.email,
      loggedUser.username || loggedUser.displayName
    );
    if (banCheck.isBanned || loggedUser.isBanned) {
      await StorageService.logout();
      setUser(null);
      alert(
        `Acesso Recusado: Usuários bloqueados não podem realizar login na WikiZero.\n\nMotivo: ${
          banCheck.reason || loggedUser.banReason || 'Decisão administrativa.'
        }`
      );
      return;
    }
    if (!loggedUser.isGuest) {
      const verified = await StorageService.ensureUserPage(loggedUser);
      setUser(verified);
      setTargetUserIdentifier(verified.uid);
    } else {
      setUser(loggedUser);
    }
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setUser(null);
  };

  // Notifications
  const handleMarkNotificationsAsRead = () => {
    const updated = StorageService.markNotificationsAsRead();
    setNotifications(updated);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (notif.link) {
      handleNavigateToArticleByTitle(notif.link);
    }
  };

  // Cookie & LGPD Handlers
  const handleAcceptAllCookies = () => {
    const saved = StorageService.saveCookieConsent({
      essential: true,
      analytics: true,
      advertising: true,
    });
    setCookieConsent(saved);
  };

  const handleRejectCookies = () => {
    const saved = StorageService.saveCookieConsent({
      essential: true,
      analytics: false,
      advertising: false,
    });
    setCookieConsent(saved);
  };

  const handleSaveCustomCookies = (consentData: Omit<CookieConsent, 'timestamp' | 'version'>) => {
    const saved = StorageService.saveCookieConsent(consentData);
    setCookieConsent(saved);
  };

  const handleAcceptLgpd = (birthdate: string) => {
    const res = StorageService.saveLgpdTermsAccepted(birthdate);
    if (res.success) {
      setShowLgpdModal(false);
      const u = StorageService.getCurrentUser();
      setUser(u);
    }
  };

  const handleDeclineLgpd = () => {
    // Keep modal in blocking barrier state
  };

  const handleRevokeConsent = () => {
    StorageService.revokeConsent();
    setCookieConsent(null);
    setShowLgpdModal(true);
    setShowMyDataModal(false);
  };

  const handleRequestDeletion = () => {
    if (confirm('Tem certeza que deseja solicitar a anonimização e exclusão total dos seus dados conforme o Art. 18 da LGPD?')) {
      StorageService.clearUser();
      setUser(null);
      setShowMyDataModal(false);
      alert('Sua solicitação foi registrada. Seus dados pessoais vinculados foram desassociados e serão anonimizados em até 30 dias.');
    }
  };

  // Content Handlers
  const handleCreatePage = async (pageData: Omit<WikiPage, 'criadoEm' | 'articleCount'>) => {
    const newPage = await StorageService.createPage(pageData);
    const updatedPages = await StorageService.getPages();
    setPages(updatedPages);
    setSelectedPageUid(newPage.uid);
    setEditingArticle(null);
    setCurrentView('editor');
  };

  const handleSaveArticle = async (
    articleData: Partial<WikiArticle> & { titulo: string; pageUid: string; descricao: string },
    editSummary: string,
    isMinor?: boolean
  ) => {
    const saved = await StorageService.saveArticle(articleData, user, editSummary, isMinor);
    const updatedArticles = await StorageService.getArticles();
    const updatedPages = await StorageService.getPages();

    setArticles(updatedArticles);
    setPages(updatedPages);
    setSelectedArticleId(saved.id);
    setSelectedPageUid(saved.pageUid);
    setEditingArticle(null);
    setCurrentView('article');
  };

  const handleRestoreRevision = async (historyItem: ArticleHistoryItem) => {
    if (!activeArticle) return;
    const restoredText = historyItem.conteudo || activeArticle.descricao;
    const confirmRestore = confirm(
      `Deseja realmente reverter o artigo "${activeArticle.titulo}" para a revisão de ${new Date(historyItem.data).toLocaleString('pt-BR')} feita por ${historyItem.autor}?`
    );
    if (!confirmRestore) return;

    await handleSaveArticle(
      {
        id: activeArticle.id,
        titulo: activeArticle.titulo,
        pageUid: activeArticle.pageUid,
        categoria: activeArticle.categoria,
        idioma: activeArticle.idioma,
        descricao: restoredText,
      },
      `Reversão para a revisão de ${new Date(historyItem.data).toLocaleDateString('pt-BR')} (${historyItem.autor})`,
      false
    );
  };

  const handleDeleteArticle = async (articleId: string) => {
    await StorageService.deleteArticle(articleId);
    const updatedArticles = await StorageService.getArticles();
    const updatedPages = await StorageService.getPages();
    setArticles(updatedArticles);
    setPages(updatedPages);
    setCurrentView('hub');
  };

  const handleOpenEditorForEdit = (article: WikiArticle) => {
    setEditingArticle(article);
    setCurrentView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewEditor = (defaultUid?: string) => {
    setEditingArticle(null);
    if (defaultUid) setSelectedPageUid(defaultUid);
    setCurrentView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gemini Premium & Notebook Handlers
  const handleOpenPremiumModal = (quotaType?: 'chats' | 'images' | 'notebook') => {
    setPremiumQuotaType(quotaType);
    setShowPremiumModal(true);
  };

  const handleOpenNotebookModal = () => {
    setShowNotebookModal(true);
  };

  const handleInsertFromNotebook = (articleData: {
    titulo: string;
    categoria: string;
    pageUid: string;
    descricao: string;
    resumo: string;
  }) => {
    setSelectedArticleId(null);
    setEditingArticle({
      id: '',
      titulo: articleData.titulo,
      categoria: articleData.categoria,
      pageUid: articleData.pageUid,
      idioma: 'Português',
      descricao: articleData.descricao,
      resumo: articleData.resumo,
      autor: user?.displayName || user?.username || 'Editor Gemini Notebook',
      dataCriacao: new Date().toISOString(),
      dataModificacao: new Date().toISOString(),
      versao: 1,
    } as WikiArticle);
    setSelectedPageUid(articleData.pageUid);
    setCurrentView('editor');
    setShowNotebookModal(false);
    handleNotify(`Artigo "${articleData.titulo}" gerado pelo Gemini Notebook e inserido no editor!`, 'success');
  };

  // Find active article and page
  const activeArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];
  const activePage = pages.find((p) => p.uid === (activeArticle?.pageUid || selectedPageUid)) || pages[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Top Header */}
      <Header
        user={user}
        notifications={notifications}
        currentView={currentView}
        searchQuery={searchQuery}
        isDark={isDark}
        theme={theme}
        deviceMode={deviceMode}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onRandomPage={handleRandomPage}
        onNavigate={handleNavigate}
        onNavigateToUser={handleNavigateToUser}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        onToggleTheme={handleToggleTheme}
        onSetTheme={handleSetTheme}
        onToggleDeviceMode={handleToggleDeviceMode}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenMobileSearch={() => setIsMobileSearchOpen(true)}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
        onOpenLanguagesModal={() => setShowLanguageModal(true)}
        onOpenSmartTVModal={() => setShowSmartTVModal(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 lg:gap-6">
        {/* Collapsible Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          isCollapsed={isSidebarCollapsed}
          theme={theme}
          isDark={isDark}
          deviceMode={deviceMode}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNavigate={handleNavigate}
          onRandomPage={handleRandomPage}
          onCreatePageClick={() => setShowCreatePageModal(true)}
          totalPages={pages.length}
          totalArticles={articles.length}
          onSetTheme={handleSetTheme}
          onOpenLanguagesModal={() => setShowLanguageModal(true)}
          onOpenSmartTVModal={() => setShowSmartTVModal(true)}
          onOpenGeminiChatbot={() => setShowGeminiChatbot(true)}
          onOpenGeminiNotebook={handleOpenNotebookModal}
          onOpenGeminiPremium={() => handleOpenPremiumModal()}
        />

        {/* Content Body Container */}
        <main className="flex-1 min-w-0">
          {currentView === 'hub' && (
            <WikiHub
              pages={pages}
              articles={articles}
              user={user}
              searchQuery={searchQuery}
              onSelectPage={handleSelectPage}
              onSelectArticle={handleSelectArticle}
              onCreatePageClick={() => setShowCreatePageModal(true)}
              onCreateArticleClick={(uid) => handleOpenNewEditor(uid)}
              onOpenEditor={() => handleOpenNewEditor()}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'recent-changes' && (
            <RecentChanges
              articles={articles}
              pages={pages}
              currentUser={user}
              onSelectArticle={handleSelectArticle}
              onSelectPage={handleSelectPage}
              onOpenEditorForEdit={handleOpenEditorForEdit}
              onOpenNewEditor={(uid) => handleOpenNewEditor(uid)}
              onCreatePageClick={() => setShowCreatePageModal(true)}
              onNavigateToUser={handleNavigateToUser}
            />
          )}

          {currentView === 'article' && (
            activeArticle ? (
              <ArticleViewer
                article={activeArticle}
                page={activePage}
                user={user}
                allArticles={articles}
                allPages={pages}
                onEdit={handleOpenEditorForEdit}
                onDelete={handleDeleteArticle}
                onNavigateToPage={handleSelectPage}
                onNavigateToArticleByTitle={handleNavigateToArticleByTitle}
                onNavigateToArticleById={handleSelectArticle}
                onNavigateToUser={handleNavigateToUser}
                onBack={() => handleNavigate('hub')}
                onRestoreRevision={handleRestoreRevision}
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center max-w-xl mx-auto my-12 space-y-4">
                <div className="text-4xl">📄</div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif-heading">
                  Nenhum Artigo Encontrado
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Não há artigos carregados no banco de dados para visualização neste momento. Você pode iniciar uma nova publicação agora mesmo!
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleNavigate('hub')}
                    className="px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
                  >
                    Ir para a Página Inicial
                  </button>
                  <button
                    onClick={() => handleOpenNewEditor()}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    Escrever Artigo
                  </button>
                </div>
              </div>
            )
          )}

          {currentView === 'special-pages' && (
            <SpecialPagesView
              articles={articles}
              pages={pages}
              user={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToPage={handleSelectPage}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToEmergencyContact={() => handleNavigate('emergency-contact')}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToUnblockRequests={() => handleNavigate('unblock-requests')}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onNavigateToUsersList={() => handleNavigate('admin-users')}
              onNavigateToUpload={() => handleNavigateToUpload()}
              onNavigateToFilesList={() => handleNavigate('files-list')}
              onNavigateToArbitration={() => handleNavigate('arbitration')}
              onNavigateToAppearance={() => handleNavigate('appearance')}
              initialTab="all"
            />
          )}

          {currentView === 'watchlist' && (
            <SpecialPagesView
              articles={articles}
              pages={pages}
              user={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToPage={handleSelectPage}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToEmergencyContact={() => handleNavigate('emergency-contact')}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToUnblockRequests={() => handleNavigate('unblock-requests')}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onNavigateToUsersList={() => handleNavigate('admin-users')}
              onNavigateToUpload={() => handleNavigateToUpload()}
              onNavigateToFilesList={() => handleNavigate('files-list')}
              onNavigateToArbitration={() => handleNavigate('arbitration')}
              onNavigateToAppearance={() => handleNavigate('appearance')}
              initialTab="watchlist"
            />
          )}

          {currentView === 'upload' && (
            <FileUploadView
              user={user}
              initialTargetName={uploadInitialTargetName}
              onNavigateToFile={handleNavigateToFile}
              onNavigateToGallery={() => handleNavigate('files-list')}
              onNotify={handleNotify}
            />
          )}

          {currentView === 'file-page' && (
            <FilePageView
              fileName={selectedFileName || 'Logo_WikiZero.svg'}
              articles={articles}
              user={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToUpload={handleNavigateToUpload}
              onNavigateToGallery={() => handleNavigate('files-list')}
              onNotify={handleNotify}
            />
          )}

          {currentView === 'files-list' && (
            <FilesGalleryView
              user={user}
              onNavigateToFile={handleNavigateToFile}
              onNavigateToUpload={() => handleNavigateToUpload()}
            />
          )}

          {currentView === 'user-page' && (
            <UserPageView
              targetUserIdentifier={targetUserIdentifier || user?.uid || user?.displayName || user?.username || 'WazzimaGiygg'}
              currentUser={user}
              allArticles={articles}
              allPages={pages}
              initialTab={userPageInitialTab}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToPage={handleSelectPage}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToUnblockRequests={() => handleNavigate('unblock-requests')}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'admin-users' && (
            <AdminUsersManagementView
              currentUser={user}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onNavigateToUnblockRequests={() => handleNavigate('unblock-requests')}
              onNavigateToPromotionRequests={() => handleNavigate('promotion-requests')}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'checkuser' && (
            <CheckUserView
              currentUser={user}
              initialTarget={targetUserIdentifier || 'Usuario_Suspeito'}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToArticle={handleSelectArticle}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'unblock-requests' && (
            <UnblockRequestsView
              currentUser={user}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'promotion-requests' && (
            <PromotionRequestsView
              currentUser={user}
              onNavigateToUser={handleNavigateToUser}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'contact-admin' && (
            <ContactAdminView
              currentUser={user}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToEmergencyContact={() => handleNavigate('emergency-contact')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'emergency-contact' && (
            <EmergencyContactView
              currentUser={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToCheckUser={handleNavigateToCheckUser}
              onLoginClick={handleLoginClick}
              onNavigateToContactAdmin={() => handleNavigate('contact-admin')}
              onNavigateToArbCom={() => handleNavigate('arbitration')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'arbitration' && (
            <ArbitrationCommitteeView
              user={user}
              onNavigateToUser={handleNavigateToUser}
              onNavigateToArticle={handleSelectArticle}
              onLoginClick={() => setShowLgpdModal(true)}
            />
          )}

          {currentView === 'admin-firebase' && (
            <FirebaseAdminDashboard
              currentUser={user}
              pages={pages}
              articles={articles}
              onNavigateToPage={handleSelectPage}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToUpdates={() => handleNavigate('site-updates')}
              onBack={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'editor' && (
            <WikitextEditor
              initialArticle={editingArticle}
              defaultPageUid={selectedPageUid || undefined}
              pages={pages}
              user={user}
              onSave={handleSaveArticle}
              onCancel={() => handleNavigate(selectedArticleId ? 'article' : 'hub')}
              onOpenLoginModal={handleLoginClick}
              onOpenPremiumModal={handleOpenPremiumModal}
              onOpenNotebookModal={handleOpenNotebookModal}
            />
          )}

          {currentView === 'security' && (
            <SecurityView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'donation' && (
            <DonationView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'privacy' && (
            <PrivacyPolicyView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'terms' && (
            <TermsOfUseView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'beta' && (
            <BetaModeView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'offline' && (
            <OfflineModeView
              user={user}
              pages={pages}
              articles={articles}
              onNavigateToArticle={handleSelectArticle}
              onOpenEditor={() => handleOpenNewEditor()}
              onOpenSmartTVModal={() => setShowSmartTVModal(true)}
            />
          )}

          {currentView === 'site-updates' && (
            <SiteUpdatesView
              currentUser={user}
              onNavigateHome={() => handleNavigate('hub')}
              onSelectSpecialPage={(p) => handleNavigate(p as any)}
            />
          )}

          {currentView === 'appearance' && (
            <AppearanceSettingsView
              currentTheme={theme}
              onSetTheme={handleSetTheme}
              deviceMode={deviceMode}
              onToggleDeviceMode={handleToggleDeviceMode}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'search' && (
            <AdvancedSearchView
              articles={articles}
              pages={pages}
              user={user}
              initialQuery={searchQuery}
              theme={theme}
              onSearchQueryChange={(q) => setSearchQuery(q)}
              onSelectArticle={handleSelectArticle}
              onSelectPage={handleSelectPage}
              onOpenNewEditor={() => handleOpenNewEditor()}
              onNavigateHome={() => handleNavigate('hub')}
            />
          )}

          {currentView === 'comparison' && (
            <WikiCompetitorComparisonView
              onNavigate={handleNavigate}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'wazzimagiygg' && (
            <WazzimaGiyggProfileView
              onNavigate={handleNavigate}
              onOpenEditor={() => handleOpenNewEditor()}
            />
          )}

          {currentView === 'mydata' && (
            <div className="max-w-xl mx-auto">
              <button
                onClick={() => setShowMyDataModal(true)}
                className="w-full py-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
              >
                Abrir Painel do Titular de Dados
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 3. Global Footer */}
      <Footer
        onNavigate={handleNavigate}
        theme={theme}
        deviceMode={deviceMode}
        onToggleDeviceMode={handleToggleDeviceMode}
        onSetTheme={handleSetTheme}
        onOpenLanguagesModal={() => setShowLanguageModal(true)}
      />

      {/* 4. Mobile Bottom Navigation Bar (Fixed at bottom for smartphones) */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onRandomPage={handleRandomPage}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenSearch={() => setIsMobileSearchOpen(true)}
      />

      {/* 5. Mobile Search Fullscreen Modal */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        articles={articles}
        pages={pages}
        onSelectArticle={(id) => handleSelectArticle(id)}
        onSelectPage={(uid) => handleSelectPage(uid)}
        onSearchQuerySubmit={(q) => {
          setSearchQuery(q);
          setCurrentView('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdvancedSearch={(q) => {
          if (q) setSearchQuery(q);
          setCurrentView('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 6. Mobile Side Drawer Navigation Menu */}
      <MobileDrawerMenu
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentView={currentView}
        user={user}
        isDark={isDark}
        theme={theme}
        deviceMode={deviceMode}
        totalPages={pages.length}
        totalArticles={articles.length}
        onNavigate={handleNavigate}
        onToggleTheme={handleToggleTheme}
        onSetTheme={handleSetTheme}
        onToggleDeviceMode={handleToggleDeviceMode}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        onCreatePageClick={() => {
          setIsMobileDrawerOpen(false);
          setShowCreatePageModal(true);
        }}
        onOpenLanguagesModal={() => {
          setIsMobileDrawerOpen(false);
          setShowLanguageModal(true);
        }}
        onOpenSmartTVModal={() => {
          setIsMobileDrawerOpen(false);
          setShowSmartTVModal(true);
        }}
      />

      {/* 7. Modals & Overlays */}
      {/* Banned User Alert Overlay */}
      {user?.isBanned && (
        <BannedOverlay
          reason={user.banReason}
          currentUser={user}
          onLogout={handleLogout}
        />
      )}

      {/* First-visit LGPD Term Modal & Age Verification Gate */}
      <LgpdConsentModal
        isOpen={showLgpdModal}
        isAlreadyAccepted={StorageService.isLgpdTermsAccepted()}
        onClose={() => {
          if (StorageService.isLgpdTermsAccepted()) {
            setShowLgpdModal(false);
          }
        }}
        onAccept={handleAcceptLgpd}
        onDecline={handleDeclineLgpd}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Create Topic Collection Modal */}
      <CreatePageModal
        isOpen={showCreatePageModal}
        user={user}
        onClose={() => setShowCreatePageModal(false)}
        onCreate={handleCreatePage}
      />

      {/* Login Modal with reCAPTCHA verification */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* My Data Portability Modal */}
      <MyDataModal
        isOpen={showMyDataModal || currentView === 'mydata'}
        user={user}
        consent={cookieConsent}
        onClose={() => {
          setShowMyDataModal(false);
          if (currentView === 'mydata') setCurrentView('hub');
        }}
        onRevokeConsent={handleRevokeConsent}
        onRequestDeletion={handleRequestDeletion}
      />

      {/* Cookie Consent Banner */}
      {!cookieConsent && (
        <CookieBanner
          onAcceptAll={handleAcceptAllCookies}
          onRejectAll={handleRejectCookies}
          onSaveCustom={handleSaveCustomCookies}
        />
      )}

      {/* Smart TV Modal & Guide */}
      <SmartTVInstallModal
        isOpen={showSmartTVModal}
        onClose={() => setShowSmartTVModal(false)}
        onLaunchTVMode={() => {
          handleToggleDeviceMode('tv');
          handleNavigate('smart-tv');
        }}
      />

      {/* Smart TV 10-Foot Standalone Screen */}
      {currentView === 'smart-tv' && (
        <SmartTVView
          articles={articles}
          pages={pages}
          currentUser={user}
          onExitTVMode={() => {
            handleToggleDeviceMode('auto');
            handleNavigate('hub');
          }}
          onSelectArticleInDesktop={(artId) => {
            handleToggleDeviceMode('desktop');
            handleSelectArticle(artId);
          }}
        />
      )}

      {/* Network & PWA Offline Indicator */}
      <OfflineIndicator />

      {/* Floating Gemini Chatbot Launcher (Accessible across all views except TV mode) */}
      {currentView !== 'smart-tv' && (
        <button
          id="wikizero-gemini-floating-trigger"
          type="button"
          onClick={() => setShowGeminiChatbot(true)}
          className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold border border-white/20 select-none cursor-pointer"
          title="Abrir Chatbot Gemini (Google AI Studio) - Auxílio em Artigos e Coleções"
        >
          <Sparkles size={16} className="text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">Assistente Gemini</span>
        </button>
      )}

      {/* Global Gemini Chatbot Drawer */}
      <GeminiChatbotDrawer
        isOpen={showGeminiChatbot}
        onClose={() => setShowGeminiChatbot(false)}
        contextMode="general"
        currentUser={user}
        onOpenLoginModal={handleLoginClick}
        onOpenPremiumModal={handleOpenPremiumModal}
        onOpenNotebook={handleOpenNotebookModal}
        onApplyCollection={(col) => {
          setShowGeminiChatbot(false);
          setShowCreatePageModal(true);
        }}
        onApplyArticle={(art) => {
          setShowGeminiChatbot(false);
          handleOpenNewEditor();
        }}
      />

      {/* Gemini Premium Upsell Modal */}
      <GeminiPremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        currentUser={user}
        triggerQuotaType={premiumQuotaType}
        onOpenLogin={handleLoginClick}
        onUpgradeSuccess={() => {
          handleNotify('Plano Gemini Premium ativado com sucesso! Aproveite recursos ilimitados.', 'success');
        }}
      />

      {/* Gemini Notebook Modal & Article Synthesis Generator */}
      {showNotebookModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
            <GeminiNotebook
              currentUser={user}
              pages={pages}
              existingArticles={articles}
              onInsertArticle={handleInsertFromNotebook}
              onOpenPremiumModal={handleOpenPremiumModal}
              onClose={() => setShowNotebookModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
