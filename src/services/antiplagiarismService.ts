/**
 * @file src/services/antiplagiarismService.ts
 * @description Serviço Front-End para Análise Antiplágio e Avaliação de TCC (4.1.1.8P.5 & 4.1.1.RW.5)
 * com Camada de OCR Tesseract.js (4.1.1.2I5.6), Suporte a .doc OLE Legado (4.1.1.23Q.6),
 * Sanitização Canônica (4.1.1.20Z.6) e Code Splitting sob demanda (4.1.1.222.6).
 */

import {
  AntiplagiarismReport,
  ParagraphAnalysisItem,
  ParagraphStatus,
  PlagiarismRiskLevel,
  MatchedWebSource,
} from '../types/antiplagiarism';
import { cleanExtractedText } from '../utils/textSanitizer';
import {
  detectLegitimateAbntCitation,
  extractCharacteristicPhrases,
} from './similarityEngine';
import { getDbSafe, getAuthSafe } from './firebase';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  limit,
} from 'firebase/firestore';

export interface DocumentExtractionProgress {
  message: string;
  percent?: number;
  stage?: 'loading' | 'reading' | 'ocr' | 'cleaning' | 'complete';
  isOcr?: boolean;
  currentPage?: number;
  totalPages?: number;
}

export class AntiplagiarismService {
  /**
   * Reexporta a função de sanitização centralizada para compatibilidade com o módulo.
   */
  static cleanExtractedText(rawText: string): string {
    return cleanExtractedText(rawText);
  }

  /**
   * 4.1.1.222.6: Carregador dinâmico assíncrono para PDF.js do Mozilla.
   * Evita inchar o bundle inicial da aplicação web.
   */
  private static async getPdfJs() {
    const [pdfjsLib, workerModule] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);

    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      } catch {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
    }

    return pdfjsLib;
  }

  /**
   * 4.1.1.222.6: Carregador dinâmico assíncrono para Mammoth.js.
   */
  private static async getMammoth() {
    const mammothModule = await import('mammoth');
    return mammothModule.default || mammothModule;
  }

  /**
   * 4.1.1.2I5.6: Executa OCR diretamente no navegador utilizando Tesseract.js
   * para páginas de PDF que consistem exclusivamente em imagens digitalizadas/escaneadas.
   */
  private static async runClientOcrOnPdf(
    pdfDoc: any,
    totalPages: number,
    onProgress?: (progress: DocumentExtractionProgress) => void
  ): Promise<{ text: string; pagesProcessed: number }> {
    onProgress?.({
      message: 'Iniciando camada de OCR (Tesseract.js) para leitura de documento digitalizado...',
      percent: 5,
      stage: 'ocr',
      isOcr: true,
      totalPages,
    });

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['por', 'eng'], 1, {
        logger: (m: any) => {
          if (m && m.status === 'recognizing text' && typeof m.progress === 'number') {
            const pagePct = Math.round(m.progress * 100);
            onProgress?.({
              message: `Reconhecendo caracteres (OCR): ${pagePct}%`,
              percent: Math.min(95, Math.round(10 + pagePct * 0.85)),
              stage: 'ocr',
              isOcr: true,
            });
          }
        },
      });

      const ocrPagesText: string[] = [];
      // Processa até 15 páginas para manter tempo de resposta aceitável no cliente
      const maxOcrPages = Math.min(totalPages, 15);

      for (let pageNum = 1; pageNum <= maxOcrPages; pageNum++) {
        onProgress?.({
          message: `Processando OCR página ${pageNum} de ${maxOcrPages}...`,
          percent: Math.round(10 + ((pageNum - 1) / maxOcrPages) * 80),
          stage: 'ocr',
          isOcr: true,
          currentPage: pageNum,
          totalPages: maxOcrPages,
        });

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          const { data } = await worker.recognize(canvas);
          if (data && data.text && data.text.trim()) {
            ocrPagesText.push(data.text.trim());
          }
        }
      }

      await worker.terminate();

      const combinedText = ocrPagesText.join('\n\n');
      const cleanText = cleanExtractedText(combinedText);

      onProgress?.({
        message: 'OCR concluído e texto sanitizado com sucesso.',
        percent: 100,
        stage: 'complete',
        isOcr: true,
      });

      return {
        text: cleanText,
        pagesProcessed: maxOcrPages,
      };
    } catch (ocrErr: any) {
      console.warn('[AntiplagiarismService] Falha na camada de OCR no cliente:', ocrErr);
      throw new Error(`Falha no OCR do documento escaneado: ${ocrErr?.message || ocrErr}`);
    }
  }

  /**
   * 1. Extrai texto limpo de todas as páginas de um arquivo PDF utilizando
   * a biblioteca oficial pdfjs-dist sob demanda, com fallback automático para OCR (Tesseract.js).
   */
  static async extractTextFromPdfFile(
    file: File,
    onProgress?: (progress: DocumentExtractionProgress) => void
  ): Promise<{ text: string; pagesEstimate: number; isOcr?: boolean }> {
    try {
      onProgress?.({
        message: 'Carregando biblioteca PDF.js (Mozilla) e analisando estrutura...',
        percent: 10,
        stage: 'loading',
      });

      const pdfjsLib = await this.getPdfJs();
      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });

      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      const pageTexts: string[] = [];

      onProgress?.({
        message: `Lendo ${numPages} página(s) de texto digital...`,
        percent: 25,
        stage: 'reading',
        totalPages: numPages,
      });

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        let pageStr = '';
        let lastY: number | undefined;

        for (const item of textContent.items as any[]) {
          if (!item || typeof item.str !== 'string') continue;
          const str = item.str;

          const currentY = item.transform ? item.transform[5] : undefined;
          if (lastY !== undefined && currentY !== undefined && Math.abs(currentY - lastY) > 5) {
            if (Math.abs(currentY - lastY) > 14) {
              pageStr += '\n\n';
            } else {
              pageStr += '\n';
            }
          } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
            pageStr += ' ';
          }

          pageStr += str;
          if (currentY !== undefined) {
            lastY = currentY;
          }
        }

        if (pageStr.trim()) {
          pageTexts.push(pageStr.trim());
        }
      }

      const rawJoined = pageTexts.join('\n\n');
      const cleanText = cleanExtractedText(rawJoined);

      // 4.1.1.2I5.6: Se o PDF possui menos de 45 caracteres legíveis, trata-se de documento escaneado
      // Ativa automaticamente a Camada de OCR no cliente com Tesseract.js
      if (cleanText.length < 45) {
        console.info('[AntiplagiarismService] PDF sem camada de texto selecionável. Ativando fallback OCR Tesseract.js...');
        try {
          const ocrResult = await this.runClientOcrOnPdf(pdfDoc, numPages, onProgress);
          if (ocrResult.text && ocrResult.text.length >= 30) {
            return {
              text: ocrResult.text,
              pagesEstimate: ocrResult.pagesProcessed,
              isOcr: true,
            };
          }
        } catch (ocrErr) {
          console.warn('[AntiplagiarismService] Erro no fallback de OCR:', ocrErr);
        }

        return {
          text: 'O arquivo PDF foi carregado com sucesso. No entanto, o arquivo aparenta ser composto por páginas digitalizadas ou imagens escaneadas sem camada de texto selecionável legível. Por favor, cole o texto do TCC diretamente no campo de texto para prosseguir com a análise.',
          pagesEstimate: numPages,
          isOcr: false,
        };
      }

      onProgress?.({
        message: 'Texto extraído e sanitizado com sucesso.',
        percent: 100,
        stage: 'complete',
      });

      return {
        text: cleanText,
        pagesEstimate: numPages,
        isOcr: false,
      };
    } catch (err: any) {
      console.error('[AntiplagiarismService] Erro ao extrair PDF:', err);
      throw new Error(`Falha ao ler o PDF com PDF.js: ${err?.message || err}`);
    }
  }

  /**
   * 2. Extrai texto puro e limpo de arquivos do Word (.docx) utilizando a biblioteca mammoth.js
   * sob demanda (code splitting).
   */
  static async extractTextFromDocxFile(
    file: File,
    onProgress?: (progress: DocumentExtractionProgress) => void
  ): Promise<{ text: string; pagesEstimate: number }> {
    try {
      onProgress?.({
        message: 'Carregando conversor Mammoth.js para documentos Word OpenXML (.docx)...',
        percent: 20,
        stage: 'loading',
      });

      const mammoth = await this.getMammoth();
      const arrayBuffer = await file.arrayBuffer();

      onProgress?.({
        message: 'Convertendo estruturas do Word em texto puro...',
        percent: 60,
        stage: 'reading',
      });

      const result = await mammoth.extractRawText({ arrayBuffer });
      const cleanText = cleanExtractedText(result.value || '');

      const wordsCount = cleanText.split(/\s+/).filter(Boolean).length;
      const pagesEstimate = Math.max(1, Math.ceil(wordsCount / 280));

      onProgress?.({
        message: 'Documento Word .docx processado com sucesso.',
        percent: 100,
        stage: 'complete',
      });

      if (cleanText.length > 0) {
        return {
          text: cleanText,
          pagesEstimate,
        };
      }

      return {
        text: 'O arquivo .docx foi processado com mammoth.js, mas não continha texto legível.',
        pagesEstimate: 1,
      };
    } catch (err: any) {
      console.error('[AntiplagiarismService] Erro ao extrair DOCX com mammoth.js:', err);
      throw new Error(`Falha ao converter o documento Word .docx com mammoth.js: ${err?.message || err}`);
    }
  }

  /**
   * 4.1.1.23Q.6: Suporte a Formatos Binários Legados (.doc Word 97-2003 OLE/CFBF).
   * Extrai texto limpo de arquivos .doc binários através de decodificação de streams OLE
   * UTF-16LE e CP1252, evitando exceções no Mammoth e alertando o usuário de forma amigável.
   */
  static async extractTextFromDocFile(
    file: File,
    onProgress?: (progress: DocumentExtractionProgress) => void
  ): Promise<{ text: string; pagesEstimate: number; formatNotice: string }> {
    onProgress?.({
      message: 'Identificado formato binário legado Word 97-2003 (.doc). Analisando OLE Compound File...',
      percent: 30,
      stage: 'reading',
    });

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Verifica se possui o cabeçalho mágico de arquivo composto OLE CFBF: D0 CF 11 E0 A1 B1 1A E1
      const isOle =
        bytes.length >= 8 &&
        bytes[0] === 0xd0 &&
        bytes[1] === 0xcf &&
        bytes[2] === 0x11 &&
        bytes[3] === 0xe0 &&
        bytes[4] === 0xa1 &&
        bytes[5] === 0xb1 &&
        bytes[6] === 0x1a &&
        bytes[7] === 0xe1;

      let extractedStrings: string[] = [];

      if (isOle) {
        // 1. Extração de trechos em UTF-16LE (2 bytes por caractere)
        const utf16Chars: string[] = [];
        for (let i = 512; i < bytes.length - 1; i += 2) {
          const code = bytes[i] | (bytes[i + 1] << 8);
          // Intervalo de caracteres imprimíveis normais em língua portuguesa/latina
          if ((code >= 0x0020 && code <= 0x024f) || code === 0x000a || code === 0x000d) {
            utf16Chars.push(String.fromCharCode(code));
          } else {
            if (utf16Chars.length >= 6) {
              const run = utf16Chars.join('').trim();
              if (
                run.length >= 8 &&
                !run.includes('Normal.dot') &&
                !run.includes('Microsoft Word') &&
                !run.includes('Times New Roman') &&
                !run.includes('Calibri') &&
                !run.includes('Arial')
              ) {
                extractedStrings.push(run);
              }
            }
            utf16Chars.length = 0;
          }
        }

        // 2. Extração de trechos em ASCII / Windows-1252 (1 byte por caractere)
        const asciiChars: string[] = [];
        for (let i = 512; i < bytes.length; i++) {
          const b = bytes[i];
          if ((b >= 32 && b <= 126) || (b >= 192 && b <= 255) || b === 10 || b === 13) {
            asciiChars.push(String.fromCharCode(b));
          } else {
            if (asciiChars.length >= 10) {
              const run = asciiChars.join('').trim();
              if (
                run.length >= 12 &&
                !run.includes('CompObj') &&
                !run.includes('WordDocument') &&
                !run.includes('SummaryInformation') &&
                !run.includes('DocumentSummaryInformation')
              ) {
                extractedStrings.push(run);
              }
            }
            asciiChars.length = 0;
          }
        }
      } else {
        // Se não for OLE canônico, tenta extração de texto genérica
        const text = new TextDecoder('iso-8859-1').decode(bytes);
        const matches = text.match(/[A-ZÀ-Úa-zà-ú0-9\s.,;:\-()"'!?]{15,}/g);
        if (matches) {
          extractedStrings = matches;
        }
      }

      const joinedText = extractedStrings.join('\n\n');
      const cleanText = cleanExtractedText(joinedText);
      const wordsCount = cleanText.split(/\s+/).filter(Boolean).length;
      const pagesEstimate = Math.max(1, Math.ceil(wordsCount / 280));

      const formatNotice =
        'Arquivo processado a partir do formato binário legado Word 97-2003 (.doc). O texto foi recuperado com sucesso pelo parser OLE da WikiWorldWeb. Para total fidelidade de diagramação e equações, recomendamos salvar o documento no formato moderno .docx (Word 2007+).';

      onProgress?.({
        message: 'Arquivo legado .doc lido com sucesso.',
        percent: 100,
        stage: 'complete',
      });

      return {
        text: cleanText,
        pagesEstimate,
        formatNotice,
      };
    } catch (err: any) {
      console.warn('[AntiplagiarismService] Falha na extração de arquivo .doc legado:', err);
      throw new Error(
        `O arquivo enviado está no formato binário antigo do Word (.doc). Não foi possível converter todas as tabelas e estilos legados. Por favor, abra o arquivo no Word/LibreOffice e clique em "Salvar Como" no formato moderno .docx ou .pdf.`
      );
    }
  }

  /**
   * 3. Roteador inteligente de documentos com suporte a PDF (PDF.js + OCR),
   * DOCX (Mammoth.js), DOC legado (OLE parser) e TXT.
   */
  static async extractTextFromDocument(
    file: File,
    onProgress?: (progress: DocumentExtractionProgress) => void
  ): Promise<{
    text: string;
    pagesEstimate: number;
    format: 'pdf' | 'docx' | 'doc' | 'txt';
    isOcr?: boolean;
    formatNotice?: string;
  }> {
    const name = file.name.toLowerCase();
    const mime = file.type.toLowerCase();

    // 1. Arquivos PDF (.pdf)
    if (name.endsWith('.pdf') || mime.includes('pdf')) {
      const res = await this.extractTextFromPdfFile(file, onProgress);
      return { ...res, format: 'pdf' };
    }

    // 2. Arquivos Word Modernos (.docx)
    if (name.endsWith('.docx') || mime.includes('wordprocessingml')) {
      const res = await this.extractTextFromDocxFile(file, onProgress);
      return { ...res, format: 'docx' };
    }

    // 3. Arquivos Word Legados (.doc)
    if (name.endsWith('.doc') || mime.includes('msword')) {
      const res = await this.extractTextFromDocFile(file, onProgress);
      return { ...res, format: 'doc' };
    }

    // 4. Arquivos de Texto Puro (.txt)
    if (name.endsWith('.txt') || mime.includes('text/plain')) {
      onProgress?.({ message: 'Lendo arquivo de texto puro (.txt)...', percent: 50, stage: 'reading' });
      const raw = await file.text();
      const clean = cleanExtractedText(raw);
      const wordsCount = clean.split(/\s+/).filter(Boolean).length;
      onProgress?.({ message: 'Arquivo de texto lido.', percent: 100, stage: 'complete' });
      return {
        text: clean,
        pagesEstimate: Math.max(1, Math.ceil(wordsCount / 280)),
        format: 'txt',
      };
    }

    // Heurística por cabeçalho binário
    try {
      const sliceBuffer = await file.slice(0, 8).arrayBuffer();
      const header = new Uint8Array(sliceBuffer);
      // PDF: %PDF
      if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
        const res = await this.extractTextFromPdfFile(file, onProgress);
        return { ...res, format: 'pdf' };
      }
      // OLE .doc: D0 CF 11 E0
      if (header[0] === 0xd0 && header[1] === 0xcf && header[2] === 0x11 && header[3] === 0xe0) {
        const res = await this.extractTextFromDocFile(file, onProgress);
        return { ...res, format: 'doc' };
      }
      // ZIP .docx: PK..
      if (header[0] === 0x50 && header[1] === 0x4b) {
        const res = await this.extractTextFromDocxFile(file, onProgress);
        return { ...res, format: 'docx' };
      }
    } catch {
      // Ignora
    }

    // Fallback padrão para mammoth
    try {
      const res = await this.extractTextFromDocxFile(file, onProgress);
      return { ...res, format: 'docx' };
    } catch {
      throw new Error(`Formato de arquivo não suportado. Por favor envie um documento no formato PDF (.pdf), Word (.docx) ou Word Legado (.doc).`);
    }
  }

  /**
   * Executa a análise do TCC chamando o backend Node.js (/api/antiplagiarism/analyze)
   * passando o token do Firebase Auth, com fallback transparente para a engine heurística local.
   */
  static async analyzeTcc(params: {
    text: string;
    title?: string;
    studentName?: string;
    advisorName?: string;
    advisorEmail?: string;
    advisorUid?: string;
    course?: string;
    options?: {
      similarityAlertThreshold?: number;
      abntStrictMode?: boolean;
      geminiDeepSemantic?: boolean;
    };
  }): Promise<AntiplagiarismReport> {
    const {
      text,
      title = 'Trabalho de Conclusão de Curso (TCC)',
      studentName,
      advisorName,
      advisorEmail,
      advisorUid,
      course,
      options,
    } = params;

    const auth = getAuthSafe();
    let idToken: string | null = null;
    if (auth?.currentUser) {
      try {
        idToken = await auth.currentUser.getIdToken();
      } catch (tokErr) {
        console.warn('[AntiplagiarismService] Não foi possível obter idToken:', tokErr);
      }
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch('/api/antiplagiarism/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          title,
          studentName,
          advisorName,
          advisorEmail,
          advisorUid,
          course,
          options,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.report) {
          return data.report as AntiplagiarismReport;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error || `Falha do servidor (HTTP ${response.status})`;
        console.warn(`[AntiplagiarismService] Erro retornado pela API (${response.status}):`, errMsg);
        if (response.status === 401 || response.status === 429 || response.status === 413) {
          throw new Error(errMsg);
        }
      }
    } catch (e: any) {
      if (
        e?.message &&
        (e.message.includes('Autenticação') ||
          e.message.includes('Token') ||
          e.message.includes('Limite') ||
          e.message.includes('extenso'))
      ) {
        throw e;
      }
      console.warn('[AntiplagiarismService] Falha ao comunicar com backend, usando engine heurística local:', e);
    }

    // Fallback heurístico local de alta precisão ABNT
    return this.runLocalHeuristicAnalysis(params);
  }

  /**
   * Salva o relatório de auditoria antiplágio no Firestore (coleção antiplagiarism_reports).
   * Campos obrigatórios: userUid, título, data, motor usado, fontes consultadas, score e parágrafos.
   */
  static async saveReportToFirestore(
    report: AntiplagiarismReport,
    meta?: {
      userUid?: string;
      userEmail?: string;
      advisorEmail?: string;
      advisorUid?: string;
    }
  ): Promise<string> {
    const db = getDbSafe();
    if (!db) {
      throw new Error('Banco de dados Firestore não inicializado.');
    }
    const auth = getAuthSafe();
    const currentUid = meta?.userUid || auth?.currentUser?.uid || report.userUid;
    if (!currentUid) {
      throw new Error('Usuário não autenticado. Faça login para salvar o relatório no Firestore.');
    }

    const reportId = report.id || `report-${Date.now()}`;
    const reportRef = doc(db, 'antiplagiarism_reports', reportId);

    const docPayload = {
      id: reportId,
      userUid: currentUid,
      userEmail: meta?.userEmail || auth?.currentUser?.email || report.userEmail || '',
      advisorEmail: meta?.advisorEmail || report.advisorEmail || '',
      advisorUid: meta?.advisorUid || report.advisorUid || '',
      título: report.tccTitle || 'Trabalho de Conclusão de Curso (TCC)',
      title: report.tccTitle || 'Trabalho de Conclusão de Curso (TCC)',
      data: report.analyzedAt || new Date().toISOString(),
      analyzedAt: report.analyzedAt || new Date().toISOString(),
      motorUsado: report.engineLabel || report.usedEngine || 'deterministic_shingles_sources',
      usedEngine: report.usedEngine || 'deterministic_shingles_sources',
      fontesConsultadas: report.groundingWebSources || [],
      fontesConsultadasCount: report.webGroundingSourcesCount || (report.groundingWebSources?.length ?? 0),
      queriedSourcesStatus: report.queriedSourcesStatus || [],
      score: report.overallSimilarityScore ?? null,
      weightedSimilarityScore: report.weightedSimilarityScore ?? null,
      originalityScore: report.originalityScore ?? null,
      riskLevel: report.riskLevel,
      advisorAttentionCount: report.advisorAttentionCount,
      abntIssuesCount: report.abntIssuesCount,
      parágrafos: report.paragraphs,
      paragraphs: report.paragraphs,
      studentName: report.studentName || '',
      advisorName: report.advisorName || '',
      course: report.course || '',
      totalWords: report.totalWords,
      totalParagraphs: report.totalParagraphs,
      executiveSummary: report.executiveSummary,
      generalRecommendations: report.generalRecommendations,
      optionsUsed: report.optionsUsed || null,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(reportRef, docPayload, { merge: true });
    return reportId;
  }

  /**
   * Busca histórico de relatórios no Firestore para o usuário atual,
   * orientador indicado ou administradores.
   */
  static async fetchUserReports(
    userUid: string,
    userEmail?: string,
    isAdmin = false
  ): Promise<AntiplagiarismReport[]> {
    const db = getDbSafe();
    if (!db || !userUid) return [];

    try {
      const reportsCol = collection(db, 'antiplagiarism_reports');
      let q;
      if (isAdmin) {
        q = query(reportsCol, limit(50));
      } else {
        q = query(reportsCol, where('userUid', '==', userUid), limit(50));
      }

      const snapshot = await getDocs(q);
      const reports: AntiplagiarismReport[] = [];

      snapshot.forEach((d) => {
        const data = d.data() as any;
        reports.push({
          id: d.id,
          analyzedAt: data.data || data.analyzedAt || new Date().toISOString(),
          tccTitle: data.título || data.title || 'TCC sem título',
          studentName: data.studentName,
          advisorName: data.advisorName,
          advisorEmail: data.advisorEmail,
          advisorUid: data.advisorUid,
          course: data.course,
          userUid: data.userUid,
          userEmail: data.userEmail,
          totalWords: data.totalWords || 0,
          totalParagraphs: data.totalParagraphs || (Array.isArray(data.parágrafos) ? data.parágrafos.length : 0),
          overallSimilarityScore: typeof data.score === 'number' ? data.score : (data.overallSimilarityScore ?? null),
          weightedSimilarityScore: data.weightedSimilarityScore ?? data.score ?? null,
          originalityScore: data.originalityScore ?? null,
          riskLevel: data.riskLevel || 'baixo',
          advisorAttentionCount: data.advisorAttentionCount || 0,
          abntIssuesCount: data.abntIssuesCount || 0,
          paragraphs: data.parágrafos || data.paragraphs || [],
          executiveSummary: data.executiveSummary || '',
          generalRecommendations: data.generalRecommendations || [],
          usedEngine: data.usedEngine || 'deterministic_shingles_sources',
          engineLabel: data.motorUsado || data.engineLabel,
          groundingWebSources: data.fontesConsultadas || data.groundingWebSources || [],
          webGroundingSourcesCount: data.fontesConsultadasCount || 0,
          queriedSourcesStatus: data.queriedSourcesStatus || [],
          optionsUsed: data.optionsUsed,
        });
      });

      return reports.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
    } catch (err) {
      console.warn('[AntiplagiarismService] Erro ao recuperar histórico no Firestore:', err);
      return [];
    }
  }

  /**
   * Exclui um relatório do histórico no Firestore.
   */
  static async deleteReport(reportId: string): Promise<void> {
    const db = getDbSafe();
    if (!db || !reportId) return;
    const reportRef = doc(db, 'antiplagiarism_reports', reportId);
    await deleteDoc(reportRef);
  }

  /**
   * Engine heurística local de conformidade ABNT e similaridade sintática.
   */
  static runLocalHeuristicAnalysis(params: {
    text: string;
    title?: string;
    studentName?: string;
    advisorName?: string;
    course?: string;
  }): AntiplagiarismReport {
    const { text, title = 'Trabalho de Conclusão de Curso (TCC)', studentName, advisorName, course } = params;

    const rawParagraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 25);

    const paragraphs: ParagraphAnalysisItem[] = [];
    let advisorAttentionCount = 0;
    let abntIssuesCount = 0;
    let totalRisk = 0;

    rawParagraphs.forEach((paragraph, idx) => {
      const pNum = idx + 1;
      const words = paragraph.split(/\s+/).filter(Boolean).length;
      let status: ParagraphStatus = 'regular';
      let issueType: ParagraphAnalysisItem['issueType'] = 'nenhum';
      let description = 'Parágrafo com boa estrutura dissertativa e conformidade textual.';
      let advisorNote = 'Redação satisfatória para leitura do orientador.';
      let suggestedCorrection = 'Manter parágrafo conforme apresentado na versão atual.';
      let abntRule = 'ABNT NBR 10520 & NBR 6023';

      const legitCitation = detectLegitimateAbntCitation(paragraph);
      const characteristicPhrases = extractCharacteristicPhrases(paragraph);

      const hasQuotes = /["“][^"”]{8,}["”]/.test(paragraph);
      const hasPage = /p\.\s*\d+|pp\.\s*\d+-\d+/i.test(paragraph);
      const hasCitation =
        /\([A-ZÀ-Ú\s]+,\s*(?:19|20)\d{2}/.test(paragraph) ||
        /[A-ZÀ-Ú][a-zà-ú]+\s*\((?:19|20)\d{2}\)/.test(paragraph);
      const isLongQuote = words > 45 && hasQuotes;

      if (legitCitation.isLegitimate) {
        status = 'regular';
        issueType = 'nenhum';
        description = `Citação textual direta legítima (${legitCitation.author}, ${legitCitation.year}, p. ${legitCitation.page}). Isenta de plágio conforme NBR 10520.`;
        advisorNote = 'Citação devidamente referenciada com autor, ano e página conforme NBR 10520.';
        suggestedCorrection = paragraph;
        abntRule = 'ABNT NBR 10520 - Citações diretas com autoria, ano e página';
      } else if (hasQuotes && !hasPage) {
        status = 'inconformidade_abnt';
        issueType = 'citacao_direta_sem_pagina';
        description = 'Citação textual direta sem indicação da página de origem (NBR 10520 item 5.1).';
        advisorNote = 'Solicitar ao aluno a página exata da publicação consultada para a citação literal.';
        suggestedCorrection = paragraph.replace(/(\((?:[A-ZÀ-Ú\s]+),\s*(?:19|20)\d{2})(\))/g, '$1, p. xx$2');
        abntRule = 'ABNT NBR 10520 - Item 5.1 (Obrigatoriedade de indicação da página em citações diretas)';
        abntIssuesCount++;
      } else if (isLongQuote) {
        status = 'inconformidade_abnt';
        issueType = 'citacao_longa_sem_recuo';
        description = 'Citação direta com mais de 3 linhas apresentada no corpo do texto.';
        advisorNote = 'Exigir a formatação em bloco separado com recuo de 4 cm da margem esquerda e fonte reduzida.';
        suggestedCorrection = `[Aplicar recuo de 4cm da margem esquerda, fonte tamanho 10, espaçamento simples e sem aspas]:\n\n${paragraph}`;
        abntRule = 'ABNT NBR 10520 - Item 5.3 (Citações com mais de 3 linhas destacadas)';
        abntIssuesCount++;
      } else if (
        !hasCitation &&
        words > 40 &&
        /(segundo|afirma|constatou-se|pesquisas demonstram|sabe-se que|teoria|dados comprovam)/i.test(paragraph)
      ) {
        status = 'atencao_orientador';
        issueType = 'sem_citacao';
        description = 'Afirmação factual ou teórica categórica desprovida de atribuição de fonte ou autoria.';
        advisorNote = 'Verificar se o estudante coletou esse dado em pesquisa empírica ou se omitiu a citação do autor.';
        suggestedCorrection = `${paragraph} (AUTOR, ano, p. xx).`;
        abntRule = 'ABNT NBR 10520 - Item 4 (Regra geral de apresentação de citações em documentos)';
        advisorAttentionCount++;
      } else if (
        words > 60 &&
        !hasCitation &&
        /(inteligência artificial|aprendizado de máquina|redes neurais|transformação digital)/i.test(paragraph)
      ) {
        status = 'atencao_orientador';
        issueType = 'possivel_parafrase_nao_atribuida';
        description = 'Paráfrase de literatura técnica especializada sem citação de autoria no parágrafo.';
        advisorNote = 'Recomendar citação indireta de autoridade no tema no início ou fim do parágrafo.';
        suggestedCorrection = `De acordo com Silva (2022), ${paragraph.charAt(0).toLowerCase() + paragraph.slice(1)}`;
        abntRule = 'ABNT NBR 10520 - Item 5.2 (Citações indiretas no texto acadêmico)';
        advisorAttentionCount++;
      }

      paragraphs.push({
        id: `p-${pNum}-${Date.now().toString(36)}`,
        paragraphNumber: pNum,
        excerpt: paragraph,
        wordCount: words,
        status,
        issueType,
        description,
        advisorNote,
        suggestedCorrection,
        abntRule,
        similarityPercentage: legitCitation.isLegitimate ? 0 : null,
        containmentPercent: legitCitation.isLegitimate ? 0 : null,
        isLegitimateCitation: legitCitation.isLegitimate,
        citationDetails: legitCitation.isLegitimate ? {
          author: legitCitation.author,
          year: legitCitation.year,
          page: legitCitation.page,
          quotedText: legitCitation.quotedText,
        } : undefined,
        characteristicPhrases,
        matchingExcerpts: [],
        matchedSourceHint: undefined,
        matchedSources: [],
      });
    });

    const totalWords = text.split(/\s+/).filter(Boolean).length;

    let riskLevel: PlagiarismRiskLevel = 'baixo';
    if (abntIssuesCount > 5 || advisorAttentionCount > 4) {
      riskLevel = 'alto';
    } else if (abntIssuesCount > 2 || advisorAttentionCount > 2) {
      riskLevel = 'moderado';
    }

    return {
      id: `report-heuristic-${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      tccTitle: title,
      studentName,
      advisorName,
      course,
      totalWords,
      totalParagraphs: paragraphs.length,
      overallSimilarityScore: null, // Não verificado: sem invenção de números
      originalityScore: null,
      riskLevel,
      advisorAttentionCount,
      abntIssuesCount,
      paragraphs,
      executiveSummary: `O TCC "${title}" foi auditado pelo motor heurístico local de conformidade ABNT (${paragraphs.length} parágrafos). Foram identificadas ${abntIssuesCount} inconformidades formais com as normas ABNT (especialmente NBR 10520) e ${advisorAttentionCount} trechos que requerem atenção direta do orientador para validação de fontes e citações de apoio. A similaridade textual externa não foi verificada nesta modalidade offline.`,
      generalRecommendations: [
        'Adicionar paginação específica em todas as citações textuais diretas curtas (NBR 10520).',
        'Formatar citações diretas longas (> 3 linhas) em parágrafo recuado a 4 cm, tamanho 10, sem aspas.',
        'Inserir as fontes de dados nos parágrafos conceituais apontados na auditoria do orientador.',
        'Conferir a exata correspondência de todos os autores citados no texto com a lista de referências final (NBR 6023).',
      ],
      usedEngine: 'heuristic_syntax',
      engineLabel: 'Análise Heurística Local ABNT (Offline)',
      isFallback: true,
      fallbackReason:
        'Motor de IA e busca externa indisponíveis ou não configurados. A análise foi processada exclusivamente com base em regras sintáticas e formatação de citações da ABNT. A similaridade textual externa não foi verificada.',
      webGroundingSourcesCount: 0,
      groundingWebSources: [],
    };
  }

  /**
   * Retorna um exemplo de TCC acadêmico para testes imediatos.
   */
  static getSampleTccText(): {
    title: string;
    student: string;
    advisor: string;
    course: string;
    content: string;
  } {
    return {
      title: 'A Aplicação de Inteligência Artificial e Processamento de Linguagem Natural na Gestão de Conhecimento Universitário',
      student: 'Lucas Ribeiro dos Santos',
      advisor: 'Profa. Dra. Mariana Helena Vasconcelos',
      course: 'Ciência da Computação & Sistemas de Informação',
      content: `O avanço recente dos modelos de linguagem em grande escala (LLMs) provocou transformações profundas na maneira como organizações acadêmicas e bibliotecas universitárias gerenciam seu acervo. A capacidade de indexar dados não estruturados permite que pesquisadores recuperem conceitos complexos em frações de segundo.

Conforme preceitua a literatura contemporânea: "A inteligência artificial generativa não substitui o pensamento crítico humano, mas atua como um amplificador cognitivo sem precedentes na pesquisa acadêmica" (VASCONCELOS, 2024). Essa perspectiva evidencia a necessidade de integrar ferramentas de IA com rigor metodológico.

Pesquisas recentes comprovam que mais de setenta por cento dos pesquisadores utilizam assistentes virtuais para sumarização bibliográfica diária. Contudo, a ausência de diretrizes éticas institucionais eleva a probabilidade de alucinações e distorções conceituais no referencial teórico.

De acordo com a teoria da difusão de inovações, a aceitação de novas tecnologias em instituições de ensino depende substancialmente da facilidade de uso percebida e da compatibilidade com valores acadêmicos pré-existentes (ROGERS, 2003, p. 112). A capacitação contínua do corpo docente surge como pilar indispensável para uma transição sustentável.

"O conhecimento tácito, quando submetido a algoritmos de processamento de linguagem natural, passa por um processo de codificação que pode perder nuances contextuais cruciais caso não haja supervisão direta de especialistas humanos no domínio de estudo." (NONAKA; TAKEUCHI, 2021). Esse desafio demanda arquiteturas híbridas de aprendizagem contínua.

A adoção de repositórios abertos e enciclopédias colaborativas orientadas a princípios de transparência, como a WikiWorldWeb, ilustra perfeitamente como a descentralização do saber e a conformidade estrita com normas da ABNT fortalecem o ecossistema educacional brasileiro.`,
    };
  }
}
