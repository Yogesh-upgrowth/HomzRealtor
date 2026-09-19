// Assembles the full HomzRealtor property record for one detail page
// (2026-09-19).
//
// The old path was getPropertyBySlug() -> resolvePropertyView(), which
// produced a view built almost entirely out of the source portal's own fields
// and prose. That is what made these pages indistinguishable from the listing
// they were rebuilt from.
//
// This wraps that lookup and adds the four things that make the page Homz's:
//   1. a stable Homz listing ID and cross-broker dedupe (lib/listings/identity)
//   2. computed context from our own dataset (lib/intelligence/listingContext)
//   3. a description composed from structured fields, never paraphrased
//      (lib/intelligence/listingNarrative)
//   4. price/status history and the last verification date
//      (lib/status/queries, plus the owner-call log once it exists)
//
// It costs no extra upstream fetch: the segment is already loaded to resolve
// the slug, so the sector median and the duplicate scan run over data in
// memory.

import { fetchProperties, propertySegment, type PropertyCategory } from "@/lib/scraping/homzbackend";
import { resolvePropertyView, slugForProperty, type PropertyView } from "./property-view";
import { buildListingContext, type ListingContext } from "./listingContext";
import {
  buildListingNarrative,
  buildListingMetaDescription,
  type NarrativeInput,
} from "./listingNarrative";
import {
  homzListingId,
  unitFingerprint,
  postingPriceRange,
  type DedupedListing,
} from "@/lib/listings/identity";
import { PROPERTY_TYPE_LABELS } from "@/lib/listings/filters";
import { getListingVerification, type ListingVerification } from "@/lib/status/verification";
import { resolveListingImages, isHotlinked } from "@/lib/listings/media";

export type ListingRecord = {
  view: PropertyView;
  context: ListingContext;
  /** Public Homz reference, e.g. "HZ-GGN-S-4K2P9A". */
  listingId: string;
  /** Original description paragraphs, composed from structured fields. */
  narrative: string[];
  /** Meta description, from the same facts. */
  metaDescription: string;
  /** How many source postings describe this same unit. */
  postingCount: number;
  /** Price spread across those postings, when brokers disagree. */
  postingPriceRange: { min: number; max: number; count: number } | null;
  verification: ListingVerification;
  /** True once this listing's images are served from Homz rather than
   *  hotlinked from the source portal's CDN. Drives the media migration's
   *  progress reporting and lets the UI mark own photography. */
  ownedMedia: boolean;
};

export async function getListingRecord(
  category: PropertyCategory,
  citySlug: string,
  slug: string,
  cityKey = "ggn"
): Promise<ListingRecord | null> {
  const segment = await fetchProperties(propertySegment(cityKey, category), {
    limit: 25_000,
  }).catch(() => []);

  const match = segment.find((p) => slugForProperty(p) === slug);
  if (!match) return null;

  const view = resolvePropertyView(match, { category, citySlug });

  // Serve Homz-hosted images the moment any exist for this unit; fall back to
  // the source until the media migration reaches it. See lib/listings/media.ts.
  const media = resolveListingImages(homzListingId(match, category, cityKey), view.images);
  view.images = media.images;
  view.heroImage = media.images[0] ?? null;
  const context = await buildListingContext(match, segment, { cityKey, citySlug });
  const listingId = homzListingId(match, category, cityKey);

  // Other postings of this same physical unit, found by fingerprint. Scoped to
  // the segment we already hold rather than a second pass over the feed.
  const fp = unitFingerprint(match);
  const siblings = fp
    ? segment.filter((p) => p.id !== match.id && unitFingerprint(p) === fp)
    : [];
  const group: DedupedListing = {
    listing: match,
    postingCount: siblings.length + 1,
    duplicates: siblings,
  };

  const narrativeInput: NarrativeInput = {
    configuration: view.configuration,
    bedrooms: view.bedrooms,
    propertyTypeLabel: view.propertyType
      ? PROPERTY_TYPE_LABELS[view.propertyType] || view.propertyType
      : null,
    areaText: view.areaText,
    location: view.location,
    priceText: view.priceText,
    hasPrice: view.hasPrice,
    priceIsMonthly: view.priceIsMonthly,
    status: view.status,
    possession: view.possession,
    amenityCount: view.amenityCount,
    topAmenities: view.amenities.flatMap((a) => a.amenities).slice(0, 6),
    listingId,
    postingCount: group.postingCount,
  };

  const verification = await getListingVerification({
    cityKey,
    slug,
    listingId,
  }).catch(() => ({ verifiedAt: null, priceHistory: [], statusHistory: [] }));

  return {
    view,
    context,
    listingId,
    narrative: buildListingNarrative(narrativeInput, context),
    metaDescription: buildListingMetaDescription(narrativeInput, context),
    postingCount: group.postingCount,
    postingPriceRange: postingPriceRange(group),
    verification,
    ownedMedia: media.owned || (view.heroImage != null && !isHotlinked(view.heroImage)),
  };
}
