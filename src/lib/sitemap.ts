type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SitemapPage {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/**
 * Single source of truth for indexable routes. `noIndex` pages (404, privacy)
 * and non-page endpoints (api/*, og-image.png) are intentionally excluded —
 * keep this in sync with src/pages when adding/removing crawlable routes.
 */
export const SITEMAP_PAGES: SitemapPage[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
];

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const buildUrlsetXml = (pages: SitemapPage[], site: URL, lastmod: string): string => {
  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${escapeXml(new URL(page.path, site).href)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
};

export interface SitemapIndexEntry {
  path: string;
  lastmod: string;
}

export const buildSitemapIndexXml = (entries: SitemapIndexEntry[], site: URL): string => {
  const sitemaps = entries
    .map(
      (entry) => `  <sitemap>
    <loc>${escapeXml(new URL(entry.path, site).href)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>
`;
};
