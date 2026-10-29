/**
 * @file src/components/AntiplagiarismTccView.tsx
 * @description Aplicativo web em React com Tailwind CSS para análise de Trabalhos
 * de Conclusão de Curso (TCC), detecção de similaridade/plágio, apontamentos
 * para o orientador e sugestões de correção segundo as normas ABNT (4.1.1.8P.5 & 4.1.1.RW.5).
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Upload,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Printer,
  ChevronDown,
  ChevronUp,
  Sliders,
  Filter,
  User,
  ExternalLink,
  Info,
  Loader2,
  Paperclip,
  CheckCheck,
} from 'lucide-react';
import {
  AntiplagiarismReport,
  ParagraphAnalysisItem,
  ParagraphStatus,
} from '../types/antiplagiarism';
import { AntiplagiarismService } from '../services/antiplagiarismService';
import { UserProfile, AppTheme } from '../types';

interface AntiplagiarismTccViewProps {
  theme?: AppTheme;
  currentUser?: UserProfile | null;
  onNavigateHome?: () => void;
  onNavigateToAcademic?: () => void;
  onNavigateToTools?: () => void;
  onOpenEditor?: (title?: string) => void;
}

export const AntiplagiarismTccView: React.FC<AntiplagiarismTccViewProps> = ({
  theme,
  currentUser,
  onNavigateHome,
  onNavigateToAcademic,
  onNavigateToTools,
  onOpenEditor,
}) => {
  // Estado dos dados de entrada
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [tccText, setTccText] = useState('');
  const [tccTitle, setTccTitle] = useState('A Aplicação de Inteligência Artificial na Gestão de Conhecimento');
  const [studentName, setStudentName] = useState(currentUser?.displayName || 'Lucas Ribeiro dos Santos');
  const [advisorName, setAdvisorName] = useState('Profa. Dra. Mariana Helena Vasconcelos');
  const [course, setCourse] = useState('Ciência da Computação & Engenharia de Software');

  // Estado de arquivo PDF
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfPagesEstimate, setPdfPagesEstimate] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Estado de análise e relatório
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AntiplagiarismReport | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'paragraphs' | 'abnt-guide' | 'opinion'>('dashboard');
  const [paragraphFilter, setParagraphFilter] = useState<'all' | 'advisor' | 'abnt' | 'critical' | 'regular'>('all');
  const [expandedParagraphs, setExpandedParagraphs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipulador de upload de arquivo PDF
  const handleFileChange = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo no formato PDF (.pdf).');
      return;
    }

    setSelectedFile(file);
    setIsExtractingPdf(true);

    try {
      const { text, pagesEstimate } = await AntiplagiarismService.extractTextFromPdfFile(file);
      setTccText(text);
      setPdfPagesEstimate(pagesEstimate);
      if (!tccTitle || tccTitle === 'Trabalho de Conclusão de Curso (TCC)') {
        const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');
        setTccTitle(cleanName);
      }
    } catch (err: any) {
      alert(`Erro ao extrair texto do PDF: ${err.message || err}`);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Carrega exemplo acadêmico para demonstração
  const handleLoadSample = () => {
    const sample = AntiplagiarismService.getSampleTccText();
    setTccTitle(sample.title);
    setStudentName(sample.student);
    setAdvisorName(sample.advisor);
    setCourse(sample.course);
    setTccText(sample.content);
    setSelectedFile(null);
    setInputMode('paste');
  };

  // Executa análise completa
  const handleRunAnalysis = async () => {
    if (!tccText || tccText.trim().length < 25) {
      alert('Por favor, insira ou faça upload do texto do TCC para análise (mínimo de 25 caracteres).');
      return;
    }

    setIsAnalyzing(true);
    try {
      const generatedReport = await AntiplagiarismService.analyzeTcc({
        text: tccText,
        title: tccTitle.trim() || 'Trabalho de Conclusão de Curso',
        studentName: studentName.trim() || 'Estudante Não Identificado',
        advisorName: advisorName.trim() || 'Orientador Não Identificado',
        course: course.trim() || 'Graduação',
      });

      setReport(generatedReport);
      setActiveTab('dashboard');

      // Expande inicialmente todos os parágrafos com problemas
      const initialExpanded: Record<string, boolean> = {};
      generatedReport.paragraphs.forEach((p) => {
        if (p.status !== 'regular') {
          initialExpanded[p.id] = true;
        }
      });
      setExpandedParagraphs(initialExpanded);
    } catch (err: any) {
      alert(`Falha ao concluir análise antiplágio: ${err?.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedParagraphs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySuggestion = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtragem de parágrafos no relatório
  const filteredParagraphs = useMemo(() => {
    if (!report) return [];
    switch (paragraphFilter) {
      case 'advisor':
        return report.paragraphs.filter((p) => p.status === 'atencao_orientador');
      case 'abnt':
        return report.paragraphs.filter((p) => p.status === 'inconformidade_abnt');
      case 'critical':
        return report.paragraphs.filter((p) => p.status === 'risco_plagio_critico');
      case 'regular':
        return report.paragraphs.filter((p) => p.status === 'regular');
      default:
        return report.paragraphs;
    }
  }, [report, paragraphFilter]);

  const wordCount = tccText.trim() ? tccText.trim().split(/\s+/).filter(Boolean).length : 0;
  const paragraphEstimate = tccText.trim() ? tccText.split(/\n\s*\n/).filter((p) => p.trim().length > 10).length : 0;

  return (
    <div id="antiplagiarism-tcc-view" className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho Institucional da Página de Antiplágio */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono uppercase tracking-wider">
                Módulo 4.1.1.8P.5
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                Extensão 4.1.1.RW.5 (Em Implementação)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                ABNT NBR 10520 & 6023
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold font-serif-heading text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="text-blue-600 dark:text-blue-400 shrink-0" size={28} />
              <span>Analisador Antiplágio & Parecer ABNT de TCC</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Plataforma acadêmica para análise estrutural de monografias, dissertações e Trabalhos de Conclusão de Curso (TCC). Identifica parágrafos que exigem a atenção do orientador e sugere correções pontuais nas normas da ABNT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToAcademic && (
              <button
                onClick={onNavigateToAcademic}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
              >
                <GraduationCap size={14} />
                <span>Wiki Universitário</span>
              </button>
            )}

            {onNavigateToTools && (
              <button
                onClick={onNavigateToTools}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
              >
                <Sliders size={14} />
                <span>Ferramentas</span>
              </button>
            )}

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Início
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE ENTRADA: UPLOAD DE PDF OU COLAGEM DE TEXTO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>1. Envio do Trabalho Acadêmico (PDF ou Texto)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Faça upload do arquivo PDF completo do TCC ou cole os capítulos para verificação.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Preencher automaticamente com um exemplo realista de TCC com problemas de citação"
            >
              <Sparkles size={14} />
              <span>Carregar Exemplo de TCC</span>
            </button>

            {/* Alternância de Modo: Upload PDF vs Colar Texto */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload size={13} />
                <span>Upload PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'paste'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText size={13} />
                <span>Colar Texto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metadados Acadêmicos do TCC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Título do TCC / Monografia
            </label>
            <input
              type="text"
              value={tccTitle}
              onChange={(e) => setTccTitle(e.target.value)}
              placeholder="Ex: A inteligência artificial na gestão..."
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Estudante / Autor(a)
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nome do aluno"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Professor(a) Orientador(a)
            </label>
            <input
              type="text"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              placeholder="Nome do orientador"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Curso / Departamento
            </label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Ex: Ciência da Computação"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* MODO 1: ÁREA DE UPLOAD DE PDF */}
        {inputMode === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-3xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 shadow-xs">
                  {isExtractingPdf ? (
                    <Loader2 size={32} className="animate-spin" />
                  ) : (
                    <Upload size={32} />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar ou arraste o arquivo PDF do TCC'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Suporta arquivos PDF de monografias, dissertações e artigos científicos acadêmicos
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <span>Tamanho: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                    {pdfPagesEstimate && <span>• Páginas estimadas: ~{pdfPagesEstimate}</span>}
                    {wordCount > 0 && <span>• {wordCount} palavras extraídas</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Pré-visualização do texto extraído */}
            {tccText && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Prévia do texto extraído do PDF:</span>
                  <span>{wordCount} palavras • ~{paragraphEstimate} parágrafos</span>
                </div>
                <textarea
                  value={tccText}
                  onChange={(e) => setTccText(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none font-sans"
                  placeholder="O texto extraído do PDF aparecerá aqui..."
                />
              </div>
            )}
          </div>
        )}

        {/* MODO 2: ÁREA DE COLAGEM DE TEXTO */}
        {inputMode === 'paste' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Corpo do Texto do TCC / Seções para Auditoria:
              </label>
              <div className="flex items-center gap-3">
                <span>{wordCount} palavras</span>
                <span>{paragraphEstimate} parágrafos detectados</span>
                {tccText && (
                  <button
                    onClick={() => setTccText('')}
                    className="text-rose-500 hover:underline cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={tccText}
              onChange={(e) => setTccText(e.target.value)}
              rows={8}
              placeholder="Cole aqui a introdução, fundamentação teórica, metodologia ou capítulos do TCC que deseja submeter à análise de similaridade e verificação das normas ABNT..."
              className="w-full p-4 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
            />
          </div>
        )}

        {/* Botão de Ação: Executar Análise */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info size={14} className="text-blue-500 shrink-0" />
            <span>Verificação baseada em sintaxe externa, regras ABNT e assistência por IA</span>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !tccText.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Auditoria ABNT em andamento...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Analisar TCC & Gerar Parecer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RELATÓRIO DETALHADO DO TCC (EXIBIDO APÓS ANÁLISE) */}
      {report && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6 animate-in fade-in duration-300">
          {/* Cabeçalho do Relatório com Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                  RELATÓRIO CONCLUÍDO
                </span>
                <span className="text-xs text-slate-400">
                  Emitido em: {new Date(report.analyzedAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif-heading">
                Parecer de Integridade: {report.tccTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orientando(a): <strong>{report.studentName || 'Não informado'}</strong> • Orientador(a): <strong>{report.advisorName || 'Não informado'}</strong>
              </p>
            </div>

            {/* Abas do Relatório */}
            <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers size={14} />
                <span>Painel Executivo</span>
              </button>

              <button
                onClick={() => setActiveTab('paragraphs')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'paragraphs'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <AlertTriangle size={14} />
                <span>Parágrafos do Orientador ({report.advisorAttentionCount + report.abntIssuesCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('abnt-guide')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'abnt-guide'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen size={14} />
                <span>Normas ABNT</span>
              </button>

              <button
                onClick={() => setActiveTab('opinion')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'opinion'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Printer size={14} />
                <span>Parecer Formal</span>
              </button>
            </div>
          </div>

          {/* TAB 1: PAINEL EXECUTIVO & KPIS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Cartões de Indicadores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Taxa de Similaridade */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Similaridade Global</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      report.riskLevel === 'baixo'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : report.riskLevel === 'moderado'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      Risco {report.riskLevel}
                    </span>
                  </div>
                  <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                    {report.overallSimilarityScore}%
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        report.overallSimilarityScore < 20
                          ? 'bg-emerald-500'
                          : report.overallSimilarityScore < 35
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${report.overallSimilarityScore}%` }}
                    />
                  </div>
                </div>

                {/* KPI 2: Originalidade */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Originalidade Autoral</span>
                    <Sparkles size={14} className="text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    {report.originalityScore}%
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Percentual de redação genuína e raciocínio analítico próprio
                  </p>
                </div>

                {/* KPI 3: Atenção do Orientador */}
                <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Atenção do Orientador</span>
                    <AlertTriangle size={14} className="text-amber-600" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-amber-700 dark:text-amber-300">
                    {report.advisorAttentionCount}
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    Parágrafos que merecem verificação do orientador da banca
                  </p>
                </div>

                {/* KPI 4: Inconformidades ABNT */}
                <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Inconformidades ABNT</span>
                    <BookOpen size={14} className="text-indigo-600" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
                    {report.abntIssuesCount}
                  </div>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                    Erros de formatação de citações (NBR 10520 & 6023)
                  </p>
                </div>
              </div>

              {/* Resumo Executivo da Auditoria */}
              <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-bold text-sm">
                  <CheckCheck size={18} className="text-blue-600 dark:text-blue-400" />
                  <span>Síntese Diagnóstica para a Orientação Acadêmica</span>
                </div>
                <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {report.executiveSummary}
                </p>

                <div className="border-t border-blue-200/60 dark:border-blue-900/40 pt-3">
                  <strong className="text-xs text-slate-800 dark:text-slate-200 block mb-2">
                    Recomendações Práticas para a Versão Final:
                  </strong>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {report.generalRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Atalho para ir aos parágrafos */}
              <div className="flex justify-end">
                <button
                  onClick={() => setActiveTab('paragraphs')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Inspecionar Parágrafos Destacados</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PARÁGRAFOS DETALHADOS COM ATENÇÃO DO ORIENTADOR E SUGESTÕES ABNT */}
          {activeTab === 'paragraphs' && (
            <div className="space-y-4">
              {/* Filtro de Parágrafos */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Filter size={14} />
                  <span>Filtrar parágrafos por status:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setParagraphFilter('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                      paragraphFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Todos ({report.paragraphs.length})
                  </button>

                  <button
                    onClick={() => setParagraphFilter('advisor')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                      paragraphFilter === 'advisor'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <span>Atenção Orientador ({report.advisorAttentionCount})</span>
                  </button>

                  <button
                    onClick={() => setParagraphFilter('abnt')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                      paragraphFilter === 'abnt'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                    }`}
                  >
                    <span>Inconformidades ABNT ({report.abntIssuesCount})</span>
                  </button>

                  <button
                    onClick={() => setParagraphFilter('critical')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                      paragraphFilter === 'critical'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <span>Cópia Suspeita</span>
                  </button>

                  <button
                    onClick={() => setParagraphFilter('regular')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                      paragraphFilter === 'regular'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    <span>Conforme</span>
                  </button>
                </div>
              </div>

              {/* Lista dos Parágrafos */}
              <div className="space-y-4">
                {filteredParagraphs.map((p) => {
                  const isExpanded = !!expandedParagraphs[p.id];
                  const isAlert = p.status !== 'regular';

                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border transition overflow-hidden ${
                        p.status === 'risco_plagio_critico'
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10'
                          : p.status === 'atencao_orientador'
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
                          : p.status === 'inconformidade_abnt'
                          ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      {/* Topo do Parágrafo */}
                      <div
                        onClick={() => toggleExpand(p.id)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            § {p.paragraphNumber}
                          </span>

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            p.status === 'risco_plagio_critico'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : p.status === 'atencao_orientador'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : p.status === 'inconformidade_abnt'
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {p.status === 'risco_plagio_critico'
                              ? 'Risco Crítico de Plágio'
                              : p.status === 'atencao_orientador'
                              ? 'Atenção do Orientador'
                              : p.status === 'inconformidade_abnt'
                              ? 'Inconformidade ABNT'
                              : 'Redação Conforme'}
                          </span>

                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {p.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono text-slate-400">
                            {p.wordCount} palavras
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* Corpo do Parágrafo Detalhado */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                          {/* Texto Original */}
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Texto do Parágrafo Submetido:
                            </div>
                            <blockquote className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border-l-4 border-slate-300 dark:border-slate-700 text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                              {p.excerpt}
                            </blockquote>
                          </div>

                          {/* Seção de Apontamentos do Orientador (Requisito 4.1.1.8P.5) */}
                          {isAlert && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Apontamento do Orientador */}
                              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                  <span>Apontamento para o Orientador:</span>
                                </div>
                                <p className="text-xs text-amber-900/90 dark:text-amber-300 leading-relaxed">
                                  {p.advisorNote}
                                </p>
                              </div>

                              {/* Norma ABNT Violada */}
                              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-1.5">
                                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                                  <BookOpen size={14} className="text-indigo-600 shrink-0" />
                                  <span>Regra ABNT Aplicável:</span>
                                </div>
                                <p className="text-xs text-indigo-900/90 dark:text-indigo-300 leading-relaxed">
                                  {p.abntRule}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Sugestão de Correção ABNT (Requisito 4.1.1.8P.5) */}
                          {isAlert && (
                            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                                  <Sparkles size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span>Sugestão de Correção nas Normas ABNT:</span>
                                </div>

                                <button
                                  onClick={() => handleCopySuggestion(p.id, p.suggestedCorrection)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 cursor-pointer"
                                  title="Copiar sugestão formatada para a área de transferência"
                                >
                                  {copiedId === p.id ? (
                                    <>
                                      <Check size={12} />
                                      <span>Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copiar Sugestão</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                                {p.suggestedCorrection}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GUIA RÁPIDO DE NORMAS ABNT */}
          {activeTab === 'abnt-guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                  <span>Manual Prático de Citações ABNT NBR 10520 & NBR 6023</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resumo das principais normas exigidas pelas bancas avaliadoras de TCC no Brasil:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Citação Direta Curta */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    1. Citação Direta Curta (Até 3 linhas)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Deve ser incorporada ao texto contínuo, entre aspas duplas, com indicação obrigatória do autor, ano e página.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    Segundo Silva (2020, p. 45), "a tecnologia transforma o acesso..."
                    <br />
                    OU
                    <br />
                    "A tecnologia transforma o acesso..." (SILVA, 2020, p. 45).
                  </div>
                </div>

                {/* 2. Citação Direta Longa */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    2. Citação Direta Longa (Mais de 3 linhas)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Deve figurar em bloco isolado, com recuo de 4 cm da margem esquerda, tamanho de fonte 10, espaçamento simples e <strong>SEM aspas</strong>.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 pl-6 border-l-4 border-blue-500">
                    O desenvolvimento contínuo de sistemas de informação demanda padronização documental... (SANTOS, 2021, p. 112).
                  </div>
                </div>

                {/* 3. Citação Indireta / Paráfrase */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    3. Citação Indireta (Paráfrase de Ideias)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    O estudante expressa a ideia com as próprias palavras. A indicação de página é opcional, mas a citação do autor e ano é obrigatória.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    Para Vasconcelos (2019), os modelos de aprendizado profundo revolucionaram o processamento de linguagem natural.
                  </div>
                </div>

                {/* 4. Citação de Citação (Apud) */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    4. Citação de Citação (Apud = "citado por")
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Usada apenas quando a obra original não foi encontrada. Cita-se o autor original seguido de "apud" e a obra consultada.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    Segundo Turing (1950 apud VASCONCELOS, 2022, p. 30), o teste de inteligência...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARECER FORMAL DE ORIENTAÇÃO (IMPRIMÍVEL) */}
          {activeTab === 'opinion' && (
            <div className="space-y-4">
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 space-y-6 shadow-sm print:p-0 print:border-none">
                {/* Cabeçalho do Parecer */}
                <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    WikiZero Repositório Acadêmico & Governança de TCC
                  </div>
                  <h3 className="text-lg md:text-xl font-bold font-serif-heading">
                    PARECER DE AUDITORIA DE INTEGRIDADE & CONFORMIDADE ABNT
                  </h3>
                  <p className="text-xs text-slate-500">
                    Relatório emitido pelo Módulo Antiplágio 4.1.1.8P.5
                  </p>
                </div>

                {/* Dados da Monografia */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Título da Obra:</span>
                    <strong>{report.tccTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Curso / Área:</span>
                    <strong>{report.course || 'Graduação'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Orientando(a):</span>
                    <strong>{report.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Orientador(a):</span>
                    <strong>{report.advisorName}</strong>
                  </div>
                </div>

                {/* Resumo Quantitativo */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Similaridade:</span>
                    <strong>{report.overallSimilarityScore}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Originalidade:</span>
                    <strong>{report.originalityScore}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Alertas Orientador:</span>
                    <strong>{report.advisorAttentionCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Falhas ABNT:</span>
                    <strong>{report.abntIssuesCount}</strong>
                  </div>
                </div>

                {/* Deliberação Acadêmica */}
                <div className="space-y-2 text-xs leading-relaxed">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Conclusão do Parecer:
                  </h4>
                  <p>
                    {report.executiveSummary}
                  </p>
                  <p>
                    Recomenda-se ao estudante proceder com os ajustes listados na aba de parágrafos destacados antes da submissão final à banca examinadora, garantindo a integridade dos dados e a rigorosa observância das normas ABNT NBR 10520.
                  </p>
                </div>

                {/* Assinatura */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
                  <div>
                    <div className="border-b border-slate-300 dark:border-slate-700 w-48 mx-auto mb-1" />
                    <span>{report.advisorName}</span>
                    <span className="block text-[10px]">Orientador(a)</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-300 dark:border-slate-700 w-48 mx-auto mb-1" />
                    <span>Comitê de Integridade WikiZero</span>
                    <span className="block text-[10px]">Validador ABNT</span>
                  </div>
                </div>
              </div>

              {/* Botão de Impressão */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Imprimir Parecer Oficial</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
