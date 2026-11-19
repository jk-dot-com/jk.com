import { describe, expect, it } from 'vitest';
import { lowercaseBlogPrefix } from './blog-case';

describe('lowercaseBlogPrefix', () => {
  it('lowercases a capitalised /blog prefix and keeps the rest of the path', () => {
    expect(lowercaseBlogPrefix('/BLOG/archive/2005/02/15/1013.aspx')).toBe('/blog/archive/2005/02/15/1013.aspx');
    expect(lowercaseBlogPrefix('/Blog/Archive/2005/02/15/Some-Post.aspx')).toBe('/blog/Archive/2005/02/15/Some-Post.aspx');
    expect(lowercaseBlogPrefix('/Blog')).toBe('/blog');
  });

  it('leaves lowercase, other and unrelated paths alone', () => {
    expect(lowercaseBlogPrefix('/blog/archive/2005/02/15/1013.aspx')).toBeNull();
    expect(lowercaseBlogPrefix('/blog')).toBeNull();
    expect(lowercaseBlogPrefix('/blogger')).toBeNull();
    expect(lowercaseBlogPrefix('/Bloggers/x')).toBeNull();
    expect(lowercaseBlogPrefix('/')).toBeNull();
    expect(lowercaseBlogPrefix('/privacy')).toBeNull();
  });
});
