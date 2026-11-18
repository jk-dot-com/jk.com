import { describe, expect, it } from 'vitest';
import { GET, blogDestination } from './[...path]';

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
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://blog.jaysonknight.com/posts/hello-world');
  });
});
