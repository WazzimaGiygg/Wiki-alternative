import React from 'react';
import {
  Wifi,
  WifiOff,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Radio,
  Server,
  Cpu,
  Trash2,
  X,
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { ConnectionQuality } from '../services/networkStatusService';

interface NetworkDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkDiagnosticModal: React.FC<NetworkDiagnosticModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { status, isOnline, latencyMs, quality, isChecking, checkNow, clearHistory } =
    useNetworkStatus();

  if (!isOpen) return null;

  const getQualityDetails = (q: ConnectionQuality) => {
    switch (q) {
      case 'excellent':
        return {
          label: 'Excelente',
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
          barColor: 'bg-emerald-500',
          barWidth: '100%',
          desc: 'Latência baixa (< 120ms). Resposta instantânea da Wiki e operações em tempo real.',
        };
      case 'good':
        return {
          label: 'Boa',
          color: 'text-teal-600 dark:text-teal-400',
          bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
          barColor: 'bg-teal-500',
          barWidth: '75%',
          desc: 'Latência adequada (120-280ms). Comunicação fluida com o servidor e banco de dados.',
        };
      case 'fair':
        return {
          label: 'Regular / Instável',
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
          barColor: 'bg-amber-500',
          barWidth: '45%',
          desc: 'Latência moderada (280-500ms). Pode haver pequenos atrasos em requisições de IA e salvamento.',
        };
      case 'poor':
        return {
          label: 'Ruim / Degradação de Sinal',
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
          barColor: 'bg-orange-500',
          barWidth: '20%',
          desc: 'Latência alta (> 500ms). Operações em segundo plano continuam com retentativas automáticas.',
        };
      case 'offline':
        return {
          label: 'Computador Offline',
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
          barColor: 'bg-rose-500',
          barWidth: '0%',
          desc: 'Sem conexão ativa com o servidor ou internet. O cache local do applet continua acessível.',
        };
      default:
        return {
          label: 'Verificando...',
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
          barColor: 'bg-blue-500',
          barWidth: '50%',
          desc: 'Emitindo probe ativo para medição de latência RTT em tempo real.',
        };
    }
  };

  const qDetails = getQualityDetails(quality);

  const formatTime = (ts: number | null) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="network-diag-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              }`}
            >
              {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="network-diag-title" className="text-sm font-bold">
                  Diagnóstico de Conectividade em Tempo Real
                </h2>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
                  4.1.1.D6.6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verificação de conectividade física, rota de dados e telemetria de latência
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar diagnóstico"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Main Status Hero Card */}
          <div className={`p-4 rounded-xl border ${qDetails.bg} transition`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  ></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isOnline ? 'Computador Conectado' : 'Computador Desconectado'}
                </span>
              </div>

              <span className={`text-xs font-bold ${qDetails.color}`}>
                {qDetails.label}
              </span>
            </div>

            {/* Latency Display */}
            <div className="flex items-baseline justify-between mt-1">
              <div>
                <span className="text-3xl font-extrabold font-mono tracking-tight">
                  {latencyMs !== null ? latencyMs : '—'}
                </span>
                <span className="text-xs font-semibold ml-1 text-slate-500 dark:text-slate-400">
                  ms RTT
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Último teste: {formatTime(status.lastChecked)}
              </span>
            </div>

            {/* Quality Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${qDetails.barColor}`}
                style={{ width: qDetails.barWidth }}
              ></div>
            </div>

            <p className="text-[11px] mt-2 text-slate-600 dark:text-slate-300">
              {qDetails.desc}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-medium">
                <Cpu size={12} />
                <span>Navegador / SO</span>
              </div>
              <div className="flex items-center gap-1.5">
                {status.isNavigatorOnline ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <XCircle size={14} className="text-rose-500" />
                )}
                <span className="text-xs font-bold">
                  {status.isNavigatorOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">navigator.onLine</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-medium">
                <Server size={12} />
                <span>Rota /api/ping</span>
              </div>
              <div className="flex items-center gap-1.5">
                {status.isReachable ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <XCircle size={14} className="text-rose-500" />
                )}
                <span className="text-xs font-bold">
                  {status.isReachable ? '200 OK' : 'Inacessível'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Probe ativo RTT</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-medium">
                <Radio size={12} />
                <span>Reconexões</span>
              </div>
              <div className="text-xs font-bold font-mono">
                {status.reconnectCount} {status.reconnectCount === 1 ? 'vez' : 'vezes'}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Nesta sessão</p>
            </div>

            {status.networkInfo?.effectiveType && (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-medium">
                  <Activity size={12} />
                  <span>Tipo de Rede</span>
                </div>
                <div className="text-xs font-bold uppercase font-mono">
                  {status.networkInfo.effectiveType}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Adaptador</p>
              </div>
            )}

            {status.networkInfo?.downlink !== undefined && (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-medium">
                  <Activity size={12} />
                  <span>Downlink</span>
                </div>
                <div className="text-xs font-bold font-mono">
                  {status.networkInfo.downlink} Mbps
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Banda estimada</p>
              </div>
            )}

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-medium">
                <Clock size={12} />
                <span>Última Mudança</span>
              </div>
              <div className="text-xs font-semibold">
                {formatTime(status.lastChanged)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Transição de estado</p>
            </div>
          </div>

          {/* Recent Pings Telemetry History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                <Activity size={13} className="text-blue-500" />
                Histórico Recente de Pings ({status.history.length})
              </span>
              {status.history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition"
                  title="Limpar telemetria local"
                >
                  <Trash2 size={11} />
                  Limpar
                </button>
              )}
            </div>

            {status.history.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                Nenhum registro de ping recente. Clique em &quot;Testar Agora&quot; abaixo.
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {status.history.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          record.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-slate-600 dark:text-slate-300">
                        {record.endpoint}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold ${
                          record.latencyMs < 150
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : record.latencyMs < 350
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {record.status === 'online' ? `${record.latencyMs}ms` : 'Falha'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(record.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Radio size={12} className="text-emerald-500 animate-pulse" />
            <span>Heartbeat contínuo ativo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isChecking}
              onClick={() => checkNow()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
              <span>{isChecking ? 'Verificando...' : 'Testar Agora'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
