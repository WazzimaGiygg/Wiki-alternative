/**
 * @file PermissionService.ts
 * @description Serviço centralizado de controle de acesso baseado em grupos/funções (RBAC) para o WikiZero.
 * Define permissões estáticas por grupo e avalia dinamicamente ações sobre recursos do sistema.
 */

import { UserGroup, PermissionMap, PermissionAction } from '../types/Permissions';
import { UserProfile, Page } from '../types';

export interface BaseUserObject {
  uid?: string;
  role?: string;
  group?: string | UserGroup;
  isGuest?: boolean;
  isBanned?: boolean;
  email?: string | null;
}

export type EditPermissionReasonCode =
  | 'OK'
  | 'ANONYMOUS'
  | 'BANNED'
  | 'REVOKED'
  | 'LOCKED_ARTICLE'
  | 'LOCKED_PAGE'
  | 'RESTRICTED_NAMESPACE'
  | 'DAILY_LIMIT_EXCEEDED';

export interface EditPermissionStatus {
  allowed: boolean;
  reasonCode: EditPermissionReasonCode;
  message: string;
  requiresLogin?: boolean;
  canRequestUnblock?: boolean;
  canContactAdmin?: boolean;
}

export class PermissionService {
  /**
   * Configuração estática de permissões por ação do sistema
   */
  private static permissions: PermissionMap = {
    view: true, // Permitido para todos, inclusive anônimos
    view_history: true, // Permitido para todos
    edit: [UserGroup.REGISTERED, UserGroup.EDITOR, UserGroup.ADMIN],
    create_page: [UserGroup.REGISTERED, UserGroup.EDITOR, UserGroup.ADMIN],
    move: [UserGroup.EDITOR, UserGroup.ADMIN],
    rollback: [UserGroup.EDITOR, UserGroup.ADMIN],
    manage_templates: [UserGroup.EDITOR, UserGroup.ADMIN],
    delete: [UserGroup.ADMIN],
    protect: [UserGroup.ADMIN, UserGroup.EDITOR],
    manage_users: [UserGroup.ADMIN],
    audit_logs: [UserGroup.ADMIN],
  };

  /**
   * Verifica se o usuário possui cargo de moderador ou administrador
   */
  public static isModeratorOrAdmin(user: (UserProfile | BaseUserObject | null | undefined)): boolean {
    if (!user || user.isGuest || !user.uid) return false;
    const groupVal = (user.group || '').toString().toLowerCase();
    const roleVal = (user.role || '').toString().toLowerCase();
    const emailVal = (user.email || '').toString().toLowerCase();

    if (emailVal === 'pedrohenriquecardonaperes@gmail.com') return true;
    if (groupVal === UserGroup.ADMIN || groupVal === 'admin' || groupVal === 'administrador' || groupVal === 'superadmin') return true;
    if (groupVal === 'moderador' || groupVal === 'moderator') return true;
    if (roleVal === 'admin' || roleVal === 'administrador' || roleVal === 'superadmin') return true;
    if (roleVal === 'moderador' || roleVal === 'moderator') return true;

    return false;
  }

  /**
   * Obtém o grupo de acesso (UserGroup) associado ao usuário.
   * Se for nulo, anônimo ou convidado não autenticado, retorna UserGroup.ANONYMOUS.
   *
   * @param user Usuário autenticado ou perfil do WikiZero
   * @returns UserGroup
   */
  public static getUserGroup(user: (UserProfile | BaseUserObject | null | undefined)): UserGroup {
    if (!user || user.isGuest || !user.uid) {
      return UserGroup.ANONYMOUS;
    }

    // Se o usuário já tiver o campo explícito 'group'
    const groupVal = (user.group || '').toString().toLowerCase();
    if (groupVal === UserGroup.ADMIN || groupVal === 'admin' || groupVal === 'administrador') {
      return UserGroup.ADMIN;
    }
    if (groupVal === UserGroup.EDITOR || groupVal === 'editor' || groupVal === 'moderador' || groupVal === 'moderator') {
      return UserGroup.EDITOR;
    }
    if (groupVal === UserGroup.REGISTERED || groupVal === 'registered' || groupVal === 'registrado' || groupVal === 'leitor') {
      return UserGroup.REGISTERED;
    }

    // Avalia pelo campo 'role' legado
    const roleVal = (user.role || '').toString().toLowerCase();
    if (roleVal === 'admin' || roleVal === 'administrador' || user.email === 'pedrohenriquecardonaperes@gmail.com') {
      return UserGroup.ADMIN;
    }
    if (roleVal === 'moderador' || roleVal === 'moderator' || roleVal === 'editor') {
      return UserGroup.EDITOR;
    }
    if (roleVal === 'leitor' || roleVal === 'registered' || roleVal === 'registrado') {
      return UserGroup.REGISTERED;
    }

    // Usuário logado com conta registrada padrão
    return UserGroup.REGISTERED;
  }

  /**
   * Diagnóstico aprofundado e amigável da permissão de edição para um determinado recurso.
   */
  public static getEditPermissionStatus(
    user: (UserProfile | BaseUserObject | null | undefined),
    resource?: (Page | { isLocked?: boolean; lockReason?: string; protectionLevel?: string; namespace?: string } | null)
  ): EditPermissionStatus {
    // 1. Visitante / Não Autenticado
    if (!user || user.isGuest || !user.uid) {
      return {
        allowed: false,
        reasonCode: 'ANONYMOUS',
        message: 'Somente usuários autenticados podem editar ou criar páginas na WikiWorldWeb.',
        requiresLogin: true,
      };
    }

    // 2. Usuário Banido / Suspenso
    if (user.isBanned) {
      return {
        allowed: false,
        reasonCode: 'BANNED',
        message: 'Sua conta está suspensa pela moderação. Não é permitido realizar edições.',
        canRequestUnblock: true,
      };
    }

    // 3. Permissão 'canEdit' revogada na conta
    const perms = (user as UserProfile).permissions;
    if (perms && perms.canEdit === false) {
      return {
        allowed: false,
        reasonCode: 'REVOKED',
        message: 'Sua permissão de edição foi revogada administrativamente nesta wiki.',
        canContactAdmin: true,
      };
    }

    const isModOrAdmin = this.isModeratorOrAdmin(user);

    // 4. Validação por recurso específico
    if (resource) {
      // Namespaces restritos (MediaWiki / Special)
      const ns = resource.namespace?.toLowerCase();
      if ((ns === 'special' || ns === 'mediawiki') && this.getUserGroup(user) !== UserGroup.ADMIN) {
        return {
          allowed: false,
          reasonCode: 'RESTRICTED_NAMESPACE',
          message: 'Páginas especiais e mensagens do MediaWiki são restritas a administradores.',
        };
      }

      // Bloqueio / Proteção de Artigo ou Página
      if ((resource.isLocked || resource.protectionLevel === 'moderators_only') && !isModOrAdmin) {
        return {
          allowed: false,
          reasonCode: 'LOCKED_ARTICLE',
          message: resource.lockReason
            ? `Artigo Protegido pela Moderação: ${resource.lockReason}. Edição restrita a moderadores e administradores.`
            : 'Este artigo está protegido pela moderação e só pode ser editado por moderadores ou administradores.',
        };
      }
    }

    return {
      allowed: true,
      reasonCode: 'OK',
      message: 'Usuário autorizado a editar.',
    };
  }

  /**
   * Verifica se o usuário possui autorização para executar determinada ação.
   *
   * @param user Usuário (UserProfile, objeto de autenticação ou null)
   * @param action Ação a ser verificada (ex: 'view', 'edit', 'delete', 'move', 'create_page')
   * @param resource Recurso opcional (Page, artigo, etc.) para validação de contexto adicional
   * @returns boolean indicando se a ação é permitida
   */
  public static can(
    user: (UserProfile | BaseUserObject | null | undefined),
    action: PermissionAction | string,
    resource?: (Page | { isLocked?: boolean; lockReason?: string; protectionLevel?: string; namespace?: string } | null)
  ): boolean {
    const cleanAction = action.toLowerCase().trim();

    // Visualização é sempre pública
    if (cleanAction === 'view' || cleanAction === 'view_history') {
      return true;
    }

    // Diagnóstico completo para operações de escrita/edição
    if (cleanAction === 'edit' || cleanAction === 'create_page') {
      const status = this.getEditPermissionStatus(user, resource);
      return status.allowed;
    }

    // Regra universal: usuários banidos ou anônimos não podem realizar mutações
    if (!user || user.isGuest || !user.uid || user.isBanned) {
      return false;
    }

    const userGroup = this.getUserGroup(user);
    const rule = this.permissions[cleanAction];

    // Se não há regra configurada para a ação, por segurança apenas ADMIN tem permissão
    if (rule === undefined) {
      return userGroup === UserGroup.ADMIN;
    }

    // Regra global booleana
    if (typeof rule === 'boolean') {
      return rule;
    }

    // Verifica se o grupo do usuário está na lista de grupos permitidos
    const isGroupAllowed = rule.includes(userGroup);
    if (!isGroupAllowed) {
      return false;
    }

    // Validação contextual por recurso (se aplicável)
    if (resource) {
      // Páginas do namespace 'special' são do sistema e não podem ser editadas livremente
      if (resource.namespace === 'special' && (cleanAction === 'edit' || cleanAction === 'delete')) {
        return userGroup === UserGroup.ADMIN;
      }

      // Páginas do namespace 'mediawiki' (mensagens de sistema) só podem ser editadas por administradores
      if (resource.namespace === 'mediawiki' && cleanAction === 'edit') {
        return userGroup === UserGroup.ADMIN;
      }
    }

    return true;
  }

  /**
   * Retorna todas as permissões configuradas atualmente no sistema.
   */
  public static getAllPermissions(): PermissionMap {
    return { ...this.permissions };
  }

  /**
   * Verifica se o usuário é isento da cota diária de 5 edições.
   * Moderadores e Administradores possuem isenção e podem editar sem restrição diária.
   */
  public static isExemptFromDailyLimit(user: (UserProfile | BaseUserObject | null | undefined)): boolean {
    if (!user) return false;
    const roleVal = (user.role || '').toString().toLowerCase().trim();
    const groupVal = (user.group || '').toString().toLowerCase().trim();
    const emailVal = (user.email || '').toString().toLowerCase().trim();

    if (roleVal === 'admin' || roleVal === 'administrador') return true;
    if (roleVal === 'moderador' || roleVal === 'moderator') return true;
    if (groupVal === 'admin' || groupVal === 'administrador') return true;
    if (groupVal === 'moderador' || groupVal === 'moderator') return true;
    if (emailVal === 'pedrohenriquecardonaperes@gmail.com') return true;

    return false;
  }

  /**
   * Permite customizar ou estender o mapa de permissões em tempo de execução.
   */
  public static setPermission(action: string, groupsOrBool: boolean | UserGroup[]): void {
    this.permissions[action.toLowerCase().trim()] = groupsOrBool;
  }
}
