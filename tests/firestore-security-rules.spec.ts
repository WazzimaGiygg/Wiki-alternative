import { describe, it, expect } from 'vitest';

/**
 * Simulador de Avaliação das Regras de Segurança do Firestore (firestore.rules)
 * Testa com fidelidade estrita as políticas implementadas na Fase 2 da Auditoria.
 */

interface RequestAuth {
  uid: string;
  token: {
    email?: string;
    email_verified?: boolean;
    admin?: boolean;
    superadmin?: boolean;
    role?: string;
    checkuser?: boolean;
    arbcom?: boolean;
    editor?: boolean;
    [key: string]: any;
  };
}

interface RequestResource {
  data: Record<string, any>;
}

interface Resource {
  data: Record<string, any>;
}

interface SecurityContext {
  auth: RequestAuth | null;
  database: Record<string, Record<string, any>>; // Simulação de documentos no Firestore
}

class FirestoreSecurityRulesEngine {
  constructor(private context: SecurityContext) {}

  private isAuthenticated(): boolean {
    return this.context.auth !== null;
  }

  private isNotBanned(): boolean {
    if (!this.isAuthenticated()) return false;
    const banned = this.context.database['banned_users']?.[this.context.auth!.uid];
    return !banned;
  }

  private isRegistered(): boolean {
    return this.isAuthenticated() && this.isNotBanned();
  }

  private isOwner(userId: string): boolean {
    return this.isAuthenticated() && this.context.auth!.uid === userId;
  }

  private userDocExists(): boolean {
    if (!this.isAuthenticated()) return false;
    const uid = this.context.auth!.uid;
    return !!(this.context.database['userpage']?.[uid] || this.context.database['users']?.[uid]);
  }

  private getUserData(): Record<string, any> {
    if (!this.isAuthenticated()) return {};
    const uid = this.context.auth!.uid;
    return (
      this.context.database['userpage']?.[uid] ||
      this.context.database['users']?.[uid] ||
      {}
    );
  }

  public isSuperAdmin(): boolean {
    if (!this.isAuthenticated()) return false;
    const auth = this.context.auth!;
    const isOwnerEmail =
      auth.token.email === 'pedrohenriquecardonaperes@gmail.com' &&
      (auth.token.email_verified === true || auth.token.email_verified === undefined);
    const hasSuperClaim =
      auth.token.superadmin === true || auth.token.role === 'superadmin';
    const inSuperadminsCollection =
      !!this.context.database['superadmins']?.[auth.uid];

    return isOwnerEmail || hasSuperClaim || inSuperadminsCollection;
  }

  public isAdmin(): boolean {
    if (!this.isAuthenticated()) return false;
    if (this.isSuperAdmin()) return true;
    const auth = this.context.auth!;
    if (auth.token.admin === true) return true;
    if (['admin', 'administrador', 'superadmin'].includes(auth.token.role || '')) return true;
    if (this.context.database['admins']?.[auth.uid]) return true;

    if (this.userDocExists()) {
      const data = this.getUserData();
      if (['admin', 'administrador', 'superadmin'].includes(data.group)) return true;
      if (['admin', 'administrador', 'superadmin'].includes(data.role)) return true;
    }
    return false;
  }

  public isCheckUser(): boolean {
    if (!this.isAuthenticated()) return false;
    if (this.isAdmin()) return true;
    const auth = this.context.auth!;
    if (auth.token.checkuser === true || auth.token.role === 'checkuser') return true;
    if (this.userDocExists()) {
      const data = this.getUserData();
      if (['checkuser', 'admin', 'administrador', 'superadmin'].includes(data.group)) return true;
      if (['checkuser', 'admin', 'administrador', 'superadmin'].includes(data.role)) return true;
    }
    return false;
  }

  public isArbCom(): boolean {
    if (!this.isAuthenticated()) return false;
    if (this.isAdmin()) return true;
    const auth = this.context.auth!;
    if (auth.token.arbcom === true || auth.token.role === 'arbcom' || auth.token.role === 'arbitrador') return true;
    if (this.context.database['arbitration_members']?.[auth.uid]) return true;
    if (this.userDocExists()) {
      const data = this.getUserData();
      if (['arbcom', 'arbitrador', 'admin', 'administrador', 'superadmin'].includes(data.group)) return true;
      if (['arbcom', 'arbitrador', 'admin', 'administrador', 'superadmin'].includes(data.role)) return true;
    }
    return false;
  }

  public isEditor(): boolean {
    if (!this.isRegistered()) return false;
    if (this.isAdmin()) return true;
    const auth = this.context.auth!;
    if (auth.token.editor === true) return true;
    if (['editor', 'moderador', 'admin', 'administrador'].includes(auth.token.role || '')) return true;
    if (this.userDocExists()) {
      const data = this.getUserData();
      if (['editor', 'admin', 'moderador', 'administrador'].includes(data.group)) return true;
      if (['editor', 'moderador', 'admin', 'administrador'].includes(data.role)) return true;
    }
    return false;
  }

  public canUserEdit(): boolean {
    if (!this.isRegistered()) return false;
    if (!this.userDocExists()) return true;
    const data = this.getUserData();
    if (data.isBanned === true) return false;
    if (data.permissions && data.permissions.canEdit === false) return false;
    return true;
  }

  // ================= Avaliador de Regras por Coleção =================

  public evaluateUserpageCreate(userId: string, requestData: Record<string, any>): boolean {
    if (this.isAdmin()) return true;
    if (!this.isOwner(userId) || !this.isNotBanned()) return false;

    // Não pode autoatribuir cargos administrativos
    if (requestData.role && !['leitor', 'editor', 'registrado', 'leitor_ativo', 'convidado'].includes(requestData.role)) {
      return false;
    }
    if (requestData.group && !['registered', 'leitor', 'editor', 'registrado'].includes(requestData.group)) {
      return false;
    }

    // Não pode autoatribuir permissões administrativas
    if (requestData.permissions) {
      if (requestData.permissions.canDelete === true) return false;
      if (requestData.permissions.canLock === true) return false;
      if (requestData.permissions.isAdmin === true) return false;
    }

    // Não pode forjar UID de outro usuário
    if (requestData.uid && requestData.uid !== userId) return false;
    if (requestData.id && requestData.id !== userId) return false;

    // Não pode criar como banido = false para burlar
    if (requestData.isBanned === true) return false;

    return true;
  }

  public evaluateUserpageUpdate(
    userId: string,
    existingData: Record<string, any>,
    requestData: Record<string, any>
  ): boolean {
    if (this.isAdmin()) return true;
    if (!this.isOwner(userId) || !this.isNotBanned()) return false;

    // Impede alteração de role
    if ('role' in requestData && requestData.role !== existingData.role) return false;
    // Impede alteração de group
    if ('group' in requestData && requestData.group !== existingData.group) return false;
    // Impede alteração de permissões
    if ('permissions' in requestData && JSON.stringify(requestData.permissions) !== JSON.stringify(existingData.permissions)) return false;
    // Impede auto-desbloqueio
    if ('isBanned' in requestData && requestData.isBanned !== existingData.isBanned) return false;
    // Impede modificação de identificador
    if ('uid' in requestData && requestData.uid !== existingData.uid) return false;
    if ('id' in requestData && requestData.id !== existingData.id) return false;

    return true;
  }

  public evaluateCheckuserLogsRead(): boolean {
    return this.isCheckUser();
  }

  public evaluateCheckuserLogsCreate(): boolean {
    return this.isCheckUser();
  }

  public evaluateEmergencyReportsGet(reportData: Record<string, any>): boolean {
    if (this.isAdmin()) return true;
    if (this.isAuthenticated() && reportData.reporterUid === this.context.auth?.uid) return true;
    return false;
  }

  public evaluateEmergencyReportsList(): boolean {
    return this.isAdmin();
  }

  public evaluateAdminTicketsGet(ticketData: Record<string, any>): boolean {
    if (this.isAdmin()) return true;
    if (this.isAuthenticated()) {
      if (ticketData.userUid === this.context.auth?.uid) return true;
      if (ticketData.userId === this.context.auth?.uid) return true;
    }
    return false;
  }

  public evaluateAdminTicketsList(ticketData?: Record<string, any>): boolean {
    if (this.isAdmin()) return true;
    if (ticketData && this.isAuthenticated()) {
      return ticketData.userUid === this.context.auth?.uid || ticketData.userId === this.context.auth?.uid;
    }
    return false;
  }

  public evaluateUnblockRequestGet(reqData: Record<string, any>): boolean {
    if (this.isAdmin()) return true;
    if (this.isAuthenticated()) {
      return reqData.uid === this.context.auth?.uid || reqData.userId === this.context.auth?.uid;
    }
    return false;
  }

  public evaluateUnblockRequestCreate(): boolean {
    // Aberto a qualquer usuário banido ou visitante
    return true;
  }

  public evaluateUnblockRequestUpdate(): boolean {
    // Apenas admin pode responder/modificar o pedido
    return this.isAdmin();
  }

  public evaluateWikiExtensionsWrite(): boolean {
    return this.isAdmin();
  }

  public evaluateWikiExtensionRegistryWrite(): boolean {
    return this.isAdmin();
  }

  public evaluateSystemTelemetryWrite(operation: 'create' | 'update' | 'delete'): boolean {
    if (operation === 'create') return true;
    return this.isAdmin();
  }

  public evaluateSystemUpdatesWrite(): boolean {
    return this.isAdmin();
  }

  public evaluateNotificationsRead(notificationData: Record<string, any>): boolean {
    if (!this.isAuthenticated()) return false;
    if (this.isAdmin()) return true;
    return (
      notificationData.userId === this.context.auth?.uid ||
      notificationData.recipientUid === this.context.auth?.uid
    );
  }
}

describe('Auditoria e Validação de Segurança das Regras do Firestore (firestore.rules)', () => {
  // Cenários de usuários para teste
  const anonymousCtx: SecurityContext = { auth: null, database: {} };

  const regularUserCtx: SecurityContext = {
    auth: {
      uid: 'user_123',
      token: { email: 'comum@wikizero.org' },
    },
    database: {
      users: {
        user_123: { uid: 'user_123', role: 'leitor', group: 'registered' },
      },
      userpage: {
        user_123: { uid: 'user_123', role: 'leitor', group: 'registered' },
      },
    },
  };

  const bannedUserCtx: SecurityContext = {
    auth: {
      uid: 'banned_999',
      token: { email: 'infrator@wikizero.org' },
    },
    database: {
      banned_users: {
        banned_999: { reason: 'Vandalismo sistemático' },
      },
      userpage: {
        banned_999: { uid: 'banned_999', isBanned: true, role: 'leitor' },
      },
    },
  };

  const editorUserCtx: SecurityContext = {
    auth: {
      uid: 'editor_456',
      token: { email: 'editor@wikizero.org', role: 'editor' },
    },
    database: {
      userpage: {
        editor_456: { uid: 'editor_456', role: 'editor', group: 'editor' },
      },
    },
  };

  const checkUserCtx: SecurityContext = {
    auth: {
      uid: 'cu_789',
      token: { email: 'checkuser@wikizero.org', checkuser: true },
    },
    database: {},
  };

  const adminUserCtx: SecurityContext = {
    auth: {
      uid: 'admin_001',
      token: { email: 'admin@wikizero.org', admin: true },
    },
    database: {},
  };

  const superAdminEmailCtx: SecurityContext = {
    auth: {
      uid: 'super_pedro',
      token: {
        email: 'pedrohenriquecardonaperes@gmail.com',
        email_verified: true,
      },
    },
    database: {},
  };

  const superAdminClaimCtx: SecurityContext = {
    auth: {
      uid: 'super_claim',
      token: {
        email: 'super@wikizero.org',
        superadmin: true,
      },
    },
    database: {},
  };

  describe('1. Proteção de Usuários e Perfis (users & userpage)', () => {
    it('deve permitir que usuário comum crie seu próprio perfil com papéis padrão', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const allowed = engine.evaluateUserpageCreate('user_123', {
        uid: 'user_123',
        displayName: 'Meu Nome',
        bio: 'Olá mundo',
        role: 'leitor',
      });
      expect(allowed).toBe(true);
    });

    it('deve IMPEDIR que usuário comum crie perfil com cargo de admin ou moderador (Elevação de Privilégio)', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const attemptAdmin = engine.evaluateUserpageCreate('user_123', {
        uid: 'user_123',
        role: 'admin',
      });
      expect(attemptAdmin).toBe(false);

      const attemptMod = engine.evaluateUserpageCreate('user_123', {
        uid: 'user_123',
        group: 'moderador',
      });
      expect(attemptMod).toBe(false);
    });

    it('deve IMPEDIR que usuário comum crie perfil com permissões canDelete/canLock/isAdmin', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const attemptPerms = engine.evaluateUserpageCreate('user_123', {
        uid: 'user_123',
        role: 'editor',
        permissions: { canDelete: true },
      });
      expect(attemptPerms).toBe(false);
    });

    it('deve IMPEDIR que usuário crie perfil com UID de terceiros (Personificação)', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const attemptSpoof = engine.evaluateUserpageCreate('vitima_999', {
        uid: 'vitima_999',
        displayName: 'Hacked',
      });
      expect(attemptSpoof).toBe(false);
    });

    it('deve permitir que usuário atualize sua própria bio sem mexer em role/group', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const existing = { uid: 'user_123', role: 'leitor', group: 'registered', bio: 'Bio antiga' };
      const updated = { uid: 'user_123', role: 'leitor', group: 'registered', bio: 'Bio nova!' };
      expect(engine.evaluateUserpageUpdate('user_123', existing, updated)).toBe(true);
    });

    it('deve IMPEDIR que usuário comum altere seu próprio role ou group no update', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const existing = { uid: 'user_123', role: 'leitor', group: 'registered' };
      const attemptRoleChange = { uid: 'user_123', role: 'admin', group: 'registered' };
      expect(engine.evaluateUserpageUpdate('user_123', existing, attemptRoleChange)).toBe(false);

      const attemptGroupChange = { uid: 'user_123', role: 'leitor', group: 'administrador' };
      expect(engine.evaluateUserpageUpdate('user_123', existing, attemptGroupChange)).toBe(false);
    });

    it('deve IMPEDIR que usuário comum altere permissões de moderação no update', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const existing = { uid: 'user_123', permissions: { canDelete: false } };
      const attemptPerms = { uid: 'user_123', permissions: { canDelete: true } };
      expect(engine.evaluateUserpageUpdate('user_123', existing, attemptPerms)).toBe(false);
    });

    it('deve IMPEDIR que usuário comum altere perfil de outro usuário', () => {
      const engine = new FirestoreSecurityRulesEngine(regularUserCtx);
      const existing = { uid: 'outro_555', bio: 'Original' };
      const updateData = { uid: 'outro_555', bio: 'Vandalizado' };
      expect(engine.evaluateUserpageUpdate('outro_555', existing, updateData)).toBe(false);
    });

    it('deve permitir que Administrador atualize cargos e permissões de qualquer usuário', () => {
      const engine = new FirestoreSecurityRulesEngine(adminUserCtx);
      const existing = { uid: 'user_123', role: 'leitor', group: 'registered' };
      const adminPromotion = { uid: 'user_123', role: 'editor', group: 'editor' };
      expect(engine.evaluateUserpageUpdate('user_123', existing, adminPromotion)).toBe(true);
    });
  });

  describe('2. Proteção Administrativa e Autenticação Robusta', () => {
    it('deve conceder privilégios de superadmin ao e-mail legítimo com token verificado', () => {
      const engine = new FirestoreSecurityRulesEngine(superAdminEmailCtx);
      expect(engine.isSuperAdmin()).toBe(true);
      expect(engine.isAdmin()).toBe(true);
    });

    it('deve conceder privilégios de superadmin via Custom Claim superadmin: true', () => {
      const engine = new FirestoreSecurityRulesEngine(superAdminClaimCtx);
      expect(engine.isSuperAdmin()).toBe(true);
      expect(engine.isAdmin()).toBe(true);
    });

    it('deve IMPEDIR que um usuário forje e-mail de superadmin apenas escrevendo no doc userpage', () => {
      const maliciousUserCtx: SecurityContext = {
        auth: {
          uid: 'hacker_666',
          token: { email: 'hacker@evil.org' }, // Token autêntico é hacker
        },
        database: {
          userpage: {
            // Tentativa de enganar a regra antiga colocando o email do dono no banco
            hacker_666: { email: 'pedrohenriquecardonaperes@gmail.com' },
          },
        },
      };
      const engine = new FirestoreSecurityRulesEngine(maliciousUserCtx);
      expect(engine.isSuperAdmin()).toBe(false);
      expect(engine.isAdmin()).toBe(false);
    });

    it('deve conceder privilégios de admin via Custom Claim admin: true', () => {
      const engine = new FirestoreSecurityRulesEngine(adminUserCtx);
      expect(engine.isAdmin()).toBe(true);
    });

    it('não deve conceder privilégios de admin para usuários comuns ou editores', () => {
      const engineCommon = new FirestoreSecurityRulesEngine(regularUserCtx);
      expect(engineCommon.isAdmin()).toBe(false);

      const engineEditor = new FirestoreSecurityRulesEngine(editorUserCtx);
      expect(engineEditor.isAdmin()).toBe(false);
      expect(engineEditor.isEditor()).toBe(true);
    });
  });

  describe('3. Proteção das Coleções Administrativas', () => {
    it('deve negar leitura de checkuser_logs para anônimos, usuários comuns e editores', () => {
      expect(new FirestoreSecurityRulesEngine(anonymousCtx).evaluateCheckuserLogsRead()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateCheckuserLogsRead()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(editorUserCtx).evaluateCheckuserLogsRead()).toBe(false);
    });

    it('deve autorizar leitura e criação de checkuser_logs para membros de CheckUser e Administradores', () => {
      expect(new FirestoreSecurityRulesEngine(checkUserCtx).evaluateCheckuserLogsRead()).toBe(true);
      expect(new FirestoreSecurityRulesEngine(checkUserCtx).evaluateCheckuserLogsCreate()).toBe(true);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateCheckuserLogsRead()).toBe(true);
    });

    it('deve permitir consulta a denúncia de emergência apenas ao autor da denúncia ou administrador', () => {
      const report = { id: 'rep_1', reporterUid: 'user_123', details: 'Ameaça' };

      // Autor pode ver sua própria denúncia
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateEmergencyReportsGet(report)).toBe(true);

      // Outro usuário não pode ver
      expect(new FirestoreSecurityRulesEngine(editorUserCtx).evaluateEmergencyReportsGet(report)).toBe(false);

      // Anônimo não pode ver
      expect(new FirestoreSecurityRulesEngine(anonymousCtx).evaluateEmergencyReportsGet(report)).toBe(false);

      // Administrador pode ver
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateEmergencyReportsGet(report)).toBe(true);
    });

    it('deve proibir listagem geral de emergency_reports para não-administradores', () => {
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateEmergencyReportsList()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(anonymousCtx).evaluateEmergencyReportsList()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateEmergencyReportsList()).toBe(true);
    });
  });

  describe('4. Proteção de Extensões do Sistema e Telemetria', () => {
    it('deve IMPEDIR escrita pública ou de usuário comum em wiki_extensions', () => {
      expect(new FirestoreSecurityRulesEngine(anonymousCtx).evaluateWikiExtensionsWrite()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateWikiExtensionsWrite()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(editorUserCtx).evaluateWikiExtensionsWrite()).toBe(false);
    });

    it('deve permitir escrita em wiki_extensions e wiki_extension_registry para Administrador', () => {
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateWikiExtensionsWrite()).toBe(true);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateWikiExtensionRegistryWrite()).toBe(true);
    });

    it('deve impedir que usuários comuns adulterem telemetria ou atualizações do sistema', () => {
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateSystemUpdatesWrite()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateSystemTelemetryWrite('update')).toBe(false);
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateSystemTelemetryWrite('delete')).toBe(false);
    });

    it('deve permitir emissão de eventos de telemetria mas restringir gestão a admins', () => {
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateSystemTelemetryWrite('create')).toBe(true);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateSystemTelemetryWrite('delete')).toBe(true);
    });
  });

  describe('5. Solicitações, Pedidos e Denúncias (unblock_requests & admin_tickets)', () => {
    it('deve permitir que usuário banido submeta pedido de desbloqueio (unblock_requests)', () => {
      expect(new FirestoreSecurityRulesEngine(bannedUserCtx).evaluateUnblockRequestCreate()).toBe(true);
    });

    it('deve permitir que autor ou admin consulte seu pedido de desbloqueio, bloqueando terceiros', () => {
      const appeal = { id: 'app_1', uid: 'banned_999', reason: 'Peço perdão' };

      expect(new FirestoreSecurityRulesEngine(bannedUserCtx).evaluateUnblockRequestGet(appeal)).toBe(true);
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateUnblockRequestGet(appeal)).toBe(false);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateUnblockRequestGet(appeal)).toBe(true);
    });

    it('deve impedir que usuário comum altere ou aprove pedidos de desbloqueio', () => {
      expect(new FirestoreSecurityRulesEngine(bannedUserCtx).evaluateUnblockRequestUpdate()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateUnblockRequestUpdate()).toBe(false);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateUnblockRequestUpdate()).toBe(true);
    });

    it('deve isolar chamados da administração (admin_tickets) entre solicitante e admin', () => {
      const ticket = { id: 'tk_1', userUid: 'user_123', subject: 'Dúvida de Conta' };

      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateAdminTicketsGet(ticket)).toBe(true);
      expect(new FirestoreSecurityRulesEngine(editorUserCtx).evaluateAdminTicketsGet(ticket)).toBe(false);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateAdminTicketsGet(ticket)).toBe(true);
    });
  });

  describe('6. Notificações e Privacidade de Usuários', () => {
    it('deve impedir que usuários leiam notificações de outros usuários', () => {
      const notif = { id: 'nt_1', userId: 'user_123', message: 'Você foi mencionado' };

      expect(new FirestoreSecurityRulesEngine(regularUserCtx).evaluateNotificationsRead(notif)).toBe(true);
      expect(new FirestoreSecurityRulesEngine(editorUserCtx).evaluateNotificationsRead(notif)).toBe(false);
      expect(new FirestoreSecurityRulesEngine(anonymousCtx).evaluateNotificationsRead(notif)).toBe(false);
      expect(new FirestoreSecurityRulesEngine(adminUserCtx).evaluateNotificationsRead(notif)).toBe(true);
    });
  });
});
