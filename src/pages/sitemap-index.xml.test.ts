import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, loadBlogSitemaps, parseBlogSitemaps } from './sitemap-index.xml';

const HTTP_OK = 200;
const HTTP_ERROR = 500;
const BLOG = 'https://blog.jaysonknight.com';
const BLOG_SITEMAP_COUNT = 2;

const makeContext = (site = 'https://jaysonknight.com/') =>
  ({
    site: new URL(site),
    url: new URL('https://jaysonknight.com/sitemap-index.xml'),
  }) as Parameters<typeof GET>[0];

const BLOG_INDEX = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BLOG}/sitemap-posts.xml</loc>
    <lastmod>2026-11-19T03:35:50.814Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BLOG}/sitemap-pages.xml</loc>
  </sitemap>
</sitemapindex>`;

const stubBlogFetch = (impl: () => Promise<Response>) => vi.stubGlobal('fetch', vi.fn(impl));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseBlogSitemaps', () => {
  it('reads each child sitemap and its lastmod', () => {
    const entries = parseBlogSitemaps(BLOG_INDEX);
    expect(entries.map((entry) => entry.path)).toEqual([`${BLOG}/sitemap-posts.xml`, `${BLOG}/sitemap-pages.xml`]);
    expect(entries[0].lastmod).toBe('2026-11-19T03:35:50.814Z');
    expect(Number.isNaN(Date.parse(entries[1].lastmod))).toBe(false);
  });

  it('ignores sitemaps that are not on the blog origin and plain page entries', () => {
    const xml = `<sitemapindex>
      <sitemap><loc>https://evil.example/sitemap.xml</loc></sitemap>
      <sitemap><loc>${BLOG}.evil.example/sitemap.xml</loc></sitemap>
      <url><loc>${BLOG}/posts/a</loc></url>
    </sitemapindex>`;
    expect(parseBlogSitemaps(xml)).toEqual([]);
  });

  it('falls back to the deploy timestamp when lastmod is not a date', () => {
    const [entry] = parseBlogSitemaps(
      `<sitemap><loc>${BLOG}/sitemap-posts.xml</loc><lastmod>not a date</lastmod></sitemap>`
    );
    expect(Number.isNaN(Date.parse(entry.lastmod))).toBe(false);
  });
});

describe('loadBlogSitemaps', () => {
  it('uses the blog index when it can be read', async () => {
    const entries = await loadBlogSitemaps(async () => new Response(BLOG_INDEX, { status: HTTP_OK }));
    expect(entries).toHaveLength(BLOG_SITEMAP_COUNT);
  });

  it('falls back to the post sitemap on an error response, an empty index, or a network failure', async () => {
    const fallback = [`${BLOG}/sitemap-posts.xml`];
    const errored = await loadBlogSitemaps(async () => new Response('nope', { status: HTTP_ERROR }));
    const empty = await loadBlogSitemaps(async () => new Response('<sitemapindex></sitemapindex>', { status: HTTP_OK }));
    const failed = await loadBlogSitemaps(async () => {
      throw new Error('network down');
    });
    expect([errored, empty, failed].map((entries) => entries.map((entry) => entry.path))).toEqual([
      fallback,
      fallback,
      fallback,
    ]);
  });
});

describe('GET /sitemap-index.xml', () => {
  it('returns a valid sitemapindex that lists this site and the blog sitemaps', async () => {
    stubBlogFetch(async () => new Response(BLOG_INDEX, { status: HTTP_OK }));
    const response = (await GET(makeContext())) as Response;

    expect(response.status).toBe(HTTP_OK);
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');

    const body = await response.text();
    expect(body).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(body).toContain('<loc>https://jaysonknight.com/sitemap.xml</loc>');
    expect(body).toContain(`<loc>${BLOG}/sitemap-posts.xml</loc>`);
    expect(body).toContain(`<loc>${BLOG}/sitemap-pages.xml</loc>`);
    expect(body).toContain('<lastmod>');
  });

  it('still lists this site and the blog posts when the blog is unreachable', async () => {
    stubBlogFetch(async () => {
      throw new Error('network down');
    });
    const body = await ((await GET(makeContext())) as Response).text();

    expect(body).toContain('<loc>https://jaysonknight.com/sitemap.xml</loc>');
    expect(body).toContain(`<loc>${BLOG}/sitemap-posts.xml</loc>`);
  });
});
