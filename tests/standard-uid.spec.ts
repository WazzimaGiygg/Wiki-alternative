/**
 * @file tests/standard-uid.spec.ts
 * @description Testes automatizados da Aplicação Primária de UIDs Padronizados (Recurso 4.1.1.54.7)
 * Valida a integridade, unicidade e resolução dos 161 identificadores padronizados (1.0.0-BD.001 a 1.0.0-WZ.161).
 */

import { describe, it, expect } from 'vitest';
import {
  STANDARD_UID_LIST,
  STANDARD_UID_MAP,
  getStandardEntryByUid,
  getStandardUidByLabel,
  getStandardUidDataset,
  isStandardUidPattern,
} from '../src/utils/standardUidRegistry';
import { resolveNavigationUid, getFriendlyUidLabel } from '../src/utils/urlRouter';

describe('Suíte de Testes da Aplicação Primária de UIDs (4.1.1.54.7)', () => {
  describe('Integridade e Unicidade do Catálogo de 161 UIDs', () => {
    it('deve conter exatamente 161 identificadores padronizados registrados', () => {
      expect(STANDARD_UID_LIST).toHaveLength(161);
      expect(Object.keys(STANDARD_UID_MAP)).toHaveLength(161);
    });

    it('não deve conter nenhum UID duplicado no catálogo', () => {
      const uids = STANDARD_UID_LIST.map((e) => e.uid);
      const uniqueUids = new Set(uids);
      expect(uniqueUids.size).toBe(161);
    });

    it('todos os 161 UIDs devem obedecer estritamente à sintaxe canônica 1.0.0-XX.YYY', () => {
      for (const entry of STANDARD_UID_LIST) {
        expect(isStandardUidPattern(entry.uid)).toBe(true);
        expect(entry.name).toBeTruthy();
        expect(entry.category).toBeTruthy();
      }
    });

    it('deve ter 1.0.0-BD.001 como primeira entrada e 1.0.0-WZ.161 como última entrada', () => {
      expect(STANDARD_UID_LIST[0].uid).toBe('1.0.0-BD.001');
      expect(STANDARD_UID_LIST[0].name).toBe('Cloud Firestore');

      expect(STANDARD_UID_LIST[160].uid).toBe('1.0.0-WZ.161');
    });
  });

  describe('Consultas e Mapeamento de UIDs Chave', () => {
    it('deve recuperar corretamente entradas de infraestrutura e frameworks', () => {
      const firestore = getStandardEntryByUid('1.0.0-BD.001');
      expect(firestore).toBeDefined();
      expect(firestore?.name).toBe('Cloud Firestore');

      const react = getStandardEntryByUid('1.0.0-RE.007');
      expect(react).toBeDefined();
      expect(react?.name).toBe('React 19');

      const ts = getStandardEntryByUid('1.0.0-TS.008');
      expect(ts).toBeDefined();
      expect(ts?.name).toBe('TypeScript');

      const server = getStandardEntryByUid('1.0.0-SV.017');
      expect(server).toBeDefined();
      expect(server?.name).toBe('server.ts');
    });

    it('deve recuperar corretamente o lema e estatísticas da Página Principal', () => {
      const grego = getStandardEntryByUid('1.0.0-WZ.082');
      expect(grego?.name).toBe('«Όχι, ο Χρόνος δεν είναι ο άρχοντας της γνώσης!»');

      const pt = getStandardEntryByUid('1.0.0-WZ.083');
      expect(pt?.name).toBe('"Não, o Tempo não é o senhor do conhecimento!"');

      const enciclop = getStandardEntryByUid('1.0.0-WZ.084');
      expect(enciclop?.name).toBe('Enciclopédia aberta');

      const colecoes = getStandardEntryByUid('1.0.0-WZ.085');
      expect(colecoes?.name).toContain('Coleções Ativas');

      const artigos = getStandardEntryByUid('1.0.0-WZ.086');
      expect(artigos?.name).toContain('Artigos Publicados');

      const leituras = getStandardEntryByUid('1.0.0-WZ.087');
      expect(leituras?.name).toContain('Leituras Totais');
    });

    it('deve ser tolerante a maiúsculas/minúsculas e espaços em getStandardEntryByUid', () => {
      const entryLower = getStandardEntryByUid('1.0.0-bd.001');
      expect(entryLower?.name).toBe('Cloud Firestore');

      const entrySpaced = getStandardEntryByUid('  1.0.0-RE.007  ');
      expect(entrySpaced?.name).toBe('React 19');
    });

    it('deve buscar o UID a partir do nome da informação via getStandardUidByLabel', () => {
      expect(getStandardUidByLabel('Cloud Firestore')).toBe('1.0.0-BD.001');
      expect(getStandardUidByLabel('React 19')).toBe('1.0.0-RE.007');
      expect(getStandardUidByLabel('TypeScript')).toBe('1.0.0-TS.008');
    });

    it('deve gerar dataset HTML seguro para inclusão sem impacto visual', () => {
      const ds = getStandardUidDataset('1.0.0-BD.001');
      expect(ds['data-uid']).toBe('1.0.0-BD.001');
      expect(ds['data-uid-name']).toBe('Cloud Firestore');
      expect(ds.title).toContain('1.0.0-BD.001');
    });
  });

  describe('Integração com o Roteador de URLs (urlRouter)', () => {
    it('deve resolver UIDs padronizados para suas respectivas vistas na aplicação', () => {
      const resFirestore = resolveNavigationUid('1.0.0-BD.001');
      expect(resFirestore.type).toBe('view');
      if (resFirestore.type === 'view') {
        expect(resFirestore.view).toBe('admin-firebase');
      }

      const resOffline = resolveNavigationUid('1.0.0-PW.014');
      expect(resOffline.type).toBe('view');
      if (resOffline.type === 'view') {
        expect(resOffline.view).toBe('offline');
      }

      const resHub = resolveNavigationUid('1.0.0-RC.015');
      expect(resHub.type).toBe('view');
      if (resHub.type === 'view') {
        expect(resHub.view).toBe('hub');
      }
    });

    it('deve exibir nome amigável com UID incluído via getFriendlyUidLabel', () => {
      const label = getFriendlyUidLabel('1.0.0-BD.001');
      expect(label).toBe('Cloud Firestore (1.0.0-BD.001)');

      const labelReact = getFriendlyUidLabel('1.0.0-RE.007');
      expect(labelReact).toBe('React 19 (1.0.0-RE.007)');
    });
  });
});
