import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, X, ArrowUpRight } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { NetworkDiagnosticModal } from './NetworkDiagnosticModal';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, latencyMs, isChecking, checkNow, status } = useNetworkStatus();
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const prevOnlineRef = useRef<boolean>(isOnline);

  useEffect(() => {
    // Detect reconnection transition from offline to online
    if (!prevOnlineRef.current && isOnline) {
      setShowReconnectedToast(true);
      const timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  return (
    <>
      {/* Banner quando o computador está offline */}
      {!isOnline && (
        <div
          id="offline-status-banner"
          className="fixed bottom-4 left-4 z-50 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 rounded-xl bg-rose-600 text-white px-4 py-3 text-xs font-semibold shadow-2xl border border-rose-500 animate-in slide-in-from-bottom-2 duration-300 max-w-[calc(100vw-2rem)] sm:max-w-md"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <WifiOff className="w-4 h-4 shrink-0 text-white" />
            <span className="leading-snug">
              Computador Offline: Conexão interrompida em tempo real. Edições e cache local permanecem preservados.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              disabled={isChecking}
              onClick={() => checkNow()}
              className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-800 text-[11px] font-bold text-white flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              title="Testar rota de rede agora"
            >
              <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} />
              <span>{isChecking ? 'Checando...' : 'Testar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDiagnosticModal(true)}
              className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-[11px] font-bold text-white flex items-center gap-1 transition cursor-pointer"
              title="Ver detalhes técnicos"
            >
              <span>Detalhes</span>
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Toast de reconexão bem-sucedida */}
      {isOnline && showReconnectedToast && (
        <div
          id="reconnected-status-toast"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl border border-emerald-500 animate-in slide-in-from-bottom-2 fade-in duration-300"
          role="status"
        >
          <Wifi className="w-4 h-4 shrink-0" />
          <span>
            Computador Online: Conexão restabelecida em tempo real{' '}
            {latencyMs !== null ? `(${latencyMs}ms RTT)` : ''}!
          </span>
          <button
            type="button"
            onClick={() => setShowReconnectedToast(false)}
            className="p-1 rounded hover:bg-emerald-700 transition cursor-pointer ml-1"
            title="Fechar"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Modal de Diagnóstico acessível a partir do banner */}
      <NetworkDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
      />
    </>
  );
};
