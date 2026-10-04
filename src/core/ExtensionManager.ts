/**
 * @file ExtensionManager.ts
 * @description Gerenciador central (Singleton) responsável por carregar, inicializar e 
 * manter o ciclo de vida de todas as extensões do WikiWorldWeb / WikiZero.
 * 
 * Regra de Segurança do Sistema:
 * Apenas usuários com prerrogativas de Burocrata (Bureaucrat) podem ativar,
 * desativar, adicionar ou remover extensões do sistema.
 */

import { HookRegistry, WikiExtension } from './Extension';
import { UserProfile, InstalledExtensionMeta, ExtensionCategory } from '../types';
import { StorageService } from '../services/storageService';

/**
 * Função utilitária central para validar se um usuário possui o status de Burocrata.
 */
export function isUserBureaucrat(user: UserProfile | null): boolean {
  if (!user) return false;
  // Sysop fundador e e-mail institucional mestre
  if (user.email === 'pedrohenriquecardonaperes@gmail.com') return true;
  // Usuário associado explicitamente ao grupo 'burocrata'
  if (user.group && user.group.toLowerCase().includes('burocrata')) return true;
  // Administradores plenos da Wiki
  if (user.role === 'admin') return true;
  return false;
}

export class ExtensionManager {
  private static instance: ExtensionManager;
  private readonly hookRegistry: HookRegistry;

  /** Todas as extensões compiladas/descobertas (ativas ou inativas) */
  private registeredExtensions: Map<string, WikiExtension> = new Map();

  /** Extensões atualmente ativas com ganchos registrados */
  private loadedExtensions: Map<string, WikiExtension> = new Map();

  /** Estados de ativação persistidos ({ [extensionName]: boolean }) */
  private extensionStates: Record<string, boolean> = {};

  /** Extensões personalizadas adicionadas em tempo de execução pelos burocratas */
  private customExtensions: InstalledExtensionMeta[] = [];

  /** Ouvintes reativos para atualizar a UI do React em tempo real */
  private listeners: Set<() => void> = new Set();

  private isInitialized: boolean = false;

  /**
   * Construtor privado para garantir o padrão Singleton.
   */
  private constructor() {
    this.hookRegistry = new HookRegistry();
    this.loadPersistedData();
  }

  /**
   * Obtém a instância única do ExtensionManager (Singleton).
   */
  public static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  /**
   * Retorna o registro de ganchos (HookRegistry) para consumo no núcleo da aplicação.
   */
  public getHooks(): HookRegistry {
    return this.hookRegistry;
  }

  public get hooks(): HookRegistry {
    return this.hookRegistry;
  }

  /**
   * Inscreve um componente para receber notificações de mudanças de estado nas extensões.
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[ExtensionManager] Erro no ouvinte de extensão:', err);
      }
    });
  }

  /**
   * Carrega os estados salvos de ativação e extensões customizadas do armazenamento local.
   */
  private loadPersistedData(): void {
    this.extensionStates = StorageService.getSavedExtensionStates();
    this.customExtensions = StorageService.getSavedCustomExtensions();
  }

  /**
   * Salva os estados atuais de ativação.
   */
  private persistStates(): void {
    StorageService.saveExtensionStates(this.extensionStates);
  }

  /**
   * Salva a lista de extensões customizadas.
   */
  private persistCustomExtensions(): void {
    StorageService.saveCustomExtensions(this.customExtensions);
  }

  /**
   * Registra uma extensão no catálogo. Se estiver marcada como ativa, executa seu onRegister.
   */
  public registerExtension(extension: WikiExtension, defaultEnabled: boolean = true): void {
    if (!extension || typeof extension.getName !== 'function') {
      console.error('[ExtensionManager] Tentativa de registrar extensão inválida:', extension);
      return;
    }

    const name = extension.getName();
    this.registeredExtensions.set(name, extension);

    // Determina se deve estar ativada: respeita estado salvo, senão usa padrão
    const isEnabled = this.extensionStates[name] !== undefined
      ? this.extensionStates[name]
      : defaultEnabled;

    this.extensionStates[name] = isEnabled;

    if (isEnabled && !this.loadedExtensions.has(name)) {
      try {
        extension.onRegister(this.hookRegistry);
        this.loadedExtensions.set(name, extension);
        console.info(`[ExtensionManager] 🧩 Extensão '${name}' (v${extension.getVersion()}) inicializada.`);
      } catch (error) {
        console.error(`[ExtensionManager] Falha ao inicializar extensão '${name}':`, error);
      }
    }
  }

  /**
   * Carrega dinamicamente todas as extensões disponíveis no diretório /src/extensions
   * usando o carregamento de módulos nativo do Vite (import.meta.glob).
   */
  public async loadExtensionsFromGlob(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.loadPersistedData();
    console.info('[ExtensionManager] Varrendo catálogo de extensões dinâmicas...');

    const srcExtensionModules: Record<string, () => Promise<any>> =
      (import.meta as any).glob('/src/extensions/**/index.ts') || {};

    const rootExtensionModules: Record<string, () => Promise<any>> =
      (import.meta as any).glob('/extensions/**/index.ts') || {};

    const allModulePaths: Record<string, () => Promise<any>> = {
      ...rootExtensionModules,
      ...srcExtensionModules,
    };

    const loadPromises: Promise<void>[] = [];

    for (const [path, importModule] of Object.entries(allModulePaths)) {
      loadPromises.push(
        (async () => {
          try {
            const moduleExports = await importModule();
            let extensionInstance: WikiExtension | null = null;

            if (moduleExports.default) {
              if (typeof moduleExports.default === 'function') {
                extensionInstance = new (moduleExports.default as new () => WikiExtension)();
              } else if (typeof moduleExports.default.getName === 'function') {
                extensionInstance = moduleExports.default as WikiExtension;
              }
            }

            if (!extensionInstance && moduleExports.extension) {
              if (typeof moduleExports.extension === 'function') {
                extensionInstance = new (moduleExports.extension as new () => WikiExtension)();
              } else if (typeof moduleExports.extension.getName === 'function') {
                extensionInstance = moduleExports.extension as WikiExtension;
              }
            }

            if (!extensionInstance) {
              for (const key of Object.keys(moduleExports)) {
                const exp = moduleExports[key];
                if (exp && typeof exp.getName === 'function') {
                  extensionInstance = exp as WikiExtension;
                  break;
                }
              }
            }

            if (extensionInstance) {
              this.registerExtension(extensionInstance, true);
            }
          } catch (err) {
            console.error(`[ExtensionManager] Erro ao carregar extensão em '${path}':`, err);
          }
        })()
      );
    }

    await Promise.all(loadPromises);

    // Carrega extensões customizadas cadastradas por burocratas
    this.mountCustomExtensions();

    this.persistStates();
    this.isInitialized = true;

    console.info(
      `[ExtensionManager] Carregamento concluído: ${this.loadedExtensions.size} ativas de ${this.registeredExtensions.size} instaladas.`
    );

    this.hookRegistry.doAction('extensions:all_loaded', Array.from(this.loadedExtensions.values()));
    this.notifyListeners();
  }

  /**
   * Instancia e registra extensões customizadas adicionadas dinamicamente por burocratas.
   */
  private mountCustomExtensions(): void {
    for (const customMeta of this.customExtensions) {
      if (this.registeredExtensions.has(customMeta.name)) continue;

      const dynamicExt: WikiExtension = {
        getName: () => customMeta.name,
        getVersion: () => customMeta.version,
        getDescription: () => customMeta.description,
        getAuthor: () => customMeta.author,
        getCategory: () => customMeta.category,
        isCore: () => false,
        getWebsite: () => customMeta.website,
        onRegister: (hooks: HookRegistry) => {
          // Se houver script customizado configurado
          if (customMeta.customScript && customMeta.customScript.trim()) {
            try {
              // Executa de forma segura injetando hooks e nome
              const runner = new Function('hooks', 'extensionName', customMeta.customScript);
              runner(hooks, customMeta.name);
            } catch (e) {
              console.error(`[ExtensionManager] Erro no script da extensão customizada '${customMeta.name}':`, e);
            }
          } else {
            // Gancho padrão de log e banner diagnóstico
            hooks.addAction('article:viewed', () => {}, 20, customMeta.name);
          }
        },
        onUnregister: (hooks: HookRegistry) => {
          hooks.removeAllHooksForExtension(customMeta.name);
        },
      };

      const isEnabled = this.extensionStates[customMeta.name] ?? customMeta.enabled;
      this.registerExtension(dynamicExt, isEnabled);
    }
  }

  /**
   * Retorna a lista completa com os metadados de todas as extensões instaladas no sistema.
   */
  public getAllInstalledExtensions(): InstalledExtensionMeta[] {
    const list: InstalledExtensionMeta[] = [];

    // 1. Extensões registradas via código / glob
    for (const [name, ext] of this.registeredExtensions.entries()) {
      const isEnabled = this.loadedExtensions.has(name);
      const isCore = typeof ext.isCore === 'function' ? ext.isCore() : true;
      const category: ExtensionCategory =
        typeof ext.getCategory === 'function' ? ext.getCategory()! : 'utility';
      const website = typeof ext.getWebsite === 'function' ? ext.getWebsite() : undefined;
      const desc =
        typeof ext.getDescription === 'function'
          ? ext.getDescription()!
          : 'Extensão integrada ao ecossistema da enciclopédia.';
      const author = typeof ext.getAuthor === 'function' ? ext.getAuthor()! : 'WikiZero Core Team';
      const version = typeof ext.getVersion === 'function' ? ext.getVersion() : '1.0.0';

      const hooksInfo = this.hookRegistry.getHooksForExtension(name);
      const allHooks = [...hooksInfo.filters, ...hooksInfo.actions];

      // Verifica se é uma extensão customizada existente para preservar metadados adicionais
      const customMatch = this.customExtensions.find((c) => c.name === name);

      list.push({
        id: customMatch?.id || `ext-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name,
        version,
        description: desc,
        author,
        category,
        enabled: isEnabled,
        isCore: customMatch ? false : isCore,
        installedAt: customMatch?.installedAt || '2026-01-01T00:00:00.000Z',
        installedBy: customMatch?.installedBy || 'Sistema (Nativo)',
        website,
        hooks: allHooks.length > 0 ? allHooks : (customMatch?.hooks || ['render:wikitext']),
        customScript: customMatch?.customScript,
      });
    }

    return list;
  }

  /**
   * ATIVAÇÃO DE EXTENSÃO
   * Regra: Apenas burocratas podem ativar extensões.
   */
  public activateExtension(
    nameOrId: string,
    currentUser: UserProfile | null
  ): { success: boolean; message: string } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para ativar extensões da Wiki.',
      };
    }

    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não encontrada no catálogo de instaladas.` };
    }

    const name = ext.getName();
    if (this.loadedExtensions.has(name)) {
      return { success: true, message: `A extensão '${name}' já se encontra ativa.` };
    }

    try {
      ext.onRegister(this.hookRegistry);
      this.loadedExtensions.set(name, ext);
      this.extensionStates[name] = true;
      this.persistStates();

      // Atualiza lista de custom extensions se for customizada
      const customIdx = this.customExtensions.findIndex((c) => c.name === name || c.id === nameOrId);
      if (customIdx >= 0) {
        this.customExtensions[customIdx].enabled = true;
        this.customExtensions[customIdx].lastModifiedAt = new Date().toISOString();
        this.customExtensions[customIdx].lastModifiedBy = currentUser?.displayName || currentUser?.username || 'Burocrata';
        this.persistCustomExtensions();
      }

      // Registra log formal de auditoria
      StorageService.logExtensionAction({
        extensionId: nameOrId,
        extensionName: name,
        action: 'activated',
        operatorUid: currentUser?.uid || '',
        operatorUsername: currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata',
        operatorRole: currentUser?.role || 'admin',
        details: `Extensão ativada com sucesso pelo burocrata.`,
      });

      this.hookRegistry.doAction('extension:activated', ext);
      this.notifyListeners();

      return {
        success: true,
        message: `Extensão '${name}' ativada com sucesso! Os recursos já estão operantes no sistema.`,
      };
    } catch (err: any) {
      console.error(`[ExtensionManager] Erro ao ativar extensão '${name}':`, err);
      return {
        success: false,
        message: `Falha ao ativar '${name}': ${err?.message || 'Erro de execução desconhecido.'}`,
      };
    }
  }

  /**
   * DESATIVAÇÃO DE EXTENSÃO
   * Regra: Apenas burocratas podem desativar extensões.
   */
  public deactivateExtension(
    nameOrId: string,
    currentUser: UserProfile | null
  ): { success: boolean; message: string } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para desativar extensões da Wiki.',
      };
    }

    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não encontrada no catálogo de instaladas.` };
    }

    const name = ext.getName();
    if (!this.loadedExtensions.has(name)) {
      return { success: true, message: `A extensão '${name}' já se encontra desativada.` };
    }

    try {
      if (typeof ext.onUnregister === 'function') {
        ext.onUnregister(this.hookRegistry);
      }
      this.hookRegistry.removeAllHooksForExtension(name);
      this.loadedExtensions.delete(name);
      this.extensionStates[name] = false;
      this.persistStates();

      const customIdx = this.customExtensions.findIndex((c) => c.name === name || c.id === nameOrId);
      if (customIdx >= 0) {
        this.customExtensions[customIdx].enabled = false;
        this.customExtensions[customIdx].lastModifiedAt = new Date().toISOString();
        this.customExtensions[customIdx].lastModifiedBy = currentUser?.displayName || currentUser?.username || 'Burocrata';
        this.persistCustomExtensions();
      }

      // Registra log formal de auditoria
      StorageService.logExtensionAction({
        extensionId: nameOrId,
        extensionName: name,
        action: 'deactivated',
        operatorUid: currentUser?.uid || '',
        operatorUsername: currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata',
        operatorRole: currentUser?.role || 'admin',
        details: `Extensão desativada pelo burocrata. Todos os ganchos associados foram removidos do barramento.`,
      });

      this.hookRegistry.doAction('extension:deactivated', name);
      this.notifyListeners();

      return {
        success: true,
        message: `Extensão '${name}' desativada com sucesso. Seus ganchos foram suspensos.`,
      };
    } catch (err: any) {
      console.error(`[ExtensionManager] Erro ao desativar extensão '${name}':`, err);
      return {
        success: false,
        message: `Falha ao desativar '${name}': ${err?.message || 'Erro desconhecido.'}`,
      };
    }
  }

  /**
   * ADIÇÃO / INSTALAÇÃO DE NOVA EXTENSÃO
   * Regra: Apenas burocratas podem adicionar extensões.
   */
  public addExtension(
    data: Partial<InstalledExtensionMeta>,
    currentUser: UserProfile | null
  ): { success: boolean; message: string; extension?: InstalledExtensionMeta } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para adicionar novas extensões à Wiki.',
      };
    }

    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'O nome da extensão é obrigatório.' };
    }

    const cleanName = data.name.trim().replace(/\s+/g, '');
    if (this.registeredExtensions.has(cleanName)) {
      return { success: false, message: `Já existe uma extensão instalada com o nome '${cleanName}'.` };
    }

    const now = new Date().toISOString();
    const id = data.id || `custom-ext-${Date.now()}`;
    const operatorName = currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata';

    const newMeta: InstalledExtensionMeta = {
      id,
      name: cleanName,
      version: data.version?.trim() || '1.0.0',
      description: data.description?.trim() || 'Extensão instalada por deliberação do burocrata.',
      author: data.author?.trim() || operatorName,
      category: data.category || 'utility',
      enabled: data.enabled !== false,
      isCore: false,
      installedAt: now,
      installedBy: operatorName,
      website: data.website?.trim() || undefined,
      hooks: data.hooks && data.hooks.length > 0 ? data.hooks : ['render:wikitext'],
      customScript: data.customScript,
    };

    // Cria a instância dinâmica
    const dynamicExt: WikiExtension = {
      getName: () => newMeta.name,
      getVersion: () => newMeta.version,
      getDescription: () => newMeta.description,
      getAuthor: () => newMeta.author,
      getCategory: () => newMeta.category,
      isCore: () => false,
      getWebsite: () => newMeta.website,
      onRegister: (hooks: HookRegistry) => {
        if (newMeta.customScript && newMeta.customScript.trim()) {
          try {
            const runner = new Function('hooks', 'extensionName', newMeta.customScript);
            runner(hooks, newMeta.name);
          } catch (e) {
            console.error(`[ExtensionManager] Erro no script da extensão '${newMeta.name}':`, e);
          }
        } else {
          // Gancho padrão inofensivo
          hooks.addFilter<string>(
            'render:wikitext',
            (text: string) => text,
            10,
            newMeta.name
          );
        }
      },
      onUnregister: (hooks: HookRegistry) => {
        hooks.removeAllHooksForExtension(newMeta.name);
      },
    };

    this.customExtensions.push(newMeta);
    this.persistCustomExtensions();

    this.registerExtension(dynamicExt, newMeta.enabled);
    this.persistStates();

    StorageService.logExtensionAction({
      extensionId: id,
      extensionName: cleanName,
      action: 'added',
      operatorUid: currentUser?.uid || '',
      operatorUsername: operatorName,
      operatorRole: currentUser?.role || 'admin',
      details: `Nova extensão "${cleanName}" v${newMeta.version} (${newMeta.category}) adicionada e instalada pelo burocrata.`,
    });

    this.notifyListeners();

    return {
      success: true,
      message: `Extensão '${cleanName}' instalada com sucesso na Wiki!`,
      extension: newMeta,
    };
  }

  /**
   * REMOÇÃO DE EXTENSÃO
   * Regra: Apenas burocratas podem remover extensões.
   */
  public removeExtension(
    nameOrId: string,
    currentUser: UserProfile | null
  ): { success: boolean; message: string } {
    if (!isUserBureaucrat(currentUser)) {
      return {
        success: false,
        message: 'Acesso negado: Apenas burocratas do Conselho possuem permissão para remover extensões.',
      };
    }

    const ext = this.findExtension(nameOrId);
    if (!ext) {
      return { success: false, message: `Extensão '${nameOrId}' não localizada.` };
    }

    const name = ext.getName();
    const isCore = typeof ext.isCore === 'function' ? ext.isCore() : false;

    if (isCore) {
      return {
        success: false,
        message: `A extensão '${name}' é um componente nativo essencial (Core) da Wiki e não pode ser desinstalada. Para neutralizá-la, utilize a opção "Desativar".`,
      };
    }

    try {
      // 1. Desativa e descarrega hooks
      if (typeof ext.onUnregister === 'function') {
        ext.onUnregister(this.hookRegistry);
      }
      this.hookRegistry.removeAllHooksForExtension(name);
      this.loadedExtensions.delete(name);
      delete this.extensionStates[name];
      this.registeredExtensions.delete(name);
      this.persistStates();

      // 2. Remove do armazenamento de customizadas
      this.customExtensions = this.customExtensions.filter(
        (c) => c.name !== name && c.id !== nameOrId
      );
      this.persistCustomExtensions();

      // 3. Log de auditoria
      const operatorName = currentUser?.displayName || currentUser?.username || currentUser?.email || 'Burocrata';
      StorageService.logExtensionAction({
        extensionId: nameOrId,
        extensionName: name,
        action: 'removed',
        operatorUid: currentUser?.uid || '',
        operatorUsername: operatorName,
        operatorRole: currentUser?.role || 'admin',
        details: `Extensão "${name}" desinstalada e removida permanentemente do sistema pelo burocrata.`,
      });

      this.notifyListeners();

      return {
        success: true,
        message: `Extensão '${name}' removida com sucesso pelo burocrata.`,
      };
    } catch (err: any) {
      console.error(`[ExtensionManager] Erro ao remover extensão '${name}':`, err);
      return {
        success: false,
        message: `Falha ao remover extensão: ${err?.message || 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Localiza uma extensão pelo nome ou ID.
   */
  private findExtension(nameOrId: string): WikiExtension | undefined {
    // Busca exata pelo nome
    if (this.registeredExtensions.has(nameOrId)) {
      return this.registeredExtensions.get(nameOrId);
    }

    // Busca insensível a maiúsculas
    for (const [name, ext] of this.registeredExtensions.entries()) {
      if (name.toLowerCase() === nameOrId.toLowerCase()) {
        return ext;
      }
    }

    // Busca por id nas extensões customizadas
    const customMatch = this.customExtensions.find(
      (c) => c.id === nameOrId || c.name.toLowerCase() === nameOrId.toLowerCase()
    );
    if (customMatch && this.registeredExtensions.has(customMatch.name)) {
      return this.registeredExtensions.get(customMatch.name);
    }

    return undefined;
  }

  /**
   * Retorna os ganchos ativos para auditoria.
   */
  public getHooksAudit(): {
    type: 'filter' | 'action';
    hookName: string;
    extensionName: string;
    priority: number;
  }[] {
    return this.hookRegistry.getAllHooksDetailed();
  }

  /**
   * Retorna se a extensão está ativa.
   */
  public isExtensionLoaded(name: string): boolean {
    return this.loadedExtensions.has(name);
  }

  public getLoadedExtensions(): WikiExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  public getExtension(name: string): WikiExtension | undefined {
    return this.findExtension(name);
  }
}

export const extensionManager = ExtensionManager.getInstance();
