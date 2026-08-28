export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function parseWikitext(
  wikitext: string,
  onWikiLinkClick?: (target: string) => void
): { html: string; toc: TocItem[] } {
  if (!wikitext) {
    return { html: '<p class="text-slate-400 italic">Sem conteúdo disponível.</p>', toc: [] };
  }

  const toc: TocItem[] = [];
  let headerIndex = 0;

  // Pre-process infoboxes: {{Infobox ...}}
  let processed = wikitext;

  // Process infobox
  processed = processed.replace(/\{\{Infobox([\s\S]*?)\}\}/gi, (_match, content) => {
    const lines = content.split('\n');
    let infoboxTitle = 'Informações';
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
          } else {
            rows.push({ label: key, value: val });
          }
        }
      }
    });

    const rowsHtml = rows
      .map(
        (r) => `
        <tr class="border-b border-slate-200 dark:border-slate-700/60">
          <th class="text-left font-semibold text-slate-700 dark:text-slate-300 py-1.5 px-2 bg-slate-100 dark:bg-slate-800/80">${escapeHtml(
            r.label
          )}</th>
          <td class="text-slate-600 dark:text-slate-300 py-1.5 px-2">${escapeHtml(r.value)}</td>
        </tr>`
      )
      .join('');

    return `
      <div class="wiki-infobox not-prose mb-4">
        <div class="bg-blue-600 dark:bg-blue-700 text-white font-bold text-center py-2 px-3 rounded-t-md">
          ${escapeHtml(infoboxTitle)}
        </div>
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
      processedLines.push(`<h1 id="${id}" class="text-3xl font-bold font-serif-heading my-4 text-slate-900 dark:text-slate-100">${formatInline(text)}</h1>`);
      continue;
    }

    if (h2Match || mdH2Match) {
      const text = (h2Match ? h2Match[1] : mdH2Match![1]).trim();
      const id = `section-${++headerIndex}-${slugify(text)}`;
      toc.push({ id, text, level: 2 });
      processedLines.push(`<h2 id="${id}" class="text-2xl font-semibold font-serif-heading mt-6 mb-3 pb-1 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">${formatInline(text)}</h2>`);
      continue;
    }

    if (h3Match || mdH3Match) {
      const text = (h3Match ? h3Match[1] : mdH3Match![1]).trim();
      const id = `section-${++headerIndex}-${slugify(text)}`;
      toc.push({ id, text, level: 3 });
      processedLines.push(`<h3 id="${id}" class="text-xl font-semibold font-serif-heading mt-4 mb-2 text-slate-800 dark:text-slate-200">${formatInline(text)}</h3>`);
      continue;
    }

    if (h4Match) {
      const text = h4Match[1].trim();
      const id = `section-${++headerIndex}-${slugify(text)}`;
      toc.push({ id, text, level: 4 });
      processedLines.push(`<h4 id="${id}" class="text-lg font-medium mt-3 mb-1 text-slate-700 dark:text-slate-300">${formatInline(text)}</h4>`);
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

  return {
    html: processedLines.join('\n'),
    toc,
  };
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
    const label = title || target;
    return `<a href="#wiki:${encodeURIComponent(target.trim())}" data-wiki-target="${escapeHtml(target.trim())}" class="wiki-link text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline underline-offset-2 decoration-blue-300 dark:decoration-blue-700">${escapeHtml(label)}</a>`;
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
  let isHeaderRow = false;

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
      isHeaderRow = true;
      const headers = trimmed.substring(1).split('!!').map((h) => h.trim());
      headers.forEach((h) => currentRow.push(`<th>${formatInline(h)}</th>`));
      continue;
    }
    if (trimmed.startsWith('|')) {
      const cells = trimmed.substring(1).split('||').map((c) => c.trim());
      cells.forEach((c) => currentRow.push(`<td>${formatInline(c)}</td>`));
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
      <table class="wikitable w-full text-sm">
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
