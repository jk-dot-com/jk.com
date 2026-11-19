import type { APIRoute } from 'astro';
import { buildSitemapIndexXml, type SitemapIndexEntry } from '../lib/sitemap';

export const prerender = false;

const HTTP_OK = 200;
const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

// Computed once when the module loads (i.e. at deploy time), not per request —
// `lastmod` should reflect when the referenced sitemap last changed, not when
// the index itself was crawled.
const DEPLOY_TIMESTAMP = new Date().toISOString();

const BLOG_ORIGIN = 'https://blog.jaysonknight.com';
const BLOG_FETCH_TIMEOUT_MS = 3000;

/** Listed when the blog's own sitemap index can't be read, so crawlers still find its posts. */
const BLOG_FALLBACK_SITEMAPS = ['/sitemap-posts.xml'];

/**
 * One child sitemap in the blog's index, with an optional lastmod.
 * Matches "<sitemap><loc>https://blog.jaysonknight.com/sitemap-posts.xml</loc><lastmod>2026-11-19</lastmod></sitemap>"
 * and the same without lastmod; rejects "<url><loc>https://blog.jaysonknight.com/posts/a</loc></url>" (a page, not a sitemap).
 * Tester: https://regex101.com/?regex=%3Csitemap%3E%5Cs*%3Cloc%3E(%5B%5E%3C%5D%2B)%3C%2Floc%3E(%3F%3A%5Cs*%3Clastmod%3E(%5B%5E%3C%5D%2B)%3C%2Flastmod%3E)%3F%5Cs*%3C%2Fsitemap%3E&flags=g&flavor=javascript&testString=%3Csitemap%3E%0A%3Cloc%3Ehttps%3A%2F%2Fblog.jaysonknight.com%2Fsitemap-posts.xml%3C%2Floc%3E%0A%3Clastmod%3E2026-11-19T03%3A35%3A50.814Z%3C%2Flastmod%3E%0A%3C%2Fsitemap%3E%0A%3Csitemap%3E%3Cloc%3Ehttps%3A%2F%2Fblog.jaysonknight.com%2Fsitemap-pages.xml%3C%2Floc%3E%3C%2Fsitemap%3E%0A%3Curl%3E%3Cloc%3Ehttps%3A%2F%2Fx.test%2F%3C%2Floc%3E%3C%2Furl%3E
 */
const BLOG_SITEMAP_ENTRY = /<sitemap>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/sitemap>/g;

/**
 * Child sitemaps listed in the blog's sitemap index. Only locations on the blog's own origin are kept, so a
 * malformed or tampered response can't make this index point somewhere else.
 */
export const parseBlogSitemaps = (xml: string): SitemapIndexEntry[] =>
  [...xml.matchAll(BLOG_SITEMAP_ENTRY)]
    .filter(([, loc]) => loc.startsWith(`${BLOG_ORIGIN}/`))
    .map(([, loc, lastmod]) => ({
      path: loc,
      lastmod: lastmod && !Number.isNaN(Date.parse(lastmod)) ? lastmod : DEPLOY_TIMESTAMP,
    }));

/**
 * A sitemap index can't list another index, so the blog's child sitemaps (posts, pages, ...) are read from
 * its index at request time and listed here. That keeps this index correct when the blog adds a collection
 * or its post sitemap grows past one page.
 */
export const loadBlogSitemaps = async (fetchImpl: typeof fetch = fetch): Promise<SitemapIndexEntry[]> => {
  try {
    const response = await fetchImpl(`${BLOG_ORIGIN}/sitemap.xml`, {
      headers: { Accept: 'application/xml' },
      signal: AbortSignal.timeout(BLOG_FETCH_TIMEOUT_MS),
    });
    if (response.ok) {
      const entries = parseBlogSitemaps(await response.text());
      if (entries.length > 0) return entries;
    }
  } catch {
    // Network error or timeout: fall through to the static list.
  }
  return BLOG_FALLBACK_SITEMAPS.map((path) => ({ path: `${BLOG_ORIGIN}${path}`, lastmod: DEPLOY_TIMESTAMP }));
};

/**
 * Indexes every standalone sitemap the site publishes: this site's own `sitemap.xml` and the child
 * sitemaps of blog.jaysonknight.com, so Google, Bing and others find the blog's posts from one place.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const siteUrl = site ?? new URL(url.origin);
  const xml = buildSitemapIndexXml(
    [{ path: '/sitemap.xml', lastmod: DEPLOY_TIMESTAMP }, ...(await loadBlogSitemaps())],
    siteUrl
  );

  return new Response(xml, {
    status: HTTP_OK,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  });
};
