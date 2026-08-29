/**
 * Bidirectional conversion between HTML (WYSIWYG/Formatted page) and Wikitext
 */

export function htmlToWikitext(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return '';

  function nodeToWikitext(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const childText = Array.from(el.childNodes)
      .map((child) => nodeToWikitext(child))
      .join('');

    switch (tagName) {
      case 'h1':
        return `\n= ${childText.trim()} =\n\n`;
      case 'h2':
        return `\n== ${childText.trim()} ==\n\n`;
      case 'h3':
        return `\n=== ${childText.trim()} ===\n\n`;
      case 'h4':
        return `\n==== ${childText.trim()} ====\n\n`;
      case 'b':
      case 'strong':
        return `'''${childText}'''`;
      case 'i':
      case 'em':
        return `''${childText}''`;
      case 's':
      case 'strike':
      case 'del':
        return `~~${childText}~~`;
      case 'code':
        return `\`${childText}\``;
      case 'pre':
        return `\n\`\`\`\n${childText}\n\`\`\`\n`;
      case 'blockquote':
        return `\n> ${childText.trim()}\n\n`;
      case 'ul': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => `* ${Array.from(li.childNodes).map(nodeToWikitext).join('').trim()}`)
          .join('\n');
        return `\n${items}\n\n`;
      }
      case 'ol': {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => `# ${Array.from(li.childNodes).map(nodeToWikitext).join('').trim()}`)
          .join('\n');
        return `\n${items}\n\n`;
      }
      case 'li':
        return `* ${childText}\n`;
      case 'p':
        return `\n${childText.trim()}\n\n`;
      case 'br':
        return '\n';
      case 'a': {
        const href = el.getAttribute('href') || '';
        const title = el.getAttribute('data-wiki-target') || href;
        if (title && !href.startsWith('http')) {
          return childText === title ? `[[${title}]]` : `[[${title}|${childText}]]`;
        }
        return `[${href} ${childText}]`;
      }
      case 'div':
        return `${childText}\n`;
      default:
        return childText;
    }
  }

  let result = nodeToWikitext(container);
  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n').trim();
  return result;
}
