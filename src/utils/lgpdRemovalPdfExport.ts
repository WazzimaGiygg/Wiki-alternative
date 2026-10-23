import { jsPDF } from 'jspdf';
import { LgpdAccountDeletionRequest, LgpdDeletionRequestStatus } from '../types';
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
    drawPdfStandardMiniHeader(
      doc,
      'WIKIZERO • RELATÓRIO DE AUDITORIA LGPD',
      'Governança & Privacidade (Lei nº 13.709/2018)',
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
  // 1. HERO BANNER PADRONIZADO (CARD BRANCO COM BORDA E LOGOTIPO COLORIDO)
  // =========================================================================
  const heroHeight = 36;
  drawPdfStandardHeroBanner(
    doc,
    currentY,
    {
      categoryTag: 'AUDITORIA DE PRIVACIDADE & DPO',
      title: 'RELATÓRIO DE PEDIDOS DE REMOÇÃO DE DADOS (LGPD)',
      subtitle: 'Registro Legal de Atendimento aos Titulares de Dados • Art. 18 da Lei nº 13.709/2018',
      metadataLine: `Encarregado (DPO): ${generatedBy} • Emissão: ${new Date().toLocaleString('pt-BR')} • Filtro: ${statusFilter.toUpperCase()} • Total: ${filteredRequests.length}`,
      height: heroHeight,
    },
    margin,
    contentWidth
  );

  currentY += heroHeight + 5;

  // =========================================================================
  // 2. FAIXA DE STATUS LEGAL
  // =========================================================================
  checkPageBreak(12);
  drawPdfStandardCategoryBanner(
    doc,
    currentY,
    'CONFORMIDADE REGULATÓRIA: LEI GERAL DE PROTEÇÃO DE DADOS (ART. 18)',
    [225, 29, 72],
    [255, 255, 255],
    margin,
    contentWidth
  );
  currentY += 8.5;

  // =========================================================================
  // 3. GRADE COM 4 CARDS DE KPIS PADRONIZADOS
  // =========================================================================
  checkPageBreak(20);

  const kpis: PdfKpiCard[] = [
    {
      title: 'VOLUME TOTAL',
      val: `${totalCount}`,
      sub: `${pendingCount} pendentes`,
      bg: [239, 246, 255],
      border: [191, 219, 254],
      textCol: [29, 78, 216],
    },
    {
      title: 'PROCESSADOS',
      val: `${approvedCount}`,
      sub: 'Anonimizados',
      bg: [236, 253, 245],
      border: [167, 243, 208],
      textCol: [5, 150, 105],
    },
    {
      title: 'INDEFERIDOS',
      val: `${rejectedCount}`,
      sub: 'Com justificativa',
      bg: [255, 241, 242],
      border: [254, 205, 211],
      textCol: [225, 29, 72],
    },
    {
      title: 'RESOLUÇÃO DPO',
      val: `${complianceRate}%`,
      sub: 'Prazos legais',
      bg: [254, 243, 199],
      border: [253, 230, 138],
      textCol: [180, 83, 9],
    },
  ];

  drawPdfStandardKpiCards(doc, currentY, kpis, margin, contentWidth, 16);
  currentY += 16 + 6;

  // =========================================================================
  // 4. LISTA DE SOLICITAÇÕES AUDITÁVEIS
  // =========================================================================
  checkPageBreak(18);

  drawPdfStandardSectionHeader(
    doc,
    currentY,
    'REGISTRO OFICIAL DE SOLICITAÇÕES DOS TITULARES',
    `[${filteredRequests.length} REGISTROS]`,
    margin,
    contentWidth,
    pageWidth
  );
  currentY += 10;

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

  const extraBullets = [
    '• Atendimento ao Artigo 18 da Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD).',
    '• Preservação criptográfica estrita do Google UID para garantia de integridade e bloqueio de reincidência.',
    '• Pseudonimização documental mantendo o valor histórico da enciclopédia sob a licença CC BY-SA 4.0 / GPLv3.',
  ];

  const boxH = drawPdfStandardGovernanceBox(doc, currentY, margin, contentWidth, extraBullets);
  currentY += boxH + 6;

  // =========================================================================
  // 6. RODAPÉ UNIFICADO EM TODAS AS PÁGINAS (PADRÃO DO PDF ANEXADO)
  // =========================================================================
  drawPdfStandardFooters(
    doc,
    'Auditoria Oficial LGPD',
    margin,
    pageWidth,
    pageHeight
  );

  // Nome do arquivo gerado para download
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = `wikizero-auditoria-lgpd-remocao-dados-${dateSlug}.pdf`;
  doc.save(filename);
}
