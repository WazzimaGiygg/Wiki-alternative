import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Shuffle,
  Bell,
  CheckCheck,
  User as UserIcon,
  LogOut,
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
  Tv,
} from 'lucide-react';
import { UserProfile, NotificationItem, ViewMode, DeviceMode, AppTheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';
import { StorageService } from '../services/storageService';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface HeaderProps {
  user: UserProfile | null;
  notifications: NotificationItem[];
  currentView: ViewMode;
  searchQuery: string;
  isDark: boolean;
  theme?: AppTheme;
  deviceMode?: DeviceMode;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onRandomPage: () => void;
  onNavigate: (view: ViewMode) => void;
  onNavigateToUser?: (identifier: string) => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onToggleTheme: () => void;
  onSetTheme?: (theme: AppTheme) => void;
  onToggleDeviceMode?: (mode: DeviceMode) => void;
  onOpenMobileDrawer?: () => void;
  onOpenMobileSearch?: () => void;
  onMarkNotificationsAsRead: () => void;
  onNotificationClick: (notif: NotificationItem) => void;
  onOpenLanguagesModal?: () => void;
  onOpenSmartTVModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  currentView,
  searchQuery,
  isDark,
  theme = 'light',
  deviceMode = 'auto',
  onSearchChange,
  onSearchSubmit,
  onRandomPage,
  onNavigate,
  onNavigateToUser,
  onLoginClick,
  onLogoutClick,
  onToggleTheme,
  onSetTheme,
  onToggleDeviceMode,
  onOpenMobileDrawer,
  onOpenMobileSearch,
  onMarkNotificationsAsRead,
  onNotificationClick,
  onOpenLanguagesModal,
  onOpenSmartTVModal,
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

  const isGoogleTheme = theme === 'google' || theme === 'google-dark';
  const isWin95 = theme === 'win95';
  const isGenshin = theme === 'genshin';
  const isAndroid = theme === 'android15';
  const isStardew = theme === 'stardew';
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

  const handleSearchInputClick = () => {
    if (currentView !== 'search') {
      onNavigate('search');
    }
  };

  // Quick popular languages list for instant header dropdown
  const popularLanguages = allLanguages.slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff] dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 transition-colors select-none">
      {/* Windows 95 Top Window Title Bar */}
      {isWin95 && (
        <div className="win95-titlebar font-mono text-xs flex items-center justify-between px-2 py-0.5 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-3.5 h-3.5 bg-[#c0c0c0] border border-black flex items-center justify-center text-[9px] font-black text-[#000080]">
              W
            </div>
            <span className="font-bold text-white text-[11px] truncate tracking-wide">
              WikiZero 95 - Enciclopédia Multimídia de 32 bits [v3.0.1995]
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button className="w-4 h-3.5 bg-[#c0c0c0] text-black font-black text-[9px] flex items-center justify-center border-t border-l border-white border-r border-b border-black active:border-black leading-none" title="Minimizar">_</button>
            <button className="w-4 h-3.5 bg-[#c0c0c0] text-black font-black text-[9px] flex items-center justify-center border-t border-l border-white border-r border-b border-black active:border-black leading-none" title="Maximizar">□</button>
            <button
              onClick={() => onSetTheme?.('light')}
              className="w-4 h-3.5 bg-[#c0c0c0] text-black font-black text-[9px] flex items-center justify-center border-t border-l border-white border-r border-b border-black active:border-black leading-none hover:bg-red-600 hover:text-white"
              title="Fechar / Sair do Modo Windows 95"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Android 1.5 Notification Status Bar */}
      {isAndroid && (
        <div className="android-statusbar bg-black text-[#c4c4c4] text-[10px] font-sans flex items-center justify-between px-3 py-1 select-none border-b border-[#282828]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono font-bold text-[#A4C639]">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
              </svg>
              <span>Android 1.5</span>
            </span>
            <span className="text-[#555] hidden sm:inline">|</span>
            <span className="text-[#A4C639] font-bold text-[9px] px-1.5 py-0.2 rounded bg-[#A4C639]/15 border border-[#A4C639]/40 hidden sm:inline">
              Cupcake
            </span>
            <span className="text-[#888] text-[9px] hidden md:inline">HTC Dream • T-Mobile G1</span>
          </div>

          <div className="flex items-center gap-2.5 text-[10px]">
            <span className="text-[#A4C639] font-mono font-bold text-[9px]">3G</span>
            <div className="flex items-end gap-0.5 h-2.5" title="Sinal Celular">
              <span className="w-0.5 h-1 bg-[#A4C639]" />
              <span className="w-0.5 h-1.5 bg-[#A4C639]" />
              <span className="w-0.5 h-2 bg-[#A4C639]" />
              <span className="w-0.5 h-2.5 bg-[#A4C639]" />
            </div>
            <div className="flex items-center">
              <div className="w-4 h-2 border border-[#777] rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-[#A4C639]" />
              </div>
            </div>
            <span className="font-mono text-white text-[10px] font-semibold">12:30</span>
          </div>
        </div>
      )}

      {/* Google 4-Color Accent Line when Google Theme is active */}
      {isGoogleTheme && <div className="google-gradient-bar w-full" />}

      {/* Genshin Impact Celestial & 7-Elements Accent Line */}
      {isGenshin && <div className="genshin-accent-bar w-full" />}

      {/* Android 1.5 Robot Green Accent Line */}
      {isAndroid && <div className="android-accent-bar w-full" />}

      {/* Stardew Valley Prismatic & Golden Wheat Accent Line */}
      {isStardew && <div className="stardew-accent-bar w-full" />}

      {/* Stardew Valley Farm Clock & HUD Strip */}
      {isStardew && (
        <div className="stardew-notice-bar text-[11px] font-sans flex items-center justify-between px-3 py-1 select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 font-bold text-[#ffeb99]">
              <span className="text-amber-400">🌱</span>
              <span>Primavera, Dia 28</span>
            </span>
            <span className="text-[#8c5e29] hidden xs:inline">•</span>
            <span className="text-[#fce4a6] text-[10px] hidden sm:inline flex items-center gap-1">
              <span>☀️</span> Ensolarado
            </span>
            <span className="text-[#8c5e29] hidden md:inline">•</span>
            <span className="text-[#e2be78] text-[10px] hidden md:inline">Fazenda Vale da Estrela</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 font-mono font-bold text-[#fffae0]">
            <span className="text-[#ffd54f] text-[11px] flex items-center gap-1 bg-[#251506]/60 px-2 py-0.5 rounded border border-[#b87a28]/50">
              <span>🪙</span> 45.280g
            </span>
            <span className="text-xs text-[#fed88b] flex items-center gap-1">
              <span>⏰</span> 10:40 AM
            </span>
          </div>
        </div>
      )}

      {/* High Density Top Micro Notice Bar / Win95 Menu Strip */}
      <div className={`${isWin95 ? 'bg-[#c0c0c0] text-black border-b border-[#808080]' : isGenshin ? 'bg-[#121524] text-[#d3bc8e] border-b border-[#d3bc8e]/30' : isAndroid ? 'bg-[#1a1b1e] text-[#A4C639] border-b border-[#303338]' : isStardew ? 'bg-[#4a2b12] text-[#fce4a6] border-b border-[#8a5522]' : 'bg-[#1e293b] dark:bg-[#090d16] text-slate-300 border-b border-slate-800'} text-[11px] py-1 px-4 font-mono`}>
        <div className="max-w-7xl mx-auto px-0 sm:px-2 lg:px-4 flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            {isWin95 ? (
              <div className="flex items-center gap-2">
                <span className="bg-[#000080] text-white px-1.5 py-0.2 text-[10px] font-bold border-t border-l border-white border-r border-b border-black">
                  START 95
                </span>
                <div className="hidden sm:flex items-center gap-3 text-black text-xs font-sans">
                  <span onClick={() => onNavigate('hub')} className="cursor-pointer hover:underline"><u>A</u>rquivo</span>
                  <span onClick={() => onNavigate('editor')} className="cursor-pointer hover:underline"><u>E</u>ditar</span>
                  <span onClick={onOpenLanguagesModal} className="cursor-pointer hover:underline"><u>E</u>xibir</span>
                  <span onClick={() => onNavigate('history')} className="cursor-pointer hover:underline"><u>F</u>avoritos</span>
                  <span onClick={() => onNavigate('hub')} className="cursor-pointer hover:underline">A<u>j</u>uda</span>
                </div>
              </div>
            ) : isGenshin ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold genshin-primogem-badge">
                <Sparkles size={10} className="text-amber-300 animate-pulse" />
                GENSHIN IMPACT ✦ TEYVAT ARCHIVES
              </span>
            ) : isAndroid ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#A4C639] text-black">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
                ANDROID 1.5 CUPCAKE
              </span>
            ) : isStardew ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#c6892e] text-[#2c1605] border border-[#f5cb74]">
                <span>★</span> STARDEW VALLEY ✦ PELICAN TOWN
              </span>
            ) : isGoogleTheme ? (
              <span className="flex items-center gap-1.5 px-2 py-0.2 rounded-xs text-[10px] font-bold bg-[#4285F4] text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                GOOGLE THEME v3.0
              </span>
            ) : (
              <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded-xs text-[10px] font-bold">WIKIZERO v3.0</span>
            )}
            {!isWin95 && <span className={isGenshin ? "text-[#a0947d]" : isAndroid ? "text-[#888]" : isStardew ? "text-[#fed88b]" : "text-slate-400"}>{t('header.open_encyclopedia')}</span>}
          </div>
          <div className={`flex items-center gap-4 ${isWin95 ? 'text-black' : isGenshin ? 'text-[#d3bc8e]' : isStardew ? 'text-[#fed88b]' : 'text-slate-400'} text-[11px]`}>
            <button
              onClick={onOpenLanguagesModal}
              className={`${isWin95 ? 'hover:underline text-black' : isGenshin ? 'hover:text-[#72e2db] text-[#d3bc8e]' : 'hover:text-blue-300 text-slate-300'} flex items-center gap-1 transition`}
            >
              <Globe2 size={11} className={isWin95 ? 'text-[#000080]' : isGenshin ? 'text-[#72e2db]' : 'text-blue-400'} />
              <span>{currentLanguage.flag} {currentLanguage.nativeName} ({currentLanguage.code})</span>
            </button>
            <span className={isWin95 ? 'text-[#808080]' : isGenshin ? 'text-[#d3bc8e]/40' : 'hidden sm:inline text-slate-600'}>|</span>
            <span className="hidden sm:inline">GNU GPL v3.0</span>
            <span className={isWin95 ? 'text-[#808080]' : isGenshin ? 'text-[#d3bc8e]/40' : 'hidden md:inline text-slate-600'}>|</span>
            <a
              href={formatExternalUrl("https://github.com/WazzimaGiygg/Wiki-alternative")}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isWin95 ? 'hover:underline text-[#000080]' : isGenshin ? 'hover:text-[#72e2db] text-[#d3bc8e]' : 'hover:text-blue-400 text-slate-300'} flex items-center gap-1`}
            >
              GitHub <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Main High Density Header Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
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

          {isWin95 ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiZero - Tema Windows 95"
            >
              <div className="w-8 h-8 bg-[#c0c0c0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-black flex items-center justify-center shadow-xs">
                <Monitor size={18} className="text-[#000080]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-black tracking-tight font-sans">
                    WikiZero <span className="text-[#000080] font-black">95</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#000080] text-white px-1.5 py-0.2 border border-white">
                    WIN95
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-sans leading-none mt-0.5 hidden xs:block">
                  Microsoft Windows 95 Style
                </p>
              </div>
            </div>
          ) : isGenshin ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiZero - Tema Genshin Impact (Teyvat)"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2a3454] to-[#121524] border border-[#d3bc8e] flex items-center justify-center shadow-sm shadow-amber-500/20 group-hover:border-amber-300 transition">
                <Sparkles size={17} className="text-[#d3bc8e] drop-shadow-[0_0_6px_rgba(211,188,142,0.8)] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-serif font-bold text-base sm:text-lg text-[#f2dfb7] tracking-wider">
                    WikiZero <span className="text-[#72e2db] font-normal text-xs">✦ Teyvat</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-teal-500/20 text-[#e4ca95] border border-[#d3bc8e]/50 px-1.5 py-0.2 rounded-xs">
                    GENSHIN
                  </span>
                </div>
                <p className="text-[10px] text-[#cca567] font-sans leading-none mt-0.5 hidden xs:block">
                  Adventurer's Handbook & Lore
                </p>
              </div>
            </div>
          ) : isAndroid ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiZero - Tema Android 1.5 Cupcake (2009)"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25272a] border-2 border-[#A4C639] flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <svg className="w-4 h-4 fill-current text-[#A4C639]" viewBox="0 0 24 24">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-white tracking-tight font-sans">
                    WikiZero <span className="text-[#A4C639] font-mono text-xs">1.5</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#A4C639]/20 text-[#A4C639] border border-[#A4C639]/50 px-1.5 py-0.2 rounded-xs">
                    Cupcake
                  </span>
                </div>
                <p className="text-[10px] text-[#A4C639]/80 font-sans leading-none mt-0.5 hidden xs:block">
                  Android 1.5 Cupcake OS (2009)
                </p>
              </div>
            </div>
          ) : isStardew ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiZero - Tema Stardew Valley (Vale da Estrela)"
            >
              <div className="w-8 h-8 rounded-lg bg-[#533113] border-2 border-[#d49e3d] flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <span className="text-base select-none leading-none" role="img" aria-label="Junimo">
                  🍏
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg text-[#ffefc4] tracking-tight font-sans drop-shadow-sm">
                    WikiZero <span className="text-[#ffd54f] text-xs">Valley</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#d49e3d]/20 text-[#ffe082] border border-[#d49e3d]/60 px-1.5 py-0.2 rounded-xs">
                    Stardew
                  </span>
                </div>
                <p className="text-[10px] text-[#fdd87f]/90 font-sans leading-none mt-0.5 hidden xs:block">
                  Pelican Town Archives • Vale da Estrela
                </p>
              </div>
            </div>
          ) : isGoogleTheme ? (
            <div
              onClick={() => onNavigate('hub')}
              className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
              title="WikiZero - Tema Google Material"
            >
              <div className="w-8 h-8 rounded-full bg-white dark:bg-[#303134] border border-slate-200 dark:border-[#5f6368] flex items-center justify-center shadow-xs">
                <span className="font-bold text-base font-sans tracking-tight">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335] text-xs font-black">W</span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h1 className="font-bold text-base sm:text-lg tracking-tight font-sans">
                    <span className="text-[#4285F4]">W</span>
                    <span className="text-[#EA4335]">a</span>
                    <span className="text-[#FBBC05]">z</span>
                    <span className="text-[#4285F4]">z</span>
                    <span className="text-[#34A853]">i</span>
                    <span className="text-[#EA4335]">m</span>
                    <span className="text-[#4285F4]">a</span>
                    <span className="text-slate-700 dark:text-slate-200"> </span>
                    <span className="text-[#4285F4]">W</span>
                    <span className="text-[#EA4335]">i</span>
                    <span className="text-[#FBBC05]">k</span>
                    <span className="text-[#34A853]">i</span>
                  </h1>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 px-1.5 py-0.2 rounded-full">
                    Google
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-none mt-0.5 hidden xs:block">
                  Material Design 3 & Pesquisa Google
                </p>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Dense Global Search Bar (Desktop) */}
        {isWin95 ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="flex items-center gap-1.5">
              <div
                onClick={handleSearchInputClick}
                className="flex-1 win95-sunken flex items-center px-2 py-1 bg-white cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#000080] mr-1.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="C:\WIKIZERO\BUSCA_AVANCADA.EXE..."
                  className="w-full text-xs bg-transparent border-none outline-none text-black font-mono placeholder:text-slate-500 cursor-text"
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="win95-button font-bold flex items-center gap-1"
                title="Ir para a Busca Avançada"
              >
                <Search size={11} />
                {t('header.search_btn')}
              </button>
              <button
                onClick={onRandomPage}
                title="Artigo Aleatório"
                className="win95-button"
              >
                {t('header.random_page')}
              </button>
            </div>
          </div>
        ) : isGenshin ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative genshin-search-box flex items-center px-3.5 py-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#d3bc8e] mr-2 shrink-0 animate-pulse" />
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada de Teyvat (artigos, lore, tags)..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#f2dfb7] placeholder:text-[#a0947d] font-sans cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#161a2c] border border-[#d3bc8e]/30" title="Sete Elementos de Teyvat">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#74c2a8]" title="Anemo" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fab632]" title="Geo" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#af8ec9]" title="Electro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a5c83b]" title="Dendro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cc2f1]" title="Hydro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef7938]" title="Pyro" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9fd6e3]" title="Cryo" />
                </div>
                <button
                  onClick={onSearchSubmit}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-full genshin-gold-btn cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório / Oração Astral"
                  className="px-2 py-1 text-[11px] font-medium rounded-full bg-[#242c47] hover:bg-[#2f395d] text-[#e4ca95] border border-[#d3bc8e]/40 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>✦ Desejo</span>
                </button>
              </div>
            </div>
          </div>
        ) : isAndroid ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative android-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer"
            >
              <div className="mr-2 flex items-center text-[#A4C639] shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85.94c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 3.91 5.5 5.79 5.25 8h13.5c-.25-2.21-1.48-4.09-3.22-5.04zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada WikiZero Android..."
                className="w-full text-xs bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-500 font-sans cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="android-btn px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório"
                  className="android-btn px-2 py-1 text-[11px] font-medium cursor-pointer"
                >
                  Aleatório
                </button>
              </div>
            </div>
          </div>
        ) : isStardew ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative stardew-search-widget flex items-center px-3 py-1.5 transition-all cursor-pointer"
            >
              <div className="mr-2 flex items-center text-amber-600 shrink-0 text-sm" title="Stardew Junimo">
                🌱
              </div>
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada no Vale da Estrela..."
                className="w-full text-xs bg-transparent border-none outline-none text-[#3e2613] placeholder:text-[#8a6843] font-sans cursor-text"
              />
              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="stardew-btn px-2.5 py-1 text-[11px] cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Artigo Aleatório (Sorte Diária)"
                  className="stardew-btn px-2 py-1 text-[11px] cursor-pointer"
                >
                  ★ Sorte
                </button>
              </div>
            </div>
          </div>
        ) : isGoogleTheme ? (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative google-search-container flex items-center px-3.5 py-1.5 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#4285F4] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca Avançada de Artigos na Enciclopédia..."
                className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 cursor-text"
              />
              <div className="flex items-center gap-1 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50" title="Cores do Google">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
                </div>
                <button
                  onClick={onSearchSubmit}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-slate-700 dark:text-slate-200 border border-[#dadce0] dark:border-[#5f6368] transition shadow-2xs cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title="Estou com sorte (Artigo Aleatório)"
                  className="px-2 py-1 text-[11px] font-semibold rounded-full bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#dadce0] dark:border-[#5f6368] transition shadow-2xs cursor-pointer"
                >
                  Sorte
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 max-w-lg mx-2 hidden md:block">
            <div
              onClick={handleSearchInputClick}
              className="relative cursor-pointer"
            >
              <input
                type="text"
                value={searchQuery}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Busca avançada de artigos (clique para abrir)..."
                className="w-full pl-8 pr-24 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 cursor-text"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onSearchSubmit}
                  className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                  title="Abrir Busca Avançada"
                >
                  {t('header.search_btn')}
                </button>
                <button
                  onClick={onRandomPage}
                  title={t('header.random_page')}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <Shuffle size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

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
              onClick={() => onNavigate('search')}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition font-semibold ${
                currentView === 'search'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Busca Avançada de Artigos"
            >
              <Search size={13} />
              <span>Busca Avançada</span>
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

          {/* Android App PWA Install Button */}
          <PWAInstallPrompt buttonStyle="header" />

          {/* Smart TV App Quick Button */}
          <button
            onClick={onOpenSmartTVModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 transition cursor-pointer"
            title="Disponibilidade e aplicativo para Smart TV (Samsung, LG, Android TV, Fire TV)"
          >
            <Tv size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>App Smart TV</span>
          </button>

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
