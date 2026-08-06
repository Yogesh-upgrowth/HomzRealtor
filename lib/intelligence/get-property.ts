// Server-side lookup for one property by slug — the individual-listing
// equivalent of lib/intelligence/projects.ts's getProjectBySlug/
// getProjectsForCity, using the same caching: fetchProperties()
// (lib/scraping/homzbackend.ts) keeps a plain in-memory Map, not
// unstable_cache or `fetch`'s own `next: { revalidate }` — both of those
// throw/silently drop the entry once a cached payload exceeds 2MB, and a
// full city+category segment (e.g. ggnSaleProperties, thousands of records)
// is comfortably past that. See lib/intelligence/projects.ts's
// getProjectsForCity for the same fix, applied first there.
//
// This matters more here than it did to discover for Projects: without any
// caching, every single detail-page view re-downloads and re-parses the
// entire city+category segment (thousands of records) from scratch. In
// testing, most lookups still took 10-20s for exactly that reason, and one
// hit a multi-minute stall — not a code bug, just repeatedly paying the full
// fetch+parse cost with nothing cached. `homzDataUrl`'s own limit=10000 also
// means this pulls the full segment in one shot, consistent with the
// listing page's approach.
//
// There's no by-id lookup endpoint on the backend — this fetches the whole
// city+category segment (same as the listing page) and matches by slug, same
// approach getProjectBySlug already uses for Projects.

import { fetchProperties, propertySegment, type PropertyCategory } from "@/lib/scraping/homzbackend";
import { resolvePropertyView, slugForProperty, type PropertyView } from "./property-view";

export async function getPropertyBySlug(
  category: PropertyCategory,
  citySlug: string,
  slug: string,
  cityKey = "ggn"
): Promise<PropertyView | null> {
  const properties = await fetchProperties(propertySegment(cityKey, category), {
    limit: 10_000,
  }).catch(() => []);
  const match = properties.find((p) => slugForProperty(p) === slug);
  if (!match) return null;
  return resolvePropertyView(match, { category, citySlug });
}
