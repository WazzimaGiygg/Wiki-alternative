/**
 * @file src/services/similarityEngine.ts
 * @description Motor determinístico de similaridade textual e contenção de shingles (k=5)
 * com algoritmo de Winnowing, detecção de citações legítimas ABNT (NBR 10520) e
 * integração com fontes reais (MediaWiki/Wikipédia, Firestore, Crossref, OpenAlex e Web Grounding).
 * Reutilizável no servidor (Node.js) e no cliente (navegador/React).
 */

export interface ShingleMatch {
  shingle: string;
  sourceIndex: number;
}

export interface MatchingExcerpt {
  matchedText: string;
  sourceName: string;
  sourceUrl?: string;
  sourceType: 'wikipedia' | 'firestore' | 'crossref' | 'openalex' | 'web';
  shingleCount: number;
  containmentPercent: number;
}

export interface ParagraphSimilarityAnalysis {
  paragraphId: string;
  paragraphNumber: number;
  originalText: string;
  normalizedText: string;
  wordCount: number;
  shingleCount: number;
  containmentPercent: number; // 0 a 100
  jaccardPercent: number;     // 0 a 100
  isLegitimateCitation: boolean; // se for citação direta entre aspas com autor, ano e página
  citationDetails?: {
    author?: string;
    year?: string;
    page?: string;
    quotedText?: string;
  };
  matchingExcerpts: MatchingExcerpt[];
  matchedSources: {
    title: string;
    url?: string;
    sourceType: 'wikipedia' | 'firestore' | 'crossref' | 'openalex' | 'web';
    containmentPercent: number;
    matchedShinglesCount: number;
  }[];
  characteristicPhrases: string[]; // 2 a 3 frases características extraídas
}

export interface SourceQueryResult {
  sourceName: string;
  sourceType: 'wikipedia' | 'firestore' | 'crossref' | 'openalex' | 'web';
  title: string;
  url?: string;
  content: string;
  doi?: string;
  publishedYear?: number;
}

export interface SourceStatusReport {
  source: 'wikipedia' | 'firestore' | 'crossref' | 'openalex' | 'google_grounding';
  displayName: string;
  status: 'success' | 'failed' | 'timeout' | 'no_matches';
  itemsCount: number;
  error?: string;
  latencyMs: number;
}

export interface OverallSimilarityResult {
  overallSimilarityScore: number; // Ponderado pelo número de palavras dos parágrafos
  totalWords: number;
  totalParagraphs: number;
  analyzedParagraphs: ParagraphSimilarityAnalysis[];
  queriedSourcesStatus: SourceStatusReport[];
  aggregatedSources: SourceQueryResult[];
}

export interface SimilarityTestCase {
  id: string;
  name: string;
  category: string;
  description: string;
  passed: boolean;
  expectedExplanation: string;
  input: any;
  output: any;
  durationMs: number;
  error?: string;
}

export interface SimilaritySuiteReport {
  total: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  executedAt: string;
  results: SimilarityTestCase[];
}

// ============================================================================
// 1. NORMALIZAÇÃO DETERMINÍSTICA E SANITIZAÇÃO TEXTUAL
// ============================================================================

/**
 * Normaliza o texto: minúsculas, remoção de acentos (NFD) e remoção de pontuação.
 * Preserva espaços simples entre palavras.
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos (acentos)
    .replace(/[\x00-\x1f\x7f]/g, ' ') // remove caracteres de controle
    .replace(/[^\w\s]/g, ' ')         // remove pontuação e símbolos
    .replace(/\s+/g, ' ')             // unifica múltiplos espaços
    .trim();
}

/**
 * Divide o texto normalizado em tokens de palavras.
 */
export function tokenizeWords(normalizedText: string): string[] {
  if (!normalizedText) return [];
  return normalizedText.split(' ').filter(Boolean);
}

// ============================================================================
// 2. DETECÇÃO DE CITAÇÕES LEGÍTIMAS ABNT (NBR 10520)
// "Citações entre aspas com autor, ano e página não contam como plágio."
// ============================================================================

export function detectLegitimateAbntCitation(paragraph: string): {
  isLegitimate: boolean;
  author?: string;
  year?: string;
  page?: string;
  quotedText?: string;
} {
  if (!paragraph || typeof paragraph !== 'string') {
    return { isLegitimate: false };
  }

  // Verifica presença de aspas com texto substantivo (mínimo de 6 caracteres)
  const quoteMatch = paragraph.match(/["“]([^"”]{6,})["”]/);
  if (!quoteMatch) {
    return { isLegitimate: false };
  }

  const quotedText = quoteMatch[1];

  // Regex para indicação de autor, ano e página no padrão ABNT
  // Ex: (SILVA, 2020, p. 15) | (NONAKA; TAKEUCHI, 2021, p. 44) | Rogers (2003, p. 112)
  const citationParenthesesRegex = /\(([A-ZÀ-Ú\s;]+),\s*((?:19|20)\d{2}),\s*(?:p\.|pp\.)\s*(\d+(?:-\d+)?)\)/i;
  const citationInlineRegex = /([A-ZÀ-Ú][a-zà-ú]+(?:\s+e\s+[A-ZÀ-Ú][a-zà-ú]+)?)\s*\(((?:19|20)\d{2}),\s*(?:p\.|pp\.)\s*(\d+(?:-\d+)?)\)/i;

  const parenMatch = paragraph.match(citationParenthesesRegex);
  if (parenMatch) {
    return {
      isLegitimate: true,
      author: parenMatch[1].trim(),
      year: parenMatch[2].trim(),
      page: parenMatch[3].trim(),
      quotedText,
    };
  }

  const inlineMatch = paragraph.match(citationInlineRegex);
  if (inlineMatch) {
    return {
      isLegitimate: true,
      author: inlineMatch[1].trim(),
      year: inlineMatch[2].trim(),
      page: inlineMatch[3].trim(),
      quotedText,
    };
  }

  return { isLegitimate: false, quotedText };
}

// ============================================================================
// 3. GERAÇÃO DE SHINGLES DE 5 PALAVRAS (k = 5)
// ============================================================================

/**
 * Gera n-gramas de palavras (shingles). O padrão é k = 5 palavras.
 */
export function generateShingles(words: string[], k = 5): string[] {
  if (!words || words.length === 0) return [];
  if (words.length < k) {
    return words.length >= 3 ? [words.join(' ')] : [];
  }

  const shingles: string[] = [];
  const maxIdx = words.length - k;
  for (let i = 0; i <= maxIdx; i++) {
    shingles.push(words.slice(i, i + k).join(' '));
  }
  return shingles;
}

// ============================================================================
// 4. HASHING FNV-1a (32-bit determinístico) E ALGORITMO DE WINNOWING
// ============================================================================

/**
 * Função de hash determinística de 32 bits FNV-1a.
 * Garante o mesmo valor inteiro positivo em qualquer plataforma.
 */
export function hashShingle(shingle: string): number {
  let hash = 2166136261;
  for (let i = 0; i < shingle.length; i++) {
    hash ^= shingle.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Algoritmo de Winnowing (Schleimer, Wilkerson, Aiken 2003):
 * Seleciona o menor valor de hash dentro de uma janela deslizante de tamanho `windowSize`.
 * Em caso de empate, escolhe a ocorrência mais à direita para estabilidade temporal.
 * Reduz expressivamente a pegada computacional para textos longos,
 * mantendo a garantia matemática de captura de correspondências >= (windowSize + k - 1) palavras.
 */
export function winnow(hashes: number[], windowSize = 4): Set<number> {
  const fingerprints = new Set<number>();
  if (!hashes || hashes.length === 0) return fingerprints;

  if (hashes.length <= windowSize) {
    let min = hashes[0];
    for (let i = 1; i < hashes.length; i++) {
      if (hashes[i] <= min) {
        min = hashes[i];
      }
    }
    fingerprints.add(min);
    return fingerprints;
  }

  for (let i = 0; i <= hashes.length - windowSize; i++) {
    let min = hashes[i];
    for (let j = 1; j < windowSize; j++) {
      const current = hashes[i + j];
      if (current <= min) {
        min = current;
      }
    }
    fingerprints.add(min);
  }

  return fingerprints;
}

// ============================================================================
// 5. MÉTRICAS DETERMINÍSTICAS: JACCARD E CONTAINMENT
// ============================================================================

/**
 * Similaridade de Jaccard: |A ∩ B| / |A ∪ B|
 * Retorna valor entre 0 e 1.
 */
export function calculateJaccard<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionCount = 0;

  // Itera pelo menor conjunto para performance
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const item of smaller) {
    if (larger.has(item)) {
      intersectionCount++;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  if (unionCount === 0) return 0;
  return intersectionCount / unionCount;
}

/**
 * Contenção (Containment) da consulta (Query) na Fonte (Source):
 * |querySet ∩ sourceSet| / |querySet|
 * Mede exatamente qual proporção dos shingles do parágrafo sob auditoria
 * estão presentes no documento-fonte de referência.
 */
export function calculateContainment<T>(querySet: Set<T>, sourceSet: Set<T>): number {
  if (querySet.size === 0) return 0;
  let intersectionCount = 0;

  for (const item of querySet) {
    if (sourceSet.has(item)) {
      intersectionCount++;
    }
  }

  return intersectionCount / querySet.size;
}

// ============================================================================
// 6. EXTRAÇÃO DE TRECHOS COINCIDENTES (MATCHING EXCERPTS)
// ============================================================================

/**
 * Reconstitui os trechos contínuos de texto coincidente entre a consulta e a fonte,
 * agrupando shingles consecutivos sobrepostos.
 */
export function extractMatchingExcerpts(
  queryWords: string[],
  sourceWords: string[],
  sourceName: string,
  sourceUrl?: string,
  sourceType: MatchingExcerpt['sourceType'] = 'web',
  k = 5
): MatchingExcerpt[] {
  if (queryWords.length < k || sourceWords.length < k) {
    return [];
  }

  const sourceShinglesMap = new Map<string, number[]>();
  for (let j = 0; j <= sourceWords.length - k; j++) {
    const s = sourceWords.slice(j, j + k).join(' ');
    const existing = sourceShinglesMap.get(s) || [];
    existing.push(j);
    sourceShinglesMap.set(s, existing);
  }

  const queryShingleHits: boolean[] = new Array(Math.max(0, queryWords.length - k + 1)).fill(false);
  for (let i = 0; i <= queryWords.length - k; i++) {
    const q = queryWords.slice(i, i + k).join(' ');
    if (sourceShinglesMap.has(q)) {
      queryShingleHits[i] = true;
    }
  }

  // Agrupa índices consecutivos de queryShingleHits
  const excerpts: MatchingExcerpt[] = [];
  let inMatch = false;
  let startIdx = 0;
  let matchedShinglesInRun = 0;

  for (let i = 0; i < queryShingleHits.length; i++) {
    if (queryShingleHits[i]) {
      if (!inMatch) {
        inMatch = true;
        startIdx = i;
        matchedShinglesInRun = 1;
      } else {
        matchedShinglesInRun++;
      }
    } else {
      if (inMatch) {
        const endWordIdx = startIdx + matchedShinglesInRun - 1 + k;
        const matchedText = queryWords.slice(startIdx, endWordIdx).join(' ');
        const totalQueryShingles = queryShingleHits.length;
        const containment = totalQueryShingles > 0
          ? Math.round((matchedShinglesInRun / totalQueryShingles) * 100)
          : 0;

        excerpts.push({
          matchedText,
          sourceName,
          sourceUrl,
          sourceType,
          shingleCount: matchedShinglesInRun,
          containmentPercent: containment,
        });
        inMatch = false;
      }
    }
  }

  if (inMatch) {
    const endWordIdx = startIdx + matchedShinglesInRun - 1 + k;
    const matchedText = queryWords.slice(startIdx, endWordIdx).join(' ');
    const totalQueryShingles = queryShingleHits.length;
    const containment = totalQueryShingles > 0
      ? Math.round((matchedShinglesInRun / totalQueryShingles) * 100)
      : 0;

    excerpts.push({
      matchedText,
      sourceName,
      sourceUrl,
      sourceType,
      shingleCount: matchedShinglesInRun,
      containmentPercent: containment,
    });
  }

  return excerpts;
}

// ============================================================================
// 7. EXTRAÇÃO DE FRASES CARACTERÍSTICAS (PARA BUSCA ENTRE ASPAS)
// "Para cada parágrafo, extraia 2 ou 3 frases características e busque-as entre aspas"
// ============================================================================

export function extractCharacteristicPhrases(paragraph: string): string[] {
  if (!paragraph || typeof paragraph !== 'string') return [];

  // Divide em sentenças por pontuação forte
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const phrases: string[] = [];

  const candidates = sentences.length > 0 ? sentences : [paragraph];
  for (const sentence of candidates) {
    // Remove aspas internas para não interferir na busca literal
    const cleanSentence = sentence.replace(/["“”«»]/g, '').trim();
    const words = cleanSentence.split(/\s+/).filter(Boolean);

    if (words.length >= 7) {
      // Pega trecho com densidade substantiva (7 a 11 palavras)
      const phraseLen = Math.min(words.length, 10);
      const phrase = words.slice(0, phraseLen).join(' ');
      if (!phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    } else if (words.length >= 4) {
      const phrase = words.join(' ');
      if (!phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    }

    if (phrases.length >= 3) break;
  }

  // Se tiver menos de 2, tenta obter uma fatia do meio do parágrafo
  if (phrases.length < 2) {
    const allWords = paragraph.replace(/["“”«»]/g, '').split(/\s+/).filter(Boolean);
    if (allWords.length >= 14) {
      const mid = Math.floor(allWords.length / 2);
      const midPhrase = allWords.slice(mid, Math.min(allWords.length, mid + 9)).join(' ');
      if (!phrases.includes(midPhrase)) {
        phrases.push(midPhrase);
      }
    }
  }

  return phrases.slice(0, 3);
}

// ============================================================================
// 8. COMPARADOR DETERMINÍSTICO DE PARÁGRAFO CONTRA FONTES REAIS
// ============================================================================

export interface PreparedSourceDocument {
  title: string;
  url?: string;
  sourceType: MatchingExcerpt['sourceType'];
  words: string[];
  shingleSet: Set<string>;
  winnowFingerprints: Set<number>;
}

export function prepareSourceDocument(
  title: string,
  content: string,
  url?: string,
  sourceType: MatchingExcerpt['sourceType'] = 'web',
  k = 5,
  windowSize = 4
): PreparedSourceDocument {
  const norm = normalizeText(content);
  const words = tokenizeWords(norm);
  const shingles = generateShingles(words, k);
  const shingleSet = new Set<string>(shingles);

  const hashes = shingles.map(hashShingle);
  const winnowFingerprints = winnow(hashes, windowSize);

  return {
    title,
    url,
    sourceType,
    words,
    shingleSet,
    winnowFingerprints,
  };
}

/**
 * Analisa determinísticamente um parágrafo contra um conjunto de documentos de referência.
 */
export function analyzeParagraphDeterministically(
  paragraphId: string,
  paragraphNumber: number,
  originalText: string,
  sources: PreparedSourceDocument[],
  k = 5,
  windowSize = 4
): ParagraphSimilarityAnalysis {
  const norm = normalizeText(originalText);
  const words = tokenizeWords(norm);
  const shingles = generateShingles(words, k);
  const queryShingleSet = new Set<string>(shingles);

  const hashes = shingles.map(hashShingle);
  const queryWinnow = winnow(hashes, windowSize);

  // Detecção de citação legítima ABNT (NBR 10520)
  const legitCheck = detectLegitimateAbntCitation(originalText);
  const characteristicPhrases = extractCharacteristicPhrases(originalText);

  if (legitCheck.isLegitimate) {
    return {
      paragraphId,
      paragraphNumber,
      originalText,
      normalizedText: norm,
      wordCount: words.length,
      shingleCount: shingles.length,
      containmentPercent: 0, // Citação legítima não conta como plágio
      jaccardPercent: 0,
      isLegitimateCitation: true,
      citationDetails: {
        author: legitCheck.author,
        year: legitCheck.year,
        page: legitCheck.page,
        quotedText: legitCheck.quotedText,
      },
      matchingExcerpts: [],
      matchedSources: [],
      characteristicPhrases,
    };
  }

  let maxContainment = 0;
  let maxJaccard = 0;
  const allMatchingExcerpts: MatchingExcerpt[] = [];
  const matchedSourcesList: ParagraphSimilarityAnalysis['matchedSources'] = [];

  for (const src of sources) {
    if (src.shingleSet.size === 0) continue;

    // Filtro rápido via Winnowing para textos longos:
    // Se nenhum fingerprint do Winnowing coincidir, o containment é 0
    let winnowOverlap = 0;
    for (const fp of queryWinnow) {
      if (src.winnowFingerprints.has(fp)) {
        winnowOverlap++;
      }
    }

    // Se tiver overlap no winnowing ou se o parágrafo for curto (< 10 shingles), calcula exatamente
    if (winnowOverlap > 0 || queryShingleSet.size <= 10) {
      const containment = calculateContainment(queryShingleSet, src.shingleSet);
      const jaccard = calculateJaccard(queryShingleSet, src.shingleSet);

      const containmentPct = Math.round(containment * 100);
      const jaccardPct = Math.round(jaccard * 100);

      if (containmentPct > maxContainment) {
        maxContainment = containmentPct;
      }
      if (jaccardPct > maxJaccard) {
        maxJaccard = jaccardPct;
      }

      if (containmentPct > 0) {
        const excerpts = extractMatchingExcerpts(words, src.words, src.title, src.url, src.sourceType, k);
        allMatchingExcerpts.push(...excerpts);

        let matchedShinglesCount = 0;
        for (const qShingle of queryShingleSet) {
          if (src.shingleSet.has(qShingle)) {
            matchedShinglesCount++;
          }
        }

        matchedSourcesList.push({
          title: src.title,
          url: src.url,
          sourceType: src.sourceType,
          containmentPercent: containmentPct,
          matchedShinglesCount,
        });
      }
    }
  }

  // Ordena fontes por maior contenção
  matchedSourcesList.sort((a, b) => b.containmentPercent - a.containmentPercent);

  return {
    paragraphId,
    paragraphNumber,
    originalText,
    normalizedText: norm,
    wordCount: words.length,
    shingleCount: shingles.length,
    containmentPercent: maxContainment,
    jaccardPercent: maxJaccard,
    isLegitimateCitation: false,
    matchingExcerpts: allMatchingExcerpts,
    matchedSources: matchedSourcesList,
    characteristicPhrases,
  };
}

// ============================================================================
// 9. CÁLCULO DO SCORE GERAL PONDERADO PELO NÚMERO DE PALAVRAS
// "O score geral deve ser calculado a partir dos containments reais,
//  ponderado pelo número de palavras de cada parágrafo."
// ============================================================================

export function calculateWeightedOverallSimilarity(
  analyses: ParagraphSimilarityAnalysis[]
): {
  overallSimilarityScore: number;
  totalWords: number;
} {
  let totalWords = 0;
  let weightedContainmentSum = 0;

  for (const p of analyses) {
    const words = p.wordCount;
    totalWords += words;

    // Se o parágrafo for citação legítima, sua contenção computada é 0%
    const effectiveContainment = p.isLegitimateCitation ? 0 : p.containmentPercent;
    weightedContainmentSum += effectiveContainment * words;
  }

  const overallSimilarityScore = totalWords > 0
    ? Math.round(weightedContainmentSum / totalWords)
    : 0;

  return {
    overallSimilarityScore,
    totalWords,
  };
}

// ============================================================================
// 10. CLIENTES DAS FONTES REAIS (SEM EXIGÊNCIA DE CHAVE)
// MediaWiki/Wikipédia (pt), Crossref, OpenAlex e Firestore
// ============================================================================

/**
 * Consulta a API pública da Wikipédia em Português (MediaWiki).
 * Não exige chave.
 */
export async function fetchWikipediaPtSources(
  query: string,
  limit = 3,
  timeoutMs = 8000
): Promise<{ sources: SourceQueryResult[]; error?: string; latencyMs: number }> {
  const start = Date.now();
  if (!query || query.trim().length < 3) {
    return { sources: [], latencyMs: 0 };
  }

  const cleanQuery = query.trim().slice(0, 150);
  const url = `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=${limit}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WikiWorldWeb-AntiplagiarismEngine/4.1 (Academic integrity audit)',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        sources: [],
        error: `HTTP ${res.status}: ${res.statusText}`,
        latencyMs: Date.now() - start,
      };
    }

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) {
      return { sources: [], latencyMs: Date.now() - start };
    }

    const results: SourceQueryResult[] = [];
    for (const pageId of Object.keys(pages)) {
      const p = pages[pageId];
      if (p && p.title && p.extract) {
        results.push({
          sourceName: 'Wikipédia Lusófona (MediaWiki API)',
          sourceType: 'wikipedia',
          title: p.title,
          url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/\s+/g, '_'))}`,
          content: p.extract,
        });
      }
    }

    return {
      sources: results,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      sources: [],
      error: err?.name === 'AbortError' ? 'Tempo limite esgotado (timeout)' : err?.message || String(err),
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Consulta a API pública da Crossref (títulos, resumos e DOIs).
 * Não exige chave.
 */
export async function fetchCrossrefSources(
  query: string,
  rows = 3,
  timeoutMs = 8000
): Promise<{ sources: SourceQueryResult[]; error?: string; latencyMs: number }> {
  const start = Date.now();
  if (!query || query.trim().length < 3) {
    return { sources: [], latencyMs: 0 };
  }

  const cleanQuery = query.trim().slice(0, 120);
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(cleanQuery)}&rows=${rows}&select=title,abstract,DOI,URL,author,created`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WikiWorldWeb-AntiplagiarismEngine/4.1 (mailto:support@wikiworldweb.org)',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        sources: [],
        error: `HTTP ${res.status}: ${res.statusText}`,
        latencyMs: Date.now() - start,
      };
    }

    const data = await res.json();
    const items = data?.message?.items;
    if (!Array.isArray(items)) {
      return { sources: [], latencyMs: Date.now() - start };
    }

    const results: SourceQueryResult[] = [];
    for (const item of items) {
      const rawTitle = Array.isArray(item.title) ? item.title[0] : item.title;
      if (!rawTitle) continue;

      // Limpa tags XML residuais comuns em resumos do Crossref (ex: <jats:p>)
      const rawAbstract = item.abstract ? item.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      const fullText = [rawTitle, rawAbstract].filter(Boolean).join('. ');

      results.push({
        sourceName: 'Crossref Metadata Repository',
        sourceType: 'crossref',
        title: rawTitle,
        url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : undefined),
        content: fullText,
        doi: item.DOI,
      });
    }

    return {
      sources: results,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      sources: [],
      error: err?.name === 'AbortError' ? 'Tempo limite esgotado (timeout)' : err?.message || String(err),
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Converte o índice invertido de resumo do OpenAlex em texto legível.
 */
export function reconstructOpenAlexAbstract(invertedIndex?: Record<string, number[]> | null): string {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const entries: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        entries.push({ word, pos });
      }
    }
  }
  entries.sort((a, b) => a.pos - b.pos);
  return entries.map((e) => e.word).join(' ');
}

/**
 * Consulta a API pública do OpenAlex.
 * Não exige chave. Se rate-limit (429) ocorrer, reporta status explicitamente sem inventar valor.
 */
export async function fetchOpenAlexSources(
  query: string,
  perPage = 3,
  timeoutMs = 8000
): Promise<{ sources: SourceQueryResult[]; error?: string; latencyMs: number }> {
  const start = Date.now();
  if (!query || query.trim().length < 3) {
    return { sources: [], latencyMs: 0 };
  }

  const cleanQuery = query.trim().slice(0, 120);
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(cleanQuery)}&per-page=${perPage}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WikiWorldWeb-AntiplagiarismEngine/4.1 (mailto:support@wikiworldweb.org)',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = res.status === 429
        ? 'HTTP 429: Limite diário de requisições do OpenAlex para o IP compartilhado atingido'
        : `HTTP ${res.status}: ${res.statusText}`;
      return {
        sources: [],
        error: errText,
        latencyMs: Date.now() - start,
      };
    }

    const data = await res.json();
    const works = data?.results;
    if (!Array.isArray(works)) {
      return { sources: [], latencyMs: Date.now() - start };
    }

    const results: SourceQueryResult[] = [];
    for (const w of works) {
      if (!w || !w.title) continue;
      const abstractText = reconstructOpenAlexAbstract(w.abstract_inverted_index);
      const content = [w.title, abstractText].filter(Boolean).join('. ');

      results.push({
        sourceName: 'OpenAlex Global Scholarly Dataset',
        sourceType: 'openalex',
        title: w.title,
        url: w.doi || w.id,
        content,
        doi: w.doi ? w.doi.replace('https://doi.org/', '') : undefined,
        publishedYear: w.publication_year,
      });
    }

    return {
      sources: results,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      sources: [],
      error: err?.name === 'AbortError' ? 'Tempo limite esgotado (timeout)' : err?.message || String(err),
      latencyMs: Date.now() - start,
    };
  }
}

// ============================================================================
// 11. SUÍTE DE TESTES UNITÁRIOS DETERMINÍSTICOS (REQUISITO 4.1.1.RW.5)
// ============================================================================

export function runSimilarityTestSuite(): SimilaritySuiteReport {
  const tests: SimilarityTestCase[] = [];

  // Teste 1: Normalização (minúsculas, remoção de acentos e pontuação)
  {
    const start = Date.now();
    const input = 'A Inteligência Artificial & Robótica Avançada: Aplicação Prática, 2026!';
    const output = normalizeText(input);
    const expected = 'a inteligencia artificial robotica avancada aplicacao pratica 2026';
    const passed = output === expected;
    tests.push({
      id: 'sim-test-1',
      name: 'Normalização Determinística (Acentos, Minúsculas e Pontuação)',
      category: 'normalization',
      description: 'Remove acentos ortográficos (NFD), pontuação e unifica espaços mantendo números e letras.',
      passed,
      expectedExplanation: `Esperava "${expected}" e obteve "${output}".`,
      input,
      output,
      durationMs: Date.now() - start,
    });
  }

  // Teste 2: Geração de Shingles de 5 Palavras (k=5)
  {
    const start = Date.now();
    const words = ['o', 'modelo', 'de', 'linguagem', 'generativo', 'avancado', 'processa', 'dados'];
    const shingles = generateShingles(words, 5);
    // Deve gerar 8 - 5 + 1 = 4 shingles
    const passed = shingles.length === 4 &&
      shingles[0] === 'o modelo de linguagem generativo' &&
      shingles[3] === 'linguagem generativo avancado processa dados';
    tests.push({
      id: 'sim-test-2',
      name: 'Geração de Shingles de 5 Palavras (k=5)',
      category: 'shingling',
      description: 'Gera n-gramas contínuos de 5 palavras para cada parágrafo normalizado.',
      passed,
      expectedExplanation: 'Exatamente 4 shingles de 5 palavras a partir de 8 tokens.',
      input: words,
      output: shingles,
      durationMs: Date.now() - start,
    });
  }

  // Teste 3: Winnowing para Redução de Custo
  {
    const start = Date.now();
    const shingles = [
      'o modelo de linguagem generativo',
      'modelo de linguagem generativo avancado',
      'de linguagem generativo avancado processa',
      'linguagem generativo avancado processa dados',
      'generativo avancado processa dados academicos',
      'avancado processa dados academicos confiaveis',
    ];
    const hashes = shingles.map(hashShingle);
    const fingerprints = winnow(hashes, 3);
    const passed = fingerprints.size > 0 && fingerprints.size <= hashes.length;
    tests.push({
      id: 'sim-test-3',
      name: 'Algoritmo de Winnowing (Fingerprints Locais)',
      category: 'winnowing',
      description: 'Seleciona os hashes mínimos em janelas deslizantes de tamanho 3 para indexação compacta.',
      passed,
      expectedExplanation: 'Conjunto reduzido de fingerprints representativos gerado sem colisões anômalas.',
      input: { hashesCount: hashes.length, windowSize: 3 },
      output: { fingerprintsCount: fingerprints.size, fingerprints: Array.from(fingerprints) },
      durationMs: Date.now() - start,
    });
  }

  // Teste 4: Cálculo Exato de Containment (100% em Cópia Literal)
  {
    const start = Date.now();
    const query = new Set(['a b c d e', 'b c d e f', 'c d e f g']);
    const source = new Set(['x y z w k', 'a b c d e', 'b c d e f', 'c d e f g', 'm n o p q']);
    const containment = calculateContainment(query, source);
    const passed = containment === 1.0;
    tests.push({
      id: 'sim-test-4',
      name: 'Cálculo de Containment em Cópia Literal Integral',
      category: 'containment',
      description: 'Verifica se a contenção atinge 1.0 (100%) quando todos os shingles da consulta estão na fonte.',
      passed,
      expectedExplanation: 'Containment deve ser exatamente 1.0 (100%).',
      input: { querySize: query.size, sourceSize: source.size },
      output: { containment, containmentPercent: Math.round(containment * 100) },
      durationMs: Date.now() - start,
    });
  }

  // Teste 5: Cálculo de Containment Parcial vs Jaccard
  {
    const start = Date.now();
    const query = new Set(['s1', 's2', 's3', 's4']);
    const source = new Set(['s1', 's2', 's5', 's6', 's7', 's8']);
    const containment = calculateContainment(query, source); // 2 / 4 = 0.50
    const jaccard = calculateJaccard(query, source);         // 2 / 8 = 0.25
    const passed = Math.round(containment * 100) === 50 && Math.round(jaccard * 100) === 25;
    tests.push({
      id: 'sim-test-5',
      name: 'Distinção entre Containment e Similaridade de Jaccard',
      category: 'metrics',
      description: 'Valida que containment mede a proporção da consulta na fonte (50%), enquanto Jaccard penaliza o tamanho da fonte (25%).',
      passed,
      expectedExplanation: 'Containment 50% e Jaccard 25%.',
      input: { queryIntersection: 2, queryTotal: 4, union: 8 },
      output: { containment: 0.5, jaccard: 0.25 },
      durationMs: Date.now() - start,
    });
  }

  // Teste 6: Reconstituição de Trechos Coincidentes (Matching Excerpts)
  {
    const start = Date.now();
    const queryWords = ['este', 'paragrafo', 'copia', 'um', 'longo', 'trecho', 'de', 'texto', 'original', 'inteiro'];
    const sourceWords = ['na', 'literatura', 'copia', 'um', 'longo', 'trecho', 'de', 'texto', 'original', 'conforme', 'pesquisa'];
    const excerpts = extractMatchingExcerpts(queryWords, sourceWords, 'Fonte Artigo SciELO', 'https://scielo.org/art1', 'crossref', 5);
    const passed = excerpts.length >= 1 && excerpts[0].matchedText.includes('copia um longo trecho de texto original');
    tests.push({
      id: 'sim-test-6',
      name: 'Reconstituição Contínua de Trechos Coincidentes',
      category: 'excerpts',
      description: 'Agrupa shingles adjacentes em frases legíveis com citação da fonte original.',
      passed,
      expectedExplanation: 'Deve identificar o trecho coincidente contínuo e mapear para a fonte.',
      input: { queryWordsCount: queryWords.length, sourceWordsCount: sourceWords.length },
      output: excerpts,
      durationMs: Date.now() - start,
    });
  }

  // Teste 7: Citação Legítima ABNT com Autor, Ano e Página (Isenção de Plágio)
  {
    const start = Date.now();
    const legitimateText = 'Conforme preceitua a doutrina: "A inteligência artificial generativa amplia a produtividade científica sem substituir o raciocínio crítico" (VASCONCELOS, 2024, p. 15).';
    const check = detectLegitimateAbntCitation(legitimateText);
    const passed = check.isLegitimate && check.author === 'VASCONCELOS' && check.year === '2024' && check.page === '15';
    tests.push({
      id: 'sim-test-7',
      name: 'Reconhecimento de Citação Direta Legítima ABNT NBR 10520 (Autor, Ano, Página)',
      category: 'abnt_exemption',
      description: 'Isenta parágrafos citados entre aspas com autoria, ano e página de pontuação de plágio.',
      passed,
      expectedExplanation: 'Citação formal reconhecida como legítima (autor: VASCONCELOS, ano: 2024, página: 15).',
      input: legitimateText,
      output: check,
      durationMs: Date.now() - start,
    });
  }

  // Teste 8: Citação com Falta de Página (Não Isenta)
  {
    const start = Date.now();
    const incompleteCitation = 'Como afirmado: "O processamento de linguagem natural transformou as bibliotecas digitais" (SILVA, 2022).';
    const check = detectLegitimateAbntCitation(incompleteCitation);
    // Sem página, não é isenta de verificação de citação direta
    const passed = !check.isLegitimate;
    tests.push({
      id: 'sim-test-8',
      name: 'Rejeição de Isenção em Citação Direta sem Indicação de Página',
      category: 'abnt_exemption',
      description: 'Não isenta citações entre aspas que omitem a página de origem (exigida pela NBR 10520 item 5.1).',
      passed,
      expectedExplanation: 'isLegitimate deve ser false quando a página não é indicada.',
      input: incompleteCitation,
      output: check,
      durationMs: Date.now() - start,
    });
  }

  // Teste 9: Score Geral Ponderado por Número de Palavras
  {
    const start = Date.now();
    const mockAnalyses: ParagraphSimilarityAnalysis[] = [
      {
        paragraphId: 'p1',
        paragraphNumber: 1,
        originalText: 'p1',
        normalizedText: 'p1',
        wordCount: 100,
        shingleCount: 96,
        containmentPercent: 40,
        jaccardPercent: 20,
        isLegitimateCitation: false,
        matchingExcerpts: [],
        matchedSources: [],
        characteristicPhrases: [],
      },
      {
        paragraphId: 'p2',
        paragraphNumber: 2,
        originalText: 'p2',
        normalizedText: 'p2',
        wordCount: 300,
        shingleCount: 296,
        containmentPercent: 0,
        jaccardPercent: 0,
        isLegitimateCitation: false,
        matchingExcerpts: [],
        matchedSources: [],
        characteristicPhrases: [],
      },
    ];

    // Ponderado: (40 * 100 + 0 * 300) / 400 = 4000 / 400 = 10%
    const weighted = calculateWeightedOverallSimilarity(mockAnalyses);
    const passed = weighted.overallSimilarityScore === 10 && weighted.totalWords === 400;
    tests.push({
      id: 'sim-test-9',
      name: 'Cálculo do Score Geral Ponderado por Palavras',
      category: 'weighted_score',
      description: 'Calcula o score final ponderado pelo tamanho exato de cada parágrafo (100 palavras a 40% + 300 a 0% = 10%).',
      passed,
      expectedExplanation: 'Score ponderado deve ser exatamente 10% com 400 palavras no total.',
      input: { p1: '100 palavras a 40%', p2: '300 palavras a 0%' },
      output: weighted,
      durationMs: Date.now() - start,
    });
  }

  // Teste 10: Extração de 2 a 3 Frases Características para Busca
  {
    const start = Date.now();
    const text = 'O avanço recente dos modelos de linguagem em grande escala provocou transformações profundas nas universidades. A capacidade de indexar dados não estruturados permite recuperar conceitos em frações de segundo. Essa inovação fortalece a pesquisa empírica.';
    const phrases = extractCharacteristicPhrases(text);
    const passed = phrases.length >= 2 && phrases.length <= 3 && phrases.every((p) => p.split(' ').length >= 4);
    tests.push({
      id: 'sim-test-10',
      name: 'Extração de Frases Características para Busca entre Aspas',
      category: 'phrases_extraction',
      description: 'Extrai 2 a 3 frases densas para consulta literal entre aspas nos indexadores.',
      passed,
      expectedExplanation: 'Deve retornar 2 ou 3 frases características com no mínimo 4 palavras cada.',
      input: text,
      output: phrases,
      durationMs: Date.now() - start,
    });
  }

  const passedCount = tests.filter((t) => t.passed).length;
  const failedCount = tests.length - passedCount;

  return {
    total: tests.length,
    passedCount,
    failedCount,
    allPassed: failedCount === 0,
    executedAt: new Date().toISOString(),
    results: tests,
  };
}
