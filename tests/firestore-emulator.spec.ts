import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'wzzm-ce3fc';

describe('Firebase Emulator Suite: Testes de Autorização e Escrita Não Autorizada', () => {
  let testEnv: RulesTestEnvironment | null = null;
  let emulatorAvailable = false;

  beforeAll(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8088/');
      emulatorAvailable = res.ok || res.status === 200 || res.status === 404;
    } catch {
      emulatorAvailable = false;
    }

    if (emulatorAvailable) {
      testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          host: '127.0.0.1',
          port: 8088,
        },
      });
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async (testContext) => {
    if (!emulatorAvailable || !testEnv) {
      testContext.skip();
      return;
    }
    await testEnv.clearFirestore();

    // Semeia documentos iniciais com regras desabilitadas para testes de atualização
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // Perfil existente de vítima (outro usuário)
      await db.collection('users').doc('usr_vitima').set({
        uid: 'usr_vitima',
        displayName: 'Usuário Vítima',
        role: 'leitor',
        group: 'registered',
        bio: 'Bio original',
      });
      await db.collection('userpage').doc('usr_vitima').set({
        uid: 'usr_vitima',
        displayName: 'Usuário Vítima',
        role: 'leitor',
        group: 'registered',
        bio: 'Bio original',
      });

      // Perfil existente do usuário normal
      await db.collection('users').doc('usr_normal').set({
        uid: 'usr_normal',
        displayName: 'Usuário Normal',
        role: 'leitor',
        group: 'registered',
        bio: 'Minha bio',
      });
      await db.collection('userpage').doc('usr_normal').set({
        uid: 'usr_normal',
        displayName: 'Usuário Normal',
        role: 'leitor',
        group: 'registered',
        bio: 'Minha bio',
      });

      // Dados privados para testes de leitura/escrita
      await db.collection('checkuser_logs').doc('log_privado_1').set({
        targetUid: 'infrator_99',
        reason: 'Investigação confidencial de IP',
        loggedBy: 'admin_master',
      });

      await db.collection('emergency_reports').doc('chamado_privado_1').set({
        reporterUid: 'usr_vitima',
        details: 'Ameaça e assédio grave',
      });

      await db.collection('notifications').doc('notif_vitima_1').set({
        userId: 'usr_vitima',
        message: 'Você recebeu um aviso confidencial',
      });
    });
  });

  // =========================================================================
  // 1. SIMULAÇÃO DE PAPÉIS: VISITANTE / ANÔNIMO
  // =========================================================================
  describe('Papel: Visitante Não Autenticado', () => {
    it('deve bloquear escrita de perfil em users e userpage', async () => {
      const anonDb = testEnv.unauthenticatedContext().firestore();
      
      await assertFails(
        anonDb.collection('users').doc('anon_1').set({
          uid: 'anon_1',
          displayName: 'Hacker Anônimo',
        })
      );

      await assertFails(
        anonDb.collection('userpage').doc('anon_1').set({
          uid: 'anon_1',
          displayName: 'Hacker Anônimo',
        })
      );
    });

    it('deve bloquear acesso a logs privados de checkuser', async () => {
      const anonDb = testEnv.unauthenticatedContext().firestore();
      
      await assertFails(
        anonDb.collection('checkuser_logs').doc('log_privado_1').get()
      );

      await assertFails(
        anonDb.collection('checkuser_logs').doc('novo_log').set({
          targetUid: 'alvo',
          data: 'Invasão',
        })
      );
    });

    it('deve bloquear escrita em extensões do sistema', async () => {
      const anonDb = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        anonDb.collection('wiki_extensions').doc('ext_maliciosa').set({
          name: 'Exploit Extension',
          enabled: true,
        })
      );
    });
  });

  // =========================================================================
  // 2. SIMULAÇÃO DE PAPÉIS: USUÁRIO COMUM (LEITOR/REGISTRADO)
  // =========================================================================
  describe('Papel: Usuário Comum Autenticado', () => {
    it('deve permitir que o usuário atualize sua própria bio sem alterar cargos', async () => {
      const userDb = testEnv
        .authenticatedContext('usr_normal', { email: 'normal@wikizero.org' })
        .firestore();

      await assertSucceeds(
        userDb.collection('userpage').doc('usr_normal').update({
          bio: 'Nova bio atualizada com sucesso!',
        })
      );
    });

    it('deve BLOQUEAR tentativa de alterar perfil de terceiros (users & userpage)', async () => {
      const userDb = testEnv
        .authenticatedContext('usr_normal', { email: 'normal@wikizero.org' })
        .firestore();

      // Tentativa de vandalizar a página de outro usuário
      await assertFails(
        userDb.collection('userpage').doc('usr_vitima').update({
          bio: 'Conta vandalizada por usr_normal',
        })
      );

      // Tentativa de alterar o documento de users de outro usuário
      await assertFails(
        userDb.collection('users').doc('usr_vitima').update({
          displayName: 'Vítima Hackeada',
        })
      );
    });

    it('deve BLOQUEAR auto-promoção de cargo (role: admin, group: administrador)', async () => {
      const userDb = testEnv
        .authenticatedContext('usr_normal', { email: 'normal@wikizero.org' })
        .firestore();

      // Tentativa de elevar seu próprio role para admin no update
      await assertFails(
        userDb.collection('userpage').doc('usr_normal').update({
          role: 'admin',
        })
      );

      // Tentativa de elevar seu group para administrador no update
      await assertFails(
        userDb.collection('userpage').doc('usr_normal').update({
          group: 'administrador',
        })
      );
    });

    it('deve BLOQUEAR criação de perfil com cargos administrativos ou UID adulterado', async () => {
      const newUserDb = testEnv
        .authenticatedContext('usr_novo', { email: 'novo@wikizero.org' })
        .firestore();

      // Tentativa de criar conta já com cargo de admin
      await assertFails(
        newUserDb.collection('userpage').doc('usr_novo').set({
          uid: 'usr_novo',
          role: 'admin',
          group: 'administrador',
        })
      );

      // Tentativa de criar perfil forjando UID de outro usuário
      await assertFails(
        newUserDb.collection('userpage').doc('usr_novo').set({
          uid: 'usr_vitima',
          displayName: 'Impostor',
        })
      );

      // Criação legítima com dados padrão deve ser permitida
      await assertSucceeds(
        newUserDb.collection('userpage').doc('usr_novo').set({
          uid: 'usr_novo',
          displayName: 'Novo Usuário Legítimo',
          role: 'leitor',
          group: 'registered',
        })
      );
    });

    it('deve BLOQUEAR leitura e escrita em coleções privadas (checkuser, emergency, notificações de terceiros)', async () => {
      const userDb = testEnv
        .authenticatedContext('usr_normal', { email: 'normal@wikizero.org' })
        .firestore();

      // CheckUser logs privados
      await assertFails(
        userDb.collection('checkuser_logs').doc('log_privado_1').get()
      );
      await assertFails(
        userDb.collection('checkuser_accounts').doc('acc_1').get()
      );

      // Chamados confidenciais de terceiros
      await assertFails(
        userDb.collection('emergency_reports').doc('chamado_privado_1').get()
      );

      // Notificações de terceiros
      await assertFails(
        userDb.collection('notifications').doc('notif_vitima_1').get()
      );

      // Modificação de extensões
      await assertFails(
        userDb.collection('wiki_extensions').doc('ext_1').set({
          name: 'Custom Theme',
          enabled: true,
        })
      );
    });
  });

  // =========================================================================
  // 3. SIMULAÇÃO DE PAPÉIS: EDITOR
  // =========================================================================
  describe('Papel: Editor', () => {
    it('deve permitir criação e edição de templates da enciclopédia', async () => {
      const editorDb = testEnv
        .authenticatedContext('usr_editor', {
          email: 'editor@wikizero.org',
          role: 'editor',
          editor: true,
        })
        .firestore();

      await assertSucceeds(
        editorDb.collection('templates').doc('tpl_infobox').set({
          name: 'InfoCaixa',
          content: '{{Infobox | titulo = {{{1}}} }}',
        })
      );
    });

    it('deve BLOQUEAR editor de modificar extensões ou coleções de investigação', async () => {
      const editorDb = testEnv
        .authenticatedContext('usr_editor', {
          email: 'editor@wikizero.org',
          role: 'editor',
          editor: true,
        })
        .firestore();

      await assertFails(
        editorDb.collection('wiki_extensions').doc('ext_online').update({
          enabled: false,
        })
      );

      await assertFails(
        editorDb.collection('checkuser_logs').doc('log_privado_1').get()
      );
    });
  });

  // =========================================================================
  // 4. SIMULAÇÃO DE PAPÉIS: ADMINISTRADOR E SUPERADMINISTRADOR
  // =========================================================================
  describe('Papel: Administrador e Superadministrador', () => {
    it('deve permitir que Administrador gerencie extensões do sistema', async () => {
      const adminDb = testEnv
        .authenticatedContext('usr_admin', {
          email: 'admin@wikizero.org',
          admin: true,
          role: 'admin',
        })
        .firestore();

      await assertSucceeds(
        adminDb.collection('wiki_extensions').doc('ext_online_status').set({
          name: 'OnlineStatusExtension',
          version: '4.1.1',
          category: 'system',
          enabled: true,
        })
      );

      await assertSucceeds(
        adminDb.collection('wiki_extension_registry').doc('global_status').set({
          activeCount: 12,
          lastUpdated: new Date().toISOString(),
        })
      );
    });

    it('deve permitir que Administrador consulte coleções privadas e investigações', async () => {
      const adminDb = testEnv
        .authenticatedContext('usr_admin', {
          email: 'admin@wikizero.org',
          admin: true,
          role: 'admin',
        })
        .firestore();

      await assertSucceeds(
        adminDb.collection('checkuser_logs').doc('log_privado_1').get()
      );

      await assertSucceeds(
        adminDb.collection('emergency_reports').doc('chamado_privado_1').get()
      );
    });

    it('deve permitir que Administrador atualize cargos e permissões de qualquer usuário', async () => {
      const adminDb = testEnv
        .authenticatedContext('usr_admin', {
          email: 'admin@wikizero.org',
          admin: true,
          role: 'admin',
        })
        .firestore();

      // Promoção legítima realizada por administrador
      await assertSucceeds(
        adminDb.collection('users').doc('usr_normal').update({
          role: 'editor',
          group: 'editor',
        })
      );
    });

    it('deve reconhecer Superadministrador por e-mail verificado', async () => {
      const superDb = testEnv
        .authenticatedContext('usr_super', {
          email: 'pedrohenriquecardonaperes@gmail.com',
          email_verified: true,
        })
        .firestore();

      await assertSucceeds(
        superDb.collection('system_updates').doc('v4_1_security').set({
          version: '4.1.1',
          title: 'Auditoria de Segurança Concluída',
        })
      );

      await assertSucceeds(
        superDb.collection('checkuser_logs').doc('log_privado_1').get()
      );
    });
  });

  // =========================================================================
  // 5. TESTES DE PROPRIEDADE: TALK_THREADS, RECENT_CHANGES, LIBRARY_ITEMS, NOTEBOOKS
  // =========================================================================
  describe('Proteção de Propriedade de Documentos Comunitários', () => {
    it('deve impedir que usuário comum delete ou adultere discussão de terceiros em talk_threads', async () => {
      const autorDb = testEnv
        .authenticatedContext('usr_normal', { email: 'autor@wikizero.org' })
        .firestore();

      const impostorDb = testEnv
        .authenticatedContext('usr_impostor', { email: 'impostor@wikizero.org' })
        .firestore();

      // Autor cria tópico de discussão
      await assertSucceeds(
        autorDb.collection('talk_threads').doc('thread_1').set({
          articleId: 'art_1',
          titulo: 'Discussão sobre fontes',
          autor: 'Usuario Normal',
          autorUid: 'usr_normal',
          userId: 'usr_normal',
          conteudo: 'Proposta inicial',
          status: 'aberto',
          respostas: [],
        })
      );

      // Terceiro tenta deletar o tópico: DEVE FALHAR
      await assertFails(
        impostorDb.collection('talk_threads').doc('thread_1').delete()
      );

      // Terceiro tenta alterar o título ou conteúdo: DEVE FALHAR
      await assertFails(
        impostorDb.collection('talk_threads').doc('thread_1').update({
          titulo: 'Título Hackeado',
        })
      );

      // Terceiro adiciona resposta legítima na discussão: DEVE SUCEDER
      await assertSucceeds(
        impostorDb.collection('talk_threads').doc('thread_1').update({
          respostas: [
            {
              id: 'rep_1',
              autor: 'Impostor',
              autorUid: 'usr_impostor',
              conteudo: 'Concordo com a proposta.',
            },
          ],
        })
      );
    });

    it('deve impedir que usuário comum altere ou delete registros em recent_changes', async () => {
      const userDb = testEnv
        .authenticatedContext('usr_normal', { email: 'user@wikizero.org' })
        .firestore();

      // Usuário cria registro de auditoria transparente
      await assertSucceeds(
        userDb.collection('recent_changes').doc('rc_audit_1').set({
          articleTitle: 'Novo Artigo',
          autor: 'Usuario Normal',
          autorUid: 'usr_normal',
          tipo: 'create',
          data: new Date().toISOString(),
        })
      );

      // Usuário comum tenta deletar ou alterar o log de auditoria: DEVE FALHAR
      await assertFails(
        userDb.collection('recent_changes').doc('rc_audit_1').delete()
      );

      await assertFails(
        userDb.collection('recent_changes').doc('rc_audit_1').update({
          autor: 'Outro Autor Falso',
        })
      );
    });

    it('deve restringir alteração e exclusão de library_items ao catalogador ou administrador', async () => {
      const catalogadorDb = testEnv
        .authenticatedContext('usr_normal', { email: 'catalog@wikizero.org' })
        .firestore();

      const terceiroDb = testEnv
        .authenticatedContext('usr_terceiro', { email: 'terceiro@wikizero.org' })
        .firestore();

      // Cria item do acervo
      await assertSucceeds(
        catalogadorDb.collection('library_items').doc('livro_1').set({
          titulo: 'Enciclopédia Geral',
          tipo: 'livro',
          cadastradoPorUid: 'usr_normal',
          userId: 'usr_normal',
        })
      );

      // Terceiro tenta deletar ou editar o item: DEVE FALHAR
      await assertFails(
        terceiroDb.collection('library_items').doc('livro_1').delete()
      );

      await assertFails(
        terceiroDb.collection('library_items').doc('livro_1').update({
          titulo: 'Livro Vandalizado',
        })
      );

      // Catalogador edita seu próprio item: DEVE SUCEDER
      await assertSucceeds(
        catalogadorDb.collection('library_items').doc('livro_1').update({
          titulo: 'Enciclopédia Geral - 2ª Edição',
        })
      );
    });

    it('deve isolar gemini_notebooks estritamente ao proprietário', async () => {
      const donoDb = testEnv
        .authenticatedContext('usr_normal', { email: 'dono@wikizero.org' })
        .firestore();

      const invasorDb = testEnv
        .authenticatedContext('usr_invasor', { email: 'invasor@wikizero.org' })
        .firestore();

      // Dono cria caderno pessoal
      await assertSucceeds(
        donoDb.collection('gemini_notebooks').doc('caderno_1').set({
          userId: 'usr_normal',
          title: 'Anotações Confidenciais de Pesquisa',
        })
      );

      // Invasor tenta ler caderno de terceiro: DEVE FALHAR
      await assertFails(
        invasorDb.collection('gemini_notebooks').doc('caderno_1').get()
      );

      // Invasor tenta atualizar caderno de terceiro: DEVE FALHAR
      await assertFails(
        invasorDb.collection('gemini_notebooks').doc('caderno_1').update({
          title: 'Caderno Comprometido',
        })
      );
    });
  });
});
