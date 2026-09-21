// Every indexable listing landing page, defined in one place (2026-09-21).
//
// WHY THIS EXISTS, and why it is the highest-leverage SEO change on the site:
//
// The sitemap offers Google ~21,000 Sale and ~13,000 Rent listing URLs. But a
// sitemap is a hint; crawl priority comes from the site's own link graph, and
// before this the only paths into those pages were an ~875-page Sale
// pagination chain, a ~540-page Rent chain, and six citywide Sale facets. Rent
// had no facets at all. Nothing 800 clicks deep earns crawl budget or internal
// link equity, so most of the catalogue was offered to Google and buried by
// the same site.
//
// The same gap cost the queries that actually convert. There was no page for
// "3 BHK flat for sale in Sector 65 Gurgaon" or "flats for rent in Sohna
// Road" — the highest-intent searches in Indian residential property, and the
// ones the big portals own because they have a page per combination.
//
// Location hubs close both at once: a landing page per sector and corridor,
// two clicks from the homepage instead of eight hundred.
//
// THE DOORWAY-PAGE LINE. Generating a page per sector is exactly the shape of
// a doorway-page penalty if the pages are thin. Three rules keep these on the
// right side of it, and they are not optional:
//
//   1. MIN_HUB_LISTINGS. A hub with almost no inventory behind it does not
//      render at all — it 404s. Enforced at render time, so it stays true as
//      inventory moves rather than only at build time.
//   2. Every hub carries computed sector intelligence (median rate,
//      connectivity, schools, builder mix) from the same engine behind the
//      project sector pages. That is real data about that sector, not the
//      citywide copy with a name swapped in.
//   3. Hubs are enumerated from a finite, derived set — never combinatorial.
//      Sector × BHK × budget × possession would be tens of thousands of
//      near-identical pages, which is the thing the penalty exists for.
//
// This module is deliberately React-free so app/sitemap.ts can import it
// without pulling a component graph in (see the note that used to sit in
// sitemap.ts about duplicating PAGE_SIZE for exactly that reason).

import type { RawHomzProperty } from "@/lib/scraping/homzbackend";
import { filterProperties, type ListingFilters, type PropertyCategory } from "./filters";
import {
  GURGAON_CORRIDORS,
  corridorBySlug,
  listingCorridorSlug,
  listingSectorToken,
  sectorLabelFromToken,
} from "./listingLocation";

export type FacetDef = {
  slug: string;
  label: string;
  description: string;
  filters: ListingFilters;
  /** Sector token or corridor slug, when this facet is a location hub. Drives
   *  the on-page sector intelligence block and the sibling-hub links. */
  location?: { kind: "sector"; token: string } | { kind: "corridor"; slug: string };
};

/** Cards per page. Mirrored by PaginatedListingPage's PAGE_SIZE, which
 *  re-exports this so the two cannot drift. */
export const LISTING_PAGE_SIZE = 24;

/**
 * Inventory floor for a location hub to exist.
 *
 * Eight is a judgement call, and the reasoning matters more than the number:
 * a page has to be worth a visitor's click, and one flat in Sector 103 is not
 * a "Property for sale in Sector 103" page — it is a doorway to a single
 * listing that already has its own page. Eight fills a screen of cards and
 * gives the sector price median something to rest on. Raise it if the hubs
 * read thin; do not lower it without a reason.
 */
export const MIN_HUB_LISTINGS = 8;

export const ROUTE_BASE_BY_CATEGORY: Record<PropertyCategory, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

const HUB_VERB: Record<PropertyCategory, string> = {
  Sale: "for Sale",
  Rent: "for Rent",
  Pg: "PG Accommodation",
  Commercial: "Commercial Property",
};

// ---------------------------------------------------------------- static facets

// Sale. The six that closed the landing-page gap for the transactional blog
// posts (content audit B-04, 2026-09-08).
export const BUY_FACETS: Record<string, FacetDef> = {
  "3-bhk": {
    slug: "3-bhk",
    label: "3 BHK Flats for Sale in Gurgaon",
    description: "3 BHK apartments and flats for sale in Gurgaon, from HomzRealtor's live listing catalogue.",
    filters: { bedrooms: "3" },
  },
  "4-bhk": {
    slug: "4-bhk",
    label: "4 BHK Flats for Sale in Gurgaon",
    description: "4 BHK apartments and flats for sale in Gurgaon, from HomzRealtor's live listing catalogue.",
    filters: { bedrooms: "4" },
  },
  "under-1-crore": {
    slug: "under-1-crore",
    label: "Flats Under ₹1 Crore in Gurgaon",
    description: "Properties for sale in Gurgaon priced under ₹1 crore, from HomzRealtor's live listing catalogue.",
    filters: { budget: "under-1cr" },
  },
  "under-2-crore": {
    slug: "under-2-crore",
    label: "Property Investment Under ₹2 Crore in Gurgaon",
    description: "Properties for sale in Gurgaon priced under ₹2 crore, from HomzRealtor's live listing catalogue.",
    filters: { budget: "under-2cr" },
  },
  "ready-to-move": {
    slug: "ready-to-move",
    label: "Ready to Move Flats in Gurgaon",
    description: "Ready-to-move properties for sale in Gurgaon (no construction wait) from HomzRealtor's live listing catalogue.",
    filters: { possession: "ready-to-move" },
  },
  plots: {
    slug: "plots",
    label: "Plots for Sale in Gurgaon",
    description: "Residential and investment plots for sale in Gurgaon, from HomzRealtor's live listing catalogue.",
    filters: { propertyType: "plot" },
  },
};

// Rent. New 2026-09-21 — Rent had ~13,000 listings and not one landing page,
// so every rental search fell back to the citywide hub. Budget bands mirror
// BUDGET_RANGES_RENT exactly, because a band whose label and filter disagree
// is worse than no page.
export const RENT_FACETS: Record<string, FacetDef> = {
  "1-bhk": {
    slug: "1-bhk",
    label: "1 BHK Flats for Rent in Gurgaon",
    description: "1 BHK apartments and builder floors available to rent in Gurgaon, from HomzRealtor's live rental catalogue.",
    filters: { bedrooms: "1" },
  },
  "2-bhk": {
    slug: "2-bhk",
    label: "2 BHK Flats for Rent in Gurgaon",
    description: "2 BHK apartments and builder floors available to rent in Gurgaon, from HomzRealtor's live rental catalogue.",
    filters: { bedrooms: "2" },
  },
  "3-bhk": {
    slug: "3-bhk",
    label: "3 BHK Flats for Rent in Gurgaon",
    description: "3 BHK apartments and builder floors available to rent in Gurgaon, from HomzRealtor's live rental catalogue.",
    filters: { bedrooms: "3" },
  },
  "4-bhk": {
    slug: "4-bhk",
    label: "4 BHK Flats for Rent in Gurgaon",
    description: "4 BHK apartments, builder floors and villas available to rent in Gurgaon, from HomzRealtor's live rental catalogue.",
    filters: { bedrooms: "4" },
  },
  "under-25000": {
    slug: "under-25000",
    label: "Flats for Rent Under ₹25,000 in Gurgaon",
    description: "Rental homes in Gurgaon under ₹25,000 a month, from HomzRealtor's live rental catalogue.",
    filters: { budget: "under-25k" },
  },
  "25000-to-50000": {
    slug: "25000-to-50000",
    label: "Flats for Rent ₹25,000 to ₹50,000 in Gurgaon",
    description: "Rental homes in Gurgaon between ₹25,000 and ₹50,000 a month, from HomzRealtor's live rental catalogue.",
    filters: { budget: "25k-50k" },
  },
  "50000-to-100000": {
    slug: "50000-to-100000",
    label: "Flats for Rent ₹50,000 to ₹1 Lakh in Gurgaon",
    description: "Rental homes in Gurgaon between ₹50,000 and ₹1 lakh a month, from HomzRealtor's live rental catalogue.",
    filters: { budget: "50k-1l" },
  },
  "luxury-rentals": {
    slug: "luxury-rentals",
    label: "Luxury Flats for Rent in Gurgaon",
    description: "Rental homes in Gurgaon above ₹1 lakh a month, from HomzRealtor's live rental catalogue.",
    filters: { budget: "1l-3l" },
  },
  "independent-house": {
    slug: "independent-house",
    label: "Independent Houses for Rent in Gurgaon",
    description: "Independent houses and kothis available to rent in Gurgaon, from HomzRealtor's live rental catalogue.",
    filters: { propertyType: "independent_house" },
  },
  villas: {
    slug: "villas",
    label: "Villas for Rent in Gurgaon",
    description: "Villas available to rent in Gurgaon, from HomzRealtor's live rental catalogue.",
    filters: { propertyType: "villa" },
  },
};

export function staticFacetsFor(category: PropertyCategory): Record<string, FacetDef> {
  if (category === "Sale") return BUY_FACETS;
  if (category === "Rent") return RENT_FACETS;
  return {};
}

// -------------------------------------------------------------- location hubs

const SECTOR_SLUG_RE = /^sector-([0-9]{1,3})([a-d])?$/;

/** A location hub's slug from its sector token: "82a" -> "sector-82a". */
export function sectorHubSlug(token: string): string {
  return `sector-${token}`;
}

/**
 * Build a location hub definition from its slug alone, with no data access.
 *
 * Resolution is pattern-based on purpose. The alternative — enumerating hubs
 * from the live feed before we can route to one — would make every request to
 * these routes wait on a 40MB segment fetch just to learn whether the URL is
 * real. Here the slug either matches the shape or it does not, and the
 * inventory gate (MIN_HUB_LISTINGS) runs at render, where the data is loaded
 * anyway.
 */
export function resolveLocationHub(
  category: PropertyCategory,
  slug: string
): FacetDef | undefined {
  const verb = HUB_VERB[category];

  const sectorMatch = slug.match(SECTOR_SLUG_RE);
  if (sectorMatch) {
    const token = `${parseInt(sectorMatch[1], 10)}${(sectorMatch[2] || "").toLowerCase()}`;
    // "sector-065" and "sector-65" would otherwise be two URLs for one hub.
    if (sectorHubSlug(token) !== slug) return undefined;
    const label = sectorLabelFromToken(token);
    return {
      slug,
      label: `Property ${verb} in ${label}, Gurgaon`,
      description:
        category === "Rent"
          ? `Flats, builder floors and houses available to rent in ${label}, Gurgaon, with current asking rents from HomzRealtor's live catalogue.`
          : `Flats, builder floors, plots and houses for sale in ${label}, Gurgaon, with current asking prices from HomzRealtor's live catalogue.`,
      filters: { sector: token },
      location: { kind: "sector", token },
    };
  }

  const corridor = corridorBySlug(slug);
  if (corridor) {
    return {
      slug,
      label: `Property ${verb} on ${corridor.label}, Gurgaon`,
      description:
        category === "Rent"
          ? `Flats, builder floors and houses available to rent along ${corridor.label}, Gurgaon, with current asking rents from HomzRealtor's live catalogue.`
          : `Flats, builder floors and houses for sale along ${corridor.label}, Gurgaon, with current asking prices from HomzRealtor's live catalogue.`,
      filters: { corridor: corridor.slug },
      location: { kind: "corridor", slug: corridor.slug },
    };
  }

  return undefined;
}

/** Static facet or location hub, by slug. The static map wins on a collision
 *  so an existing indexed URL can never change meaning. */
export function resolveFacet(
  category: PropertyCategory,
  slug: string
): FacetDef | undefined {
  return staticFacetsFor(category)[slug] ?? resolveLocationHub(category, slug);
}

export type HubCount = { facet: FacetDef; count: number };

/**
 * Every location hub with enough inventory to exist, most populated first.
 *
 * Used by the sitemap (so it lists only hubs that actually render) and by
 * /property-rates-in-gurgaon (so the rates table links only to live hubs).
 * Both callers already hold the segment, so this takes it rather than fetching.
 */
export function buildLocationHubs(
  properties: RawHomzProperty[],
  category: PropertyCategory
): HubCount[] {
  const sectorCounts = new Map<string, number>();
  const corridorCounts = new Map<string, number>();

  for (const p of properties) {
    const token = listingSectorToken(p);
    if (token) sectorCounts.set(token, (sectorCounts.get(token) ?? 0) + 1);
    const corridor = listingCorridorSlug(p);
    if (corridor) corridorCounts.set(corridor, (corridorCounts.get(corridor) ?? 0) + 1);
  }

  const hubs: HubCount[] = [];

  for (const [token, count] of sectorCounts) {
    if (count < MIN_HUB_LISTINGS) continue;
    const facet = resolveLocationHub(category, sectorHubSlug(token));
    if (facet) hubs.push({ facet, count });
  }

  for (const c of GURGAON_CORRIDORS) {
    const count = corridorCounts.get(c.slug) ?? 0;
    if (count < MIN_HUB_LISTINGS) continue;
    const facet = resolveLocationHub(category, c.slug);
    if (facet) hubs.push({ facet, count });
  }

  return hubs.sort((a, b) => b.count - a.count || a.facet.slug.localeCompare(b.facet.slug));
}

/** Listings for a facet, from an already-fetched segment. */
export function facetProperties(
  properties: RawHomzProperty[],
  facet: FacetDef,
  category: PropertyCategory
): RawHomzProperty[] {
  return filterProperties(properties, facet.filters, category);
}
