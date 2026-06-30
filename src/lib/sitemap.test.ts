import { describe, expect, it } from 'vitest';
import { buildSitemapIndexXml, buildUrlsetXml, SITEMAP_PAGES } from './sitemap';

const SITE = new URL('https://jaysonknight.com/');
const LASTMOD = '2026-06-30T00:00:00.000Z';

describe('buildUrlsetXml', () => {
  it('renders one <url> entry per page with absolute locs', () => {
    const xml = buildUrlsetXml(SITEMAP_PAGES, SITE, LASTMOD);

    for (const page of SITEMAP_PAGES) {
      expect(xml).toContain(`<loc>${new URL(page.path, SITE).href}</loc>`);
    }
    expect(xml).toContain(`<lastmod>${LASTMOD}</lastmod>`);
  });

  it('escapes XML-significant characters in paths', () => {
    const xml = buildUrlsetXml(
      [{ path: '/a&b', changeFrequency: 'monthly', priority: 0.5 }],
      SITE,
      LASTMOD
    );

    expect(xml).toContain('/a&amp;b');
    expect(xml).not.toContain('/a&b<');
  });
});

describe('buildSitemapIndexXml', () => {
  it('renders one <sitemap> entry per provided entry', () => {
    const xml = buildSitemapIndexXml([{ path: '/sitemap.xml', lastmod: LASTMOD }], SITE);

    expect(xml).toContain('<loc>https://jaysonknight.com/sitemap.xml</loc>');
    expect(xml).toContain(`<lastmod>${LASTMOD}</lastmod>`);
  });
});
