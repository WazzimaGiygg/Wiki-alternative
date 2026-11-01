/**
 * @file tests/similarity-cases.spec.ts
 * @description Testes automatizados com Vitest para casos conhecidos do motor de similaridade:
 * 1. Texto copiado literalmente da Wikipédia (Score Alto / Contenção Alta)
 * 2. Texto parafraseado (Score Moderado / Baixo)
 * 3. Texto original autoral (Score Baixo / Próximo de Zero)
 * 4. Ponderação geral por palavras
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  generateShingles,
  tokenizeWords,
  calculateContainment,
  calculateJaccard,
  prepareSourceDocument,
  analyzeParagraphDeterministically,
  calculateWeightedOverallSimilarity,
  detectLegitimateAbntCitation,
} from '../src/services/similarityEngine';

describe('Suíte de Testes Automatizados do Motor de Similaridade (Vitest)', () => {
  // Trecho canônico extraído da Wikipédia lusófona sobre Inteligência Artificial
  const wikipediaSourceText = `
    Inteligência artificial é um campo de estudo multidisciplinar que abrange várias áreas do conhecimento.
    Desenvolvida para simular a capacidade humana de raciocinar, perceber, tomar decisões e resolver problemas,
    a inteligência artificial combina algoritmos sofisticados com grandes volumes de dados para identificar padrões
    e efetuar previsões com elevado grau de acurácia.
  `;

  const preparedWikipediaSource = prepareSourceDocument(
    'Inteligência Artificial - Wikipédia Lusófona',
    wikipediaSourceText,
    'https://pt.wikipedia.org/wiki/Intelig%C3%AAncia_artificial',
    'wikipedia',
    5,
    4
  );

  const sources = [preparedWikipediaSource];

  it('Caso 1: Texto copiado literalmente da Wikipédia deve apresentar ALTO score de similaridade/containment', () => {
    // Cópia literal direta de parágrafo da fonte
    const literalCopyText =
      'A inteligência artificial combina algoritmos sofisticados com grandes volumes de dados para identificar padrões e efetuar previsões com elevado grau de acurácia.';

    const result = analyzeParagraphDeterministically('p-copy', 1, literalCopyText, sources, 5, 4);

    // O containment determinístico com shingles k=5 deve ser expressivo (cópia literal >= 70%)
    expect(result.containmentPercent).toBeGreaterThanOrEqual(70);
    expect(result.matchingExcerpts.length).toBeGreaterThan(0);
    expect(result.matchedSources.length).toBeGreaterThan(0);
    expect(result.matchedSources[0].title).toContain('Wikipédia');
    expect(result.matchingExcerpts[0].sourceName).toContain('Wikipédia');
    expect(result.isLegitimateCitation).toBe(false);
  });

  it('Caso 2: Texto parafraseado deve apresentar score moderado/baixo de similaridade', () => {
    // Paráfrase com reestruturação sintática e substituição parcial de termos
    const paraphrasedText =
      'Sistemas computacionais inteligentes utilizam métodos matemáticos avançados aplicados a extensos conjuntos de informações para reconhecer tendências e projetar cenários futuros.';

    const result = analyzeParagraphDeterministically('p-para', 2, paraphrasedText, sources, 5, 4);

    // Na paráfrase, como a sintaxe dos 5-gramas mudou, a contenção estrita de 5 palavras cai bruscamente
    expect(result.containmentPercent).toBeLessThan(35);
  });

  it('Caso 3: Texto original autoral deve apresentar score BAIXO (próximo de zero)', () => {
    // Texto acadêmico inédito focado em metodologia e coleta de campo própria
    const originalText =
      'Para avaliar o impacto pedagógico nas turmas de graduação em engenharia de software da universidade, realizamos entrevistas semiestruturadas com quarenta e dois discentes durante o segundo semestre letivo.';

    const result = analyzeParagraphDeterministically('p-orig', 3, originalText, sources, 5, 4);

    // Nenhuma coincidência de 5 palavras contínuas com o verbete da Wikipédia
    expect(result.containmentPercent).toBeLessThanOrEqual(5);
    expect(result.matchingExcerpts.length).toBe(0);
  });

  it('Caso 4: Score geral ponderado do documento copiado é ALTO e do documento original é BAIXO', () => {
    // Documento 1: Composto majoritariamente por parágrafos copiados
    const copiedParagraph1 = analyzeParagraphDeterministically(
      'c-1',
      1,
      'Desenvolvida para simular a capacidade humana de raciocinar, perceber, tomar decisões e resolver problemas com elevado grau de acurácia.',
      sources,
      5,
      4
    );
    const copiedParagraph2 = analyzeParagraphDeterministically(
      'c-2',
      2,
      'A inteligência artificial combina algoritmos sofisticados com grandes volumes de dados para identificar padrões e efetuar previsões com elevado grau de acurácia.',
      sources,
      5,
      4
    );

    const docCopiedAnalysis = calculateWeightedOverallSimilarity([copiedParagraph1, copiedParagraph2]);

    // Documento 2: Composto por parágrafos originais
    const originalParagraph1 = analyzeParagraphDeterministically(
      'o-1',
      1,
      'Nossa pesquisa de campo examinou detalhadamente a adesão dos estudantes aos questionários qualitativos aplicados pelos professores do departamento de ciências exatas.',
      sources,
      5,
      4
    );
    const originalParagraph2 = analyzeParagraphDeterministically(
      'o-2',
      2,
      'Os dados quantitativos foram tabulados através de scripts estatísticos próprios desenvolvidos pelo grupo de iniciação científica durante o projeto piloto.',
      sources,
      5,
      4
    );

    const docOriginalAnalysis = calculateWeightedOverallSimilarity([originalParagraph1, originalParagraph2]);

    // Verificação estrita: score do copiado é alto e do original é baixo
    expect(docCopiedAnalysis.overallSimilarityScore).toBeGreaterThanOrEqual(60);
    expect(docOriginalAnalysis.overallSimilarityScore).toBeLessThanOrEqual(10);
    expect(docCopiedAnalysis.overallSimilarityScore).toBeGreaterThan(docOriginalAnalysis.overallSimilarityScore);
  });

  it('Caso 5: Citação direta legítima com autor, ano e página (NBR 10520) deve ser isenta de pontuação de plágio', () => {
    const citationText =
      'Conforme aponta a literatura clássica, "a inteligência artificial combina algoritmos sofisticados com grandes volumes de dados para identificar padrões" (RUSSELL; NORVIG, 2022, p. 45).';

    const result = analyzeParagraphDeterministically('p-cite', 5, citationText, sources, 5, 4);

    // Deve reconhecer formalmente a citação e fixar contenção em 0%
    expect(result.isLegitimateCitation).toBe(true);
    expect(result.containmentPercent).toBe(0);
    expect(result.citationDetails?.author).toBeDefined();
    expect(result.citationDetails?.year).toBe('2022');
    expect(result.citationDetails?.page).toBe('45');
  });
});
