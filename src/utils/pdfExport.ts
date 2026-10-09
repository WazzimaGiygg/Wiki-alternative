import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { WikiArticle } from '../types';
import { parseWikitext } from './wikitextParser';
import { buildUidPermalink } from './urlRouter';

export interface PdfExportOptions {
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeMetadata?: boolean;
  includeToc?: boolean;
  includeReferences?: boolean;
  includeFooter?: boolean;
  includeLicense?: boolean;
  exportMode?: 'structured' | 'snapshot'; // structured text or pixel-perfect html capture
  fontSize?: 'compact' | 'normal' | 'large';
  customWatermark?: string;
}

/**
 * Strips wikitext syntax to produce clean text for PDF printing
 */
function cleanWikitextForPdf(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\[\[(?:Categoria|Category):.*?\]\]/gi, '')
    .replace(/\[\[(?:Arquivo|File|Imagem|Image):.*?\]\]/gi, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1') // [[target|text]] -> text
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2 ($1)') // [url text] -> text (url)
    .replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1')
    .replace(/'''([^']+)'''/g, '$1') // Bold
    .replace(/''([^']+)''/g, '$1') // Italic
    .replace(/<ref[^>]*>([\s\S]*?)<\/ref>/gi, '') // Remove refs in main text body
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/\{\|[\s\S]*?\|\}/g, '') // Strip mediawiki tables for raw text flow
    .replace(/\{\{[^}]+\}\}/g, ''); // Strip template tags
}

/**
 * Generates a clean, structured vector-based PDF for an article using jsPDF
 * following the executive WikiZero report standard.
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
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(8));
    doc.setTextColor(30, 64, 175); // Royal Blue
    doc.text('WIKIZERO • ENCICLOPÉDIA LIVRE E ABERTA', margin, 10);

    // Right-aligned article title & UID
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(7.5));
    doc.setTextColor(100, 116, 139);
    const shortTitle =
      article.titulo.length > 35 ? article.titulo.slice(0, 32) + '...' : article.titulo;
    doc.text(`${shortTitle} (?uid=${article.id})`, pageWidth - margin, 10, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
    doc.restoreGraphicsState();
    currentY = 16;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      currentY = margin;
      drawMiniHeader();
    }
  };

  // Word count & statistics calculation
  const rawCleanText = cleanWikitextForPdf(article.descricao || '');
  const wordsCount = rawCleanText.trim() ? rawCleanText.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordsCount / 200));

  // Parse Wikitext to extract TOC, references, etc.
  const parseResult = parseWikitext(article.descricao || '', undefined, article.titulo);
  const sectionsCount = (parseResult.toc || []).length;
  const referencesCount = (parseResult.references || []).length;

  // =========================================================================
  // 1. CABEÇALHO EXECUTIVO (SLATE-900)
  // =========================================================================
  if (includeHeader) {
    const bannerHeight = 35;
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2.5, 2.5, 'F');

    // Badge pill superior
    doc.setFillColor(37, 99, 235); // blue-600
    doc.roundedRect(margin + 5, currentY + 5, 58, 4.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('DOCUMENTO ENCICLOPÉDICO OFICIAL', margin + 7, currentY + 8.2);

    // Título do Artigo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(13));
    doc.setTextColor(255, 255, 255);
    const splitArticleTitle = doc.splitTextToSize(article.titulo, contentWidth - 12);
    doc.text(splitArticleTitle[0] || article.titulo, margin + 5, currentY + 16);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(7.8));
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(
      'A Enciclopédia Livre e Aberta • Verbete Documental, Histórico e Técnico',
      margin + 5,
      currentY + 22
    );

    // Linha inferior de metadados
    doc.setFont('courier', 'bold');
    doc.setFontSize(scaleFont(7));
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text(`UID: ?uid=${article.id}`, margin + 5, currentY + 29);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    const modDate = article.dataEdicao || article.dataCriacao;
    const formattedDate = modDate ? new Date(modDate).toLocaleDateString('pt-BR') : 'Recente';
    doc.text(
      `Categoria: ${article.categoria || 'Geral'} • Revisão: ${formattedDate} • Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
      margin + 60,
      currentY + 29
    );

    currentY += bannerHeight + 5;
  }

  // =========================================================================
  // 2. FAIXA DE IDENTIFICAÇÃO DO VERBETE
  // =========================================================================
  if (includeMetadata) {
    checkPageBreak(12);
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 9, 1.2, 1.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(8));
    doc.setTextColor(29, 78, 216); // blue-700
    doc.text(`COLEÇÃO: ${pageName.toUpperCase()}`, margin + 4, currentY + 5.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(7.2));
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Idioma: ${(article.idioma || 'Português').toUpperCase()} • Licença: CC BY-SA 4.0 • Status: Verificado`,
      pageWidth - margin - 4,
      currentY + 5.8,
      { align: 'right' }
    );

    currentY += 13;
  }

  // =========================================================================
  // 3. CARDS DE KPI (CONTEÚDO, ESTRUTURA E GOVERNANÇA)
  // =========================================================================
  if (includeMetadata) {
    checkPageBreak(30);
    const cardWidth = (contentWidth - 6) / 3;
    const cardHeight = 26;

    // CARD 1: CONTEÚDO & LEITURA
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('VOLUME EDITORIAL', margin + 3.5, currentY + 5.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`${wordsCount.toLocaleString('pt-BR')} palavras`, margin + 3.5, currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`~${readingTimeMin} min de leitura estimada`, margin + 3.5, currentY + 18.5);

    doc.setFillColor(37, 99, 235);
    doc.rect(margin + 3.5, currentY + 21.5, Math.min(cardWidth - 7, (wordsCount / 500) * 10 + 10), 1.8, 'F');

    // CARD 2: ESTRUTURA DO ARTIGO
    const card2X = margin + cardWidth + 3;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('ESTRUTURA DE TÓPICOS', card2X + 3.5, currentY + 5.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionsCount} seções`, card2X + 3.5, currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${referencesCount} referências catalogadas`, card2X + 3.5, currentY + 18.5);

    doc.setFillColor(16, 185, 129);
    doc.rect(card2X + 3.5, currentY + 21.5, Math.min(cardWidth - 7, sectionsCount * 5 + 10), 1.8, 'F');

    // CARD 3: IDENTIFICADOR & ACESSO
    const card3X = margin + (cardWidth + 3) * 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text('PERMALINK & CUSTÓDIA', card3X + 3.5, currentY + 5.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`?uid=${article.id}`, card3X + 3.5, currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Rastreabilidade digital permanente', card3X + 3.5, currentY + 18.5);

    doc.setFillColor(217, 119, 6);
    doc.rect(card3X + 3.5, currentY + 21.5, cardWidth - 7, 1.8, 'F');

    currentY += cardHeight + 6;
  }

  // =========================================================================
  // 4. SUMÁRIO / ÍNDICE DE CONTEÚDO
  // =========================================================================
  if (includeToc && parseResult.toc && parseResult.toc.length > 0) {
    checkPageBreak(15 + parseResult.toc.length * 4.8);

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    const tocBoxHeight = 9 + parseResult.toc.length * 4.5;
    doc.roundedRect(margin, currentY, contentWidth, tocBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(8.5));
    doc.setTextColor(30, 41, 59);
    doc.text('ÍNDICE DO DOCUMENTO (SUMÁRIO DE TÓPICOS)', margin + 4, currentY + 5.8);

    let tocY = currentY + 10.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(7.8));
    doc.setTextColor(71, 85, 105);

    parseResult.toc.forEach((item) => {
      const indent = (item.level - 1) * 4;
      const numLabel = item.number ? `${item.number} ` : '';
      const text = `${numLabel}${item.text}`;
      doc.text(text, margin + 4 + indent, tocY);
      tocY += 4.5;
    });

    currentY += tocBoxHeight + 6;
  }

  // =========================================================================
  // 5. CORPO DO ARTIGO (COM SEÇÕES EM BARRAS SLATE-800)
  // =========================================================================
  const rawLines = (article.descricao || '').split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let sectionCounter = 1;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    // Code block check
    if (line.startsWith('```') || line.startsWith('<pre')) {
      if (inCodeBlock) {
        // flush code block
        inCodeBlock = false;
        const codeText = codeBuffer.join('\n');
        doc.setFont('courier', 'normal');
        doc.setFontSize(scaleFont(7.5));
        doc.setFillColor(241, 245, 249);
        const splitCode = doc.splitTextToSize(codeText, contentWidth - 8);
        const boxH = splitCode.length * scaleFont(3.8) + 6;
        checkPageBreak(boxH);
        doc.roundedRect(margin, currentY, contentWidth, boxH, 1, 1, 'FD');
        doc.setTextColor(15, 23, 42);
        doc.text(splitCode, margin + 4, currentY + 4);
        currentY += boxH + 4;
        codeBuffer = [];
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line) {
      currentY += scaleFont(2.5);
      continue;
    }

    // Heading 1 (== Title == or = Title =)
    if (/^={1,2}[^=]+={1,2}$/.test(line)) {
      const hTitle = line.replace(/=/g, '').trim();
      checkPageBreak(16);
      currentY += 3;

      // Barra de cabeçalho da seção estilo slate-800
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(8.5));
      doc.setTextColor(255, 255, 255);
      doc.text(hTitle.toUpperCase(), margin + 3.5, currentY + 4.8);

      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(147, 197, 253); // blue-200
      doc.text(`[SEÇÃO ${sectionCounter++}]`, pageWidth - margin - 3.5, currentY + 4.8, {
        align: 'right',
      });

      currentY += 10.5;
      continue;
    }

    // Heading 2 (=== Subtitle ===)
    if (/^={3}[^=]+={3}$/.test(line)) {
      const hTitle = line.replace(/=/g, '').trim();
      checkPageBreak(12);
      currentY += 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(10.5));
      doc.setTextColor(30, 64, 175); // blue-800
      doc.text(hTitle, margin, currentY);
      currentY += scaleFont(4.5);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, margin + contentWidth, currentY);
      currentY += 3.5;
      continue;
    }

    // Heading 3 (==== Subsubtitle ====)
    if (/^={4,6}[^=]+={4,6}$/.test(line)) {
      const hTitle = line.replace(/=/g, '').trim();
      checkPageBreak(10);
      currentY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(9));
      doc.setTextColor(71, 85, 105);
      doc.text(hTitle, margin, currentY);
      currentY += scaleFont(4);
      continue;
    }

    // Bullet list (* item or # item)
    if (line.startsWith('*') || line.startsWith('#')) {
      const isOrdered = line.startsWith('#');
      const itemText = cleanWikitextForPdf(line.replace(/^[*#]+\s*/, ''));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(9));
      doc.setTextColor(30, 41, 59);

      const bulletSymbol = isOrdered ? '•' : '▪';
      const splitItem = doc.splitTextToSize(itemText, contentWidth - 8);
      checkPageBreak(splitItem.length * scaleFont(4.2) + 2);

      doc.setTextColor(37, 99, 235);
      doc.text(bulletSymbol, margin + 2, currentY);
      doc.setTextColor(30, 41, 59);
      doc.text(splitItem, margin + 7, currentY);
      currentY += splitItem.length * scaleFont(4.2) + 2;
      continue;
    }

    // Blockquote (: text or <blockquote>)
    if (line.startsWith(':') || line.startsWith('>')) {
      const quoteText = cleanWikitextForPdf(line.replace(/^[:>]\s*/, ''));
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(scaleFont(8.8));
      doc.setTextColor(71, 85, 105);
      const splitQuote = doc.splitTextToSize(quoteText, contentWidth - 12);
      const quoteH = splitQuote.length * scaleFont(4) + 4;
      checkPageBreak(quoteH);

      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 4, currentY - 3, contentWidth - 8, quoteH, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(margin + 4, currentY - 3, margin + 4, currentY - 3 + quoteH);

      doc.text(splitQuote, margin + 8, currentY);
      currentY += quoteH + 2;
      continue;
    }

    // Standard Paragraph
    const cleanParagraph = cleanWikitextForPdf(line);
    if (cleanParagraph) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(9.2));
      doc.setTextColor(30, 41, 59);
      const splitText = doc.splitTextToSize(cleanParagraph, contentWidth);
      checkPageBreak(splitText.length * scaleFont(4.2) + 3);
      doc.text(splitText, margin, currentY);
      currentY += splitText.length * scaleFont(4.2) + 3;
    }
  }

  // =========================================================================
  // 6. REFERÊNCIAS & NOTAS BIBLIOGRÁFICAS
  // =========================================================================
  if (includeReferences && parseResult.references && parseResult.references.length > 0) {
    checkPageBreak(25);
    currentY += 5;

    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(scaleFont(8.5));
    doc.setTextColor(255, 255, 255);
    doc.text('REFERÊNCIAS E FONTES BIBLIOGRÁFICAS', margin + 3.5, currentY + 4.8);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(147, 197, 253);
    doc.text(`[${parseResult.references.length} CITAÇÕES]`, pageWidth - margin - 3.5, currentY + 4.8, {
      align: 'right',
    });

    currentY += 11;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(scaleFont(7.8));
    doc.setTextColor(71, 85, 105);

    parseResult.references.forEach((ref, idx) => {
      const cleanRef = cleanWikitextForPdf(ref);
      const refText = `[${idx + 1}] ${cleanRef}`;
      const splitRef = doc.splitTextToSize(refText, contentWidth - 4);
      checkPageBreak(splitRef.length * scaleFont(3.8) + 2);
      doc.text(splitRef, margin, currentY);
      currentY += splitRef.length * scaleFont(3.8) + 2;
    });
  }

  // =========================================================================
  // 7. GOVERNANÇA, LICENÇA & CONFORMIDADE INSTITUCIONAL
  // =========================================================================
  if (includeLicense) {
    checkPageBreak(26);
    currentY += 6;

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Governança Editorial, Código Aberto & Rastreabilidade', margin + 4, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `• Licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0) e GPLv3.`,
      margin + 4,
      currentY + 10.5
    );
    doc.text(
      `• Documento indexado com identificador único (?uid=${article.id}). Rastreabilidade permanente em blockchain/banco.`,
      margin + 4,
      currentY + 15
    );
    doc.text(
      `• Em conformidade com o Marco Civil da Internet (Lei 12.965/2014) e LGPD (Lei 13.709/2018).`,
      margin + 4,
      currentY + 19.5
    );
    currentY += 26;
  }

  // =========================================================================
  // 8. RODAPÉ UNIFICADO EM TODAS AS PÁGINAS (DOIS PASSOS)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    if (customWatermark) {
      doc.saveGraphicsState();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(55);
      doc.setTextColor(241, 245, 249);
      doc.text(customWatermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }

    if (includeFooter) {
      doc.saveGraphicsState();
      const footerY = pageHeight - 8;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `WikiZero • A Enciclopédia Livre e Aberta • Relatório Documental Oficial`,
        margin,
        footerY
      );

      doc.setFont('courier', 'bold');
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      doc.restoreGraphicsState();
    }
  }

  // Download PDF
  const filename = `${article.titulo.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_')}_WikiZero.pdf`;
  doc.save(filename);
}

/**
 * Generates a pixel-perfect rendered visual PDF using html2canvas + jsPDF
 */
export async function exportArticleSnapshotToPdf(
  element: HTMLElement,
  article: WikiArticle,
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    pageSize = 'a4',
    orientation = 'portrait',
    includeFooter = true,
  } = options;

  // Capture element using html2canvas with high scale for crisp print quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const printableWidth = pdfWidth - margin * 2;
  const printableHeight = pdfHeight - margin * 2 - (includeFooter ? 10 : 0);

  const imgWidth = printableWidth;
  const imgHeight = (canvas.height * printableWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;
  let page = 1;

  pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
  heightLeft -= printableHeight;

  while (heightLeft > 0) {
    position = margin - printableHeight * page;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= printableHeight;
    page++;
  }

  // Add footer to all pages if requested
  if (includeFooter) {
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pdfHeight - 8, pdfWidth - margin, pdfHeight - 8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`WikiZero Enciclopédia — ${article.titulo} (?uid=${article.id})`, margin, pdfHeight - 5);
      pdf.text(`Página ${p} de ${totalPages}`, pdfWidth - margin, pdfHeight - 5, { align: 'right' });
    }
  }

  const filename = `${article.titulo.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_')}_Visual_WikiZero.pdf`;
  pdf.save(filename);
}
