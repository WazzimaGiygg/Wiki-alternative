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

export interface MatchedWebSource {
  title: string;
  url: string;
  snippet?: string;
  similarityPercent?: number;
  similarity?: number;
  domain?: string;
  sourceType?: 'academic_paper' | 'web_search' | 'encyclopedia' | 'institutional';
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
  similarityPercentage: number;
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
  overallSimilarityScore: number; // 0 a 100%
  originalityScore: number; // 0 a 100%
  riskLevel: PlagiarismRiskLevel;
  advisorAttentionCount: number;
  abntIssuesCount: number;
  paragraphs: ParagraphAnalysisItem[];
  executiveSummary: string;
  generalRecommendations: string[];
  usedEngine: 'gemini_ai' | 'heuristic_syntax' | 'gemini_search_grounding';
  webGroundingSourcesCount?: number;
  groundingWebSources?: MatchedWebSource[];
  ocrProcessedPages?: number;
  formatNotice?: string;
}
