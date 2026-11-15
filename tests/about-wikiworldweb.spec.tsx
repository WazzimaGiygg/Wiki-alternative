import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AboutWikiWorldWebView } from '../src/components/AboutWikiWorldWebView';
import {
  getCanonicalUid,
  getFriendlyUidLabel,
  resolveNavigationUid,
} from '../src/utils/urlRouter';

describe('Conheça a WikiWorldWeb (Special:AboutWikiWorldWeb)', () => {
  it('resolve corretamente os atalhos e canonical UID para about-wikiworldweb', () => {
    expect(getCanonicalUid('about-wikiworldweb', {})).toBe('Special:AboutWikiWorldWeb');
    expect(getFriendlyUidLabel('Special:AboutWikiWorldWeb')).toBe('Conheça a WikiWorldWeb');

    expect(resolveNavigationUid('Special:AboutWikiWorldWeb', [], [])).toEqual({
      type: 'view',
      view: 'about-wikiworldweb',
    });
    expect(resolveNavigationUid('conheca-a-wikiworldweb', [], [])).toEqual({
      type: 'view',
      view: 'about-wikiworldweb',
    });
    expect(resolveNavigationUid('publicidade', [], [])).toEqual({
      type: 'view',
      view: 'about-wikiworldweb',
      initialTab: 'kit',
    });
    expect(resolveNavigationUid('comercial', [], [])).toEqual({
      type: 'view',
      view: 'about-wikiworldweb',
      initialTab: 'commercial',
    });
    expect(resolveNavigationUid('roteiro', [], [])).toEqual({
      type: 'view',
      view: 'about-wikiworldweb',
      initialTab: 'script',
    });
  });

  it('renderiza o Comercial Interativo de 6 cenas com informações principais da WikiWorldWeb', () => {
    const html = renderToStaticMarkup(
      <AboutWikiWorldWebView
        onNavigate={() => {}}
        onOpenEditor={() => {}}
        initialTab="commercial"
      />
    );

    expect(html).toContain('Conheça a WikiWorldWeb');
    expect(html).toContain('Campanha Oficial de Apresentação');
    expect(html).toContain('Conhecimento sem censura, sem anúncios e sem monopólio.');
    expect(html).toContain('Cena 01');
    expect(html).toContain('Cena 06');
    expect(html).toContain('01:12');
    expect(html).toContain('Conhecimento Descentralizado e Sem Anúncios');
    expect(html).toContain('Privacidade Absoluta &amp; Zero Nomes Reais Indevidos');
  });

  it('renderiza o Estúdio de Roteiro com todas as cenas editáveis e exportação', () => {
    const html = renderToStaticMarkup(
      <AboutWikiWorldWebView
        onNavigate={() => {}}
        onOpenEditor={() => {}}
        initialTab="script"
      />
    );

    expect(html).toContain('Estúdio de Roteiro');
    expect(html).toContain('O conhecimento livre não pertence a painéis fechados');
    expect(html).toContain('Arquitetura moderna com Wikitexto em tempo real');
    expect(html).toContain('Alinhamento absoluto com a Lei Geral de Proteção de Dados');
    expect(html).toContain('Autoridade coletiva, ArbCom e Código Universal de Conduta');
    expect(html).toContain('Copiar roteiro completo');
  });

  it('renderiza o Kit de Publicidade com peças de campanha prontas, slogans e marca oficial', () => {
    const html = renderToStaticMarkup(
      <AboutWikiWorldWebView
        onNavigate={() => {}}
        onOpenEditor={() => {}}
        initialTab="kit"
      />
    );

    expect(html).toContain('Kit de Publicidade');
    expect(html).toContain('Chamada Principal de Campanha (Site &amp; Imprensa)');
    expect(html).toContain('Post Direto de Divulgação (Feed &amp; Comunidades)');
    expect(html).toContain('Divulgação Acadêmica (Universidades &amp; Grupos de Estudo)');
    expect(html).toContain('Convite Técnico (Comunidade Open Source)');
    expect(html).toContain('/logo.png');
    expect(html).toContain('Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!');
  });
});
