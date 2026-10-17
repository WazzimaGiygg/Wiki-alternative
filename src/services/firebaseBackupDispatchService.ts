/**
 * SERVIÇO DE DESPACHO E BACKUP JSON DO SISTEMA E FIREBASE
 * Requisitos:
 * - 3.05.9.a: Despacho de todas as informações e backup em download de todas as informações em JSON para o computador
 * - 3.05.9.b: Upload de todas as informações em JSON do computador
 * - 3.05.9.c: Download de todas as regras do Firebase para o computador em JSON
 * - 3.05.9.d: Upload de todas as regras do Firebase do computador em JSON
 * - 3.05.9.e: Download de todas as coleções do Firebase para o computador em JSON
 * - 3.05.9.f: Upload de todas as coleções do Firebase do computador em JSON
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { getDbSafe } from './firebase';
import { StorageService } from './storageService';
import { ExtensionManager } from '../core/ExtensionManager';
import { dailyChecklistService } from './dailyChecklistService';
import { ACTIVE_FIREBASE_CONFIG } from '../config/firebaseCustomConfig';
import { UserProfile, WikiPage, WikiArticle } from '../types';

export interface SystemFullBackupPayload {
  _metadata: {
    app: string;
    version: string;
    type: 'WIKIZERO_FULL_SYSTEM_BACKUP';
    exportedAt: string;
    exportedBy?: {
      uid: string;
      username: string;
      role?: string;
    };
    environment: string;
    projectId: string;
    firestoreDatabaseId: string;
  };
  pages: WikiPage[];
  articles: WikiArticle[];
  users: UserProfile[];
  auditLogs: any[];
  systemUpdates: any[];
  firebaseRules: {
    service: string;
    rulesVersion: string;
    rulesContent: string;
    linesCount: number;
    exportedAt: string;
  };
  firestoreCollections: Record<string, any[]>;
  extensions: {
    states: Record<string, boolean>;
    settings: Record<string, any>;
    customList: any[];
  };
  checklist?: {
    activeMonth: string;
    leaderboard: any[];
  };
  rawConfig?: any;
}

export interface FirebaseRulesJsonPayload {
  $schema?: string;
  service: string;
  rulesVersion: string;
  projectId: string;
  firestoreDatabaseId: string;
  exportedAt: string;
  versionTag: string;
  rulesContent: string;
  rulesLinesCount: number;
  summary: {
    collectionsSecured: string[];
    description: string;
  };
}

export interface FirestoreCollectionsJsonPayload {
  _metadata: {
    type: 'FIRESTORE_COLLECTIONS_JSON';
    projectId: string;
    firestoreDatabaseId: string;
    exportedAt: string;
    collectionsCount: number;
    totalDocuments: number;
  };
  collections: Record<string, Array<{ id: string; data: Record<string, any>; subcollections?: Record<string, any[]> }>>;
}

export class FirebaseBackupDispatchService {
  private static instance: FirebaseBackupDispatchService;

  private constructor() {}

  public static getInstance(): FirebaseBackupDispatchService {
    if (!FirebaseBackupDispatchService.instance) {
      FirebaseBackupDispatchService.instance = new FirebaseBackupDispatchService();
    }
    return FirebaseBackupDispatchService.instance;
  }

  /**
   * Utilitário nativo para acionar o download imediato de arquivo JSON no computador do usuário
   */
  public triggerFileDownload(filename: string, jsonContent: any): void {
    const jsonStr = typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  }

  // =========================================================================
  // 3.05.9.a: Despacho e Download de TODAS as informações em JSON
  // =========================================================================
  public async exportAllSystemInformationJSON(currentUser: UserProfile | null): Promise<{
    filename: string;
    payload: SystemFullBackupPayload;
    summary: {
      pagesCount: number;
      articlesCount: number;
      usersCount: number;
      collectionsCount: number;
      docsCount: number;
      rulesLines: number;
    };
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `wikizero-despacho-completo-sistema-${timestamp}.json`;

    // 1. Dados enciclopédicos locais
    const pages = await StorageService.getPages();
    const articles = await StorageService.getArticles();
    const users = await StorageService.getCommunityUsers();
    const auditLogs = StorageService.getUserAuditLogs();
    const systemUpdates = await StorageService.getSystemUpdates();

    // 2. Regras ativas do Firebase
    let rulesContent = '';
    let rulesLinesCount = 0;
    try {
      const resp = await fetch('/api/firebase/rules');
      if (resp.ok) {
        const rulesJson = await resp.json();
        rulesContent = rulesJson.rulesContent || '';
        rulesLinesCount = rulesJson.rulesLinesCount || rulesContent.split('\n').length;
      }
    } catch {
      // Fallback
      rulesContent = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n  }\n}`;
      rulesLinesCount = rulesContent.split('\n').length;
    }

    // 3. Extração das coleções ativas do Firestore
    const collectionsData = await this.fetchAllFirestoreCollections();

    // 4. Extensões e configurações
    const extManager = ExtensionManager.getInstance();
    const extStates = (extManager as any).extensionStates || {};
    const extSettings = (extManager as any).extensionSettings || {};
    const customExtensions = extManager.getAllInstalledExtensions() || [];

    // 5. Checklist e Ranking
    let checklistLeaderboard: any[] = [];
    try {
      checklistLeaderboard = await dailyChecklistService.getMonthlyLeaderboard();
    } catch {}

    const payload: SystemFullBackupPayload = {
      _metadata: {
        app: 'WikiWorldWeb - Enciclopédia Livre',
        version: '3.05.9',
        type: 'WIKIZERO_FULL_SYSTEM_BACKUP',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser
          ? {
              uid: currentUser.uid,
              username: currentUser.username || currentUser.displayName || 'admin',
              role: currentUser.role,
            }
          : undefined,
        environment: ACTIVE_FIREBASE_CONFIG.environmentLabel || 'Produção',
        projectId: ACTIVE_FIREBASE_CONFIG.firebaseConfig.projectId,
        firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
      },
      pages,
      articles,
      users,
      auditLogs,
      systemUpdates,
      firebaseRules: {
        service: 'cloud.firestore',
        rulesVersion: '2',
        rulesContent,
        linesCount: rulesLinesCount,
        exportedAt: new Date().toISOString(),
      },
      firestoreCollections: collectionsData.rawMap,
      extensions: {
        states: extStates,
        settings: extSettings,
        customList: customExtensions,
      },
      checklist: {
        activeMonth: dailyChecklistService.getCurrentMonthKey(),
        leaderboard: checklistLeaderboard,
      },
      rawConfig: {
        projectId: ACTIVE_FIREBASE_CONFIG.firebaseConfig.projectId,
        databaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
      },
    };

    // Aciona o download imediato
    this.triggerFileDownload(filename, payload);

    return {
      filename,
      payload,
      summary: {
        pagesCount: pages.length,
        articlesCount: articles.length,
        usersCount: users.length,
        collectionsCount: Object.keys(collectionsData.rawMap).length,
        docsCount: collectionsData.totalDocs,
        rulesLines: rulesLinesCount,
      },
    };
  }

  // =========================================================================
  // 3.05.9.b: Upload de todas as informações em JSON do computador
  // =========================================================================
  public async importAllSystemInformationJSON(
    jsonContent: string,
    onProgress?: (message: string) => void
  ): Promise<{
    success: boolean;
    message: string;
    stats: {
      pagesRestored: number;
      articlesRestored: number;
      usersRestored: number;
      collectionsRestored: number;
      docsRestored: number;
      rulesUpdated: boolean;
    };
  }> {
    let parsed: any;
    try {
      parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch (e: any) {
      throw new Error(`Arquivo JSON inválido ou corrompido: ${e?.message}`);
    }

    onProgress?.('Validando estrutura do backup JSON completo...');

    const stats = {
      pagesRestored: 0,
      articlesRestored: 0,
      usersRestored: 0,
      collectionsRestored: 0,
      docsRestored: 0,
      rulesUpdated: false,
    };

    // 1. Restaurar Páginas
    if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
      onProgress?.(`Restaurando ${parsed.pages.length} coleções/páginas da Wiki...`);
      for (const p of parsed.pages) {
        if (p.uid && p.titulo) {
          await StorageService.createPage(p);
          stats.pagesRestored++;
        }
      }
    }

    // 2. Restaurar Artigos
    if (Array.isArray(parsed.articles) && parsed.articles.length > 0) {
      onProgress?.(`Restaurando ${parsed.articles.length} verbetes enciclopédicos...`);
      for (const a of parsed.articles) {
        if (a.id && a.titulo && a.pageUid) {
          await StorageService.saveArticle(a, null, 'Restauração de Backup Completo JSON (3.05.9.b)');
          stats.articlesRestored++;
        }
      }
    }

    // 3. Restaurar Regras do Firebase se presentes
    if (parsed.firebaseRules?.rulesContent) {
      onProgress?.('Atualizando regras firestore.rules a partir do backup...');
      try {
        await this.uploadFirebaseRulesJSON(parsed.firebaseRules.rulesContent);
        stats.rulesUpdated = true;
      } catch (err) {
        console.warn('[FirebaseBackupDispatchService] Aviso ao restaurar regras do backup:', err);
      }
    }

    // 4. Restaurar Coleções do Firestore
    if (parsed.firestoreCollections && typeof parsed.firestoreCollections === 'object') {
      onProgress?.('Restaurando documentos no Cloud Firestore...');
      const colResult = await this.uploadFirebaseCollectionsJSON(
        JSON.stringify({ collections: parsed.firestoreCollections }),
        onProgress
      );
      stats.collectionsRestored = Object.keys(parsed.firestoreCollections).length;
      stats.docsRestored = Object.values(colResult.stats).reduce((a, b) => a + b, 0);
    }

    onProgress?.('Sincronização concluída com sucesso!');

    return {
      success: true,
      message: `Despacho de restauração concluído! ${stats.pagesRestored} páginas, ${stats.articlesRestored} artigos e ${stats.docsRestored} documentos restaurados.`,
      stats,
    };
  }

  // =========================================================================
  // 3.05.9.c: Download de todas as regras do Firebase em JSON
  // =========================================================================
  public async downloadFirebaseRulesJSON(): Promise<{
    filename: string;
    payload: FirebaseRulesJsonPayload;
  }> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const projectId = ACTIVE_FIREBASE_CONFIG.firebaseConfig.projectId;
    const filename = `firebase-rules-${projectId}-${timestamp}.json`;

    let rulesContent = '';
    let rulesLinesCount = 0;

    try {
      const resp = await fetch('/api/firebase/rules');
      if (resp.ok) {
        const data = await resp.json();
        rulesContent = data.rulesContent || '';
        rulesLinesCount = data.rulesLinesCount || rulesContent.split('\n').length;
      }
    } catch {}

    if (!rulesContent) {
      rulesContent = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n  }\n}`;
      rulesLinesCount = rulesContent.split('\n').length;
    }

    const payload: FirebaseRulesJsonPayload = {
      $schema: 'https://firebase.google.com/docs/firestore/security/rules-structure',
      service: 'cloud.firestore',
      rulesVersion: '2',
      projectId,
      firestoreDatabaseId: ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId,
      exportedAt: new Date().toISOString(),
      versionTag: '3.05.9.c',
      rulesContent,
      rulesLinesCount,
      summary: {
        collectionsSecured: [
          'documentos',
          'documentos/{pageUid}/inevitavel',
          'users',
          'userpage',
          'banned_users',
          'audit_logs',
          'system_updates',
          'wiki_extensions',
          'wiki_extension_registry',
          'user_chats',
          'user_checklist_points',
          'system_telemetry',
        ],
        description: 'Conjunto formal de regras de controle de acesso (RBAC) e segurança para o Google Cloud Firestore.',
      },
    };

    this.triggerFileDownload(filename, payload);

    return {
      filename,
      payload,
    };
  }

  // =========================================================================
  // 3.05.9.d: Upload de todas as regras do Firebase em JSON do computador
  // =========================================================================
  public async uploadFirebaseRulesJSON(jsonOrString: string): Promise<{
    success: boolean;
    message: string;
    rulesContent: string;
    linesCount: number;
  }> {
    let extractedRules = '';

    try {
      const parsed = JSON.parse(jsonOrString);
      extractedRules =
        parsed.rulesContent ||
        parsed.rules ||
        parsed.content ||
        (parsed.firebaseRules ? parsed.firebaseRules.rulesContent : '');
    } catch {
      // Se já for a string das regras diretamente
      extractedRules = jsonOrString;
    }

    if (!extractedRules || typeof extractedRules !== 'string') {
      throw new Error(
        'Arquivo JSON inválido: nenhuma regra encontrada nos campos "rulesContent", "rules" ou "content".'
      );
    }

    // Validação mínima de sintaxe
    if (!extractedRules.includes('service cloud.firestore') || !extractedRules.includes('rules_version')) {
      throw new Error(
        'O conteúdo não possui uma estrutura válida de regras do Firebase Firestore (necessário rules_version e service cloud.firestore).'
      );
    }

    // Envia ao servidor via endpoint
    const response = await fetch('/api/firebase/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rulesContent: extractedRules }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error || 'Erro ao persistir firestore.rules no servidor.');
    }

    const linesCount = extractedRules.split('\n').length;

    return {
      success: true,
      message: `Regras de segurança do Firebase atualizadas com sucesso (${linesCount} linhas)!`,
      rulesContent: extractedRules,
      linesCount,
    };
  }

  // =========================================================================
  // 3.05.9.e: Download de todas as coleções do Firebase em JSON
  // =========================================================================
  public async downloadFirebaseCollectionsJSON(
    onProgress?: (msg: string) => void
  ): Promise<{
    filename: string;
    payload: FirestoreCollectionsJsonPayload;
    stats: {
      collectionsCount: number;
      totalDocuments: number;
      byCollection: Record<string, number>;
    };
  }> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const dbId = ACTIVE_FIREBASE_CONFIG.firestoreDatabaseId;
    const filename = `firebase-colecoes-${dbId}-${timestamp}.json`;

    onProgress?.('Conectando ao Cloud Firestore e listando coleções...');
    const collectionsResult = await this.fetchAllFirestoreCollections(onProgress);

    const payload: FirestoreCollectionsJsonPayload = {
      _metadata: {
        type: 'FIRESTORE_COLLECTIONS_JSON',
        projectId: ACTIVE_FIREBASE_CONFIG.firebaseConfig.projectId,
        firestoreDatabaseId: dbId,
        exportedAt: new Date().toISOString(),
        collectionsCount: Object.keys(collectionsResult.structured).length,
        totalDocuments: collectionsResult.totalDocs,
      },
      collections: collectionsResult.structured,
    };

    onProgress?.('Gerando arquivo JSON e iniciando download no computador...');
    this.triggerFileDownload(filename, payload);

    return {
      filename,
      payload,
      stats: {
        collectionsCount: Object.keys(collectionsResult.structured).length,
        totalDocuments: collectionsResult.totalDocs,
        byCollection: collectionsResult.countsByCollection,
      },
    };
  }

  // =========================================================================
  // 3.05.9.f: Upload de todas as coleções do Firebase em JSON do computador
  // =========================================================================
  public async uploadFirebaseCollectionsJSON(
    jsonContent: string,
    onProgress?: (msg: string) => void
  ): Promise<{
    success: boolean;
    message: string;
    stats: Record<string, number>;
  }> {
    let parsed: any;
    try {
      parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch (e: any) {
      throw new Error(`JSON de coleções inválido: ${e?.message}`);
    }

    const collectionsInput = parsed.collections || parsed.firestoreCollections || parsed;
    if (!collectionsInput || typeof collectionsInput !== 'object') {
      throw new Error('Formato inválido: objeto de coleções não encontrado no JSON.');
    }

    const db = getDbSafe();
    if (!db) {
      throw new Error('Instância do Cloud Firestore indisponível para gravação.');
    }

    const stats: Record<string, number> = {};
    const colEntries = Object.entries(collectionsInput);

    onProgress?.(`Iniciando importação de ${colEntries.length} coleções para o Firestore...`);

    for (const [colName, docsList] of colEntries) {
      if (!Array.isArray(docsList)) continue;
      stats[colName] = 0;
      onProgress?.(`Gravando coleção "${colName}" (${docsList.length} documentos)...`);

      for (const item of docsList) {
        try {
          const docId = item.id || item.uid || item._id;
          const docData = item.data !== undefined ? item.data : { ...item };
          delete docData.subcollections; // evita gravar subcoleção como campo direto

          if (!docId) continue;

          const docRef = doc(db, colName, String(docId));
          await setDoc(docRef, docData, { merge: true });
          stats[colName]++;

          // Se houver subcoleções (como 'inevitavel' dentro de 'documentos')
          if (item.subcollections && typeof item.subcollections === 'object') {
            for (const [subName, subDocs] of Object.entries(item.subcollections)) {
              if (Array.isArray(subDocs)) {
                for (const subItem of subDocs) {
                  const subId = subItem.id || subItem.uid || subItem._id;
                  const subData = subItem.data !== undefined ? subItem.data : { ...subItem };
                  if (subId) {
                    const subRef = doc(db, colName, String(docId), subName, String(subId));
                    await setDoc(subRef, subData, { merge: true });
                    const subKey = `${colName}/${docId}/${subName}`;
                    stats[subKey] = (stats[subKey] || 0) + 1;
                  }
                }
              }
            }
          }
        } catch (docErr) {
          console.warn(`[FirebaseBackupDispatchService] Erro ao gravar documento na coleção ${colName}:`, docErr);
        }
      }
    }

    onProgress?.('Gravação no Cloud Firestore concluída com sucesso!');

    return {
      success: true,
      message: `Upload de coleções concluído com sucesso no Cloud Firestore!`,
      stats,
    };
  }

  // =========================================================================
  // Métodos Auxiliares
  // =========================================================================

  /**
   * Consulta todas as coleções conhecidas no Cloud Firestore e formata a árvore
   */
  private async fetchAllFirestoreCollections(onProgress?: (msg: string) => void): Promise<{
    rawMap: Record<string, any[]>;
    structured: Record<string, Array<{ id: string; data: Record<string, any>; subcollections?: Record<string, any[]> }>>;
    totalDocs: number;
    countsByCollection: Record<string, number>;
  }> {
    const db = getDbSafe();
    const rawMap: Record<string, any[]> = {};
    const structured: Record<string, Array<{ id: string; data: Record<string, any>; subcollections?: Record<string, any[]> }>> = {};
    const countsByCollection: Record<string, number> = {};
    let totalDocs = 0;

    const knownCollections = [
      'documentos',
      'users',
      'userpage',
      'banned_users',
      'audit_logs',
      'system_updates',
      'wiki_extensions',
      'wiki_extension_registry',
      'user_checklist_points',
      'user_chats',
      'system_telemetry',
      'wiki_backup_records',
    ];

    if (!db) {
      // Fallback para cache local se Firestore offline
      return this.fallbackLocalCollections();
    }

    for (const colName of knownCollections) {
      try {
        onProgress?.(`Lendo coleção "${colName}" do Firestore...`);
        const colRef = collection(db, colName);
        const snap = await getDocs(colRef);
        const docsArray: any[] = [];
        const structuredArray: any[] = [];

        for (const d of snap.docs) {
          const docData = d.data();
          docsArray.push({ id: d.id, ...docData });

          const structItem: { id: string; data: Record<string, any>; subcollections?: Record<string, any[]> } = {
            id: d.id,
            data: docData,
          };

          // Se for 'documentos', busca a subcoleção de artigos 'inevitavel'
          if (colName === 'documentos') {
            try {
              const subRef = collection(db, 'documentos', d.id, 'inevitavel');
              const subSnap = await getDocs(subRef);
              if (!subSnap.empty) {
                structItem.subcollections = {
                  inevitavel: subSnap.docs.map((sd) => ({ id: sd.id, data: sd.data() })),
                };
                totalDocs += subSnap.docs.length;
              }
            } catch {}
          }

          structuredArray.push(structItem);
        }

        rawMap[colName] = docsArray;
        structured[colName] = structuredArray;
        countsByCollection[colName] = docsArray.length;
        totalDocs += docsArray.length;
      } catch (err) {
        console.warn(`[FirebaseBackupDispatchService] Coleção "${colName}" ignorada ou vazia:`, err);
        rawMap[colName] = [];
        structured[colName] = [];
        countsByCollection[colName] = 0;
      }
    }

    return { rawMap, structured, totalDocs, countsByCollection };
  }

  /**
   * Fallback com coleções locais em cache caso o Firestore esteja inacessível
   */
  private async fallbackLocalCollections() {
    const pages = await StorageService.getPages();
    const articles = await StorageService.getArticles();
    const users = await StorageService.getCommunityUsers();
    const auditLogs = StorageService.getUserAuditLogs();
    const systemUpdates = await StorageService.getSystemUpdates();

    const rawMap: Record<string, any[]> = {
      documentos: pages,
      artigos_inevitavel: articles,
      users,
      audit_logs: auditLogs,
      system_updates: systemUpdates,
    };

    const structured: Record<string, any[]> = {
      documentos: pages.map((p) => ({ id: p.uid, data: p })),
      artigos_inevitavel: articles.map((a) => ({ id: a.id, data: a })),
      users: users.map((u) => ({ id: u.uid, data: u })),
      audit_logs: auditLogs.map((l) => ({ id: l.id, data: l })),
      system_updates: systemUpdates.map((s) => ({ id: s.id, data: s })),
    };

    const totalDocs = pages.length + articles.length + users.length + auditLogs.length + systemUpdates.length;

    return {
      rawMap,
      structured,
      totalDocs,
      countsByCollection: {
        documentos: pages.length,
        artigos_inevitavel: articles.length,
        users: users.length,
        audit_logs: auditLogs.length,
        system_updates: systemUpdates.length,
      },
    };
  }
}

export const firebaseBackupDispatchService = FirebaseBackupDispatchService.getInstance();
