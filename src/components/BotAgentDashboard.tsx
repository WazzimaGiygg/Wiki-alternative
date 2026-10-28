import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Play,
  Pause,
  Power,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  UserCheck,
  UserX,
  Lock,
  Link2,
  Tags,
  Sparkles,
  BookCheck,
  ListFilter,
  Layers,
  Clock,
  Trash2,
  Loader2,
  ArrowRight,
  ExternalLink,
  Sliders,
  Settings,
  Eye,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  WikiBotId,
  WikiBotUser,
  BotFinding,
  BotScanCondition,
  BotScanSummary,
  BotAgentConfig,
  UserAbuseRecord,
  BotSeverity,
} from '../types/bots';
import { BotAgentService, DEFAULT_BOT_USERS } from '../services/botAgentService';
import { WikiArticle, WikiPage, UserProfile } from '../types';

interface BotAgentDashboardProps {
  articles: WikiArticle[];
  pages: WikiPage[];
  currentUser?: UserProfile | null;
  onOpenArticle?: (id: string) => void;
  onOpenEditor?: (title?: string) => void;
}

export const BotAgentDashboard: React.FC<BotAgentDashboardProps> = ({
  articles,
  pages,
  currentUser,
  onOpenArticle,
  onOpenEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'bot-users' | 'lgpd' | 'abuse' | 'logs'>('overview');

  const [config, setConfig] = useState<BotAgentConfig>(() => BotAgentService.getConfig());
  const [botUsers, setBotUsers] = useState<WikiBotUser[]>(() => BotAgentService.getBotUsers());
  const [findings, setFindings] = useState<BotFinding[]>(() => BotAgentService.getFindings());
  const [abuseRecords, setAbuseRecords] = useState<UserAbuseRecord[]>(() => BotAgentService.getUserAbuseRecords());

  // Scanner state
  const [scanQuery, setScanQuery] = useState('');
  const [scanCategory, setScanCategory] = useState('all');
  const [scanPageUid, setScanPageUid] = useState('all');
  const [scanMinSeverity, setScanMinSeverity] = useState<BotSeverity>('info');
  const [selectedBots, setSelectedBots] = useState<WikiBotId[]>([
    'citation-verifier',
    'anti-vandalism',
    'categorization',
    'quality-audit',
    'broken-links',
    'lgpd-moderator',
    'user-abuse-sentinel',
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanSummary, setLastScanSummary] = useState<BotScanSummary | null>(null);

  // Filter logs
  const [logFilterBot, setLogFilterBot] = useState<string>('all');
  const [logFilterSeverity, setLogFilterSeverity] = useState<string>('all');

  // Success message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleGlobal = () => {
    const updated = BotAgentService.saveConfig({ globalEnabled: !config.globalEnabled });
    setConfig(updated);
    showToast(updated.globalEnabled ? 'Agente de Bots ativado globalmente.' : 'Agente de Bots desativado.');
  };

  const handleToggleBot = (botId: WikiBotId) => {
    const isEnabled = config.bots[botId]?.enabled;
    const updated = BotAgentService.toggleBot(botId, !isEnabled);
    setConfig(updated);
    setBotUsers(BotAgentService.getBotUsers());
    showToast(`Bot ${botId} ${!isEnabled ? 'ativado' : 'desativado'}.`);
  };

  const handleToggleBotAutoFix = (botId: WikiBotId) => {
    const currentAutoFix = config.bots[botId]?.autoFix;
    const newBots = { ...config.bots };
    if (newBots[botId]) {
      newBots[botId].autoFix = !currentAutoFix;
      const updated = BotAgentService.saveConfig({ bots: newBots });
      setConfig(updated);
      showToast(`Auto-reparo para ${botId}: ${!currentAutoFix ? 'Ativado' : 'Desativado'}.`);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const condition: BotScanCondition = {
        query: scanQuery,
        categoryFilter: scanCategory,
        pageUidFilter: scanPageUid,
        minSeverity: scanMinSeverity,
        selectedBots,
      };

      const summary = await BotAgentService.runScan(articles, condition);
      setLastScanSummary(summary);
      setFindings(BotAgentService.getFindings());
      showToast(`Varredura concluída: ${summary.articlesScanned} artigos analisados, ${summary.findingsCount} ocorrências.`);
    } catch (err) {
      console.error('Erro na varredura:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearLogs = () => {
    BotAgentService.clearFindings();
    setFindings([]);
    showToast('Histórico de achados limpo com sucesso.');
  };

  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach((a) => {
      if (a.categoria) cats.add(a.categoria);
    });
    return Array.from(cats);
  }, [articles]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (logFilterBot !== 'all' && f.botId !== logFilterBot) return false;
      if (logFilterSeverity !== 'all' && f.severity !== logFilterSeverity) return false;
      return true;
    });
  }, [findings, logFilterBot, logFilterSeverity]);

  const lgpdViolations = useMemo(() => {
    return findings.filter((f) => f.botId === 'lgpd-moderator');
  }, [findings]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-xl text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Principal do Agente de Bots */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shadow-inner">
            <Bot size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                Agente de Bots & Automação Editorial (WikiZero)
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                config.globalEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {config.globalEnabled ? 'Globalmente Ativo' : 'Desativado'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Robôs especializados para conformidade com a LGPD, proteção anti-vandalismo, checagem de fontes via Gemini, auto-categorização e sentinela de abuso de usuários.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleGlobal}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
              config.globalEnabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <Power size={14} />
            <span>{config.globalEnabled ? 'Pausar Todos os Bots' : 'Ativar Todos os Bots'}</span>
          </button>
        </div>
      </div>

      {/* Menu de Abas */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bot size={14} />
          <span>Visão Geral dos 7 Bots</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'scanner'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Search size={14} />
          <span>Motor de Varreduras (4.1.1.1JE.1)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bot-users')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'bot-users'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders size={14} />
          <span>Gerenciador de Bots Users (4.1.1.PN.1)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lgpd')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'lgpd'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock size={14} />
          <span>Proteção LGPD & Dados Sensíveis (4.1.1.E0.1)</span>
          {lgpdViolations.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-mono">
              {lgpdViolations.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('abuse')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'abuse'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck size={14} />
          <span>Sentinela de Usuários (4.1.1.18C.1)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock size={14} />
          <span>Auditoria & Logs ({findings.length})</span>
        </button>
      </div>

      {/* =====================================================================
          ABA 1: VISÃO GERAL DOS 7 BOTS (4.1.1.8T.1 & 4.1.1.PN.1)
          ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {botUsers.map((bot) => {
              const isEnabled = config.bots[bot.botId]?.enabled;
              const autoFix = config.bots[bot.botId]?.autoFix;

              return (
                <div
                  key={bot.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isEnabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${
                        isEnabled
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {bot.botId === 'citation-verifier' && <BookCheck size={18} />}
                        {bot.botId === 'anti-vandalism' && <ShieldAlert size={18} />}
                        {bot.botId === 'categorization' && <Tags size={18} />}
                        {bot.botId === 'quality-audit' && <Sparkles size={18} />}
                        {bot.botId === 'broken-links' && <Link2 size={18} />}
                        {bot.botId === 'lgpd-moderator' && <Lock size={18} />}
                        {bot.botId === 'user-abuse-sentinel' && <UserCheck size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                            {bot.username}
                          </h3>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                            [BOT]
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {bot.displayName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBot(bot.botId)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                      }`}
                      title={isEnabled ? 'Desativar este bot' : 'Ativar este bot'}
                    >
                      <Power size={13} />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {bot.description}
                  </p>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={autoFix}
                          onChange={() => handleToggleBotAutoFix(bot.botId)}
                          disabled={!isEnabled}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Auto-Ação</span>
                      </label>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400">
                      {bot.totalActionsCount} ações
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 2: MOTOR DE VARREDURA COM CONDIÇÕES DE BUSCA (4.1.1.1JE.1)
          ===================================================================== */}
      {activeTab === 'scanner' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search size={16} className="text-blue-500" />
                  <span>Configuração da Varredura de Artigos</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Defina os critérios e execute uma inspeção profunda em lote na enciclopédia.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunScan}
                disabled={isScanning}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Executando Varredura...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Iniciar Varredura Agora</span>
                  </>
                )}
              </button>
            </div>

            {/* Condições de busca */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Termo ou Palavra-Chave:
                </label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={scanQuery}
                    onChange={(e) => setScanQuery(e.target.value)}
                    placeholder="Filtrar por título ou texto..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Filtrar por Categoria:
                </label>
                <select
                  value={scanCategory}
                  onChange={(e) => setScanCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">Todas as Categorias</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Filtrar por Coleção:
                </label>
                <select
                  value={scanPageUid}
                  onChange={(e) => setScanPageUid(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="all">Todas as Coleções</option>
                  {pages.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seleção de Bots para a Varredura */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Robôs Ativos na Varredura:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {botUsers.map((b) => (
                  <label
                    key={b.botId}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBots.includes(b.botId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBots((prev) => [...prev, b.botId]);
                        } else {
                          setSelectedBots((prev) => prev.filter((id) => id !== b.botId));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{b.username}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Resultados da Varredura */}
          {lastScanSummary && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Resultado da Última Varredura</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(lastScanSummary.finishedAt).toLocaleTimeString('pt-BR')}
                </span>
              </div>

              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Artigos Varridos</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {lastScanSummary.articlesScanned}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 block uppercase font-bold">Ocorrências</span>
                  <span className="text-lg font-mono font-bold text-blue-900 dark:text-blue-100">
                    {lastScanSummary.findingsCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 block uppercase font-bold">Críticas / LGPD</span>
                  <span className="text-lg font-mono font-bold text-rose-900 dark:text-rose-100">
                    {lastScanSummary.criticalIssuesCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block uppercase font-bold">Auto-Ações</span>
                  <span className="text-lg font-mono font-bold text-emerald-900 dark:text-emerald-100">
                    {lastScanSummary.actionsTakenCount}
                  </span>
                </div>
              </div>

              {/* Lista detalhada dos achados da varredura */}
              <div className="space-y-2 pt-2">
                {lastScanSummary.findings.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Nenhuma violação ou irregularidade encontrada nos critérios selecionados. Artigos 100% em conformidade!
                  </div>
                ) : (
                  lastScanSummary.findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            f.severity === 'critical'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                              : f.severity === 'warning'
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                          }`}>
                            {f.severity}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {f.articleTitle}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            ({f.botId})
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                          {f.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onOpenArticle && (
                          <button
                            type="button"
                            onClick={() => onOpenArticle(f.articleId)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          >
                            Ver Artigo
                          </button>
                        )}
                        {onOpenEditor && (
                          <button
                            type="button"
                            onClick={() => onOpenEditor(f.articleTitle)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition"
                          >
                            Corrigir
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ABA 3: GERENCIADOR DE BOTS USERS (4.1.1.PN.1)
          ===================================================================== */}
      {activeTab === 'bot-users' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders size={16} className="text-indigo-500" />
              <span>Gerenciamento de Contas Bot Users (4.1.1.PN.1)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle de privilégios, autorização de edição, permissão de reversão e flags de bots automáticos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px]">
                  <th className="py-2.5 px-3">Bot User</th>
                  <th className="py-2.5 px-3">Especialidade</th>
                  <th className="py-2.5 px-3">Gatilho</th>
                  <th className="py-2.5 px-3">Permissões</th>
                  <th className="py-2.5 px-3">Ações Totais</th>
                  <th className="py-2.5 px-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {botUsers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {b.username}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                          BOT
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {b.displayName}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {b.triggerMode}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {b.permissions.canEdit && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Editar
                          </span>
                        )}
                        {b.permissions.canRevert && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-50 text-rose-700 border border-rose-200">
                            Reverter
                          </span>
                        )}
                        {b.permissions.canSanitize && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-50 text-purple-700 border border-purple-200">
                            Sanitizar
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {b.totalActionsCount}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleBot(b.botId)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          b.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                        }`}
                      >
                        {b.enabled ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 4: PROTEÇÃO LGPD & DADOS SENSÍVEIS (4.1.1.E0.1 & 4.1.1-L8.3)
          ===================================================================== */}
      {activeTab === 'lgpd' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={16} className="text-rose-500" />
                <span>Auditoria de Conformidade LGPD & Expurgo Sensível</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detecção em tempo real e histórico de tentativas de inserção de CPF, CNPJ, RG, cartões e dados pessoais (Art. 18 da Lei 13.709/2018).
              </p>
            </div>

            <div className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 font-bold text-xs">
              {lgpdViolations.length} Casos Registrados
            </div>
          </div>

          {lgpdViolations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Nenhuma violação de privacidade ou dado pessoal sensível detectado no banco de dados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lgpdViolations.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-600 text-white">
                        {v.issueType.toUpperCase()}
                      </span>
                      <strong className="text-slate-900 dark:text-white">
                        {v.articleTitle}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(v.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                      {v.details}
                    </p>

                    {v.detectedDataSnippet && (
                      <div className="inline-block px-2 py-0.5 rounded bg-slate-900 text-rose-300 font-mono text-[10px]">
                        Dado mascarado: {v.detectedDataSnippet}
                      </div>
                    )}
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                    Expurgado
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ABA 5: SENTINELA DE USUÁRIOS & CONTRIBUIÇÕES (4.1.1.18C.1)
          ===================================================================== */}
      {activeTab === 'abuse' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck size={16} className="text-amber-500" />
              <span>Sentinela de Usuários & Contribuições (4.1.1.18C.1)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ferramenta auto-carregada por padrão para verificação automática da situação do usuário e detecção de abusos em contribuições.
            </p>
          </div>

          {abuseRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Nenhum histórico de abuso ou vandalismo registrado entre os usuários ativos. Reputação média geral: 100%.
            </div>
          ) : (
            <div className="space-y-3">
              {abuseRecords.map((rec) => (
                <div
                  key={rec.userUid}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-slate-900 dark:text-white">
                        {rec.displayName} (@{rec.username})
                      </strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.status === 'bloqueado'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.status === 'advertido'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {rec.status}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      Reputação: {rec.reputationScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1">
                    <div>Edições: {rec.totalEdits}</div>
                    <div>Incidentes Vandalismo: {rec.vandalismIncidents}</div>
                    <div>Violações LGPD: {rec.lgpdViolationsCount}</div>
                    <div>Reversões: {rec.revertedEditsCount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ABA 6: AUDITORIA & LOGS EM TEMPO REAL
          ===================================================================== */}
      {activeTab === 'logs' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                <span>Logs de Auditoria em Tempo Real dos Bots</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro imutável de todas as verificações, intervenções e alertas gerados.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 size={13} />
              <span>Limpar Histórico</span>
            </button>
          </div>

          <div className="space-y-2">
            {filteredFindings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum log registrado no momento.
              </div>
            ) : (
              filteredFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(f.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {f.botId}
                      </span>
                      <strong className="text-slate-900 dark:text-white">
                        {f.articleTitle}
                      </strong>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {f.summary}
                    </p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                    f.severity === 'critical'
                      ? 'bg-rose-100 text-rose-800'
                      : f.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {f.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
