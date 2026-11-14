import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FirebaseGovernanceEthicsView } from '../src/components/FirebaseGovernanceEthicsView';
import { getCanonicalUid, resolveNavigationUid } from '../src/utils/urlRouter';

describe('Ética Firebase, Não Uso da Wikimedia Foundation e Caso Chronus (Special:FirebaseEthics)', () => {
  it('resolve corretamente os atalhos de URL e abas iniciais para firebase-ethics', () => {
    expect(getCanonicalUid('firebase-ethics', {})).toBe('Special:FirebaseEthics');
    expect(resolveNavigationUid('Special:FirebaseEthics', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
    });
    expect(resolveNavigationUid('etica-firebase', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
    });
    expect(resolveNavigationUid('sem-wikimedia', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
      initialTab: 'no_wikimedia',
    });
    expect(resolveNavigationUid('caso-chronus', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
      initialTab: 'chronus_abuses',
    });
    expect(resolveNavigationUid('abusos-chronus', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
      initialTab: 'chronus_abuses',
    });
  });

  it('renderiza as diretrizes éticas e de segurança do Firebase (FB-01 a FB-06)', () => {
    const html = renderToStaticMarkup(
      <FirebaseGovernanceEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="firebase_ethics"
      />
    );

    expect(html).toContain('Special:FirebaseEthics');
    expect(html).toContain('Diretrizes de Ética e Segurança para Uso do Google Firebase');
    expect(html).toContain('FB-01');
    expect(html).toContain('FB-02');
    expect(html).toContain('FB-03');
    expect(html).toContain('FB-04');
    expect(html).toContain('FB-05');
    expect(html).toContain('FB-06');
    expect(html).toContain('Menor Privilégio, RBAC e Regras Estritas do Firestore');
  });

  it('renderiza os fundamentos do porquê o Wiki-site não utiliza dados da Wikimedia Foundation', () => {
    const html = renderToStaticMarkup(
      <FirebaseGovernanceEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="no_wikimedia"
      />
    );

    expect(html).toContain('Por que a WikiWorldWeb Não Utiliza Dados da Wikimedia Foundation');
    expect(html).toContain('WMF-01');
    expect(html).toContain('WMF-02');
    expect(html).toContain('WMF-03');
    expect(html).toContain('WMF-04');
    expect(html).toContain('AS14907');
    expect(html).toContain('Efeito Streisand');
    expect(html).toContain('Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf');
  });

  it('renderiza o registro documental dos abusos do administrador Chronus', () => {
    const html = renderToStaticMarkup(
      <FirebaseGovernanceEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="chronus_abuses"
      />
    );

    expect(html).toContain('Registro dos Abusos Atribuídos ao Administrador Chronus');
    expect(html).toContain('CHR-01');
    expect(html).toContain('CHR-02');
    expect(html).toContain('CHR-03');
    expect(html).toContain('CHR-04');
    expect(html).toContain('CHR-05');
    expect(html).toContain('Arts. 138 a 140 CP');
    expect(html).toContain('Art. 147-A do Código Penal');
    expect(html).toContain('Código Universal de Conduta (UCoC)');
    expect(html).toContain('Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf');
    expect(html).toContain('Wikimedia_Institutional_Accountability_Dossier.pdf');
  });

  it('renderiza a aba de autoverificação de conformidade Firebase', () => {
    const html = renderToStaticMarkup(
      <FirebaseGovernanceEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="checklist"
      />
    );

    expect(html).toContain('Checklist de Conformidade Firebase &amp; Governança Independente');
    expect(html).toContain('firestore.rules');
  });
});
