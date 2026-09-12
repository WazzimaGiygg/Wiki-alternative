import { HookRegistry, WikiExtension } from '../../core/Extension';

/**
 * Extension: ReadingTimeEnhancer
 * Calcula estimativas de tempo de leitura e estatísticas para artigos da WikiZero.
 */
export default class ReadingTimeEnhancer implements WikiExtension {
  getName(): string {
    return 'ReadingTimeEnhancer';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Calcula estimativa de minutos de leitura e métricas de legibilidade para artigos.';
  }

  getAuthor(): string {
    return 'Equipe WikiZero';
  }

  onRegister(hooks: HookRegistry): void {
    hooks.addFilter<number>('article:read_time_minutes', (currentEstimate: number, text?: string) => {
      if (!text || typeof text !== 'string') return currentEstimate || 1;
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(1, Math.ceil(words / 200));
    });

    hooks.addAction('extension:loaded', (ext: WikiExtension) => {
      // Diagnostic log
    });
  }

  onUnregister(hooks: HookRegistry): void {
    // Cleanup if needed
  }
}
