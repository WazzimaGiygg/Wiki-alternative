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
  group?: string;
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
  isOnline?: boolean;
  warningCount?: number;
  editsCount?: number;
  recentActivity?: UserActivityLogEntry[];
}

export interface UserActivityLogEntry {
  id: string;
  type: 'create' | 'edit' | 'revert' | 'admin';
  articleId?: string;
  articleTitle: string;
  pageUid?: string;
  date: string;
  summary: string;
  deltaBytes?: number;
  isMinor?: boolean;
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
  id?: string;
  userId: string;
  pageId: string;
  createdAt: string;
  // Propriedades legadas de retrocompatibilidade
  articleId?: string;
  articleTitle?: string;
  pageUid?: string;
  dataAdicionado?: string;
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
  autorUid?: string;
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
  | 'arbitration'
  | 'security'
  | 'donation'
  | 'privacy'
  | 'terms'
  | 'mydata'
  | 'site-updates'
  | 'beta'
  | 'offline'
  | 'upload'
  | 'file-page'
  | 'files-list';

// ==========================================
// SISTEMA DE CONSELHO DE ARBITRAGEM (ARBCOM)
// ==========================================

export type ArbitrationCaseTargetType = 'usuario' | 'moderador' | 'administrador';

export type ArbitrationCaseCategory =
  | 'abuso_admin'
  | 'abuso_moderador'
  | 'conflito_comunitario'
  | 'guerra_edicao_cronica'
  | 'assedio_conduta'
  | 'revisao_bloqueio_indevido'
  | 'quebra_de_sigilo_lgpd'
  | 'outro';

export type ArbitrationCaseStatus =
  | 'aberto'
  | 'em_instrucao'
  | 'deliberacao'
  | 'concluido'
  | 'rejeitado';

export type ArbitrationRulingRemedy =
  | 'absolvicao'
  | 'advertencia_formal'
  | 'bloqueio_temporario'
  | 'bloqueio_indefinido'
  | 'perda_direitos_moderador'
  | 'perda_direitos_admin'
  | 'ajustamento_conduta'
  | 'desconsiderado';

export interface ArbitrationDeliberation {
  id: string;
  arbitratorName: string;
  arbitratorUid: string;
  vote: 'acolher' | 'rejeitar' | 'sancionar' | 'absolver' | 'abster';
  statement: string; // Justificativa fundamentada do voto do árbitro
  recommendedRemedy?: ArbitrationRulingRemedy;
  timestamp: string;
}

export interface ArbitrationComment {
  id: string;
  author: string;
  authorRole: UserRole | string;
  authorUid?: string;
  content: string;
  timestamp: string;
  isTestimony?: boolean; // Depoimento ou testemunho formal
}

export interface ArbitrationRuling {
  remedyType: ArbitrationRulingRemedy;
  rulingSummary: string;
  sanctionDurationDays?: number;
  votesInFavor: number;
  votesAgainst: number;
  votesAbstain?: number;
  closedByArbitrator: string;
  closedAt: string;
  formalFindings: string[]; // Conclusões de fato e direito
}

export interface ArbitrationCase {
  id: string;
  caseNumber: string; // Ex: ARB-PT-2026-001
  langCode: string; // Ex: 'pt', 'en', 'es', 'fr', etc.
  title: string;
  targetType: ArbitrationCaseTargetType;
  targetUsername: string;
  targetUserDisplayName?: string;
  targetUserUid?: string;
  targetUserRole?: UserRole;
  requesterUsername: string;
  requesterDisplayName: string;
  requesterUid: string;
  requesterRole: UserRole;
  category: ArbitrationCaseCategory;
  summary: string;
  evidenceWikitext: string;
  requestedRemedy: string;
  defenseStatement?: string;
  status: ArbitrationCaseStatus;
  urgency: 'alta' | 'media' | 'baixa';
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  deliberations: ArbitrationDeliberation[];
  comments: ArbitrationComment[];
  finalRuling?: ArbitrationRuling;
  relatedArticleTitles?: string[];
}

export interface ArbitrationCommitteeMember {
  id: string;
  langCode: string;
  username: string;
  displayName: string;
  role: 'Presidente do Conselho' | 'Árbitro Titular' | 'Árbitro Suplente';
  mandateStart: string;
  mandateEnd: string;
  status: 'ativo' | 'licenca' | 'renunciou';
  casesJudged: number;
  bio?: string;
  avatarUrl?: string;
}

// ==========================================
// SISTEMA DE FICHEIROS, IMAGENS E MÍDIAS
// ==========================================

export type WikiFileLicense =
  | 'cc-by-sa-4.0'
  | 'cc-by-4.0'
  | 'cc0-public-domain'
  | 'gfdl'
  | 'fair-use'
  | 'own-work'
  | 'copyrighted-permission';

export interface WikiFileVersion {
  id: string;
  versionNumber: number;
  url: string;
  thumbnails: {
    sm: string;
    md: string;
    lg: string;
  };
  sizeBytes: number;
  width: number;
  height: number;
  uploadedBy: string;
  uploadedByUid?: string;
  uploadedAt: string;
  comment: string;
}

export interface WikiFile {
  id: string;
  name: string; // Ex: Bandeira_do_Brasil.png
  title: string; // Ex: Arquivo:Bandeira_do_Brasil.png
  description: string; // Descrição em wikitext
  license: WikiFileLicense;
  licenseDetails?: string;
  fairUseJustification?: string;
  author: string;
  source: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  url: string;
  thumbnails: {
    sm: string; // ~150px
    md: string; // ~320px
    lg: string; // ~800px
  };
  uploadedBy: string;
  uploadedByUid?: string;
  uploadedAt: string;
  updatedAt?: string;
  storageProvider: 'firebase_storage' | 'local_fallback';
  firebasePlan?: 'spark' | 'blaze';
  history: WikiFileVersion[];
  categories: string[];
}

export interface UploadFileInput {
  file: File;
  targetName: string;
  description: string;
  license: WikiFileLicense;
  licenseDetails?: string;
  fairUseJustification?: string;
  author: string;
  source: string;
  categories?: string[];
  comment?: string;
}

// ==========================================
// SISTEMA DE NAMESPACES, PÁGINAS E TEMPLATES
// ==========================================

export type PageNamespace =
  | 'main'
  | 'talk'
  | 'user'
  | 'user_talk'
  | 'project'
  | 'project_talk'
  | 'file'
  | 'file_talk'
  | 'mediawiki'
  | 'mediawiki_talk'
  | 'template'
  | 'template_talk'
  | 'help'
  | 'help_talk'
  | 'category'
  | 'category_talk'
  | 'portal'
  | 'draft'
  | 'special'
  | (string & {});

export interface Page {
  id: string;
  namespace: PageNamespace;
  title: string;
  content: string;
  categories: string[];
  templateName?: string;
  templateParams?: Record<string, string>;
  authorUid?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreatePageInput {
  namespace: PageNamespace;
  title: string;
  content: string;
  categories?: string[];
  templateName?: string;
  templateParams?: Record<string, string>;
  authorUid?: string;
  authorName?: string;
}

export interface UpdatePageInput {
  content?: string;
  categories?: string[];
  templateName?: string | null;
  templateParams?: Record<string, string>;
  authorUid?: string;
  authorName?: string;
}

export interface WikiTemplate {
  id: string;
  name: string;
  content: string; // Suporta marcação {{{param}}} e {{{param|default}}}
  description: string;
  authorUid?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  parameters?: string[];
  category?: string;
}

export interface CreateTemplateInput {
  name: string;
  content: string;
  description: string;
  authorUid?: string;
  authorName?: string;
  category?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  content?: string;
  description?: string;
  authorUid?: string;
  authorName?: string;
  category?: string;
}

// ==========================================
// SISTEMA DE PERMISSÕES E RBAC
// ==========================================
export * from './types/Permissions';
export * from './types/Watchlist';


export interface PageVersion {
  id?: string;
  pageId?: string;
  versionNumber: number;
  content: string;
  userName: string;
  userId: string;
  timestamp: string; // ISO string ou Firestore timestamp formatado
  comment: string;   // Resumo da edição / motivo da alteração
  previousVersion: number | null;
}

// Alias para compatibilidade direta com a nomenclatura Version
export type Version = PageVersion;

export interface SaveVersionInput {
  pageId: string;
  content: string;
  userId: string;
  userName: string;
  comment: string;
  previousVersion?: number | null;
}

