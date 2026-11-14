import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AIEthicsView } from '../src/components/AIEthicsView';
import { getCanonicalUid, resolveNavigationUid } from '../src/utils/urlRouter';

describe('Ética de Uso da Inteligência Artificial (Special:AIEthics)', () => {
  it('resolve corretamente os atalhos de URL para ai-ethics', () => {
    expect(getCanonicalUid('ai-ethics', {})).toBe('Special:AIEthics');
    expect(resolveNavigationUid('Special:AIEthics', [], [])).toEqual({
      type: 'view',
      view: 'ai-ethics',
    });
    expect(resolveNavigationUid('etica-ia', [], [])).toEqual({
      type: 'view',
      view: 'ai-ethics',
    });
    expect(resolveNavigationUid('etica-uso-ia', [], [])).toEqual({
      type: 'view',
      view: 'ai-ethics',
    });
  });

  it('renderiza a página principal de Ética de Uso da IA com os princípios fundamentais', () => {
    const html = renderToStaticMarkup(
      <AIEthicsView
        user={null}
        onNavigate={() => {}}
        onOpenEditor={() => {}}
        initialTab="principles"
      />
    );

    expect(html).toContain('Ética de Uso da Inteligência Artificial');
    expect(html).toContain('Special:AIEthics');
    expect(html).toContain('Supervisão Humana Integral');
    expect(html).toContain('Verificabilidade Antes da Velocidade');
    expect(html).toContain('Transparência Editorial');
    expect(html).toContain('Neutralidade e Controle de Viés');
  });

  it('renderiza as regras IA-01 a IA-08 e práticas permitidas/proibidas', () => {
    const html = renderToStaticMarkup(
      <AIEthicsView
        user={null}
        onNavigate={() => {}}
        onOpenEditor={() => {}}
        initialTab="rules"
      />
    );

    expect(html).toContain('Práticas Permitidas (com revisão humana)');
    expect(html).toContain('Práticas Estritamente Proibidas');
    expect(html).toContain('IA-01');
    expect(html).toContain('IA-08');
    expect(html).toContain('Vedação a Alucinações e Referências Fabricadas');
  });

  it('renderiza conformidade LGPD, EU AI Act e autoverificação ética de IA', () => {
    const privacyHtml = renderToStaticMarkup(
      <AIEthicsView
        user={null}
        onNavigate={() => {}}
        onOpenEditor={() => {}}
        initialTab="privacy"
      />
    );
    expect(privacyHtml).toContain('LGPD (Lei nº 13.709/2018)');
    expect(privacyHtml).toContain('EU AI Act (Regulamento UE 2024/1689)');

    const checklistHtml = renderToStaticMarkup(
      <AIEthicsView
        user={null}
        onNavigate={() => {}}
        onOpenEditor={() => {}}
        initialTab="checklist"
      />
    );
    expect(checklistHtml).toContain('Autoverificação Antes de Publicar Conteúdo com Apoio de IA');
  });
});
