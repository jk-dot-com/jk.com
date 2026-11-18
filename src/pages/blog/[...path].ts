import type { APIRoute } from 'astro';

export const prerender = false;

const BLOG = 'https://blog.jaysonknight.com';

/**
 * Where an old `/blog/...` URL now lives. The blog used to be WordPress under this path, and Google
 * still lists those permalinks (for example `/blog/some-post/` or `/blog/2019/05/some-post/`).
 */
export const blogDestination = (path: string | undefined): string => {
  const segments = (path ?? '').split('/').filter(Boolean);
  const [first, second] = segments;

  if (segments.length === 1 && first === 'feed') return `${BLOG}/rss.xml`;
  if (first === 'category' && second) return `${BLOG}/category/${encodeURIComponent(second)}`;
  if (first === 'tag' && second) return `${BLOG}/tag/${encodeURIComponent(second)}`;
  if (segments.length === 0) return `${BLOG}/posts`;

  // WordPress permalinks end in the post slug, with or without /YYYY/MM/DD/ in front.
  return `${BLOG}/posts/${encodeURIComponent(segments[segments.length - 1])}`;
};

export const GET: APIRoute = ({ params }) =>
  new Response(null, { status: 301, headers: { Location: blogDestination(params.path) } });
