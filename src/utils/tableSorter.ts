/**
 * Interactive Table Sorter for rendered Wikitext / MediaWiki tables.
 * Enables clicking (or pressing Enter/Space) on table headers (<th>) to sort
 * rows alphabetically (locale-aware pt-BR) or numerically, toggling asc/desc.
 */

const ptBrCollator = new Intl.Collator('pt-BR', {
  numeric: true,
  sensitivity: 'base',
});

/**
 * Attempts to parse a table cell's text into a finite number.
 * Supports plain numbers, percentages, currency prefixes (R$, $, €, £),
 * thousands separators, and pt-BR / en-US decimal separators.
 */
export function parseNumericCellValue(raw: string): number | null {
  const cleaned = raw
    .replace(/\u00A0/g, ' ')
    .trim()
    .replace(/^(?:R\$|US\$|\$|€|£|~|≈|>=|<=|>|<)\s*/i, '')
    .replace(/\s*%$/, '')
    .trim();

  if (!cleaned || cleaned === '-' || cleaned === '—' || cleaned === 'N/A') {
    return null;
  }

  // Only accept strings that look purely numeric (digits, sign, spaces, dots, commas)
  if (!/^[+-]?\d[\d\s.,]*$/.test(cleaned)) {
    return null;
  }

  const compact = cleaned.replace(/\s+/g, '');

  // Determine decimal vs thousands separator
  const hasComma = compact.includes(',');
  const hasDot = compact.includes('.');

  let normalized = compact;
  if (hasComma && hasDot) {
    // Whichever appears last is the decimal separator
    if (compact.lastIndexOf(',') > compact.lastIndexOf('.')) {
      normalized = compact.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = compact.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = compact.split(',');
    // Multiple commas or exactly 3 digits after single comma -> thousands separator
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].replace(/^[+-]/, '').length <= 3)) {
      normalized = compact.replace(/,/g, '');
    } else {
      normalized = compact.replace(',', '.');
    }
  } else if (hasDot) {
    const parts = compact.split('.');
    // Multiple dots (e.g. 1.234.567) -> thousands separators
    if (parts.length > 2) {
      normalized = compact.replace(/\./g, '');
    }
  }

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function getCellText(row: HTMLTableRowElement, colIndex: number): string {
  const cell = row.cells[colIndex];
  if (!cell) return '';
  return (cell.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Enhances all eligible wikitext tables inside `container` with click-to-sort headers.
 * Returns a cleanup function that removes all attached event listeners.
 */
export function attachSortableWikitables(container: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];

  const tables = Array.from(container.querySelectorAll('table')).filter((table) => {
    if (
      table.classList.contains('wiki-infobox') ||
      table.classList.contains('infobox') ||
      table.classList.contains('not-sortable') ||
      table.closest('.wiki-infobox, .infobox')
    ) {
      return false;
    }
    return true;
  });

  tables.forEach((table) => {
    const tbody = table.tBodies[0];
    if (!tbody) return;

    let headerRow: HTMLTableRowElement | null = null;
    let dataRows: HTMLTableRowElement[] = [];

    if (table.tHead && table.tHead.rows.length > 0) {
      headerRow = table.tHead.rows[table.tHead.rows.length - 1];
      dataRows = Array.from(tbody.rows);
    } else {
      const bodyRows = Array.from(tbody.rows);
      if (bodyRows.length < 3) return; // Need at least 1 header row + 2 data rows
      const firstRow = bodyRows[0];
      const firstRowCells = Array.from(firstRow.cells);
      const isHeaderRow =
        firstRowCells.length > 0 &&
        firstRowCells.every((cell) => cell.tagName === 'TH');
      if (!isHeaderRow) return;

      headerRow = firstRow;
      dataRows = bodyRows.slice(1);
    }

    if (!headerRow || dataRows.length < 2) return;

    // Preserve original order for stable tie-breaking
    dataRows.forEach((row, idx) => {
      if (!row.dataset.origIdx) {
        row.dataset.origIdx = String(idx);
      }
    });

    const headerCells = Array.from(headerRow.cells).filter(
      (cell): cell is HTMLTableCellElement => cell.tagName === 'TH'
    );

    if (headerCells.length === 0) return;

    table.classList.add('wiki-sortable-table');

    headerCells.forEach((th, colIndex) => {
      // Skip headers spanning multiple columns
      if (th.colSpan > 1) return;

      th.setAttribute('data-sortable-col', 'true');
      th.setAttribute('aria-sort', 'none');
      th.setAttribute('role', 'button');
      th.setAttribute('tabindex', '0');
      if (!th.getAttribute('title')) {
        th.setAttribute('title', 'Clique para ordenar esta coluna (A–Z / 0–9)');
      }

      const sortColumn = () => {
        const currentDir = th.getAttribute('data-sort-dir');
        const nextDir: 'asc' | 'desc' = currentDir === 'asc' ? 'desc' : 'asc';

        // Reset sibling headers
        headerCells.forEach((other) => {
          if (other !== th) {
            other.removeAttribute('data-sort-dir');
            other.setAttribute('aria-sort', 'none');
          }
        });

        th.setAttribute('data-sort-dir', nextDir);
        th.setAttribute('aria-sort', nextDir === 'asc' ? 'ascending' : 'descending');

        // Re-query current data rows from tbody
        const currentRows = table.tHead
          ? Array.from(tbody.rows)
          : Array.from(tbody.rows).filter((r) => r !== headerRow);

        // Detect whether this column is predominantly numeric
        let nonEmptyCount = 0;
        let numericCount = 0;
        const parsedValues = new Map<HTMLTableRowElement, { text: string; num: number | null }>();

        currentRows.forEach((row) => {
          const text = getCellText(row, colIndex);
          const num = parseNumericCellValue(text);
          if (text !== '') {
            nonEmptyCount++;
            if (num !== null) numericCount++;
          }
          parsedValues.set(row, { text, num });
        });

        const useNumericSort = nonEmptyCount > 0 && numericCount / nonEmptyCount >= 0.7;

        const sorted = [...currentRows].sort((rowA, rowB) => {
          const a = parsedValues.get(rowA)!;
          const b = parsedValues.get(rowB)!;

          // Keep empty cells at the bottom regardless of sort direction
          if (a.text === '' && b.text === '') return 0;
          if (a.text === '') return 1;
          if (b.text === '') return -1;

          let cmp = 0;
          if (useNumericSort) {
            if (a.num !== null && b.num !== null) {
              cmp = a.num - b.num;
            } else if (a.num !== null) {
              cmp = -1;
            } else if (b.num !== null) {
              cmp = 1;
            } else {
              cmp = ptBrCollator.compare(a.text, b.text);
            }
          } else {
            cmp = ptBrCollator.compare(a.text, b.text);
          }

          if (cmp !== 0) {
            return nextDir === 'asc' ? cmp : -cmp;
          }

          return Number(rowA.dataset.origIdx || 0) - Number(rowB.dataset.origIdx || 0);
        });

        // Re-append rows in sorted order (moves existing DOM nodes without losing listeners)
        const fragment = document.createDocumentFragment();
        sorted.forEach((row) => fragment.appendChild(row));
        tbody.appendChild(fragment);
      };

      const onClick = (e: MouseEvent) => {
        // Do not intercept clicks on links or buttons nested inside the header cell
        const target = e.target as HTMLElement | null;
        if (target && target.closest('a, button')) return;
        sortColumn();
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          sortColumn();
        }
      };

      th.addEventListener('click', onClick);
      th.addEventListener('keydown', onKeyDown);

      cleanups.push(() => {
        th.removeEventListener('click', onClick);
        th.removeEventListener('keydown', onKeyDown);
      });
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
