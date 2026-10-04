import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: MathKatex
 * Converte marcações matemáticas <math>...</math> em fórmulas estilizadas e legíveis.
 */
export default class MathKatex implements WikiExtension {
  getName(): string {
    return 'MathKatex';
  }

  getVersion(): string {
    return '1.2.0';
  }

  getDescription(): string {
    return 'Renderiza expressões e equações matemáticas (LaTeX/KaTeX) em notação visual tipograficamente refinada.';
  }

  getAuthor(): string {
    return 'Conselho Científico & Wikimedia Foundation';
  }

  getCategory(): 'rendering' {
    return 'rendering';
  }

  isCore(): boolean {
    return true;
  }

  getWebsite(): string {
    return 'https://katex.org';
  }

  onRegister(hooks: HookRegistry): void {
    // Transforma tags <math>formula</math> em HTML estilizado de fórmula
    hooks.addFilter<string>(
      'render:wikitext',
      (rawWikitext: string) => {
        if (!rawWikitext || typeof rawWikitext !== 'string') return rawWikitext;

        return rawWikitext.replace(
          /<math(?:\s+chem)?>([\s\S]*?)<\/math>/gi,
          (_match, formula) => {
            const cleanFormula = (formula || '')
              .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
              .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
              .replace(/\\sum/g, '∑')
              .replace(/\\int/g, '∫')
              .replace(/\\infty/g, '∞')
              .replace(/\\times/g, '×')
              .replace(/\\approx/g, '≈')
              .replace(/\\le/g, '≤')
              .replace(/\\ge/g, '≥')
              .replace(/\\ne/g, '≠')
              .replace(/\\pm/g, '±')
              .replace(/\\alpha/g, 'α')
              .replace(/\\beta/g, 'β')
              .replace(/\\gamma/g, 'γ')
              .replace(/\\delta/g, 'δ')
              .replace(/\\pi/g, 'π')
              .replace(/\\sigma/g, 'σ')
              .replace(/\\omega/g, 'ω')
              .trim();

            return `<span class="inline-flex items-center px-2 py-0.5 my-0.5 mx-1 font-mono text-[13px] font-semibold bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded shadow-xs" title="Fórmula Matemática LaTeX: ${cleanFormula}">∑ ${cleanFormula}</span>`;
          }
        );
      },
      8,
      this.getName()
    );
  }

  onUnregister(hooks: HookRegistry): void {
    hooks.removeAllHooksForExtension(this.getName());
  }
}
