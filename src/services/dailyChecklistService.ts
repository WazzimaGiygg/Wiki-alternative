/**
 * SERVIÇO DE CHECKLIST DIÁRIO E PONTUAÇÃO MENSAL (Requisitos 3.05.3.af, 3.05.8.b, 3.05.8.b.a-d)
 * 
 * Sistema de pontos acumulados durante o mês por usuário:
 * - 3.05.8.b.a: Fazer login no Wiki-Site (1.0 ponto diário)
 * - 3.05.8.b.b: Fazer uma contribuição (0.20 pontos por edição/criação)
 * - 3.05.8.b.c: Fazer avaliação de um artigo (1.0 ponto)
 * - 3.05.8.b.d: Fazer doação ao Wiki-Site (10.0 pontos mediante comprovação, concedido manualmente por Burocrata)
 * - 3.05.8.b.d.a: Concessão manual de pontos por Burocratas a qualquer usuário com registro e justificativa
 * - 3.05.3.c: Integração com alertas push nativos do navegador
 */

import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { getDbSafe } from './firebase';
import { UserProfile } from '../types';
import { PushNotificationService } from './pushNotificationService';
import { ExtensionManager } from '../core/ExtensionManager';

export interface ChecklistPointEntry {
  id: string;
  timestamp: string;
  taskType: 'login' | 'contribution' | 'rating' | 'donation' | 'manual_reward';
  points: number;
  description: string;
  awardedBy?: {
    uid: string;
    username: string;
    role: string;
  };
  justification?: string;
  articleTitle?: string;
}

export interface DailyChecklistTodayStatus {
  dateKey: string;
  loginCompleted: boolean;
  contributionCompleted: boolean;
  contributionCount: number;
  ratingCompleted: boolean;
  ratingCount: number;
  donationCompleted: boolean;
  manualPointsToday: number;
}

export interface UserMonthlyChecklist {
  uid: string;
  username: string;
  displayName?: string;
  monthKey: string; // ex: '2026-10'
  totalPoints: number;
  streakDays: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  history: ChecklistPointEntry[];
  todayStatus: DailyChecklistTodayStatus;
}

export const CHECKLIST_CONFIG = {
  POINTS_LOGIN: 1.0,
  POINTS_CONTRIBUTION: 0.20,
  POINTS_RATING: 1.0,
  POINTS_DONATION: 10.0,
  STORAGE_PREFIX: 'wikizero_checklist_',
  LEADERBOARD_KEY: 'wikizero_checklist_leaderboard_v1',
};

type ChecklistSubscriber = (checklist: UserMonthlyChecklist) => void;

export class DailyChecklistService {
  private static instance: DailyChecklistService;
  private subscribers: Map<string, Set<ChecklistSubscriber>> = new Map();

  private constructor() {}

  public static getInstance(): DailyChecklistService {
    if (!DailyChecklistService.instance) {
      DailyChecklistService.instance = new DailyChecklistService();
    }
    return DailyChecklistService.instance;
  }

  public getTodayDateKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getCurrentMonthKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  public getMonthDisplayName(monthKey: string = this.getCurrentMonthKey()): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
  }

  private isExtensionActive(): boolean {
    try {
      return ExtensionManager.getInstance().isExtensionEnabled('DailyChecklistExtension');
    } catch {
      return true;
    }
  }

  /**
   * Obtém a ficha mensal de checklist do usuário, sincronizando com localStorage e Firestore.
   */
  public async getUserChecklist(user: UserProfile | null): Promise<UserMonthlyChecklist | null> {
    if (!user || user.isGuest) return null;

    const monthKey = this.getCurrentMonthKey();
    const todayKey = this.getTodayDateKey();
    const storageKey = `${CHECKLIST_CONFIG.STORAGE_PREFIX}${user.uid}_${monthKey}`;

    let localData: UserMonthlyChecklist | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        localData = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[DailyChecklistService] Erro ao ler checklist local:', e);
    }

    // Se mudou de dia, reseta o todayStatus mantendo os pontos do mês
    if (localData && localData.todayStatus?.dateKey !== todayKey) {
      // Cálculo de streak (dias consecutivos)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      let newStreak = localData.streakDays || 1;
      if (localData.lastActiveDate === yesterdayKey) {
        // Manteve o streak de ontem
      } else if (localData.lastActiveDate !== todayKey) {
        // Quebrou o streak
        newStreak = 1;
      }

      localData.todayStatus = {
        dateKey: todayKey,
        loginCompleted: false,
        contributionCompleted: false,
        contributionCount: 0,
        ratingCompleted: false,
        ratingCount: 0,
        donationCompleted: false,
        manualPointsToday: 0,
      };
      localData.streakDays = newStreak;
      this.saveLocal(user.uid, localData);
    }

    // Tentativa de leitura no Firestore
    const db = getDbSafe();
    if (db) {
      try {
        const docRef = doc(db, 'user_checklist_points', `${user.uid}_${monthKey}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as UserMonthlyChecklist;
          if (remoteData && typeof remoteData.totalPoints === 'number') {
            // Unir o maior total de pontos e histórico
            if (!localData || remoteData.totalPoints > localData.totalPoints) {
              localData = {
                ...remoteData,
                todayStatus: localData?.todayStatus?.dateKey === todayKey
                  ? localData.todayStatus
                  : (remoteData.todayStatus?.dateKey === todayKey ? remoteData.todayStatus : {
                      dateKey: todayKey,
                      loginCompleted: false,
                      contributionCompleted: false,
                      contributionCount: 0,
                      ratingCompleted: false,
                      ratingCount: 0,
                      donationCompleted: false,
                      manualPointsToday: 0,
                    }),
              };
              this.saveLocal(user.uid, localData);
            }
          }
        }
      } catch (err) {
        console.warn('[DailyChecklistService] Leitura Firestore ignorada (usando cache):', err);
      }
    }

    // Se ainda não existir, cria a estrutura inicial do mês
    if (!localData) {
      localData = {
        uid: user.uid,
        username: user.username || user.displayName || 'Colaborador',
        displayName: user.displayName || user.username,
        monthKey,
        totalPoints: 0,
        streakDays: 1,
        lastActiveDate: todayKey,
        history: [],
        todayStatus: {
          dateKey: todayKey,
          loginCompleted: false,
          contributionCompleted: false,
          contributionCount: 0,
          ratingCompleted: false,
          ratingCount: 0,
          donationCompleted: false,
          manualPointsToday: 0,
        },
      };
      this.saveLocal(user.uid, localData);
      this.syncFirestore(localData);
    }

    return localData;
  }

  /**
   * 3.05.8.b.a: Concede 1 ponto diário pelo Login no Wiki-Site
   */
  public async recordDailyLogin(user: UserProfile | null): Promise<{ awarded: boolean; points: number; checklist: UserMonthlyChecklist | null }> {
    if (!user || user.isGuest || !this.isExtensionActive()) {
      return { awarded: false, points: 0, checklist: null };
    }

    const current = await this.getUserChecklist(user);
    if (!current) return { awarded: false, points: 0, checklist: null };

    const todayKey = this.getTodayDateKey();

    // Se já fez login hoje, não duplica o ponto diário
    if (current.todayStatus.loginCompleted && current.todayStatus.dateKey === todayKey) {
      return { awarded: false, points: 0, checklist: current };
    }

    const points = CHECKLIST_CONFIG.POINTS_LOGIN;
    const entry: ChecklistPointEntry = {
      id: `pt-login-${Date.now()}`,
      timestamp: new Date().toISOString(),
      taskType: 'login',
      points,
      description: 'Login diário no Wiki-Site',
    };

    current.totalPoints = Number((current.totalPoints + points).toFixed(2));
    current.todayStatus.loginCompleted = true;
    current.lastActiveDate = todayKey;
    current.history.unshift(entry);

    this.saveLocal(user.uid, current);
    await this.syncFirestore(current);
    this.notifySubscribers(user.uid, current);
    this.updateLeaderboardCache(current);

    // Alerta Push de Pontos Conquistados (3.05.3.c)
    PushNotificationService.sendChecklistPointsEarned(points, 'Login diário no Wiki-Site').catch(() => {});

    return { awarded: true, points, checklist: current };
  }

  /**
   * 3.05.8.b.b: Concede 0.20 pontos ao fazer uma contribuição (edição ou criação de artigo)
   */
  public async recordContribution(user: UserProfile | null, articleTitle?: string): Promise<{ awarded: boolean; points: number; checklist: UserMonthlyChecklist | null }> {
    if (!user || user.isGuest || !this.isExtensionActive()) {
      return { awarded: false, points: 0, checklist: null };
    }

    const current = await this.getUserChecklist(user);
    if (!current) return { awarded: false, points: 0, checklist: null };

    const points = CHECKLIST_CONFIG.POINTS_CONTRIBUTION;
    const entry: ChecklistPointEntry = {
      id: `pt-contrib-${Date.now()}`,
      timestamp: new Date().toISOString(),
      taskType: 'contribution',
      points,
      description: articleTitle ? `Contribuição no artigo: "${articleTitle}"` : 'Contribuição enciclopédica no Wiki-Site',
      articleTitle,
    };

    current.totalPoints = Number((current.totalPoints + points).toFixed(2));
    current.todayStatus.contributionCompleted = true;
    current.todayStatus.contributionCount = (current.todayStatus.contributionCount || 0) + 1;
    current.lastActiveDate = this.getTodayDateKey();
    current.history.unshift(entry);

    this.saveLocal(user.uid, current);
    await this.syncFirestore(current);
    this.notifySubscribers(user.uid, current);
    this.updateLeaderboardCache(current);

    // Alerta Push de Pontos Conquistados (3.05.3.c)
    PushNotificationService.sendChecklistPointsEarned(points, `Contribuição realizada (${articleTitle || 'verbete'})`).catch(() => {});

    return { awarded: true, points, checklist: current };
  }

  /**
   * 3.05.8.b.c: Concede 1.0 ponto ao avaliar um artigo
   */
  public async recordArticleRating(user: UserProfile | null, articleTitle?: string, score?: number): Promise<{ awarded: boolean; points: number; checklist: UserMonthlyChecklist | null }> {
    if (!user || user.isGuest || !this.isExtensionActive()) {
      return { awarded: false, points: 0, checklist: null };
    }

    const current = await this.getUserChecklist(user);
    if (!current) return { awarded: false, points: 0, checklist: null };

    const todayKey = this.getTodayDateKey();

    // Primeira avaliação do dia garante 1 ponto
    const points = CHECKLIST_CONFIG.POINTS_RATING;
    const entry: ChecklistPointEntry = {
      id: `pt-rating-${Date.now()}`,
      timestamp: new Date().toISOString(),
      taskType: 'rating',
      points,
      description: articleTitle
        ? `Avaliação de artigo: "${articleTitle}" (${score ? `${score} estrelas` : 'nota atribuída'})`
        : 'Avaliação de artigo enciclopédico',
      articleTitle,
    };

    current.totalPoints = Number((current.totalPoints + points).toFixed(2));
    current.todayStatus.ratingCompleted = true;
    current.todayStatus.ratingCount = (current.todayStatus.ratingCount || 0) + 1;
    current.lastActiveDate = todayKey;
    current.history.unshift(entry);

    this.saveLocal(user.uid, current);
    await this.syncFirestore(current);
    this.notifySubscribers(user.uid, current);
    this.updateLeaderboardCache(current);

    // Alerta Push de Pontos Conquistados (3.05.3.c)
    PushNotificationService.sendChecklistPointsEarned(points, `Avaliação registrada no artigo "${articleTitle || 'verbete'}"`).catch(() => {});

    return { awarded: true, points, checklist: current };
  }

  /**
   * 3.05.8.b.d & 3.05.8.b.d.a: Concessão Manual de Pontos pelo Burocrata
   * Permite que o Burocrata conceda pontos (ex: 10 pontos de doação comprovada ou bônus)
   */
  public async awardManualPoints(
    targetUser: { uid: string; username: string; displayName?: string },
    points: number,
    justification: string,
    bureaucrat: UserProfile
  ): Promise<{ success: boolean; checklist?: UserMonthlyChecklist; message: string }> {
    if (!bureaucrat || (!this.isUserBureaucrat(bureaucrat))) {
      return { success: false, message: 'Permissão negada: Apenas membros do Conselho de Burocratas podem conceder pontos manualmente.' };
    }

    if (!targetUser || !targetUser.uid) {
      return { success: false, message: 'Usuário de destino inválido.' };
    }

    if (points <= 0) {
      return { success: false, message: 'A quantidade de pontos deve ser maior do que zero.' };
    }

    const monthKey = this.getCurrentMonthKey();
    const todayKey = this.getTodayDateKey();
    const isDonation = points === CHECKLIST_CONFIG.POINTS_DONATION || justification.toLowerCase().includes('doa');

    // Carrega o registro do usuário de destino
    const pseudoUser: UserProfile = {
      uid: targetUser.uid,
      username: targetUser.username,
      displayName: targetUser.displayName || targetUser.username,
      email: '',
      role: 'editor',
      isGuest: false,
      isBanned: false,
      createdAt: new Date().toISOString(),
    };

    const current = (await this.getUserChecklist(pseudoUser)) || {
      uid: targetUser.uid,
      username: targetUser.username,
      displayName: targetUser.displayName || targetUser.username,
      monthKey,
      totalPoints: 0,
      streakDays: 1,
      lastActiveDate: todayKey,
      history: [],
      todayStatus: {
        dateKey: todayKey,
        loginCompleted: false,
        contributionCompleted: false,
        contributionCount: 0,
        ratingCompleted: false,
        ratingCount: 0,
        donationCompleted: false,
        manualPointsToday: 0,
      },
    };

    const entry: ChecklistPointEntry = {
      id: `pt-manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      taskType: isDonation ? 'donation' : 'manual_reward',
      points: Number(points.toFixed(2)),
      description: isDonation
        ? `Doação comprovada ao Wiki-Site (${justification || 'Comprovante verificado pelo Burocrata'})`
        : `Bônus concedido por Burocrata: ${justification}`,
      justification: justification.trim(),
      awardedBy: {
        uid: bureaucrat.uid,
        username: bureaucrat.username || bureaucrat.displayName || 'Burocrata',
        role: bureaucrat.role || 'burocrata',
      },
    };

    current.totalPoints = Number((current.totalPoints + points).toFixed(2));
    if (isDonation) {
      current.todayStatus.donationCompleted = true;
    }
    current.todayStatus.manualPointsToday = (current.todayStatus.manualPointsToday || 0) + points;
    current.history.unshift(entry);

    this.saveLocal(targetUser.uid, current);
    await this.syncFirestore(current);
    this.notifySubscribers(targetUser.uid, current);
    this.updateLeaderboardCache(current);

    // Push notification para o usuário premiado (se estiver online / na sessão)
    PushNotificationService.sendChecklistPointsEarned(
      points,
      isDonation ? 'Doação comprovada ao Wiki-Site' : `Concedido por Burocrata: ${justification}`
    ).catch(() => {});

    return {
      success: true,
      checklist: current,
      message: `Sucesso: ${points} pontos concedidos a @${targetUser.username} com justificativa registrada!`,
    };
  }

  /**
   * Obtém o ranking / leaderboard mensal de pontos dos usuários
   */
  public async getMonthlyLeaderboard(monthKey: string = this.getCurrentMonthKey()): Promise<UserMonthlyChecklist[]> {
    let list: UserMonthlyChecklist[] = [];

    // Tenta carregar do cache local
    try {
      const raw = localStorage.getItem(`${CHECKLIST_CONFIG.LEADERBOARD_KEY}_${monthKey}`);
      if (raw) {
        list = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[DailyChecklistService] Erro ao ler leaderboard local:', e);
    }

    // Tenta carregar do Firestore
    const db = getDbSafe();
    if (db) {
      try {
        const q = query(
          collection(db, 'user_checklist_points'),
          where('monthKey', '==', monthKey)
        );
        const snap = await getDocs(q);
        const remoteList: UserMonthlyChecklist[] = [];
        snap.forEach((d) => {
          remoteList.push(d.data() as UserMonthlyChecklist);
        });

        if (remoteList.length > 0) {
          list = remoteList;
          try {
            localStorage.setItem(`${CHECKLIST_CONFIG.LEADERBOARD_KEY}_${monthKey}`, JSON.stringify(list));
          } catch {}
        }
      } catch (err) {
        console.warn('[DailyChecklistService] Erro ao carregar leaderboard do Firestore:', err);
      }
    }

    // Ordena do maior para o menor pontuador
    list.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    return list;
  }

  /**
   * Inscrição em tempo real para atualizações do checklist do usuário
   */
  public subscribe(uid: string, callback: ChecklistSubscriber): () => void {
    if (!this.subscribers.has(uid)) {
      this.subscribers.set(uid, new Set());
    }
    this.subscribers.get(uid)!.add(callback);

    return () => {
      const set = this.subscribers.get(uid);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.subscribers.delete(uid);
        }
      }
    };
  }

  private notifySubscribers(uid: string, data: UserMonthlyChecklist): void {
    const set = this.subscribers.get(uid);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('[DailyChecklistService] Erro no callback do assinante:', e);
        }
      });
    }
  }

  private saveLocal(uid: string, data: UserMonthlyChecklist): void {
    try {
      const storageKey = `${CHECKLIST_CONFIG.STORAGE_PREFIX}${uid}_${data.monthKey}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[DailyChecklistService] Erro ao gravar no localStorage:', e);
    }
  }

  private async syncFirestore(data: UserMonthlyChecklist): Promise<void> {
    const db = getDbSafe();
    if (!db) return;

    try {
      const docRef = doc(db, 'user_checklist_points', `${data.uid}_${data.monthKey}`);
      await setDoc(
        docRef,
        {
          ...data,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      // Também sincroniza a pontuação atual no documento de perfil do usuário
      const userDocRef = doc(db, 'users', data.uid);
      await setDoc(
        userDocRef,
        {
          checklistPoints: data.totalPoints,
          checklistStreak: data.streakDays,
          checklistMonth: data.monthKey,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[DailyChecklistService] Falha ao sincronizar checklist no Firestore:', err);
    }
  }

  private updateLeaderboardCache(userChecklist: UserMonthlyChecklist): void {
    try {
      const key = `${CHECKLIST_CONFIG.LEADERBOARD_KEY}_${userChecklist.monthKey}`;
      const raw = localStorage.getItem(key);
      let list: UserMonthlyChecklist[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((u) => u.uid === userChecklist.uid);
      if (idx >= 0) {
        list[idx] = userChecklist;
      } else {
        list.push(userChecklist);
      }
      list.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      localStorage.setItem(key, JSON.stringify(list));
    } catch {}
  }

  private isUserBureaucrat(user: UserProfile | null): boolean {
    if (!user) return false;
    if (user.email === 'pedrohenriquecardonaperes@gmail.com') return true;
    if (user.group && user.group.toLowerCase().includes('burocrata')) return true;
    if (user.role === 'admin') return true;
    return false;
  }
}

export const dailyChecklistService = DailyChecklistService.getInstance();
