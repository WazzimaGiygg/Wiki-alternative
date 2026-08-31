import React from 'react';
import {
  X,
  Home,
  BookOpen,
  History,
  Layers,
  Star,
  Globe2,
  Moon,
  Sun,
  Shield,
  ShieldCheck,
  FileText,
  Heart,
  ExternalLink,
  LifeBuoy,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  Smartphone,
  Monitor,
  PlusCircle,
  Database,
  Info,
  Sparkles,
  UserX,
  Scale,
  Vote,
  MessageSquare,
  Users,
} from 'lucide-react';
import { UserProfile, ViewMode, DeviceMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatExternalUrl } from '../utils/linkUtils';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  user: UserProfile | null;
  currentView: ViewMode;
  deviceMode: DeviceMode;
  isDark: boolean;
  totalPages: number;
  totalArticles: number;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
  onToggleTheme: () => void;
  onToggleDeviceMode: (mode: DeviceMode) => void;
  onOpenLanguagesModal: () => void;
  onCreatePageClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  user,
  currentView,
  deviceMode,
  isDark,
  totalPages,
  totalArticles,
  onClose,
  onNavigate,
  onToggleTheme,
  onToggleDeviceMode,
  onOpenLanguagesModal,
  onCreatePageClick,
  onLoginClick,
  onLogoutClick,
}) => {
  const { currentLanguage, t } = useLanguage();

  if (!isOpen) return null;

  const handleItemClick = (view: ViewMode) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div
      id="mobile-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-start animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="mobile-drawer-content"
        className="w-4/5 max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with User Profile / Login */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex flex-col gap-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-white text-blue-800 flex items-center justify-center font-serif-heading font-bold text-base shadow-xs">
                W
              </div>
              <span className="font-serif-heading font-bold text-base tracking-tight">WazzimaGiygg</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card */}
          {user ? (
            <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-xl border border-white/10 mt-1">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center border border-white/40">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-white truncate">{user.displayName}</p>
                  <p className="text-[10px] text-blue-200 capitalize">{user.role || 'Membro'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogoutClick();
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-200 hover:text-white transition"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onLoginClick();
                onClose();
              }}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-blue-700 rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-2"
            >
              <UserIcon size={14} />
              <span>Entrar / Cadastrar-se</span>
            </button>
          )}
        </div>

        {/* Quick Mode Switches (Mobile vs Desktop & Theme & Language) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          {/* Device View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg">
            <button
              onClick={() => onToggleDeviceMode('mobile')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                deviceMode === 'mobile' || deviceMode === 'auto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Exibir layout otimizado para dispositivos móveis"
            >
              <Smartphone size={12} />
              <span>Móvel</span>
            </button>
            <button
              onClick={() => onToggleDeviceMode('desktop')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                deviceMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Exibir versão completa de computador"
            >
              <Monitor size={12} />
              <span>Desktop</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Modal Trigger */}
            <button
              onClick={() => {
                onOpenLanguagesModal();
                onClose();
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs"
              title="Alterar Idioma"
            >
              <span>{currentLanguage.flag}</span>
              <span className="text-[10px] font-mono uppercase font-bold">{currentLanguage.code}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title={isDark ? 'Tema Claro' : 'Tema Escuro'}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Main Wiki Navigation */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
              Navegação Principal
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => handleItemClick('hub')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'hub'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Home size={16} className="text-blue-600" />
                <span>Página Principal (Hub)</span>
              </button>

              <button
                onClick={() => handleItemClick('site-updates')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'site-updates'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Atualizações & Melhorias</span>
                </div>
                <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded-xs font-mono font-bold">
                  v3.3
                </span>
              </button>

              <button
                onClick={() => handleItemClick('recent-changes')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'recent-changes'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <History size={16} className="text-cyan-600" />
                <span>{t('sidebar.recent_changes')}</span>
              </button>

              <button
                onClick={() => handleItemClick('special-pages')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'special-pages'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Layers size={16} className="text-purple-600" />
                <span>{t('sidebar.special_pages')}</span>
              </button>

              <button
                onClick={() => handleItemClick('admin-users')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'admin-users'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Lista de Usuários Cadastrados</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  LISTA
                </span>
              </button>

              <button
                onClick={() => handleItemClick('promotion-requests')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'promotion-requests'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Vote size={16} className="text-purple-600 dark:text-purple-400" />
                  <span>Pedidos de Promoção (RFA)</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  VOTO
                </span>
              </button>

              <button
                onClick={() => handleItemClick('contact-admin')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                  currentView === 'contact-admin'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Falar com a Administração</span>
                </div>
                <span className="text-[9px] font-bold font-mono px-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  SUPORTE
                </span>
              </button>

              <button
                onClick={() => handleItemClick('watchlist')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition ${
                  currentView === 'watchlist'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Star size={16} className="text-amber-500" />
                <span>{t('sidebar.watchlist')}</span>
              </button>

              <button
                onClick={() => {
                  onCreatePageClick();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <PlusCircle size={16} className="text-emerald-600" />
                <span>Novo Portal / Tópico</span>
              </button>
            </div>
          </div>

          {/* WazzimaGiygg Support & External Highlights */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
              Suporte & Destaques
            </span>
            <div className="space-y-1">
              <a
                href={formatExternalUrl("https://support.wazzimagiygg.com/")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 transition"
              >
                <div className="flex items-center gap-2">
                  <LifeBuoy size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Suporte & Tickets WazzimaGiygg</span>
                </div>
                <ExternalLink size={12} />
              </a>

              <a
                href={formatExternalUrl("https://wazzimagiygg.com/averdade/")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-100 transition"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                  <span>Dossiê A Verdade</span>
                </div>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* User Account / Admin Area (if logged) */}
          {user && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
                Painel do Usuário
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => handleItemClick('user-page')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <UserIcon size={16} className="text-blue-600" />
                  <span>Minha Página de Usuário</span>
                </button>

                <button
                  onClick={() => handleItemClick('admin-users')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <Layers size={16} className="text-purple-600" />
                  <span>Diretório de Usuários</span>
                </button>

                {(user.role === 'admin' || user.role === 'moderador' || user.email === 'pedrohenriquecardonaperes@gmail.com') && (
                  <>
                    <button
                      onClick={() => handleItemClick('checkuser')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserX size={16} className="text-rose-600 dark:text-rose-400" />
                        <span>CheckUser (Fantoches)</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        MOD
                      </span>
                    </button>

                    <button
                      onClick={() => handleItemClick('unblock-requests')}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Scale size={16} className="text-purple-600 dark:text-purple-400" />
                        <span>Recursos de Desbloqueio</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        ADM
                      </span>
                    </button>
                  </>
                )}

                {user.role === 'admin' && (
                  <button
                    onClick={() => handleItemClick('admin-firebase')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                  >
                    <Database size={16} className="text-amber-500" />
                    <span>Admin Firebase Firestore</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Legal & Compliance */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-2">
              Legal & Conformidade
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => handleItemClick('privacy')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>LGPD & Marco Civil</span>
              </button>

              <button
                onClick={() => handleItemClick('terms')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <FileText size={15} />
                <span>Termos de Uso</span>
              </button>

              <button
                onClick={() => handleItemClick('donation')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <Heart size={15} className="text-rose-500" />
                <span>Apoiar a WikiZero</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer with Wiki Stats */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300">WikiZero v3.0</span>
            <p className="text-[10px] text-slate-400">{totalArticles} artigos • {totalPages} portais</p>
          </div>
          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
            Minerva Mobile
          </span>
        </div>
      </div>
    </div>
  );
};
