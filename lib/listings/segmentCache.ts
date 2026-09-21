// Server-side cache for a whole Properties segment, keyed by segment name.
//
// Next's built-in `fetch(..., { next: { revalidate } })` data cache silently
// refuses anything over 2MB (confirmed live: "items over 2MB can not be
// cached" for ggnSaleProperties at 48MB) — so relying on it here means every
// request re-downloads and re-parses the full segment from the upstream
// homz-scrape endpoint, taking 15-20+ seconds instead of being cached at all.
// This is the same problem the client-side cache in lib/scraping/homzbackend.ts
// already works around with its own in-memory Map; this is that same fix,
// server-side, since Next's own cache can't be used for a payload this size.
//
// Module-level state is process-lifetime, not request-lifetime — it persists
// across requests within one warm server instance (dev server, or a warm
// serverless container) and resets on a cold start, which is an acceptable
// "best effort" cache for data that only actually changes once a day.

import { homzDataUrl, type RawHomzProperty } from "@/lib/scraping/homzbackend";
import { sortByImageFirst, sortByReraFirst, computeFacets, type ListingFacets } from "@/lib/listings/filters";
import { sanitizeSegment } from "@/lib/intelligence/dataQuality";

const TTL_MS = 60 * 60 * 1000; // 1h — well under the daily export cadence
// 25000 covers the real max segment total seen live (ggnSaleProperties:
// 20,957) with headroom for growth. Was 10,000 — silently capped Sale at
// 47.7% of real inventory and Rent (12,945 real) at 77.3%, sitewide (this is
// the shared server-side cache /api/listings and the buy/rent/commercial
// pagination pages both read from). Found via SEO audit C-02 (2026-09-08).
const UPSTREAM_LIMIT = 25_000;

type CacheEntry = {
  data: RawHomzProperty[];
  // sortByReraFirst(sortByImageFirst(data)) and computeFacets(sorted) are
  // both deterministic for as long as `data` itself is cached, and neither
  // depends on any per-request filter -- /api/listings and
  // PaginatedListingPage's getAllSorted() both used to recompute these two
  // full-array passes on every single call (every filter click / page view
  // for the API route, running on real visitor traffic, not just crawlers).
  // Computing them once here, alongside the raw fetch, and caching them for
  // the same TTL removes that entirely -- 2026-09-16, see
  // docs/seo/implementation-status.md's Active CPU baseline section.
  sorted: RawHomzProperty[];
  facets: ListingFacets;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<CacheEntry>>();

async function loadSegment(segment: string): Promise<CacheEntry> {
  const hit = cache.get(segment);
  if (hit && hit.expiresAt > Date.now()) return hit;

  const pending = inFlight.get(segment);
  if (pending) return pending;

  const request = (async () => {
    // Explicitly opt out of Next's data cache (`cache: "no-store"`) rather
    // than letting it attempt and silently fail per-request — the module
    // Map above is this route's actual cache.
    const res = await fetch(homzDataUrl(segment, 1, UPSTREAM_LIMIT), { cache: "no-store" });
    if (!res.ok) throw new Error(`upstream ${res.status} for segment ${segment}`);
    const payload = await res.json();
    const raw: RawHomzProperty[] = Array.isArray(payload?.results) ? payload.results : [];
    // 2026-09-21, per the 21 Sep audit: corrections happen here, at the one
    // boundary every consumer reads through, so a fix reaches the grid, the
    // category pages, the sector medians, the sitemap and the structured data
    // together rather than page by page. Two things are corrected —
    // competitor prose that leaked into our own copy, and flats carrying
    // commercial property types. See lib/intelligence/dataQuality.ts.
    const data = sanitizeSegment(raw);
    const sorted = sortByReraFirst(sortByImageFirst(data));
    const facets = computeFacets(sorted);
    const entry: CacheEntry = { data, sorted, facets, expiresAt: Date.now() + TTL_MS };
    cache.set(segment, entry);
    return entry;
  })();

  inFlight.set(segment, request);
  try {
    return await request;
  } finally {
    inFlight.delete(segment);
  }
}

export async function getSegment(segment: string): Promise<RawHomzProperty[]> {
  return (await loadSegment(segment)).data;
}

/** Pre-sorted (RERA-first, then image-first) segment plus facets computed
 *  over that same full unfiltered segment — both cached alongside the raw
 *  fetch. Callers that used to sort/compute facets themselves on every call
 *  (the interactive /api/listings route, and PaginatedListingPage's
 *  getAllSorted) should read from here instead. */
export async function getSortedSegment(
  segment: string
): Promise<{ sorted: RawHomzProperty[]; facets: ListingFacets }> {
  const entry = await loadSegment(segment);
  return { sorted: entry.sorted, facets: entry.facets };
}
