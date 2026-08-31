/**
 * @file ExtensionManager.ts
 * @description Gerenciador central (Singleton) responsável por carregar, inicializar e 
 * manter o ciclo de vida de todas as extensões do WikiZero usando Vite e TypeScript.
 */

import { HookRegistry, WikiExtension } from './Extension';

export class ExtensionManager {
  private static instance: ExtensionManager;
  private readonly hookRegistry: HookRegistry;
  private loadedExtensions: Map<string, WikiExtension> = new Map();
  private isInitialized: boolean = false;

  /**
   * Construtor privado para garantir o padrão Singleton.
   */
  private constructor() {
    this.hookRegistry = new HookRegistry();
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

  /**
   * Getter alternativo de acesso rápido ao HookRegistry.
   */
  public get hooks(): HookRegistry {
    return this.hookRegistry;
  }

  /**
   * Registra e ativa uma extensão manualmente no sistema.
   *
   * @param extension Instância que implementa a interface WikiExtension
   */
  public loadExtension(extension: WikiExtension): void {
    if (!extension || typeof extension.getName !== 'function') {
      console.error('[ExtensionManager] Tentativa de carregar extensão inválida:', extension);
      return;
    }

    const name = extension.getName();

    if (this.loadedExtensions.has(name)) {
      console.warn(`[ExtensionManager] Extensão '${name}' já se encontra carregada. Atualizando registro...`);
    }

    try {
      // Executa o método de inicialização da extensão
      extension.onRegister(this.hookRegistry);
      this.loadedExtensions.set(name, extension);

      console.info(
        `[ExtensionManager] 🧩 Extensão '${name}' (v${extension.getVersion()}) carregada com sucesso.`
      );

      // Notifica os ouvintes que uma nova extensão foi registrada
      this.hookRegistry.doAction('extension:loaded', extension);
    } catch (error) {
      console.error(`[ExtensionManager] Falha ao inicializar a extensão '${name}':`, error);
    }
  }

  /**
   * Descarrega e desativa uma extensão registrada.
   *
   * @param name Nome da extensão a ser descarregada
   */
  public unloadExtension(name: string): boolean {
    const ext = this.loadedExtensions.get(name);
    if (!ext) return false;

    try {
      if (typeof ext.onUnregister === 'function') {
        ext.onUnregister(this.hookRegistry);
      }
      this.loadedExtensions.delete(name);
      console.info(`[ExtensionManager] Extensão '${name}' descarregada.`);
      this.hookRegistry.doAction('extension:unloaded', name);
      return true;
    } catch (error) {
      console.error(`[ExtensionManager] Erro ao descarregar extensão '${name}':`, error);
      return false;
    }
  }

  /**
   * Carrega dinamicamente todas as extensões disponíveis no diretório /extensions usando
   * a funcionalidade de carregamento de módulos dinâmicos (glob) nativa do Vite (import.meta.glob).
   */
  public async loadExtensionsFromGlob(): Promise<void> {
    if (this.isInitialized) {
      console.log('[ExtensionManager] As extensões já foram carregadas anteriormente.');
      return;
    }

    console.info('[ExtensionManager] Varrendo diretório de extensões dinâmicas (Vite import.meta.glob)...');

    // Carrega módulos a partir da pasta /extensions no nível da raiz do projeto
    const rootExtensionModules: Record<string, () => Promise<any>> =
      (import.meta as any).glob('/extensions/**/index.ts') || {};

    // Também verifica /src/extensions para maior compatibilidade estrutural
    const srcExtensionModules: Record<string, () => Promise<any>> =
      (import.meta as any).glob('/src/extensions/**/index.ts') || {};

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

            // 1. Tenta export default
            if (moduleExports.default) {
              if (typeof moduleExports.default === 'function') {
                // É uma classe construtora
                extensionInstance = new (moduleExports.default as new () => WikiExtension)();
              } else if (typeof moduleExports.default.getName === 'function') {
                // É um objeto/instância
                extensionInstance = moduleExports.default as WikiExtension;
              }
            }

            // 2. Tenta export const extension
            if (!extensionInstance && moduleExports.extension) {
              if (typeof moduleExports.extension === 'function') {
                extensionInstance = new (moduleExports.extension as new () => WikiExtension)();
              } else if (typeof moduleExports.extension.getName === 'function') {
                extensionInstance = moduleExports.extension as WikiExtension;
              }
            }

            // 3. Tenta encontrar qualquer export que implemente WikiExtension
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
              this.loadExtension(extensionInstance);
            } else {
              console.warn(
                `[ExtensionManager] Nenhum objeto ou classe WikiExtension exportado em '${path}'. Certifique-se de exportar como default ou 'extension'.`
              );
            }
          } catch (err) {
            console.error(`[ExtensionManager] Erro ao carregar extensão no caminho '${path}':`, err);
          }
        })()
      );
    }

    await Promise.all(loadPromises);
    this.isInitialized = true;

    console.info(
      `[ExtensionManager] Total de ${this.loadedExtensions.size} extensão(ões) carregada(s).`
    );

    // Dispara ação global informando que todas as extensões foram carregadas
    this.hookRegistry.doAction('extensions:all_loaded', Array.from(this.loadedExtensions.values()));
  }

  /**
   * Retorna a lista de todas as extensões ativas.
   */
  public getLoadedExtensions(): WikiExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  /**
   * Busca uma extensão pelo nome.
   */
  public getExtension(name: string): WikiExtension | undefined {
    return this.loadedExtensions.get(name);
  }

  /**
   * Verifica se uma extensão está carregada.
   */
  public isExtensionLoaded(name: string): boolean {
    return this.loadedExtensions.has(name);
  }
}

// Exporta a instância padrão para conveniência
export const extensionManager = ExtensionManager.getInstance();
