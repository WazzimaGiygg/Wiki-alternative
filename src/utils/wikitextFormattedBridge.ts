import { WikiTemplate } from '../types';
import { parseWikitext } from './wikitextParser';
import { sanitizeHtml } from './sanitizeHtml';

export interface WikitextFormattedBridgeOptions {
  articleTitle?: string;
  customTemplates?: WikiTemplate[];
}

interface AtomicToken {
  placeholder: string;
  raw: string;
  html: string;
  isBlock: boolean;
}

export interface NormalizedPastedContent {
  cleanHtml: string;
  wikitext: string;
  hasRichFormatting: boolean;
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Encontra blocos balanceados {{...}} (e {{{...}}}).
 */
function extractBalancedCurlyBlocks(
  input: string,
  createToken: (raw: string, isBlock: boolean) => string,
  isBlockTemplate: (raw: string) => boolean
): string {
  let out = '';
  let i = 0;

  while (i < input.length) {
    if (input[i] === '{' && input[i + 1] === '{' && input[i + 2] === '{') {
      let depth = 3;
      let j = i + 3;
      while (j < input.length && depth > 0) {
        if (input[j] === '{') depth++;
        else if (input[j] === '}') depth--;
        j++;
      }
      const raw = input.slice(i, j);
      out += createToken(raw, false);
      i = j;
      continue;
    }

    if (input[i] === '{' && input[i + 1] === '{') {
      let depth = 2;
      let j = i + 2;
      while (j < input.length && depth > 0) {
        if (input[j] === '{') depth++;
        else if (input[j] === '}') depth--;
        j++;
      }
      if (depth === 0) {
        const raw = input.slice(i, j);
        out += createToken(raw, isBlockTemplate(raw));
        i = j;
        continue;
      }
    }

    out += input[i];
    i++;
  }

  return out;
}

/**
 * Converte Wikitexto MediaWiki para HTML formatado editável:
 * - Prosa, títulos, negrito, itálico, sublinhado, riscado, listas, citações e links ficam editáveis diretamente.
 * - Predefinições ({{...}}), Infoboxes, Wikitables ({|...|}), <ref>, <math>, galerias, blocos de código,
 *   categorias e ficheiros são renderizados dentro de widgets atômicos sem perdas (data-mw-raw),
 *   garantindo conversão bidirecional fiel entre Código e Página Formatada.
 */
export function wikitextToFormattedHtml(
  wikitext: string,
  options?: WikitextFormattedBridgeOptions
): string {
  if (!wikitext || !wikitext.trim()) {
    return '<p><br /></p>';
  }

  const tokens: AtomicToken[] = [];

  const renderAtomicHtml = (raw: string, isBlock: boolean, customLabel?: string): string => {
    const encoded = encodeURIComponent(raw);
    if (customLabel) {
      return isBlock
        ? `<div contenteditable="false" data-mw-raw="${encoded}" class="mw-atomic-block my-2 select-none">${customLabel}</div>`
        : `<span contenteditable="false" data-mw-raw="${encoded}" class="mw-atomic-inline inline-flex items-center select-none">${customLabel}</span>`;
    }

    const parsed = parseWikitext(
      raw,
      undefined,
      options?.articleTitle,
      options?.customTemplates
    );
    const rendered = sanitizeHtml(parsed.html).trim();

    if (isBlock) {
      return `<div contenteditable="false" data-mw-raw="${encoded}" class="mw-atomic-block my-2 rounded-md border border-dashed border-indigo-300/80 dark:border-indigo-700/70 p-2 bg-indigo-50/25 dark:bg-indigo-950/15 select-none" title="Bloco MediaWiki sincronizado (edite os parâmetros no modo Código ou clique em Inserir Wikitexto)">${rendered || `<code>${escapeHtmlText(raw)}</code>`}</div>`;
    }
    return `<span contenteditable="false" data-mw-raw="${encoded}" class="mw-atomic-inline inline-block align-baseline rounded px-1 border border-dashed border-indigo-300/80 dark:border-indigo-700/70 bg-indigo-50/35 dark:bg-indigo-950/20 select-none" title="Elemento MediaWiki sincronizado">${rendered || `<code>${escapeHtmlText(raw)}</code>`}</span>`;
  };

  const pushToken = (raw: string, isBlock: boolean, customLabel?: string): string => {
    const idx = tokens.length;
    const placeholder = `@@MWATOMIC_${idx}@@`;
    tokens.push({
      placeholder,
      raw,
      html: renderAtomicHtml(raw, isBlock, customLabel),
      isBlock,
    });
    return placeholder;
  };

  let text = wikitext.replace(/\r\n/g, '\n');

  // 0. Redirects e diretivas mágicas (__TOC__, __NOTOC__)
  text = text.replace(/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\s*\[\[.*?\]\]/gim, (raw) =>
    pushToken(
      raw.trim(),
      true,
      `<div class="p-2 rounded border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/30 font-mono text-xs text-amber-800 dark:text-amber-200">${escapeHtmlText(raw.trim())}</div>`
    )
  );
  text = text.replace(/__(?:NOTOC|SEM_SUM[AÁ]RIO|TOC|SUM[AÁ]RIO)__/gi, (raw) =>
    pushToken(
      raw,
      true,
      `<div class="px-2 py-1 rounded border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 font-mono text-[11px] text-slate-600 dark:text-slate-300">${escapeHtmlText(raw)}</div>`
    )
  );

  // 1. Blocos de código, <syntaxhighlight>, <pre>, <nowiki>, <math>
  text = text.replace(
    /<syntaxhighlight(?:\s+[^>]*)?>[\s\S]*?<\/syntaxhighlight>/gi,
    (raw) => pushToken(raw, true)
  );
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (raw) => pushToken(raw, true));
  text = text.replace(/<pre(?:\s+[^>]*)?>[\s\S]*?<\/pre>/gi, (raw) => pushToken(raw, true));
  text = text.replace(/<nowiki>[\s\S]*?<\/nowiki>/gi, (raw) =>
    pushToken(
      raw,
      false,
      `<span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">${escapeHtmlText(raw)}</span>`
    )
  );
  text = text.replace(
    /<math(?:\s+display=["']?(inline|block)["']?)?>([\s\S]*?)<\/math>/gi,
    (raw, displayAttr, mathContent) => {
      const isBlock = displayAttr?.toLowerCase() === 'block' || String(mathContent || '').includes('\n');
      return pushToken(raw, isBlock);
    }
  );

  // 2. Tags de transclusão (<includeonly>, <noinclude>, <onlyinclude>)
  text = text.replace(/<\/?(?:includeonly|noinclude|onlyinclude)\s*>/gi, (raw) =>
    pushToken(
      raw,
      false,
      `<span class="px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-mono text-[10px]">${escapeHtmlText(raw)}</span>`
    )
  );

  // 3. Referências <ref>...</ref>, <ref name="..." /> e <references />
  text = text.replace(
    /<ref(?:\s+name\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+)))?\s*>([\s\S]*?)<\/ref>/gi,
    (raw, n1, n2, n3, inner) => {
      const refName = (n1 || n2 || n3 || '').trim();
      const preview = String(inner || '').replace(/<[^>]*>/g, '').trim();
      const label = refName ? `[ref: ${refName}]` : '[ref]';
      return pushToken(
        raw,
        false,
        `<sup class="px-1 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] border border-blue-200 dark:border-blue-800" title="${escapeHtmlAttr(preview || raw)}">${escapeHtmlText(label)}</sup>`
      );
    }
  );
  text = text.replace(
    /<ref\s+name\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))\s*\/>/gi,
    (raw, n1, n2, n3) => {
      const refName = (n1 || n2 || n3 || '').trim();
      return pushToken(
        raw,
        false,
        `<sup class="px-1 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] border border-blue-200 dark:border-blue-800" title="${escapeHtmlAttr(raw)}">[ref: ${escapeHtmlText(refName)}]</sup>`
      );
    }
  );
  text = text.replace(/<references\s*\/?>/gi, (raw) =>
    pushToken(
      raw,
      true,
      `<div class="p-2 rounded border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-[11px] font-mono text-blue-800 dark:text-blue-200">&lt;references /&gt; — Lista automática de referências</div>`
    )
  );

  // 4. Galerias e Blocos Recolhíveis
  text = text.replace(/<gallery(?:\s+[^>]*)?>[\s\S]*?<\/gallery>/gi, (raw) => pushToken(raw, true));
  text = text.replace(/\[\[collapsible(?:\s+[^\]]*)?\]\][\s\S]*?\[\[\/collapsible\]\]/gi, (raw) =>
    pushToken(raw, true)
  );

  // 5. Tabelas MediaWiki {| ... |} (aceita quebra após '{')
  text = text.replace(/\{\s*\|[\s\S]*?\|\}/g, (raw) => pushToken(raw, true));

  // 6. Predefinições, Infoboxes, ParserFunctions e Variáveis Mágicas {{...}}
  const inlineTemplateNames =
    /^(?:sim|não|nao|parcial|atalho|carece de fontes|cn|citation needed|pagename|sitename|currentyear|currentmonth|currentday|currentdate|numberofpages|versão|versao|!|lc:|uc:|lcfirst:|ucfirst:|#expr:|citar\b)/i;
  text = extractBalancedCurlyBlocks(
    text,
    (raw, isBlock) => pushToken(raw, isBlock),
    (raw) => {
      const inner = raw.slice(2, -2).trim();
      if (raw.includes('\n')) return true;
      if (inlineTemplateNames.test(inner)) return false;
      if (
        /^(?:infobox|info\/|aviso|notice|info\b|nota|destaque|atenção|atencao|ambox|esboço|esboco|carece_de_fontes|atualizar|citação|citacao|portal|reflist|navbox|artigo principal|ver também|desambiguação|colunas|oculto|userbox|galeria)\b/i.test(
          inner
        )
      ) {
        return true;
      }
      return inner.length > 42;
    }
  );

  // 7. Categorias, Ficheiros/Imagens MediaWiki e Imagens Markdown
  text = text.replace(/\[\[(?:Categoria|Category):([^\]]+)\]\]/gi, (raw, cat) =>
    pushToken(
      raw,
      false,
      `<span class="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">Categoria: ${escapeHtmlText(String(cat).trim())}</span>`
    )
  );
  text = text.replace(
    /\[\[(?:Ficheiro|Arquivo|Imagem|File|Image):[\s\S]*?\]\]/gi,
    (raw) => pushToken(raw, true)
  );
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, (raw) => pushToken(raw, true));

  // 8. Preserva tags inline editáveis (<u>, <s>, <del>, <sub>, <sup>, <small>) antes de escapar texto
  const inlineTagTokens: Array<{ key: string; html: string }> = [];
  const preserveInlineTag = (regex: RegExp, tag: string) => {
    text = text.replace(regex, (_, inner) => {
      const k = `@@MWINLINE_${inlineTagTokens.length}@@`;
      inlineTagTokens.push({ key: k, html: `<${tag}>${escapeHtmlText(inner)}</${tag}>` });
      return k;
    });
  };
  preserveInlineTag(/<u>([\s\S]*?)<\/u>/gi, 'u');
  preserveInlineTag(/<s>([\s\S]*?)<\/s>/gi, 's');
  preserveInlineTag(/<del>([\s\S]*?)<\/del>/gi, 's');
  preserveInlineTag(/<sub>([\s\S]*?)<\/sub>/gi, 'sub');
  preserveInlineTag(/<sup>([\s\S]*?)<\/sup>/gi, 'sup');
  preserveInlineTag(/<small>([\s\S]*?)<\/small>/gi, 'small');

  // 9. Parser linha a linha de blocos (títulos, listas, citações, hr, parágrafos)
  const lines = text.split('\n');
  const htmlBlocks: string[] = [];
  type ListType = 'ul' | 'ol';
  const listStack: ListType[] = [];
  let paraBuffer: string[] = [];
  let blockquoteBuffer: string[] = [];

  const formatInline = (line: string): string => {
    let out = escapeHtmlText(line);

    inlineTagTokens.forEach((t) => {
      out = out.replaceAll(t.key, t.html);
    });

    // Código inline `...`
    out = out.replace(/`([^`\n]+)`/g, (_, code) => `<code>${code}</code>`);

    // Riscado ~~...~~
    out = out.replace(/~~(.*?)~~/g, '<s>$1</s>');

    // Negrito + Itálico, Negrito, Itálico
    out = out.replace(/'''''(.*?)'''''/g, '<strong><em>$1</em></strong>');
    out = out.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
    out = out.replace(/''(.*?)''/g, '<em>$1</em>');

    // Links internos [[Destino]] ou [[Destino|Texto]]
    out = out.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
      const cleanTarget = String(target).trim();
      const displayLabel = String(label || cleanTarget).trim();
      const slug = cleanTarget.replace(/\s+/g, '_');
      return `<a href="#wiki/${encodeURIComponent(slug)}" data-mw-link="${escapeHtmlAttr(cleanTarget)}" class="wiki-rich-wikilink text-[#0645ad] dark:text-[#6ba4ff] underline font-medium">${displayLabel}</a>`;
    });

    // Links externos [https://... Texto]
    out = out.replace(/\[((?:https?:\/\/|mailto:)[^\s\]]+)(?:\s+([^\]]+))?\]/gi, (_, url, label) => {
      const displayLabel = String(label || url).trim();
      return `<a href="${escapeHtmlAttr(url)}" data-mw-ext="${escapeHtmlAttr(url)}" class="text-[#3366cc] dark:text-[#729fcf] underline">${displayLabel}</a>`;
    });

    return out;
  };

  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    const joined = paraBuffer.join('<br />').trim();
    if (joined) {
      const trimmedOnlyTokens = paraBuffer.every((l) => /^@@MWATOMIC_\d+@@$/.test(l.trim()));
      const allBlocks =
        trimmedOnlyTokens &&
        paraBuffer.every((l) => {
          const match = l.trim().match(/^@@MWATOMIC_(\d+)@@$/);
          return match ? tokens[Number(match[1])]?.isBlock : false;
        });
      if (allBlocks) {
        htmlBlocks.push(paraBuffer.map((l) => formatInline(l)).join(''));
      } else {
        htmlBlocks.push(`<p>${formatInline(paraBuffer.join('\n')).replace(/\n/g, '<br />')}</p>`);
      }
    }
    paraBuffer = [];
  };

  const flushBlockquote = () => {
    if (blockquoteBuffer.length === 0) return;
    htmlBlocks.push(
      `<blockquote>${blockquoteBuffer.map((l) => formatInline(l)).join('<br />')}</blockquote>`
    );
    blockquoteBuffer = [];
  };

  const closeListsToDepth = (targetDepth: number) => {
    while (listStack.length > targetDepth) {
      const popped = listStack.pop();
      htmlBlocks.push(popped === 'ol' ? '</ol>' : '</ul>');
    }
  };

  const ensureListDepth = (type: ListType, depth: number) => {
    const safeDepth = Math.max(1, Math.min(4, depth));
    if (listStack.length > safeDepth) {
      closeListsToDepth(safeDepth);
    }
    if (listStack.length === safeDepth && listStack[safeDepth - 1] !== type) {
      closeListsToDepth(safeDepth - 1);
    }
    while (listStack.length < safeDepth) {
      htmlBlocks.push(type === 'ol' ? '<ol>' : '<ul>');
      listStack.push(type);
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushPara();
      flushBlockquote();
      closeListsToDepth(0);
      continue;
    }

    // Token atômico isolado em uma linha
    const soloAtomic = trimmed.match(/^@@MWATOMIC_(\d+)@@$/);
    if (soloAtomic && tokens[Number(soloAtomic[1])]?.isBlock) {
      flushPara();
      flushBlockquote();
      closeListsToDepth(0);
      htmlBlocks.push(trimmed);
      continue;
    }

    // Linha horizontal
    if (/^(?:----|---|\*\*\*|_____)$/.test(trimmed)) {
      flushPara();
      flushBlockquote();
      closeListsToDepth(0);
      htmlBlocks.push('<hr />');
      continue;
    }

    // Cabeçalhos MediaWiki (= H1 = .. ====== H6 ======) ou Markdown (# .. ######)
    const wikiHeading = trimmed.match(/^(={1,6})\s*(.*?)\s*\1$/);
    const mdHeading = !wikiHeading ? trimmed.match(/^(#{2,6})\s+(.*)$/) : null;
    if (wikiHeading || mdHeading) {
      flushPara();
      flushBlockquote();
      closeListsToDepth(0);
      const lvl = wikiHeading ? wikiHeading[1].length : mdHeading![1].length;
      const headingInner = wikiHeading ? wikiHeading[2] : mdHeading![2];
      htmlBlocks.push(`<h${lvl}>${formatInline(headingInner)}</h${lvl}>`);
      continue;
    }

    // Citações em bloco (> texto)
    if (/^>\s?/.test(trimmed)) {
      flushPara();
      closeListsToDepth(0);
      blockquoteBuffer.push(trimmed.replace(/^>\s?/, ''));
      continue;
    } else {
      flushBlockquote();
    }

    // Lista não ordenada (* item)
    const ulMatch = rawLine.match(/^(\*+)\s+(.*)$/);
    if (ulMatch) {
      flushPara();
      ensureListDepth('ul', ulMatch[1].length);
      htmlBlocks.push(`<li>${formatInline(ulMatch[2])}</li>`);
      continue;
    }

    // Lista ordenada (# item ou 1. item)
    const olMatch = rawLine.match(/^(#+)\s+(.*)$/);
    const numOlMatch = !olMatch ? rawLine.match(/^\d+\.\s+(.*)$/) : null;
    if (olMatch || numOlMatch) {
      flushPara();
      const depth = olMatch ? olMatch[1].length : 1;
      const itemText = olMatch ? olMatch[2] : numOlMatch![1];
      ensureListDepth('ol', depth);
      htmlBlocks.push(`<li>${formatInline(itemText)}</li>`);
      continue;
    }

    closeListsToDepth(0);
    paraBuffer.push(rawLine);
  }

  flushPara();
  flushBlockquote();
  closeListsToDepth(0);

  let html = htmlBlocks.join('\n');

  // 10. Restaura todos os widgets atômicos sem perda
  tokens.forEach((tok) => {
    html = html.replaceAll(tok.placeholder, tok.html);
  });

  return html || '<p><br /></p>';
}

/**
 * Serializa o DOM editável (ou uma string HTML) de volta para Wikitexto MediaWiki limpo,
 * preservando widgets atômicos (data-mw-raw / data-wikitext), estilos inline (inclusive de colagem Word/Docs),
 * listas aninhadas, links internos/externos e tabelas.
 */
export function formattedHtmlToWikitext(input: HTMLElement | string): string {
  let root: HTMLElement;

  if (typeof input === 'string') {
    if (!input.trim()) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
    const first = doc.body.firstElementChild as HTMLElement | null;
    if (!first) return '';
    root = first;
  } else {
    root = input;
  }

  const serializeInlineChildren = (node: Node): string => {
    let out = '';
    node.childNodes.forEach((child) => {
      out += serializeNode(child, true);
    });
    return out;
  };

  const serializeList = (listEl: HTMLElement, ordered: boolean, depth: number): string => {
    const markerChar = ordered ? '#' : '*';
    const prefix = markerChar.repeat(Math.max(1, depth));
    const lines: string[] = [];

    Array.from(listEl.children).forEach((child) => {
      if (child.tagName.toUpperCase() !== 'LI') return;
      const li = child as HTMLElement;

      let inlineParts = '';
      const nestedBlocks: string[] = [];

      li.childNodes.forEach((liChild) => {
        if (liChild.nodeType === Node.ELEMENT_NODE) {
          const childEl = liChild as HTMLElement;
          const cTag = childEl.tagName.toUpperCase();
          if (cTag === 'UL') {
            nestedBlocks.push(serializeList(childEl, false, depth + 1).trimEnd());
            return;
          }
          if (cTag === 'OL') {
            nestedBlocks.push(serializeList(childEl, true, depth + 1).trimEnd());
            return;
          }
        }
        inlineParts += serializeNode(liChild, true);
      });

      const cleanedItem = inlineParts.replace(/\n+/g, ' ').trim();
      if (cleanedItem) {
        lines.push(`${prefix} ${cleanedItem}`);
      }
      nestedBlocks.forEach((nb) => {
        if (nb) lines.push(nb);
      });
    });

    return lines.length > 0 ? lines.join('\n') + (depth === 1 ? '\n\n' : '') : '';
  };

  const serializeTable = (tableEl: HTMLElement): string => {
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    let mwTable = '{| class="wikitable"\n';
    const caption = tableEl.querySelector('caption');
    if (caption && caption.textContent?.trim()) {
      mwTable += `|+ ${caption.textContent.trim()}\n`;
    }

    rows.forEach((row) => {
      mwTable += '|-\n';
      const cells = Array.from(row.children).filter((c) => {
        const t = c.tagName.toUpperCase();
        return t === 'TH' || t === 'TD';
      });
      cells.forEach((cell) => {
        const isHeader = cell.tagName.toUpperCase() === 'TH';
        const prefix = isHeader ? '! ' : '| ';
        const cellContent = serializeInlineChildren(cell).replace(/\n+/g, ' ').trim();
        mwTable += `${prefix}${cellContent}\n`;
      });
    });

    mwTable += '|}\n\n';
    return mwTable;
  };

  const wrapCssSpanFormatting = (el: HTMLElement, content: string): string => {
    if (!content) return '';
    let result = content;
    const styleAttr = (el.getAttribute('style') || '').toLowerCase();
    const fontWeightMatch = styleAttr.match(/font-weight\s*:\s*([^;]+)/i);
    const fontStyleMatch = styleAttr.match(/font-style\s*:\s*([^;]+)/i);
    const textDecoMatch = styleAttr.match(/text-decoration(?:-line)?\s*:\s*([^;]+)/i);

    const isBold =
      fontWeightMatch &&
      (/bold|bolder/i.test(fontWeightMatch[1]) || parseInt(fontWeightMatch[1], 10) >= 600);
    const isItalic = fontStyleMatch && /italic|oblique/i.test(fontStyleMatch[1]);
    const isUnderline = textDecoMatch && /underline/i.test(textDecoMatch[1]);
    const isStrike = textDecoMatch && /line-through/i.test(textDecoMatch[1]);

    if (isUnderline && !/^\s*<u>/.test(result)) result = `<u>${result}</u>`;
    if (isStrike && !/^\s*(?:<s>|~~)/.test(result)) result = `<s>${result}</s>`;
    if (isBold && isItalic) result = `'''''${result}'''''`;
    else if (isBold) result = `'''${result}'''`;
    else if (isItalic) result = `''${result}''`;

    return result;
  };

  const serializeNode = (node: Node, inlineContext = false): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\u00a0/g, ' ');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;

    // 1. Elemento MediaWiki atômico sem perda (data-mw-raw)
    const rawEncoded = el.getAttribute('data-mw-raw');
    if (rawEncoded !== null) {
      const raw = decodeURIComponent(rawEncoded);
      const isBlock = el.classList.contains('mw-atomic-block') || el.tagName.toUpperCase() === 'DIV';
      return isBlock && !inlineContext ? `${raw}\n\n` : raw;
    }

    // 1b. Elemento legado com data-wikitext
    const legacyWikitext = el.getAttribute('data-wikitext');
    if (legacyWikitext) {
      return inlineContext ? legacyWikitext : `\n${legacyWikitext}\n\n`;
    }

    const tag = el.tagName.toUpperCase();

    if (tag === 'BR') {
      return '\n';
    }

    // Ignorar links âncora automáticos (#) de cabeçalhos renderizados
    if (tag === 'A' && el.getAttribute('title')?.includes('seção')) {
      return '';
    }

    // Títulos com atributo data-header-title (evita capturar numeração automática)
    if (/^H[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      const eq = '='.repeat(level);
      const explicitTitle = el.getAttribute('data-header-title');
      const txt = (explicitTitle !== null ? explicitTitle : serializeInlineChildren(el))
        .replace(/\n+/g, ' ')
        .trim();
      return txt ? `${eq} ${txt} ${eq}\n\n` : '';
    }

    if (tag === 'HR') {
      return '----\n\n';
    }

    if (tag === 'B' || tag === 'STRONG') {
      if (
        el.childNodes.length === 1 &&
        el.firstElementChild &&
        ['I', 'EM'].includes(el.firstElementChild.tagName.toUpperCase())
      ) {
        const inner = serializeInlineChildren(el.firstElementChild);
        return inner ? `'''''${inner}'''''` : '';
      }
      const inner = serializeInlineChildren(el);
      return inner ? `'''${inner}'''` : '';
    }

    if (tag === 'I' || tag === 'EM') {
      if (
        el.childNodes.length === 1 &&
        el.firstElementChild &&
        ['B', 'STRONG'].includes(el.firstElementChild.tagName.toUpperCase())
      ) {
        const inner = serializeInlineChildren(el.firstElementChild);
        return inner ? `'''''${inner}'''''` : '';
      }
      const inner = serializeInlineChildren(el);
      return inner ? `''${inner}''` : '';
    }

    if (tag === 'U') {
      const inner = serializeInlineChildren(el);
      return inner ? `<u>${inner}</u>` : '';
    }

    if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') {
      const inner = serializeInlineChildren(el);
      return inner ? `<s>${inner}</s>` : '';
    }

    if (tag === 'SMALL') {
      const inner = serializeInlineChildren(el);
      return inner ? `<small>${inner}</small>` : '';
    }

    if (tag === 'SUB') {
      const inner = serializeInlineChildren(el);
      return inner ? `<sub>${inner}</sub>` : '';
    }

    if (tag === 'SUP') {
      const inner = serializeInlineChildren(el);
      return inner ? `<sup>${inner}</sup>` : '';
    }

    if (tag === 'CODE') {
      const inner = serializeInlineChildren(el);
      return inner ? `\`${inner}\`` : '';
    }

    if (tag === 'PRE') {
      const codeEl = el.querySelector('code');
      const codeText = (codeEl ? codeEl.textContent : el.textContent) || '';
      const lang = el.getAttribute('data-lang') || '';
      return `<pre${lang ? ` lang="${lang}"` : ''}>\n${codeText.replace(/\n+$/, '')}\n</pre>\n\n`;
    }

    if (tag === 'A') {
      const mwTarget =
        el.getAttribute('data-mw-link') || el.getAttribute('data-wiki-target');
      const label = serializeInlineChildren(el).replace(/\n+/g, ' ').trim();
      if (mwTarget) {
        const cleanTarget = mwTarget.trim();
        return cleanTarget === label || cleanTarget.replace(/_/g, ' ') === label
          ? `[[${cleanTarget}]]`
          : `[[${cleanTarget}|${label || cleanTarget}]]`;
      }
      const extUrl = el.getAttribute('data-mw-ext') || el.getAttribute('href') || '';
      if (extUrl && extUrl.startsWith('#wiki/')) {
        const decoded = decodeURIComponent(extUrl.slice('#wiki/'.length));
        return decoded === label || decoded.replace(/_/g, ' ') === label
          ? `[[${decoded}]]`
          : `[[${decoded}|${label || decoded}]]`;
      }
      if (extUrl && /^(https?:\/\/|mailto:)/i.test(extUrl)) {
        return label && label !== extUrl ? `[${extUrl} ${label}]` : `[${extUrl}]`;
      }
      return label;
    }

    if (tag === 'UL') {
      return serializeList(el, false, 1);
    }

    if (tag === 'OL') {
      return serializeList(el, true, 1);
    }

    if (tag === 'TABLE') {
      return serializeTable(el);
    }

    if (tag === 'BLOCKQUOTE') {
      const inner = serializeInlineChildren(el).trim();
      if (!inner) return '';
      const lines = inner
        .split('\n')
        .map((l) => `> ${l.trim()}`)
        .join('\n');
      return `${lines}\n\n`;
    }

    if (tag === 'SPAN' || tag === 'FONT') {
      const inner = serializeInlineChildren(el);
      return wrapCssSpanFormatting(el, inner);
    }

    if (tag === 'P' || tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE') {
      const hasBlockChildren = Array.from(el.children).some((c) =>
        [
          'P',
          'DIV',
          'H1',
          'H2',
          'H3',
          'H4',
          'H5',
          'H6',
          'UL',
          'OL',
          'BLOCKQUOTE',
          'PRE',
          'TABLE',
          'HR',
        ].includes(c.tagName.toUpperCase())
      );

      if (hasBlockChildren) {
        let blockOut = '';
        el.childNodes.forEach((c) => {
          blockOut += serializeNode(c, false);
        });
        return blockOut;
      }

      const inner = serializeInlineChildren(el).replace(/\n+$/, '');
      if (!inner.trim()) return '\n';
      return `${inner}\n\n`;
    }

    return serializeInlineChildren(el);
  };

  let rawResult = '';
  root.childNodes.forEach((child) => {
    rawResult += serializeNode(child, false);
  });

  return rawResult.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Normaliza HTML rico colado da área de transferência (Google Docs, Word, Wikipédia, Web)
 * removendo scripts/estilos perigosos/lixo de formatação e convertendo estilos CSS inline
 * (font-weight, font-style, text-decoration) em tags semânticas compatíveis com o editor.
 */
export function normalizePastedHtmlForWikiEditor(rawHtml: string): NormalizedPastedContent {
  if (!rawHtml || !rawHtml.trim()) {
    return { cleanHtml: '', wikitext: '', hasRichFormatting: false };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Remove elementos perigosos ou ruidosos (incluindo botões [editar] da Wikipédia)
  doc
    .querySelectorAll(
      'script, style, iframe, object, embed, meta, link, title, noscript, svg, button, input, textarea, select, .mw-editsection'
    )
    .forEach((el) => el.remove());

  // Converte spans estilizados (Word/Docs/Web) em tags semânticas e limpa atributos
  const allElements = Array.from(doc.body.querySelectorAll('*'));
  let detectedFormatting = false;

  allElements.forEach((node) => {
    const tag = node.tagName.toUpperCase();
    const style = (node.getAttribute('style') || '').toLowerCase();

    if (/^H[1-6]$|^STRONG$|^B$|^EM$|^I$|^U$|^S$|^DEL$|^UL$|^OL$|^LI$|^TABLE$|^BLOCKQUOTE$|^A$|^CODE$|^PRE$/.test(tag)) {
      detectedFormatting = true;
    }

    if (tag === 'SPAN' || tag === 'FONT' || tag === 'P') {
      const fontWeightMatch = style.match(/font-weight\s*:\s*([^;]+)/i);
      const fontStyleMatch = style.match(/font-style\s*:\s*([^;]+)/i);
      const textDecoMatch = style.match(/text-decoration(?:-line)?\s*:\s*([^;]+)/i);

      const isBold =
        fontWeightMatch &&
        (/bold|bolder/i.test(fontWeightMatch[1]) || parseInt(fontWeightMatch[1], 10) >= 600);
      const isItalic = fontStyleMatch && /italic|oblique/i.test(fontStyleMatch[1]);
      const isUnderline = textDecoMatch && /underline/i.test(textDecoMatch[1]);
      const isStrike = textDecoMatch && /line-through/i.test(textDecoMatch[1]);

      if (tag === 'SPAN' && (isBold || isItalic || isUnderline || isStrike)) {
        detectedFormatting = true;
        let innerHtml = node.innerHTML;
        if (isUnderline) innerHtml = `<u>${innerHtml}</u>`;
        if (isStrike) innerHtml = `<s>${innerHtml}</s>`;
        if (isItalic) innerHtml = `<em>${innerHtml}</em>`;
        if (isBold) innerHtml = `<strong>${innerHtml}</strong>`;
        const wrapper = doc.createElement('span');
        wrapper.innerHTML = innerHtml;
        node.replaceWith(...Array.from(wrapper.childNodes));
        return;
      }
    }

    // Normaliza links colados da Wikipédia (/wiki/Nome_do_Artigo)
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^\/wiki\/([^#?]+)/i.test(href)) {
        const match = href.match(/^\/wiki\/([^#?]+)/i);
        if (match && !match[1].includes(':')) {
          const decodedTarget = decodeURIComponent(match[1]).replace(/_/g, ' ');
          node.setAttribute('data-mw-link', decodedTarget);
          node.setAttribute('href', `#wiki/${encodeURIComponent(decodedTarget)}`);
          node.setAttribute('class', 'wiki-rich-wikilink text-[#0645ad] dark:text-[#6ba4ff] underline font-medium');
        }
      } else if (/^(?:https?:\/\/|mailto:)/i.test(href)) {
        node.setAttribute('data-mw-ext', href);
        node.setAttribute('class', 'text-[#3366cc] dark:text-[#729fcf] underline');
      } else {
        node.removeAttribute('href');
      }
    }

    // Remove event handlers, style inline e classes estranhas
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name === 'style' || name === 'id') {
        node.removeAttribute(attr.name);
      }
    });
  });

  // Desembrulha <span> vazios de atributos que sobraram (ex: Google Docs wrappers)
  doc.body.querySelectorAll('span').forEach((span) => {
    if (span.attributes.length === 0) {
      const frag = doc.createDocumentFragment();
      while (span.firstChild) {
        frag.appendChild(span.firstChild);
      }
      span.replaceWith(frag);
    }
  });

  const cleanHtml = sanitizeHtml(doc.body.innerHTML).trim();
  const wikitext = formattedHtmlToWikitext(doc.body);

  return {
    cleanHtml,
    wikitext,
    hasRichFormatting: detectedFormatting || /'''|''|^={1,6}\s|^\*\s|^#\s|\{\|/m.test(wikitext),
  };
}

/**
 * Verifica se uma string de texto puro já contém sintaxe MediaWiki explícita.
 */
export function looksLikeWikitext(text: string): boolean {
  if (!text) return false;
  return (
    /\{\{[\s\S]*?\}\}/.test(text) ||
    /\{\s*\|[\s\S]*?\|\}/.test(text) ||
    /^={1,6}\s+.*?={1,6}\s*$/m.test(text) ||
    /'''[\s\S]*?'''/.test(text) ||
    /''[\s\S]*?''/.test(text) ||
    /\[\[[\s\S]*?\]\]/.test(text) ||
    /<ref(?:\s+[^>]*)?>[\s\S]*?<\/ref>|<ref\s+name=/i.test(text) ||
    /^[\*\#\>]\s+/m.test(text)
  );
}
