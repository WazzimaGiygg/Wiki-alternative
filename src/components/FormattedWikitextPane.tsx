import React from 'react';
import { ExternalLink, Link2, Unlink, X } from 'lucide-react';
import { WikiTemplate } from '../types';
import {
  formattedHtmlToWikitext,
  looksLikeWikitext,
  normalizePastedHtmlForWikiEditor,
  wikitextToFormattedHtml,
} from '../utils/wikitextFormattedBridge';

export type RichWikitextCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'inlineCode'
  | 'codeBlock'
  | 'hr'
  | 'table'
  | 'wikilink'
  | 'externallink';

export interface ActiveWikitextFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  blockTag: string;
  unorderedList: boolean;
  orderedList: boolean;
}

export interface FormattedWikitextPaneHandle {
  focus: () => void;
  applyFormat: (command: RichWikitextCommand) => void;
  insertRawWikitextSnippet: (rawWikitext: string, placement?: 'block' | 'inline') => void;
  insertFormattedHtml: (html: string) => void;
  getSelectedText: () => string;
  getElement: () => HTMLDivElement | null;
}

interface FormattedWikitextPaneProps {
  value: string;
  onChange: (wikitext: string) => void;
  disabled?: boolean;
  articleTitle?: string;
  customTemplates?: WikiTemplate[];
  syncSourceRef?: React.MutableRefObject<'code' | 'formatted' | null>;
  onFocusPane?: () => void;
  onActiveFormatsChange?: (formats: ActiveWikitextFormats) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
  onPasteFeedback?: (message: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  className?: string;
}

interface SelectedLinkState {
  anchor: HTMLAnchorElement;
  kind: 'wiki' | 'external';
  target: string;
  label: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const FormattedWikitextPane = React.forwardRef<
  FormattedWikitextPaneHandle,
  FormattedWikitextPaneProps
>(
  (
    {
      value,
      onChange,
      disabled = false,
      articleTitle,
      customTemplates,
      syncSourceRef,
      onFocusPane,
      onActiveFormatsChange,
      onMouseMove,
      onMouseLeave,
      onPasteFeedback,
      placeholder = 'Escreva ou cole texto formatado aqui — negrito, títulos, listas, links e pré-definições são convertidos automaticamente para Wikitexto...',
      minHeightClassName = 'min-h-[420px]',
      className = '',
    },
    ref
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const savedRangeRef = React.useRef<Range | null>(null);
    const lastSyncedWikitextRef = React.useRef<string | null>(null);
    const [selectedLink, setSelectedLink] = React.useState<SelectedLinkState | null>(null);

    const isEmpty = !value.trim();

    // Sincroniza DOM apenas quando `value` ou templates mudarem externamente
    React.useEffect(() => {
      const el = editorRef.current;
      if (!el) return;

      if (syncSourceRef?.current === 'formatted' && lastSyncedWikitextRef.current === value) {
        syncSourceRef.current = null;
        return;
      }

      if (lastSyncedWikitextRef.current === value && el.innerHTML.trim() !== '') {
        return;
      }

      const nextHtml = wikitextToFormattedHtml(value, {
        articleTitle,
        customTemplates,
      });

      if (el.innerHTML !== nextHtml) {
        el.innerHTML = nextHtml;
      }
      lastSyncedWikitextRef.current = value;
      if (syncSourceRef?.current === 'code') {
        syncSourceRef.current = null;
      }
    }, [value, articleTitle, customTemplates, syncSourceRef]);

    const syncFromDom = React.useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const nextWikitext = formattedHtmlToWikitext(el);
      lastSyncedWikitextRef.current = nextWikitext;
      if (syncSourceRef) {
        syncSourceRef.current = 'formatted';
      }
      onChange(nextWikitext);
    }, [onChange, syncSourceRef]);

    const saveSelection = React.useCallback(() => {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }, []);

    const restoreSelection = React.useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (!sel) return;
      if (savedRangeRef.current && el.contains(savedRangeRef.current.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } else if (sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, []);

    const updateActiveFormats = React.useCallback(() => {
      if (!onActiveFormatsChange) return;
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || !el.contains(sel.anchorNode)) return;

      try {
        const blockTag = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
        onActiveFormatsChange({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikethrough: document.queryCommandState('strikeThrough'),
          blockTag,
          unorderedList: document.queryCommandState('insertUnorderedList'),
          orderedList: document.queryCommandState('insertOrderedList'),
        });
      } catch {
        // Ignorar erros específicos do navegador ao consultar queryCommandState
      }
    }, [onActiveFormatsChange]);

    React.useEffect(() => {
      const handleSelectionChange = () => {
        saveSelection();
        updateActiveFormats();
      };
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [saveSelection, updateActiveFormats]);

    const insertHtmlAtSelection = React.useCallback(
      (html: string) => {
        const el = editorRef.current;
        if (!el || disabled) return;
        restoreSelection();

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const fragment = range.createContextualFragment(html);
          const lastInserted = fragment.lastChild;
          range.insertNode(fragment);
          if (lastInserted) {
            const nextRange = document.createRange();
            nextRange.setStartAfter(lastInserted);
            nextRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(nextRange);
            savedRangeRef.current = nextRange.cloneRange();
          }
        } else {
          el.insertAdjacentHTML('beforeend', html);
        }

        syncFromDom();
        updateActiveFormats();
      },
      [disabled, restoreSelection, syncFromDom, updateActiveFormats]
    );

    const openAnchorEditor = React.useCallback((anchor: HTMLAnchorElement) => {
      const mwTarget =
        anchor.getAttribute('data-mw-link') || anchor.getAttribute('data-wiki-target');
      const href = anchor.getAttribute('href') || '';
      const label = anchor.textContent ?? '';
      if (mwTarget) {
        setSelectedLink({
          anchor,
          kind: 'wiki',
          target: mwTarget,
          label: label || mwTarget,
        });
      } else if (href.startsWith('#wiki/')) {
        const decoded = decodeURIComponent(href.slice('#wiki/'.length));
        setSelectedLink({
          anchor,
          kind: 'wiki',
          target: decoded,
          label: label || decoded,
        });
      } else {
        setSelectedLink({
          anchor,
          kind: 'external',
          target: anchor.getAttribute('data-mw-ext') || href || 'https://',
          label: label || 'Link',
        });
      }
    }, []);

    const applyRichCommand = React.useCallback(
      (command: RichWikitextCommand) => {
        const el = editorRef.current;
        if (!el || disabled) return;
        restoreSelection();

        const sel = window.getSelection();
        const selectedText = sel && sel.rangeCount > 0 ? sel.toString().trim() : '';

        switch (command) {
          case 'bold':
            document.execCommand('bold', false);
            break;
          case 'italic':
            document.execCommand('italic', false);
            break;
          case 'underline':
            document.execCommand('underline', false);
            break;
          case 'strikethrough':
            document.execCommand('strikeThrough', false);
            break;
          case 'heading1': {
            const current = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
            document.execCommand('formatBlock', false, current === 'h1' ? 'P' : 'H1');
            break;
          }
          case 'heading2': {
            const current = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
            document.execCommand('formatBlock', false, current === 'h2' ? 'P' : 'H2');
            break;
          }
          case 'heading3': {
            const current = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
            document.execCommand('formatBlock', false, current === 'h3' ? 'P' : 'H3');
            break;
          }
          case 'paragraph':
            document.execCommand('formatBlock', false, 'P');
            break;
          case 'bulletList':
            document.execCommand('insertUnorderedList', false);
            break;
          case 'orderedList':
            document.execCommand('insertOrderedList', false);
            break;
          case 'blockquote': {
            const current = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
            document.execCommand(
              'formatBlock',
              false,
              current === 'blockquote' ? 'P' : 'BLOCKQUOTE'
            );
            break;
          }
          case 'inlineCode': {
            const codeText = escapeHtml(selectedText || 'código');
            insertHtmlAtSelection(`<code>${codeText}</code>&nbsp;`);
            return;
          }
          case 'codeBlock': {
            const rawSnippet = `<pre>\n${selectedText || 'código de exemplo'}\n</pre>`;
            const html = wikitextToFormattedHtml(rawSnippet, { articleTitle, customTemplates });
            insertHtmlAtSelection(`${html}<p><br /></p>`);
            return;
          }
          case 'table': {
            const rawTable = `{| class="wikitable"\n! Coluna 1 !! Coluna 2\n|-\n| Valor 1 || Valor 2\n|-\n| Linha 2A || Linha 2B\n|}`;
            const html = wikitextToFormattedHtml(rawTable, { articleTitle, customTemplates });
            insertHtmlAtSelection(`${html}<p><br /></p>`);
            return;
          }
          case 'hr': {
            insertHtmlAtSelection('<hr /><p><br /></p>');
            return;
          }
          case 'wikilink': {
            const targetTitle = selectedText || 'Título do Artigo';
            const encoded = encodeURIComponent(targetTitle.replace(/\s+/g, '_'));
            const markerId = `mw-pending-link-${Date.now()}`;
            insertHtmlAtSelection(
              `<a id="${markerId}" href="#wiki/${encoded}" data-mw-link="${escapeHtml(targetTitle)}" class="wiki-rich-wikilink text-[#0645ad] dark:text-[#6ba4ff] underline font-medium">${escapeHtml(targetTitle)}</a>`
            );
            const inserted = el.querySelector(`#${markerId}`) as HTMLAnchorElement | null;
            if (inserted) {
              inserted.removeAttribute('id');
              openAnchorEditor(inserted);
            }
            return;
          }
          case 'externallink': {
            const label = selectedText || 'Texto do Link';
            const href = 'https://';
            const markerId = `mw-pending-ext-${Date.now()}`;
            insertHtmlAtSelection(
              `<a id="${markerId}" href="${href}" data-mw-ext="${href}" class="text-[#3366cc] dark:text-[#729fcf] underline">${escapeHtml(label)}</a>`
            );
            const inserted = el.querySelector(`#${markerId}`) as HTMLAnchorElement | null;
            if (inserted) {
              inserted.removeAttribute('id');
              openAnchorEditor(inserted);
            }
            return;
          }
        }

        syncFromDom();
        updateActiveFormats();
      },
      [
        articleTitle,
        customTemplates,
        disabled,
        insertHtmlAtSelection,
        openAnchorEditor,
        restoreSelection,
        syncFromDom,
        updateActiveFormats,
      ]
    );

    React.useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editorRef.current?.focus();
        },
        applyFormat: applyRichCommand,
        insertRawWikitextSnippet: (rawWikitext: string, placement?: 'block' | 'inline') => {
          if (!rawWikitext) return;
          const trimmed = rawWikitext.trim();
          const isBlock =
            placement === 'block' ||
            (placement !== 'inline' &&
              (trimmed.includes('\n') ||
                /^(?:\{\||\{\{(?:infobox|info\/|aviso|nota|ambox|navbox|citacao|citação|esboço|esboco|portal|reflist)|={1,6}\s|<pre|<gallery)/i.test(
                  trimmed
                )));

          const fragmentHtml = wikitextToFormattedHtml(trimmed, {
            articleTitle,
            customTemplates,
          });
          insertHtmlAtSelection(isBlock ? `${fragmentHtml}<p><br /></p>` : `${fragmentHtml} `);
        },
        insertFormattedHtml: insertHtmlAtSelection,
        getSelectedText: () => {
          const sel = window.getSelection();
          if (sel && editorRef.current?.contains(sel.anchorNode)) {
            return sel.toString().trim();
          }
          return '';
        },
        getElement: () => editorRef.current,
      }),
      [applyRichCommand, articleTitle, customTemplates, insertHtmlAtSelection]
    );

    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a');
      if (anchor && editorRef.current?.contains(anchor)) {
        e.preventDefault();
        openAnchorEditor(anchor);
        return;
      }

      if (selectedLink) {
        setSelectedLink(null);
      }
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const isMod = e.metaKey || e.ctrlKey;
      const keyLower = e.key.toLowerCase();

      if (isMod && !e.shiftKey) {
        if (keyLower === 'b') {
          e.preventDefault();
          applyRichCommand('bold');
          return;
        }
        if (keyLower === 'i') {
          e.preventDefault();
          applyRichCommand('italic');
          return;
        }
        if (keyLower === 'u') {
          e.preventDefault();
          applyRichCommand('underline');
          return;
        }
        if (keyLower === 'k') {
          e.preventDefault();
          applyRichCommand('wikilink');
          return;
        }
      }

      if (isMod && e.shiftKey && keyLower === 'l') {
        e.preventDefault();
        applyRichCommand('wikilink');
        return;
      }

      if (e.key === 'Tab') {
        const sel = window.getSelection();
        const anchorNode = sel?.anchorNode;
        const cell =
          anchorNode instanceof HTMLElement
            ? anchorNode.closest('td, th')
            : anchorNode?.parentElement?.closest('td, th');
        if (cell && editorRef.current?.contains(cell)) {
          e.preventDefault();
          const table = cell.closest('table');
          if (table) {
            const cells = Array.from(table.querySelectorAll('th, td'));
            const idx = cells.indexOf(cell);
            const nextCell = e.shiftKey ? cells[idx - 1] : cells[idx + 1];
            if (nextCell) {
              const range = document.createRange();
              range.selectNodeContents(nextCell);
              range.collapse(false);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const htmlData = e.clipboardData.getData('text/html');
      const textData = e.clipboardData.getData('text/plain');

      // 1. Texto puro contendo sintaxe Wikitexto explícita -> converte para blocos formatados e widgets atômicos
      if (textData && looksLikeWikitext(textData)) {
        e.preventDefault();
        const convertedHtml = wikitextToFormattedHtml(textData, {
          articleTitle,
          customTemplates,
        });
        insertHtmlAtSelection(convertedHtml);
        onPasteFeedback?.('Wikitexto colado e renderizado com formatação preservada.');
        return;
      }

      // 2. HTML rico colado (Google Docs, Word, Wikipédia, Sites) -> sanitiza, normaliza CSS inline e insere limpo
      if (htmlData) {
        e.preventDefault();
        const normalized = normalizePastedHtmlForWikiEditor(htmlData);
        if (normalized.cleanHtml) {
          insertHtmlAtSelection(normalized.cleanHtml);
          onPasteFeedback?.(
            normalized.hasRichFormatting
              ? 'Formatação do texto colado preservada e convertida para Wikitexto.'
              : 'Texto colado com sucesso.'
          );
          return;
        }
      }

      // 3. Texto puro simples -> preserva quebras de linha limpas
      if (textData) {
        e.preventDefault();
        const paragraphs = textData
          .replace(/\r\n/g, '\n')
          .split(/\n{2,}/)
          .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
          .join('');
        insertHtmlAtSelection(paragraphs || escapeHtml(textData));
      }
    };

    const handleApplyLinkEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLink || !editorRef.current?.contains(selectedLink.anchor)) {
        setSelectedLink(null);
        return;
      }

      const { anchor, kind, target, label } = selectedLink;
      const cleanedLabel = label.trim() || target.trim() || 'Link';

      if (kind === 'wiki') {
        const cleanedTarget = target.trim() || 'Página_principal';
        const slug = cleanedTarget.replace(/\s+/g, '_');
        anchor.setAttribute('data-mw-link', cleanedTarget);
        anchor.removeAttribute('data-mw-ext');
        anchor.setAttribute('href', `#wiki/${encodeURIComponent(slug)}`);
        anchor.className =
          'wiki-rich-wikilink text-[#0645ad] dark:text-[#6ba4ff] underline font-medium';
        anchor.textContent = cleanedLabel;
      } else {
        const trimmedUrl = target.trim();
        const safeUrl = /^(https?:\/\/|mailto:|\/)/i.test(trimmedUrl)
          ? trimmedUrl
          : trimmedUrl
          ? `https://${trimmedUrl}`
          : 'https://';
        anchor.removeAttribute('data-mw-link');
        anchor.removeAttribute('data-wiki-target');
        anchor.setAttribute('data-mw-ext', safeUrl);
        anchor.setAttribute('href', safeUrl);
        anchor.className = 'text-[#3366cc] dark:text-[#729fcf] underline';
        anchor.textContent = cleanedLabel;
      }

      setSelectedLink(null);
      syncFromDom();
    };

    const handleUnlink = () => {
      if (!selectedLink || !editorRef.current?.contains(selectedLink.anchor)) {
        setSelectedLink(null);
        return;
      }
      const textNode = document.createTextNode(
        selectedLink.anchor.textContent || selectedLink.label
      );
      selectedLink.anchor.replaceWith(textNode);
      setSelectedLink(null);
      syncFromDom();
    };

    return (
      <div className={`relative flex flex-col flex-1 ${className}`}>
        {/* Popover inline para editar ou desvincular links (sem window.prompt) */}
        {selectedLink && (
          <form
            onSubmit={handleApplyLinkEdit}
            className="mb-2 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50/90 dark:bg-blue-950/40 flex flex-wrap items-center gap-2 text-xs shadow-xs"
          >
            <div className="inline-flex items-center rounded border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setSelectedLink((prev) => (prev ? { ...prev, kind: 'wiki' } : null))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                  selectedLink.kind === 'wiki'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Link2 className="w-3 h-3" />
                <span>Interno</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedLink((prev) => (prev ? { ...prev, kind: 'external' } : null))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                  selectedLink.kind === 'external'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                <span>Externo</span>
              </button>
            </div>

            <input
              type="text"
              value={selectedLink.target}
              onChange={(e) =>
                setSelectedLink((prev) => (prev ? { ...prev, target: e.target.value } : null))
              }
              placeholder={
                selectedLink.kind === 'wiki' ? 'Título da página interna' : 'https://exemplo.com'
              }
              aria-label={selectedLink.kind === 'wiki' ? 'Destino interno' : 'URL externa'}
              className="flex-1 min-w-[150px] px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={selectedLink.label}
              onChange={(e) =>
                setSelectedLink((prev) => (prev ? { ...prev, label: e.target.value } : null))
              }
              placeholder="Texto exibido"
              aria-label="Texto exibido do link"
              className="flex-1 min-w-[130px] px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={handleUnlink}
              title="Remover link mantendo o texto"
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Unlink className="w-3 h-3" />
              <span>Desvincular</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLink(null)}
              aria-label="Fechar editor de link"
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="relative flex-1 flex flex-col">
          {isEmpty && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-4 left-4 right-4 text-xs text-slate-400 dark:text-slate-500 select-none"
            >
              {placeholder}
            </div>
          )}

          <div
            ref={editorRef}
            role="textbox"
            aria-multiline="true"
            aria-label="Editor de página formatada"
            contentEditable={!disabled}
            suppressContentEditableWarning
            onFocus={() => {
              onFocusPane?.();
            }}
            onInput={() => {
              const el = editorRef.current;
              if (el && el.innerHTML === '') {
                el.innerHTML = '<p><br /></p>';
              }
              syncFromDom();
              updateActiveFormats();
            }}
            onClick={handleEditorClick}
            onKeyDown={handleEditorKeyDown}
            onPaste={handlePaste}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onBlur={() => {
              saveSelection();
              syncFromDom();
            }}
            className={`wiki-rendered-content font-wiki-body flex-1 ${minHeightClassName} max-h-[600px] overflow-y-auto p-4 sm:p-5 text-sm leading-relaxed rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 [&_h1]:font-serif-heading [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:pb-1.5 [&_h1]:border-b [&_h1]:border-slate-200 dark:[&_h1]:border-slate-800 [&_h2]:font-serif-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-slate-200 dark:[&_h2]:border-slate-800 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:mt-3 [&_h4]:mb-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_blockquote]:border-l-3 [&_blockquote]:border-blue-600/70 [&_blockquote]:pl-3.5 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:bg-slate-50 dark:[&_blockquote]:bg-slate-800/40 [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-300 [&_blockquote]:italic [&_code]:font-mono [&_code]:text-xs [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_hr]:my-4 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800 [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:text-xs [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800/80 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:px-2.5 [&_td]:py-1.5 ${
              disabled ? 'opacity-70 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''
            }`}
          />
        </div>
      </div>
    );
  }
);

FormattedWikitextPane.displayName = 'FormattedWikitextPane';
