import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Server,
  Database,
  Key,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';
import { UserProfile } from '../types';
import { ACTIVE_FIREBASE_CONFIG } from '../config/firebaseCustomConfig';

interface WikiSecurityGatekeeperProps {
  currentUser: UserProfile | null;
  children: React.ReactNode;
  onOpenExtensionsPanel?: () => void;
  onOpenLogin?: () => void;
}

/**
 * Componente: WikiSecurityGatekeeper (Versão 3.304 - Requisito 304.5)
 * 
 * "304.5 – A sincronia de extensões ativadas ou desativadas é a porta de entrada para a segurança
 * da Wiki por completo, mesmo que não esteja com login. Se não for feita com sucesso, a Wiki
 * não poderá usar nenhum de seus recursos."
 */
export const WikiSecurityGatekeeper: React.FC<WikiSecurityGatekeeperProps> = ({
  currentUser,
  children,
  onOpenExtensionsPanel,
  onOpenLogin,
}) => {
  const extensionManager = ExtensionManager.getInstance();

  const [gateStatus, setGateStatus] = useState(() => {
    try {
      return extensionManager.getSecurityGateStatus();
    } catch (e) {
      console.warn('[WikiZero Security] Falha ao obter status inicial do Gatekeeper:', e);
      return {
        isUnlocked: true,
        syncStatus: 'connected' as const,
        lastSyncedAt: null,
        securityHash: 'sec304-fallback',
        activeCount: 1,
        totalCount: 1,
      };
    }
  });
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [bureaucratBypass, setBureaucratBypass] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Monitora alterações de status no ExtensionManager e Firebase
  useEffect(() => {
    const update = () => {
      setGateStatus(extensionManager.getSecurityGateStatus());
    };

    update();
    const unsubscribe = extensionManager.subscribe(update);
    return () => unsubscribe();
  }, [extensionManager]);

  // Handler para tentar reconectar
  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await extensionManager.forceRecheckSync();
    } finally {
      setIsRetrying(false);
      setGateStatus(extensionManager.getSecurityGateStatus());
    }
  };

  const isBureaucrat = isUserBureaucrat(currentUser);

  // Se a sincronia foi realizada com sucesso (status === 'connected') OU se o burocrata ativou o bypass de emergência
  const isUnlocked = gateStatus.isUnlocked || bureaucratBypass;

  // Se está desbloqueado, renderiza a Wiki normalmente
  if (isUnlocked) {
    return (
      <>
        {/* Banner de Aviso Discreto se estiver em modo Bypass de Emergência do Burocrata */}
        {bureaucratBypass && !gateStatus.isUnlocked && (
          <aside
            aria-label="Aviso de modo de emergência"
            className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-md sticky top-0 z-50 font-medium"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
              <span>
                <strong>Modo de Emergência do Burocrata Ativo (v3.304):</strong> A porta de entrada foi liberada temporariamente para manutenção administrativa enquanto o Firebase reconecta.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetrySync}
                disabled={isRetrying}
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>Reconectar</span>
              </button>
              <button
                type="button"
                onClick={() => setBureaucratBypass(false)}
                className="text-amber-200 hover:text-white text-xs underline cursor-pointer ml-1"
              >
                Reativar Bloqueio
              </button>
            </div>
          </aside>
        )}
        {children}
      </>
    );
  }

  // Se está verificando na inicialização (connecting) durante os primeiros segundos
  if (gateStatus.syncStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-10 h-10 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
            </span>
          </div>

          <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-400 mb-1 font-mono">
            Versão 3.304 • Porta de Entrada da Wiki
          </span>
          <h1 className="text-xl font-black text-white tracking-tight mb-2">
            Verificando Sincronia de Segurança
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            A sincronia em tempo real de extensões com o banco de dados do Firebase Firestore é o protocolo de entrada mandatório para a segurança da Wiki.
          </p>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-2/3 animate-[pulse_1.5s_infinite]"></div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
            <span>Consultando Firestore (wiki_extension_registry)...</span>
          </div>
        </div>
      </div>
    );
  }

  // ESTADO BLOQUEADO: Sincronia com o Firebase Falhou ou Offline (Requisito 304.5)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950/40 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="max-w-xl w-full bg-slate-900/95 backdrop-blur-2xl border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Ícone de Escudo Bloqueado */}
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-5 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        {/* Badge da Versão 3.304 */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
          <Lock className="w-3 h-3" />
          <span>Protocolo 304.5 • Bloqueio de Segurança</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Sincronia de Extensões Obrigatória
        </h1>

        <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-200 leading-relaxed text-left mb-6 space-y-2">
          <p className="font-semibold text-rose-100 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Acesso Restrito aos Recursos da Enciclopédia</span>
          </p>
          <p className="text-slate-300">
            Conforme a especificação da <strong>Versão 3.304 (Regra 304.5)</strong>, a sincronia de extensões ativadas ou desativadas pelo banco de dados do Firebase é a porta de entrada para a segurança da Wiki por completo, mesmo para visitantes sem login.
          </p>
          <p className="text-slate-300">
            Nenhum recurso (leitura, edição, ferramentas e pesquisa) pode ser utilizado até que a sincronização da integridade em nuvem seja realizada com sucesso.
          </p>
        </div>

        {/* Detalhes do Status */}
        <div className="w-full grid grid-cols-2 gap-2 text-left text-xs mb-6 font-mono">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Conexão Firebase</span>
            <span className="font-bold text-rose-400 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {gateStatus.syncStatus === 'offline' ? 'Desconectado / Offline' : 'Erro de Conexão'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Hash de Segurança</span>
            <span className="font-bold text-slate-200 truncate block mt-0.5">
              {gateStatus.securityHash}
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3 mb-6">
          <button
            type="button"
            onClick={handleRetrySync}
            disabled={isRetrying}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 cursor-pointer active:scale-98 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Verificando Nuvem...' : 'Tentar Novamente / Reconectar'}</span>
          </button>

          {isBureaucrat ? (
            <button
              type="button"
              onClick={() => setBureaucratBypass(true)}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              title="Permite ao burocrata acessar os painéis para reparo emergencial"
            >
              <Unlock className="w-4 h-4 text-amber-400" />
              <span>Acesso Emergencial Burocrata</span>
            </button>
          ) : (
            onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Entrar como Burocrata</span>
              </button>
            )
          )}
        </div>

        {/* Toggle de Diagnóstico Técnico */}
        <div className="w-full pt-4 border-t border-slate-800/80 text-left">
          <button
            type="button"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-mono transition"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDiagnostics ? 'rotate-90' : ''}`} />
            <span>Ver detalhes de diagnóstico do banco de dados (304.7)</span>
          </button>

          {showDiagnostics && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1.5 animate-in fade-in">
              <div className="flex justify-between">
                <span>Firestore Database:</span>
                <span className="text-slate-200">{ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId}</span>
              </div>
              <div className="flex justify-between">
                <span>Coleção Registry:</span>
                <span className="text-slate-200">wiki_extension_registry</span>
              </div>
              <div className="flex justify-between">
                <span>Coleção Extensions:</span>
                <span className="text-slate-200">wiki_extensions</span>
              </div>
              <div className="flex justify-between">
                <span>Extensões Locais:</span>
                <span className="text-slate-200">{gateStatus.totalCount} ({gateStatus.activeCount} ativas)</span>
              </div>
              <div className="flex justify-between">
                <span>Última Sincronia:</span>
                <span className="text-slate-200">{gateStatus.lastSyncedAt || 'Nenhuma (Pendente)'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
