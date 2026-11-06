/**
 * @file tests/network-status.spec.ts
 * @description Testes automatizados com Vitest para a Verificação em Tempo Real
 * se o computador está online (Recurso 4.1.1.D6.6).
 */

import { describe, it, expect } from 'vitest';
import {
  NetworkStatusService,
  ConnectionQuality,
} from '../src/services/networkStatusService';
import { ExtensionManager } from '../src/core/ExtensionManager';
import OnlineStatusVerifierExtension from '../src/extensions/online-status-verifier';

describe('Suíte de Testes da Verificação de Status Online em Tempo Real (4.1.1.D6.6)', () => {
  describe('Cálculo e Classificação de Qualidade da Conexão', () => {
    it('deve classificar como "offline" quando isOnline for falso, independentemente da latência', () => {
      expect(NetworkStatusService.calculateQuality(50, false)).toBe('offline');
      expect(NetworkStatusService.calculateQuality(0, false)).toBe('offline');
      expect(NetworkStatusService.calculateQuality(null, false)).toBe('offline');
    });

    it('deve classificar como "checking" quando a latência for nula e isOnline for verdadeiro', () => {
      expect(NetworkStatusService.calculateQuality(null, true)).toBe('checking');
    });

    it('deve classificar como "excellent" para latência baixa (< 120ms)', () => {
      expect(NetworkStatusService.calculateQuality(15, true)).toBe('excellent');
      expect(NetworkStatusService.calculateQuality(45, true)).toBe('excellent');
      expect(NetworkStatusService.calculateQuality(119, true)).toBe('excellent');
    });

    it('deve classificar como "good" para latência intermediária rápida (120ms - 280ms)', () => {
      expect(NetworkStatusService.calculateQuality(120, true)).toBe('good');
      expect(NetworkStatusService.calculateQuality(200, true)).toBe('good');
      expect(NetworkStatusService.calculateQuality(280, true)).toBe('good');
    });

    it('deve classificar como "fair" para latência moderada (281ms - 500ms)', () => {
      expect(NetworkStatusService.calculateQuality(281, true)).toBe('fair');
      expect(NetworkStatusService.calculateQuality(350, true)).toBe('fair');
      expect(NetworkStatusService.calculateQuality(500, true)).toBe('fair');
    });

    it('deve classificar como "poor" para latência alta (> 500ms)', () => {
      expect(NetworkStatusService.calculateQuality(501, true)).toBe('poor');
      expect(NetworkStatusService.calculateQuality(1200, true)).toBe('poor');
    });
  });

  describe('Estado e Telemetria do Serviço NetworkStatusService', () => {
    it('deve retornar o status atual com estrutura válida e completa', () => {
      const status = NetworkStatusService.getStatus();

      expect(status).toBeDefined();
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.isNavigatorOnline).toBe('boolean');
      expect(typeof status.isReachable).toBe('boolean');
      expect(typeof status.reconnectCount).toBe('number');
      expect(Array.isArray(status.history)).toBe(true);
      expect(typeof status.networkInfo).toBe('object');
    });

    it('deve permitir subscrição e cancelamento limpo de ouvintes', () => {
      let receivedStatus = null;
      const unsubscribe = NetworkStatusService.subscribe((s) => {
        receivedStatus = s;
      });

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('deve permitir limpar o histórico de pings', () => {
      NetworkStatusService.clearHistory();
      const status = NetworkStatusService.getStatus();
      expect(status.history).toHaveLength(0);
    });
  });

  describe('Extensão OnlineStatusVerifierExtension e Registro no ExtensionManager', () => {
    it('deve instanciar a extensão com metadados corretos da V4.1.1', () => {
      const ext = new OnlineStatusVerifierExtension();

      expect(ext.id).toBe('online-status-verifier');
      expect(ext.getName()).toBe('OnlineStatusVerifierExtension');
      expect(ext.getVersion()).toBe('4.1.1');
      expect(ext.getCategory()).toBe('utility');
      expect(ext.isCore()).toBe(true);
      const schema = ext.getSettingsSchema();
      expect(schema).toBeDefined();
      expect(schema.some((f) => f.key === 'heartbeatIntervalSeconds')).toBe(true);
      expect(schema.some((f) => f.key === 'showLatencyBadge')).toBe(true);
    });

    it('deve estar registrada e habilitada no ExtensionManager', () => {
      const manager = ExtensionManager.getInstance();

      expect(manager.isOnlineStatusVerifierEnabled()).toBe(true);
      const settings = manager.getOnlineStatusVerifierSettings();
      expect(settings).toBeDefined();
    });
  });
});
