import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FirebaseGovernanceEthicsView } from '../src/components/FirebaseGovernanceEthicsView';
import { IrregularidadesDossierModal } from '../src/components/IrregularidadesDossierModal';
import { TermsOfUseView } from '../src/components/InformativeViews';
import { getCanonicalUid, resolveNavigationUid } from '../src/utils/urlRouter';

describe('Ética Firebase, Termos de Uso do Firebase, Não Uso da Wikimedia Foundation e Caso Chronus (Special:FirebaseEthics)', () => {
  it('resolve corretamente os atalhos de URL e abas iniciais para firebase-ethics e termos-firebase', () => {
    expect(getCanonicalUid('firebase-ethics', {})).toBe('Special:FirebaseEthics');
    expect(resolveNavigationUid('Special:FirebaseEthics', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
    });
    expect(resolveNavigationUid('Special:FirebaseTerms', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
      initialTab: 'firebase_terms',
    });
    expect(resolveNavigationUid('termos-firebase', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
      initialTab: 'firebase_terms',
    });
    expect(resolveNavigationUid('termos-de-uso-firebase', [], [])).toEqual({
      type: 'view',
      view: 'firebase-ethics',
      initialTab: 'firebase_terms',
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

  it('renderiza os Termos de Uso dos Serviços do Firebase (TF-01 a TF-06) na aba dedicada e em TermsOfUseView', () => {
    const tabHtml = renderToStaticMarkup(
      <FirebaseGovernanceEthicsView
        user={null}
        onNavigate={() => {}}
        initialTab="firebase_terms"
      />
    );

    expect(tabHtml).toContain('Termos de Uso dos Serviços do Firebase na WikiWorldWeb');
    expect(tabHtml).toContain('TF-01');
    expect(tabHtml).toContain('TF-02');
    expect(tabHtml).toContain('TF-03');
    expect(tabHtml).toContain('TF-04');
    expect(tabHtml).toContain('TF-05');
    expect(tabHtml).toContain('TF-06');

    const termsHtml = renderToStaticMarkup(
      <TermsOfUseView
        user={null}
        pages={[]}
        articles={[]}
        onNavigateToArticle={() => {}}
        onOpenEditor={() => {}}
        onNavigate={() => {}}
      />
    );

    expect(termsHtml).toContain('Termos de Uso, Licenciamento e Serviços do Firebase');
    expect(termsHtml).toContain('4. Termos de Uso dos Serviços do Firebase (Cloud Firestore &amp; Auth)');
    expect(termsHtml).toContain('TF-01');
    expect(termsHtml).toContain('TF-06');
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
    expect(html).toContain('wikizero.wazzimagiygg.com');
    expect(html).toContain('Chronus');
    expect(html).toContain('Johannnes89');
    expect(html).toContain('LittleSunshine');
    expect(html).toContain('Teles');
    expect(html).toContain('Conde Edmond Dantès');
    expect(html).toContain('Verificação Web em Tempo Real (Google Search Grounding)');
    expect(html).toContain('gemini-4-hydrogen');
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

  it('renderiza o Dossiê 4 (Investigação LGPD e Marco Civil — 41 Páginas) em texto e quadro comparativo', () => {
    const textHtml = renderToStaticMarkup(
      <IrregularidadesDossierModal
        isOpen={true}
        onClose={() => {}}
        initialDocument="lgpd_mci"
        initialTab="text"
      />
    );
    expect(textHtml).toContain('Investigação LGPD e Marco Civil — WMF e Wikipédia (41 Páginas)');
    expect(textHtml).toContain('Exposição de Endereços IP e Passivo Histórico');
    expect(textHtml).toContain('Ausência de Encarregado de Dados (DPO) no Brasil');
    expect(textHtml).toContain('Divergência na Retenção de Logs de Acesso');
    expect(textHtml).toContain('Inexistência de Representação Legal no Brasil');
    expect(textHtml).toContain('/Investigacao-LGPD-e-Marco-Civil-WMF-e-Wikipedia.pdf');
    expect(textHtml).toContain('https://wazzimagiygg.com/Investiga%C3%A7%C3%A3o%20LGPD%20e%20Marco%20Civ%C3%ADl%20WMF%20e%20Wikip%C3%A9dia.pdf');

    const tableHtml = renderToStaticMarkup(
      <IrregularidadesDossierModal
        isOpen={true}
        onClose={() => {}}
        initialDocument="lgpd_mci"
        initialTab="table"
      />
    );
    expect(tableHtml).toContain('Wikipédia / WMF (Investigação 41 Págs)');
    expect(tableHtml).toContain('WikiWorldWeb (wikizero.wazzimagiygg.com)');
    expect(tableHtml).toContain('Resolução CD/ANPD nº 18/2024');
  });
});
