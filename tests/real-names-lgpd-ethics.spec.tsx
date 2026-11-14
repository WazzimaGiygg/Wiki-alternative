import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RealNamesLgpdEthicsView } from '../src/components/RealNamesLgpdEthicsView';
import { getCanonicalUid, resolveNavigationUid } from '../src/utils/urlRouter';

describe('Ética de Não Uso de Nomes de Pessoas Reais & Alinhamento Absoluto com a LGPD (Special:NoRealNamesLGPD)', () => {
  it('resolve corretamente os atalhos de URL e abas iniciais para real-names-lgpd', () => {
    expect(getCanonicalUid('real-names-lgpd', {})).toBe('Special:NoRealNamesLGPD');
    expect(resolveNavigationUid('Special:NoRealNamesLGPD', [], [])).toEqual({
      type: 'view',
      view: 'real-names-lgpd',
    });
    expect(resolveNavigationUid('sem-nomes-reais', [], [])).toEqual({
      type: 'view',
      view: 'real-names-lgpd',
    });
    expect(resolveNavigationUid('alinhamento-lgpd', [], [])).toEqual({
      type: 'view',
      view: 'real-names-lgpd',
      initialTab: 'lgpd_alignment',
    });
    expect(resolveNavigationUid('lgpd-absoluta', [], [])).toEqual({
      type: 'view',
      view: 'real-names-lgpd',
      initialTab: 'lgpd_alignment',
    });
  });

  it('renderiza as diretrizes de vedação ao uso de nomes de pessoas reais (LGPD-01 a LGPD-04)', () => {
    const html = renderToStaticMarkup(
      <RealNamesLgpdEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="prohibition"
      />
    );

    expect(html).toContain('Special:NoRealNamesLGPD');
    expect(html).toContain(
      'Ética de Não Uso de Nomes de Pessoas Reais e Alinhamento Absoluto com a LGPD'
    );
    expect(html).toContain('LGPD-01');
    expect(html).toContain('LGPD-02');
    expect(html).toContain('LGPD-03');
    expect(html).toContain('LGPD-04');
    expect(html).toContain('Pseudonímia como Regra Padrão');
    expect(html).toContain('Anti-Doxxing / Anti-Outing');
  });

  it('renderiza o alinhamento absoluto com a LGPD (LGPD-05 a LGPD-08)', () => {
    const html = renderToStaticMarkup(
      <RealNamesLgpdEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="lgpd_alignment"
      />
    );

    expect(html).toContain('Alinhamento Absoluto com a LGPD (Lei nº 13.709/2018)');
    expect(html).toContain('LGPD-05');
    expect(html).toContain('LGPD-06');
    expect(html).toContain('LGPD-07');
    expect(html).toContain('LGPD-08');
    expect(html).toContain('Efeito Streisand');
    expect(html).toContain('ANPD');
  });

  it('renderiza o quadro prático de anonimização e substituição de nomes reais', () => {
    const html = renderToStaticMarkup(
      <RealNamesLgpdEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="anonymization"
      />
    );

    expect(html).toContain('Padrão Prático de Anonimização e Substituição de Nomes Reais');
    expect(html).toContain('Prática Proibida (Violação LGPD)');
    expect(html).toContain('Prática Aprovada (Alinhamento Absoluto)');
  });

  it('renderiza a aba de autoverificação contra exposição nominal e conformidade LGPD', () => {
    const html = renderToStaticMarkup(
      <RealNamesLgpdEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="checklist"
      />
    );

    expect(html).toContain(
      'Autoverificação contra Exposição de Nomes Reais e Conformidade LGPD'
    );
  });
});
