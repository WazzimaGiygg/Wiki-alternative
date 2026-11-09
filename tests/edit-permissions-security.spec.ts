import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionService } from '../src/services/PermissionService';
import { UserProfile, WikiArticle, Page } from '../src/types';
import { UserGroup } from '../src/types/Permissions';
import { StorageService } from '../src/services/storageService';

describe('Segurança de Edição de Usuários Logados e Não Logados (Anti-Edições Não Autorizadas)', () => {
  const anonymousUser = null;
  const guestUser: Partial<UserProfile> = {
    uid: 'guest_123',
    displayName: 'Visitante Convidado',
    isGuest: true,
    isBanned: false,
    role: 'convidado',
  };

  const bannedUser: Partial<UserProfile> = {
    uid: 'banned_456',
    email: 'banned@wikizero.org',
    displayName: 'Usuário Infrator',
    isGuest: false,
    isBanned: true,
    banReason: 'Vandalismo reincidente',
    role: 'leitor',
  };

  const revokedEditUser: Partial<UserProfile> = {
    uid: 'revoked_789',
    email: 'revoked@wikizero.org',
    displayName: 'Editor com Permissão Revogada',
    isGuest: false,
    isBanned: false,
    role: 'editor',
    permissions: {
      canEdit: false,
      canCreate: false,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: false,
    },
  };

  const regularUser: Partial<UserProfile> = {
    uid: 'reg_111',
    email: 'colaborador@wikizero.org',
    displayName: 'Colaborador Ativo',
    isGuest: false,
    isBanned: false,
    role: 'editor',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: false,
    },
  };

  const moderatorUser: Partial<UserProfile> = {
    uid: 'mod_222',
    email: 'moderador@wikizero.org',
    displayName: 'Moderador Comunitário',
    isGuest: false,
    isBanned: false,
    role: 'moderador',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: false,
      canGrantBarnstars: false,
    },
  };

  const adminUser: Partial<UserProfile> = {
    uid: 'adm_333',
    email: 'admin@wikizero.org',
    displayName: 'Administrador do Sistema',
    isGuest: false,
    isBanned: false,
    role: 'admin',
    permissions: {
      canEdit: true,
      canCreate: true,
      canTalk: true,
      canDelete: true,
      canGrantBarnstars: true,
    },
  };

  const regularArticle: WikiArticle = {
    id: 'art-normal-1',
    pageUid: 'geral',
    titulo: 'Artigo Normal Aberto',
    descricao: 'Conteúdo enciclopédico de domínio público.',
    autor: 'Autor Inicial',
    dataCriacao: new Date().toISOString(),
    dataEdicao: new Date().toISOString(),
    visualizacoes: 10,
    versao: 1,
    isLocked: false,
  };

  const lockedArticle: WikiArticle = {
    id: 'art-locked-1',
    pageUid: 'geral',
    titulo: 'Página Principal Protegida',
    descricao: 'Conteúdo altamente sensível protegido pela moderação.',
    autor: 'Moderação',
    dataCriacao: new Date().toISOString(),
    dataEdicao: new Date().toISOString(),
    visualizacoes: 500,
    versao: 5,
    isLocked: true,
    lockedBy: 'Moderação',
    lockReason: 'Prevenção de edições não autorizadas',
    protectionLevel: 'moderators_only',
  };

  describe('1. Diagnóstico de Permissão (PermissionService.getEditPermissionStatus)', () => {
    it('deve bloquear usuários não logados (anônimos / nulos) com reasonCode ANONYMOUS', () => {
      const status = PermissionService.getEditPermissionStatus(anonymousUser as any, regularArticle);
      expect(status.allowed).toBe(false);
      expect(status.reasonCode).toBe('ANONYMOUS');
      expect(status.requiresLogin).toBe(true);
    });

    it('deve bloquear usuários convidados (isGuest: true) com reasonCode ANONYMOUS', () => {
      const status = PermissionService.getEditPermissionStatus(guestUser as any, regularArticle);
      expect(status.allowed).toBe(false);
      expect(status.reasonCode).toBe('ANONYMOUS');
      expect(status.requiresLogin).toBe(true);
    });

    it('deve bloquear usuários banidos com reasonCode BANNED', () => {
      const status = PermissionService.getEditPermissionStatus(bannedUser as any, regularArticle);
      expect(status.allowed).toBe(false);
      expect(status.reasonCode).toBe('BANNED');
      expect(status.canRequestUnblock).toBe(true);
    });

    it('deve bloquear usuários logados cuja permissão canEdit foi revogada com reasonCode REVOKED', () => {
      const status = PermissionService.getEditPermissionStatus(revokedEditUser as any, regularArticle);
      expect(status.allowed).toBe(false);
      expect(status.reasonCode).toBe('REVOKED');
      expect(status.canContactAdmin).toBe(true);
    });

    it('deve bloquear edição de artigo protegido para usuários comuns (não moderadores)', () => {
      const status = PermissionService.getEditPermissionStatus(regularUser as any, lockedArticle);
      expect(status.allowed).toBe(false);
      expect(status.reasonCode).toBe('LOCKED_ARTICLE');
      expect(status.message).toContain('Artigo Protegido pela Moderação');
    });

    it('deve autorizar edição de artigo protegido para moderadores', () => {
      const status = PermissionService.getEditPermissionStatus(moderatorUser as any, lockedArticle);
      expect(status.allowed).toBe(true);
      expect(status.reasonCode).toBe('OK');
    });

    it('deve autorizar edição de artigo protegido para administradores', () => {
      const status = PermissionService.getEditPermissionStatus(adminUser as any, lockedArticle);
      expect(status.allowed).toBe(true);
      expect(status.reasonCode).toBe('OK');
    });

    it('deve bloquear páginas do namespace special para não administradores', () => {
      const specialPage: Partial<Page> = {
        id: 'special:RecentChanges',
        namespace: 'special',
        title: 'RecentChanges',
      };
      const status = PermissionService.getEditPermissionStatus(regularUser as any, specialPage as any);
      expect(status.allowed).toBe(false);
      expect(status.reasonCode).toBe('RESTRICTED_NAMESPACE');
    });

    it('deve permitir edição normal para colaboradores ativos em artigos comuns', () => {
      const status = PermissionService.getEditPermissionStatus(regularUser as any, regularArticle);
      expect(status.allowed).toBe(true);
      expect(status.reasonCode).toBe('OK');
    });
  });

  describe('2. Verificação can() de Baixo Nível (PermissionService.can)', () => {
    it('deve permitir visualização pública para todos (inclusive anônimos e banidos)', () => {
      expect(PermissionService.can(null, 'view')).toBe(true);
      expect(PermissionService.can(guestUser as any, 'view')).toBe(true);
      expect(PermissionService.can(bannedUser as any, 'view')).toBe(true);
      expect(PermissionService.can(regularUser as any, 'view')).toBe(true);
    });

    it('deve negar edit para anônimos, banidos e usuários com permissão revogada', () => {
      expect(PermissionService.can(null, 'edit')).toBe(false);
      expect(PermissionService.can(guestUser as any, 'edit')).toBe(false);
      expect(PermissionService.can(bannedUser as any, 'edit')).toBe(false);
      expect(PermissionService.can(revokedEditUser as any, 'edit')).toBe(false);
    });

    it('deve permitir edit para usuário comum apenas em recurso aberto', () => {
      expect(PermissionService.can(regularUser as any, 'edit', regularArticle)).toBe(true);
      expect(PermissionService.can(regularUser as any, 'edit', lockedArticle)).toBe(false);
    });
  });

  describe('3. Validação em Camada de Armazenamento (StorageService.saveArticle)', () => {
    beforeEach(() => {
      // Mock básico de localStorage se necessário
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });

    it('deve lançar erro ao tentar salvar artigo como anônimo ou convidado', async () => {
      await expect(
        StorageService.saveArticle(
          { id: 'art-1', titulo: 'Teste', pageUid: 'geral', descricao: 'Texto' },
          null
        )
      ).rejects.toThrow('Somente usuários logados podem contribuir com edições');

      await expect(
        StorageService.saveArticle(
          { id: 'art-1', titulo: 'Teste', pageUid: 'geral', descricao: 'Texto' },
          guestUser as UserProfile
        )
      ).rejects.toThrow('Somente usuários logados podem contribuir com edições');
    });

    it('deve lançar erro ao tentar salvar artigo com conta suspensa/banida', async () => {
      await expect(
        StorageService.saveArticle(
          { id: 'art-1', titulo: 'Teste', pageUid: 'geral', descricao: 'Texto' },
          bannedUser as UserProfile
        )
      ).rejects.toThrow('Sua conta está suspensa');
    });

    it('deve lançar erro ao tentar salvar artigo com permissões de edição revogadas', async () => {
      await expect(
        StorageService.saveArticle(
          { id: 'art-1', titulo: 'Teste', pageUid: 'geral', descricao: 'Texto' },
          revokedEditUser as UserProfile
        )
      ).rejects.toThrow('Você não possui autorização para editar artigos nesta wiki');
    });
  });
});
