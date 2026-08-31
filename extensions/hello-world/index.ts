/**
 * @file index.ts
 * @description Extensão de exemplo "Hello World" para o WikiZero.
 * Demonstra como interceptar a renderização do Wikitext/artigo usando filtros (Filters)
 * e como escutar eventos do ciclo de vida da aplicação usando ações (Actions).
 */

import { HookRegistry, WikiExtension } from '../../src/core/Extension';

export class HelloWorldExtension implements WikiExtension {
  /**
   * Identificador único da extensão.
   */
  public getName(): string {
    return 'hello-world';
  }

  /**
   * Versão semântica da extensão.
   */
  public getVersion(): string {
    return '1.0.0';
  }

  /**
   * Descrição amigável exibida em painéis administrativos e relatórios.
   */
  public getDescription(): string {
    return 'Extensão de exemplo que demonstra a arquitetura de ganchos do WikiZero inserindo uma nota de rodapé estilizada nos artigos.';
  }

  /**
   * Nome do autor / mantenedor.
   */
  public getAuthor(): string {
    return 'Comunidade WikiZero';
  }

  /**
   * Registra os filtros e ações no núcleo do WikiZero.
   *
   * @param hooks Instância central do HookRegistry
   */
  public onRegister(hooks: HookRegistry): void {
    console.log('[HelloWorldExtension] Inicializando hooks da extensão Hello World...');

    // 1. Filtro: Modifica o conteúdo Wikitext antes do parser processar a página
    hooks.addFilter<string>(
      'render:wikitext',
      (wikitext: string, articleTitle?: string) => {
        // Evita adicionar o rodapé repetidamente se já estiver presente
        const footerSignature = '<!-- WIKIZERO_EXT_HELLO_WORLD_FOOTER -->';
        if (wikitext.includes(footerSignature)) {
          return wikitext;
        }

        const customFooter = `\n\n${footerSignature}\n<div class="mt-8 p-3.5 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between gap-3 shadow-xs font-sans not-prose">\n  <div class="flex items-center gap-2">\n    <span class="text-base">🧩</span>\n    <div>\n      <strong class="text-blue-700 dark:text-blue-400 font-semibold">Extensão Hello World Ativa:</strong> Este artigo (${articleTitle || 'WikiZero'}) teve seu conteúdo processado pelo ecossistema dinâmico de plugins.\n    </div>\n  </div>\n  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold uppercase border border-blue-200 dark:border-blue-700">v1.0.0</span>\n</div>`;

        return `${wikitext}${customFooter}`;
      },
      20, // Prioridade
      this.getName()
    );

    // 2. Ação: Escuta eventos globais da aplicação
    hooks.addAction(
      'extensions:all_loaded',
      (extensions: WikiExtension[]) => {
        console.log(
          `[HelloWorldExtension] Todas as ${extensions.length} extensões foram carregadas com sucesso no WikiZero!`
        );
      },
      10,
      this.getName()
    );

    // 3. Ação: Notificação quando um artigo é visualizado
    hooks.addAction(
      'article:viewed',
      (slug: string) => {
        console.log(`[HelloWorldExtension] O artigo '${slug}' foi visualizado pelo leitor.`);
      },
      10,
      this.getName()
    );
  }

  /**
   * Chamado quando a extensão for desativada/descarregada.
   */
  public onUnregister(hooks: HookRegistry): void {
    console.log('[HelloWorldExtension] Removendo filtros e desativando...');
    hooks.removeFilter('render:wikitext');
    hooks.removeAction('extensions:all_loaded');
    hooks.removeAction('article:viewed');
  }
}

// Exporta por padrão e como instância nomeada para máxima flexibilidade
export const extension = new HelloWorldExtension();
export default extension;
