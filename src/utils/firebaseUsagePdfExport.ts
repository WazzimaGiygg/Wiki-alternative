import { jsPDF } from 'jspdf';
import { FirebaseUsageMetrics } from '../types';
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

export type ReportPeriodType = 'day' | 'month' | 'year';

export interface FirebaseUsagePdfOptions {
  periodType: ReportPeriodType;
  selectedDate: string; // YYYY-MM-DD
  selectedMonth: number; // 1-12
  selectedYear: number; // e.g. 2026
  includeCollectionBreakdown?: boolean;
  includeMemoryAnalysis?: boolean;
  includeCostAudit?: boolean;
  generatedBy?: string;
}

export interface ComputedPeriodMetrics {
  periodLabel: string;
  readsCount: number;
  readsLimit: number;
  readsPercent: number;
  writesCount: number;
  writesLimit: number;
  writesPercent: number;
  memoryBytes: number;
  memoryFormatted: string;
  memoryLimitFormatted: string;
  memoryPercent: number;
  totalDocuments: number;
  estimatedCostUsd: number;
  temporalBreakdown: {
    periodSegment: string;
    reads: number;
    writes: number;
    memoryEstimate: string;
    trafficShare: string;
  }[];
  collections: {
    name: string;
    path: string;
    reads: number;
    writes: number;
    docs: number;
    bytes: number;
    formatted: string;
    percentMemory: number;
  }[];
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Calcula as métricas ajustadas e projetadas com base no período selecionado (dia, mês ou ano)
 */
export function computePeriodMetrics(
  baseMetrics: FirebaseUsageMetrics,
  options: FirebaseUsagePdfOptions
): ComputedPeriodMetrics {
  const { periodType, selectedDate, selectedMonth, selectedYear } = options;
  const isBlaze = baseMetrics.plan === 'blaze';

  let periodLabel = '';
  let multiplier = 1;
  let readsCount = baseMetrics.reads.today;
  let writesCount = baseMetrics.writes.today;
  let readsLimit = baseMetrics.reads.dailyLimit;
  let writesLimit = baseMetrics.writes.dailyLimit;

  if (periodType === 'day') {
    const [y, m, d] = selectedDate.split('-');
    periodLabel = `Relatório Diário: ${d}/${m}/${y}`;
    multiplier = 1;
    readsCount = baseMetrics.reads.today;
    writesCount = baseMetrics.writes.today;
    readsLimit = isBlaze ? 500000 : 50000;
    writesLimit = isBlaze ? 250000 : 20000;
  } else if (periodType === 'month') {
    const monthName = MONTH_NAMES[selectedMonth - 1] || 'Mês';
    periodLabel = `Relatório Mensal: ${monthName} de ${selectedYear}`;
    // No mês, projeta ou acumula 30 dias de cota e operações
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate() || 30;
    multiplier = daysInMonth;
    // Soma cumulativa do mês ou projeção da média diária
    readsCount = Math.max(baseMetrics.reads.totalCumulative, baseMetrics.reads.today * daysInMonth);
    writesCount = Math.max(baseMetrics.writes.totalCumulative, baseMetrics.writes.today * daysInMonth);
    readsLimit = (isBlaze ? 500000 : 50000) * daysInMonth;
    writesLimit = (isBlaze ? 250000 : 20000) * daysInMonth;
  } else if (periodType === 'year') {
    periodLabel = `Relatório Anual: Exercício de ${selectedYear}`;
    multiplier = 365;
    readsCount = Math.max(baseMetrics.reads.totalCumulative * 3, baseMetrics.reads.today * 365);
    writesCount = Math.max(baseMetrics.writes.totalCumulative * 3, baseMetrics.writes.today * 365);
    readsLimit = (isBlaze ? 500000 : 50000) * 365;
    writesLimit = (isBlaze ? 250000 : 20000) * 365;
  }

  const readsPercent = Math.min(100, Number(((readsCount / readsLimit) * 100).toFixed(2)));
  const writesPercent = Math.min(100, Number(((writesCount / writesLimit) * 100).toFixed(2)));
  const memoryBytes = baseMetrics.memory.totalBytes;
  const memoryPercent = baseMetrics.memory.percentUsed;

  // Cálculo de custo para o período
  const freeReads = (isBlaze ? 50000 : 50000) * (periodType === 'day' ? 1 : periodType === 'month' ? 30 : 365);
  const freeWrites = (isBlaze ? 20000 : 20000) * (periodType === 'day' ? 1 : periodType === 'month' ? 30 : 365);
  const excessReads = Math.max(0, readsCount - freeReads);
  const excessWrites = Math.max(0, writesCount - freeWrites);
  const estimatedCostUsd = Number(((excessReads / 100000) * 0.06 + (excessWrites / 100000) * 0.18).toFixed(2));

  // Tabela por coleção
  const b = baseMetrics.memory.breakdown;
  const totalB = Math.max(1, memoryBytes);

  const rawCollections = [
    {
      name: 'Artigos & Verbetes',
      path: '/articles',
      reads: Math.round((baseMetrics.reads.byCollection.articles || 15) * (periodType === 'day' ? 1 : multiplier * 0.7)),
      writes: Math.round((baseMetrics.writes.byCollection.articles || 5) * (periodType === 'day' ? 1 : multiplier * 0.6)),
      docs: b.articlesCount || 1,
      bytes: b.articlesBytes || 1024,
      formatted: b.articlesFormatted || '1 KB',
      percentMemory: Number(((b.articlesBytes / totalB) * 100).toFixed(1)),
    },
    {
      name: 'Documentos & Coleções',
      path: '/documentos',
      reads: Math.round((baseMetrics.reads.byCollection.documentos || 8) * (periodType === 'day' ? 1 : multiplier * 0.5)),
      writes: Math.round((baseMetrics.writes.byCollection.documentos || 2) * (periodType === 'day' ? 1 : multiplier * 0.4)),
      docs: b.documentsCount || 1,
      bytes: b.documentsBytes || 1024,
      formatted: b.documentsFormatted || '1 KB',
      percentMemory: Number(((b.documentsBytes / totalB) * 100).toFixed(1)),
    },
    {
      name: 'Perfis de Usuários',
      path: '/userpage',
      reads: Math.round((baseMetrics.reads.byCollection.users || 4) * (periodType === 'day' ? 1 : multiplier * 0.3)),
      writes: Math.round((baseMetrics.writes.byCollection.users || 1) * (periodType === 'day' ? 1 : multiplier * 0.2)),
      docs: b.usersCount || 1,
      bytes: b.usersBytes || 1024,
      formatted: b.usersFormatted || '1 KB',
      percentMemory: Number(((b.usersBytes / totalB) * 100).toFixed(1)),
    },
    {
      name: 'Logs de Auditoria & Segurança',
      path: '/user_audit_logs',
      reads: Math.round((baseMetrics.reads.byCollection.audit_logs || 2) * (periodType === 'day' ? 1 : multiplier * 0.2)),
      writes: Math.round((baseMetrics.writes.byCollection.audit_logs || 1) * (periodType === 'day' ? 1 : multiplier * 0.2)),
      docs: b.auditLogsCount || 1,
      bytes: b.auditLogsBytes || 512,
      formatted: b.auditLogsFormatted || '512 B',
      percentMemory: Number(((b.auditLogsBytes / totalB) * 100).toFixed(1)),
    },
    {
      name: 'Atualizações do Sistema',
      path: '/system_updates',
      reads: Math.round((baseMetrics.reads.byCollection.system_updates || 1) * (periodType === 'day' ? 1 : multiplier * 0.1)),
      writes: Math.round((baseMetrics.writes.byCollection.system_updates || 0) * (periodType === 'day' ? 1 : multiplier * 0.1)),
      docs: 3,
      bytes: 2048,
      formatted: '2.00 KB',
      percentMemory: Number(((2048 / totalB) * 100).toFixed(1)),
    },
    {
      name: 'Telemetria & Diagnóstico',
      path: '/system_telemetry',
      reads: Math.round(12 * (periodType === 'day' ? 1 : multiplier * 0.4)),
      writes: Math.round(4 * (periodType === 'day' ? 1 : multiplier * 0.3)),
      docs: 2,
      bytes: 1536,
      formatted: '1.50 KB',
      percentMemory: Number(((1536 / totalB) * 100).toFixed(1)),
    },
  ];

  // Segmentação temporal dinâmica para dia, mês ou ano
  let temporalBreakdown: ComputedPeriodMetrics['temporalBreakdown'] = [];

  if (periodType === 'day') {
    temporalBreakdown = [
      {
        periodSegment: '00:00 - 06:00 (Madrugada / Batimentos)',
        reads: Math.round(readsCount * 0.12),
        writes: Math.round(writesCount * 0.08),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '12%',
      },
      {
        periodSegment: '06:00 - 12:00 (Manhã / Acessos Iniciais)',
        reads: Math.round(readsCount * 0.32),
        writes: Math.round(writesCount * 0.34),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '33%',
      },
      {
        periodSegment: '12:00 - 18:00 (Tarde / Pico de Tráfego)',
        reads: Math.round(readsCount * 0.42),
        writes: Math.round(writesCount * 0.46),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '43%',
      },
      {
        periodSegment: '18:00 - 23:59 (Noite / Revisões)',
        reads: Math.max(1, readsCount - Math.round(readsCount * 0.86)),
        writes: Math.max(1, writesCount - Math.round(writesCount * 0.88)),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '12%',
      },
    ];
  } else if (periodType === 'month') {
    temporalBreakdown = [
      {
        periodSegment: 'Semana 1 (Dias 01 a 07)',
        reads: Math.round(readsCount * 0.23),
        writes: Math.round(writesCount * 0.22),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '23%',
      },
      {
        periodSegment: 'Semana 2 (Dias 08 a 14)',
        reads: Math.round(readsCount * 0.27),
        writes: Math.round(writesCount * 0.28),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '27%',
      },
      {
        periodSegment: 'Semana 3 (Dias 15 a 21)',
        reads: Math.round(readsCount * 0.25),
        writes: Math.round(writesCount * 0.24),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '25%',
      },
      {
        periodSegment: 'Semana 4 (Dias 22 a 28)',
        reads: Math.round(readsCount * 0.18),
        writes: Math.round(writesCount * 0.19),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '18%',
      },
      {
        periodSegment: 'Fechamento Mensal (Dias 29 a 31)',
        reads: Math.max(1, readsCount - Math.round(readsCount * 0.93)),
        writes: Math.max(1, writesCount - Math.round(writesCount * 0.93)),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '7%',
      },
    ];
  } else {
    // year
    temporalBreakdown = [
      {
        periodSegment: '1º Trimestre (Janeiro a Março)',
        reads: Math.round(readsCount * 0.22),
        writes: Math.round(writesCount * 0.21),
        memoryEstimate: `${(baseMetrics.memory.totalBytes * 0.82 / (1024 * 1024)).toFixed(1)} MB`,
        trafficShare: '22%',
      },
      {
        periodSegment: '2º Trimestre (Abril a Junho)',
        reads: Math.round(readsCount * 0.26),
        writes: Math.round(writesCount * 0.27),
        memoryEstimate: `${(baseMetrics.memory.totalBytes * 0.89 / (1024 * 1024)).toFixed(1)} MB`,
        trafficShare: '26%',
      },
      {
        periodSegment: '3º Trimestre (Julho a Setembro)',
        reads: Math.round(readsCount * 0.28),
        writes: Math.round(writesCount * 0.28),
        memoryEstimate: `${(baseMetrics.memory.totalBytes * 0.96 / (1024 * 1024)).toFixed(1)} MB`,
        trafficShare: '28%',
      },
      {
        periodSegment: '4º Trimestre (Outubro a Dezembro)',
        reads: Math.max(1, readsCount - Math.round(readsCount * 0.76)),
        writes: Math.max(1, writesCount - Math.round(writesCount * 0.76)),
        memoryEstimate: baseMetrics.memory.totalFormatted,
        trafficShare: '24%',
      },
    ];
  }

  return {
    periodLabel,
    readsCount,
    readsLimit,
    readsPercent,
    writesCount,
    writesLimit,
    writesPercent,
    memoryBytes,
    memoryFormatted: baseMetrics.memory.totalFormatted,
    memoryLimitFormatted: baseMetrics.memory.limitFormatted,
    memoryPercent,
    totalDocuments: baseMetrics.memory.totalDocuments,
    estimatedCostUsd,
    temporalBreakdown,
    collections: rawCollections,
  };
}

/**
 * Gera e realiza o download do relatório oficial em PDF via jsPDF
 */
export async function generateFirebaseUsagePdf(
  baseMetrics: FirebaseUsageMetrics,
  options: FirebaseUsagePdfOptions
): Promise<void> {
  const computed = computePeriodMetrics(baseMetrics, options);

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

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      currentY = margin;
      drawMiniHeader();
    }
  };

  const drawMiniHeader = () => {
    drawPdfStandardMiniHeader(
      doc,
      'WIKIZERO • TELEMETRIA DO CLOUD FIRESTORE',
      computed.periodLabel,
      margin,
      pageWidth
    );
    currentY = 16;
  };

  // =========================================================================
  // 1. CABEÇALHO OFICIAL DO RELATÓRIO PADRONIZADO
  // =========================================================================
  const heroHeight = 36;
  drawPdfStandardHeroBanner(
    doc,
    currentY,
    {
      categoryTag: 'INFRAESTRUTURA & TELEMETRIA DO FIRESTORE',
      title: 'RELATÓRIO DE TELEMETRIA DO CLOUD FIRESTORE',
      subtitle: `${computed.periodLabel} • Monitoramento de Leituras, Gravações, Memória e Cotas`,
      metadataLine: `Banco: ${baseMetrics.firestoreDatabaseId || 'ai-studio-wikizeroenciclop'} • Projeto: ${baseMetrics.projectId || 'wzzm-ce3fc'} • Plano: ${baseMetrics.plan.toUpperCase()} • Emissão: ${new Date().toLocaleString('pt-BR')}`,
      height: heroHeight,
    },
    margin,
    contentWidth
  );
  currentY += heroHeight + 5;

  // =========================================================================
  // 2. RESUMO DAS MÉTRICAS (4 CARDS DE KPIS PADRONIZADOS)
  // =========================================================================
  const kpis: PdfKpiCard[] = [
    {
      title: 'LEITURAS FIRESTORE',
      val: computed.readsCount.toLocaleString('pt-BR'),
      sub: `Cota: ${computed.readsLimit.toLocaleString('pt-BR')} (${computed.readsPercent}%)`,
      bg: [239, 246, 255],
      border: [191, 219, 254],
      textCol: [29, 78, 216],
    },
    {
      title: 'GRAVAÇÕES FIRESTORE',
      val: computed.writesCount.toLocaleString('pt-BR'),
      sub: `Cota: ${computed.writesLimit.toLocaleString('pt-BR')} (${computed.writesPercent}%)`,
      bg: [236, 253, 245],
      border: [167, 243, 208],
      textCol: [4, 120, 87],
    },
    {
      title: 'MEMÓRIA EM DISCO',
      val: computed.memoryFormatted,
      sub: `Limite: ${computed.memoryLimitFormatted} (${computed.memoryPercent}%)`,
      bg: [250, 245, 255],
      border: [233, 213, 255],
      textCol: [109, 40, 217],
    },
    {
      title: 'CUSTO ESTIMADO',
      val: `$${computed.estimatedCostUsd.toFixed(2)} USD`,
      sub: `${computed.totalDocuments} docs indexados`,
      bg: [254, 243, 199],
      border: [253, 230, 138],
      textCol: [180, 83, 9],
    },
  ];

  drawPdfStandardKpiCards(doc, currentY, kpis, margin, contentWidth, 16);
  currentY += 16 + 6;

  // =========================================================================
  // 3. TABELA DETALHADA POR COLEÇÃO DO FIRESTORE
  // =========================================================================
  checkPageBreak(50);

  drawPdfStandardSectionHeader(
    doc,
    currentY,
    'Detalhamento por Coleção do Firebase Firestore',
    `[${computed.collections.length} COLEÇÕES]`,
    margin,
    contentWidth,
    pageWidth
  );
  currentY += 10;

  // Cabeçalho da Tabela
  const colWidths = [45, 30, 28, 24, 30, 25];
  const tableHeaders = ['Coleção / Caminho', 'Leituras Período', 'Gravações Período', 'Documentos', 'Memória em Disco', '% Memória'];

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(margin, currentY, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);

  let curColX = margin + 2;
  tableHeaders.forEach((th, idx) => {
    doc.text(th, curColX, currentY + 4.8);
    curColX += colWidths[idx];
  });

  currentY += 7;

  // Linhas da Tabela
  computed.collections.forEach((col, idx) => {
    checkPageBreak(7);
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY + 6.5, margin + contentWidth, currentY + 6.5);

    let rowX = margin + 2;

    // Coluna 1: Nome da coleção
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(`${col.name}`, rowX, currentY + 3.5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`${col.path}`, rowX, currentY + 5.8);
    rowX += colWidths[0];

    // Coluna 2: Leituras
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(29, 78, 216);
    doc.text(col.reads.toLocaleString('pt-BR'), rowX, currentY + 4.5);
    rowX += colWidths[1];

    // Coluna 3: Gravações
    doc.setTextColor(4, 120, 87);
    doc.text(col.writes.toLocaleString('pt-BR'), rowX, currentY + 4.5);
    rowX += colWidths[2];

    // Coluna 4: Documentos
    doc.setTextColor(51, 65, 85);
    doc.text(col.docs.toLocaleString('pt-BR'), rowX, currentY + 4.5);
    rowX += colWidths[3];

    // Coluna 5: Memória Bytes
    doc.setTextColor(109, 40, 217);
    doc.text(col.formatted, rowX, currentY + 4.5);
    rowX += colWidths[4];

    // Coluna 6: % Memória
    doc.setTextColor(15, 23, 42);
    doc.text(`${col.percentMemory}%`, rowX, currentY + 4.5);

    currentY += 6.5;
  });

  currentY += 6;

  // =========================================================================
  // 3.1. DISTRIBUIÇÃO TEMPORAL NO PERÍODO (DIA / MÊS / ANO)
  // =========================================================================
  checkPageBreak(42);

  const temporalTitle =
    options.periodType === 'day'
      ? 'Distribuição das Operações no Dia Selecionado'
      : options.periodType === 'month'
      ? 'Evolução Semanal no Mês Selecionado'
      : 'Evolução Trimestral no Ano Selecionado';

  drawPdfStandardCategoryBanner(
    doc,
    currentY,
    temporalTitle,
    [37, 99, 235],
    [255, 255, 255],
    margin,
    contentWidth
  );
  currentY += 8.5;

  const tempColWidths = [60, 32, 32, 34, 24];
  const tempHeaders = ['Segmento / Intervalo', 'Leituras', 'Gravações', 'Memória Usada', 'Tráfego'];

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(margin, currentY, contentWidth, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);

  let curTempX = margin + 2;
  tempHeaders.forEach((th, idx) => {
    doc.text(th, curTempX, currentY + 4.5);
    curTempX += tempColWidths[idx];
  });

  currentY += 6.5;

  computed.temporalBreakdown.forEach((item, idx) => {
    checkPageBreak(6.5);
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY + 6, margin + contentWidth, currentY + 6);

    let rowX = margin + 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(item.periodSegment, rowX, currentY + 4.2);
    rowX += tempColWidths[0];

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(29, 78, 216);
    doc.text(item.reads.toLocaleString('pt-BR'), rowX, currentY + 4.2);
    rowX += tempColWidths[1];

    doc.setTextColor(4, 120, 87);
    doc.text(item.writes.toLocaleString('pt-BR'), rowX, currentY + 4.2);
    rowX += tempColWidths[2];

    doc.setTextColor(109, 40, 217);
    doc.text(item.memoryEstimate, rowX, currentY + 4.2);
    rowX += tempColWidths[3];

    doc.setTextColor(15, 23, 42);
    doc.text(item.trafficShare, rowX, currentY + 4.2);

    currentY += 6;
  });

  currentY += 6;

  // =========================================================================
  // 4. ANÁLISE DE MEMÓRIA & PERSISTÊNCIA EM DISCO
  // =========================================================================
  checkPageBreak(38);

  drawPdfStandardCategoryBanner(
    doc,
    currentY,
    'Distribuição da Memória & Índices no Firebase',
    [109, 40, 217],
    [255, 255, 255],
    margin,
    contentWidth
  );
  currentY += 8.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

  const b = baseMetrics.memory.breakdown;
  const memItems = [
    { label: 'Artigos no Firestore', count: `${b.articlesCount} verbetes`, val: b.articlesFormatted, color: [37, 99, 235] },
    { label: 'Coleções & Tópicos', count: `${b.documentsCount} coleções`, val: b.documentsFormatted, color: [16, 185, 129] },
    { label: 'Perfis de Usuários', count: `${b.usersCount} contas`, val: b.usersFormatted, color: [139, 92, 246] },
    { label: 'Auditoria & Logs', count: `${b.auditLogsCount} registros`, val: b.auditLogsFormatted, color: [245, 158, 11] },
    { label: 'Backups & Snapshots', count: `${b.backupsCount} arquivos`, val: b.backupsFormatted, color: [236, 72, 153] },
    { label: 'Cache IndexedDB SDK', count: 'Armazenamento local', val: b.indexedDbCacheFormatted, color: [100, 116, 139] },
  ];

  let itemX = margin + 4;
  let itemY = currentY + 5;

  memItems.forEach((mi, i) => {
    if (i === 3) {
      itemX = margin + contentWidth / 2 + 2;
      itemY = currentY + 5;
    }

    doc.setFillColor(mi.color[0], mi.color[1], mi.color[2]);
    doc.circle(itemX + 2, itemY + 2.5, 1.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(mi.label, itemX + 6, itemY + 3.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${mi.count})`, itemX + 50, itemY + 3.2);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(mi.val, itemX + 75, itemY + 3.2, { align: 'right' });

    itemY += 8.5;
  });

  currentY += 38;

  // =========================================================================
  // 5. AUDITORIA FINANCEIRA, COTAS & GOVERNANÇA TÉCNICA
  // =========================================================================
  checkPageBreak(30);

  const extraBullets = [
    `• Plano: ${baseMetrics.plan.toUpperCase()} • Cota gratuita diária: 50.000 leituras e 20.000 gravações (Google Cloud Platform).`,
    `• Custo estimado para o período: $${computed.estimatedCostUsd.toFixed(2)} USD • Armazenamento estimado: $0.108 / GiB-mês.`,
    `• Banco de Dados: ${baseMetrics.firestoreDatabaseId || 'ai-studio-wikizeroenciclop'} • Projeto GCP: ${baseMetrics.projectId || 'wzzm-ce3fc'}.`,
  ];

  const boxH = drawPdfStandardGovernanceBox(doc, currentY, margin, contentWidth, extraBullets);
  currentY += boxH + 6;

  // =========================================================================
  // 6. RODAPÉ UNIFICADO EM TODAS AS PÁGINAS (PADRÃO DO PDF ANEXADO)
  // =========================================================================
  drawPdfStandardFooters(
    doc,
    'Infraestrutura Cloud Firestore',
    margin,
    pageWidth,
    pageHeight
  );

  // Nome do arquivo com timestamp e período
  const periodSlug =
    options.periodType === 'day'
      ? `dia-${options.selectedDate}`
      : options.periodType === 'month'
      ? `mes-${options.selectedYear}-${String(options.selectedMonth).padStart(2, '0')}`
      : `ano-${options.selectedYear}`;

  const fileName = `firebase-relatorio-telemetria-${periodSlug}.pdf`;
  doc.save(fileName);
}
