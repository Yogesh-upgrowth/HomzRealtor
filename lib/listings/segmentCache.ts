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

const TTL_MS = 60 * 60 * 1000; // 1h — well under the daily export cadence
const UPSTREAM_LIMIT = 10_000;

type CacheEntry = { data: RawHomzProperty[]; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<RawHomzProperty[]>>();

export async function getSegment(segment: string): Promise<RawHomzProperty[]> {
  const hit = cache.get(segment);
  if (hit && hit.expiresAt > Date.now()) return hit.data;

  const pending = inFlight.get(segment);
  if (pending) return pending;

  const request = (async () => {
    // Explicitly opt out of Next's data cache (`cache: "no-store"`) rather
    // than letting it attempt and silently fail per-request — the module
    // Map above is this route's actual cache.
    const res = await fetch(homzDataUrl(segment, 1, UPSTREAM_LIMIT), { cache: "no-store" });
    if (!res.ok) throw new Error(`upstream ${res.status} for segment ${segment}`);
    const payload = await res.json();
    const data: RawHomzProperty[] = Array.isArray(payload?.results) ? payload.results : [];
    cache.set(segment, { data, expiresAt: Date.now() + TTL_MS });
    return data;
  })();

  inFlight.set(segment, request);
  try {
    return await request;
  } finally {
    inFlight.delete(segment);
  }
}
