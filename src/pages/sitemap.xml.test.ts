import { describe, expect, it } from 'vitest';
import { GET } from './sitemap.xml';

const makeContext = (site = 'https://jaysonknight.com/') =>
  ({
    site: new URL(site),
    url: new URL('https://jaysonknight.com/sitemap.xml'),
  }) as Parameters<typeof GET>[0];

describe('GET /sitemap.xml', () => {
  it('returns a valid urlset XML document', async () => {
    const response = (await GET(makeContext())) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');

    const body = await response.text();
    expect(body).toMatch(/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    expect(body).toContain('<loc>https://jaysonknight.com/</loc>');
    expect(body).toContain('<loc>https://jaysonknight.com/blog</loc>');
  });

  it('excludes noindex pages and API routes', async () => {
    const response = (await GET(makeContext())) as Response;
    const body = await response.text();

    expect(body).not.toContain('/privacy');
    expect(body).not.toContain('/404');
    expect(body).not.toContain('/api/');
  });

  it('falls back to the request origin when site is not configured', async () => {
    const response = (await GET({
      site: undefined,
      url: new URL('https://example.com/sitemap.xml'),
    } as Parameters<typeof GET>[0])) as Response;
    const body = await response.text();

    expect(body).toContain('<loc>https://example.com/</loc>');
  });
});
