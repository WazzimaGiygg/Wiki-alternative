import type { jsPDF } from 'jspdf';
import { WikiArticle } from '../types';
import { parseWikitext, processParserFunctionsAndVariables } from './wikitextParser';
import { templateService } from '../services/templateService';
import {
  drawPdfStandardHeroBanner,
  drawPdfStandardKpiCards,
  drawPdfStandardSectionHeader,
  drawPdfStandardCategoryBanner,
  drawPdfStandardMiniHeader,
  drawPdfStandardFooters,
  drawPdfStandardGovernanceBox,
  sanitizePdfText,
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

interface PdfInfoboxData {
  title: string;
  subtitle?: string;
  rows: { label: string; value: string; isSection?: boolean }[];
}

interface PdfTableData {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export type PdfSectionElement =
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; marker: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'callout'; label: string; text: string; accentRgb: [number, number, number] }
  | { type: 'code'; lang?: string; text: string }
  | { type: 'infobox'; data: PdfInfoboxData }
  | { type: 'table'; data: PdfTableData };

export interface ParsedSection {
  numberStr: string;
  title: string;
  level: number;
  badge: string;
  colorRgb: [number, number, number];
  bgColorRgb: [number, number, number];
  categoryGroup: 'intro' | 'development' | 'analysis' | 'references';
  elements: PdfSectionElement[];
  wordCount: number;
}

/**
 * Formata uma predefinição {{Citar web|...}} / {{Citar livro|...}} / {{Citar jornal|...}} para texto legível no PDF
 */
function formatCitationTemplateForPdf(rawBody: string): string {
  const parts = rawBody.split('|');
  const params: Record<string, string> = {};
  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx > 0) {
      const k = parts[i].slice(0, eqIdx).trim().toLowerCase();
      const v = parts[i].slice(eqIdx + 1).trim();
      if (v) params[k] = v;
    }
  }

  const autor = params.autor || params.author || '';
  const titulo = params.titulo || params.title || 'Referência';
  const venue = params.jornal || params.journal || params.site || params.website || params.obra || params.editora || params.publisher || '';
  const data = params.data || params.date || params.ano || params.year || '';
  const paginas = params.paginas || params.pages || '';
  const isbn = params.isbn || '';
  const url = params.url || '';
  const acesso = params.acessodata || params.access_date || '';

  const segs: string[] = [];
  if (autor) segs.push(`${autor}.`);
  segs.push(`"${titulo}".`);
  if (venue) segs.push(`${venue}.`);
  if (paginas) segs.push(`p. ${paginas}.`);
  if (data) segs.push(`${data}.`);
  if (isbn) segs.push(`ISBN ${isbn}.`);
  if (url) segs.push(url);
  if (acesso) segs.push(`Acesso em ${acesso}.`);
  return sanitizePdfText(segs.join(' '));
}

/**
 * Limpa marcações wikitext/markdown para produzir texto corrido limpo e seguro para o jsPDF
 */
export function cleanWikitextForPdf(raw: string): string {
  if (!raw) return '';

  // Protege <nowiki>...</nowiki> temporariamente para preservar sintaxe literal demonstrativa
  const nowikiLiterals: string[] = [];
  let text = raw.replace(/<nowiki>([\s\S]*?)<\/nowiki>/gi, (_m, inner) => {
    const tok = `__PDF_NOWIKI_${nowikiLiterals.length}__`;
    nowikiLiterals.push(String(inner || '').trim());
    return tok;
  });

  // Formata {{Citar web|...}} / {{Citar livro|...}} / {{Citar jornal|...}} se presentes (ex: em referências)
  text = text.replace(
    /\{\{\s*(?:citar\s+(?:web|livro|jornal)|cite\s+(?:web|book|journal))\|([^}]+)\}\}/gi,
    (_m, body) => formatCitationTemplateForPdf(`Citar|${body}`)
  );

  text = text
    .replace(/__(?:TOC|NOTOC|SUM[AÁ]RIO|SEM_SUM[AÁ]RIO)__/gi, '')
    .replace(/\[\[(?:Categoria|Category):.*?\]\]/gi, '')
    .replace(/\[\[(?:Arquivo|Ficheiro|File|Imagem|Image):([^|\]]+)(?:\|[^\]]*)?\]\]/gi, '[Imagem: $1]')
    .replace(/!\[(.*?)\]\((.*?)\)/g, (_m, alt) => (alt ? `[Figura: ${alt.trim()}]` : '[Figura]'))
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2 ($1)')
    .replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1')
    .replace(/'''''([\s\S]*?)'''''/g, '$1')
    .replace(/'''([\s\S]*?)'''/g, '$1')
    .replace(/''([\s\S]*?)''/g, '$1')
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)([^*\n]+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/~~([\s\S]*?)~~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<math(?:\s+[^>]*)?>([\s\S]*?)<\/math>/gi, (_m, formula) => String(formula || '').trim())
    .replace(/\{\{\s*(?:carece de fontes|cn|citation needed|citacao necessaria|citação necessária)\s*\}\}/gi, ' [carece de fontes]')
    .replace(/\{\|[\s\S]*?\|\}/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/<[^>]+>/g, '');

  if (nowikiLiterals.length > 0) {
    nowikiLiterals.forEach((lit, idx) => {
      text = text.split(`__PDF_NOWIKI_${idx}__`).join(lit);
    });
  }

  return sanitizePdfText(text);
}

function splitTopLevelPipes(body: string): string[] {
  const parts: string[] = [];
  let current = '';
  let linkDepth = 0;
  let braceDepth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    const next = body[i + 1];
    if (ch === '[' && next === '[') {
      linkDepth++;
      current += '[[';
      i++;
      continue;
    }
    if (ch === ']' && next === ']' && linkDepth > 0) {
      linkDepth--;
      current += ']]';
      i++;
      continue;
    }
    if (ch === '{' && next === '{') {
      braceDepth++;
      current += '{{';
      i++;
      continue;
    }
    if (ch === '}' && next === '}' && braceDepth > 0) {
      braceDepth--;
      current += '}}';
      i++;
      continue;
    }
    if (ch === '|' && linkDepth === 0 && braceDepth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

function parseInfoboxBlockForPdf(rawTemplate: string): PdfInfoboxData {
  const inner = rawTemplate.trim().replace(/^\{\{/, '').replace(/\}\}$/, '').trim();
  const lines = inner.split('\n');
  let title = 'Ficha Técnica';
  let subtitle = '';
  const rows: { label: string; value: string; isSection?: boolean }[] = [];

  for (const rawLine of lines.slice(1)) {
    const trimmed = rawLine.trim().replace(/^\|\s*/, '');
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const rawKey = trimmed.slice(0, eqIdx).trim();
    const key = rawKey
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
    const rawVal = trimmed.slice(eqIdx + 1).trim();
    if (!rawVal) continue;

    if (key === 'nome' || key === 'titulo' || key === 'title' || key === 'name') {
      title = cleanWikitextForPdf(rawVal);
    } else if (key === 'subtitulo' || key === 'subtitle') {
      subtitle = cleanWikitextForPdf(rawVal);
    } else if (
      ['cor', 'tema', 'alinhamento', 'align', 'largura', 'width', 'estilo', 'borda', 'variante', 'icone', 'icon', 'imagem', 'image', 'imagem_largura', 'imagem_forma', 'compacto'].includes(key)
    ) {
      continue;
    } else if (key.startsWith('secao') || key.startsWith('header') || key.startsWith('subsecao')) {
      rows.push({ label: cleanWikitextForPdf(rawVal), value: '', isSection: true });
    } else {
      const valClean = cleanWikitextForPdf(rawVal);
      if (valClean) {
        rows.push({
          label: sanitizePdfText(rawKey.replace(/_/g, ' ')),
          value: valClean,
        });
      }
    }
  }

  return { title, subtitle: subtitle || undefined, rows };
}

function parseWikitableForPdf(rawTable: string): PdfTableData {
  const inner = rawTable
    .trim()
    .replace(/^\{\s*\|[^\n]*\n?/, '')
    .replace(/\|\}$/, '');

  const cellTokens: string[] = [];
  const maskCellToken = (m: string) => {
    const tok = `__PDF_TBL_TOK_${cellTokens.length}__`;
    cellTokens.push(m);
    return tok;
  };
  const restoreCellTokens = (s: string): string => {
    let out = s;
    for (let idx = 0; idx < cellTokens.length; idx++) {
      out = out.split(`__PDF_TBL_TOK_${idx}__`).join(cellTokens[idx]);
    }
    return out;
  };

  // Protege <nowiki>, links [[...]] e predefinições {{...}} antes de dividir por || ou |
  const maskedInner = inner
    .replace(/<nowiki>[\s\S]*?<\/nowiki>/gi, maskCellToken)
    .replace(/\[\[[\s\S]*?\]\]/g, maskCellToken)
    .replace(/\{\{[\s\S]*?\}\}/g, maskCellToken);

  const lines = maskedInner.split('\n');
  let caption = '';
  let headers: string[] = [];
  const rows: string[][] = [];
  let currentRow: string[] = [];

  const extractCellContent = (rawCell: string): string => {
    const trimmedCell = rawCell.trim();
    const pipeIdx = trimmedCell.indexOf('|');
    let val = trimmedCell;
    if (pipeIdx !== -1) {
      const beforePipe = trimmedCell.slice(0, pipeIdx).trim();
      if (/^(?:class|style|align|valign|width|height|colspan|rowspan|scope|bgcolor|data-[a-z0-9-]+)\s*=/i.test(beforePipe)) {
        val = trimmedCell.slice(pipeIdx + 1);
      }
    }
    return cleanWikitextForPdf(restoreCellTokens(val));
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('|+')) {
      caption = cleanWikitextForPdf(restoreCellTokens(trimmed.slice(2)));
      continue;
    }

    if (trimmed.startsWith('|-')) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      continue;
    }

    if (trimmed.startsWith('!')) {
      const cols = trimmed.slice(1).split('!!').map(extractCellContent);
      headers = [...headers, ...cols];
      continue;
    }

    if (trimmed.startsWith('|')) {
      const cells = trimmed.slice(1).split('||').map(extractCellContent);
      currentRow.push(...cells);
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return {
    caption: caption || undefined,
    headers,
    rows,
  };
}

function convertTemplateToPdfElements(rawTemplate: string): PdfSectionElement[] {
  const trimmed = rawTemplate.trim();
  const inner = trimmed.replace(/^\{\{/, '').replace(/\}\}$/, '').trim();
  const firstPipe = inner.indexOf('|');
  const rawName = (firstPipe === -1 ? inner : inner.slice(0, firstPipe)).trim();
  const body = firstPipe === -1 ? '' : inner.slice(firstPipe + 1).trim();
  const lower = rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(?:predefinicao|template|mw)\s*:\s*/i, '')
    .trim();

  if (
    lower === 'infobox' ||
    lower.startsWith('infobox ') ||
    lower.startsWith('infobox/') ||
    lower.startsWith('info/') ||
    lower.startsWith('ficha')
  ) {
    return [{ type: 'infobox', data: parseInfoboxBlockForPdf(trimmed) }];
  }

  if (lower === 'reflist' || lower === 'referencias' || lower === 'references') {
    return [];
  }

  if (lower === 'hatnote') {
    const txt = cleanWikitextForPdf(body);
    return txt ? [{ type: 'quote', text: txt }] : [];
  }

  if (lower === 'artigo principal' || lower === 'ver artigo principal' || lower === 'main') {
    const txt = cleanWikitextForPdf(body);
    return txt ? [{ type: 'callout', label: 'Artigo Principal', text: txt, accentRgb: [37, 99, 235] }] : [];
  }

  if (lower === 'ver tambem' || lower === 'see also') {
    const items = splitTopLevelPipes(body).map((s) => cleanWikitextForPdf(s)).filter(Boolean);
    return items.length ? [{ type: 'callout', label: 'Ver Também', text: items.join(' | '), accentRgb: [79, 70, 229] }] : [];
  }

  if (lower === 'portal' || lower === 'portais') {
    const items = splitTopLevelPipes(body).map((s) => cleanWikitextForPdf(s)).filter(Boolean);
    return items.length ? [{ type: 'callout', label: 'Portais Relacionados', text: items.map((p) => `Portal de ${p}`).join(' | '), accentRgb: [14, 116, 144] }] : [];
  }

  if (lower === 'destaque' || lower === 'highlight') {
    const txt = cleanWikitextForPdf(body);
    return txt ? [{ type: 'callout', label: 'Destaque Enciclopédico', text: txt, accentRgb: [16, 185, 129] }] : [];
  }

  if (lower === 'nota' || lower === 'info') {
    const txt = cleanWikitextForPdf(body);
    return txt ? [{ type: 'callout', label: 'Nota Informativa', text: txt, accentRgb: [37, 99, 235] }] : [];
  }

  if (lower === 'aviso' || lower === 'alerta' || lower === 'warning') {
    const txt = cleanWikitextForPdf(body);
    return txt ? [{ type: 'callout', label: 'Aviso Editorial', text: txt, accentRgb: [217, 119, 6] }] : [];
  }

  if (lower === 'esboco' || lower === 'stub') {
    const txt = cleanWikitextForPdf(body);
    return [{ type: 'callout', label: 'Artigo em Esboço', text: txt ? `Esboço sobre ${txt}.` : 'Este artigo é um esboço.', accentRgb: [8, 145, 178] }];
  }

  if (lower === 'citacao' || lower === 'quote' || lower === 'cita') {
    const parts = splitTopLevelPipes(body).map((p) => cleanWikitextForPdf(p));
    const quote = parts[0] || '';
    const cite = [parts[1], parts[2]].filter(Boolean).join(', ');
    if (!quote) return [];
    return [{ type: 'quote', text: cite ? `"${quote}" - ${cite}` : `"${quote}"` }];
  }

  if (lower === 'userbox') {
    const parts = splitTopLevelPipes(body);
    const txt = cleanWikitextForPdf(parts[1] || parts[0] || '');
    return txt ? [{ type: 'bullet', marker: '*', text: txt }] : [];
  }

  if (lower === 'ambox') {
    const parts = splitTopLevelPipes(body);
    const named: Record<string, string> = {};
    const pos: string[] = [];
    parts.forEach((p) => {
      const eq = p.indexOf('=');
      if (eq > 0) {
        named[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
      } else if (p.trim()) {
        pos.push(p.trim());
      }
    });
    const title = cleanWikitextForPdf(named['título'] || named.titulo || named.title || pos[0] || 'Aviso');
    const msg = cleanWikitextForPdf(named.texto || named.text || named.mensagem || pos[1] || '');
    const dataStr = cleanWikitextForPdf(named.data || '');
    const fullTitle = dataStr ? `${title} (${dataStr})` : title;
    return [{ type: 'callout', label: fullTitle, text: msg || fullTitle, accentRgb: [37, 99, 235] }];
  }

  if (lower === 'colunas' || lower === 'columns' || lower === 'div col') {
    const parts = splitTopLevelPipes(body);
    const rawContent = parts.length >= 2 && /^[23]$/.test(parts[0].trim()) ? parts.slice(1).join('\n') : parts.join('\n');
    const lines = rawContent
      .split('\n')
      .map((l) => cleanWikitextForPdf(l.replace(/^[•*\-]\s*/, '')))
      .filter(Boolean);
    return lines.map((line) => ({ type: 'bullet', marker: '•', text: line }));
  }

  if (lower === 'oculto' || lower === 'collapsible' || lower === 'expandir') {
    const parts = splitTopLevelPipes(body);
    const named: Record<string, string> = {};
    const pos: string[] = [];
    parts.forEach((p) => {
      const eq = p.indexOf('=');
      if (eq > 0) {
        const k = p.slice(0, eq).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        named[k] = p.slice(eq + 1).trim();
      } else if (p.trim()) {
        pos.push(p.trim());
      }
    });
    const title = cleanWikitextForPdf(named.titulo || named.title || pos[0] || 'Detalhes');
    const content = cleanWikitextForPdf(named.conteudo || named.content || named.texto || pos.slice(1).join(' ') || body);
    return [{ type: 'callout', label: title, text: content, accentRgb: [71, 85, 105] }];
  }

  if (lower === 'navbox' || lower === 'caixa de navegacao') {
    const parts = splitTopLevelPipes(body);
    const named: Record<string, string> = {};
    parts.forEach((p) => {
      const eq = p.indexOf('=');
      if (eq > 0) {
        const k = p.slice(0, eq).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        named[k] = p.slice(eq + 1).trim();
      }
    });
    const out: PdfSectionElement[] = [];
    const title = cleanWikitextForPdf(named.titulo || named.title || 'Navegação');
    const above = cleanWikitextForPdf(named.acima || '');
    if (above) {
      out.push({ type: 'callout', label: `Navbox: ${title}`, text: above, accentRgb: [30, 64, 175] });
    }
    for (let n = 1; n <= 12; n++) {
      const g = cleanWikitextForPdf(named[`grupo${n}`] || '');
      const l = cleanWikitextForPdf(named[`lista${n}`] || '');
      if (g || l) {
        out.push({ type: 'bullet', marker: '•', text: g ? `${g}: ${l}` : l });
      }
    }
    const below = cleanWikitextForPdf(named.abaixo || '');
    if (below) {
      out.push({ type: 'paragraph', text: below });
    }
    return out;
  }

  const fallback = cleanWikitextForPdf(body || rawName);
  return fallback ? [{ type: 'paragraph', text: fallback }] : [];
}

/**
 * Pré-processa wikitexto expandindo pré-definições, variáveis mágicas e funções de parser
 * mantendo blocos literais (<nowiki>, <pre>, ```) intactos.
 */
export function preprocessArticleWikitextForPdf(raw: string, articleTitle: string): string {
  if (!raw) return '';

  const literals: string[] = [];
  const mask = (s: string) => {
    const tok = `__PDF_LIT_${literals.length}__`;
    literals.push(s);
    return tok;
  };

  let text = raw
    .replace(/<nowiki>[\s\S]*?<\/nowiki>/gi, mask)
    .replace(/```[a-zA-Z0-9_-]*\n[\s\S]*?```/g, mask)
    .replace(/<pre(?:\s+[^>]*)?>[\s\S]*?<\/pre>/gi, mask)
    .replace(/<syntaxhighlight(?:\s+[^>]*)?>[\s\S]*?<\/syntaxhighlight>/gi, mask)
    .replace(/`[^`\n]+`/g, mask);

  text = templateService.processWikitext(text);
  text = processParserFunctionsAndVariables(text, articleTitle);

  if (literals.length > 0) {
    literals.forEach((val, idx) => {
      text = text.split(`__PDF_LIT_${idx}__`).join(val);
    });
  }

  return text;
}

/**
 * Divide o conteúdo pré-processado em seções estruturadas com blocos tipados para renderização limpa no PDF
 */
export function parseArticleIntoStructuredSections(expandedWikitext: string, articleTitle: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  const createEmptySection = (
    numberStr: string,
    title: string,
    level: number,
    badge: string,
    colorRgb: [number, number, number],
    bgColorRgb: [number, number, number],
    categoryGroup: ParsedSection['categoryGroup']
  ): ParsedSection => ({
    numberStr,
    title: sanitizePdfText(title),
    level,
    badge,
    colorRgb,
    bgColorRgb,
    categoryGroup,
    elements: [],
    wordCount: 0,
  });

  let currentSection = createEmptySection(
    '§ 1.0',
    `Introdução & Visão Geral: ${articleTitle}`,
    1,
    'CONCEITO',
    [16, 185, 129],
    [236, 253, 245],
    'intro'
  );

  let sectionCounter = 1;
  let subCounter = 0;

  const lines = expandedWikitext.replace(/\r\n/g, '\n').split('\n');
  let i = 0;

  const pushSection = () => {
    if (currentSection.elements.length > 0 || currentSection.level > 1) {
      const textSum = currentSection.elements
        .map((el) => {
          if (el.type === 'paragraph' || el.type === 'quote' || el.type === 'bullet') return el.text;
          if (el.type === 'callout') return el.text;
          return '';
        })
        .join(' ');
      currentSection.wordCount = textSum.trim() ? textSum.trim().split(/\s+/).length : 0;
      sections.push(currentSection);
    }
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || /^__(?:TOC|NOTOC|SUM[AÁ]RIO|SEM_SUM[AÁ]RIO)__$/i.test(trimmed)) {
      i++;
      continue;
    }

    if (/^\[\[(?:Categoria|Category):.*?\]\]$/i.test(trimmed) || /^-{3,}$/.test(trimmed)) {
      i++;
      continue;
    }

    // 1. Blocos de código fenced (```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(sanitizePdfText(lines[i]));
        i++;
      }
      i++; // skip closing ```
      if (codeLines.length > 0) {
        currentSection.elements.push({ type: 'code', lang: lang || undefined, text: codeLines.join('\n') });
      }
      continue;
    }

    // 2. Blocos <pre> ou <syntaxhighlight>
    const preOpenMatch = trimmed.match(/^<(pre|syntaxhighlight)(?:\s+[^>]*)?>([\s\S]*)$/i);
    if (preOpenMatch) {
      const tag = preOpenMatch[1].toLowerCase();
      const closeTag = `</${tag}>`;
      const codeLines: string[] = [];
      const firstRest = preOpenMatch[2];
      if (firstRest.toLowerCase().includes(closeTag)) {
        const inner = firstRest.slice(0, firstRest.toLowerCase().indexOf(closeTag)).trim();
        if (inner) codeLines.push(sanitizePdfText(inner));
        i++;
      } else {
        if (firstRest.trim()) codeLines.push(sanitizePdfText(firstRest));
        i++;
        while (i < lines.length) {
          const l = lines[i];
          const closeIdx = l.toLowerCase().indexOf(closeTag);
          if (closeIdx !== -1) {
            const beforeClose = l.slice(0, closeIdx);
            if (beforeClose.trim()) codeLines.push(sanitizePdfText(beforeClose));
            i++;
            break;
          }
          codeLines.push(sanitizePdfText(l));
          i++;
        }
      }
      if (codeLines.length > 0) {
        currentSection.elements.push({ type: 'code', lang: tag === 'pre' ? 'wikitext' : undefined, text: codeLines.join('\n') });
      }
      continue;
    }

    // 3. Blocos <math display="block">...</math>
    if (/^<math\b/i.test(trimmed)) {
      const mathLines: string[] = [];
      if (/<\/math>/i.test(trimmed)) {
        const cleaned = cleanWikitextForPdf(trimmed);
        if (cleaned) currentSection.elements.push({ type: 'callout', label: 'Fórmula Matemática', text: cleaned, accentRgb: [79, 70, 229] });
        i++;
      } else {
        mathLines.push(trimmed);
        i++;
        while (i < lines.length) {
          mathLines.push(lines[i]);
          if (/<\/math>/i.test(lines[i])) {
            i++;
            break;
          }
          i++;
        }
        const cleaned = cleanWikitextForPdf(mathLines.join(' '));
        if (cleaned) currentSection.elements.push({ type: 'callout', label: 'Fórmula Matemática', text: cleaned, accentRgb: [79, 70, 229] });
      }
      continue;
    }

    // 4. Blocos <gallery>...</gallery>
    if (/^<gallery\b/i.test(trimmed)) {
      const captionMatch = trimmed.match(/caption="([^"]*)"/i);
      const galCaption = captionMatch ? sanitizePdfText(captionMatch[1]) : 'Galeria de Mídia';
      const galItems: string[] = [];
      i++;
      while (i < lines.length && !/<\/gallery>/i.test(lines[i])) {
        const item = lines[i].trim();
        if (item) {
          const parts = item.split('|').map((p) => cleanWikitextForPdf(p));
          galItems.push(parts[1] ? `${parts[1]} (${parts[0]})` : parts[0]);
        }
        i++;
      }
      i++;
      if (galItems.length > 0) {
        currentSection.elements.push({
          type: 'callout',
          label: galCaption,
          text: galItems.join(' | '),
          accentRgb: [14, 116, 144],
        });
      }
      continue;
    }

    // 5. Blocos [[collapsible ...]] ... [[/collapsible]]
    const collOpen = trimmed.match(/^\[\[collapsible(?:\s+show="([^"]*)")?(?:\s+hide="[^"]*")?\]\]/i);
    if (collOpen) {
      const showLabel = sanitizePdfText(collOpen[1] || 'Conteúdo Expansível');
      const innerLines: string[] = [];
      i++;
      while (i < lines.length && !/\[\[\/collapsible\]\]/i.test(lines[i])) {
        const cleaned = cleanWikitextForPdf(lines[i].replace(/^[*#]+\s*/, ''));
        if (cleaned) innerLines.push(cleaned);
        i++;
      }
      i++;
      if (innerLines.length > 0) {
        currentSection.elements.push({
          type: 'callout',
          label: showLabel,
          text: innerLines.join(' | '),
          accentRgb: [71, 85, 105],
        });
      }
      continue;
    }

    // 6. Tabelas MediaWiki {| ... |}
    if (/^\{\s*\|/.test(trimmed)) {
      const tableLines: string[] = [rawLine];
      if (!trimmed.endsWith('|}')) {
        i++;
        while (i < lines.length) {
          tableLines.push(lines[i]);
          if (lines[i].trim().endsWith('|}')) {
            i++;
            break;
          }
          i++;
        }
      } else {
        i++;
      }
      const parsedTable = parseWikitableForPdf(tableLines.join('\n'));
      if (parsedTable.headers.length > 0 || parsedTable.rows.length > 0) {
        currentSection.elements.push({ type: 'table', data: parsedTable });
      }
      continue;
    }

    // 7. Predefinições de bloco {{ ... }} (single or multi-line balanced braces)
    if (trimmed.startsWith('{{')) {
      let buf = '';
      let depth = 0;
      let startIdx = i;
      let foundClosed = false;
      while (startIdx < lines.length) {
        const l = lines[startIdx];
        buf += (buf ? '\n' : '') + l;
        for (let c = 0; c < l.length; c++) {
          if (l[c] === '{' && l[c + 1] === '{') {
            depth++;
            c++;
          } else if (l[c] === '}' && l[c + 1] === '}') {
            depth--;
            c++;
          }
        }
        startIdx++;
        if (depth <= 0) {
          foundClosed = true;
          break;
        }
      }
      if (foundClosed) {
        const els = convertTemplateToPdfElements(buf);
        currentSection.elements.push(...els);
        i = startIdx;
        continue;
      }
    }

    // 8. Títulos de seção (MediaWiki ==...== e Markdown ##...)
    const mwHeading = trimmed.match(/^(={1,6})\s*(.*?)\s*\1$/);
    const mdHeading = !mwHeading ? trimmed.match(/^(#{1,6})\s+(.+)$/) : null;

    if (mwHeading || mdHeading) {
      pushSection();

      let hTitle = '';
      let level = 2;
      if (mwHeading) {
        const eqLen = mwHeading[1].length;
        hTitle = mwHeading[2].trim();
        level = eqLen <= 2 ? 2 : eqLen === 3 ? 3 : 4;
      } else if (mdHeading) {
        const hashes = mdHeading[1].length;
        hTitle = mdHeading[2].trim();
        level = hashes <= 2 ? 2 : hashes === 3 ? 3 : 4;
      }

      hTitle = cleanWikitextForPdf(hTitle);
      const lower = hTitle.toLowerCase();

      let group: ParsedSection['categoryGroup'] = 'development';
      let badge = 'DETALHE';
      let colorRgb: [number, number, number] = [37, 99, 235];
      let bgColorRgb: [number, number, number] = [239, 246, 255];

      if (lower.includes('referência') || lower.includes('referencia') || lower.includes('fonte') || lower.includes('bibliografia')) {
        group = 'references';
        badge = 'FONTE';
        colorRgb = [147, 51, 234];
        bgColorRgb = [250, 245, 255];
      } else if (lower.includes('história') || lower.includes('origem') || lower.includes('fundação') || lower.includes('cronologia')) {
        group = 'development';
        badge = 'HISTÓRICO';
        colorRgb = [37, 99, 235];
        bgColorRgb = [239, 246, 255];
      } else if (lower.includes('análise') || lower.includes('tabela') || lower.includes('dados') || lower.includes('fórmula') || lower.includes('estatística')) {
        group = 'analysis';
        badge = 'ESTRUTURA';
        colorRgb = [8, 145, 178];
        bgColorRgb = [236, 254, 255];
      } else if (lower.includes('introdução') || lower.includes('definição') || lower.includes('conceito') || lower.includes('visão geral')) {
        group = 'intro';
        badge = 'CONCEITO';
        colorRgb = [16, 185, 129];
        bgColorRgb = [236, 253, 245];
      }

      if (level <= 2) {
        sectionCounter++;
        subCounter = 0;
      } else {
        subCounter++;
      }

      const numStr = level <= 2 ? `§ ${sectionCounter}.0` : `§ ${sectionCounter}.${subCounter}`;
      currentSection = createEmptySection(numStr, hTitle, level, badge, colorRgb, bgColorRgb, group);
      i++;
      continue;
    }

    // 9. Listas de definição MediaWiki (; Termo : Definição)
    if (trimmed.startsWith(';')) {
      const defMatch = trimmed.slice(1).match(/^([^:]+):(.*)$/);
      if (defMatch) {
        const term = cleanWikitextForPdf(defMatch[1]);
        const def = cleanWikitextForPdf(defMatch[2]);
        currentSection.elements.push({ type: 'bullet', marker: '•', text: `${term}: ${def}` });
      } else {
        const cleaned = cleanWikitextForPdf(trimmed.slice(1));
        if (cleaned) currentSection.elements.push({ type: 'bullet', marker: '•', text: cleaned });
      }
      i++;
      continue;
    }

    // 10. Listas com marcadores / numeradas
    if (/^[*#]+/.test(trimmed)) {
      const isOrdered = trimmed.startsWith('#');
      const cleaned = cleanWikitextForPdf(trimmed.replace(/^[*#]+\s*/, ''));
      if (cleaned) {
        currentSection.elements.push({ type: 'bullet', marker: isOrdered ? '->' : '•', text: cleaned });
      }
      i++;
      continue;
    }

    // 11. Citações / Recuos (: ou >)
    if (trimmed.startsWith(':') || trimmed.startsWith('>')) {
      const cleaned = cleanWikitextForPdf(trimmed.replace(/^[:>]+\s*/, ''));
      if (cleaned) {
        currentSection.elements.push({ type: 'quote', text: cleaned });
      }
      i++;
      continue;
    }

    // 12. Parágrafo normal
    const cleanedPara = cleanWikitextForPdf(trimmed);
    if (cleanedPara) {
      currentSection.elements.push({ type: 'paragraph', text: cleanedPara });
    }
    i++;
  }

  pushSection();
  return sections;
}

/**
 * Exporta o artigo enciclopédico em PDF vetorial com renderização completa de tabelas, infoboxes,
 * caixas contextuais, código, referências e controle preciso de paginação.
 */
export async function exportArticleToStructuredPdf(
  article: WikiArticle,
  pageName: string = 'WikiWorldWeb Enciclopédia',
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

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin - 12;

  let currentY = margin;

  const scaleFont = (size: number) => {
    if (fontSize === 'compact') return size * 0.9;
    if (fontSize === 'large') return size * 1.12;
    return size;
  };

  const drawMiniHeader = () => {
    if (!includeHeader) return;
    drawPdfStandardMiniHeader(
      doc,
      'WIKIWORLDWEB • RELATÓRIO DO ARTIGO',
      `${article.titulo} (?uid=${article.id})`,
      margin,
      pageWidth
    );
    currentY = 16;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > bottomLimit) {
      doc.addPage();
      drawMiniHeader();
    }
  };

  // Pré-processa pré-definições, variáveis mágicas e funções de parser antes de gerar estatísticas e seções
  const expandedWikitext = preprocessArticleWikitextForPdf(article.descricao || '', article.titulo);
  const parseResult = parseWikitext(expandedWikitext, undefined, article.titulo);
  const parsedSections = parseArticleIntoStructuredSections(expandedWikitext, article.titulo);

  const rawCleanText = cleanWikitextForPdf(expandedWikitext);
  const wordsCount = rawCleanText.trim() ? rawCleanText.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordsCount / 200));
  const sectionsCount = parsedSections.length;
  const referencesCount = (parseResult.references || []).length;
  const nowFormatted = new Date().toLocaleString('pt-BR');

  // 1. HERO BANNER
  if (includeHeader) {
    const actualHeroH = drawPdfStandardHeroBanner(
      doc,
      currentY,
      {
        categoryTag: 'DOCUMENTO ENCICLOPÉDICO & ARTIGO PADRONIZADO',
        title: `RELATÓRIO DO ARTIGO: ${article.titulo.toUpperCase()}`,
        subtitle: `Classificado por Estrutura Editorial: Verbete Enciclopédico, Fontes & Histórico`,
        metadataLine: `Gerado em: ${nowFormatted} • Emissor: WikiWorldWeb • UID: ?uid=${article.id} • Coleção: ${pageName}`,
        height: 36,
      },
      margin,
      contentWidth
    );
    currentY += actualHeroH + 5;
  }

  // 2. CARDS DE KPIS
  if (includeMetadata) {
    checkPageBreak(20);
    const kpis: PdfKpiCard[] = [
      {
        title: 'TOTAL DE PALAVRAS',
        val: wordsCount.toLocaleString('pt-BR'),
        sub: `~${readingTimeMin} min de leitura`,
        bg: [239, 246, 255],
        border: [191, 219, 254],
        textCol: [29, 78, 216],
      },
      {
        title: 'SEÇÕES & TÓPICOS',
        val: `${sectionsCount}`,
        sub: 'Índice enciclopédico',
        bg: [243, 244, 246],
        border: [229, 231, 235],
        textCol: [31, 41, 55],
      },
      {
        title: 'FONTES & REFERÊNCIAS',
        val: `${referencesCount}`,
        sub: 'Citações verificadas',
        bg: [236, 253, 245],
        border: [167, 243, 208],
        textCol: [5, 150, 105],
      },
      {
        title: 'REVISÃO & ESTADO',
        val: `v${article.versao || 1}`,
        sub: 'Verbete verificado',
        bg: [255, 241, 242],
        border: [254, 205, 211],
        textCol: [225, 29, 72],
      },
    ];
    drawPdfStandardKpiCards(doc, currentY, kpis, margin, contentWidth, 16);
    currentY += 22;
  }

  // 2.5 SUMÁRIO OPCIONAL
  if (includeToc && parsedSections.length > 1) {
    const tocEntries = parsedSections
      .filter((s) => s.level <= 3)
      .map((s) => sanitizePdfText(`${s.numberStr}  ${s.title}`));
    if (tocEntries.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      const wrappedEntries = tocEntries.map((entry) => doc.splitTextToSize(entry, contentWidth - 10));
      const totalTocLines = wrappedEntries.reduce((sum, lines) => sum + lines.length, 0);
      const tocBoxH = 10 + totalTocLines * 3.8 + 2.5;
      if (currentY + tocBoxH > bottomLimit) {
        checkPageBreak(Math.min(tocBoxH + 4, bottomLimit - 18));
      }

      if (currentY + tocBoxH <= bottomLimit) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY, contentWidth, tocBoxH, 1.4, 1.4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.6);
        doc.setTextColor(30, 41, 59);
        doc.text('SUMÁRIO DO ARTIGO', margin + 4, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        let tocY = currentY + 10;
        wrappedEntries.forEach((lines) => {
          doc.text(lines, margin + 5, tocY);
          tocY += lines.length * 3.8;
        });
        currentY += tocBoxH + 5;
      } else {
        // Fallback paginado para artigos com sumário muito longo
        checkPageBreak(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.6);
        doc.setTextColor(30, 41, 59);
        doc.text('SUMÁRIO DO ARTIGO', margin, currentY + 4);
        currentY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        wrappedEntries.forEach((lines) => {
          const h = lines.length * 3.8;
          checkPageBreak(h + 2);
          doc.text(lines, margin + 2, currentY);
          currentY += h;
        });
        currentY += 4;
      }
    }
  }

  // 3. CABEÇALHO DE CONTEÚDO
  checkPageBreak(14);
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

  // Helpers para medir e desenhar cada elemento com precisão milimétrica
  const lineHPara = scaleFont(3.9);
  const lineHBullet = scaleFont(3.8);
  const lineHQuote = scaleFont(3.7);
  const lineHCode = scaleFont(3.4);

  const renderSectionElement = (
    el: PdfSectionElement,
    sectionAccent: [number, number, number],
    boxX: number,
    boxW: number,
    yStart: number
  ): number => {
    if (el.type === 'paragraph') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(8.4));
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(el.text, boxW);
      doc.text(lines, boxX, yStart);
      return lines.length * lineHPara + 2;
    }

    if (el.type === 'bullet') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(8.2));
      doc.setTextColor(sectionAccent[0], sectionAccent[1], sectionAccent[2]);
      doc.text(el.marker, boxX, yStart);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(el.text, boxW - 5);
      doc.text(lines, boxX + 4.5, yStart);
      return lines.length * lineHBullet + 1.6;
    }

    if (el.type === 'quote') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(scaleFont(8.0));
      const lines = doc.splitTextToSize(el.text, boxW - 7);
      const qH = lines.length * lineHQuote + 3.2;

      doc.setFillColor(248, 250, 252);
      doc.rect(boxX, yStart - 2.4, boxW, qH, 'F');
      doc.setDrawColor(sectionAccent[0], sectionAccent[1], sectionAccent[2]);
      doc.setLineWidth(0.75);
      doc.line(boxX, yStart - 2.4, boxX, yStart - 2.4 + qH);

      doc.setTextColor(71, 85, 105);
      doc.text(lines, boxX + 3.5, yStart + 0.8);
      return qH + 2;
    }

    if (el.type === 'callout') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(7.6));
      const titleLines = doc.splitTextToSize(el.label, boxW - 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(7.8));
      const bodyLines = doc.splitTextToSize(el.text, boxW - 7);
      const cH = titleLines.length * 3.5 + bodyLines.length * lineHQuote + 4;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(boxX, yStart - 2.4, boxW, cH, 1, 1, 'FD');
      doc.setDrawColor(el.accentRgb[0], el.accentRgb[1], el.accentRgb[2]);
      doc.setLineWidth(0.9);
      doc.line(boxX, yStart - 2.4, boxX, yStart - 2.4 + cH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(7.6));
      doc.setTextColor(el.accentRgb[0], el.accentRgb[1], el.accentRgb[2]);
      doc.text(titleLines, boxX + 3.5, yStart + 0.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(7.8));
      doc.setTextColor(51, 65, 85);
      doc.text(bodyLines, boxX + 3.5, yStart + 0.8 + titleLines.length * 3.6);
      return cH + 2.2;
    }

    if (el.type === 'code') {
      doc.setFont('courier', 'normal');
      doc.setFontSize(scaleFont(7.1));
      const lines = doc.splitTextToSize(el.text, boxW - 6);
      const headerExtra = el.lang ? 4 : 0;
      const cH = headerExtra + lines.length * lineHCode + 4;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(boxX, yStart - 2.4, boxW, cH, 1, 1, 'FD');

      let codeCursorY = yStart + 0.6;
      if (el.lang) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(6.4);
        doc.setTextColor(100, 116, 139);
        doc.text(el.lang.toUpperCase(), boxX + 3, codeCursorY);
        codeCursorY += 3.8;
      }
      doc.setFont('courier', 'normal');
      doc.setFontSize(scaleFont(7.1));
      doc.setTextColor(15, 23, 42);
      doc.text(lines, boxX + 3, codeCursorY);
      return cH + 2.2;
    }

    if (el.type === 'infobox') {
      const info = el.data;
      const labelW = Math.min(44, boxW * 0.36);
      const valW = boxW - labelW - 6;

      let totalH = info.subtitle ? 11.5 : 7.5;
      const measuredRows = info.rows.map((r) => {
        if (r.isSection) {
          totalH += 5.2;
          return { ...r, lines: [r.label], rowH: 5.2 };
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(scaleFont(7.3));
        const valLines = doc.splitTextToSize(r.value, valW);
        doc.setFont('helvetica', 'bold');
        const lblLines = doc.splitTextToSize(r.label, labelW - 3);
        const rowH = Math.max(lblLines.length, valLines.length) * 3.4 + 2.2;
        totalH += rowH;
        return { ...r, lblLines, valLines, rowH };
      });

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(199, 210, 254);
      doc.setLineWidth(0.35);
      doc.roundedRect(boxX, yStart - 2.4, boxW, totalH, 1.2, 1.2, 'FD');

      const headerH = info.subtitle ? 10.5 : 6.8;
      doc.setFillColor(67, 56, 202);
      doc.rect(boxX, yStart - 2.4, boxW, headerH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(255, 255, 255);
      doc.text(info.title, boxX + boxW / 2, yStart + 1.8, { align: 'center' });
      if (info.subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.text(info.subtitle, boxX + boxW / 2, yStart + 5.6, { align: 'center' });
      }

      let rowY = yStart - 2.4 + headerH;
      measuredRows.forEach((mr, rIdx) => {
        if (mr.isSection) {
          doc.setFillColor(238, 242, 255);
          doc.rect(boxX, rowY, boxW, mr.rowH, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.1);
          doc.setTextColor(49, 46, 129);
          doc.text(mr.label, boxX + boxW / 2, rowY + 3.6, { align: 'center' });
          rowY += mr.rowH;
          return;
        }
        if (rIdx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(boxX, rowY, boxW, mr.rowH, 'F');
        }
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(boxX, rowY, boxX + boxW, rowY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(scaleFont(7.2));
        doc.setTextColor(51, 65, 85);
        doc.text((mr as any).lblLines || [mr.label], boxX + 2.5, rowY + 3.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(scaleFont(7.3));
        doc.setTextColor(30, 41, 59);
        doc.text((mr as any).valLines || [mr.value], boxX + labelW + 2, rowY + 3.5);

        rowY += mr.rowH;
      });

      return totalH + 2.6;
    }

    if (el.type === 'table') {
      const tbl = el.data;
      const colCount = Math.max(
        tbl.headers.length,
        ...tbl.rows.map((r) => r.length),
        1
      );
      const colW = boxW / colCount;
      let cursorY = yStart - 2.4;
      let usedH = 0;

      if (tbl.caption) {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.25);
        doc.rect(boxX, cursorY, boxW, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.4);
        doc.setTextColor(30, 41, 59);
        doc.text(tbl.caption, boxX + boxW / 2, cursorY + 4.1, { align: 'center' });
        cursorY += 6;
        usedH += 6;
      }

      if (tbl.headers.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.1);
        const hdrWrapped = tbl.headers.map((h) => doc.splitTextToSize(h, colW - 3));
        const maxLines = Math.max(...hdrWrapped.map((w) => w.length), 1);
        const hdrH = maxLines * 3.4 + 2.6;

        doc.setFillColor(226, 232, 240);
        doc.setDrawColor(203, 213, 225);
        doc.rect(boxX, cursorY, boxW, hdrH, 'FD');
        doc.setTextColor(15, 23, 42);
        hdrWrapped.forEach((lines, cIdx) => {
          doc.text(lines, boxX + cIdx * colW + 1.5, cursorY + 3.6);
          if (cIdx > 0) doc.line(boxX + cIdx * colW, cursorY, boxX + cIdx * colW, cursorY + hdrH);
        });
        cursorY += hdrH;
        usedH += hdrH;
      }

      tbl.rows.forEach((row, rIdx) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.0);
        const cellWrapped = Array.from({ length: colCount }, (_, cIdx) =>
          doc.splitTextToSize(row[cIdx] || '', colW - 3)
        );
        const maxLines = Math.max(...cellWrapped.map((w) => w.length), 1);
        const rowH = maxLines * 3.3 + 2.4;

        doc.setFillColor(rIdx % 2 === 1 ? 248 : 255, rIdx % 2 === 1 ? 250 : 255, rIdx % 2 === 1 ? 252 : 255);
        doc.setDrawColor(226, 232, 240);
        doc.rect(boxX, cursorY, boxW, rowH, 'FD');
        doc.setTextColor(51, 65, 85);

        cellWrapped.forEach((lines, cIdx) => {
          doc.text(lines, boxX + cIdx * colW + 1.5, cursorY + 3.4);
          if (cIdx > 0) doc.line(boxX + cIdx * colW, cursorY, boxX + cIdx * colW, cursorY + rowH);
        });
        cursorY += rowH;
        usedH += rowH;
      });

      return usedH + 2.6;
    }

    return 0;
  };

  const measureElementHeight = (el: PdfSectionElement, boxW: number): number => {
    if (el.type === 'paragraph') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(8.4));
      return doc.splitTextToSize(el.text, boxW).length * lineHPara + 2;
    }
    if (el.type === 'bullet') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(8.2));
      return doc.splitTextToSize(el.text, boxW - 5).length * lineHBullet + 1.6;
    }
    if (el.type === 'quote') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(scaleFont(8.0));
      return doc.splitTextToSize(el.text, boxW - 7).length * lineHQuote + 5.2;
    }
    if (el.type === 'callout') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(scaleFont(7.6));
      const tL = doc.splitTextToSize(el.label, boxW - 7).length;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(7.8));
      const bL = doc.splitTextToSize(el.text, boxW - 7).length;
      return tL * 3.5 + bL * lineHQuote + 6.2;
    }
    if (el.type === 'code') {
      doc.setFont('courier', 'normal');
      doc.setFontSize(scaleFont(7.1));
      const l = doc.splitTextToSize(el.text, boxW - 6).length;
      return (el.lang ? 4 : 0) + l * lineHCode + 6.2;
    }
    if (el.type === 'infobox') {
      const info = el.data;
      const labelW = Math.min(44, boxW * 0.36);
      const valW = boxW - labelW - 6;
      let totalH = info.subtitle ? 11.5 : 7.5;
      info.rows.forEach((r) => {
        if (r.isSection) {
          totalH += 5.2;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(scaleFont(7.3));
          const vL = doc.splitTextToSize(r.value, valW).length;
          doc.setFont('helvetica', 'bold');
          const lL = doc.splitTextToSize(r.label, labelW - 3).length;
          totalH += Math.max(lL, vL) * 3.4 + 2.2;
        }
      });
      return totalH + 2.6;
    }
    if (el.type === 'table') {
      const tbl = el.data;
      const colCount = Math.max(tbl.headers.length, ...tbl.rows.map((r) => r.length), 1);
      const colW = boxW / colCount;
      let totalH = tbl.caption ? 6 : 0;
      if (tbl.headers.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.1);
        const maxL = Math.max(...tbl.headers.map((h) => doc.splitTextToSize(h, colW - 3).length), 1);
        totalH += maxL * 3.4 + 2.6;
      }
      tbl.rows.forEach((row) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.0);
        const maxL = Math.max(
          ...Array.from({ length: colCount }, (_, cIdx) => doc.splitTextToSize(row[cIdx] || '', colW - 3).length),
          1
        );
        totalH += maxL * 3.3 + 2.4;
      });
      return totalH + 2.6;
    }
    return 0;
  };

  // 4. RENDERIZAÇÃO DAS SEÇÕES COM PAGINAÇÃO AUTOMÁTICA SEM ESTOURO
  let lastGroupHeader = '';
  const innerWidth = contentWidth - 8;

  for (let sIdx = 0; sIdx < parsedSections.length; sIdx++) {
    const section = parsedSections[sIdx];

    if (lastGroupHeader !== section.categoryGroup) {
      lastGroupHeader = section.categoryGroup;
      checkPageBreak(14);

      let groupLabel = 'DESENVOLVIMENTO & DETALHAMENTO TEMÁTICO';
      let groupCol: [number, number, number] = [37, 99, 235];
      if (section.categoryGroup === 'intro') {
        groupLabel = 'INTRODUÇÃO & CONCEITO GERAL';
        groupCol = [16, 185, 129];
      } else if (section.categoryGroup === 'analysis') {
        groupLabel = 'ANÁLISE, TABELAS & FÓRMULAS';
        groupCol = [8, 145, 178];
      } else if (section.categoryGroup === 'references') {
        groupLabel = 'FONTES & REFERÊNCIAS BIBLIOGRÁFICAS';
        groupCol = [147, 51, 234];
      }

      drawPdfStandardCategoryBanner(doc, currentY, groupLabel, groupCol, [255, 255, 255], margin, contentWidth);
      currentY += 8.5;
    }

    // Divide os elementos da seção em "chunks" de cartão que sempre cabem em uma página
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const titleLines = doc.splitTextToSize(section.title, innerWidth);
    const headerBlockH = 12 + titleLines.length * 4.2 + 2;

    const maxCardH = bottomLimit - 18;
    const chunks: { elements: PdfSectionElement[]; height: number; isContinuation: boolean }[] = [];

    let curEls: PdfSectionElement[] = [];
    let curH = headerBlockH;
    let isCont = false;

    if (section.elements.length === 0) {
      chunks.push({ elements: [], height: Math.max(17, headerBlockH + 2), isContinuation: false });
    } else {
      for (const el of section.elements) {
        const elH = measureElementHeight(el, innerWidth);
        if (curEls.length > 0 && curH + elH + 3 > maxCardH) {
          chunks.push({ elements: curEls, height: curH + 3, isContinuation: isCont });
          curEls = [el];
          isCont = true;
          curH = 13 + elH;
        } else {
          curEls.push(el);
          curH += elH;
        }
      }
      if (curEls.length > 0) {
        chunks.push({ elements: curEls, height: Math.max(17, curH + 3), isContinuation: isCont });
      }
    }

    chunks.forEach((chunk) => {
      checkPageBreak(Math.min(chunk.height + 3, maxCardH));

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, chunk.height, 1.2, 1.2, 'FD');

      // Pill identificador da Seção
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin + 3, currentY + 3, 16, 4.5, 0.8, 0.8, 'FD');
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      doc.text(section.numberStr, margin + 4.5, currentY + 6.2);

      // Badge Categoria
      doc.setFillColor(section.bgColorRgb[0], section.bgColorRgb[1], section.bgColorRgb[2]);
      doc.roundedRect(margin + 21, currentY + 3, 24, 4.5, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(section.colorRgb[0], section.colorRgb[1], section.colorRgb[2]);
      doc.text(chunk.isContinuation ? 'CONT.' : section.badge, margin + 23, currentY + 6.2);

      // Metadados à direita
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      const sectionMins = Math.max(1, Math.ceil(section.wordCount / 200));
      doc.text(
        `Seção Nível ${section.level} • Leitura ~${sectionMins} min`,
        pageWidth - margin - 4,
        currentY + 6.2,
        { align: 'right' }
      );

      let innerY = currentY + 12;
      if (!chunk.isContinuation) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(titleLines, margin + 4, innerY);
        innerY += titleLines.length * 4.2 + 2;
      }

      chunk.elements.forEach((el) => {
        innerY += renderSectionElement(el, section.colorRgb, margin + 4, innerWidth, innerY);
      });

      currentY += chunk.height + 3;
    });
  }

  // 5. REFERÊNCIAS & CITAÇÕES CATALOGADAS
  if (includeReferences && parseResult.references && parseResult.references.length > 0) {
    checkPageBreak(18);
    drawPdfStandardCategoryBanner(
      doc,
      currentY,
      'REFERÊNCIAS, FONTES & NOTAS BIBLIOGRÁFICAS',
      [147, 51, 234],
      [255, 255, 255],
      margin,
      contentWidth
    );
    currentY += 8.5;

    parseResult.references.forEach((ref, rIdx) => {
      const cleanRef = cleanWikitextForPdf(ref) || sanitizePdfText(ref);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(7.8));
      const splitRef = doc.splitTextToSize(cleanRef, contentWidth - 10);
      const refCardHeight = Math.max(14, splitRef.length * 3.7 + 11.5);

      checkPageBreak(refCardHeight + 2);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, refCardHeight, 1.2, 1.2, 'FD');

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin + 3, currentY + 2.5, 12, 4.5, 0.8, 0.8, 'FD');
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      doc.text(`[${rIdx + 1}]`, margin + 4.5, currentY + 5.7);

      doc.setFillColor(250, 245, 255);
      doc.roundedRect(margin + 17, currentY + 2.5, 22, 4.5, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(147, 51, 234);
      doc.text('REFERÊNCIA', margin + 18.5, currentY + 5.7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Citação Indexada', pageWidth - margin - 4, currentY + 5.7, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(scaleFont(7.8));
      doc.setTextColor(51, 65, 85);
      doc.text(splitRef, margin + 4, currentY + 11);

      currentY += refCardHeight + 2.5;
    });
  }

  // 6. CAIXA DE GOVERNANÇA
  if (includeLicense) {
    checkPageBreak(34);
    const extraBullets = [
      '• Licença Editorial: Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0).',
      `• Identificador Canônico Permanente (UID): ?uid=${article.id} • Coleção: ${pageName}.`,
    ];
    const boxH = drawPdfStandardGovernanceBox(doc, currentY, margin, contentWidth, extraBullets);
    currentY += boxH + 6;
  }

  // 7. MARCA D'ÁGUA OPCIONAL
  const totalPages = doc.getNumberOfPages();
  if (customWatermark) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.saveGraphicsState();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(50);
      doc.setTextColor(241, 245, 249);
      doc.text(sanitizePdfText(customWatermark), pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  }

  // 8. RODAPÉ UNIFICADO
  if (includeFooter) {
    drawPdfStandardFooters(
      doc,
      'Documento Enciclopédico Oficial',
      margin,
      pageWidth,
      pageHeight
    );
  }

  const cleanTitleSlug = article.titulo.replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
  const filename = `wikiworldweb-artigo-${cleanTitleSlug}.pdf`;
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

  try {
    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = html2canvasModule.default;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Tailwind v4 emite oklch()/oklab() que o parser do html2canvas 1.4.1 não suporta
        clonedDoc.querySelectorAll('style').forEach((styleEl) => {
          if (styleEl.textContent && /oklch\(|oklab\(/i.test(styleEl.textContent)) {
            styleEl.textContent = styleEl.textContent
              .replace(/oklch\([^)]*\)/gi, '#334155')
              .replace(/oklab\([^)]*\)/gi, '#334155');
          }
        });
      },
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
    pdf.save(`wikiworldweb-snapshot-${cleanTitleSlug}.pdf`);
  } catch (snapshotErr) {
    console.warn('Snapshot HTML2Canvas indisponível, exportando via motor vetorial estruturado:', snapshotErr);
    await exportArticleToStructuredPdf(article, 'WikiWorldWeb', options);
  }
}
