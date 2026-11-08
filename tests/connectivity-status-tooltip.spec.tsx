/**
 * @file tests/connectivity-status-tooltip.spec.tsx
 * @description Testes automatizados para o componente ConnectivityStatusTooltip
 * Valida a estrutura, as propriedades e a renderização do balão de detalhes de conectividade.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectivityStatusTooltip } from '../src/components/ConnectivityStatusTooltip';

describe('Componente ConnectivityStatusTooltip', () => {
  it('deve renderizar o elemento trigger filho com aria-label de acessibilidade', () => {
    const html = renderToStaticMarkup(
      <ConnectivityStatusTooltip
        status="online"
        latencyMs={120}
        lastCheckedAt={Date.now()}
      >
        <button data-testid="status-icon">Ícone de Status</button>
      </ConnectivityStatusTooltip>
    );

    expect(html).toContain('Ícone de Status');
    expect(html).toContain('role="tooltip"');
    expect(html).toContain('aria-label="Detalhes de Conectividade com o GitHub"');
  });

  it('deve aceitar parâmetros de status online, latência em ms e timestamp', () => {
    const fixedTimestamp = new Date('2026-11-08T12:30:00Z').getTime();

    const element = (
      <ConnectivityStatusTooltip
        status="online"
        latencyMs={95}
        lastCheckedAt={fixedTimestamp}
        statusCode={200}
        isStable={true}
      >
        <span>Wifi Icon</span>
      </ConnectivityStatusTooltip>
    );

    expect(element.props.status).toBe('online');
    expect(element.props.latencyMs).toBe(95);
    expect(element.props.lastCheckedAt).toBe(fixedTimestamp);
    expect(element.props.statusCode).toBe(200);
    expect(element.props.isStable).toBe(true);
  });

  it('deve aceitar parâmetros de status offline e erro de diagnóstico', () => {
    const element = (
      <ConnectivityStatusTooltip
        status="offline"
        latencyMs={null}
        lastCheckedAt={Date.now()}
        error="Network timeout after 4000ms"
        isStable={false}
      >
        <span>WifiOff Icon</span>
      </ConnectivityStatusTooltip>
    );

    expect(element.props.status).toBe('offline');
    expect(element.props.latencyMs).toBeNull();
    expect(element.props.error).toBe('Network timeout after 4000ms');
    expect(element.props.isStable).toBe(false);
  });
});
