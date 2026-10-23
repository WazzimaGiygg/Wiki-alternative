import { jsPDF } from 'jspdf';

export interface PdfKpiCard {
  title: string;
  val: string;
  sub: string;
  bg?: [number, number, number];
  border?: [number, number, number];
  textCol?: [number, number, number];
}

export interface StandardPdfHeroOptions {
  categoryTag: string;
  title: string;
  subtitle: string;
  metadataLine: string;
  height?: number;
}

/**
 * Desenha o logotipo quadrado oficial colorido do WikiZero (bloco geométrico + 'W')
 * exatamente conforme o modelo padronizado do PDF anexado.
 */
export function drawPdfStandardLogo(
  doc: jsPDF,
  x: number,
  y: number,
  size: number = 22
): void {
  doc.saveGraphicsState();

  // Fundo escuro do badge do logotipo
  doc.setFillColor(15, 23, 42); // slate-900
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, size, size, 1.8, 1.8, 'FD');

  // Grid interno geométrico 3x3 de blocos coloridos (representando o conhecimento enciclopédico)
  const pad = 2.2;
  const innerSize = size - pad * 2;
  const colSize = innerSize / 3;

  // Linha 1
  doc.setFillColor(239, 68, 68); // Vermelho
  doc.rect(x + pad, y + pad, colSize - 0.4, colSize - 0.4, 'F');
  doc.setFillColor(59, 130, 246); // Azul
  doc.rect(x + pad + colSize, y + pad, colSize - 0.4, colSize - 0.4, 'F');
  doc.setFillColor(16, 185, 129); // Verde
  doc.rect(x + pad + colSize * 2, y + pad, colSize - 0.4, colSize - 0.4, 'F');

  // Linha 2
  doc.setFillColor(245, 158, 11); // Âmbar
  doc.rect(x + pad, y + pad + colSize, colSize - 0.4, colSize - 0.4, 'F');
  doc.setFillColor(147, 51, 234); // Púrpura
  doc.rect(x + pad + colSize, y + pad + colSize, colSize - 0.4, colSize - 0.4, 'F');
  doc.setFillColor(6, 182, 212); // Ciano
  doc.rect(x + pad + colSize * 2, y + pad + colSize, colSize - 0.4, colSize - 0.4, 'F');

  // Linha 3
  doc.setFillColor(16, 185, 129); // Verde
  doc.rect(x + pad, y + pad + colSize * 2, colSize - 0.4, colSize - 0.4, 'F');
  doc.setFillColor(239, 68, 68); // Vermelho
  doc.rect(x + pad + colSize, y + pad + colSize * 2, colSize - 0.4, colSize - 0.4, 'F');
  doc.setFillColor(59, 130, 246); // Azul
  doc.rect(x + pad + colSize * 2, y + pad + colSize * 2, colSize - 0.4, colSize - 0.4, 'F');

  // Monograma central estilizado 'W'
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('W', x + size / 2, y + size / 2 + 3.2, { align: 'center' });

  doc.restoreGraphicsState();
}

/**
 * Desenha o Hero Banner Padronizado (Card Branco com Borda, Logotipo à Esquerda e Tipografia Nítida)
 */
export function drawPdfStandardHeroBanner(
  doc: jsPDF,
  y: number,
  options: StandardPdfHeroOptions,
  margin: number,
  contentWidth: number
): number {
  const { categoryTag, title, subtitle, metadataLine, height = 36 } = options;

  doc.saveGraphicsState();

  // Card branco com contorno fino nítido
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, height, 2.5, 2.5, 'FD');

  // Logotipo quadrado oficial à esquerda
  const logoSize = 22;
  const logoX = margin + 5;
  const logoY = y + 7;
  drawPdfStandardLogo(doc, logoX, logoY, logoSize);

  const textStartX = margin + 31;
  const maxTextWidth = contentWidth - 36;

  // 1. Tag de categoria em caixa alta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(categoryTag.toUpperCase(), textStartX, y + 8.5);

  // 2. Título Principal em negrito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const splitTitle = doc.splitTextToSize(title, maxTextWidth);
  const titleY = y + 15.5;
  doc.text(splitTitle[0] || title, textStartX, titleY);

  // 3. Subtítulo descritivo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  const splitSubtitle = doc.splitTextToSize(subtitle, maxTextWidth);
  doc.text(splitSubtitle[0] || subtitle, textStartX, y + 22.5);

  // 4. Linha de Metadados / Emissão
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  const splitMeta = doc.splitTextToSize(metadataLine, maxTextWidth);
  doc.text(splitMeta[0] || metadataLine, textStartX, y + 29.5);

  doc.restoreGraphicsState();
  return height;
}

/**
 * Desenha a grade com exatamente 4 cartões de KPIs (Total, Impacto, Adições, Deleções/Status)
 */
export function drawPdfStandardKpiCards(
  doc: jsPDF,
  y: number,
  kpis: PdfKpiCard[],
  margin: number,
  contentWidth: number,
  height: number = 16
): number {
  doc.saveGraphicsState();

  const count = kpis.length;
  const gap = 3;
  const cardWidth = (contentWidth - (count - 1) * gap) / count;

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + gap);

    const bg = kpi.bg || [248, 250, 252];
    const border = kpi.border || [226, 232, 240];
    const textCol = kpi.textCol || [30, 41, 59];

    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, y, cardWidth, height, 1.5, 1.5, 'FD');

    // Título do KPI (small uppercase)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(textCol[0], textCol[1], textCol[2]);
    doc.text(kpi.title.toUpperCase(), cardX + 3.2, y + 4.5);

    // Valor Numérico em Destaque
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 3.2, y + 10.5);

    // Rótulo Inferior / Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3.2, y + 14);
  });

  doc.restoreGraphicsState();
  return height;
}

/**
 * Desenha a faixa de cabeçalho de seção (Título da seção à esquerda + Badge com contagem entre colchetes à direita)
 */
export function drawPdfStandardSectionHeader(
  doc: jsPDF,
  y: number,
  title: string,
  badgeCountText: string,
  margin: number,
  contentWidth: number,
  pageWidth: number
): number {
  doc.saveGraphicsState();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title.toUpperCase(), margin, y + 5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(badgeCountText, pageWidth - margin, y + 5, { align: 'right' });

  // Linha fina separadora
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

  doc.restoreGraphicsState();
  return 10;
}

/**
 * Desenha o banner de contorno da Categoria (ex.: CATEGORIA: NOVIDADE & RECURSO)
 */
export function drawPdfStandardCategoryBanner(
  doc: jsPDF,
  y: number,
  categoryLabel: string,
  colorRgb: [number, number, number] = [16, 185, 129],
  bgColorRgb: [number, number, number] = [255, 255, 255],
  margin: number,
  contentWidth: number
): number {
  doc.saveGraphicsState();

  const height = 6.2;
  doc.setFillColor(bgColorRgb[0], bgColorRgb[1], bgColorRgb[2]);
  doc.setDrawColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, height, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  doc.text(`CATEGORIA: ${categoryLabel.toUpperCase()}`, margin + 3.5, y + 4.3);

  doc.restoreGraphicsState();
  return height;
}

/**
 * Desenha o cabeçalho corrido mini das páginas seguintes (Páginas 2 em diante)
 */
export function drawPdfStandardMiniHeader(
  doc: jsPDF,
  leftText: string,
  rightText: string,
  margin: number,
  pageWidth: number
): void {
  doc.saveGraphicsState();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175); // Royal blue
  doc.text(leftText.toUpperCase(), margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(rightText, pageWidth - margin, 10, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 12, pageWidth - margin, 12);

  doc.restoreGraphicsState();
}

/**
 * Estampa o rodapé oficial padronizado em todas as páginas do documento gerado
 */
export function drawPdfStandardFooters(
  doc: jsPDF,
  documentTypeLabel: string,
  margin: number,
  pageWidth: number,
  pageHeight: number
): void {
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();

    const footerY = pageHeight - 8;

    // Linha divisória de rodapé
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    // Texto de emissão à esquerda em tom rosa/carmesim sutil conforme PDF de referência
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(
      `WikiZero • ${documentTypeLabel} • Relatório Gerado Automaticamente`,
      margin,
      footerY
    );

    // Paginação à direita em negrito
    doc.setFont('courier', 'bold');
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });

    doc.restoreGraphicsState();
  }
}

/**
 * Desenha a caixa final de Governança, Código Aberto & Rastreabilidade Técnica
 */
export function drawPdfStandardGovernanceBox(
  doc: jsPDF,
  y: number,
  margin: number,
  contentWidth: number,
  extraBullets?: string[]
): number {
  doc.saveGraphicsState();

  const baseBullets = [
    '• Repositório público versionado sob a licença pública GPLv3 • https://github.com/WazzimaGiygg/Wiki-alternative',
    '• Rastreabilidade total de commits, integridade criptográfica SHA-1 e autoria auditável de código.',
    '• Em conformidade com o Marco Civil da Internet (Lei 12.965/2014) e governança de dados da LGPD (Lei 13.709/2018).',
  ];

  const allBullets = extraBullets && extraBullets.length > 0 ? [...baseBullets, ...extraBullets] : baseBullets;
  const boxHeight = 12 + allBullets.length * 4.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Governança, Código Aberto & Rastreabilidade Técnica', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);

  allBullets.forEach((bullet, bIdx) => {
    doc.text(bullet, margin + 4, y + 11.5 + bIdx * 4.5);
  });

  doc.restoreGraphicsState();
  return boxHeight;
}
