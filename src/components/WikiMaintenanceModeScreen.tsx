import React, { useState } from 'react';
import {
  Wrench,
  ShieldAlert,
  Lock,
  LogOut,
  Settings,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { isUserBureaucrat } from '../core/ExtensionManager';
import { getMaintenanceSettings } from '../utils/subWikiHelpers';

interface WikiMaintenanceModeScreenProps {
  currentUser: UserProfile | null;
  onGoogleLogin: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

/**
 * Tela de Manutenção Geral do WikiWorldWeb (Update 3.05 - Requisito 3.05.3.e)
 * "Adicionar extensão que define quando o WikiWorldWeb está em manutenção,
 * onde apenas o burocrata pode acessar às configurações do Wiki, usando seu login por Google"
 */
export const WikiMaintenanceModeScreen: React.FC<WikiMaintenanceModeScreenProps> = ({
  currentUser,
  onGoogleLogin,
  onLogout,
  onOpenSettings,
}) => {
  const maintenance = getMaintenanceSettings();
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const isBureaucrat = isUserBureaucrat(currentUser);

  const handleLoginClick = async () => {
    setIsLoggingIn(true);
    try {
      await onGoogleLogin();
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
      <div className="max-w-xl w-full bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow Decorativo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Ícone de Manutenção */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Wrench className="w-10 h-10 animate-[wiggle_2s_ease-in-out_infinite]" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        </div>

        {/* Badge de Versão e Status */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Update v3.05 • Modo de Manutenção</span>
        </div>

        {/* Título e Mensagem */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          {maintenance.maintenanceNoticeTitle}
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
          {maintenance.maintenanceNoticeMessage}
        </p>

        {/* Caixa de Regra de Acesso: Apenas Burocratas via Google */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Acesso Restrito a Burocratas (Regra 3.05.3.e)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Durante o período de manutenção técnica, a navegação pública e edições comuns ficam temporariamente suspensas. Apenas burocratas autorizados podem acessar as configurações da Wiki autenticando-se com sua <strong>Conta Google</strong>.
          </p>

          {/* Feedback caso o usuário esteja logado mas NÃO seja Burocrata */}
          {currentUser && !isBureaucrat && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-red-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Permissão Insuficiente</span>
              </div>
              <p>
                Você está autenticado como <strong>{currentUser.email || currentUser.displayName}</strong>, mas esta conta não possui nível de <strong>Burocrata</strong>.
              </p>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-2 text-xs text-red-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" /> Entrar com outra conta Google
                </button>
              )}
            </div>
          )}
        </div>

        {/* Botão de Login com Google para Burocrata */}
        {!currentUser ? (
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleLoginClick}
              disabled={isLoggingIn}
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isLoggingIn ? 'Autenticando...' : 'Entrar com Google (Acesso Burocrata)'}</span>
            </button>
            <p className="text-[11px] text-slate-500 font-mono">
              Autenticação segura via Firebase Auth & Google Identity Provider
            </p>
          </div>
        ) : isBureaucrat && onOpenSettings ? (
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Acessar Configurações e Gerenciamento de Extensões</span>
            </button>
          </div>
        ) : null}

        {/* Rodapé Informativo */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>WikiWorldWeb Enciclopédia</span>
          <span>v3.05 • Protocolo 305.3.e</span>
        </div>
      </div>
    </div>
  );
};
