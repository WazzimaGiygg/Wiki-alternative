/**
 * ============================================================================
 * GOOGLE DOCS API IMPORT SERVICE FOR WIKIWORLDWEB
 * ============================================================================
 * Supports importing and converting Google Docs content directly into
 * WikiWorldWeb wikitext and markdown format.
 *
 * Adheres strictly to Workspace Integration Skill:
 * - Scopes: https://www.googleapis.com/auth/documents.readonly
 * - OAuth Access token cached in-memory ONLY (no localStorage/sessionStorage)
 * - Auto-cleared on sign out via onAuthStateChanged
 * - User confirmation and preview before inserting/overwriting content
 */

import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getAuthSafe } from './firebase';

export const GOOGLE_DOCS_READONLY_SCOPE = 'https://www.googleapis.com/auth/documents.readonly';

export interface GoogleDocTextRun {
  content: string;
  textStyle?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    link?: {
      url?: string;
    };
  };
}

export interface GoogleDocParagraphElement {
  textRun?: GoogleDocTextRun;
  inlineObjectElement?: {
    inlineObjectId?: string;
  };
}

export interface GoogleDocStructuralElement {
  paragraph?: {
    elements?: GoogleDocParagraphElement[];
    paragraphStyle?: {
      namedStyleType?: string;
      headingId?: string;
    };
    bullet?: {
      listId?: string;
      nestingLevel?: number;
    };
  };
  table?: {
    rows?: number;
    columns?: number;
    tableRows?: Array<{
      tableCells?: Array<{
        content?: GoogleDocStructuralElement[];
      }>;
    }>;
  };
}

export interface GoogleDocResponse {
  documentId: string;
  title: string;
  body?: {
    content?: GoogleDocStructuralElement[];
  };
}

export interface ImportedGoogleDocResult {
  documentId: string;
  title: string;
  wikitext: string;
  plainText: string;
  wordCount: number;
  charCount: number;
  hasTables: boolean;
  paragraphsCount: number;
  importedAt: string;
}

// In-memory token cache (strictly adhering to skill security rule)
let inMemoryGoogleAccessToken: string | null = null;
let isAuthListenerInitialized = false;

function initAuthListenerIfNeeded() {
  if (isAuthListenerInitialized) return;
  const auth = getAuthSafe();
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Clear cached token when user signs out
        inMemoryGoogleAccessToken = null;
      }
    });
    isAuthListenerInitialized = true;
  }
}

export const GoogleDocsService = {
  /**
   * Set or update in-memory access token
   */
  setAccessToken(token: string | null) {
    inMemoryGoogleAccessToken = token;
    initAuthListenerIfNeeded();
  },

  /**
   * Retrieve in-memory cached access token
   */
  getAccessToken(): string | null {
    initAuthListenerIfNeeded();
    return inMemoryGoogleAccessToken;
  },

  /**
   * Clears cached access token
   */
  clearAccessToken() {
    inMemoryGoogleAccessToken = null;
  },

  /**
   * Checks if an access token is currently cached in memory
   */
  hasCachedToken(): boolean {
    return !!inMemoryGoogleAccessToken;
  },

  /**
   * Prompts user with Google OAuth popup requesting Google Docs Readonly permission
   */
  async requestGoogleDocsAccess(): Promise<string> {
    const auth = getAuthSafe();
    if (!auth) {
      throw new Error('Serviço de autenticação Firebase não está inicializado.');
    }

    initAuthListenerIfNeeded();

    const provider = new GoogleAuthProvider();
    provider.addScope(GOOGLE_DOCS_READONLY_SCOPE);
    provider.addScope('openid');
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error('Não foi possível obter o token de autorização do Google Docs.');
      }

      inMemoryGoogleAccessToken = token;
      return token;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('A janela de autenticação do Google foi fechada antes da confirmação.');
      }
      throw err;
    }
  },

  /**
   * Extracts Google Docs documentId from a full URL or direct ID
   */
  extractDocumentId(urlOrId: string): string | null {
    if (!urlOrId || typeof urlOrId !== 'string') return null;
    const trimmed = urlOrId.trim();

    // Direct ID check (Google Doc IDs are typically 30-60 alphanumeric characters with dashes and underscores)
    if (/^[a-zA-Z0-9_-]{25,70}$/.test(trimmed)) {
      return trimmed;
    }

    // Pattern 1: https://docs.google.com/document/d/<documentId>/edit...
    const matchD = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      return matchD[1];
    }

    // Pattern 2: https://docs.google.com/document/u/0/d/<documentId>/...
    const matchU = trimmed.match(/\/document\/u\/\d+\/d\/([a-zA-Z0-9_-]+)/);
    if (matchU && matchU[1]) {
      return matchU[1];
    }

    // Pattern 3: URL with ?id=<documentId>
    const matchQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchQuery && matchQuery[1]) {
      return matchQuery[1];
    }

    return null;
  },

  /**
   * Fetches the Google Doc content from the Google Docs REST API v1
   */
  async fetchDocument(documentId: string, customToken?: string): Promise<GoogleDocResponse> {
    const token = customToken || inMemoryGoogleAccessToken;
    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }

    const cleanDocId = this.extractDocumentId(documentId) || documentId;
    const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(cleanDocId)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      inMemoryGoogleAccessToken = null;
      throw new Error('AUTH_EXPIRED');
    }

    if (response.status === 403) {
      throw new Error(
        'Permissão negada (403): Sua Conta Google não tem permissão para visualizar este documento, ou o documento requer compartilhamento de leitura.'
      );
    }

    if (response.status === 404) {
      throw new Error('Documento não encontrado (404): Verifique se o ID ou URL do Google Doc está correto.');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Falha na API do Google Docs (${response.status}): ${errorText || response.statusText}`);
    }

    const data: GoogleDocResponse = await response.json();
    return data;
  },

  /**
   * Converts a Google Doc structural element tree into MediaWiki / WikiWorldWeb wikitext format
   */
  convertDocToWikitext(doc: GoogleDocResponse): ImportedGoogleDocResult {
    const docTitle = doc.title ? doc.title.trim() : 'Documento Importado do Google Docs';
    const content = doc.body?.content || [];

    const wikitextLines: string[] = [];
    const plainTextLines: string[] = [];
    let hasTables = false;
    let paragraphsCount = 0;

    // Header wikitext preamble
    wikitextLines.push(`= ${docTitle} =`);
    wikitextLines.push('');

    for (const elem of content) {
      if (elem.paragraph) {
        paragraphsCount++;
        const p = elem.paragraph;
        const style = p.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
        const isBullet = !!p.bullet;
        const elements = p.elements || [];

        // Build raw text and formatted wikitext text for this paragraph
        let pWikitext = '';
        let pPlainText = '';

        for (const el of elements) {
          if (el.textRun) {
            const raw = el.textRun.content || '';
            const cleanContent = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const trimmedRun = cleanContent.replace(/\n+$/, '');
            const trailingNewlines = cleanContent.endsWith('\n') ? '' : '';

            pPlainText += cleanContent;

            if (!trimmedRun) {
              pWikitext += cleanContent;
              continue;
            }

            const ts = el.textRun.textStyle || {};
            let styled = trimmedRun;

            // Apply formatting: links, bold, italic, underline, strikethrough
            if (ts.bold && ts.italic) {
              styled = `'''''${styled}'''''`;
            } else if (ts.bold) {
              styled = `'''${styled}'''`;
            } else if (ts.italic) {
              styled = `''${styled}''`;
            }

            if (ts.underline) {
              styled = `<u>${styled}</u>`;
            }
            if (ts.strikethrough) {
              styled = `<s>${styled}</s>`;
            }

            if (ts.link?.url) {
              styled = `[${ts.link.url} ${styled}]`;
            }

            pWikitext += styled + trailingNewlines;
          }
        }

        const trimmedPlain = pPlainText.trim();
        const trimmedWiki = pWikitext.trim();

        if (!trimmedPlain && !trimmedWiki) {
          // Empty paragraph, represents a line break
          wikitextLines.push('');
          plainTextLines.push('');
          continue;
        }

        // Apply Headings or Lists
        if (style === 'TITLE' || style === 'HEADING_1') {
          wikitextLines.push(`== ${trimmedWiki.replace(/^[= ]+|[= ]+$/g, '')} ==`);
          wikitextLines.push('');
        } else if (style === 'HEADING_2') {
          wikitextLines.push(`=== ${trimmedWiki.replace(/^[= ]+|[= ]+$/g, '')} ===`);
          wikitextLines.push('');
        } else if (style === 'HEADING_3') {
          wikitextLines.push(`==== ${trimmedWiki.replace(/^[= ]+|[= ]+$/g, '')} ====`);
          wikitextLines.push('');
        } else if (style === 'HEADING_4' || style === 'HEADING_5' || style === 'HEADING_6') {
          wikitextLines.push(`===== ${trimmedWiki.replace(/^[= ]+|[= ]+$/g, '')} =====`);
          wikitextLines.push('');
        } else if (isBullet) {
          const nesting = p.bullet?.nestingLevel || 0;
          const bulletPrefix = '*'.repeat(Math.max(1, nesting + 1)) + ' ';
          wikitextLines.push(`${bulletPrefix}${trimmedWiki}`);
        } else {
          wikitextLines.push(trimmedWiki);
          wikitextLines.push('');
        }

        plainTextLines.push(trimmedPlain);
      } else if (elem.table) {
        hasTables = true;
        const table = elem.table;
        const rows = table.tableRows || [];

        wikitextLines.push('{| class="wikitable"');

        rows.forEach((row, rowIndex) => {
          wikitextLines.push('|-');
          const cells = row.tableCells || [];
          cells.forEach((cell) => {
            const isHeader = rowIndex === 0;
            const cellTag = isHeader ? '!' : '|';
            const cellContentElements = cell.content || [];
            const cellTexts: string[] = [];

            cellContentElements.forEach((cElem) => {
              if (cElem.paragraph?.elements) {
                const cellText = cElem.paragraph.elements
                  .map((e) => e.textRun?.content?.trim() || '')
                  .filter(Boolean)
                  .join(' ');
                if (cellText) cellTexts.push(cellText);
              }
            });

            wikitextLines.push(`${cellTag} ${cellTexts.join('<br>') || '&nbsp;'}`);
          });
        });

        wikitextLines.push('|}');
        wikitextLines.push('');
      }
    }

    // Append metadata citation footer
    wikitextLines.push('');
    wikitextLines.push('== Fontes e Metadados ==');
    wikitextLines.push(
      `* ''Artigo importado via integração oficial Google Docs na WikiWorldWeb em ${new Date().toLocaleDateString('pt-BR')}.''`
    );

    const fullWikitext = wikitextLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const fullPlainText = plainTextLines.join('\n').trim();

    const words = fullPlainText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = fullPlainText.length;

    return {
      documentId: doc.documentId,
      title: docTitle,
      wikitext: fullWikitext,
      plainText: fullPlainText,
      wordCount,
      charCount,
      hasTables,
      paragraphsCount,
      importedAt: new Date().toISOString(),
    };
  },

  /**
   * High-level method: Fetch and convert Google Doc in a single call
   */
  async importGoogleDoc(urlOrId: string, customToken?: string): Promise<ImportedGoogleDocResult> {
    const docId = this.extractDocumentId(urlOrId);
    if (!docId) {
      throw new Error(
        'URL ou ID do Google Doc inválido. Forneça o link completo (ex: https://docs.google.com/document/d/...) ou o ID alfanumérico do documento.'
      );
    }

    const docResponse = await this.fetchDocument(docId, customToken);
    return this.convertDocToWikitext(docResponse);
  },
};
