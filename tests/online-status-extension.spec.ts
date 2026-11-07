/**
 * @file tests/online-status-extension.spec.ts
 * @description Testes automatizados para o novo módulo 'OnlineStatusExtension' em src/core/extensions/
 * e seu registro no ExtensionManager.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnlineStatusExtension } from '../src/core/extensions/OnlineStatusExtension';
import { ExtensionManager } from '../src/core/ExtensionManager';
import { HookRegistry } from '../src/core/Extension';

describe('Suíte de Testes da OnlineStatusExtension (src/core/extensions/)', () => {
  let extension: OnlineStatusExtension;
  let hooks: HookRegistry;

  beforeEach(() => {
    extension = new OnlineStatusExtension();
    hooks = new HookRegistry();
  });

  afterEach(() => {
    extension.stopPeriodicCheck();
    vi.restoreAllMocks();
  });

  describe('Metadados e Especificações da Extensão', () => {
    it('deve possuir o nome "OnlineStatusExtension"', () => {
      expect(extension.getName()).toBe('OnlineStatusExtension');
      expect(extension.name).toBe('OnlineStatusExtension');
    });

    it('deve possuir versão válida e categoria utility', () => {
      expect(extension.getVersion()).toMatch(/^\d+\.\d+\.\d+$/);
      expect(extension.getCategory()).toBe('utility');
      expect(extension.isCore()).toBe(true);
      expect(extension.isSyncableWithCloud()).toBe(true);
      expect(extension.getWebsite()).toContain('github.com');
    });

    it('deve fornecer um esquema de configurações administrativas com os campos essenciais', () => {
      const schema = extension.getSettingsSchema();
      expect(Array.isArray(schema)).toBe(true);

      const keys = schema.map((field) => field.key);
      expect(keys).toContain('enabled');
      expect(keys).toContain('intervalSeconds');
      expect(keys).toContain('targetUrl');
      expect(keys).toContain('timeoutMs');

      const enabledField = schema.find((f) => f.key === 'enabled');
      expect(enabledField?.type).toBe('boolean');
      expect(enabledField?.defaultValue).toBe(true);
    });
  });

  describe('Ciclo de Vida e Registro de Hooks', () => {
    it('deve registrar filtros de rede no HookRegistry ao executar onRegister', () => {
      extension.onRegister(hooks, {
        settings: { enabled: true, intervalSeconds: 30 },
      });

      expect(hooks.hasFilter('network:is_online')).toBe(true);
      expect(hooks.hasFilter('network:github_telemetry')).toBe(true);
      expect(hooks.hasFilter('network:github_latency')).toBe(true);
      expect(hooks.hasFilter('network:is_verifier_enabled')).toBe(true);
    });

    it('deve limpar os filtros e parar timers ao executar onUnregister', () => {
      extension.onRegister(hooks, { settings: { enabled: true } });
      expect(hooks.hasFilter('network:is_online')).toBe(true);

      extension.onUnregister(hooks);
      expect(hooks.hasFilter('network:is_online')).toBe(false);
    });

    it('deve respeitar a opção enabled: false nas configurações e não iniciar polling', () => {
      const startSpy = vi.spyOn(extension, 'startPeriodicCheck');
      extension.onRegister(hooks, { settings: { enabled: false } });

      expect(startSpy).not.toHaveBeenCalled();
    });
  });

  describe('Verificação Periódica com fetch no GitHub', () => {
    it('deve realizar fetch na URL alvo do GitHub e atualizar o estado como online', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await extension.checkConnectivity();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('github.com'),
        expect.objectContaining({
          method: 'GET',
          cache: 'no-store',
        })
      );
      expect(result.status).toBe('online');
      expect(result.statusCode).toBe(200);
      expect(extension.getState().isOnline).toBe(true);
      expect(extension.getState().history).toHaveLength(1);
    });

    it('deve tratar resposta com rate limit (403) ou redirecionamento como conectividade funcional', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await extension.checkConnectivity();

      expect(result.status).toBe('online');
      expect(result.statusCode).toBe(403);
      expect(extension.getState().isOnline).toBe(true);
    });

    it('deve registrar status offline quando fetch falhar por erro de rede', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await extension.checkConnectivity();

      expect(result.status).toBe('offline');
      expect(result.error).toContain('Network error');
      expect(extension.getState().isOnline).toBe(false);
    });
  });

  describe('Integração e Registro no ExtensionManager', () => {
    it('deve estar registrada e ativa no ExtensionManager por padrão', () => {
      const manager = ExtensionManager.getInstance();

      expect(manager.isOnlineStatusExtensionEnabled()).toBe(true);
      expect(manager.getOnlineStatusExtension()).toBeDefined();
    });

    it('deve permitir desativação e reativação via ExtensionManager', () => {
      const manager = ExtensionManager.getInstance();

      // Desativa
      manager.setOnlineStatusExtensionEnabled(false);
      expect(manager.isOnlineStatusExtensionEnabled()).toBe(false);

      // Reativa
      manager.setOnlineStatusExtensionEnabled(true);
      expect(manager.isOnlineStatusExtensionEnabled()).toBe(true);
    });

    it('deve permitir acesso às configurações administrativas da extensão', () => {
      const manager = ExtensionManager.getInstance();
      const settings = manager.getOnlineStatusExtensionSettings();
      expect(settings).toBeDefined();
      expect(typeof settings).toBe('object');
    });
  });
});
