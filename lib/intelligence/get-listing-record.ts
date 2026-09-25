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
import { reviewListing, type PublishState } from "./publishGate";
import { isProjectRecord } from "./dataQuality";
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
import { listingSectorToken } from "@/lib/listings/listingLocation";
import { MIN_HUB_LISTINGS, resolveLocationHub, sectorHubSlug } from "@/lib/listings/facets";
import type { RawHomzProperty } from "@/lib/scraping/homzbackend";

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
  /** Checklist item 9: the pre-publish QA verdict for this record, evaluated
   *  AFTER the correction layer. A non-indexable record still renders — it is
   *  simply not offered to Google. See lib/intelligence/publishGate.ts. */
  review: PublishState;
  /** Visible breadcrumb trail, Home first, this unit last (no href). The same
   *  list feeds BreadcrumbList JSON-LD so markup never describes a trail the
   *  page does not show (SEO audit 2026-09-25, §2 / B9). */
  breadcrumbs: { name: string; href: string | null }[];
  /** This category's sector hub, when it clears MIN_HUB_LISTINGS. */
  sectorHub: { label: string; href: string; count: number } | null;
  /** Up to 6 comparable units: same sector, same bedrooms, price within ±20%. */
  similar: SimilarListing[];
  /** A project record republished in the listings feed — see
   *  dataQuality.isProjectRecord. The route redirects it to its project page
   *  when one matches. */
  isProjectRecord: boolean;
};

export type SimilarListing = {
  title: string;
  href: string;
  priceText: string | null;
  areaText: string | null;
};

const ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

const CATEGORY_CRUMB: Record<PropertyCategory, string> = {
  Sale: "Buy",
  Rent: "Rent",
  Pg: "PG",
  Commercial: "Commercial",
};

function priceOf(p: RawHomzProperty): number | null {
  const isRental = p.listingType === "rent" || p.rentMonthly != null;
  const v = isRental ? p.rentMonthly : p.priceValue;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/** Sector hub for this category, gated exactly as the hub route and the
 *  sitemap gate it, so the link never points at a page that won't render. */
function sectorHubFor(
  category: PropertyCategory,
  citySlug: string,
  token: string | null,
  segment: RawHomzProperty[]
): ListingRecord["sectorHub"] {
  if (!token || (category !== "Sale" && category !== "Rent")) return null;
  const facet = resolveLocationHub(category, sectorHubSlug(token));
  if (!facet) return null;
  let count = 0;
  for (const p of segment) if (listingSectorToken(p) === token) count++;
  if (count < MIN_HUB_LISTINGS) return null;
  return { label: facet.label, href: `/${ROUTE_BASE[category]}/${citySlug}/${facet.slug}`, count };
}

/** Same sector, same bedroom count, asking price within ±20%. Closest price
 *  first. Scanned over the segment already in memory — no extra fetch. */
function similarListings(
  subject: RawHomzProperty,
  token: string | null,
  segment: RawHomzProperty[],
  category: PropertyCategory,
  citySlug: string
): SimilarListing[] {
  const price = priceOf(subject);
  if (!token || price == null) return [];
  const beds = subject.bedrooms ?? null;
  const out: { p: RawHomzProperty; gap: number }[] = [];
  for (const p of segment) {
    if (p.id === subject.id) continue;
    if ((p.bedrooms ?? null) !== beds) continue;
    const pp = priceOf(p);
    if (pp == null || Math.abs(pp - price) / price > 0.2) continue;
    if (listingSectorToken(p) !== token) continue;
    out.push({ p, gap: Math.abs(pp - price) });
  }
  const seenSlugs = new Set<string>();
  return out
    .sort((a, b) => a.gap - b.gap)
    // Headroom for de-duplication below without resolving a full view for
    // every comparable in a busy sector.
    .slice(0, 12)
    .map(({ p }) => {
      const v = resolvePropertyView(p, { category, citySlug });
      return {
        title: v.projectName ? `${v.configuration || v.propertyType || "Unit"} in ${v.projectName}` : v.title,
        href: `/${ROUTE_BASE[category]}/${citySlug}/${v.slug}`,
        priceText: v.hasPrice ? v.priceText : null,
        areaText: v.areaText,
      };
    })
    .filter((s) => (seenSlugs.has(s.href) ? false : (seenSlugs.add(s.href), true)))
    .slice(0, 6);
}

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

  const sectorToken = listingSectorToken(match);
  const sectorHub = sectorHubFor(category, citySlug, sectorToken, segment);
  const cityName = citySlug === "gurgaon" ? "Gurgaon" : citySlug;
  const routeBase = ROUTE_BASE[category];
  const breadcrumbs: ListingRecord["breadcrumbs"] = [
    { name: "Home", href: "/" },
    { name: CATEGORY_CRUMB[category], href: `/${routeBase}` },
    // The city crumb is the category hub itself; there is no separate
    // /buy-property/gurgaon page.
    ...(sectorHub && context.sectorLabel
      ? [{ name: context.sectorLabel, href: sectorHub.href }]
      : context.sectorLabel && context.sectorHref
        ? [{ name: `${context.sectorLabel}, ${cityName}`, href: context.sectorHref }]
        : []),
    ...(context.project ? [{ name: context.project.name, href: context.project.href }] : []),
    {
      name: [view.configuration || view.propertyType, view.areaText].filter(Boolean).join(", ") || "This listing",
      href: null,
    },
  ];

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
    review: reviewListing(match),
    breadcrumbs,
    sectorHub,
    similar: similarListings(match, sectorToken, segment, category, citySlug),
    isProjectRecord: isProjectRecord(match),
  };
}
