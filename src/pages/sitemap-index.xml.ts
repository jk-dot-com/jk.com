import type { APIRoute } from 'astro';
import { buildSitemapIndexXml } from '../lib/sitemap';

export const prerender = false;

const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

/**
 * Indexes every standalone sitemap the site publishes. Today that's just
 * `sitemap.xml`, but new sitemaps (e.g. a future blog-post sitemap backed by
 * EmDash) can be appended here without changing how robots.txt or crawlers
 * discover them.
 */
export const GET: APIRoute = ({ site, url }) => {
  const siteUrl = site ?? new URL(url.origin);
  const lastmod = new Date().toISOString();
  const xml = buildSitemapIndexXml([{ path: '/sitemap.xml', lastmod }], siteUrl);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  });
};
