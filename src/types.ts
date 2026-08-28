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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isGuest: boolean;
  isBanned: boolean;
  banReason?: string;
  role: 'admin' | 'editor' | 'leitor' | 'convidado';
  dataConsentimento?: string;
  ipConsentimento?: string;
  birthdate?: string;
  createdAt: string;
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

export type ViewMode =
  | 'hub'
  | 'article'
  | 'editor'
  | 'create-page'
  | 'create-article'
  | 'security'
  | 'donation'
  | 'privacy'
  | 'terms'
  | 'mydata'
  | 'beta'
  | 'offline';
