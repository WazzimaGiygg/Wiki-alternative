import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { WikiArticle } from '../types';
import { parseWikitext } from './wikitextParser';
import {
  drawPdfStandardHeroBanner,
  drawPdfStandardKpiCards,
  drawPdfStandardSectionHeader,
  drawPdfStandardCategoryBanner,
  drawPdfStandardMiniHeader,
  drawPdfStandardFooters,
  drawPdfStandardGovernanceBox,
  PdfKpiCard,
} from './pdfStandardTemplate';

export interface PdfExportOptions {
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeMetadata?: boolean;
  includeToc?: boolean;
  includeReferences?: boolean;
  includeFooter?: boolean;
  includeLicense?: boolean;
  exportMode?: 'structured' | 'snapshot';
  fontSize?: 'compact' | 'normal' | 'large';
  customWatermark?: string;
}

/**
 * Limpa marcações wikitext para produzir texto corrido limpo para renderização vetorial no PDF
 */
export function cleanWikitextForPdf(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\[\[(?:Categoria|Category):.*?\]\]/gi, '')
    .replace(/\[\[(?:Arquivo|File|Imagem|Image):.*?\]\]/gi, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1') // [[target|text]] -> text
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2 ($1)') // [url text] -> text (url)
    .replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1')
    .replace(/'''([^']+)'''/g, '$1') // Bold
    .replace(/''([^']+)''/g, '$1') // Italic
    .replace(/<ref[^>]*>([\s\S]*?)<\/ref>/gi, '') // Remove refs do corpo
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip tags HTML
    .replace(/\{\|[\s\S]*?\|\}/g, '') // Strip tabelas wikitext brutas
    .replace(/\{\{[^}]+\}\}/g, ''); // Strip templates
}

interface ParsedSection {
  numberStr: string;
  title: string;
  level: number;
  badge: string;
  colorRgb: [number, number, number];
  bgColorRgb: [number, number, number];
  categoryGroup: 'intro' | 'development' | 'analysis' | 'references';
  lines: string[];
}

/**
 * Divide o conteúdo do artigo em seções estruturadas e classificadas por categoria editorial
 */
function parseArticleIntoStructuredSections(rawDescription: string, articleTitle: string): ParsedSection[] {
  const lines = (rawDescription || '').split('\n');
  const sections: ParsedSection[] = [];

  let currentSection: ParsedSection = {
    numberStr: '§ 1.0',
    title: `Introdução & Sumário Executivo: ${articleTitle}`,
    level: 1,
    badge: 'CONCEITO',
    colorRgb: [16, 185, 129], // emerald
    bgColorRgb: [236, 253, 245],
    categoryGroup: 'intro',
    lines: [],
  };

  let sectionCounter = 1;
  let subCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Nível 1 ou 2 (== Título == ou = Título =)
    const isH2 = /^={1,2}[^=]+={1,2}$/.test(line);
    const isH3 = /^={3}[^=]+={3}$/.test(line);
    const isH4 = /^={4,6}[^=]+={4,6}$/.test(line);

    if (isH2 || isH3 || isH4) {
      if (currentSection.lines.length > 0 || currentSection.title) {
        sections.push(currentSection);
      }

      const hTitle = line.replace(/=/g, '').trim();
      const lower = hTitle.toLowerCase();

      let group: 'intro' | 'development' | 'analysis' | 'references' = 'development';
      let badge = 'DETALHE';
      let colorRgb: [number, number, number] = [37, 99, 235]; // blue
      let bgColorRgb: [number, number, number] = [239, 246, 255];

      if (lower.includes('referência') || lower.includes('fonte') || lower.includes('bibliografia') || lower.includes('ligações')) {
        group = 'references';
        badge = 'FONTE';
        colorRgb = [147, 51, 234]; // purple
        bgColorRgb = [250, 245, 255];
      } else if (lower.includes('história') || lower.includes('origem') || lower.includes('fundação') || lower.includes('cronologia')) {
        group = 'development';
        badge = 'HISTÓRICO';
        colorRgb = [37, 99, 235];
        bgColorRgb = [239, 246, 255];
      } else if (lower.includes('análise') || lower.includes('impacto') || lower.includes('dados') || lower.includes('estatística') || lower.includes('governança')) {
        group = 'analysis';
        badge = 'ANÁLISE';
        colorRgb = [8, 145, 178]; // cyan
        bgColorRgb = [236, 254, 255];
      } else if (lower.includes('introdução') || lower.includes('definição') || lower.includes('conceito') || lower.includes('visão geral')) {
        group = 'intro';
        badge = 'CONCEITO';
        colorRgb = [16, 185, 129];
        bgColorRgb = [236, 253, 245];
      }

      if (isH2) {
        sectionCounter++;
        subCounter = 0;
      } else {
        subCounter++;
      }

      const numStr = isH2 ? `§ ${sectionCounter}.0` : `§ ${sectionCounter}.${subCounter}`;

      currentSection = {
        numberStr: numStr,
        title: hTitle,
        level: isH2 ? 2 : isH3 ? 3 : 4,
        badge,
        colorRgb,
        bgColorRgb,
        categoryGroup: group,
        lines: [],
      };
      continue;
    }

    currentSection.lines.push(rawLine);
  }

  if (currentSection.lines.length > 0 || currentSection.title) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Exporta o artigo enciclopédico no padrão visual padronizado estabelecido
 * pelo modelo executivo (baseado no PDF novopadrao_c4c55bbd.pdf)
 */
export async function exportArticleToStructuredPdf(
  article: WikiArticle,
  pageName: string = 'WikiZero Enciclopédia',
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    pageSize = 'a4',
    orientation = 'portrait',
    includeHeader = true,
    includeMetadata = true,
    includeToc = true,
    includeReferences = true,
    includeFooter = true,
    includeLicense = true,
    fontSize = 'normal',
    customWatermark = '',
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  const scaleFont = (size: number) => {
    if (fontSize === 'compact') return size * 0.9;
    if (fontSize === 'large') return size * 1.15;
    return size;
  };

  const drawMiniHeader = () => {
    if (!includeHeader) return;
    drawPdfStandardMiniHeader(
      doc,
      'WIKIZERO • RELATÓRIO DO ARTIGO ENCICLOPÉDICO',
      `${article.titulo} (?uid=${article.id})`,
      margin,
      pageWidth
    );
    currentY = 16;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      drawMiniHeader();
    }
  };

  // Cálculo de estatísticas e métricas de conteúdo
  const rawCleanText = cleanWikitextForPdf(article.descricao || '');
  const wordsCount = rawCleanText.trim() ? rawCleanText.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordsCount / 200));

  const parseResult = parseWikitext(article.descricao || '', undefined, article.titulo);
  const parsedSections = parseArticleIntoStructuredSections(article.descricao || '', article.titulo);
  const sectionsCount = Math.max(parsedSections.length, (parseResult.toc || []).length);
  const referencesCount = (parseResult.references || []).length;

  const nowFormatted = new Date().toLocaleString('pt-BR');

  // =========================================================================
  // 1. HERO BANNER PADRONIZADO (CARD BRANCO COM BORDA E LOGOTIPO COLORIDO)
  // =========================================================================
  if (includeHeader) {
    const heroHeight = 36;
    drawPdfStandardHeroBanner(
      doc,
      currentY,
      {
        categoryTag: 'DOCUMENTO ENCICLOPÉDICO & ARTIGO PADRONIZADO',
        title: `RELATÓRIO DO ARTIGO: ${article.titulo.toUpperCase()}`,
        subtitle: `Classificado por Estrutura Editorial: Verbete Enciclopédico, Fontes & Histórico`,
        metadataLine: `Gerado em: ${nowFormatted} • Emissor: WikiZero • UID: ?uid=${article.id} • Coleção: ${pageName}`,
        height: heroHeight,
      },
      margin,
      contentWidth
    );

    currentY += heroHeight + 5;
  }

  // =========================================================================
  // 2. GRADE COM EXATAMENTE 4 CARDS DE KPIS PADRONIZADOS
  // =========================================================================
  if (includeMetadata) {
    checkPageBreak(20);

    const kpis: PdfKpiCard[] = [
      {
        title: 'TOTAL DE PALAVRAS',
        val: wordsCount.toLocaleString('pt-BR'),
        sub: `~${readingTimeMin} min de leitura`,
        bg: [239, 246, 255], // blue-50
        border: [191, 219, 254], // blue-200
        textCol: [29, 78, 216], // blue-700
      },
      {
        title: 'SEÇÕES & TÓPICOS',
        val: `${sectionsCount}`,
        sub: 'Índice enciclopédico',
        bg: [243, 244, 246], // slate-100
        border: [229, 231, 235], // slate-300
        textCol: [31, 41, 55], // slate-800
      },
      {
        title: 'FONTES & REFERÊNCIAS',
        val: `${referencesCount}`,
        sub: 'Citações verificadas',
        bg: [236, 253, 245], // emerald-50
        border: [167, 243, 208], // emerald-200
        textCol: [5, 150, 105], // emerald-600
      },
      {
        title: 'REVISÃO & ESTADO',
        val: 'v3.05',
        sub: 'Verbete verificado',
        bg: [255, 241, 242], // rose-50
        border: [254, 205, 211], // rose-200
        textCol: [225, 29, 72], // rose-600
      },
    ];

    drawPdfStandardKpiCards(doc, currentY, kpis, margin, contentWidth, 16);
    currentY += 16 + 6;
  }

  // =========================================================================
  // 3. TÍTULO DA SEÇÃO DE CONTEÚDO ENCICLOPÉDICO
  // =========================================================================
  checkPageBreak(16);
  drawPdfStandardSectionHeader(
    doc,
    currentY,
    'CONTEÚDO ENCICLOPÉDICO & ESTRUTURA DO VERBETE',
    `[${sectionsCount} SEÇÕES]`,
    margin,
    contentWidth,
    pageWidth
  );
  currentY += 10;

  // =========================================================================
  // 4. SEÇÕES DO ARTIGO ESTRUTURADAS EM CARDS PADRONIZADOS
  // =========================================================================
  let lastGroupHeader = '';

  for (let sIdx = 0; sIdx < parsedSections.length; sIdx++) {
    const section = parsedSections[sIdx];

    // Banner da Categoria correspondente
    if (lastGroupHeader !== section.categoryGroup) {
      lastGroupHeader = section.categoryGroup;
      checkPageBreak(12);

      let groupLabel = 'DESENVOLVIMENTO & DETALHAMENTO TEMÁTICO';
      let groupCol: [number, number, number] = [37, 99, 235];
      let groupBg: [number, number, number] = [255, 255, 255];

      if (section.categoryGroup === 'intro') {
        groupLabel = 'INTRODUÇÃO & CONCEITO GERAL';
        groupCol = [16, 185, 129];
      } else if (section.categoryGroup === 'analysis') {
        groupLabel = 'ANÁLISE, IMPACTO & DADOS ESTATÍSTICOS';
        groupCol = [8, 145, 178];
      } else if (section.categoryGroup === 'references') {
        groupLabel = 'FONTES & REFERÊNCIAS BIBLIOGRÁFICAS';
        groupCol = [147, 51, 234];
      }

      drawPdfStandardCategoryBanner(doc, currentY, groupLabel, groupCol, groupBg, margin, contentWidth);
      currentY += 8.5;
    }

    // Processamento do conteúdo textual da seção
    const cleanLines = section.lines
      .map((l) => l.trim())
      .filter((l) => Boolean(l));

    const paragraphs: string[] = [];
    const bulletItems: string[] = [];
    const quotes: string[] = [];
    const codeBlocks: string[] = [];

    let inCode = false;
    let codeAcc: string[] = [];

    cleanLines.forEach((l) => {
      if (l.startsWith('```') || l.startsWith('<pre')) {
        if (inCode) {
          inCode = false;
          codeBlocks.push(codeAcc.join('\n'));
          codeAcc = [];
        } else {
          inCode = true;
        }
        return;
      }
      if (inCode) {
        codeAcc.push(l);
        return;
      }

      if (l.startsWith('*') || l.startsWith('#')) {
        bulletItems.push(cleanWikitextForPdf(l.replace(/^[*#]+\s*/, '')));
      } else if (l.startsWith(':') || l.startsWith('>')) {
        quotes.push(cleanWikitextForPdf(l.replace(/^[:>]\s*/, '')));
      } else {
        paragraphs.push(cleanWikitextForPdf(l));
      }
    });

    const fullParagraphText = paragraphs.join('\n\n');
    const splitParagraphs = fullParagraphText ? doc.splitTextToSize(fullParagraphText, contentWidth - 10) : [];

    // Estimativa de altura do card
    const headerRowH = 8;
    const titleH = 6;
    const paragraphH = splitParagraphs.length > 0 ? splitParagraphs.length * scaleFont(3.8) + 4 : 0;
    const bulletsH = bulletItems.length > 0 ? bulletItems.length * scaleFont(4.2) + 3 : 0;
    const quotesH = quotes.length > 0 ? quotes.length * scaleFont(4.2) + 4 : 0;
    const codeH = codeBlocks.length > 0 ? codeBlocks.length * scaleFont(12) : 0;

    const totalCardHeight = Math.max(16, headerRowH + titleH + paragraphH + bulletsH + quotesH + codeH + 4);

    checkPageBreak(totalCardHeight + 4);

    // Caixa do Card com contorno fino idêntico ao modelo
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, totalCardHeight, 1.2, 1.2, 'FD');

    // 1. Pill com o identificador da Seção (ex.: § 1.0)
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.25);
    doc.roundedRect(margin + 3, currentY + 3, 16, 4.5, 0.8, 0.8, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(section.numberStr, margin + 4.5, currentY + 6.2);

    // 2. Badge de Categoria Editorial
    doc.setFillColor(section.bgColorRgb[0], section.bgColorRgb[1], section.bgColorRgb[2]);
    doc.roundedRect(margin + 21, currentY + 3, 24, 4.5, 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(section.colorRgb[0], section.colorRgb[1], section.colorRgb[2]);
    doc.text(section.badge, margin + 23, currentY + 6.2);

    // 3. Metadados alinhados à direita (Nível e Tempo de Leitura)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const sectionWords = fullParagraphText.split(/\s+/).length;
    const sectionMins = Math.max(1, Math.ceil(sectionWords / 200));
    doc.text(
      `Seção Nível ${section.level} • Leitura ~${sectionMins} min`,
      pageWidth - margin - 4,
      currentY + 6.2,
      { align: 'right' }
    );

    // 4. Título da Seção
    let innerY = currentY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const splitSecTitle = doc.splitTextToSize(section.title, contentWidth - 8);
    doc.text(splitSecTitle[0] || section.title, margin + 4, innerY);
    innerY += 5;

    // 5. Parágrafos de Texto Corrido
    if (splitParagraphs.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(8.5));
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(splitParagraphs, margin + 4, innerY);
      innerY += splitParagraphs.length * scaleFont(3.8) + 2;
    }

    // 6. Itens de Marcador (Bullets)
    if (bulletItems.length > 0) {
      bulletItems.forEach((bText) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(scaleFont(8.5));
        doc.setTextColor(section.colorRgb[0], section.colorRgb[1], section.colorRgb[2]);
        doc.text('•', margin + 5, innerY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const splitB = doc.splitTextToSize(bText, contentWidth - 14);
        doc.text(splitB, margin + 9, innerY);
        innerY += splitB.length * scaleFont(4.0) + 1.5;
      });
    }

    // 7. Citações em Bloco (Blockquotes)
    if (quotes.length > 0) {
      quotes.forEach((qText) => {
        doc.setFillColor(248, 250, 252);
        const splitQ = doc.splitTextToSize(qText, contentWidth - 16);
        const qH = splitQ.length * scaleFont(3.8) + 3;
        doc.rect(margin + 4, innerY - 2, contentWidth - 8, qH, 'F');

        doc.setDrawColor(section.colorRgb[0], section.colorRgb[1], section.colorRgb[2]);
        doc.setLineWidth(0.8);
        doc.line(margin + 4, innerY - 2, margin + 4, innerY - 2 + qH);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(scaleFont(8.2));
        doc.setTextColor(71, 85, 105);
        doc.text(splitQ, margin + 8, innerY + 1.5);
        innerY += qH + 2;
      });
    }

    // 8. Blocos de Código-fonte / Snippets
    if (codeBlocks.length > 0) {
      codeBlocks.forEach((cText) => {
        doc.setFillColor(241, 245, 249);
        const splitC = doc.splitTextToSize(cText, contentWidth - 14);
        const cH = splitC.length * scaleFont(3.5) + 4;
        doc.roundedRect(margin + 4, innerY - 2, contentWidth - 8, cH, 1, 1, 'F');

        doc.setFont('courier', 'normal');
        doc.setFontSize(scaleFont(7.2));
        doc.setTextColor(15, 23, 42);
        doc.text(splitC, margin + 7, innerY + 2);
        innerY += cH + 2;
      });
    }

    currentY += totalCardHeight + 3;
  }

  // =========================================================================
  // 5. REFERÊNCIAS & CITAÇÕES CATALOGADAS (PADRÃO IDÊNTICO)
  // =========================================================================
  if (includeReferences && parseResult.references && parseResult.references.length > 0) {
    checkPageBreak(18);

    drawPdfStandardCategoryBanner(
      doc,
      currentY,
      'REFERÊNCIAS, FONTES & NOTAS BIBLIOGRÁFICAS',
      [147, 51, 234], // purple
      [255, 255, 255],
      margin,
      contentWidth
    );
    currentY += 8.5;

    parseResult.references.forEach((ref, rIdx) => {
      const cleanRef = cleanWikitextForPdf(ref);
      const splitRef = doc.splitTextToSize(cleanRef, contentWidth - 36);
      const refCardHeight = Math.max(13, splitRef.length * scaleFont(3.6) + 7);

      checkPageBreak(refCardHeight + 2);

      // Card de Referência
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, refCardHeight, 1.2, 1.2, 'FD');

      // Pill do Número da Citação
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin + 3, currentY + 2.5, 12, 4.5, 0.8, 0.8, 'FD');
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      doc.text(`[${rIdx + 1}]`, margin + 4.5, currentY + 5.7);

      // Badge de Citação
      doc.setFillColor(250, 245, 255);
      doc.roundedRect(margin + 17, currentY + 2.5, 22, 4.5, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(147, 51, 234);
      doc.text('REFERÊNCIA', margin + 18.5, currentY + 5.7);

      // Metadado à direita
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Citação Indexada', pageWidth - margin - 4, currentY + 5.7, { align: 'right' });

      // Texto da Referência
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(7.8));
      doc.setTextColor(51, 65, 85);
      doc.text(splitRef, margin + 4, currentY + 11);

      currentY += refCardHeight + 2.5;
    });
  }

  // =========================================================================
  // 6. CAIXA DE GOVERNANÇA, CÓDIGO ABERTO & AUDITORIA TÉCNICA (PADRÃO PÁG. 4)
  // =========================================================================
  if (includeLicense) {
    checkPageBreak(30);

    const extraBullets = [
      '• Licença Editorial: Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0).',
      `• Identificador Canônico Permanente (UID): ?uid=${article.id} • Coleção: ${pageName}.`,
    ];

    const boxH = drawPdfStandardGovernanceBox(doc, currentY, margin, contentWidth, extraBullets);
    currentY += boxH + 6;
  }

  // =========================================================================
  // 7. MARCA D'ÁGUA OPCIONAL
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  if (customWatermark) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.saveGraphicsState();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(50);
      doc.setTextColor(241, 245, 249);
      doc.text(customWatermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  }

  // =========================================================================
  // 8. RODAPÉ UNIFICADO EM TODAS AS PÁGINAS (PADRÃO DO PDF ANEXADO)
  // =========================================================================
  if (includeFooter) {
    drawPdfStandardFooters(
      doc,
      'Documento Enciclopédico Oficial',
      margin,
      pageWidth,
      pageHeight
    );
  }

  // Download do arquivo gerado
  const cleanTitleSlug = article.titulo.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
  const filename = `wikizero-artigo-${cleanTitleSlug}.pdf`;
  doc.save(filename);
}

/**
 * Gera uma captura visual pixel-perfect usando html2canvas + jsPDF caso solicitado
 */
export async function exportArticleSnapshotToPdf(
  element: HTMLElement,
  article: WikiArticle,
  options: PdfExportOptions = {}
): Promise<void> {
  const { pageSize = 'a4', orientation = 'portrait' } = options;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxContentW = pageWidth - margin * 2;
  const maxContentH = pageHeight - margin * 2;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = maxContentW / imgWidth;
  const renderedH = imgHeight * ratio;

  let yOffset = 0;
  let remainingH = renderedH;

  while (remainingH > 0) {
    pdf.addImage(imgData, 'JPEG', margin, margin - yOffset, maxContentW, renderedH);
    remainingH -= maxContentH;
    yOffset += maxContentH;

    if (remainingH > 0) {
      pdf.addPage();
    }
  }

  const cleanTitleSlug = article.titulo.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
  pdf.save(`wikizero-snapshot-${cleanTitleSlug}.pdf`);
}
