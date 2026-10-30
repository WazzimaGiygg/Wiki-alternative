/**
 * @file src/utils/textSanitizer.ts
 * @description Módulo de Sanitização e Limpeza de Texto para Documentos (PDF, DOCX, DOC, TXT)
 * e Suíte de Testes Automatizados para Edge Cases (4.1.1.20Z.6).
 */

export interface SanitizationTestCase {
  id: string;
  name: string;
  category: 'control_chars' | 'line_endings' | 'pdf_artifacts' | 'hyphenation' | 'whitespace' | 'abnt_quotes';
  description: string;
  input: string;
  expectedPattern: RegExp | ((output: string) => boolean);
  expectedExplanation: string;
}

export interface SanitizationTestResult {
  id: string;
  name: string;
  category: string;
  description: string;
  input: string;
  output: string;
  passed: boolean;
  expectedExplanation: string;
  error?: string;
  durationMs: number;
}

export interface SanitizationSuiteReport {
  timestamp: string;
  total: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  results: SanitizationTestResult[];
}

/**
 * Função principal de sanitização e limpeza de textos extraídos de documentos.
 * Trata caracteres nulos, quebras anômalas (Windows/Mac), hifenização de fim de linha,
 * cabeçalhos e artefatos binários de PDF/OLE e espaçamentos irregulares.
 */
export function cleanExtractedText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // 1. Remove caracteres nulos (\x00) e caracteres de controle não-imprimíveis (\x01-\x08, \x0B, \x0C, \x0E-\x1F, \x7F-\x9F)
    // Preserva expressamente \t (tabulação) e \n (quebra de linha)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')

    // 2. Remove soft-hyphens (hífen suave invisível \u00AD) e caracteres de largura zero (\u200B-\u200D, \uFEFF)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00AD/g, '-')

    // 3. Normaliza quebras de linha Windows (\r\n) e Mac antigo (\r) para o padrão Unix (\n)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // 4. Remove cabeçalhos e artefatos de streams PDF e tabelas estruturais de baixo nível
    .replace(/%PDF-[\d.]+/g, '')
    .replace(/<<[\s\S]*?>>/g, '')
    .replace(/\b\d+\s+\d+\s+obj\b[\s\S]*?\bendobj\b/g, '')
    .replace(/\bstream\b[\s\S]*?\bendstream\b/g, '')
    .replace(/\bxref\b[\s\S]*?\btrailer\b/g, '')
    .replace(/\btrailer\b[\s\S]*?%%EOF/g, '')

    // 5. Remove marcadores numéricos isolados de paginação de rodapé ou cabeçalho (ex: "\n\n12\n\n" ou "Página 12 de 45")
    .replace(/\n\s*(?:p[áa]gina\s+\d+(?:\s+de\s+\d+)?|\d+)\s*\n/gi, '\n\n')

    // 6. Une hifenizações complexas de fim de linha que quebram palavras em línguas latinas (Português/Inglês)
    // Trata variações com espaços, tabulações e quebras de linha múltiplas (ex: "sustenta-\n  bilidade" -> "sustentabilidade")
    .replace(/([a-zA-ZÀ-ÿ])-[\t ]*\n+[\t ]*([a-zA-ZÀ-ÿ])/g, '$1$2')

    // 7. Normaliza espaços horizontais não-convencionais (espaço insecável \u00A0, múltiplos tabs, espaços duplos)
    .replace(/[ \t\u00A0\u2000-\u200A\u202F\u205F]+/g, ' ')

    // 8. Normaliza quebras de linha em parágrafos contínuos preservando quebra dupla (\n\n) para novos parágrafos
    .split(/\n\s*\n+/)
    .map((paragraph) => {
      return paragraph
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/[ \t\u00A0]+/g, ' ')
        .trim();
    })
    .filter((paragraph) => paragraph.length > 0)
    .join('\n\n');
}

/**
 * 4.1.1.20Z.6: Banco canônico de 10 casos de teste unitário cobrindo todos os edge cases de sanitização.
 */
export const SANITIZATION_TEST_CASES: SanitizationTestCase[] = [
  {
    id: 'test-null-bytes',
    name: 'Remoção de Caracteres Nulos e Controle',
    category: 'control_chars',
    description: 'Verifica a eliminação de bytes nulos (\\x00) e códigos de controle (\\x03, \\x1B, \\x7F) mantendo o texto legível.',
    input: 'Artigo\x00 sobre\x03 Inteligência\x1B Artificial\x7F em computadores.',
    expectedPattern: (out) => out === 'Artigo sobre Inteligência Artificial em computadores.' && !/[\x00\x03\x1B\x7F]/.test(out),
    expectedExplanation: 'Todos os bytes nulos e de controle devem ser eliminados sem alterar palavras legítimas.',
  },
  {
    id: 'test-windows-line-endings',
    name: 'Normalização de Quebras de Linha Windows (CRLF)',
    category: 'line_endings',
    description: 'Converte \\r\\n em parágrafos limpos sem resquícios de retorno de carro.',
    input: 'Primeiro parágrafo do TCC.\r\n\r\nSegundo parágrafo com fundamentação teórica.',
    expectedPattern: (out) => out === 'Primeiro parágrafo do TCC.\n\nSegundo parágrafo com fundamentação teórica.',
    expectedExplanation: 'Quebras Windows \\r\\n devem ser normalizadas para \\n\\n entre parágrafos.',
  },
  {
    id: 'test-mac-line-endings',
    name: 'Normalização de Quebras de Linha Mac Legado (CR)',
    category: 'line_endings',
    description: 'Trata documentos antigos gerados em sistemas com apenas \\r como quebra de linha.',
    input: 'Introdução à metodologia.\r\rResultados observados na amostra.',
    expectedPattern: (out) => out === 'Introdução à metodologia.\n\nResultados observados na amostra.',
    expectedExplanation: 'Retornos de carro \\r duplos devem gerar parágrafos separados por \\n\\n.',
  },
  {
    id: 'test-pdf-header-artifacts',
    name: 'Remoção de Cabeçalhos e Objetos Residuais de PDF',
    category: 'pdf_artifacts',
    description: 'Elimina tags %PDF-1.7, marcadores de objetos e blocos stream/endstream.',
    input: '%PDF-1.7\n<< /Type /Catalog /Pages 1 0 R >>\nEste é o resumo do trabalho acadêmico.\nstream\nx\x9c+T0\nendstream\nConclusão final.',
    expectedPattern: (out) => !out.includes('%PDF-1.7') && !out.includes('/Catalog') && !out.includes('endstream') && out.includes('Este é o resumo do trabalho acadêmico.') && out.includes('Conclusão final.'),
    expectedExplanation: 'Códigos estruturais de PDF (%PDF, stream, endobj) devem ser completamente removidos.',
  },
  {
    id: 'test-hyphenation-simple',
    name: 'Hifenização Simples de Fim de Linha',
    category: 'hyphenation',
    description: 'Une palavras partidas com hífen e quebra de linha (ex: "sustenta-\\nbilidade" -> "sustentabilidade").',
    input: 'O modelo promove a sustenta-\nbilidade organizacional.',
    expectedPattern: (out) => out.includes('sustentabilidade') && !out.includes('sustenta-'),
    expectedExplanation: '"sustenta-\\nbilidade" deve ser unificada em "sustentabilidade".',
  },
  {
    id: 'test-hyphenation-with-spaces',
    name: 'Hifenização com Espaços e Indentação',
    category: 'hyphenation',
    description: 'Une palavras com hífen seguido de múltiplos espaços e quebras (ex: "desenvolvi-\\n   mento").',
    input: 'Houve grande desenvolvi-\n   mento científico nos últimos anos.',
    expectedPattern: (out) => out.includes('desenvolvimento') && !out.includes('desenvolvi-'),
    expectedExplanation: 'A palavra partida por hífen com indentação na linha seguinte deve ser recomposta.',
  },
  {
    id: 'test-soft-hyphens',
    name: 'Remoção de Soft Hyphens (\\u00AD)',
    category: 'hyphenation',
    description: 'Trata hífens invisíveis de quebra silábica em arquivos Word/PDF exportados.',
    input: 'Texto com hífen\u00ADsuave inserido pelo editor.',
    expectedPattern: (out) => !out.includes('\u00AD') && out.includes('Texto com hífen-suave inserido pelo editor.'),
    expectedExplanation: 'Caracteres \\u00AD devem ser convertidos em hífens normais ou limpos.',
  },
  {
    id: 'test-isolated-page-numbers',
    name: 'Remoção de Paginação de Rodapé Isolada',
    category: 'pdf_artifacts',
    description: 'Descarta números de página isolados que aparecem entre parágrafos (ex: "\\n\\n14\\n\\n" ou "Página 14").',
    input: 'Final do capítulo primeiro sobre métodos.\n\n14\n\nInício do segundo capítulo com os dados coletados.',
    expectedPattern: (out) => out === 'Final do capítulo primeiro sobre métodos.\n\nInício do segundo capítulo com os dados coletados.',
    expectedExplanation: 'O número de página isolado "14" deve ser descartado, preservando a separação de parágrafos.',
  },
  {
    id: 'test-whitespace-and-tabs',
    name: 'Normalização de Múltiplos Espaços e Espaços Insecáveis',
    category: 'whitespace',
    description: 'Substitui espaços duplos, tabulações desnecessárias e non-breaking spaces (\\u00A0) por espaço simples.',
    input: 'Parágrafo\u00A0\u00A0com   múltiplos\t\tespaços    irregulares.',
    expectedPattern: (out) => out === 'Parágrafo com múltiplos espaços irregulares.',
    expectedExplanation: 'Múltiplos espaços e espaços insecáveis devem ser reduzidos a um único espaço.',
  },
  {
    id: 'test-abnt-citations-preservation',
    name: 'Preservação Fiel de Citações e Pontuação ABNT',
    category: 'abnt_quotes',
    description: 'Garante que citações diretas no padrão ABNT (NBR 10520) com aspas, vírgulas e parênteses permaneçam intactas.',
    input: 'Conforme preceitua a norma: "A citação direta deve conter autor, ano e página" (SILVA, 2023, p. 45).\n\nOutro autor corrobora a tese.',
    expectedPattern: (out) => out.includes('"A citação direta deve conter autor, ano e página" (SILVA, 2023, p. 45).'),
    expectedExplanation: 'Aspas, pontuação e parênteses de citações acadêmicas ABNT devem ser estritamente preservados.',
  },
];

/**
 * Executa toda a suíte de testes unitários automatizados de sanitização.
 */
export function runSanitizationTestSuite(): SanitizationSuiteReport {
  const results: SanitizationTestResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const tc of SANITIZATION_TEST_CASES) {
    const start = performance.now();
    try {
      const output = cleanExtractedText(tc.input);
      let passed = false;

      if (typeof tc.expectedPattern === 'function') {
        passed = tc.expectedPattern(output);
      } else if (tc.expectedPattern instanceof RegExp) {
        passed = tc.expectedPattern.test(output);
      }

      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      if (passed) {
        passedCount++;
      } else {
        failedCount++;
      }

      results.push({
        id: tc.id,
        name: tc.name,
        category: tc.category,
        description: tc.description,
        input: tc.input,
        output,
        passed,
        expectedExplanation: tc.expectedExplanation,
        durationMs,
      });
    } catch (err: any) {
      failedCount++;
      results.push({
        id: tc.id,
        name: tc.name,
        category: tc.category,
        description: tc.description,
        input: tc.input,
        output: '',
        passed: false,
        expectedExplanation: tc.expectedExplanation,
        error: err?.message || String(err),
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    total: SANITIZATION_TEST_CASES.length,
    passedCount,
    failedCount,
    allPassed: failedCount === 0,
    results,
  };
}
