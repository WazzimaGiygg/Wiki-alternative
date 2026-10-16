import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  Star,
  Edit3,
  Heart,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  UserCheck,
  Bell,
  X,
  ExternalLink,
  ChevronRight,
  Search,
  Check,
  AlertCircle,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  dailyChecklistService,
  UserMonthlyChecklist,
  CHECKLIST_CONFIG,
} from '../services/dailyChecklistService';
import { PushNotificationService, PushPreferences } from '../services/pushNotificationService';
import { StorageService } from '../services/storageService';
import { ExtensionManager, isUserBureaucrat } from '../core/ExtensionManager';

interface DailyChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenLoginModal?: () => void;
  onNavigateToEditor?: () => void;
  onNavigateToExplore?: () => void;
}

export const DailyChecklistModal: React.FC<DailyChecklistModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenLoginModal,
  onNavigateToEditor,
  onNavigateToExplore,
}) => {
  // Tabs: checklist | leaderboard | history | bureaucrat
  const [activeTab, setActiveTab] = useState<'checklist' | 'leaderboard' | 'history' | 'bureaucrat'>('checklist');
  const [checklist, setChecklist] = useState<UserMonthlyChecklist | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserMonthlyChecklist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Push notifications state
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() =>
    PushNotificationService.getPermission()
  );
  const [pushPrefs, setPushPrefs] = useState<PushPreferences>(() =>
    PushNotificationService.getPreferences()
  );
  const [pushTestFeedback, setPushTestFeedback] = useState<string | null>(null);

  // Burocrata Manual Award Form state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserProfile | null>(null);
  const [awardPoints, setAwardPoints] = useState<number>(CHECKLIST_CONFIG.POINTS_DONATION); // default 10 pontos doação
  const [awardJustification, setAwardJustification] = useState<string>(
    'Doação financeira comprovada em prol da manutenção dos servidores do Wiki-Site'
  );
  const [awardSubmitting, setAwardSubmitting] = useState<boolean>(false);
  const [awardFeedback, setAwardFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isBureaucratUser = useMemo(() => isUserBureaucrat(currentUser), [currentUser]);

  // Carrega os dados do checklist e ranking
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        if (currentUser && !currentUser.isGuest) {
          const data = await dailyChecklistService.getUserChecklist(currentUser);
          if (isMounted) setChecklist(data);
        }
        const board = await dailyChecklistService.getMonthlyLeaderboard();
        if (isMounted) setLeaderboard(board);

        // Se o usuário for burocrata, carrega usuários para a aba de concessão
        if (isUserBureaucrat(currentUser)) {
          const users = await StorageService.getCommunityUsers();
          if (isMounted) setAllUsers(users);
        }
      } catch (err) {
        console.warn('[DailyChecklistModal] Erro ao carregar dados:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  // Se inscreve para atualizações em tempo real do checklist do usuário
  useEffect(() => {
    if (!currentUser || currentUser.isGuest || !isOpen) return;
    const unsub = dailyChecklistService.subscribe(currentUser.uid, (updated) => {
      setChecklist(updated);
    });
    return unsub;
  }, [currentUser, isOpen]);

  // Atualiza permissões de push quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setPushPermission(PushNotificationService.getPermission());
      setPushPrefs(PushNotificationService.getPreferences());
      const unsub = PushNotificationService.subscribeToPreferences((prefs) => {
        setPushPrefs(prefs);
      });
      return unsub;
    }
  }, [isOpen]);

  // Filtro de usuários para o Burocrata
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsers.slice(0, 8);
    const q = userSearchQuery.toLowerCase().trim();
    return allUsers.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allUsers, userSearchQuery]);

  // Cálculo de progresso diário
  const todayProgress = useMemo(() => {
    if (!checklist?.todayStatus) return { completed: 0, total: 4, percent: 0 };
    const st = checklist.todayStatus;
    let count = 0;
    if (st.loginCompleted) count++;
    if (st.contributionCompleted || st.contributionCount > 0) count++;
    if (st.ratingCompleted || st.ratingCount > 0) count++;
    if (st.donationCompleted || st.manualPointsToday > 0) count++;
    return {
      completed: count,
      total: 4,
      percent: Math.round((count / 4) * 100),
    };
  }, [checklist]);

  // Registrar login manual caso ainda não tenha sido registrado hoje
  const handleClaimLoginPoints = async () => {
    if (!currentUser || currentUser.isGuest) {
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    setActionLoading(true);
    try {
      const res = await dailyChecklistService.recordDailyLogin(currentUser);
      if (res.checklist) setChecklist(res.checklist);
    } finally {
      setActionLoading(false);
    }
  };

  // Submeter concessão manual pelo Burocrata (Requisitos 3.05.8.b.d & 3.05.8.b.d.a)
  const handleAwardPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBureaucratUser || !currentUser) {
      setAwardFeedback({ message: 'Apenas membros do Conselho de Burocratas podem conceder pontos.', type: 'error' });
      return;
    }
    if (!selectedTargetUser) {
      setAwardFeedback({ message: 'Selecione um usuário destinatário.', type: 'error' });
      return;
    }
    if (awardPoints <= 0) {
      setAwardFeedback({ message: 'Informe uma quantidade de pontos válida superior a 0.', type: 'error' });
      return;
    }
    if (!awardJustification.trim()) {
      setAwardFeedback({ message: 'A justificativa ou comprovação da doação é obrigatória.', type: 'error' });
      return;
    }

    setAwardSubmitting(true);
    setAwardFeedback(null);

    try {
      const res = await dailyChecklistService.awardManualPoints(
        {
          uid: selectedTargetUser.uid,
          username: selectedTargetUser.username || selectedTargetUser.displayName || 'editor',
          displayName: selectedTargetUser.displayName || selectedTargetUser.username,
        },
        awardPoints,
        awardJustification,
        currentUser
      );

      if (res.success) {
        setAwardFeedback({ message: res.message, type: 'success' });
        // Recarrega o leaderboard
        const board = await dailyChecklistService.getMonthlyLeaderboard();
        setLeaderboard(board);
        // Se premiou a si mesmo para testes, atualiza o checklist local
        if (selectedTargetUser.uid === currentUser.uid && res.checklist) {
          setChecklist(res.checklist);
        }
      } else {
        setAwardFeedback({ message: res.message, type: 'error' });
      }
    } catch (err: any) {
      setAwardFeedback({ message: err?.message || 'Falha ao conceder pontos manuais.', type: 'error' });
    } finally {
      setAwardSubmitting(false);
    }
  };

  // Disparar notificação de teste push do checklist (3.05.3.c)
  const handleTestPushReminder = async () => {
    if (pushPermission !== 'granted') {
      const perm = await PushNotificationService.requestPermission();
      setPushPermission(perm);
      if (perm !== 'granted') {
        setPushTestFeedback('Permissão de notificações não concedida no navegador.');
        return;
      }
    }

    const pendingList: string[] = [];
    if (!checklist?.todayStatus?.loginCompleted) pendingList.push('Login (+1 pt)');
    if (!checklist?.todayStatus?.contributionCompleted) pendingList.push('Edição (+0.20 pt)');
    if (!checklist?.todayStatus?.ratingCompleted) pendingList.push('Avaliação (+1 pt)');

    const ok = await PushNotificationService.sendDailyChecklistReminder(pendingList);
    setPushTestFeedback(
      ok
        ? '✅ Alerta Push enviado com sucesso pelo Service Worker!'
        : '⚠️ Notificação bloqueada ou permissão pendente.'
    );
    setTimeout(() => setPushTestFeedback(null), 5000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Trophy size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="checklist-modal-title" className="text-lg font-bold font-serif-heading text-slate-900 dark:text-white">
                  Checklist Diário & Pontuação Mensal
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Extensão 3.05.8.b
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {dailyChecklistService.getMonthDisplayName()} • Realize tarefas diárias e acumule pontos no ranking comunitário
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumo de Pontos e Sequência do Usuário */}
        {currentUser && !currentUser.isGuest && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70">
              <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Pontos no Mês</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {checklist ? checklist.totalPoints.toFixed(2) : '0.00'} pts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70">
              <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                <Flame size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Sequência (Streak)</span>
                <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                  {checklist?.streakDays || 1} {checklist?.streakDays === 1 ? 'dia' : 'dias'} 🔥
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70">
              <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Metas de Hoje</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {todayProgress.completed} de {todayProgress.total} ({todayProgress.percent}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70">
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Sparkles size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Colaborador</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block max-w-[120px]">
                  @{currentUser.username || currentUser.displayName || 'editor'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'checklist'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>Checklist Diário</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {todayProgress.completed}/{todayProgress.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'leaderboard'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trophy size={15} />
            <span>Ranking Mensal</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-mono">
              Top {leaderboard.length}
            </span>
          </button>

          {currentUser && !currentUser.isGuest && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock size={15} />
              <span>Meu Histórico</span>
              {checklist && checklist.history.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {checklist.history.length}
                </span>
              )}
            </button>
          )}

          {isBureaucratUser && (
            <button
              type="button"
              onClick={() => setActiveTab('bureaucrat')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition cursor-pointer shrink-0 ${
                activeTab === 'bureaucrat'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={15} className="text-amber-500" />
              <span>Concessão de Burocrata</span>
              <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold uppercase">
                Admin
              </span>
            </button>
          )}
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Alerta de visitante se não logado */}
          {(!currentUser || currentUser.isGuest) && activeTab !== 'leaderboard' && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <LogIn className="text-blue-600 dark:text-blue-400 shrink-0" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                    Faça login para acumular pontos diários
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Ao criar uma conta ou entrar, você ganha 1 ponto imediatamente pelo login diário e acumula pontos em cada edição ou avaliação realizada!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition shadow-xs cursor-pointer"
              >
                Entrar / Cadastrar
              </button>
            </div>
          )}

          {/* ABA 1: CHECKLIST DIÁRIO */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              {/* Barra de Progresso Diário */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Progresso das Metas Diárias de Hoje
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {todayProgress.completed} de {todayProgress.total} tarefas ({todayProgress.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${todayProgress.percent}%` }}
                  />
                </div>
              </div>

              {/* Lista dos 4 Itens do Checklist Requisitados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* 3.05.8.b.a: Login no Wiki-Site (1 ponto) */}
                <div className={`p-4 rounded-xl border transition-all ${
                  checklist?.todayStatus?.loginCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        checklist?.todayStatus?.loginCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {checklist?.todayStatus?.loginCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Fazer login no Wiki-Site
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            +1.0 pt
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Requisito 3.05.8.b.a: Concede 1 ponto diário creditado automaticamente no primeiro acesso do dia.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    {checklist?.todayStatus?.loginCompleted ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                        <Check size={14} /> Concluído hoje (+1 ponto registrado)
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleClaimLoginPoints}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Sparkles size={12} /> Registrar Ponto de Login
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">1x ao dia</span>
                  </div>
                </div>

                {/* 3.05.8.b.b: Fazer uma contribuição (0.20 pontos) */}
                <div className={`p-4 rounded-xl border transition-all ${
                  checklist?.todayStatus?.contributionCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        checklist?.todayStatus?.contributionCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {checklist?.todayStatus?.contributionCompleted ? <CheckCircle2 size={18} /> : <Edit3 size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Fazer uma contribuição
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                            +0.20 pt / edição
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Requisito 3.05.8.b.b: Concede 0.20 pontos ao editar verbetes ou publicar novas páginas na Wiki.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="text-[11px]">
                      {checklist?.todayStatus?.contributionCount ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={14} /> {checklist.todayStatus.contributionCount} contribuição(ões) hoje (+{(checklist.todayStatus.contributionCount * 0.20).toFixed(2)} pts)
                        </span>
                      ) : (
                        <span className="text-slate-500">Nenhuma edição hoje</span>
                      )}
                    </div>
                    {onNavigateToEditor && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToEditor();
                        }}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Ir ao Editor <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3.05.8.b.c: Fazer avaliação de um artigo (1 ponto) */}
                <div className={`p-4 rounded-xl border transition-all ${
                  checklist?.todayStatus?.ratingCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        checklist?.todayStatus?.ratingCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {checklist?.todayStatus?.ratingCompleted ? <CheckCircle2 size={18} /> : <Star size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Fazer avaliação de um artigo
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            +1.0 pt
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Requisito 3.05.8.b.c: Concede 1 ponto ao avaliar qualquer artigo com notas e comentários de qualidade.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="text-[11px]">
                      {checklist?.todayStatus?.ratingCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={14} /> Avaliação registrada hoje (+1.0 pt)
                        </span>
                      ) : (
                        <span className="text-slate-500">Pendente hoje</span>
                      )}
                    </div>
                    {onNavigateToExplore && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToExplore();
                        }}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Explorar Artigo <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3.05.8.b.d: Fazer doação ao Wiki-site (10 pontos - concedido por Burocrata) */}
                <div className={`p-4 rounded-xl border transition-all ${
                  checklist?.todayStatus?.donationCompleted
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/80'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        checklist?.todayStatus?.donationCompleted
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {checklist?.todayStatus?.donationCompleted ? <CheckCircle2 size={18} /> : <Heart size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Fazer doação ao Wiki-Site
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                            +10.0 pts
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Requisito 3.05.8.b.d: Apoio financeiro comprovado. Os 10 pontos são creditados manualmente pelo Conselho de Burocratas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    {checklist?.todayStatus?.donationCompleted ? (
                      <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                        <Check size={14} /> Doação confirmada (+10 pts)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Envie seu comprovante ao Conselho
                      </span>
                    )}
                    {isBureaucratUser ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('bureaucrat')}
                        className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Painel de Concessão <ChevronRight size={12} />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Concessão formal</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Seção 3.05.3.c: Integração com Alertas Push */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-500/15 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-600 text-white shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Alertas Push do Checklist Diário
                      <span className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300">
                        Requisito 3.05.3.c
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Receba lembretes nativos no navegador com suas metas pendentes para não perder pontos nem sua sequência diária (streak).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleTestPushReminder}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Bell size={12} /> Testar Alerta Push
                  </button>
                </div>
              </div>

              {pushTestFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <Check size={14} /> {pushTestFeedback}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: RANKING MENSAL (LEADERBOARD) */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ranking Comunitário de Colaboradores
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dailyChecklistService.getMonthDisplayName()} • Usuários que mais pontuaram neste mês
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Total: {leaderboard.length} colaboradores
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Carregando ranking mensal...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  Nenhum ponto registrado neste mês ainda. Seja o primeiro a pontuar realizando o login ou uma contribuição!
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {leaderboard.map((item, index) => {
                    const isMe = currentUser && currentUser.uid === item.uid;
                    const rankMedals = ['🥇', '🥈', '🥉'];
                    const medal = index < 3 ? rankMedals[index] : null;

                    return (
                      <div
                        key={item.uid}
                        className={`flex items-center justify-between p-3.5 text-xs transition ${
                          isMe
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 text-center font-bold text-sm font-mono text-slate-500">
                            {medal || `#${index + 1}`}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                            {(item.username || item.displayName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                @{item.username || item.displayName}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-white">
                                  Você
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Streak: {item.streakDays || 1} {item.streakDays === 1 ? 'dia' : 'dias'} 🔥
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block font-mono">
                              {item.totalPoints.toFixed(2)} pts
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.history?.length || 0} atividades
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: MEU HISTÓRICO DE PONTOS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Histórico de Pontos Acumulados
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registro auditável de todas as suas conquistas de pontos em {dailyChecklistService.getMonthDisplayName()}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  Total: {checklist?.totalPoints.toFixed(2) || '0.00'} pts
                </span>
              </div>

              {!checklist || checklist.history.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  Nenhum ponto registrado no seu histórico neste mês ainda.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {checklist.history.map((entry) => {
                    const taskIcons: Record<string, React.ReactNode> = {
                      login: <LogIn size={14} className="text-amber-500" />,
                      contribution: <Edit3 size={14} className="text-blue-500" />,
                      rating: <Star size={14} className="text-amber-400" />,
                      donation: <Heart size={14} className="text-purple-500" />,
                      manual_reward: <ShieldCheck size={14} className="text-purple-600" />,
                    };

                    const dateFormatted = new Date(entry.timestamp).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={entry.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                            {taskIcons[entry.taskType] || <Award size={14} className="text-amber-500" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {entry.description}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>{dateFormatted}</span>
                              {entry.awardedBy && (
                                <span>• Concedido por: @{entry.awardedBy.username} ({entry.awardedBy.role})</span>
                              )}
                              {entry.justification && (
                                <span>• Justificativa: "{entry.justification}"</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="font-bold font-mono text-sm px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                          +{entry.points >= 1 ? entry.points.toFixed(0) : entry.points.toFixed(2)} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: PAINEL DO BUROCRATA - CONCESSÃO MANUAL DE PONTOS (3.05.8.b.d & 3.05.8.b.d.a) */}
          {activeTab === 'bureaucrat' && isBureaucratUser && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex items-start gap-3">
                <ShieldCheck size={22} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    Concessão Manual de Pontos pelo Burocrata
                    <span className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                      Requisitos 3.05.8.b.d & 3.05.8.b.d.a
                    </span>
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Permite conceder pontuações a colaboradores da comunidade, especialmente os <strong>10 pontos por doação comprovada ao Wiki-Site</strong>, ou bônus manuais com registro formal de justificativa e auditoria permanente.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAwardPointsSubmit} className="space-y-4">
                {/* 1. Selecionar Usuário */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    1. Selecione o Usuário Destinatário:
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Pesquisar usuário por nome ou @username..."
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Lista de Usuários Candidatos */}
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedTargetUser?.uid === u.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => setSelectedTargetUser(u)}
                          className={`p-2 rounded-lg text-left text-xs border transition cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-950 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/30'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(u.username || u.displayName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-bold truncate block">@{u.username || u.displayName}</span>
                            <span className="text-[9px] text-slate-400 capitalize">{u.role || 'editor'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedTargetUser && (
                    <div className="mt-1.5 text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5">
                      <UserCheck size={14} /> Selecionado: <strong>@{selectedTargetUser.username || selectedTargetUser.displayName}</strong> ({selectedTargetUser.email || 'sem email'})
                    </div>
                  )}
                </div>

                {/* 2. Seleção de Pontos com Predefinição de Doação (3.05.8.b.d) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    2. Quantidade de Pontos a Conceder:
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAwardPoints(CHECKLIST_CONFIG.POINTS_DONATION);
                        setAwardJustification('Doação financeira comprovada ao Wiki-Site verificada pelo Burocrata');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        awardPoints === 10
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-purple-400'
                      }`}
                    >
                      <Heart size={14} className={awardPoints === 10 ? 'text-white' : 'text-purple-500'} />
                      <span>+10.0 pts (Doação Comprovada - 3.05.8.b.d)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAwardPoints(1.0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        awardPoints === 1.0
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <Star size={14} className={awardPoints === 1.0 ? 'text-white' : 'text-amber-500'} />
                      <span>+1.0 pt (Avaliação / Mérito)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAwardPoints(0.20)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        awardPoints === 0.20
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <Edit3 size={14} className={awardPoints === 0.20 ? 'text-white' : 'text-blue-500'} />
                      <span>+0.20 pt (Edição / Criação)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 max-w-xs">
                    <span className="text-xs text-slate-500">Valor customizado:</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0.10"
                      max="100.00"
                      value={awardPoints}
                      onChange={(e) => setAwardPoints(parseFloat(e.target.value) || 0)}
                      className="w-28 text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">pontos</span>
                  </div>
                </div>

                {/* 3. Justificativa Formal Obrigatória */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    3. Justificativa Formal da Concessão / Comprovação (Obrigatório):
                  </label>
                  <textarea
                    rows={2}
                    value={awardJustification}
                    onChange={(e) => setAwardJustification(e.target.value)}
                    placeholder="Ex: Comprovante de doação PIX/Transferência validado; Bonificação por destaque enciclopédico..."
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Esta justificativa será registrada no histórico público do colaborador e auditada pela comunidade.
                  </span>
                </div>

                {/* Feedback */}
                {awardFeedback && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    awardFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {awardFeedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{awardFeedback.message}</span>
                  </div>
                )}

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={awardSubmitting || !selectedTargetUser}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>{awardSubmitting ? 'Gravando Concessão...' : `Conceder ${awardPoints} Pontos a @${selectedTargetUser?.username || 'Usuário'}`}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px]">Sincronização em tempo real ativa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default DailyChecklistModal;
