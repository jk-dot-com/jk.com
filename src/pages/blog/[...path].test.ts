import { describe, expect, it } from 'vitest';
import { GET, blogDestination } from './[...path]';

const PERMANENT_REDIRECT = 301;
const NOT_FOUND = 404;

describe('/blog/... redirects to the blog', () => {
  it('maps a plain post permalink to /posts/<slug>', () => {
    expect(blogDestination('rust-on-the-edge')).toBe('https://blog.jaysonknight.com/posts/rust-on-the-edge');
  });

  it('ignores a trailing slash and dated WordPress prefixes', () => {
    expect(blogDestination('rust-on-the-edge/')).toBe('https://blog.jaysonknight.com/posts/rust-on-the-edge');
    expect(blogDestination('2019/05/rust-on-the-edge/')).toBe('https://blog.jaysonknight.com/posts/rust-on-the-edge');
  });

  it('maps the WordPress feed, categories and tags to their EmDash equivalents', () => {
    expect(blogDestination('feed')).toBe('https://blog.jaysonknight.com/rss.xml');
    expect(blogDestination('category/cloudflare')).toBe('https://blog.jaysonknight.com/category/cloudflare');
    expect(blogDestination('tag/zero-trust')).toBe('https://blog.jaysonknight.com/tag/zero-trust');
  });

  it('encodes unsafe characters instead of building an open redirect', () => {
    expect(blogDestination('..%2F..%2Fevil')).toBe('https://blog.jaysonknight.com/posts/..%252F..%252Fevil');
    expect(blogDestination('a b')).toBe('https://blog.jaysonknight.com/posts/a%20b');
  });

  it('responds with a permanent redirect', () => {
    const response = GET({ params: { path: 'hello-world/' } } as unknown as Parameters<typeof GET>[0]) as Response;
    expect(response.status).toBe(PERMANENT_REDIRECT);
    expect(response.headers.get('Location')).toBe('https://blog.jaysonknight.com/posts/hello-world');
  });
});

describe('/blog/archive/... (Community Server era) redirects', () => {
  const BLOG = 'https://blog.jaysonknight.com';

  it('maps a dated .aspx permalink to the rebuilt post, ignoring case', () => {
    expect(blogDestination('archive/2004/08/27/I_2700_ve-Got-GMail-Invites.aspx')).toBe(`${BLOG}/posts/ive-got-gmail-invites`);
    expect(blogDestination('ARCHIVE/2006/05/11/halo-3-trailer-_2D002D00_-wow.ASPX')).toBe(`${BLOG}/posts/halo-3-trailer-wow`);
  });

  it('maps an id-style permalink to the rebuilt post', () => {
    expect(blogDestination('archive/2005/02/15/1013.aspx')).toBe(`${BLOG}/posts/community-server-migration-script-round-3`);
  });

  it('sends month, category and index pages to the post list', () => {
    expect(blogDestination('archive/2005/03.aspx')).toBe(`${BLOG}/posts`);
    expect(blogDestination('archive/category/12.aspx')).toBe(`${BLOG}/posts`);
    expect(blogDestination('default.aspx')).toBe(`${BLOG}/posts`);
    expect(blogDestination('archive.aspx')).toBe(`${BLOG}/posts`);
  });

  it('answers 404 for an archived post that was not recovered, instead of guessing a slug', () => {
    expect(blogDestination('archive/2005/03/23/A-Post-That-Was-Never-Archived.aspx')).toBeNull();
    const response = GET({ params: { path: 'archive/2005/03/23/A-Post-That-Was-Never-Archived.aspx' } } as unknown as Parameters<
      typeof GET
    >[0]) as Response;
    expect(response.status).toBe(NOT_FOUND);
  });

  it('does not treat inherited object keys as archived posts', () => {
    expect(blogDestination('archive/constructor')).toBeNull();
  });
});
