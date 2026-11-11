import { describe, it, expect } from 'vitest';
import {
  parseWikitext,
  evaluateExpr,
  processParserFunctionsAndVariables,
  renderInlineTableOfContents,
} from '../src/utils/wikitextParser';

describe('Wikitext Parser Upgrades (Pillar 2)', () => {
  describe('Mathematical Formulas with KaTeX (<math>)', () => {
    it('renders inline math using KaTeX', () => {
      const wikitext = 'A famosa equação <math>E = mc^2</math> formulada por Albert Einstein.';
      const res = parseWikitext(wikitext);

      expect(res.html).toContain('wiki-math-inline');
      expect(res.html).toContain('katex');
      // KaTeX renders MathML and HTML spans
      expect(res.html).toContain('E = mc^2');
    });

    it('renders block math using KaTeX when display="block" is set', () => {
      const wikitext = '<math display="block">\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}</math>';
      const res = parseWikitext(wikitext);

      expect(res.html).toContain('wiki-math-block');
      expect(res.html).toContain('katex-display');
    });

    it('falls back gracefully on invalid TeX formula without breaking parser', () => {
      const wikitext = '<math>\\invalidTeXLexerCommand{{{</math>';
      const res = parseWikitext(wikitext);

      expect(res.html).toBeDefined();
      expect(res.html.length).toBeGreaterThan(0);
    });
  });

  describe('Page Redirects (#REDIRECT and #REDIRECIONAMENTO)', () => {
    it('detects #REDIRECT [[Target]] and populates redirectTarget and banner', () => {
      const wikitext = '#REDIRECT [[Teoria da Relatividade]]';
      const res = parseWikitext(wikitext);

      expect(res.redirectTarget).toBe('Teoria da Relatividade');
      expect(res.html).toContain('wiki-redirect-banner');
      expect(res.html).toContain('Redirecionamento de Página');
      expect(res.html).toContain('Teoria da Relatividade');
    });

    it('detects Portuguese alias #REDIRECIONAMENTO [[Target]]', () => {
      const wikitext = '#REDIRECIONAMENTO [[Inteligência Artificial]]';
      const res = parseWikitext(wikitext);

      expect(res.redirectTarget).toBe('Inteligência Artificial');
      expect(res.html).toContain('Inteligência Artificial');
    });
  });

  describe('Table of Contents Flags (__TOC__ and __NOTOC__)', () => {
    it('sets hasNotoc when __NOTOC__ is present', () => {
      const wikitext = `__NOTOC__\n== Seção 1 ==\nTexto da seção 1.\n== Seção 2 ==\nTexto da seção 2.`;
      const res = parseWikitext(wikitext);

      expect(res.hasNotoc).toBe(true);
      expect(res.hasExplicitToc).toBe(false);
      expect(res.toc.length).toBe(2);
    });

    it('sets hasNotoc with Portuguese __SEM_SUMÁRIO__', () => {
      const wikitext = `__SEM_SUMÁRIO__\n== Introdução ==\nTexto.`;
      const res = parseWikitext(wikitext);

      expect(res.hasNotoc).toBe(true);
    });

    it('renders inline TOC at explicit __TOC__ position', () => {
      const wikitext = `Introdução inicial antes do sumário.\n\n__TOC__\n\n== Primeira Seção ==\nConteúdo A.\n== Segunda Seção ==\nConteúdo B.`;
      const res = parseWikitext(wikitext);

      expect(res.hasExplicitToc).toBe(true);
      expect(res.html).toContain('wiki-toc-inline');
      expect(res.html).toContain('Primeira Seção');
      expect(res.html).toContain('Segunda Seção');
    });
  });

  describe('MediaWiki Parser Functions (#if, #ifeq, #switch, #expr)', () => {
    it('evaluates {{#if: test | then | else}}', () => {
      const truthy = processParserFunctionsAndVariables('{{#if: algum texto | Sim | Nao}}');
      expect(truthy).toBe('Sim');

      const falsy = processParserFunctionsAndVariables('{{#if:  | Sim | Nao}}');
      expect(falsy).toBe('Nao');
    });

    it('evaluates {{#ifeq: a | b | then | else}} with string and numerical comparisons', () => {
      const equalStr = processParserFunctionsAndVariables('{{#ifeq: Brasil | Brasil | Igual | Diferente}}');
      expect(equalStr).toBe('Igual');

      const diffStr = processParserFunctionsAndVariables('{{#ifeq: Brasil | Argentina | Igual | Diferente}}');
      expect(diffStr).toBe('Diferente');

      const equalNum = processParserFunctionsAndVariables('{{#ifeq: 042 | 42 | NumerosIguais | Diferentes}}');
      expect(equalNum).toBe('NumerosIguais');
    });

    it('evaluates {{#switch: test | c1 = r1 | c2 = r2 | #default = def}}', () => {
      const wikitext = '{{#switch: lua | terra = Terrestre | lua = Satélite | sol = Estrela | #default = Desconhecido}}';
      const res = processParserFunctionsAndVariables(wikitext);
      expect(res).toBe('Satélite');

      const defaultCase = '{{#switch: marte | terra = Terrestre | #default = Outro Planeta}}';
      expect(processParserFunctionsAndVariables(defaultCase)).toBe('Outro Planeta');
    });

    it('evaluates arithmetic expressions with {{#expr: ...}}', () => {
      expect(evaluateExpr('2 + 2')).toBe('4');
      expect(evaluateExpr('10 * (3 + 2)')).toBe('50');
      expect(evaluateExpr('10 / 2')).toBe('5');
      expect(evaluateExpr('2 ^ 3')).toBe('8');
      expect(evaluateExpr('5 > 3')).toBe('1');
      expect(evaluateExpr('2 == 3')).toBe('0');
      expect(evaluateExpr('10 > 5 and 2 < 4')).toBe('1');
    });

    it('replaces magic variables like {{PAGENAME}} and {{CURRENTYEAR}}', () => {
      const currentYear = String(new Date().getFullYear());
      const res = processParserFunctionsAndVariables('Artigo: {{PAGENAME}} criado em {{CURRENTYEAR}} na {{SITENAME}}.', 'Albert Einstein');

      expect(res).toContain('Artigo: Albert Einstein');
      expect(res).toContain(`criado em ${currentYear}`);
      expect(res).toContain('WikiZero');
    });
  });

  describe('Real-World Wikipedia Article Syntax Samples', () => {
    it('parses real Wikipedia article excerpt with infobox, refs, headings, and math', () => {
      const sample = `
{{Infobox
| nome = Mecânica Quântica
| subtitulo = Teoria Física
}}

A '''mecânica quântica''' é a teoria fundamental da física que descreve a natureza nas escalas atômica e subatômica.<ref name="dirac">Dirac, P. A. M. (1930). The Principles of Quantum Mechanics.</ref>

== Equação de Schrödinger ==
A evolução temporal de um estado quântico é dada por:
<math display="block">i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi</math>

== Propriedades fundamentais ==
* Quantização da energia
* Dualidade onda-partícula
* Princípio da incerteza de Heisenberg<ref name="heisenberg">Heisenberg, W. (1927). Über den anschaulichen Inhalt der quantentheoretischen Kinematik und Mechanik.</ref>

{{reflist}}
[[Categoria:Física Quântica]]
`;

      const result = parseWikitext(sample, undefined, 'Mecânica Quântica');

      expect(result.categories).toContain('Física Quântica');
      expect(result.references.length).toBe(2);
      expect(result.toc.length).toBe(2);
      expect(result.html).toContain('wiki-infobox');
      expect(result.html).toContain('wiki-math-block');
      expect(result.html).toContain('references-section');
    });
  });
});
