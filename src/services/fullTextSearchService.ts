import MiniSearch from 'minisearch';
import { WikiArticle } from '../types';
import { getCleanExcerpt } from '../utils/wikitextParser';

export interface FullTextSearchResult {
  id: string;
  titulo: string;
  pageUid?: string;
  categoria?: string;
  resumo?: string;
  score: number;
  matchSnippet?: string;
  matchField?: string;
  terms?: string[];
}

export interface SearchSuggestItem {
  id: string;
  titulo: string;
  pageUid?: string;
  categoria: string;
  snippet: string;
  score: number;
}

export class FullTextSearchService {
  private static instance: FullTextSearchService;
  private miniSearch: MiniSearch<any>;
  private articleMap: Map<string, WikiArticle> = new Map();
  private indexedCount: number = 0;

  private constructor() {
    this.miniSearch = new MiniSearch({
      fields: ['titulo', 'descricao', 'categoria', 'tagsText', 'resumo'],
      storeFields: ['id', 'titulo', 'pageUid', 'categoria', 'resumo', 'dataEdicao'],
      searchOptions: {
        boost: { titulo: 4, categoria: 2, tagsText: 2.5, resumo: 1.5, descricao: 1 },
        prefix: true,
        fuzzy: (term) => (term.length > 3 ? 0.2 : false),
      },
    });
  }

  public static getInstance(): FullTextSearchService {
    if (!FullTextSearchService.instance) {
      FullTextSearchService.instance = new FullTextSearchService();
    }
    return FullTextSearchService.instance;
  }

  /**
   * Prepares a WikiArticle for MiniSearch indexing
   */
  private prepareDocument(article: WikiArticle): any {
    const cleanDesc = (article.descricao || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\{\{[^}]*\}\}/g, ' ')
      .replace(/['*#_~`]/g, ' ')
      .slice(0, 50000); // Index up to 50k chars for performance

    const tagsText = Array.isArray(article.tags) ? article.tags.join(' ') : '';

    return {
      id: article.id,
      titulo: article.titulo || '',
      descricao: cleanDesc,
      categoria: article.categoria || 'Geral',
      tagsText,
      resumo: article.resumo || getCleanExcerpt(article.descricao, 140),
      pageUid: article.pageUid || '',
      dataEdicao: article.dataEdicao || article.dataCriacao || '',
    };
  }

  /**
   * Indexes a full list of articles
   */
  public indexArticles(articles: WikiArticle[]): void {
    if (!articles || !Array.isArray(articles)) return;

    this.miniSearch.removeAll();
    this.articleMap.clear();

    const docs: any[] = [];
    for (const art of articles) {
      if (!art || !art.id) continue;
      this.articleMap.set(art.id, art);
      docs.push(this.prepareDocument(art));
    }

    if (docs.length > 0) {
      this.miniSearch.addAll(docs);
      this.indexedCount = docs.length;
    }
  }

  /**
   * Adds or updates a single article in the search index
   */
  public addOrUpdateArticle(article: WikiArticle): void {
    if (!article || !article.id) return;
    this.articleMap.set(article.id, article);

    if (this.miniSearch.has(article.id)) {
      this.miniSearch.discard(article.id);
    }
    this.miniSearch.add(this.prepareDocument(article));
    this.indexedCount = this.articleMap.size;
  }

  /**
   * Removes an article from the search index
   */
  public removeArticle(articleId: string): void {
    if (!articleId) return;
    this.articleMap.delete(articleId);
    if (this.miniSearch.has(articleId)) {
      this.miniSearch.discard(articleId);
    }
    this.indexedCount = this.articleMap.size;
  }

  /**
   * Provides fast, search-as-you-type suggestions with snippet highlights
   */
  public suggest(query: string, limit: number = 6): SearchSuggestItem[] {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    try {
      const results = this.miniSearch.search(cleanQuery, {
        prefix: true,
        fuzzy: cleanQuery.length > 3 ? 0.2 : false,
        boost: { titulo: 4, categoria: 2, tagsText: 2, resumo: 1.5, descricao: 1 },
      });

      const sliced = results.slice(0, limit);
      return sliced.map((res) => {
        const fullArticle = this.articleMap.get(res.id);
        const snippet = this.extractSnippet(
          fullArticle?.descricao || res.resumo || '',
          cleanQuery,
          100
        );

        return {
          id: res.id,
          titulo: res.titulo || fullArticle?.titulo || res.id,
          pageUid: res.pageUid || fullArticle?.pageUid,
          categoria: res.categoria || fullArticle?.categoria || 'Geral',
          snippet,
          score: res.score,
        };
      });
    } catch {
      // Fallback in case of search term syntax error
      return this.fallbackSearch(cleanQuery, limit);
    }
  }

  /**
   * Full text search returning detailed results
   */
  public search(
    query: string,
    options?: { category?: string; limit?: number }
  ): FullTextSearchResult[] {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const limit = options?.limit || 30;

    try {
      let results = this.miniSearch.search(cleanQuery, {
        prefix: true,
        fuzzy: cleanQuery.length > 3 ? 0.2 : false,
        boost: { titulo: 4, categoria: 2, tagsText: 2.5, resumo: 1.5, descricao: 1 },
      });

      if (options?.category && options.category !== 'all') {
        const catFilter = options.category.toLowerCase();
        results = results.filter((r) => (r.categoria || '').toLowerCase() === catFilter);
      }

      return results.slice(0, limit).map((res) => {
        const fullArticle = this.articleMap.get(res.id);
        const snippet = this.extractSnippet(
          fullArticle?.descricao || res.resumo || '',
          cleanQuery,
          160
        );

        return {
          id: res.id,
          titulo: res.titulo || fullArticle?.titulo || res.id,
          pageUid: res.pageUid || fullArticle?.pageUid,
          categoria: res.categoria || fullArticle?.categoria || 'Geral',
          resumo: res.resumo || fullArticle?.resumo,
          score: res.score,
          matchSnippet: snippet,
          terms: res.terms,
        };
      });
    } catch {
      return this.fallbackSearch(cleanQuery, limit).map((item) => ({
        id: item.id,
        titulo: item.titulo,
        pageUid: item.pageUid,
        categoria: item.categoria,
        score: item.score,
        matchSnippet: item.snippet,
      }));
    }
  }

  /**
   * Fallback substring matching if index search fails
   */
  private fallbackSearch(query: string, limit: number): SearchSuggestItem[] {
    const q = query.toLowerCase();
    const matches: SearchSuggestItem[] = [];

    for (const art of this.articleMap.values()) {
      const titleMatch = art.titulo?.toLowerCase().includes(q);
      const descMatch = art.descricao?.toLowerCase().includes(q);
      const catMatch = art.categoria?.toLowerCase().includes(q);

      if (titleMatch || descMatch || catMatch) {
        matches.push({
          id: art.id,
          titulo: art.titulo,
          pageUid: art.pageUid,
          categoria: art.categoria || 'Geral',
          snippet: this.extractSnippet(art.descricao || '', query, 100),
          score: titleMatch ? 10 : 2,
        });
        if (matches.length >= limit) break;
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Extracts an informative snippet around where search terms match
   */
  public extractSnippet(content: string, query: string, maxLength: number = 120): string {
    if (!content) return '';

    // Strip markup
    const plain = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\{\{[^}]*\}\}/g, ' ')
      .replace(/['*#_~`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plain) return '';

    const lowerPlain = plain.toLowerCase();
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

    let matchIdx = -1;
    for (const term of terms) {
      const idx = lowerPlain.indexOf(term);
      if (idx !== -1 && (matchIdx === -1 || idx < matchIdx)) {
        matchIdx = idx;
      }
    }

    if (matchIdx === -1) {
      return plain.slice(0, maxLength).trim() + (plain.length > maxLength ? '...' : '');
    }

    const half = Math.floor(maxLength / 2);
    const start = Math.max(0, matchIdx - half);
    const end = Math.min(plain.length, matchIdx + half + 20);

    let snippet = plain.slice(start, end).trim();
    if (start > 0) snippet = '...' + snippet;
    if (end < plain.length) snippet = snippet + '...';

    return snippet;
  }

  public getIndexedCount(): number {
    return this.indexedCount;
  }
}
