import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Shuffle,
  Bell,
  CheckCheck,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  Shield,
  Layers,
  Edit3,
  BookOpen,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Globe2,
  ChevronDown,
  ChevronRight,
  Database,
  Menu,
  Smartphone,
  Monitor,
  Users,
} from 'lucide-react';
import { UserProfile, NotificationItem, ViewMode, DeviceMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';
import { StorageService } from '../services/storageService';

interface HeaderProps {
  user: UserProfile | null;
  notifications: NotificationItem[];
  currentView: ViewMode;
  searchQuery: string;
  isDark: boolean;
  deviceMode?: DeviceMode;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onRandomPage: () => void;
  onNavigate: (view: ViewMode) => void;
  onNavigateToUser?: (identifier: string) => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onToggleTheme: () => void;
  onToggleDeviceMode?: (mode: DeviceMode) => void;
  onOpenMobileDrawer?: () => void;
  onOpenMobileSearch?: () => void;
  onMarkNotificationsAsRead: () => void;
  onNotificationClick: (notif: NotificationItem) => void;
  onOpenLanguagesModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  currentView,
  searchQuery,
  isDark,
  deviceMode = 'auto',
  onSearchChange,
  onSearchSubmit,
  onRandomPage,
  onNavigate,
  onNavigateToUser,
  onLoginClick,
  onLogoutClick,
  onToggleTheme,
  onToggleDeviceMode,
  onOpenMobileDrawer,
  onOpenMobileSearch,
  onMarkNotificationsAsRead,
  onNotificationClick,
  onOpenLanguagesModal,
}) => {
  const { currentLanguage, setLanguage, t, allLanguages } = useLanguage();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showOnlineMenu, setShowOnlineMenu] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const onlineMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    StorageService.getOnlineUsers().then((users) => setOnlineUsers(users));
    const unsub = StorageService.subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (onlineMenuRef.current && !onlineMenuRef.current.contains(event.target as Node)) {
        setShowOnlineMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  // Quick popular languages list for instant header dropdown
  const popularLanguages = allLanguages.slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff] dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 transition-colors select-none">
      {/* High Density Top Micro Notice Bar */}
      <div className="bg-[#1e293b] dark:bg-[#090d16] text-slate-300 text-[11px] py-1 px-4 flex justify-between items-center border-b border-slate-800 font-mono">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded-xs text-[10px] font-bold">WIKIZERO v3.0</span>
          <span className="text-slate-400">{t('header.open_encyclopedia')}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <button
            onClick={onOpenLanguagesModal}
            className="hover:text-blue-300 flex items-center gap-1 text-slate-300 transition"
          >
            <Globe2 size={11} className="text-blue-400" />
            <span>{currentLanguage.flag} {currentLanguage.nativeName} ({currentLanguage.code})</span>
          </button>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">GNU GPL v3.0</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <a
            href={formatExternalUrl("https://github.com/WazzimaGiygg/Wiki-alternative")}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 flex items-center gap-1 text-slate-300"
          >
            GitHub <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Main High Density Header Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Side: Mobile Menu Button + Brand Logo & Title */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Hamburger Menu Trigger for Mobile Drawer */}
          <button
            id="btn-header-mobile-drawer"
            onClick={onOpenMobileDrawer}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden active:scale-95 transition"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={20} />
          </button>

          <div
            onClick={() => onNavigate('hub')}
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
          >
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-serif-heading font-bold text-lg shadow-xs group-hover:bg-blue-700 transition">
              W
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="font-serif-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  WazzimaGiygg
                </h1>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1 py-0.2 rounded-xs">
                  Wiki
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-none mt-0.5 hidden xs:block">
                {t('header.tagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Dense Global Search Bar (Desktop) */}
        <div className="flex-1 max-w-lg mx-2 hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('header.search_placeholder')}
              className="w-full pl-8 pr-20 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button
                onClick={onSearchSubmit}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
              >
                {t('header.search_btn')}
              </button>
              <button
                onClick={onRandomPage}
                title={t('header.random_page')}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Shuffle size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* High Density Navigation Links & Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Mobile Search Button (Visible on mobile/tablet) */}
          <button
            id="btn-header-mobile-search"
            onClick={onOpenMobileSearch}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition"
            aria-label="Pesquisar artigos"
            title="Buscar"
          >
            <Search size={16} />
          </button>
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium mr-1 border-r border-slate-200 dark:border-slate-800 pr-2">
            <button
              onClick={() => onNavigate('hub')}
              className={`px-2.5 py-1 rounded text-xs transition font-semibold ${
                currentView === 'hub'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('header.nav_hub')}
            </button>
            <button
              onClick={() => onNavigate('editor')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition font-semibold ${
                currentView === 'editor'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Edit3 size={13} />
              {t('header.nav_editor')}
            </button>
            <button
              onClick={() => onNavigate('beta')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition font-semibold ${
                currentView === 'beta'
                  ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles size={13} className="text-purple-500" />
              {t('header.nav_beta')}
            </button>
            <button
              id="btn-header-site-updates"
              onClick={() => onNavigate('site-updates')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition font-semibold ${
                currentView === 'site-updates'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Ver melhorias e notas de versão do sistema"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Atualizações</span>
              <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded-xs font-mono font-bold">
                v3.3
              </span>
            </button>
          </nav>

          {/* Language Switcher Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              title={t('header.change_language')}
            >
              <span className="text-sm">{currentLanguage.flag}</span>
              <span className="font-mono text-[11px] uppercase hidden sm:inline">{currentLanguage.code}</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in text-xs">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] font-mono">
                    {t('header.change_language')}
                  </span>
                  <span className="text-[10px] text-slate-400">45+ idiomas</span>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {popularLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition ${
                        currentLanguage.code === lang.code
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>

                <div className="p-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <button
                    onClick={() => {
                      setShowLangMenu(false);
                      if (onOpenLanguagesModal) onOpenLanguagesModal();
                    }}
                    className="w-full text-center py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Globe2 size={13} />
                    <span>{t('header.all_languages')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Online Users Trigger & Modal/Dropdown */}
          <div className="relative" ref={onlineMenuRef}>
            <button
              id="btn-header-online-users"
              onClick={() => setShowOnlineMenu(!showOnlineMenu)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              title="Ver quem está logado na WikiZero"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users size={13} className="text-slate-500 dark:text-slate-400" />
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {onlineUsers.length}
              </span>
              <span className="text-[11px] hidden md:inline font-normal text-slate-500 dark:text-slate-400">
                online
              </span>
            </button>

            {showOnlineMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in text-xs">
                <div className="px-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">Usuários Conectados</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    {onlineUsers.length} ativo{onlineUsers.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {onlineUsers.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      Nenhum outro usuário registrado ativo no momento.
                    </div>
                  ) : (
                    onlineUsers.map((u) => (
                      <div
                        key={u.uid}
                        onClick={() => {
                          setShowOnlineMenu(false);
                          if (onNavigateToUser) {
                            onNavigateToUser(u.uid);
                          } else {
                            onNavigate('user-page');
                          }
                        }}
                        className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {u.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {u.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              @{u.username || u.displayName?.toLowerCase().replace(/\s+/g, '')}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : u.role === 'moderador'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 mt-1 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                  <p className="leading-snug">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Regra de Contribuição:</span> Somente usuários cadastrados e logados podem editar verbetes ou abrir discussões.
                  </p>
                  {(!user || user.isGuest) && (
                    <button
                      onClick={() => {
                        setShowOnlineMenu(false);
                        onLoginClick();
                      }}
                      className="w-full py-1 px-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition text-center"
                    >
                      Fazer Login para Contribuir
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            title={isDark ? t('header.theme_light') : t('header.theme_dark')}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-1.5 relative rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t('header.notifications')}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-1.5 w-84 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in text-xs">
                <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500" />
                        Notas de Versão do Sistema
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Atualizações do sistema e notas de versão oficiais
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkNotificationsAsRead}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      title={t('header.mark_all_read')}
                    >
                      <CheckCheck size={12} />
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs px-4">
                      <Sparkles size={24} className="mx-auto mb-2 opacity-30 text-amber-500" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma atualização recente</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Você está na versão mais recente do sistema.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onNotificationClick(notif);
                          setShowNotifs(false);
                        }}
                        className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-start gap-2.5 ${
                          !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                            notif.type === 'success'
                              ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                              : notif.type === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {notif.title}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                              {notif.date}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('site-updates');
                      setShowNotifs(false);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5 w-full py-1 cursor-pointer"
                  >
                    <span>Ver todas as Notas de Versão do Sistema</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Area */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-5 h-5 rounded-xs object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-xs bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[90px] truncate">
                  {user.displayName}
                </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 shadow-lg py-1 z-50 animate-in fade-in text-xs">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                        {user.role === 'admin' ? 'Administrador' : user.role === 'editor' ? 'Editor' : 'Convidado'}
                      </span>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('user-page');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold"
                    >
                      <UserIcon size={13} className="text-blue-600 dark:text-blue-400" /> Minha Página de Usuário
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-users');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Layers size={13} className="text-purple-600 dark:text-purple-400" /> Diretório de Usuários
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin-firebase');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                    >
                      <Database size={13} className="text-amber-500" /> Admin Firebase DB
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('mydata');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon size={13} /> {t('header.my_data')}
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('security');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Shield size={13} /> {t('header.security')}
                    </button>
                    <button
                      onClick={() => {
                        onLogoutClick();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1"
                    >
                      <LogOut size={13} /> {t('header.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onLoginClick}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 shadow-xs"
              >
                <UserIcon size={12} />
                <span>{t('header.login')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
