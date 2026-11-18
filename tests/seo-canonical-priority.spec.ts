import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { CANONICAL_BASE_URL } from '../src/utils/seoManager';

const ROOT = process.cwd();
const PRIMARY_DOMAIN = 'https://wikizero.wazzimagiygg.com';

describe('SEO e Priorização de Domínio Oficial (wikizero.wazzimagiygg.com)', () => {
  it('define CANONICAL_BASE_URL como https://wikizero.wazzimagiygg.com', () => {
    expect(CANONICAL_BASE_URL).toBe(PRIMARY_DOMAIN);
  });

  it('index.html prioriza wikizero.wazzimagiygg.com em canonical, hreflang, OpenGraph, Twitter e JSON-LD válido', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');

    expect(html).toContain(`<link rel="canonical" href="${PRIMARY_DOMAIN}/" />`);
    expect(html).toContain(`<link rel="alternate" hreflang="pt-BR" href="${PRIMARY_DOMAIN}/" />`);
    expect(html).toContain(`<link rel="alternate" hreflang="x-default" href="${PRIMARY_DOMAIN}/" />`);
    expect(html).toContain(`<meta property="og:url" content="${PRIMARY_DOMAIN}/" />`);
    expect(html).toContain(`<meta property="og:image" content="${PRIMARY_DOMAIN}/pwa-512x512.png" />`);
    expect(html).toContain('<meta name="twitter:domain" content="wikizero.wazzimagiygg.com" />');
    expect(html).toContain(`<meta name="twitter:url" content="${PRIMARY_DOMAIN}/" />`);
    expect(html).not.toContain('ais-pre-ul5azgclkwy3zltg3iyxlw-842441289091.us-east1.run.app');

    // Valida sintaxe e entidades do bloco JSON-LD
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match![1]);
    expect(Array.isArray(parsed['@graph'])).toBe(true);
    const types = parsed['@graph'].map((item: { '@type': string }) => item['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('WebApplication');
    expect(types).toContain('Organization');
    expect(types).toContain('Person');
    expect(types).toContain('ProfilePage');
    expect(types).toContain('FAQPage');

    const website = parsed['@graph'].find((item: { '@type': string }) => item['@type'] === 'WebSite');
    expect(website.url).toBe(`${PRIMARY_DOMAIN}/`);
    expect(website.potentialAction.target.urlTemplate).toContain(`${PRIMARY_DOMAIN}/?uid=search`);
  });

  it('robots.txt, sitemap.xml e opensearch.xml apontam exclusivamente para wikizero.wazzimagiygg.com', () => {
    const robots = fs.readFileSync(path.join(ROOT, 'public/robots.txt'), 'utf-8');
    const sitemap = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf-8');
    const opensearch = fs.readFileSync(path.join(ROOT, 'public/opensearch.xml'), 'utf-8');

    expect(robots).toContain(`Sitemap: ${PRIMARY_DOMAIN}/sitemap.xml`);
    expect(robots).toContain('Host: wikizero.wazzimagiygg.com');
    expect(robots).toContain('User-agent: Wikimedia\nDisallow: /');
    expect(robots).toContain('User-agent: Wikipedia\nDisallow: /');
    expect(robots).toContain('User-agent: MediaWiki\nDisallow: /');
    expect(robots).toContain('User-agent: Pywikibot\nDisallow: /');
    expect(robots).not.toContain('ais-pre-ul5azgclkwy3zltg3iyxlw');

    expect(sitemap).toContain(`<loc>${PRIMARY_DOMAIN}/</loc>`);
    expect(sitemap).toContain(`<loc>${PRIMARY_DOMAIN}/?uid=Special:AboutWikiWorldWeb</loc>`);
    expect(sitemap).toContain(`<loc>${PRIMARY_DOMAIN}/?uid=comparison</loc>`);
    expect(sitemap).not.toContain('ais-pre-ul5azgclkwy3zltg3iyxlw');

    expect(opensearch).toContain(`${PRIMARY_DOMAIN}/?uid=search`);
    expect(opensearch).not.toContain('ais-pre-ul5azgclkwy3zltg3iyxlw');
  });
});
