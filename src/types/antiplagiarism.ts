/**
 * @file src/types/antiplagiarism.ts
 * @description Definições de tipos para o Sistema Antiplágio & Análise de TCC (4.1.1.8P.5 & 4.1.1.RW.5)
 */

export type PlagiarismRiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico';

export type ParagraphStatus =
  | 'regular'
  | 'atencao_orientador'
  | 'inconformidade_abnt'
  | 'risco_plagio_critico';

export interface MatchingExcerpt {
  matchedText: string;
  sourceName: string;
  sourceUrl?: string;
  sourceType: 'wikipedia' | 'firestore' | 'crossref' | 'openalex' | 'web';
  shingleCount?: number;
  containmentPercent?: number;
}

export interface SourceStatusReport {
  source: 'wikipedia' | 'firestore' | 'crossref' | 'openalex' | 'google_grounding';
  displayName: string;
  status: 'success' | 'failed' | 'timeout' | 'no_matches';
  itemsCount: number;
  error?: string;
  latencyMs: number;
}

export interface MatchedWebSource {
  title: string;
  url: string;
  snippet?: string;
  similarityPercent?: number;
  similarity?: number;
  domain?: string;
  sourceType?: 'academic_paper' | 'web_search' | 'encyclopedia' | 'institutional' | 'wikipedia' | 'firestore' | 'crossref' | 'openalex' | 'web';
}

export interface ParagraphAnalysisItem {
  id: string;
  paragraphNumber: number;
  excerpt: string;
  wordCount: number;
  status: ParagraphStatus;
  issueType:
    | 'sem_citacao'
    | 'citacao_direta_sem_pagina'
    | 'citacao_longa_sem_recuo'
    | 'possivel_parafrase_nao_atribuida'
    | 'copia_literal_suspeita'
    | 'referencia_incompleta'
    | 'nenhum';
  description: string;
  advisorNote: string;
  suggestedCorrection: string;
  abntRule: string;
  similarityPercentage?: number | null;
  containmentPercent?: number | null;
  jaccardPercent?: number | null;
  isLegitimateCitation?: boolean;
  citationDetails?: {
    author?: string;
    year?: string;
    page?: string;
    quotedText?: string;
  };
  matchingExcerpts?: MatchingExcerpt[];
  characteristicPhrases?: string[];
  matchedSourceHint?: string;
  matchedSources?: MatchedWebSource[];
}

export interface AntiplagiarismReport {
  id: string;
  analyzedAt: string;
  tccTitle: string;
  studentName?: string;
  advisorName?: string;
  course?: string;
  totalWords: number;
  totalParagraphs: number;
  overallSimilarityScore?: number | null; // ponderado pelos containments reais
  weightedSimilarityScore?: number | null;
  originalityScore?: number | null;
  riskLevel: PlagiarismRiskLevel;
  advisorAttentionCount: number;
  abntIssuesCount: number;
  paragraphs: ParagraphAnalysisItem[];
  executiveSummary: string;
  generalRecommendations: string[];
  usedEngine: 'gemini_ai' | 'heuristic_syntax' | 'gemini_search_grounding' | 'deterministic_shingles_sources';
  engineLabel?: string;
  isFallback?: boolean;
  fallbackReason?: string;
  webGroundingSourcesCount?: number;
  groundingWebSources?: MatchedWebSource[];
  queriedSourcesStatus?: SourceStatusReport[];
  ocrProcessedPages?: number;
  formatNotice?: string;
  userUid?: string;
  userEmail?: string;
  advisorEmail?: string;
  advisorUid?: string;
  optionsUsed?: {
    similarityAlertThreshold?: number;
    abntStrictMode?: boolean;
    geminiDeepSemantic?: boolean;
  };
}

