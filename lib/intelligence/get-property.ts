// Server-side lookup for one property by slug — the individual-listing
// equivalent of lib/intelligence/projects.ts's getProjectBySlug/
// getProjectsForCity, using the exact same two-layer caching: a raw `fetch`
// with `next: { revalidate }` (Next's own fetch cache) wrapped in
// `unstable_cache`.
//
// This matters more here than it did to discover for Projects: without it,
// every single detail-page view re-downloads and re-parses the entire
// city+category segment (thousands of records) from scratch. In testing,
// most lookups still took 10-20s for exactly that reason, and one hit a
// multi-minute stall — not a code bug, just repeatedly paying the full
// fetch+parse cost with nothing cached. `homzDataUrl`'s own limit=10000 also
// means this pulls the full segment in one shot, consistent with the
// listing page's approach.
//
// There's no by-id lookup endpoint on the backend — this fetches the whole
// city+category segment (same as the listing page) and matches by slug, same
// approach getProjectBySlug already uses for Projects.

import { unstable_cache } from "next/cache";
import {
  homzDataUrl,
  propertySegment,
  type PropertyCategory,
  type RawHomzProperty,
} from "@/lib/scraping/homzbackend";
import { resolvePropertyView, slugForProperty, type PropertyView } from "./property-view";

function fetchSegment(segment: string): Promise<RawHomzProperty[]> {
  return fetch(homzDataUrl(segment, 1, 10_000), { next: { revalidate: 3600 } })
    .then((r) => r.json())
    .then((d) => (Array.isArray(d?.results) ? d.results : []))
    .catch(() => []);
}

const getPropertiesForSegment = unstable_cache(fetchSegment, ["property-segment"], {
  revalidate: 3600,
});

export async function getPropertyBySlug(
  category: PropertyCategory,
  citySlug: string,
  slug: string,
  cityKey = "ggn"
): Promise<PropertyView | null> {
  const properties = await getPropertiesForSegment(propertySegment(cityKey, category));
  const match = properties.find((p) => slugForProperty(p) === slug);
  if (!match) return null;
  return resolvePropertyView(match, { category, citySlug });
}
