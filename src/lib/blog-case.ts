// Matches a path whose first segment spells "blog" with some capitals, such as "/BLOG/archive/2005/03/15/Post.aspx" or "/Blog".
// Rejects "/blog/archive/2005" (already lowercase) and "/blogger" (a different word).
// Tester: https://regex101.com/?regex=%5E%5C%2F(%3F!blog(%3F%3A%5C%2F%7C%24))%5BBb%5D%5BLl%5D%5BOo%5D%5BGg%5D(%3F%3D%5C%2F%7C%24)&testString=%2FBLOG%2Farchive%0A%2Fblog%2Farchive%0A%2Fblogger
const MIXED_CASE_BLOG = /^\/(?!blog(?:\/|$))[Bb][Ll][Oo][Gg](?=\/|$)/;

/**
 * Old Community Server links were written as `/Blog/...` and `/BLOG/...`, but routes are case-sensitive.
 * Returns the same path with a lowercase `/blog` prefix, or null when the path needs no change.
 */
export const lowercaseBlogPrefix = (pathname: string): string | null =>
  MIXED_CASE_BLOG.test(pathname) ? pathname.replace(MIXED_CASE_BLOG, '/blog') : null;
