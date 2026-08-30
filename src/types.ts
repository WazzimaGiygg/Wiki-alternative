export interface WikiArticle {
  id: string;
  pageUid: string;
  titulo: string;
  descricao: string; // Wikitext / Markdown content
  resumo?: string;
  categoria?: string;
  idioma?: string;
  autor?: string;
  autorEmail?: string;
  autorUid?: string;
  dataCriacao: string;
  dataEdicao?: string;
  visualizacoes?: number;
  versao?: number;
  tags?: string[];
  historico?: ArticleHistoryItem[];
}

export interface ArticleHistoryItem {
  id: string;
  data: string;
  autor: string;
  autorEmail?: string;
  resumo: string;
  tamanho: number;
  deltaBytes?: number;
  versao?: number;
  isMinor?: boolean;
  conteudo?: string;
}

export interface WikiPage {
  uid: string;
  titulo: string;
  descricao: string;
  categoria: string;
  autor?: string;
  criadoEm: string;
  atualizadoEm?: string;
  articleCount?: number;
  icon?: string;
  tags?: string[];
  status?: 'ativo' | 'rascunho' | 'arquivado';
}

export type UserRole = 'admin' | 'moderador' | 'editor' | 'leitor' | 'convidado';

export interface UserPermissions {
  canEdit: boolean;
  canCreate: boolean;
  canTalk: boolean;
  canDelete: boolean;
  canGrantBarnstars: boolean;
}

export interface UserBarnstar {
  id: string;
  title: string;
  description: string;
  icon: string;
  awardedBy: string;
  awardedByUid?: string;
  awardedAt: string;
}

export interface UserboxItem {
  id: string;
  title: string;
  text: string;
  icon: string;
  bgClass?: string;
  borderClass?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  isGuest: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: string;
  banType?: 'permanente' | 'temporario' | 'advertencia';
  role: UserRole;
  bio?: string; // Wikitext supported!
  location?: string;
  website?: string;
  permissions?: UserPermissions;
  barnstars?: UserBarnstar[];
  userboxes?: UserboxItem[];
  reputationScore?: number;
  dataConsentimento?: string;
  ipConsentimento?: string;
  birthdate?: string;
  createdAt: string;
  lastActive?: string;
  warningCount?: number;
}

export interface UserTalkMessage {
  id: string;
  targetUserUid: string;
  targetUsername: string;
  senderUid?: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: UserRole;
  titulo: string;
  conteudo: string;
  tipo: 'geral' | 'aviso_admin' | 'barnstar' | 'duvida' | 'boas_vindas';
  data: string;
  status: 'aberto' | 'em_discussao' | 'resolvido' | 'arquivado';
  respostas: TalkReply[];
}

export interface UserAuditLog {
  id: string;
  targetUserUid: string;
  targetUsername: string;
  action:
    | 'role_change'
    | 'ban_user'
    | 'unban_user'
    | 'warning_issued'
    | 'permission_change'
    | 'profile_reset'
    | 'barnstar_awarded'
    | 'name_change'
    | 'lgpd_name_change'
    | 'checkuser_query'
    | 'sockpuppet_flagged'
    | 'sockpuppet_unflagged'
    | 'unblock_request_evaluated'
    | 'unblock_request_submitted'
    | 'promotion_created'
    | 'promotion_voted'
    | 'promotion_concluded';
  performedBy: string;
  performedByRole: string;
  details: string;
  date: string;
}

export interface CheckUserLogEntry {
  id: string;
  target: string;
  targetType: 'username' | 'ip' | 'cidr';
  reason: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  resultsFound: number;
}

export interface SockpuppetCase {
  id: string;
  caseNumber: string;
  title: string;
  masterAccount: string;
  masterAccountUid?: string;
  suspectedAccounts: string[];
  status: 'aberto' | 'em_analise' | 'confirmado' | 'arquivado_inocente';
  evidenceSummary: string;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  conclusions?: string;
  similarityScore: number;
  technicalMatches: {
    ipMatch: boolean;
    userAgentMatch: boolean;
    temporalMatch: boolean;
    stylisticMatch: boolean;
  };
  sharedIps?: string[];
  sharedArticles?: string[];
}

export interface CheckUserAccountDetails {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  banReason?: string;
  isSockpuppet?: boolean;
  sockpuppetOf?: string;
  createdAt: string;
  lastActive: string;
  reputationScore?: number;
  ipAddresses: {
    ip: string;
    isp: string;
    location: string;
    lastSeen: string;
    usageCount: number;
  }[];
  userAgents: {
    browser: string;
    os: string;
    device: string;
    raw: string;
    lastSeen: string;
  }[];
  editedArticles: {
    articleId: string;
    articleTitle: string;
    timestamp: string;
    summary: string;
  }[];
  coincidingEditsWithTarget?: {
    articleTitle: string;
    targetEditTime: string;
    suspectEditTime: string;
    diffMinutes: number;
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  type: 'info' | 'success' | 'warning' | 'edit';
}

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: string;
  version: string;
}

export interface TalkReply {
  id: string;
  autor: string;
  autorEmail?: string;
  autorRole?: string;
  conteudo: string;
  data: string;
  upvotes?: number;
}

export interface TalkThread {
  id: string;
  articleId: string;
  titulo: string;
  autor: string;
  autorEmail?: string;
  autorRole?: string;
  data: string;
  conteudo: string;
  status: 'aberto' | 'em_discussao' | 'resolvido' | 'consenso';
  respostas: TalkReply[];
}

export interface ArticleRatingData {
  articleId: string;
  averageScore: number;
  totalVotes: number;
  userScore?: number;
  feedbacks?: { autor: string; comentario: string; nota: number; data: string }[];
}

export interface WatchlistItem {
  articleId: string;
  articleTitle: string;
  pageUid: string;
  dataAdicionado: string;
}

export interface RecentChangeEntry {
  id: string;
  type: 'new_article' | 'edit_article' | 'new_collection' | 'minor_edit';
  articleId?: string;
  articleTitle: string;
  pageUid: string;
  pageTitle?: string;
  autor: string;
  autorEmail?: string;
  autorRole?: string;
  data: string;
  resumo: string;
  tamanho: number;
  deltaBytes: number;
  versao?: number;
  idioma?: string;
  isMinor?: boolean;
  isBot?: boolean;
}

export interface SystemUpdateEntry {
  id: string;
  version: string;
  title: string;
  date: string;
  category: 'feature' | 'improvement' | 'security' | 'mobile' | 'backend' | 'design' | 'compliance' | 'fix';
  author: string;
  authorRole?: string;
  summary: string;
  highlights: string[];
  badge?: string;
  commitHash?: string;
  affectedComponents?: string[];
  isLatest?: boolean;
}

export type DeviceMode = 'auto' | 'mobile' | 'desktop';

export type UnblockRequestStatus = 'pendente' | 'em_analise' | 'aprovado' | 'recusado' | 'arquivado';

export type UnblockCategory =
  | 'guerra_edicao'
  | 'vandalismo_acidental'
  | 'bloqueio_ip_compartilhado'
  | 'fantoche_falso_positivo'
  | 'revisao_lgpd_marco_civil'
  | 'comportamento_inadequado'
  | 'outro';

export interface UnblockAppealComment {
  id: string;
  author: string;
  authorRole: UserRole | string;
  authorUid?: string;
  text: string;
  timestamp: string;
  isInternalModeratorNote?: boolean;
}

export interface UnblockRequest {
  id: string;
  userUid: string;
  username: string;
  displayName: string;
  email?: string;
  userRoleAtBan: UserRole;
  blockReason: string;
  blockedBy: string;
  blockedAt: string;
  requestedAt: string;
  category: UnblockCategory;
  appealJustification: string;
  commitmentToGuidelines: string;
  ipAddress?: string;
  status: UnblockRequestStatus;
  urgency: 'alta' | 'media' | 'baixa';
  reviewedBy?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  resolutionDecision?: 'unblock_full' | 'unblock_probationary' | 'rejected' | 'requested_more_info';
  resolutionNotes?: string;
  comments: UnblockAppealComment[];
  linkedSockpuppetCaseId?: string;
  checkUserSummary?: {
    riskScore: number;
    matchedAccountsCount: number;
    sameIpAsAccounts: string[];
  };
}

export type PromotionTargetRole = 'moderador' | 'admin';

export type PromotionVoteType = 'a_favor' | 'contra' | 'neutro';

export type PromotionRequestStatus = 'em_votacao' | 'aprovada' | 'rejeitada' | 'cancelada';

export interface PromotionVote {
  id: string;
  voterUid: string;
  voterUsername: string;
  voterDisplayName: string;
  voterRole: UserRole;
  vote: PromotionVoteType;
  reason: string; // Motivo obrigatório da posição a favor ou contra
  timestamp: string;
}

export interface PromotionRequest {
  id: string;
  candidateUid: string;
  candidateUsername: string;
  candidateDisplayName: string;
  candidateEmail?: string;
  currentRole: UserRole;
  targetRole: PromotionTargetRole;
  nominatedBy: string;
  nominatedByUid?: string;
  isSelfNomination: boolean;
  statement: string; // Motivação e justificativa do candidato
  contributionsSummary: string; // Resumo de contribuições e atividades na WikiZero
  requestedAt: string;
  closedAt?: string;
  closedBy?: string;
  closedByRole?: string;
  status: PromotionRequestStatus;
  maxVotes: number; // Limite máximo de 10 votos
  votes: PromotionVote[];
  resolutionNotes?: string;
  requiredApprovalRate: number; // % mínima necessária (ex: 60% para mod, 75% para admin)
}

export type AdminTicketCategory =
  | 'vandalismo'
  | 'protecao_pagina'
  | 'conflito_editorial'
  | 'duvida_politicas'
  | 'erro_tecnico'
  | 'lgpd_privacidade'
  | 'outros';

export type AdminTicketPriority = 'baixa' | 'normal' | 'alta' | 'urgente';

export type AdminTicketStatus = 'aberto' | 'em_analise' | 'respondido' | 'resolvido' | 'arquivado';

export interface AdminTicketMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: UserRole;
  isStaff: boolean;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface AdminContactTicket {
  id: string;
  subject: string;
  category: AdminTicketCategory;
  priority: AdminTicketPriority;
  status: AdminTicketStatus;
  userUid: string;
  userUsername: string;
  userDisplayName: string;
  userEmail?: string;
  userRole: UserRole;
  isGuestSubmission?: boolean;
  relatedArticleTitle?: string;
  relatedArticleId?: string;
  description: string;
  evidenceLinks?: string[];
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  assignedAdmin?: string;
  assignedAdminUid?: string;
  resolutionSummary?: string;
  messages: AdminTicketMessage[];
}

export type ViewMode =
  | 'hub'
  | 'article'
  | 'editor'
  | 'create-page'
  | 'create-article'
  | 'recent-changes'
  | 'special-pages'
  | 'watchlist'
  | 'user-page'
  | 'admin-users'
  | 'admin-firebase'
  | 'checkuser'
  | 'unblock-requests'
  | 'promotion-requests'
  | 'contact-admin'
  | 'security'
  | 'donation'
  | 'privacy'
  | 'terms'
  | 'mydata'
  | 'site-updates'
  | 'beta'
  | 'offline';
