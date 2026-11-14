import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  clearBrowserCompatibilityForce,
  evaluateBrowserCompatibility,
  isBrowserCompatibilityForced,
  parseBrowserFromUserAgent,
  setBrowserCompatibilityForced,
} from '../src/utils/browserCompatibility';
import { BrowserCompatibilityGatekeeper } from '../src/components/BrowserCompatibilityGatekeeper';

const MODERN_FEATURES = {
  promise: true,
  promiseAllSettled: true,
  mapAndSet: true,
  symbol: true,
  fetch: true,
  abortController: true,
  urlApi: true,
  textEncoder: true,
  intlDateTime: true,
  resizeObserver: true,
  intersectionObserver: true,
  mutationObserver: true,
  cssSupports: true,
  cssCustomProperties: true,
  cssGrid: true,
  cssFlexGap: true,
  cssWhereSelector: true,
  localStorageAvailable: true,
};

describe('Verificação de Compatibilidade de Navegadores', () => {
  beforeEach(() => {
    clearBrowserCompatibilityForce();
  });

  describe('Identificação via User-Agent', () => {
    it('identifica navegadores modernos corretamente', () => {
      const chrome = parseBrowserFromUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      );
      expect(chrome.name).toBe('Google Chrome');
      expect(chrome.majorVersion).toBe(126);
      expect(chrome.engine).toBe('Blink');

      const firefox = parseBrowserFromUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0'
      );
      expect(firefox.name).toBe('Mozilla Firefox');
      expect(firefox.majorVersion).toBe(128);
      expect(firefox.engine).toBe('Gecko');

      const safari = parseBrowserFromUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
      );
      expect(safari.name).toBe('Apple Safari');
      expect(safari.majorVersion).toBe(17);
      expect(safari.engine).toBe('WebKit');
    });

    it('identifica navegadores e motores legados incompatíveis', () => {
      const ie11 = parseBrowserFromUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
      );
      expect(ie11.name).toBe('Internet Explorer');
      expect(ie11.engine).toBe('Trident');

      const oldEdge = parseBrowserFromUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19041'
      );
      expect(oldEdge.name).toBe('Microsoft Edge Legado (EdgeHTML)');
      expect(oldEdge.engine).toBe('EdgeHTML');

      const operaMini = parseBrowserFromUserAgent(
        'Opera/9.80 (Android; Opera Mini/36.2.2254/119.132; U; pt) Presto/2.12.423 Version/12.16'
      );
      expect(operaMini.name).toBe('Opera Mini');
      expect(operaMini.engine).toBe('Presto');
    });
  });

  describe('Avaliação de Compatibilidade (evaluateBrowserCompatibility)', () => {
    it('aprova navegadores modernos com todos os recursos suportados', () => {
      const report = evaluateBrowserCompatibility({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        search: '',
        features: MODERN_FEATURES,
      });

      expect(report.isCompatible).toBe(true);
      expect(report.criticalCount).toBe(0);
      expect(report.issues).toHaveLength(0);
    });

    it('bloqueia Internet Explorer e EdgeHTML legado', () => {
      const ieReport = evaluateBrowserCompatibility({
        userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
        search: '',
        features: MODERN_FEATURES,
      });
      expect(ieReport.isCompatible).toBe(false);
      expect(ieReport.criticalCount).toBeGreaterThan(0);

      const edgeHtmlReport = evaluateBrowserCompatibility({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/18.18362',
        search: '',
        features: MODERN_FEATURES,
      });
      expect(edgeHtmlReport.isCompatible).toBe(false);
    });

    it('bloqueia versões muito antigas de Chrome, Firefox e Safari', () => {
      const oldChrome = evaluateBrowserCompatibility({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/72.0.3626.121 Safari/537.36',
        search: '',
        features: MODERN_FEATURES,
      });
      expect(oldChrome.isCompatible).toBe(false);

      const oldFirefox = evaluateBrowserCompatibility({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0',
        search: '',
        features: MODERN_FEATURES,
      });
      expect(oldFirefox.isCompatible).toBe(false);

      const oldSafari = evaluateBrowserCompatibility({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Safari/605.1.15',
        search: '',
        features: MODERN_FEATURES,
      });
      expect(oldSafari.isCompatible).toBe(false);
    });

    it('bloqueia quando APIs JS ou recursos CSS essenciais estão ausentes', () => {
      const missingCssReport = evaluateBrowserCompatibility({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
        search: '',
        features: {
          ...MODERN_FEATURES,
          cssWhereSelector: false,
          fetch: false,
        },
      });

      expect(missingCssReport.isCompatible).toBe(false);
      expect(missingCssReport.issues.some((i) => i.id === 'missing-css-features')).toBe(true);
      expect(missingCssReport.issues.some((i) => i.id === 'missing-js-apis')).toBe(true);
    });

    it('permite simular incompatibilidade via query string ?compatTest=incompatible', () => {
      const simulated = evaluateBrowserCompatibility({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
        search: '?compatTest=incompatible',
        features: MODERN_FEATURES,
      });

      expect(simulated.isCompatible).toBe(false);
      expect(simulated.isSimulated).toBe(true);
    });

    it('persiste e limpa corretamente a opção de forçar entrada', () => {
      expect(isBrowserCompatibilityForced()).toBe(false);
      setBrowserCompatibilityForced(true);
      expect(isBrowserCompatibilityForced()).toBe(true);
      clearBrowserCompatibilityForce();
      expect(isBrowserCompatibilityForced()).toBe(false);
    });
  });

  describe('Componente BrowserCompatibilityGatekeeper', () => {
    it('renderiza o conteúdo da Wiki diretamente quando o navegador é compatível', () => {
      const compatibleReport = evaluateBrowserCompatibility({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
        search: '',
        features: MODERN_FEATURES,
      });

      const html = renderToStaticMarkup(
        <BrowserCompatibilityGatekeeper initialReport={compatibleReport} initialForced={false}>
          <div data-testid="wiki-app">Conteúdo da Enciclopédia</div>
        </BrowserCompatibilityGatekeeper>
      );

      expect(html).toContain('Conteúdo da Enciclopédia');
      expect(html).not.toContain('Este navegador não é compatível com o Wiki-site');
    });

    it('exibe tela de incompatibilidade com opção de forçar entrada em caso de erro positivo', () => {
      const incompatibleReport = evaluateBrowserCompatibility({
        userAgent: 'Mozilla/5.0 (compatible; MSIE 11.0; Windows NT 6.1; Trident/7.0)',
        search: '',
        features: MODERN_FEATURES,
      });

      const html = renderToStaticMarkup(
        <BrowserCompatibilityGatekeeper initialReport={incompatibleReport} initialForced={false}>
          <div data-testid="wiki-app">Conteúdo da Enciclopédia</div>
        </BrowserCompatibilityGatekeeper>
      );

      expect(html).toContain('Este navegador não é compatível com o Wiki-site');
      expect(html).toContain('erro positivo');
      expect(html).toContain('Forçar entrada no Wiki-site');
      expect(html).toContain('Internet Explorer');
      expect(html).not.toContain('Conteúdo da Enciclopédia');
    });

    it('libera acesso ao Wiki-site quando o usuário força a entrada', () => {
      const incompatibleReport = evaluateBrowserCompatibility({
        userAgent: 'Mozilla/5.0 (compatible; MSIE 11.0; Windows NT 6.1; Trident/7.0)',
        search: '',
        features: MODERN_FEATURES,
      });

      const html = renderToStaticMarkup(
        <BrowserCompatibilityGatekeeper initialReport={incompatibleReport} initialForced={true}>
          <div data-testid="wiki-app">Conteúdo da Enciclopédia</div>
        </BrowserCompatibilityGatekeeper>
      );

      expect(html).toContain('Conteúdo da Enciclopédia');
      expect(html).toContain('Entrada forçada ativa');
    });
  });
});
