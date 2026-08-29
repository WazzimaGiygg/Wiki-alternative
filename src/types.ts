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
    | 'lgpd_name_change';
  performedBy: string;
  performedByRole: string;
  details: string;
  date: string;
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
  | 'security'
  | 'donation'
  | 'privacy'
  | 'terms'
  | 'mydata'
  | 'site-updates'
  | 'beta'
  | 'offline';
