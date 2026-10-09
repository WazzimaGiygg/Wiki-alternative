import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { getDbSafe, handleFirestoreError, OperationType } from './firebase';
import {
  InstalledExtensionMeta,
  ExtensionConflict,
  FirebaseExtensionRegistryDoc,
  UserProfile,
} from '../types';

/**
 * Constantes e Coleções do Firebase para o Módulo de Extensões (Versão 3.304)
 */
export const EXTENSION_FIREBASE_COLLECTIONS = {
  REGISTRY: 'wiki_extension_registry',
  REGISTRY_DOC: 'global_states',
  EXTENSIONS: 'wiki_extensions',
  LOGS: 'wiki_extension_logs',
};

export type SyncStateStatus = 'connected' | 'connecting' | 'offline' | 'error';

function cleanFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestorePayload(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = cleanFirestorePayload(value);
    }
  }
  return clean as T;
}

/**
 * Serviço de Sincronização de Extensões em Nuvem via Firebase Firestore.
 * Atende às especificações da Versão 3.304:
 * - 304.1 / 304.2: Sincronia de extensões ativadas/desativadas com Firestore em tempo real.
 * - 304.3: Mapeamento de extensões entre arquivos locais (index.ts) e banco de dados.
 * - 304.3.1: Resolução de extensões órfãs e colisões de nome/função.
 * - 304.4: Upload de novas extensões via arquivo válido (index.js/index.ts).
 * - 304.4: Sincronização em massa de todas as extensões na nuvem.
 * - 304.5: Porta de entrada para segurança da Wiki mesmo para visitantes não logados.
 * - 304.6: Suporte a camadas de segurança salvas em nuvem.
 */
export class FirebaseExtensionSyncService {
  private static instance: FirebaseExtensionSyncService;
  private registryUnsubscribe: Unsubscribe | null = null;
  private extensionsUnsubscribe: Unsubscribe | null = null;
  private currentSyncStatus: SyncStateStatus = 'connecting';
  private lastSyncedAt: string | null = null;
  private listeners: Set<(status: SyncStateStatus) => void> = new Set();

  private constructor() {}

  public static getInstance(): FirebaseExtensionSyncService {
    if (!FirebaseExtensionSyncService.instance) {
      FirebaseExtensionSyncService.instance = new FirebaseExtensionSyncService();
    }
    return FirebaseExtensionSyncService.instance;
  }

  public getSyncStatus(): SyncStateStatus {
    return this.currentSyncStatus;
  }

  public getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  public subscribeStatus(listener: (status: SyncStateStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentSyncStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(status: SyncStateStatus): void {
    this.currentSyncStatus = status;
    this.listeners.forEach((l) => {
      try {
        l(status);
      } catch (err) {
        console.warn('[FirebaseExtensionSyncService] Erro no listener de status:', err);
      }
    });
  }

  /**
   * Higieniza o identificador da extensão para ser usado como Document ID no Firestore.
   */
  public sanitizeDocId(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 100);
  }

  /**
   * Gera um hash simples de integridade e segurança para o estado das extensões (304.5).
   */
  private generateSecurityHash(states: Record<string, boolean>): string {
    const keys = Object.keys(states).sort();
    let str = '';
    for (const k of keys) {
      str += `${k}:${states[k]};`;
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `sec304-${Math.abs(hash).toString(16)}`;
  }

  /**
   * 304.2 & 304.5: Inicia a escuta em tempo real no Firestore para sincronizar
   * ativações/desativações e extensões da nuvem mesmo para visitantes não autenticados.
   */
  public startRealtimeSync(
    onStatesUpdate: (states: Record<string, boolean>, settings?: Record<string, Record<string, any>>) => void,
    onCloudExtensionsUpdate: (extensions: InstalledExtensionMeta[]) => void
  ): void {
    const db = getDbSafe();
    if (!db) {
      this.setStatus('offline');
      return;
    }

    // 1. Escuta e Busca Imediata do Registro Global de Estados (global_states)
    try {
      const regDocRef = doc(
        db,
        EXTENSION_FIREBASE_COLLECTIONS.REGISTRY,
        EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC
      );

      // 3.05.3.q.3: Busca inicial imediata com getDoc para carregar estados em novas janelas/computadores
      getDoc(regDocRef)
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as FirebaseExtensionRegistryDoc;
            if (data && data.states && typeof data.states === 'object') {
              this.lastSyncedAt = data.updatedAt || new Date().toISOString();
              this.setStatus('connected');
              onStatesUpdate(data.states, data.settings);
            }
          }
        })
        .catch((e) => {
          console.warn('[FirebaseExtensionSyncService] Aviso na busca inicial getDoc de estados:', e);
        });

      this.registryUnsubscribe = onSnapshot(
        regDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as FirebaseExtensionRegistryDoc;
            if (data && data.states && typeof data.states === 'object') {
              this.lastSyncedAt = data.updatedAt || new Date().toISOString();
              this.setStatus('connected');
              onStatesUpdate(data.states, data.settings);
            }
          } else {
            // Documento ainda não inicializado na nuvem
            this.setStatus('connected');
          }
        },
        (error) => {
          console.warn('[FirebaseExtensionSyncService] Falha na escuta do registro de extensões:', error);
          this.setStatus('offline');
        }
      );
    } catch (e) {
      console.warn('[FirebaseExtensionSyncService] Erro ao conectar ao registro de extensões:', e);
      this.setStatus('offline');
    }

    // 2. Escuta da Coleção de Extensões em Nuvem (wiki_extensions)
    try {
      const colRef = collection(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS);
      this.extensionsUnsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const cloudExts: InstalledExtensionMeta[] = [];
          snapshot.forEach((docSnap) => {
            const item = docSnap.data() as InstalledExtensionMeta;
            if (item && item.name) {
              cloudExts.push({
                ...item,
                syncStatus: 'synced',
              });
            }
          });
          this.setStatus('connected');
          this.lastSyncedAt = new Date().toISOString();
          onCloudExtensionsUpdate(cloudExts);
        },
        (error) => {
          console.warn('[FirebaseExtensionSyncService] Falha na escuta das extensões em nuvem:', error);
          this.setStatus('offline');
        }
      );
    } catch (e) {
      console.warn('[FirebaseExtensionSyncService] Erro ao conectar à coleção wiki_extensions:', e);
      this.setStatus('offline');
    }
  }

  /**
   * Encerra as conexões em tempo real.
   */
  public stopRealtimeSync(): void {
    if (this.registryUnsubscribe) {
      this.registryUnsubscribe();
      this.registryUnsubscribe = null;
    }
    if (this.extensionsUnsubscribe) {
      this.extensionsUnsubscribe();
      this.extensionsUnsubscribe = null;
    }
  }

  /**
   * 304.1 & 304.3 & 3.05.3.q.3: Persiste o estado global de ativação/desativação e configurações no Firestore.
   */
  public async syncStatesToCloud(
    states: Record<string, boolean>,
    user: UserProfile | null,
    settings?: Record<string, Record<string, any>>
  ): Promise<{ success: boolean; message: string }> {
    const db = getDbSafe();
    if (!db) {
      return {
        success: false,
        message: 'Banco de dados do Firebase indisponível. Operação mantida em cache local.',
      };
    }

    const path = `${EXTENSION_FIREBASE_COLLECTIONS.REGISTRY}/${EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC}`;
    try {
      const activeCount = Object.values(states).filter(Boolean).length;
      const totalCount = Object.keys(states).length;
      const rawPayload: FirebaseExtensionRegistryDoc = {
        id: EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC,
        states,
        version: '3.05',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.displayName || user?.username || user?.email || 'Burocrata Administrador',
        securityHash: this.generateSecurityHash(states),
        activeCount,
        totalExtensions: totalCount,
      };

      if (settings && Object.keys(settings).length > 0) {
        rawPayload.settings = settings;
      }

      const payload = cleanFirestorePayload(rawPayload);

      const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.REGISTRY, EXTENSION_FIREBASE_COLLECTIONS.REGISTRY_DOC);
      await setDoc(docRef, payload, { merge: true });

      // 3.05.3.q.3: Garante que cada extensão tenha seu estado gravado individualmente na coleção wiki_extensions
      // para que outras janelas e computadores vejam a alteração imediatamente
      const writePromises = Object.entries(states).map(async ([name, isEnabled]) => {
        try {
          const extDocId = this.sanitizeDocId(name);
          const extDocRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, extDocId);
          const extSettings = settings ? settings[name] : undefined;
          const individualData = cleanFirestorePayload({
            name,
            enabled: isEnabled,
            ...(extSettings ? { settings: extSettings } : {}),
            updatedAt: payload.updatedAt,
            updatedBy: payload.updatedBy,
          });
          await setDoc(extDocRef, individualData, { merge: true });
        } catch (e) {
          console.warn(`[FirebaseExtensionSyncService] Falha ao sincronizar documento individual '${name}':`, e);
        }
      });
      await Promise.allSettled(writePromises);

      this.lastSyncedAt = payload.updatedAt;
      this.setStatus('connected');

      return {
        success: true,
        message: `Estados sincronizados com o Firebase com sucesso (${activeCount} ativas de ${totalCount} catalogadas).`,
      };
    } catch (error: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao sincronizar estados no Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
      return {
        success: false,
        message: `Erro ao sincronizar estados com a nuvem: ${error?.message || 'Falha de permissão ou rede'}`,
      };
    }
  }

  /**
   * 304.4 (segundo item): Sincroniza em lote TODAS as extensões locais para a nuvem Firebase.
   */
  public async syncAllExtensionsToCloud(
    extensions: InstalledExtensionMeta[],
    states: Record<string, boolean>,
    user: UserProfile | null
  ): Promise<{ success: boolean; totalSynced: number; message: string }> {
    const db = getDbSafe();
    if (!db) {
      return {
        success: false,
        totalSynced: 0,
        message: 'Firebase Firestore indisponível para sincronia em nuvem.',
      };
    }

    try {
      let count = 0;
      const syncedAt = new Date().toISOString();
      const operatorName = user?.displayName || user?.username || user?.email || 'Burocrata Administrador';

      for (const ext of extensions) {
        const docId = this.sanitizeDocId(ext.name);
        const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, docId);

        // Prepara os metadados sem propriedades undefined
        const cleanExt: InstalledExtensionMeta = {
          ...ext,
          enabled: states[ext.name] ?? ext.enabled ?? true,
          syncedAt,
          syncedBy: operatorName,
          syncStatus: 'synced',
        };

        // Remove chaves indefinidas para conformidade estrita com o Firestore
        const serialized = JSON.parse(JSON.stringify(cleanExt));
        await setDoc(docRef, serialized, { merge: true });
        count++;
      }

      // Atualiza também o registro global de estados
      await this.syncStatesToCloud(states, user);

      return {
        success: true,
        totalSynced: count,
        message: `Sincronização concluída com sucesso: ${count} extensões salvas em nuvem no Firebase!`,
      };
    } catch (err: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao sincronizar todas as extensões:', err);
      return {
        success: false,
        totalSynced: 0,
        message: `Falha na sincronização em nuvem: ${err?.message || 'Erro de rede ou permissão'}`,
      };
    }
  }

  /**
   * Salva ou atualiza uma única extensão na nuvem Firebase.
   */
  public async saveExtensionToCloud(
    extension: InstalledExtensionMeta,
    user: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    const db = getDbSafe();
    if (!db) {
      return { success: false, message: 'Banco de dados do Firebase offline.' };
    }

    const docId = this.sanitizeDocId(extension.name);
    const path = `${EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS}/${docId}`;

    try {
      const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, docId);
      const payload: InstalledExtensionMeta = {
        ...extension,
        syncedAt: new Date().toISOString(),
        syncedBy: user?.displayName || user?.username || user?.email || 'Burocrata',
        syncStatus: 'synced',
      };

      const serialized = JSON.parse(JSON.stringify(payload));
      await setDoc(docRef, serialized, { merge: true });

      return {
        success: true,
        message: `Extensão '${extension.name}' salva com sucesso no Firebase!`,
      };
    } catch (err: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao salvar extensão no Firestore:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
      return {
        success: false,
        message: `Erro ao salvar extensão na nuvem: ${err?.message || 'Falha de permissão.'}`,
      };
    }
  }

  /**
   * 304.3.1: Remove uma extensão por completo da nuvem Firebase.
   */
  public async deleteExtensionFromCloud(
    extensionName: string,
    user: UserProfile | null
  ): Promise<{ success: boolean; message: string }> {
    const db = getDbSafe();
    if (!db) {
      return { success: false, message: 'Banco de dados do Firebase offline.' };
    }

    const docId = this.sanitizeDocId(extensionName);
    const path = `${EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS}/${docId}`;

    try {
      const docRef = doc(db, EXTENSION_FIREBASE_COLLECTIONS.EXTENSIONS, docId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: `Extensão '${extensionName}' removida por completo da nuvem Firebase.`,
      };
    } catch (err: any) {
      console.error('[FirebaseExtensionSyncService] Erro ao deletar extensão no Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, path);
      return {
        success: false,
        message: `Falha ao remover extensão da nuvem: ${err?.message || 'Erro de permissão.'}`,
      };
    }
  }

  /**
   * 304.3.1: Detecta colisões e divergências entre as extensões locais e as extensões na nuvem.
   */
  public detectConflicts(
    localExtensions: InstalledExtensionMeta[],
    cloudExtensions: InstalledExtensionMeta[]
  ): ExtensionConflict[] {
    const conflicts: ExtensionConflict[] = [];

    // Mapeamento por nome normalizado
    const localMap = new Map<string, InstalledExtensionMeta>();
    for (const l of localExtensions) {
      localMap.set(l.name.toLowerCase().trim(), l);
    }

    const cloudMap = new Map<string, InstalledExtensionMeta>();
    for (const c of cloudExtensions) {
      cloudMap.set(c.name.toLowerCase().trim(), c);
    }

    // 1. Verifica extensões em nuvem que não existem mais localmente (Órfãs em Nuvem)
    for (const [key, cloudExt] of cloudMap.entries()) {
      const localExt = localMap.get(key);
      if (!localExt) {
        conflicts.push({
          id: `conflict-orphan-${cloudExt.name}`,
          extensionName: cloudExt.name,
          type: 'orphan_cloud',
          title: `Extensão em Nuvem Sem Arquivo Local`,
          description: `A extensão '${cloudExt.name}' (v${cloudExt.version}) existe no banco de dados do Firebase, mas não possui arquivo correspondente no diretório local do sistema.`,
          cloudVersion: cloudExt.version,
          cloudMeta: cloudExt,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Verifica extensões com o mesmo nome ou funções colidentes
    for (const localExt of localExtensions) {
      const cloudExt = cloudMap.get(localExt.name.toLowerCase().trim());
      if (cloudExt) {
        // Colisão de versão ou código
        const isDifferentVersion = localExt.version !== cloudExt.version;
        const hasCustomDifferences =
          (localExt.customScript || '') !== (cloudExt.customScript || '') ||
          (localExt.customCss || '') !== (cloudExt.customCss || '');

        if (isDifferentVersion || hasCustomDifferences) {
          conflicts.push({
            id: `conflict-col-${localExt.name}`,
            extensionName: localExt.name,
            type: 'collision_name',
            title: `Colisão de Versão / Código`,
            description: `A extensão '${localExt.name}' possui divergência entre o arquivo local (v${localExt.version}) e a versão armazenada no Firebase (v${cloudExt.version}).`,
            localVersion: localExt.version,
            cloudVersion: cloudExt.version,
            localMeta: localExt,
            cloudMeta: cloudExt,
            detectedAt: new Date().toISOString(),
          });
        }
      }

      // Verifica colisão de ID de ferramenta se houver toolConfig
      if (localExt.toolConfig?.toolId) {
        for (const cloudExt of cloudExtensions) {
          if (
            cloudExt.name.toLowerCase() !== localExt.name.toLowerCase() &&
            cloudExt.toolConfig?.toolId === localExt.toolConfig.toolId
          ) {
            conflicts.push({
              id: `conflict-tool-${localExt.name}-${cloudExt.name}`,
              extensionName: localExt.name,
              type: 'collision_function',
              title: `Colisão de Função / Ferramenta (${localExt.toolConfig.toolId})`,
              description: `A ferramenta de ID '${localExt.toolConfig.toolId}' da extensão '${localExt.name}' colide com a mesma funcionalidade registrada por '${cloudExt.name}' na nuvem.`,
              localMeta: localExt,
              cloudMeta: cloudExt,
              detectedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * 304.4: Analisa o conteúdo de um arquivo de extensão enviado pelo burocrata (index.js, index.ts ou .json)
   * e extrai os metadados necessários para salvamento na nuvem.
   */
  public parseUploadedExtensionFile(
    fileContent: string,
    fileName: string
  ): {
    success: boolean;
    meta?: Partial<InstalledExtensionMeta>;
    error?: string;
  } {
    if (!fileContent || !fileContent.trim()) {
      return { success: false, error: 'O arquivo enviado está vazio.' };
    }

    const trimmed = fileContent.trim();

    // 1. Formato JSON (Manifesto Direto)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (!parsed.name) {
          return { success: false, error: 'O manifesto JSON deve conter pelo menos a propriedade "name".' };
        }
        return {
          success: true,
          meta: {
            id: parsed.id || `ext-${this.sanitizeDocId(parsed.name).toLowerCase()}`,
            name: parsed.name,
            version: parsed.version || '1.0.0',
            description: parsed.description || 'Extensão carregada via arquivo JSON pelo burocrata.',
            author: parsed.author || 'Burocrata Administrador',
            category: parsed.category || 'tool',
            enabled: parsed.enabled !== false,
            isCore: false,
            hooks: parsed.hooks || ['render:wikitext'],
            customScript: parsed.customScript || parsed.script || '',
            customCss: parsed.customCss || '',
            customTags: parsed.customTags,
            toolConfig: parsed.toolConfig,
            themeConfig: parsed.themeConfig,
            editorPluginConfig: parsed.editorPluginConfig,
            bannerConfig: parsed.bannerConfig,
            filterRules: parsed.filterRules,
            dependencies: parsed.dependencies,
            settingsSchema: parsed.settingsSchema,
            settings: parsed.settings || {},
            originFile: fileName,
            uploadedFile: fileName,
          },
        };
      } catch (err: any) {
        return { success: false, error: `Erro ao analisar JSON: ${err?.message}` };
      }
    }

    // 2. Formato JavaScript / TypeScript (index.js / index.ts)
    try {
      let extName = '';
      let extVersion = '1.0.0';
      let extDesc = '';
      let extAuthor = 'Burocrata Administrador';
      let extCategory: any = 'tool';
      const hooksList: string[] = [];

      // Extrai nome da classe ou método getName()
      const classMatch = fileContent.match(/class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        extName = classMatch[1];
      }

      const getNameMatch = fileContent.match(/getName\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getNameMatch) {
        extName = getNameMatch[1];
      }

      // Extrai getVersion()
      const getVersionMatch = fileContent.match(/getVersion\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getVersionMatch) {
        extVersion = getVersionMatch[1];
      }

      // Extrai getDescription()
      const getDescMatch = fileContent.match(/getDescription\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getDescMatch) {
        extDesc = getDescMatch[1];
      }

      // Extrai getAuthor()
      const getAuthorMatch = fileContent.match(/getAuthor\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getAuthorMatch) {
        extAuthor = getAuthorMatch[1];
      }

      // Extrai getCategory()
      const getCategoryMatch = fileContent.match(/getCategory\s*\(\s*\)[^{]*\{[\s\S]*?return\s+['"`]([^'"`]+)['"`]/);
      if (getCategoryMatch) {
        extCategory = getCategoryMatch[1];
      }

      // Procura hooks registrados no onRegister
      const hookMatches = fileContent.matchAll(/hooks\.(addFilter|addAction)\s*\(\s*['"`]([^'"`]+)['"`]/g);
      for (const m of hookMatches) {
        if (m[2] && !hooksList.includes(m[2])) {
          hooksList.push(m[2]);
        }
      }

      // Se não encontrou o nome pela sintaxe da classe, usa o nome do arquivo
      if (!extName) {
        extName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
      }

      if (!extDesc) {
        extDesc = `Extensão carregada via arquivo '${fileName}' pelo burocrata.`;
      }

      return {
        success: true,
        meta: {
          id: `ext-${this.sanitizeDocId(extName).toLowerCase()}`,
          name: extName,
          version: extVersion,
          description: extDesc,
          author: extAuthor,
          category: extCategory,
          enabled: true,
          isCore: false,
          hooks: hooksList.length > 0 ? hooksList : ['render:wikitext'],
          customScript: fileContent,
          originFile: fileName,
          uploadedFile: fileName,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Erro ao analisar arquivo JS/TS: ${err?.message || 'Sintaxe inválida'}`,
      };
    }
  }
}
