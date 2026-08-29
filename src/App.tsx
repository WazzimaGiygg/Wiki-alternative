import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WikiHub } from './components/WikiHub';
import { RecentChanges } from './components/RecentChanges';
import { ArticleViewer } from './components/ArticleViewer';
import { WikitextEditor } from './components/WikitextEditor';
import { SpecialPagesView } from './components/SpecialPagesView';
import { CreatePageModal } from './components/CreatePageModal';
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
import { Footer } from './components/Footer';
import { StorageService } from './services/storageService';
import { WikiPage, WikiArticle, UserProfile, NotificationItem, CookieConsent, ViewMode, ArticleHistoryItem } from './types';

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

  const [currentView, setCurrentView] = useState<ViewMode>('hub');
  const [selectedPageUid, setSelectedPageUid] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticle | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('wikizero_theme_v3') === 'dark' ||
      (!localStorage.getItem('wikizero_theme_v3') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wikizero_theme_v3', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wikizero_theme_v3', 'light');
    }
  }, [isDark]);

  // Load initial data
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
      setUser(u);
      setNotifications(n);
      setCookieConsent(c);

      // Trigger LGPD term modal if not yet accepted
      if (!lgpdAccepted) {
        setShowLgpdModal(true);
      }
    };
    loadData();
  }, []);

  // Listen to hash changes for deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#wiki:')) {
        const title = decodeURIComponent(hash.substring(6));
        handleNavigateToArticleByTitle(title);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [articles]);

  // === HANDLERS ===
  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
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
    if (!searchQuery.trim()) return;
    const directMatch = articles.find((a) => a.titulo.toLowerCase().includes(searchQuery.toLowerCase()));
    if (directMatch) {
      handleSelectArticle(directMatch.id);
    } else {
      setCurrentView('hub');
    }
  };

  // Auth Handlers
  const handleLoginClick = async () => {
    try {
      const loggedUser = await StorageService.loginWithGoogle();
      setUser(loggedUser);
      StorageService.addNotification({
        title: '🔑 Autenticado com Sucesso',
        message: `Bem-vindo(a), ${loggedUser.displayName}!`,
        type: 'success',
      });
      setNotifications(StorageService.getNotifications());
    } catch (err) {
      console.warn('Google Auth popup failed, using Guest Profile:', err);
      const guest = StorageService.createGuestUser();
      setUser(guest);
      StorageService.addNotification({
        title: '👤 Modo Convidado Ativo',
        message: 'Você pode navegar e editar artigos com identificador anônimo.',
        type: 'info',
      });
      setNotifications(StorageService.getNotifications());
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

  const handleAcceptLgpd = (birthdate?: string) => {
    StorageService.saveLgpdTermsAccepted(birthdate);
    setShowLgpdModal(false);
  };

  const handleDeclineLgpd = () => {
    alert('Para utilizar os recursos colaborativos da WikiZero, o aceite dos termos LGPD é requerido.');
    setShowLgpdModal(false);
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

    StorageService.addNotification({
      title: isMinor ? '✏️ Edição Menor Registrada' : '📝 Artigo Publicado',
      message: `"${saved.titulo}" (${editSummary}) salvo com sucesso!`,
      type: 'success',
    });
    setNotifications(StorageService.getNotifications());
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
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onRandomPage={handleRandomPage}
        onNavigate={handleNavigate}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        onToggleTheme={handleToggleTheme}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
        onOpenLanguagesModal={() => setShowLanguageModal(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Collapsible Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNavigate={handleNavigate}
          onRandomPage={handleRandomPage}
          onCreatePageClick={() => setShowCreatePageModal(true)}
          totalPages={pages.length}
          totalArticles={articles.length}
          onOpenLanguagesModal={() => setShowLanguageModal(true)}
        />

        {/* Content Body Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-hidden">
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
            />
          )}

          {currentView === 'article' && activeArticle && (
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
              onBack={() => handleNavigate('hub')}
              onRestoreRevision={handleRestoreRevision}
            />
          )}

          {currentView === 'special-pages' && (
            <SpecialPagesView
              articles={articles}
              pages={pages}
              user={user}
              onNavigateToArticle={handleSelectArticle}
              onNavigateToPage={handleSelectPage}
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
              initialTab="watchlist"
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
      <Footer onNavigate={handleNavigate} />

      {/* 4. Modals & Overlays */}
      {/* Banned User Alert Overlay */}
      {user?.isBanned && (
        <BannedOverlay reason={user.banReason} onLogout={handleLogout} />
      )}

      {/* First-visit LGPD Term Modal */}
      <LgpdConsentModal
        isOpen={showLgpdModal}
        onClose={() => setShowLgpdModal(false)}
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
    </div>
  );
}
