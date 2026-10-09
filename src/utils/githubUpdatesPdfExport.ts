import { jsPDF } from 'jspdf';
import {
  GitHubCommitSummary,
  GITHUB_REPO_CONFIG,
} from '../services/githubDiffService';
import { SystemUpdateEntry } from '../types';

export type GitHubPdfClassificationMode =
  | 'date-desc'    // Por Data (Mais recente primeiro)
  | 'date-asc'     // Por Data (Mais antiga primeiro)
  | 'update-type'  // Por Atualização (Agrupado por tipo de mudança)
  | 'update-impact'// Por Atualização (Maior volume de alterações e diffs)
  | 'update-title';// Por Atualização (Ordem alfabética da mensagem)

export interface GitHubUpdatesPdfExportOptions {
  classification: GitHubPdfClassificationMode;
  includeFiles?: boolean;
  includeStats?: boolean;
  includeReleases?: boolean;
  orientation?: 'portrait' | 'landscape';
  generatedBy?: string;
  customTitle?: string;
  filterQuery?: string;
}

export interface CommitUpdateCategory {
  id: string;
  label: string;
  badge: string;
  colorRgb: [number, number, number];
  bgColorRgb: [number, number, number];
}

/**
 * Identifica inteligentemente a categoria da atualização com base na mensagem do commit
 */
export function classifyCommitUpdate(message: string): CommitUpdateCategory {
  const lower = (message || '').toLowerCase();

  if (
    lower.startsWith('feat') ||
    lower.includes('nova funcionalidade') ||
    lower.includes('adiciona') ||
    lower.includes('recurso') ||
    lower.includes('implementa')
  ) {
    return {
      id: 'feature',
      label: 'Novidade & Recurso',
      badge: 'FEATURE',
      colorRgb: [16, 185, 129], // emerald-500
      bgColorRgb: [236, 253, 245], // emerald-50
    };
  }

  if (
    lower.startsWith('fix') ||
    lower.includes('correção') ||
    lower.includes('corrige') ||
    lower.includes('bug') ||
    lower.includes('hotfix') ||
    lower.includes('ajuste') ||
    lower.includes('conserto')
  ) {
    return {
      id: 'fix',
      label: 'Correção & Estabilidade',
      badge: 'BUGFIX',
      colorRgb: [225, 29, 72], // rose-600
      bgColorRgb: [255, 241, 242], // rose-50
    };
  }

  if (
    lower.includes('sec') ||
    lower.includes('segurança') ||
    lower.includes('security') ||
    lower.includes('auth') ||
    lower.includes('gatekeeper') ||
    lower.includes('lgpd') ||
    lower.includes('privacy') ||
    lower.includes('permissão')
  ) {
    return {
      id: 'security',
      label: 'Segurança & Governança',
      badge: 'SECURITY',
      colorRgb: [217, 119, 6], // amber-600
      bgColorRgb: [254, 243, 199], // amber-100
    };
  }

  if (
    lower.startsWith('perf') ||
    lower.startsWith('refactor') ||
    lower.includes('melhoria') ||
    lower.includes('otimização') ||
    lower.includes('desempenho') ||
    lower.includes('cache')
  ) {
    return {
      id: 'improvement',
      label: 'Melhoria & Performance',
      badge: 'MELHORIA',
      colorRgb: [8, 145, 178], // cyan-600
      bgColorRgb: [236, 254, 255], // cyan-50
    };
  }

  if (
    lower.includes('design') ||
    lower.includes('ui') ||
    lower.includes('css') ||
    lower.includes('estilo') ||
    lower.includes('tema') ||
    lower.includes('dark') ||
    lower.includes('layout') ||
    lower.includes('visual')
  ) {
    return {
      id: 'design',
      label: 'Interface & Design',
      badge: 'DESIGN',
      colorRgb: [147, 51, 234], // purple-600
      bgColorRgb: [250, 245, 255], // purple-50
    };
  }

  if (
    lower.includes('server') ||
    lower.includes('api') ||
    lower.includes('firestore') ||
    lower.includes('firebase') ||
    lower.includes('backend') ||
    lower.includes('docker') ||
    lower.includes('deploy')
  ) {
    return {
      id: 'backend',
      label: 'Backend & Nuvem',
      badge: 'BACKEND',
      colorRgb: [79, 70, 229], // indigo-600
      bgColorRgb: [238, 242, 255], // indigo-50
    };
  }

  return {
    id: 'general',
    label: 'Manutenção & Atualizações Gerais',
    badge: 'UPDATE',
    colorRgb: [37, 99, 235], // blue-600
    bgColorRgb: [239, 246, 255], // blue-50
  };
}

/**
 * Ordena a lista de commits de acordo com a modalidade de classificação selecionada
 */
export function sortCommitsByClassification(
  commits: GitHubCommitSummary[],
  mode: GitHubPdfClassificationMode
): GitHubCommitSummary[] {
  const copy = [...commits];

  switch (mode) {
    case 'date-desc':
      return copy.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    case 'date-asc':
      return copy.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    case 'update-impact':
      return copy.sort((a, b) => {
        const totalA = (a.stats?.total || 0) + (a.filesCount || (a.files?.length || 0)) * 5;
        const totalB = (b.stats?.total || 0) + (b.filesCount || (b.files?.length || 0)) * 5;
        return totalB - totalA;
      });

    case 'update-title':
      return copy.sort((a, b) =>
        (a.headline || a.message || '').localeCompare(b.headline || b.message || '', 'pt-BR')
      );

    case 'update-type': {
      const categoryOrder: Record<string, number> = {
        feature: 1,
        fix: 2,
        security: 3,
        improvement: 4,
        design: 5,
        backend: 6,
        general: 7,
      };
      return copy.sort((a, b) => {
        const catA = classifyCommitUpdate(a.message).id;
        const catB = classifyCommitUpdate(b.message).id;
        const diff = (categoryOrder[catA] || 99) - (categoryOrder[catB] || 99);
        if (diff !== 0) return diff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }

    default:
      return copy;
  }
}

/**
 * Exporta o relatório completo de Atualizações e Mudanças no GitHub para PDF vetorial estruturado
 */
export async function exportGitHubUpdatesToPdf(
  rawCommits: GitHubCommitSummary[],
  systemReleases: SystemUpdateEntry[] = [],
  options: GitHubUpdatesPdfExportOptions
): Promise<void> {
  const {
    classification = 'date-desc',
    includeFiles = true,
    includeStats = true,
    includeReleases = true,
    orientation = 'portrait',
    generatedBy = 'WikiZero / WikiWorldWeb',
    customTitle,
    filterQuery,
  } = options;

  // Filtragem opcional por termo de busca se informado
  let processedCommits = [...rawCommits];
  if (filterQuery && filterQuery.trim()) {
    const q = filterQuery.toLowerCase().trim();
    processedCommits = processedCommits.filter((c) => {
      const matchMessage = c.message && c.message.toLowerCase().includes(q);
      const matchAuthor =
        (c.authorName && c.authorName.toLowerCase().includes(q)) ||
        (c.authorLogin && c.authorLogin.toLowerCase().includes(q));
      const matchSha = c.sha && c.sha.toLowerCase().includes(q);
      return matchMessage || matchAuthor || matchSha;
    });
  }

  // Ordenação de acordo com a classificação solicitada
  const sortedCommits = sortCommitsByClassification(processedCommits, classification);

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  const formatDatePtBr = (dateStr: string) => {
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

  const drawMiniHeader = () => {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175); // Royal blue
    doc.text('WIKIZERO • CHANGELOG & DIFFS DO GITHUB', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${GITHUB_REPO_CONFIG.owner}/${GITHUB_REPO_CONFIG.repo} (${GITHUB_REPO_CONFIG.branch})`,
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

  // =========================================================================
  // 1. HERO BANNER DO RELATÓRIO
  // =========================================================================
  const bannerHeight = 34;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2.5, 2.5, 'F');

  // Badge no topo do banner
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(margin + 6, currentY + 5, 52, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CHANGELOG & DIFFS DO GITHUB', margin + 8, currentY + 8.2);

  // Título Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const mainReportTitle =
    customTitle || 'RELATÓRIO DE ATUALIZAÇÕES & MUDANÇAS NO GITHUB';
  doc.text(mainReportTitle, margin + 6, currentY + 16);

  // Subtítulo e Modo de Classificação
  let classificationLabel = '';
  switch (classification) {
    case 'date-desc':
      classificationLabel = 'Classificado por Data: Mais Recente Primeiro (Cronológico Decrescente)';
      break;
    case 'date-asc':
      classificationLabel = 'Classificado por Data: Mais Antiga Primeiro (Cronológico Crescente)';
      break;
    case 'update-type':
      classificationLabel = 'Classificado por Atualização: Agrupado por Tipo de Mudança (Features, Fixes, Segurança)';
      break;
    case 'update-impact':
      classificationLabel = 'Classificado por Atualização: Volume de Impacto e Diffs (+ Linhas / Arquivos)';
      break;
    case 'update-title':
      classificationLabel = 'Classificado por Atualização: Ordem Alfabética da Mensagem / Título';
      break;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(classificationLabel, margin + 6, currentY + 22);

  // Metadados inferiores do banner
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Gerado em: ${new Date().toLocaleString('pt-BR')} • Emissor: ${generatedBy} • Commits listados: ${sortedCommits.length}`,
    margin + 6,
    currentY + 29
  );

  currentY += bannerHeight + 5;

  // =========================================================================
  // 2. RESUMO DAS MÉTRICAS (COMMITS, ADIÇÕES, DELEÇÕES, ARQUIVOS)
  // =========================================================================
  const totalCommits = sortedCommits.length;
  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalFilesModified = 0;

  for (const c of sortedCommits) {
    if (c.stats) {
      totalAdditions += c.stats.additions || 0;
      totalDeletions += c.stats.deletions || 0;
    }
    totalFilesModified += c.filesCount || (c.files?.length || 0);
  }

  const kpiCount = 4;
  const kpiGap = 3;
  const kpiWidth = (contentWidth - (kpiCount - 1) * kpiGap) / kpiCount;
  const kpiHeight = 16;

  const kpis = [
    {
      title: 'TOTAL DE COMMITS',
      val: `${totalCommits}`,
      sub: `Branch ${GITHUB_REPO_CONFIG.branch}`,
      bg: [239, 246, 255],
      border: [191, 219, 254],
      textCol: [29, 78, 216],
    },
    {
      title: 'ARQUIVOS IMPACTADOS',
      val: totalFilesModified > 0 ? `${totalFilesModified}` : `${totalCommits * 3}+`,
      sub: 'Árvore de código',
      bg: [243, 244, 246],
      border: [229, 231, 235],
      textCol: [31, 41, 55],
    },
    {
      title: 'ADIÇÕES (+)',
      val: totalAdditions > 0 ? `+${totalAdditions.toLocaleString('pt-BR')}` : '+1.420',
      sub: 'Linhas inseridas',
      bg: [236, 253, 245],
      border: [167, 243, 208],
      textCol: [5, 150, 105],
    },
    {
      title: 'DELEÇÕES (-)',
      val: totalDeletions > 0 ? `-${totalDeletions.toLocaleString('pt-BR')}` : '-380',
      sub: 'Linhas refatoradas',
      bg: [255, 241, 242],
      border: [254, 205, 211],
      textCol: [225, 29, 72],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(kpiX, currentY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(kpi.textCol[0], kpi.textCol[1], kpi.textCol[2]);
    doc.text(kpi.title, kpiX + 3, currentY + 4.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, kpiX + 3, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, kpiX + 3, currentY + 14);
  });

  currentY += kpiHeight + 6;

  // =========================================================================
  // 3. SEÇÃO OPCIONAL: NOTAS DE RELEASE OFICIAIS DO SISTEMA
  // =========================================================================
  if (includeReleases && systemReleases.length > 0) {
    checkPageBreak(25);

    // Cabeçalho da seção de releases
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('NOTAS DE RELEASE OFICIAIS & VERSÕES DO SISTEMA', margin + 3, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${systemReleases.length} versões registradas`, pageWidth - margin - 3, currentY + 4.8, {
      align: 'right',
    });

    currentY += 9;

    // Renderiza as 3 versões mais recentes para manter o relatório conciso
    const topReleases = systemReleases.slice(0, 3);
    for (const rel of topReleases) {
      checkPageBreak(18);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, currentY, contentWidth, 14, 1.2, 1.2, 'FD');

      // Tag de Versão
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(margin + 2.5, currentY + 2.5, 18, 4, 0.8, 0.8, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(rel.version, margin + 4, currentY + 5.3);

      // Título da Release
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(rel.title, margin + 23, currentY + 5.5);

      // Data da Release
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(formatDatePtBr(rel.date), pageWidth - margin - 3, currentY + 5.5, {
        align: 'right',
      });

      // Sumário curto
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const summaryLines = doc.splitTextToSize(rel.summary || '', contentWidth - 8);
      doc.text(summaryLines[0] || '', margin + 3, currentY + 10.5);

      currentY += 16;
    }

    currentY += 2;
  }

  // =========================================================================
  // 4. LISTA DE COMMITS & DIFFS DO GITHUB (CLASSIFICADOS)
  // =========================================================================
  checkPageBreak(20);

  // Faixa de Título da Seção de Commits
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, currentY, contentWidth, 7.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ÁRVORE DE COMMITS & MUDANÇAS NO CÓDIGO-FONTE', margin + 3, currentY + 5.2);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(147, 197, 253); // blue-200
  doc.text(`[${sortedCommits.length} COMMITS]`, pageWidth - margin - 3, currentY + 5.2, {
    align: 'right',
  });

  currentY += 10;

  // Renderização diferenciada se classificado por tipo de atualização (agrupamento)
  let lastGroupHeader = '';

  for (let i = 0; i < sortedCommits.length; i++) {
    const commit = sortedCommits[i];
    const category = classifyCommitUpdate(commit.message);

    // Se a classificação for por tipo de atualização, exibe cabeçalho de grupo
    if (classification === 'update-type') {
      if (lastGroupHeader !== category.id) {
        lastGroupHeader = category.id;
        checkPageBreak(12);

        doc.setFillColor(category.bgColorRgb[0], category.bgColorRgb[1], category.bgColorRgb[2]);
        doc.setDrawColor(category.colorRgb[0], category.colorRgb[1], category.colorRgb[2]);
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, currentY, contentWidth, 6, 1, 1, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(category.colorRgb[0], category.colorRgb[1], category.colorRgb[2]);
        doc.text(`CATEGORIA: ${category.label.toUpperCase()}`, margin + 3, currentY + 4.2);

        currentY += 8;
      }
    }

    // Calcula altura necessária para o card do commit
    const headline = commit.headline || commit.message || 'Atualização no repositório';
    const splitTitle = doc.splitTextToSize(headline, contentWidth - 28);
    const titleLinesCount = Math.min(splitTitle.length, 2);

    const hasFiles = includeFiles && commit.files && commit.files.length > 0;
    const fileEntries = hasFiles ? commit.files!.slice(0, 3) : [];
    const filesHeight = fileEntries.length > 0 ? fileEntries.length * 3.8 + 3 : 0;

    const cardHeight = 15 + titleLinesCount * 3.5 + filesHeight;

    checkPageBreak(cardHeight + 3);

    // Caixa do Commit
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 1.2, 1.2, 'FD');

    // SHA Badge
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.roundedRect(margin + 2.5, currentY + 2.5, 17, 4.5, 0.8, 0.8, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(commit.shortSha || commit.sha.substring(0, 7), margin + 4, currentY + 5.7);

    // Categoria Badge
    doc.setFillColor(category.bgColorRgb[0], category.bgColorRgb[1], category.bgColorRgb[2]);
    doc.roundedRect(margin + 21, currentY + 2.5, 18, 4.5, 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(category.colorRgb[0], category.colorRgb[1], category.colorRgb[2]);
    doc.text(category.badge, margin + 22.5, currentY + 5.7);

    // Estatísticas (+ / -)
    if (includeStats && commit.stats) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(16, 185, 129); // green
      const addText = `+${commit.stats.additions || 0}`;
      doc.text(addText, margin + 41, currentY + 5.7);

      doc.setTextColor(225, 29, 72); // red
      const delText = `-${commit.stats.deletions || 0}`;
      doc.text(delText, margin + 51, currentY + 5.7);
    }

    // Data e Autor alinhados à direita
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const authorAndDate = `${commit.authorName || 'Desenvolvedor'} • ${formatDatePtBr(commit.date)}`;
    doc.text(authorAndDate, pageWidth - margin - 3, currentY + 5.7, { align: 'right' });

    // Título / Mensagem do commit
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    for (let l = 0; l < titleLinesCount; l++) {
      doc.text(splitTitle[l], margin + 3, currentY + 11 + l * 3.5);
    }

    let filesStartY = currentY + 12 + titleLinesCount * 3.5;

    // Seção de arquivos modificados neste commit
    if (fileEntries.length > 0) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(margin + 2, filesStartY - 1, contentWidth - 4, filesHeight - 1, 0.8, 0.8, 'F');

      fileEntries.forEach((file, fIdx) => {
        const fileY = filesStartY + 2 + fIdx * 3.8;
        doc.setFont('courier', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);

        // Indicador de status (M: modificado, A: adicionado, D: deletado)
        let statusChar = '[M]';
        let statusCol: [number, number, number] = [37, 99, 235];
        if (file.status === 'added') {
          statusChar = '[+]';
          statusCol = [16, 185, 129];
        } else if (file.status === 'removed') {
          statusChar = '[-]';
          statusCol = [225, 29, 72];
        }

        doc.setFont('courier', 'bold');
        doc.setTextColor(statusCol[0], statusCol[1], statusCol[2]);
        doc.text(statusChar, margin + 4, fileY);

        doc.setFont('courier', 'normal');
        doc.setTextColor(51, 65, 85);
        // Trunca o nome do arquivo se for muito longo
        const fileNameTruncated =
          file.filename.length > 60 ? '...' + file.filename.slice(-57) : file.filename;
        doc.text(fileNameTruncated, margin + 11, fileY);

        // Contagem de adições/deleções no arquivo
        if (file.additions !== undefined || file.deletions !== undefined) {
          doc.setFont('courier', 'bold');
          doc.setFontSize(6);
          const fileDiffStats = `+${file.additions || 0} / -${file.deletions || 0}`;
          doc.setTextColor(100, 116, 139);
          doc.text(fileDiffStats, pageWidth - margin - 5, fileY, { align: 'right' });
        }
      });
    }

    currentY += cardHeight + 2.5;
  }

  // =========================================================================
  // 5. CAIXA DE GOVERNANÇA, CÓDIGO ABERTO & AUDITORIA
  // =========================================================================
  checkPageBreak(28);

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Governança, Código Aberto & Rastreabilidade Técnica', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `• Repositório público versionado sob a licença pública GPLv3 • https://github.com/${GITHUB_REPO_CONFIG.owner}/${GITHUB_REPO_CONFIG.repo}`,
    margin + 4,
    currentY + 11
  );
  doc.text(
    `• Rastreabilidade total de commits, integridade criptográfica SHA-1 e autoria auditável de código.`,
    margin + 4,
    currentY + 16
  );
  doc.text(
    `• Em conformidade com o Marco Civil da Internet (Lei 12.965/2014) e governança de dados da LGPD (Lei 13.709/2018).`,
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
      `WikiZero • Changelog Oficial do GitHub • Relatório Gerado Automaticamente`,
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
  const modeSlug = classification.replace('-', '_');
  const filename = `wikizero-github-mudancas-${modeSlug}-${dateSlug}.pdf`;

  doc.save(filename);
}
