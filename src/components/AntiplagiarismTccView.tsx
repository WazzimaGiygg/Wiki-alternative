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
  Globe,
  Camera,
  TestTube2,
  FileCode,
} from 'lucide-react';
import {
  AntiplagiarismReport,
  ParagraphAnalysisItem,
  ParagraphStatus,
  MatchedWebSource,
} from '../types/antiplagiarism';
import { AntiplagiarismService, DocumentExtractionProgress } from '../services/antiplagiarismService';
import { runSanitizationTestSuite, SanitizationSuiteReport } from '../utils/textSanitizer';
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

  // Estado de arquivo (PDF com PDF.js, Word DOCX com Mammoth.js, e DOC legado OLE)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<'pdf' | 'docx' | 'doc' | 'txt' | null>(null);
  const [isExtractingDocument, setIsExtractingDocument] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<DocumentExtractionProgress | null>(null);
  const [formatNotice, setFormatNotice] = useState<string | null>(null);
  const [wasOcrUsed, setWasOcrUsed] = useState(false);
  const [pdfPagesEstimate, setPdfPagesEstimate] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Estado de análise e relatório
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AntiplagiarismReport | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'paragraphs' | 'grounding' | 'abnt-guide' | 'opinion' | 'tests'>('dashboard');
  const [paragraphFilter, setParagraphFilter] = useState<'all' | 'advisor' | 'abnt' | 'critical' | 'regular'>('all');
  const [expandedParagraphs, setExpandedParagraphs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 4.1.1.20Z.6: Estado da Suíte de Testes Unitários de Sanitização
  const [testSuiteReport, setTestSuiteReport] = useState<SanitizationSuiteReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipulador de upload de arquivo (PDF com PDF.js e OCR, Word .DOCX com Mammoth.js, e Word Legado .DOC OLE)
  const handleFileChange = async (file: File) => {
    if (!file) return;
    const nameLower = file.name.toLowerCase();
    const isPdf = nameLower.endsWith('.pdf') || file.type.includes('pdf');
    const isDocx = nameLower.endsWith('.docx') || file.type.includes('wordprocessingml');
    const isDoc = nameLower.endsWith('.doc') || file.type.includes('msword');
    const isTxt = nameLower.endsWith('.txt') || file.type.includes('text/plain');

    if (!isPdf && !isDocx && !isDoc && !isTxt) {
      alert('Por favor, selecione um arquivo no formato PDF (.pdf), Word (.docx) ou Word Legado (.doc).');
      return;
    }

    setSelectedFile(file);
    setIsExtractingDocument(true);
    setFormatNotice(null);
    setWasOcrUsed(false);
    setExtractionProgress({ message: 'Carregando documento...', percent: 10, stage: 'loading' });

    try {
      const res = await AntiplagiarismService.extractTextFromDocument(file, (p) => {
        setExtractionProgress(p);
      });
      setTccText(res.text);
      setPdfPagesEstimate(res.pagesEstimate);
      setFileFormat(res.format);
      if (res.formatNotice) {
        setFormatNotice(res.formatNotice);
      }
      if (res.isOcr) {
        setWasOcrUsed(true);
      }
      if (
        !tccTitle ||
        tccTitle === 'Trabalho de Conclusão de Curso (TCC)' ||
        tccTitle === 'A Aplicação de Inteligência Artificial na Gestão de Conhecimento'
      ) {
        const cleanName = file.name.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/[-_]+/g, ' ');
        setTccTitle(cleanName);
      }
    } catch (err: any) {
      alert(`Erro ao extrair texto do documento: ${err?.message || err}`);
    } finally {
      setIsExtractingDocument(false);
      setExtractionProgress(null);
    }
  };

  // 4.1.1.20Z.6: Executa a bateria de testes unitários automatizados de sanitização
  const handleRunUnitTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const rep = runSanitizationTestSuite();
      setTestSuiteReport(rep);
      setIsRunningTests(false);
      setActiveTab('tests');
    }, 120);
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
  const suiteReport = useMemo(() => testSuiteReport || runSanitizationTestSuite(), [testSuiteReport]);

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
            <button
              onClick={handleRunUnitTests}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 transition flex items-center gap-1.5 cursor-pointer"
              title="Executar testes unitários de sanitização de texto (4.1.1.20Z.6)"
            >
              <TestTube2 size={14} className={isRunningTests ? 'animate-spin' : ''} />
              <span>Testes (4.1.1.20Z.6)</span>
            </button>

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

        {/* MODO 1: ÁREA DE UPLOAD DE ARQUIVOS (PDF & WORD DOCX) */}
        {inputMode === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,application/msword,.txt,text/plain"
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
                  {isExtractingDocument ? (
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                  ) : (
                    <Upload size={32} />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedFile
                      ? selectedFile.name
                      : 'Clique para selecionar ou arraste o arquivo do TCC (PDF, Word .DOCX ou Word Legado .DOC)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
                    Processamento seguro no cliente: <strong>PDF.js (Mozilla)</strong> com fallback de <strong>OCR Tesseract.js</strong> para escaneados, <strong>Mammoth.js</strong> para Word (.docx) e conversor OLE para <strong>.doc legado</strong>.
                  </p>
                </div>

                {/* Barra de Progresso em Tempo Real da Extração & OCR */}
                {isExtractingDocument && extractionProgress && (
                  <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-2xl p-3.5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                        {extractionProgress.stage === 'ocr' ? (
                          <Camera size={14} className="animate-pulse text-amber-500" />
                        ) : (
                          <Loader2 size={14} className="animate-spin text-blue-500" />
                        )}
                        <span>{extractionProgress.message}</span>
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {extractionProgress.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          extractionProgress.stage === 'ocr' ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${extractionProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedFile && !isExtractingDocument && (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
                      {fileFormat === 'pdf'
                        ? '📄 PDF (PDF.js Mozilla)'
                        : fileFormat === 'docx'
                        ? '📝 Word DOCX (Mammoth.js)'
                        : fileFormat === 'doc'
                        ? '📜 Word Legado (.doc OLE)'
                        : '📄 Documento de Texto'}
                    </span>

                    {wasOcrUsed && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold flex items-center gap-1">
                        <Camera size={12} />
                        <span>OCR Tesseract.js Ativado (4.1.1.2I5.6)</span>
                      </span>
                    )}

                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Tamanho: {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                    {pdfPagesEstimate && (
                      <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {fileFormat === 'pdf' ? `${pdfPagesEstimate} páginas reais` : `~${pdfPagesEstimate} páginas ABNT`}
                      </span>
                    )}
                    {wordCount > 0 && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {wordCount} palavras extraídas
                      </span>
                    )}
                  </div>
                )}

                {/* 4.1.1.23Q.6: Aviso amigável para documentos Word Legados (.doc) */}
                {formatNotice && (
                  <div className="w-full max-w-xl text-left bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Aviso sobre Formato Binário Legado (.doc):</strong>
                      <span>{formatNotice}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pré-visualização do texto extraído */}
            {tccText && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>
                      Texto limpo extraído com{' '}
                      <strong>{fileFormat === 'docx' ? 'Mammoth.js' : fileFormat === 'pdf' ? 'PDF.js (Mozilla)' : 'Extrator'}</strong>:
                    </span>
                  </span>
                  <span>{wordCount} palavras • ~{paragraphEstimate} parágrafos prontos para a auditoria</span>
                </div>
                <textarea
                  value={tccText}
                  onChange={(e) => setTccText(e.target.value)}
                  rows={5}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none font-sans leading-relaxed text-slate-800 dark:text-slate-200"
                  placeholder="O texto limpo extraído do documento aparecerá aqui..."
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

      {/* 4.1.1.20Z.6: Visualização Direta da Suíte de Testes Unitários de Sanitização (acesso prévio sem necessidade de análise) */}
      {activeTab === 'tests' && !report && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                SUÍTE UNITÁRIA 4.1.1.20Z.6
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif-heading">
                Validação Automatizada de Edge Cases do Sanitizador
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
            >
              Fechar Painel de Testes ✕
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-purple-950 dark:text-purple-200 font-medium">
                Execução dos 10 testes unitários de sanitização de texto acadêmico (caracteres nulos, CRLF, hifenizações de fim de página, blocos PDF residuais, numeração e preservação ABNT).
              </p>
            </div>
            <button
              onClick={handleRunUnitTests}
              disabled={isRunningTests}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RotateCcw size={13} className={isRunningTests ? 'animate-spin' : ''} />
              <span>Executar Bateria Novamente</span>
            </button>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total de Testes</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{suiteReport.total}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">Aprovados</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{suiteReport.passedCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300 block">Falhas</span>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{suiteReport.failedCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 block">Taxa de Sucesso</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round((suiteReport.passedCount / suiteReport.total) * 100)}%
              </span>
            </div>
          </div>

          {/* Lista de Casos de Teste */}
          <div className="space-y-3">
            {suiteReport.results.map((res, index) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                      {res.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {res.durationMs}ms
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                      res.passed
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}>
                      {res.passed ? '✓ Aprovado (Pass)' : '✕ Falha (Fail)'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {res.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Entrada Bruta com Artefato:</span>
                    <pre className="whitespace-pre-wrap text-[11px] text-slate-700 dark:text-slate-300 break-all">
                      {JSON.stringify(res.input)}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Resultado Sanitizado Limpo:</span>
                    <pre className="whitespace-pre-wrap text-[11px] text-emerald-900 dark:text-emerald-300 break-all">
                      {JSON.stringify(res.output)}
                    </pre>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span>{res.expectedExplanation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <div className="flex flex-wrap items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 gap-1">
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
                onClick={() => setActiveTab('grounding')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'grounding'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Globe size={14} />
                <span>Bases Web ({report.webGroundingSourcesCount || report.groundingWebSources?.length || 0})</span>
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

              <button
                onClick={() => setActiveTab('tests')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'tests'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <TestTube2 size={14} />
                <span>Testes Sanitização (4.1.1.20Z.6)</span>
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

                          {/* 4.1.1.2HL.6: Fontes Externas Identificadas (Cruzamento Web / Grounding) */}
                          {p.matchedSources && p.matchedSources.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Globe size={14} className="text-blue-500" />
                                  <span>Fontes Externas Identificadas (Cruzamento Web Grounding):</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {p.matchedSources.length} fonte(s) similar(es)
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {p.matchedSources.map((ms, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100 truncate">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase">
                                          {ms.domain || 'Web'}
                                        </span>
                                        <span className="truncate">{ms.title}</span>
                                      </div>
                                      {ms.snippet && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-0.5">
                                          "{ms.snippet}"
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {ms.similarity !== undefined && (
                                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                                          ~{ms.similarity}% similar
                                        </span>
                                      )}
                                      {ms.url && (
                                        <a
                                          href={ms.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition flex items-center gap-1 text-[11px] font-medium"
                                          title="Abrir publicação externa"
                                        >
                                          <span>Acessar</span>
                                          <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
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

          {/* TAB 5: BASES WEB & CRUZAMENTO DE FONTES (4.1.1.2HL.6) */}
          {activeTab === 'grounding' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Globe size={18} className="text-blue-600 dark:text-blue-400" />
                    <span>Expansão de Fontes e Cruzamento com Repositórios Acadêmicos (4.1.1.2HL.6)</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 uppercase">
                    Google Search Grounding + Gemini 3.8
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Além da análise estrutural e sintática baseada nas normas ABNT, esta camada cruza os trechos do TCC diretamente com bases públicas indexadas na web (SciELO Brasil, Repositório Digital de Teses da USP, Portal de Periódicos CAPES, Google Scholar e documentos acadêmicos abertos).
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300">
                    📚 SciELO Brasil
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300">
                    🏛️ Teses & Dissertações USP
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300">
                    🔬 Portal CAPES
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300">
                    🌐 Google Scholar
                  </span>
                </div>
              </div>

              {/* Indicadores de Fontes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Fontes Mapeadas
                  </span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {report.groundingWebSources?.length || report.webGroundingSourcesCount || 0}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Artigos e dissertações públicas correlacionadas
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Similaridade Média Web
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    {report.overallSimilarityScore}%
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Grau de correspondência com indexadores
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Status de Integridade
                  </span>
                  <span className={`text-base font-bold font-mono ${
                    report.riskLevel === 'baixo' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {report.riskLevel === 'baixo' ? 'BAIXO RISCO EXTERNO' : 'REQUER AJUSTES DE CITAÇÃO'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Conforme normas ABNT NBR 10520
                  </p>
                </div>
              </div>

              {/* Lista de Fontes Externas */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Publicações e Referências com Coincidência Textual Detectada:
                </h4>

                {(!report.groundingWebSources || report.groundingWebSources.length === 0) ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    Nenhuma coincidência textual direta detectada com as bases web consultadas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {report.groundingWebSources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 uppercase">
                              {src.domain || 'Base Científica'}
                            </span>
                            <h5 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
                              {src.title}
                            </h5>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {src.similarity !== undefined && (
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                ~{src.similarity}% de similaridade
                              </span>
                            )}
                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5"
                              >
                                <span>Acessar Fonte</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>

                        {src.snippet && (
                          <blockquote className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border-l-4 border-blue-400 text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                            "{src.snippet}"
                          </blockquote>
                        )}

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                          <span className="truncate">URL: {src.url}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SUÍTE DE TESTES UNITÁRIOS DE SANITIZAÇÃO (4.1.1.20Z.6) */}
          {activeTab === 'tests' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <TestTube2 size={18} className="text-purple-600 dark:text-purple-400" />
                    <span>Suíte de Testes Unitários Automatizados da Sanitização (4.1.1.20Z.6)</span>
                  </h3>
                  <button
                    onClick={handleRunUnitTests}
                    disabled={isRunningTests}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw size={13} className={isRunningTests ? 'animate-spin' : ''} />
                    <span>Reexecutar Bateria ({suiteReport.total} Testes)</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cobre exaustivamente edge cases da função de sanitização de texto acadêmico (<code>cleanExtractedText</code>): caracteres nulos (\x00), quebras de linha Windows/Mac, hifenizações complexas de fim de linha, remoção residual de blocos PDF, números soltos de página e preservação integral de citações e travessões da ABNT.
                </p>
              </div>

              {/* Métricas dos Testes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total de Testes</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{suiteReport.total}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">Aprovados</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{suiteReport.passedCount}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300 block">Falhas</span>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{suiteReport.failedCount}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 block">Taxa de Cobertura</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round((suiteReport.passedCount / suiteReport.total) * 100)}%
                  </span>
                </div>
              </div>

              {/* Casos de Teste Detalhados */}
              <div className="space-y-3">
                {suiteReport.results.map((res, index) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {index + 1}
                        </span>
                        <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                          {res.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {res.durationMs}ms
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                          res.passed
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}>
                          {res.passed ? '✓ Aprovado (Pass)' : '✕ Falha (Fail)'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {res.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Entrada Bruta com Artefato:</span>
                        <pre className="whitespace-pre-wrap text-[11px] text-slate-700 dark:text-slate-300 break-all">
                          {JSON.stringify(res.input)}
                        </pre>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Resultado Sanitizado Limpo:</span>
                        <pre className="whitespace-pre-wrap text-[11px] text-emerald-900 dark:text-emerald-300 break-all">
                          {JSON.stringify(res.output)}
                        </pre>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      <span>{res.expectedExplanation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
