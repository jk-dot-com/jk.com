import type { APIRoute } from 'astro';
import { buildUrlsetXml, SITEMAP_PAGES } from '../lib/sitemap';

export const prerender = false;

const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

// Computed once when the module loads (i.e. at deploy time), not per request —
// `lastmod` should reflect when content last changed, not when it was crawled.
const DEPLOY_TIMESTAMP = new Date().toISOString();

export const GET: APIRoute = ({ site, url }) => {
  const siteUrl = site ?? new URL(url.origin);
  const xml = buildUrlsetXml(SITEMAP_PAGES, siteUrl, DEPLOY_TIMESTAMP);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  });
};
