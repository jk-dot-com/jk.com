import type { APIRoute } from 'astro';
import legacyUrls from '../../data/legacy-blog-urls.json';

export const prerender = false;

const BLOG = 'https://blog.jaysonknight.com';

/** Old Community Server / .Text post URLs (`archive/YYYY/MM/DD/<slug-or-id>.aspx`, lowercased) to blog post slugs. */
const LEGACY = legacyUrls as Record<string, string>;

const PERMANENT_REDIRECT = 301;
const NOT_FOUND = 404;

/**
 * Month and category listing pages from the Community Server era have no equivalent, so they go to the post list.
 * Matches "archive/2005/03.aspx", "archive/2005/03/31/default.aspx" and "archive/category/12.aspx";
 * rejects "archive/2005/03/31/Some-Post.aspx" (a single post, looked up in LEGACY instead).
 * Tester: https://regex101.com/?regex=%5Earchive%5C%2F(%5Cd%7B4%7D%5C%2F%5Cd%5Cd(%5C%2F%5Cd%5Cd)%3F(%5C%2Fdefault)%3F%7Ccategory%5C%2F.*%7Ctags%5C%2F.*)%5C.aspx%24&flags=i&flavor=javascript&testString=archive%2F2005%2F03.aspx%0Aarchive%2F2005%2F03%2F31%2Fdefault.aspx%0Aarchive%2Fcategory%2F12.aspx%0Aarchive%2F2005%2F03%2F31%2FSome-Post.aspx
 */
const LEGACY_LISTING = /^archive\/(\d{4}\/\d\d(\/\d\d)?(\/default)?|category\/.*|tags\/.*)\.aspx$/i;

/**
 * Where an old `/blog/...` URL now lives, or null when it no longer exists.
 *
 * Two generations of URLs are still listed by Google: WordPress permalinks (`/blog/some-post/`,
 * `/blog/2019/05/some-post/`) and, before that, Community Server / .Text permalinks
 * (`/blog/archive/2005/03/23/Some-Post.aspx`). The latter are looked up in the rebuilt-posts map.
 */
export const blogDestination = (path: string | undefined): string | null => {
  const segments = (path ?? '').split('/').filter(Boolean);
  const [first, second] = segments;

  if (segments.length === 0) return `${BLOG}/posts`;
  if (segments.length === 1 && first === 'feed') return `${BLOG}/rss.xml`;
  // Matches "default.aspx" and "Archive.aspx" (the old blog home and archive index); rejects "about.aspx".
  // Tester: https://regex101.com/?regex=%5E(default%7Carchive)%5C.aspx%24&flags=i&flavor=javascript&testString=default.aspx%0AArchive.aspx%0Aabout.aspx
  if (segments.length === 1 && /^(default|archive)\.aspx$/i.test(first)) return `${BLOG}/posts`;
  if (first === 'category' && second) return `${BLOG}/category/${encodeURIComponent(second)}`;
  if (first === 'tag' && second) return `${BLOG}/tag/${encodeURIComponent(second)}`;

  if (first.toLowerCase() === 'archive') {
    const joined = segments.join('/');
    const slug = Object.hasOwn(LEGACY, joined.toLowerCase()) ? LEGACY[joined.toLowerCase()] : undefined;
    if (slug) return `${BLOG}/posts/${encodeURIComponent(slug)}`;
    return LEGACY_LISTING.test(joined) ? `${BLOG}/posts` : null;
  }

  // WordPress permalinks end in the post slug, with or without /YYYY/MM/DD/ in front.
  return `${BLOG}/posts/${encodeURIComponent(segments[segments.length - 1])}`;
};

export const GET: APIRoute = ({ params }) => {
  const destination = blogDestination(params.path);
  return destination
    ? new Response(null, { status: PERMANENT_REDIRECT, headers: { Location: destination } })
    : new Response(null, { status: NOT_FOUND });
};
