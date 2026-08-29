export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface ParseResult {
  html: string;
  toc: TocItem[];
  references: string[];
  categories: string[];
}

export function parseWikitext(
  wikitext: string,
  onWikiLinkClick?: (target: string) => void
): ParseResult {
  if (!wikitext) {
    return {
      html: '<p class="text-slate-400 italic">Sem conteúdo disponível.</p>',
      toc: [],
      references: [],
      categories: [],
    };
  }

  const toc: TocItem[] = [];
  const references: string[] = [];
  const categories: string[] = [];
  let headerIndex = 0;

  let processed = wikitext;

  // 1. Extract Categories: [[Categoria:Nome]] or [[Category:Name]]
  processed = processed.replace(/\[\[(?:Categoria|Category):(.*?)\]\]/gi, (_m, cat) => {
    const cleanCat = cat.trim();
    if (cleanCat && !categories.includes(cleanCat)) {
      categories.push(cleanCat);
    }
    return ''; // Remove category marker from body text
  });

  // 2. Extract Footnotes / References: <ref>Citation text</ref>
  processed = processed.replace(/<ref(?:\s+name="([^"]*)")?>([\s\S]*?)<\/ref>/gi, (_m, _name, refContent) => {
    const cleanContent = refContent.trim();
    references.push(cleanContent);
    const refIndex = references.length;
    const cleanTitle = cleanContent.replace(/<[^>]*>/g, '').replace(/"/g, '&quot;');
    return `<sup class="wiki-footnote inline-block ml-0.5"><a href="#cite_note-${refIndex}" id="cite_ref-${refIndex}" title="${cleanTitle}" data-ref-tooltip="${cleanTitle}" class="text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold hover:underline bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800"> [${refIndex}] </a></sup>`;
  });

  // 3. Process Callout Notices & Templates:
  // {{Aviso|texto}} or {{Alerta|texto}}
  processed = processed.replace(/\{\{(?:Aviso|Alerta)\|([\s\S]*?)\}\}/gi, (_m, text) => {
    return `
      <div class="my-3 p-3.5 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs not-prose">
        <span class="text-amber-600 dark:text-amber-400 text-base font-bold flex-shrink-0">⚠️</span>
        <div class="flex-1 leading-relaxed"><strong>Aviso Editorial:</strong> ${formatInline(text.trim())}</div>
      </div>
    `;
  });

  // {{Nota|texto}} or {{Info|texto}}
  processed = processed.replace(/\{\{(?:Nota|Info)\|([\s\S]*?)\}\}/gi, (_m, text) => {
    return `
      <div class="my-3 p-3.5 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5 shadow-xs not-prose">
        <span class="text-blue-600 dark:text-blue-400 text-base font-bold flex-shrink-0">ℹ️</span>
        <div class="flex-1 leading-relaxed"><strong>Nota:</strong> ${formatInline(text.trim())}</div>
      </div>
    `;
  });

  // {{Esboço}} or {{Stub}}
  processed = processed.replace(/\{\{(?:Esboço|Stub)(?:\|(.*?))?\}\}/gi, (_m, topic) => {
    const topicText = topic ? ` sobre ${topic.trim()}` : '';
    return `
      <div class="my-3 p-3 rounded-lg border border-dashed border-cyan-400 dark:border-cyan-700 bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 text-xs flex items-center gap-2.5 shadow-xs not-prose">
        <span class="text-cyan-600 dark:text-cyan-400 text-lg flex-shrink-0">🧩</span>
        <div class="flex-1 leading-relaxed">
          <strong>Artigo em Esboço:</strong> Este artigo${topicText} é um esboço. Você pode colaborar <a href="#wiki-editor" class="underline font-bold text-cyan-700 dark:text-cyan-300">expandindo-o</a> para a WikiZero.
        </div>
      </div>
    `;
  });

  // {{Destaque|texto}}
  processed = processed.replace(/\{\{Destaque\|([\s\S]*?)\}\}/gi, (_m, text) => {
    return `
      <div class="my-3 p-3.5 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5 shadow-xs not-prose">
        <span class="text-emerald-600 dark:text-emerald-400 text-base font-bold flex-shrink-0">✨</span>
        <div class="flex-1 leading-relaxed"><strong>Destaque Enciclopédico:</strong> ${formatInline(text.trim())}</div>
      </div>
    `;
  });

  // {{Citação|texto|autor}}
  processed = processed.replace(/\{\{Cita[çc][ãa]o\|([\s\S]*?)(?:\|([\s\S]*?))?\}\}/gi, (_m, quote, author) => {
    const authorHtml = author ? `<cite class="block text-right mt-1 font-semibold not-italic text-slate-500 dark:text-slate-400 text-[11px]">— ${escapeHtml(author.trim())}</cite>` : '';
    return `
      <blockquote class="my-4 border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-r-lg italic text-slate-800 dark:text-slate-200 text-xs shadow-xs not-prose">
        <p class="mb-1 leading-relaxed">“${formatInline(quote.trim())}”</p>
        ${authorHtml}
      </blockquote>
    `;
  });

  // 4. Wikidot & Fandom Collapsible Blocks:
  // [[collapsible show="Abrir" hide="Fechar"]] ... [[/collapsible]]
  processed = processed.replace(/\[\[collapsible(?:\s+show="([^"]*)")?(?:\s+hide="([^"]*)")?\]\]([\s\S]*?)\[\[\/collapsible\]\]/gi, (_m, showText, _hideText, content) => {
    const title = showText || 'Exibir conteúdo recolhido';
    return `
      <details class="wiki-collapsible my-3 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden not-prose group bg-white dark:bg-slate-900">
        <summary class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 cursor-pointer font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition select-none">
          <span>${escapeHtml(title)}</span>
          <span class="text-[10px] text-slate-400 font-mono group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-3 text-xs border-t border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
          ${formatInline(content.trim())}
        </div>
      </details>
    `;
  });

  // {{collapsible title="..."}} ... {{/collapsible}}
  processed = processed.replace(/\{\{collapsible(?:\s+title="([^"]*)")?\}\}([\s\S]*?)\{\{\/collapsible\}\}/gi, (_m, title, content) => {
    const label = title || 'Detalhes adicionais';
    return `
      <details class="wiki-collapsible my-3 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden not-prose group bg-white dark:bg-slate-900">
        <summary class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 cursor-pointer font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition select-none">
          <span>${escapeHtml(label)}</span>
          <span class="text-[10px] text-slate-400 font-mono group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div class="p-3 text-xs border-t border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
          ${formatInline(content.trim())}
        </div>
      </details>
    `;
  });

  // 5. Process Infoboxes: {{Infobox ...}}
  processed = processed.replace(/\{\{Infobox([\s\S]*?)\}\}/gi, (_match, content) => {
    const lines = content.split('\n');
    let infoboxTitle = 'Informações';
    let infoboxImage = '';
    const rows: { label: string; value: string }[] = [];

    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        const parts = trimmed.substring(1).split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim();
          if (key.toLowerCase() === 'nome' || key.toLowerCase() === 'title') {
            infoboxTitle = val;
          } else if (key.toLowerCase() === 'imagem' || key.toLowerCase() === 'image') {
            infoboxImage = val;
          } else {
            rows.push({ label: key, value: val });
          }
        }
      }
    });

    const imageHtml = infoboxImage ? `
      <div class="p-2 text-center bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700">
        <img src="${escapeHtml(infoboxImage)}" alt="${escapeHtml(infoboxTitle)}" class="max-h-40 mx-auto rounded object-cover shadow-xs" />
      </div>
    ` : '';

    const rowsHtml = rows
      .map(
        (r) => `
        <tr class="border-b border-slate-200 dark:border-slate-700/60">
          <th class="text-left font-semibold text-slate-700 dark:text-slate-300 py-1.5 px-2 bg-slate-100 dark:bg-slate-800/80 w-1/3">${escapeHtml(
            r.label
          )}</th>
          <td class="text-slate-600 dark:text-slate-300 py-1.5 px-2">${formatInline(r.value)}</td>
        </tr>`
      )
      .join('');

    return `
      <div class="wiki-infobox not-prose mb-4 float-none sm:float-right sm:ml-6 sm:w-72 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white font-bold text-center py-2 px-3 text-xs tracking-wide">
          ${escapeHtml(infoboxTitle)}
        </div>
        ${imageHtml}
        <table class="w-full text-xs border-collapse">
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  });

  const lines = processed.split('\n');
  const processedLines: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        processedLines.push(
          `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-sm overflow-x-auto my-4 border border-slate-800"><code>${escapeHtml(
            codeBlockContent.join('\n')
          )}</code></pre>`
        );
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // MediaWiki Table start
    if (trimmed.startsWith('{|')) {
      inTable = true;
      tableRows = [];
      continue;
    }
    if (inTable && trimmed.startsWith('|}')) {
      inTable = false;
      const tableHtml = renderMediaWikiTable(tableRows);
      processedLines.push(tableHtml);
      tableRows = [];
      continue;
    }
    if (inTable) {
      tableRows.push(line);
      continue;
    }

    // Reference List: <references /> or {{reflist}}
    if (trimmed === '<references />' || trimmed === '{{reflist}}' || trimmed === '{{Reflist}}') {
      processedLines.push(renderReferencesSection(references));
      continue;
    }

    // Close lists if line is not a list
    const isUl = trimmed.startsWith('* ') || trimmed.startsWith('- ');
    const isOl = /^\d+\.\s+/.test(trimmed) || trimmed.startsWith('# ');

    if (!isUl && inUl) {
      processedLines.push('</ul>');
      inUl = false;
    }
    if (!isOl && inOl) {
      processedLines.push('</ol>');
      inOl = false;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '----') {
      processedLines.push('<hr class="my-6 border-slate-200 dark:border-slate-800" />');
      continue;
    }

    // Headers (= H1 =, == H2 ==, === H3 ===, ==== H4 ====)
    const h4Match = line.match(/^====\s*(.*?)\s*====$/);
    const h3Match = line.match(/^===\s*(.*?)\s*===$/);
    const h2Match = line.match(/^==\s*(.*?)\s*==$/);
    const h1Match = line.match(/^=\s*(.*?)\s*=$/);

    // Markdown headers (# H1, ## H2, ### H3)
    const mdH3Match = line.match(/^###\s*(.*)$/);
    const mdH2Match = line.match(/^##\s*(.*)$/);
    const mdH1Match = line.match(/^#\s*(.*)$/);

    if (h1Match || mdH1Match) {
      const text = (h1Match ? h1Match[1] : mdH1Match![1]).trim();
      const id = `section-${++headerIndex}-${slugify(text)}`;
      toc.push({ id, text, level: 1 });
      processedLines.push(`<h1 id="${id}" class="text-2xl sm:text-3xl font-bold font-serif-heading my-4 text-slate-900 dark:text-slate-100">${formatInline(text)}</h1>`);
      continue;
    }

    if (h2Match || mdH2Match) {
      const text = (h2Match ? h2Match[1] : mdH2Match![1]).trim();
      const id = `section-${++headerIndex}-${slugify(text)}`;
      toc.push({ id, text, level: 2 });
      processedLines.push(`<h2 id="${id}" class="text-xl sm:text-2xl font-semibold font-serif-heading mt-6 mb-3 pb-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-between group">
        <span>${formatInline(text)}</span>
        <a href="#${id}" class="text-slate-300 dark:text-slate-600 hover:text-blue-500 text-sm opacity-0 group-hover:opacity-100 transition">#</a>
      </h2>`);
      continue;
    }

    if (h3Match || mdH3Match) {
      const text = (h3Match ? h3Match[1] : mdH3Match![1]).trim();
      const id = `section-${++headerIndex}-${slugify(text)}`;
      toc.push({ id, text, level: 3 });
      processedLines.push(`<h3 id="${id}" class="text-lg sm:text-xl font-semibold font-serif-heading mt-4 mb-2 text-slate-800 dark:text-slate-200">${formatInline(text)}</h3>`);
      continue;
    }

    if (h4Match) {
      const text = h4Match[1].trim();
      const id = `section-${++headerIndex}-${slugify(text)}`;
      toc.push({ id, text, level: 4 });
      processedLines.push(`<h4 id="${id}" class="text-base font-medium mt-3 mb-1 text-slate-700 dark:text-slate-300">${formatInline(text)}</h4>`);
      continue;
    }

    // Lists
    if (isUl) {
      if (!inUl) {
        processedLines.push('<ul class="list-disc list-inside space-y-1.5 my-3 text-slate-700 dark:text-slate-300">');
        inUl = true;
      }
      const itemText = trimmed.replace(/^[\*\-]\s+/, '');
      processedLines.push(`<li>${formatInline(itemText)}</li>`);
      continue;
    }

    if (isOl) {
      if (!inOl) {
        processedLines.push('<ol class="list-decimal list-inside space-y-1.5 my-3 text-slate-700 dark:text-slate-300">');
        inOl = true;
      }
      const itemText = trimmed.replace(/^(\d+\.|\#)\s+/, '');
      processedLines.push(`<li>${formatInline(itemText)}</li>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      processedLines.push(`<blockquote class="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-slate-800/60 p-3.5 my-3 rounded-r-lg italic text-slate-700 dark:text-slate-300">${formatInline(quoteText)}</blockquote>`);
      continue;
    }

    // Empty lines
    if (trimmed === '') {
      processedLines.push('<div class="h-3"></div>');
      continue;
    }

    // Regular paragraphs
    processedLines.push(`<p class="my-2 leading-relaxed text-slate-800 dark:text-slate-200 font-wiki-body">${formatInline(line)}</p>`);
  }

  if (inUl) processedLines.push('</ul>');
  if (inOl) processedLines.push('</ol>');
  if (inCodeBlock) processedLines.push(`</code></pre>`);

  // Auto-append references section if references exist and weren't explicitly placed with <references />
  if (references.length > 0 && !processed.includes('<references />') && !processed.includes('{{reflist}}') && !processed.includes('{{Reflist}}')) {
    processedLines.push(renderReferencesSection(references));
  }

  return {
    html: processedLines.join('\n'),
    toc,
    references,
    categories,
  };
}

function renderReferencesSection(refs: string[]): string {
  if (refs.length === 0) return '';
  const items = refs
    .map(
      (ref, idx) => `
      <li id="cite_note-${idx + 1}" class="text-xs text-slate-600 dark:text-slate-400 leading-normal flex items-start gap-1.5">
        <a href="#cite_ref-${idx + 1}" class="text-blue-600 dark:text-blue-400 font-mono hover:underline flex-shrink-0" title="Voltar ao texto">^</a>
        <span>${formatInline(ref)}</span>
      </li>
    `
    )
    .join('');

  return `
    <div class="references-section not-prose mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
      <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono mb-2 flex items-center gap-1.5">
        <span>📚 Fontes e Referências</span>
      </h3>
      <ol class="space-y-1.5 list-none pl-1">
        ${items}
      </ol>
    </div>
  `;
}

export function formatInline(text: string): string {
  if (!text) return '';

  let res = escapeHtml(text);

  // Bold & Italic: '''''text'''''
  res = res.replace(/'''''(.*?)'''''/g, '<strong><em>$1</em></strong>');

  // Bold: '''text''' or **text**
  res = res.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic: ''text'' or *text* or _text_
  res = res.replace(/''(.*?)''/g, '<em>$1</em>');
  res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  res = res.replace(/~~(.*?)~~/g, '<del class="text-slate-400 dark:text-slate-500">$1</del>');

  // Inline code: `code`
  res = res.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-mono text-sm border border-slate-200 dark:border-slate-700">$1</code>');

  // Images: ![alt](url)
  res = res.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<div class="my-4 text-center"><img src="$2" alt="$1" class="max-w-full h-auto rounded-xl shadow-md mx-auto border border-slate-200 dark:border-slate-800" loading="lazy" /><p class="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">$1</p></div>'
  );

  // Internal wiki link: [[Destino|Texto visível]] or [[Destino]]
  res = res.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (_match, target, title) => {
    const cleanTarget = target.trim();
    // Check if it's category (skip rendering as inline link since extracted)
    if (cleanTarget.toLowerCase().startsWith('categoria:') || cleanTarget.toLowerCase().startsWith('category:')) {
      return '';
    }
    const label = title || cleanTarget;
    return `<a href="#wiki:${encodeURIComponent(cleanTarget)}" data-wiki-target="${escapeHtml(cleanTarget)}" class="wiki-link text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700">${escapeHtml(label)}</a>`;
  });

  // External link: [url title] or [url]
  res = res.replace(/\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/g, (_match, url, title) => {
    const label = title || url;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">${escapeHtml(label)} <span class="text-xs text-slate-400">↗</span></a>`;
  });

  return res;
}

function renderMediaWikiTable(lines: string[]): string {
  const rows: string[][] = [];
  let currentRow: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|-')) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      continue;
    }
    if (trimmed.startsWith('!')) {
      const headers = trimmed.substring(1).split('!!').map((h) => h.trim());
      headers.forEach((h) => currentRow.push(`<th class="bg-slate-100 dark:bg-slate-800 py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">${formatInline(h)}</th>`));
      continue;
    }
    if (trimmed.startsWith('|')) {
      const cells = trimmed.substring(1).split('||').map((c) => c.trim());
      cells.forEach((c) => currentRow.push(`<td class="py-2 px-3 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${formatInline(c)}</td>`));
    }
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  const tableBody = rows
    .map((r) => `<tr>${r.join('')}</tr>`)
    .join('');

  return `
    <div class="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <table class="wikitable w-full text-sm border-collapse">
        <tbody>${tableBody}</tbody>
      </table>
    </div>
  `;
}

export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
