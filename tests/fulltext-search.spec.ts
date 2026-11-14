import { describe, it, expect, beforeEach } from 'vitest';
import { FullTextSearchService } from '../src/services/fullTextSearchService';
import { WikiArticle } from '../src/types';

describe('FullTextSearchService (Pillar 3)', () => {
  const sampleArticles: WikiArticle[] = [
    {
      id: 'albert-einstein',
      pageUid: 'page-einstein',
      titulo: 'Albert Einstein',
      descricao: 'Albert Einstein foi um físico teórico alemão que desenvolveu a teoria da relatividade geral, um dos pilares da física moderna ao lado da mecânica quântica.',
      categoria: 'Física',
      tags: ['física', 'relatividade', 'ciência', 'nobel'],
      autor: 'admin',
      dataCriacao: '2025-01-01',
    },
    {
      id: 'mecanica-quantica',
      pageUid: 'page-quantica',
      titulo: 'Mecânica Quântica',
      descricao: 'A mecânica quântica é a teoria física fundamental que obtém as propriedades dinâmicas dos sistemas atômicos e subatômicos com o operador hamiltoniano.',
      categoria: 'Física',
      tags: ['física', 'quântica', 'átomos'],
      autor: 'editor',
      dataCriacao: '2025-01-02',
    },
    {
      id: 'inteligencia-artificial',
      pageUid: 'page-ia',
      titulo: 'Inteligência Artificial',
      descricao: 'Inteligência artificial é um campo da ciência da computação dedicado a criar agentes autônomos e modelos de linguagem capazes de resolver problemas complexos.',
      categoria: 'Tecnologia',
      tags: ['computação', 'ia', 'algoritmos'],
      autor: 'admin',
      dataCriacao: '2025-01-03',
    },
  ];

  let searchService: FullTextSearchService;

  beforeEach(() => {
    searchService = FullTextSearchService.getInstance();
    searchService.indexArticles(sampleArticles);
  });

  it('indexes articles and reports correct indexed count', () => {
    expect(searchService.getIndexedCount()).toBe(3);
  });

  it('performs exact and prefix search with scoring', () => {
    const results = searchService.search('Einstein');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('albert-einstein');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('supports fuzzy search for typos', () => {
    // "quanti" should match "quântica"
    const results = searchService.search('quantica');
    expect(results.some((r) => r.id === 'mecanica-quantica')).toBe(true);
  });

  it('provides instant search-as-you-type suggestions with snippets', () => {
    const suggestions = searchService.suggest('intel');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].id).toBe('inteligencia-artificial');
    expect(suggestions[0].snippet).toBeDefined();
    expect(suggestions[0].snippet.toLowerCase()).toContain('inteligência');
  });

  it('dynamically adds, updates and removes articles from the search index', () => {
    const newArticle: WikiArticle = {
      id: 'buraco-negro',
      pageUid: 'page-astronomia',
      titulo: 'Buraco Negro',
      descricao: 'Um buraco negro é uma região do espaço-tempo onde a gravidade é tão forte que nada pode escapar.',
      categoria: 'Astronomia',
      autor: 'admin',
      dataCriacao: '2025-01-04',
    };

    searchService.addOrUpdateArticle(newArticle);
    expect(searchService.getIndexedCount()).toBe(4);

    let searchRes = searchService.search('gravidade');
    expect(searchRes.some((r) => r.id === 'buraco-negro')).toBe(true);

    searchService.removeArticle('buraco-negro');
    expect(searchService.getIndexedCount()).toBe(3);

    searchRes = searchService.search('buraco negro');
    expect(searchRes.some((r) => r.id === 'buraco-negro')).toBe(false);
  });
});
