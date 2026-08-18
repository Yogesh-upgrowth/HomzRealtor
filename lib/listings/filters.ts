// Single source of truth for how Sale/Rent/Pg/Commercial listing filters
// apply to a RawHomzProperty[] segment, plus the facet (dropdown-option)
// computation over the same segment. Used by app/api/listings/route.ts so
// filtering happens once, server-side, instead of duplicated per client —
// this is a straight port of the useMemo pipeline that used to live in
// components/PropertyListing/PropertyListingPage.tsx (see git history there
// for the pre-pagination version) — same semantics, same edge cases
// ("4+" bedrooms, rent-scale vs sale-scale budget buckets, golf text search).

import type { RawHomzProperty } from "@/lib/scraping/homzbackend";
import { validImages } from "@/lib/intelligence/view-model";

export type PropertyCategory = "Sale" | "Rent" | "Pg" | "Commercial";

export type ListingFilters = {
  q?: string;
  propertyType?: string;
  bedrooms?: string; // "" | "3" | "4+" | "1rk" (RK, distinct from the same-count BHK)
  budget?: string; // key into BUDGET_RANGES_SALE / BUDGET_RANGES_RENT
  possession?: string; // "ready-to-move" | "under-construction" | "new-launch"
  saleType?: string; // "resale" | "new_launch" — Sale category only
  golf?: boolean;
  investmentGrade?: boolean; // Commercial category only
};

export type FacetOption = { value: string; label: string; count: number };
export type ListingFacets = {
  propertyTypes: FacetOption[];
  bedrooms: number[];
  /** Bedroom counts that have at least one RK-configured listing (e.g. [1]
   *  for "1 RK") — surfaced as its own filter chip, separate from the
   *  same-count BHK chip. See isRkConfiguration(). */
  rk: number[];
};

/** "1 RK" and "1 BHK" both carry `bedrooms: 1` — parse_bedrooms() upstream
 *  (homz/common/parsing.py) extracts the same integer for both, the RK/BHK
 *  label only survives in `configuration` (e.g. "1 RK" vs "1 BHK"). This is
 *  what tells them apart for the dedicated RK filter chip. */
export function isRkConfiguration(configuration?: string | null): boolean {
  return /\brk\b/i.test(configuration || "");
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  builder_floor: "Builder Floor",
  independent_house: "Independent House",
  villa: "Villa",
  plot: "Plot",
  penthouse: "Penthouse",
  studio: "Studio",
  office: "Office",
  retail_shop: "Retail Shop",
  showroom: "Showroom",
  warehouse: "Warehouse",
  co_working: "Co-working Space",
  farmhouse: "Farmhouse",
  serviced_apartment: "Serviced Apartment",
  other: "Other",
};

// Same budget keys as app/project-listing/page.tsx's BUDGET_RANGES, in rupees.
// Sale/Commercial listings are priced via priceValue (crore scale).
export const BUDGET_RANGES_SALE: Record<string, { min: number; max: number | null }> = {
  "under-50l": { min: 0, max: 50_00_000 },
  "50l-1cr": { min: 50_00_000, max: 1_00_00_000 },
  "1cr-2cr": { min: 1_00_00_000, max: 2_00_00_000 },
  "above-2cr": { min: 2_00_00_000, max: null },
  "under-1cr": { min: 0, max: 1_00_00_000 },
  "under-2cr": { min: 0, max: 2_00_00_000 },
};

// Rent/PG listings are priced via rentMonthly (rupee scale).
export const BUDGET_RANGES_RENT: Record<string, { min: number; max: number | null }> = {
  "under-25k": { min: 0, max: 25_000 },
  "25k-50k": { min: 25_000, max: 50_000 },
  "50k-1l": { min: 50_000, max: 1_00_000 },
  "1l-3l": { min: 1_00_000, max: 3_00_000 },
  "above-3l": { min: 3_00_000, max: null },
};

// investmentScore is 0-100 from the backend's real enrichment pipeline
// (homz enrich scores) — not a heuristic. 60 is a reasonable "worth a closer
// look" bar; revisit once there's usage data on the actual score distribution.
const INVESTMENT_GRADE_THRESHOLD = 60;

export function isRentScale(category: PropertyCategory): boolean {
  return category === "Rent" || category === "Pg";
}

function hasValidImage(images: string[] = []): boolean {
  return validImages(images).length > 0;
}

/** Images-first, same as Projects — a card with no photo reads as broken.
 *  Applied before filtering so relative order survives the filter chain. */
export function sortByImageFirst(list: RawHomzProperty[]): RawHomzProperty[] {
  return [...list].sort(
    (a, b) => Number(hasValidImage(b.images)) - Number(hasValidImage(a.images))
  );
}

export function filterProperties(
  list: RawHomzProperty[],
  filters: ListingFilters,
  category: PropertyCategory
): RawHomzProperty[] {
  let result = list;
  const { q, propertyType, bedrooms, budget, possession, saleType, golf, investmentGrade } =
    filters;

  if (q) {
    const needle = q.toLowerCase();
    result = result.filter(
      (p) =>
        p.title?.toLowerCase().includes(needle) || p.location?.toLowerCase().includes(needle)
    );
  }

  if (propertyType) result = result.filter((p) => p.propertyType === propertyType);

  if (bedrooms) {
    // "4+" (the homepage search's top BHK option) means "4 or more" — an
    // exact string match against bedrooms would never match a listing with
    // 5 bedrooms, silently hiding real inventory from that search.
    if (bedrooms.endsWith("+")) {
      const min = parseInt(bedrooms, 10);
      result = result.filter((p) => typeof p.bedrooms === "number" && p.bedrooms >= min);
    } else if (bedrooms.endsWith("rk")) {
      // Dedicated RK chip (e.g. "1rk") — narrows to just that bedroom count's
      // RK-configured listings. The plain numeric filter below still matches
      // RK listings too (same bedrooms count), so this is additive, not a
      // carve-out: "1 BHK" keeps showing 1 RK units alongside 1 BHK ones.
      const n = parseInt(bedrooms, 10);
      result = result.filter((p) => p.bedrooms === n && isRkConfiguration(p.configuration));
    } else {
      result = result.filter((p) => String(p.bedrooms ?? "") === bedrooms);
    }
  }

  if (budget) {
    const budgetRanges = isRentScale(category) ? BUDGET_RANGES_RENT : BUDGET_RANGES_SALE;
    const range = budgetRanges[budget];
    if (range) {
      const { min, max } = range;
      result = result.filter((p) => {
        const value = p.priceValue ?? p.rentMonthly;
        if (value == null) return false;
        return value >= min && (max == null || value < max);
      });
    }
  }

  if (possession) {
    const target =
      possession === "ready-to-move"
        ? "Ready to Move"
        : possession === "under-construction"
        ? "Under Construction"
        : possession === "new-launch"
        ? "New Launch"
        : null;
    if (target) result = result.filter((p) => p.projectStatus === target);
  }

  // Resale vs. New Launch is a sub-filter within Sale, not a separate
  // top-level category — Sale pools sale/resale/new_launch/project together
  // by design (see docs/listings-feed-contract.md in Homz-Scrape).
  if (category === "Sale" && saleType) {
    result = result.filter((p) => p.listingType === saleType);
  }

  if (golf) {
    result = result.filter((p) =>
      `${p.location || ""} ${(p.aboutProject || []).join(" ")}`.toLowerCase().includes("golf")
    );
  }

  if (category === "Commercial" && investmentGrade) {
    result = result.filter((p) => (p.investmentScore ?? 0) >= INVESTMENT_GRADE_THRESHOLD);
  }

  return result;
}

/** Dropdown option counts computed over the full (unfiltered) segment, not
 *  the currently-filtered set — matches the old client behavior where
 *  changing one filter never made other filters' option lists shrink. */
export function computeFacets(list: RawHomzProperty[]): ListingFacets {
  const typeCounts = new Map<string, number>();
  const bedroomValues = new Set<number>();
  const rkValues = new Set<number>();

  for (const p of list) {
    if (p.propertyType) typeCounts.set(p.propertyType, (typeCounts.get(p.propertyType) || 0) + 1);
    if (typeof p.bedrooms === "number" && p.bedrooms > 0) {
      bedroomValues.add(p.bedrooms);
      if (isRkConfiguration(p.configuration)) rkValues.add(p.bedrooms);
    }
  }

  const propertyTypes = Array.from(typeCounts.entries())
    .map(([value, count]) => ({ value, count, label: PROPERTY_TYPE_LABELS[value] || value }))
    .sort((a, b) => b.count - a.count);

  const bedrooms = Array.from(bedroomValues).sort((a, b) => a - b);
  const rk = Array.from(rkValues).sort((a, b) => a - b);

  return { propertyTypes, bedrooms, rk };
}
