import { jsPDF } from 'jspdf';
import { LgpdAccountDeletionRequest, LgpdDeletionRequestStatus } from '../types';

export type LgpdPdfStatusFilter = 'all' | 'pendente' | 'executada' | 'rejeitada' | 'cancelada';

export interface LgpdRemovalPdfExportOptions {
  generatedBy?: string;
  statusFilter?: LgpdPdfStatusFilter;
}

/**
 * Exporta o Relatório Oficial de Auditoria LGPD (Pedidos de Remoção / Anonimização de Dados)
 * seguindo rigorosamente o padrão executivo dos relatórios da WikiZero.
 */
export async function generateLgpdRemovalPdf(
  requests: LgpdAccountDeletionRequest[],
  options: LgpdRemovalPdfExportOptions = {}
): Promise<void> {
  const { generatedBy = 'WikiZero Compliance / DPO', statusFilter = 'all' } = options;

  let filteredRequests = [...requests];
  if (statusFilter !== 'all') {
    filteredRequests = filteredRequests.filter((r) => r.status === statusFilter);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  const drawMiniHeader = () => {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text('WIKIZERO • RELATÓRIO DE AUDITORIA LGPD', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Governança & Privacidade (Lei nº 13.709/2018)`,
      pageWidth - margin,
      10,
      { align: 'right' }
    );

    // Linha divisória de cabeçalho
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
    doc.restoreGraphicsState();
    currentY = 16;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      drawMiniHeader();
    }
  };

  const formatDatePtBr = (dateStr?: string) => {
    if (!dateStr) return 'Não processado';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Estatísticas para os cards
  const totalCount = requests.length;
  const approvedCount = requests.filter((r) => r.status === 'executada').length;
  const pendingCount = requests.filter((r) => r.status === 'pendente').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejeitada').length;
  const complianceRate = totalCount > 0 ? Math.round(((totalCount - pendingCount) / totalCount) * 100) : 100;

  // =========================================================================
  // 1. CABEÇALHO EXECUTIVO (SLATE-900)
  // =========================================================================
  const bannerHeight = 35;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2.5, 2.5, 'F');

  // Badge pill superior
  doc.setFillColor(225, 29, 72); // rose-600
  doc.roundedRect(margin + 5, currentY + 5, 62, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('AUDITORIA DE PRIVACIDADE & DPO', margin + 7, currentY + 8.2);

  // Título Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE PEDIDOS DE REMOÇÃO DE DADOS (LGPD)', margin + 5, currentY + 16);

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    'Registro Legal de Atendimento aos Titulares de Dados • Art. 18, VI da Lei nº 13.709/2018',
    margin + 5,
    currentY + 22
  );

  // Metadados inferiores
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(`Encarregado (DPO): ${generatedBy}`, margin + 5, currentY + 29);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Emissão: ${new Date().toLocaleString('pt-BR')} • Filtro: ${statusFilter.toUpperCase()} • Total: ${filteredRequests.length}`,
    margin + 68,
    currentY + 29
  );

  currentY += bannerHeight + 5;

  // =========================================================================
  // 2. FAIXA DE STATUS LEGAL
  // =========================================================================
  checkPageBreak(12);
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 9, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(190, 18, 60); // rose-700
  doc.text(`CONFORMIDADE REGULATÓRIA: LEI GERAL DE PROTEÇÃO DE DADOS`, margin + 4, currentY + 5.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Art. 18: Anonimização, Bloqueio ou Eliminação • Protocolos Auditáveis`,
    pageWidth - margin - 4,
    currentY + 5.8,
    { align: 'right' }
  );

  currentY += 13;

  // =========================================================================
  // 3. CARDS DE KPI (TOTAL, APROVADOS/PENDENTES, CONFORMIDADE)
  // =========================================================================
  checkPageBreak(30);
  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 26;

  // CARD 1: TOTAL DE PEDIDOS
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('VOLUME TOTAL', margin + 3.5, currentY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalCount} pedidos`, margin + 3.5, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${pendingCount} pendentes de análise`, margin + 3.5, currentY + 18.5);

  doc.setFillColor(37, 99, 235);
  doc.rect(margin + 3.5, currentY + 21.5, Math.min(cardWidth - 7, (totalCount * 8) + 10), 1.8, 'F');

  // CARD 2: CONCLUÍDOS / ANONIMIZADOS
  const card2X = margin + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('PROCESSADOS / EFETIVADOS', card2X + 3.5, currentY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${approvedCount} aprovados`, card2X + 3.5, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${rejectedCount} indeferidos com justificativa`, card2X + 3.5, currentY + 18.5);

  doc.setFillColor(16, 185, 129);
  doc.rect(card2X + 3.5, currentY + 21.5, Math.min(cardWidth - 7, (approvedCount * 12) + 10), 1.8, 'F');

  // CARD 3: TAXA DE RESOLUÇÃO DPO
  const card3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text('TAXA DE ATENDIMENTO', card3X + 3.5, currentY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${complianceRate}% atendidos`, card3X + 3.5, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Conformidade legal dos prazos', card3X + 3.5, currentY + 18.5);

  doc.setFillColor(217, 119, 6);
  doc.rect(card3X + 3.5, currentY + 21.5, (cardWidth - 7) * (complianceRate / 100), 1.8, 'F');

  currentY += cardHeight + 6;

  // =========================================================================
  // 4. LISTA DE SOLICITAÇÕES AUDITÁVEIS (SLATE-800 BANNER)
  // =========================================================================
  checkPageBreak(18);

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('REGISTRO OFICIAL DE SOLICITAÇÕES DOS TITULARES', margin + 3.5, currentY + 4.8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(147, 197, 253);
  doc.text(`[${filteredRequests.length} REGISTROS]`, pageWidth - margin - 3.5, currentY + 4.8, {
    align: 'right',
  });

  currentY += 11;

  for (const req of filteredRequests) {
    checkPageBreak(22);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, currentY, contentWidth, 19, 1.2, 1.2, 'FD');

    // Badge de Status
    let statusLabel = 'PENDENTE';
    let statusBg: [number, number, number] = [254, 243, 199];
    let statusColor: [number, number, number] = [180, 83, 9];

    if (req.status === 'executada') {
      statusLabel = 'EXECUTADA / ANONIMIZADO';
      statusBg = [236, 253, 245];
      statusColor = [16, 185, 129];
    } else if (req.status === 'rejeitada') {
      statusLabel = 'INDEFERIDO';
      statusBg = [255, 241, 242];
      statusColor = [225, 29, 72];
    } else if (req.status === 'cancelada') {
      statusLabel = 'CANCELADA';
      statusBg = [241, 245, 249];
      statusColor = [100, 116, 139];
    }

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(margin + 2.5, currentY + 2.5, 34, 4, 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusLabel, margin + 4, currentY + 5.3);

    // ID do Protocolo
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Protocolo: ${req.id}`, margin + 40, currentY + 5.3);

    // Data da Solicitação
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Solicitado em: ${formatDatePtBr(req.requestedAt)}`,
      pageWidth - margin - 3,
      currentY + 5.3,
      { align: 'right' }
    );

    // Linha 2: Titular e Pseudônimo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    const titularDesc = `Titular original: ${req.originalDisplayName || 'Não informado'} (${req.originalEmail || 'E-mail expurgado'})`;
    doc.text(titularDesc, margin + 3, currentY + 10.5);

    if (req.genericPseudonymAssigned) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(37, 99, 235);
      doc.text(`Assinatura pública: "${req.genericPseudonymAssigned}"`, pageWidth - margin - 3, currentY + 10.5, { align: 'right' });
    }

    // Linha 3: Motivo e Processamento
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const motivoText = req.userReason ? `Motivo informado: "${req.userReason.slice(0, 75)}"` : 'Motivo não declarado';
    doc.text(motivoText, margin + 3, currentY + 15.5);

    if (req.processedByName) {
      doc.text(
        `Auditor: ${req.processedByName} (${formatDatePtBr(req.processedAt)})`,
        pageWidth - margin - 3,
        currentY + 15.5,
        { align: 'right' }
      );
    }

    currentY += 21;
  }

  // =========================================================================
  // 5. CAIXA DE CONFORMIDADE LEGAL (LGPD & MARCO CIVIL)
  // =========================================================================
  checkPageBreak(28);

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Garantias Jurídicas & Governança de Dados da WikiZero', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `• Atendimento ao Artigo 18 da Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD).`,
    margin + 4,
    currentY + 11
  );
  doc.text(
    `• Preservação criptográfica estrita do Google UID para garantia de integridade e bloqueio de reincidência.`,
    margin + 4,
    currentY + 16
  );
  doc.text(
    `• Pseudonimização documental mantendo o valor histórico da enciclopédia sob a licença CC BY-SA 4.0 / GPLv3.`,
    margin + 4,
    currentY + 21
  );

  currentY += 28;

  // =========================================================================
  // 6. RODAPÉ UNIFICADO EM TODAS AS PÁGINAS (DOIS PASSOS)
  // =========================================================================
  const drawPageFooter = (pageNum: number, totalPages: number) => {
    doc.saveGraphicsState();
    const footerY = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `WikiZero • Auditoria Oficial LGPD • Relatório Gerado Automaticamente`,
      margin,
      footerY
    );

    doc.setFont('courier', 'bold');
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    doc.restoreGraphicsState();
  };

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(p, totalPages);
  }

  // Nome do arquivo gerado para download
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = `wikizero-auditoria-lgpd-remocao-dados-${dateSlug}.pdf`;
  doc.save(filename);
}
