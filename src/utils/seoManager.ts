/**
 * ============================================================================
 * WIKIZERO DYNAMIC SEO & SEARCH ENGINE BOT MANAGER
 * ============================================================================
 * Dynamically updates document metadata, OpenGraph tags, canonical links,
 * and Schema.org JSON-LD Structured Data for search engine web crawlers
 * (Googlebot, Bingbot, DuckDuckBot, Baiduspider, YandexBot, Applebot).
 *
 * Direct competitive positioning against Wikipedia, MediaWiki, Wikidot, Fandom.
 */

import { WikiArticle, WikiPage, ViewMode } from '../types';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  article?: WikiArticle | null;
  page?: WikiPage | null;
  view?: ViewMode;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const BASE_URL = 'https://ais-pre-ul5azgclkwy3zltg3iyxlw-842441289091.us-east1.run.app';
const DEFAULT_TITLE = 'WikiZero - Enciclopédia Livre';
const DEFAULT_DESC =
  'WikiZero - A Enciclopédia Livre, Rápida e Sem Anúncios. Uma alternativa moderna e aberta à Wikipédia, MediaWiki, Wikidot e Fandom com editor wikitexto em tempo real, auditoria descentralizada, temas visuais e conformidade LGPD.';
const DEFAULT_KEYWORDS = [
  'WikiZero',
  'WazzimaGiygg',
  'Wazzimagiygg',
  'Caso Wazzimagiygg',
  'Caso Wazzimagiygg Wikipedia',
  'projetos WazzimaGiygg',
  'quem é WazzimaGiygg',
  'WazzimaGiygg a verdade',
  'alternativa à wikipedia',
  'alternativa wikipedia',
  'alternativa fandom',
  'fandom sem anuncios',
  'alternativa mediawiki',
  'alternativa wikidot',
  'enciclopedia livre',
  'enciclopédia aberta',
  'wiki colaborativa',
  'editor wikitexto',
  'enciclopedia online',
  'software livre',
  'enciclopedia sem anuncios',
];

/**
 * Updates a <meta> tag or creates it if it doesn't exist
 */
function setMetaTag(nameOrProperty: string, content: string, isProperty = false) {
  if (typeof document === 'undefined') return;

  const selector = isProperty
    ? `meta[property="${nameOrProperty}"]`
    : `meta[name="${nameOrProperty}"]`;

  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    if (isProperty) {
      element.setAttribute('property', nameOrProperty);
    } else {
      element.setAttribute('name', nameOrProperty);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Updates the <link rel="canonical"> tag
 */
function setCanonicalUrl(url: string) {
  if (typeof document === 'undefined') return;

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Injects or updates dynamic Schema.org JSON-LD
 */
function setJsonLd(id: string, data: object) {
  if (typeof document === 'undefined') return;

  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Remove dynamic JSON-LD when no longer in that view
 */
function removeJsonLd(id: string) {
  if (typeof document === 'undefined') return;
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}

/**
 * Main SEO synchronization function
 */
export function updateSEO(config: SEOConfig) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  let finalTitle = DEFAULT_TITLE;
  let finalDesc = DEFAULT_DESC;
  const keywords = [...DEFAULT_KEYWORDS, ...(config.keywords || [])];
  let canonicalUrl = BASE_URL + '/';

  // 1. If viewing an Article
  if (config.article) {
    const art = config.article;
    finalTitle = `${art.titulo} - WikiZero`;
    finalDesc =
      art.resumo ||
      (art.descricao
        ? art.descricao.replace(/^[=\s#*\[\]]+/, '').slice(0, 160)
        : `Leia sobre ${art.titulo} na WikiZero, a enciclopédia livre colaborativa.`);
    canonicalUrl = `${BASE_URL}/?uid=${encodeURIComponent(art.id)}`;

    // Generate Article Schema for search engines
    setJsonLd('dynamic-article-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: art.titulo,
      description: finalDesc,
      inLanguage: art.idioma || 'pt-BR',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      author: {
        '@type': 'Person',
        name: art.autor || 'Comunidade WikiZero',
      },
      publisher: {
        '@type': 'Organization',
        name: 'WikiZero',
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/pwa-512x512.png`,
        },
      },
      datePublished: art.dataCriacao || new Date().toISOString(),
      dateModified: art.dataEdicao || art.dataCriacao || new Date().toISOString(),
      articleSection: art.categoria || 'Enciclopédia Geral',
    });
  } else {
    removeJsonLd('dynamic-article-jsonld');

    // 2. View-specific SEO targeting
    if (config.view === 'wazzimagiygg') {
      finalTitle = 'WazzimaGiygg - Portal Oficial, Projetos e A Verdade sobre o Caso Wikipédia';
      finalDesc =
        'Portal oficial e ecossistema de projetos de WazzimaGiygg (WikiZero, Wiki-alternative, Dossiê A Verdade e Suporte). Conheça a verdade factual e documental sobre o Caso Wazzimagiygg na Wikipédia.';
      canonicalUrl = `${BASE_URL}/?uid=wazzimagiygg`;
      keywords.push(
        'WazzimaGiygg',
        'Wazzimagiygg',
        'Caso Wazzimagiygg',
        'Caso Wazzimagiygg Wikipedia',
        'Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg',
        'pedidos a verificadores caso wazzimagiygg',
        'quem é WazzimaGiygg',
        'WazzimaGiygg projetos',
        'WazzimaGiygg a verdade',
        'WazzimaGiygg dossie',
        'wazzimagiygg.com',
        'wazzimagiygg.com/averdade',
        'support.wazzimagiygg.com',
        'WazzimaGiygg WikiZero',
        'WazzimaGiygg wiki alternative',
        'resposta caso wazzimagiygg'
      );

      // Injeta Schema.org específico para desbancar o link difamatório da Wikipédia
      setJsonLd('dynamic-wazzima-jsonld', {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ProfilePage',
            '@id': `${BASE_URL}/?uid=wazzimagiygg#profilepage`,
            'url': `${BASE_URL}/?uid=wazzimagiygg`,
            'name': 'WazzimaGiygg - Portal Oficial, Projetos e A Verdade sobre o Caso Wikipédia',
            'description':
              'Página oficial e central de projetos desenvolvidos por WazzimaGiygg, com esclarecimento detalhado e provas documentais sobre perseguições burocráticas e abusos de verificadores da Wikipédia.',
            'mainEntity': {
              '@type': 'Person',
              '@id': 'https://wazzimagiygg.com/#person',
              'name': 'WazzimaGiygg',
              'alternateName': ['Wazzimagiygg', 'Wazzima Giygg', 'Criador WikiZero'],
              'url': 'https://wazzimagiygg.com/',
              'sameAs': [
                'https://wazzimagiygg.com/',
                'https://wazzimagiygg.com/averdade/',
                'https://support.wazzimagiygg.com/',
                'https://github.com/WazzimaGiygg/Wiki-alternative',
                `${BASE_URL}/?uid=wazzimagiygg`
              ],
              'jobTitle': 'Desenvolvedor de Software e Criador da WikiZero',
              'knowsAbout': [
                'Enciclopédias Colaborativas Livres',
                'Wikitexto MediaWiki',
                'Software Livre Open Source',
                'Transparência Editorial ArbCom',
                'Sistemas Distribuídos em Tempo Real'
              ]
            },
            'mentions': [
              {
                '@type': 'WebPage',
                'name': 'Wikipédia:Pedidos a verificadores/Caso/Wazzimagiygg',
                'url': 'https://pt.wikipedia.org/wiki/Wikip%C3%A9dia:Pedidos_a_verificadores/Caso/Wazzimagiygg',
                'description':
                  'Página de pedido a verificadores na Wikipédia refutada documentalmente no dossiê A Verdade de WazzimaGiygg.'
              }
            ],
            'significantLink': [
              'https://wazzimagiygg.com/averdade/',
              'https://github.com/WazzimaGiygg/Wiki-alternative',
              'https://support.wazzimagiygg.com/',
              'https://wazzimagiygg.com/'
            ]
          },
          {
            '@type': 'Article',
            '@id': `${BASE_URL}/?uid=wazzimagiygg#article`,
            'headline': 'A Verdade dos Fatos sobre o Caso Wazzimagiygg na Wikipédia e os Projetos Oficiais',
            'description':
              'Esclarecimento oficial, refutação documentada sobre os pedidos a verificadores da Wikipédia e apresentação de todos os projetos de tecnologia livre de WazzimaGiygg.',
            'inLanguage': 'pt-BR',
            'author': {
              '@type': 'Person',
              'name': 'WazzimaGiygg',
              'url': 'https://wazzimagiygg.com/'
            },
            'publisher': {
              '@type': 'Organization',
              'name': 'WikiZero',
              'url': `${BASE_URL}/`,
              'logo': {
                '@type': 'ImageObject',
                'url': `${BASE_URL}/pwa-512x512.png`
              }
            }
          }
        ]
      });
    } else {
      removeJsonLd('dynamic-wazzima-jsonld');
    }

    if (config.view === 'comparison') {
      finalTitle = 'Comparativo: WikiZero vs Wikipédia, MediaWiki, Wikidot e Fandom';
      finalDesc =
        'Compare a WikiZero com a Wikipédia, MediaWiki, Wikidot e Fandom: sem anúncios invasivos, sem panelas burocráticas, com editor wikitexto rápido, múltiplos temas visuais e PWA.';
      canonicalUrl = `${BASE_URL}/?uid=comparison`;
      keywords.push(
        'wikizero vs wikipedia',
        'melhor que wikipedia',
        'fandom vs wikizero',
        'mediawiki vs wikizero',
        'wikidot vs wikizero',
        'wiki sem anuncios'
      );
    } else if (config.view === 'search') {
      finalTitle = 'Pesquisa Enciclopédica - WikiZero';
      finalDesc =
        'Pesquise milhões de tópicos, páginas e artigos livres na WikiZero com busca instantânea sem rastreamento.';
      canonicalUrl = `${BASE_URL}/?uid=search`;
    } else if (config.view === 'editor') {
      finalTitle = 'Editor Wikitexto Aberto - WikiZero';
      finalDesc =
        'Crie e edite artigos na WikiZero com suporte completo a wikitexto, visualização em tempo real e publicação instantânea.';
      canonicalUrl = `${BASE_URL}/?uid=editor`;
    } else if (config.view === 'recent-changes') {
      finalTitle = 'Mudanças Recentes e Histórico - WikiZero';
      finalDesc =
        'Acompanhe em tempo real todas as edições, novos artigos e atualizações na enciclopédia WikiZero.';
      canonicalUrl = `${BASE_URL}/?uid=recent-changes`;
    } else if (config.title) {
      finalTitle = `${config.title} - WikiZero`;
      if (config.description) {
        finalDesc = config.description;
      }
    }
  }

  // 3. Update Title & Meta Tags
  document.title = finalTitle;
  setMetaTag('description', finalDesc);
  setMetaTag('keywords', keywords.join(', '));
  setCanonicalUrl(canonicalUrl);

  // 4. Update OpenGraph & Twitter tags
  setMetaTag('og:title', finalTitle, true);
  setMetaTag('og:description', finalDesc, true);
  setMetaTag('og:url', canonicalUrl, true);
  setMetaTag('twitter:title', finalTitle);
  setMetaTag('twitter:description', finalDesc);

  // 5. Update BreadcrumbList Schema
  if (config.breadcrumbs && config.breadcrumbs.length > 0) {
    setJsonLd('dynamic-breadcrumbs-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: config.breadcrumbs.map((b, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: b.name,
        item: b.url.startsWith('http') ? b.url : `${BASE_URL}${b.url}`,
      })),
    });
  } else {
    removeJsonLd('dynamic-breadcrumbs-jsonld');
  }
}
