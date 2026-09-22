// The sitemap's segment list, in one place (2026-09-22).
//
// app/sitemap.ts declares these for Next's generateSitemaps() convention, and
// app/sitemap-index.xml/route.ts has to list the same ids in its
// <sitemapindex>. Those were two hand-maintained copies with a comment saying
// "must match app/sitemap.ts's own SEGMENT_IDS exactly" — which is a comment
// asking a future reader to do what a shared constant does for free, and
// adding the 'comparisons' segment for checklist item 16 was about to prove
// it: an id added in one file and missed in the other produces a segment
// Google is never told about, silently.
//
// The original note said importing was unsafe because generateSitemaps() is a
// route-config convention. That is true of the EXPORT, not of an import: a
// plain constant module has no Next semantics and both files can read it.

export const SITEMAP_SEGMENT_IDS = [
  'projects',
  'sectors',
  'developers',
  'comparisons',
  'buy',
  'rent',
  'commercial',
  'content',
] as const;

export type SitemapSegmentId = (typeof SITEMAP_SEGMENT_IDS)[number];
