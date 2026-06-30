import type { APIRoute } from 'astro';
import { buildUrlsetXml, SITEMAP_PAGES } from '../lib/sitemap';

export const prerender = false;

const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

export const GET: APIRoute = ({ site, url }) => {
  const siteUrl = site ?? new URL(url.origin);
  const lastmod = new Date().toISOString();
  const xml = buildUrlsetXml(SITEMAP_PAGES, siteUrl, lastmod);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  });
};
