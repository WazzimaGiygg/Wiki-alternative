/**
 * Bidirectional conversion between HTML (WYSIWYG/Formatted page) and Wikitext
 */
import { formattedHtmlToWikitext } from './wikitextFormattedBridge';

export function htmlToWikitext(html: string): string {
  if (!html || !html.trim()) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild as HTMLElement | null;
  if (!container) return '';

  // Legacy fallback for rendered .wiki-infobox elements without data-mw-raw or data-wikitext
  container.querySelectorAll('.wiki-infobox').forEach((infobox) => {
    if (infobox.closest('[data-mw-raw]') || infobox.hasAttribute('data-wikitext')) return;
    const heading =
      infobox.querySelector('.font-serif-heading')?.textContent?.trim() || 'Informações';
    const rows = Array.from(infobox.querySelectorAll('table tr'));
    let infoboxWikitext = `{{Infobox\n| Nome = ${heading}\n`;
    for (const r of rows) {
      const th = r.querySelector('th')?.textContent?.trim();
      const td = r.querySelector('td')?.textContent?.trim();
      if (th && td) {
        infoboxWikitext += `| ${th} = ${td}\n`;
      }
    }
    infoboxWikitext += '}}';
    infobox.setAttribute('data-mw-raw', encodeURIComponent(infoboxWikitext));
    infobox.classList.add('mw-atomic-block');
  });

  return formattedHtmlToWikitext(container);
}

