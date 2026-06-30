import { describe, expect, it } from 'vitest';
import { GET } from './sitemap-index.xml';

const makeContext = (site = 'https://jaysonknight.com/') =>
  ({
    site: new URL(site),
    url: new URL('https://jaysonknight.com/sitemap-index.xml'),
  }) as Parameters<typeof GET>[0];

describe('GET /sitemap-index.xml', () => {
  it('returns a valid sitemapindex XML document referencing sitemap.xml', async () => {
    const response = (await GET(makeContext())) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');

    const body = await response.text();
    expect(body).toMatch(/<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    expect(body).toContain('<loc>https://jaysonknight.com/sitemap.xml</loc>');
    expect(body).toMatch(/<lastmod>[^<]+<\/lastmod>/);
  });
});
