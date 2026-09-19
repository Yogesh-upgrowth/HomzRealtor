// Homz listing identity (2026-09-19).
//
// The 19 Sep audit's recommendation was to noindex ~35,000 scraped detail
// pages. The owner rejected that: these are units Homz actively brokers across
// buy, rent, commercial and plots, so the goal is the opposite — make every
// detail page a HomzRealtor property record that Google cannot mistake for a
// republished portal listing.
//
// That starts with identity. Today a page's only identity is the source
// portal's own id embedded in the slug, so:
//   - the same physical unit posted by three brokers is three pages competing
//     with each other and diluting the record;
//   - the URL carries no Homz identity at all, which makes price/status
//     history, verification dates and the owner-call log impossible to attach
//     to anything stable.
//
// This module supplies both: a stable public Homz ID for display and support,
// and a unit fingerprint that collapses cross-broker duplicates of the same
// physical unit into one record.

import type { RawHomzProperty, PropertyCategory } from "@/lib/scraping/homzbackend";

const CATEGORY_CODE: Record<PropertyCategory, string> = {
  Sale: "S",
  Rent: "R",
  Commercial: "C",
  Pg: "P",
};

/** FNV-1a. Deterministic across processes and deploys, which `hashCode`-style
 *  ad-hoc hashes and anything seeded are not — a listing ID that changes
 *  between builds is worse than no ID. */
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function base36(n: number, width: number): string {
  return n.toString(36).toUpperCase().padStart(width, "0").slice(-width);
}

function norm(v: unknown): string {
  return String(v ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Society/project tokens that carry no distinguishing information — dropping
 *  them stops "DLF The Ultima" and "DLF Ultima Apartments" fingerprinting apart. */
const NOISE_TOKENS = new Set([
  "the", "a", "an", "apartment", "apartments", "flat", "flats", "residency",
  "residences", "residence", "society", "project", "tower", "towers", "phase",
  // "sec" as well as "sector": one broker writes "Sector 81", another "Sec 81",
  // and without both spellings the same society fingerprints two different ways.
  "sector", "sec", "gurgaon", "gurugram", "haryana", "india", "sale", "rent",
  "for", "in", "at", "bhk", "rk", "sq", "ft", "sqft", "yard", "yards",
  "unit", "units", "property", "house", "floor", "builder", "independent",
]);

function significantTokens(value: string): string[] {
  return norm(value)
    // Drop the sector phrase before tokenising — it is captured separately and
    // its spelling varies per broker.
    .replace(/\bsec(?:tor)?[\s.-]*[0-9]{1,3}\s*[a-d]?\b/gi, " ")
    .split(" ")
    .filter((t) => t && !NOISE_TOKENS.has(t) && !/^\d+$/.test(t));
}

/** Sector number, when the text names one. Kept numeric so "Sector 65",
 *  "sector-65" and "Sec 65" agree. */
export function sectorNumberFrom(text: string | null | undefined): string | null {
  const m = String(text ?? "").match(/\bsec(?:tor)?[\s.-]*([0-9]{1,3}\s*[a-d]?)\b/i);
  if (!m) return null;
  return m[1].replace(/\s+/g, "").toLowerCase();
}

/**
 * Fingerprint of the physical unit, independent of who posted it.
 *
 * Built only from facts that identify the unit itself: society/project,
 * sector, bedroom count, property type and area bucket. Deliberately excludes
 * price (two brokers quote differently for the same flat), the listing title
 * (each portal words it differently) and the source id (that is what makes
 * duplicates look distinct in the first place).
 *
 * Area is bucketed to 25 sq-ft bands because brokers round differently for the
 * same unit — 1,704 and 1,700 are the same flat, 1,704 and 1,504 are not.
 * Returns null when there is not enough to identify a unit; callers must then
 * treat the listing as unique rather than merging it into a wrong group.
 */
export function unitFingerprint(p: RawHomzProperty): string | null {
  const society = significantTokens(
    // Prefer an explicit project/society field when the feed has one.
    (p.specifications || []).find((s) => /project|society|building/i.test(s?.heading || ""))?.value ||
      p.title ||
      ""
  ).slice(0, 4);

  const sector = sectorNumberFrom(p.location) || sectorNumberFrom(p.title);

  const bedrooms = p.bedrooms != null ? String(p.bedrooms) : "";
  const type = norm(p.propertyType);
  const area = typeof p.areaValue === "number" && p.areaValue > 0
    ? String(Math.round(p.areaValue / 25) * 25)
    : "";

  // Grouping is biased hard against false merges. Merging two distinct units
  // destroys real inventory and shows a visitor the wrong flat; failing to
  // merge just leaves a duplicate, which is the status quo. So every guard
  // below errs toward returning null.
  //
  // A single leftover word is not a society name -- "Nice flat" reduces to
  // ["nice"], which would otherwise group every unrelated 2 BHK titled that
  // way. Require either a sector (a strong, unambiguous locator) or at least
  // two significant society tokens.
  const societyIsSpecific = society.length >= 2;
  if (!sector && !societyIsSpecific) return null;

  // A plot or a shop with no bedroom count needs area to be identifiable at
  // all; without either, do not group.
  if (!bedrooms && !area) return null;

  // Without a sector, a society name alone is too weak to locate a unit --
  // chains reuse names across cities. Require the area band as well.
  if (!sector && !area) return null;

  return [society.join("-"), sector || "", type, bedrooms, area].join("|");
}

/**
 * Public Homz listing ID, e.g. "HZ-GGN-S-4K2P9A".
 *
 * Shown on the page, quotable on a call, and stable for the life of the unit:
 * derived from the unit fingerprint where one exists, so the same flat keeps
 * its ID no matter which broker's posting is currently live, and only falls
 * back to the source id when the unit cannot be fingerprinted.
 */
export function homzListingId(
  p: RawHomzProperty,
  category: PropertyCategory,
  cityKey = "ggn"
): string {
  const fingerprint = unitFingerprint(p);
  const basis = fingerprint ?? `src:${p.id ?? p.title ?? ""}`;
  const city = (cityKey || "ggn").toUpperCase().slice(0, 3);
  return `HZ-${city}-${CATEGORY_CODE[category]}-${base36(fnv1a(basis), 6)}`;
}

export type DedupedListing = {
  /** The record chosen to represent the unit. */
  listing: RawHomzProperty;
  /** How many source postings describe this same unit, including this one. */
  postingCount: number;
  /** The other postings, kept so the page can show a price range across
   *  brokers rather than silently discarding them. */
  duplicates: RawHomzProperty[];
};

/** Completeness score — decides which of several postings for the same unit
 *  becomes the canonical record. Prefers the posting that actually carries
 *  facts, not the one that happens to come first in feed order. */
function completeness(p: RawHomzProperty): number {
  let score = 0;
  if (Array.isArray(p.images) && p.images.length) score += Math.min(p.images.length, 8) * 2;
  if (p.priceValue || p.rentMonthly) score += 6;
  if (p.areaValue) score += 4;
  if (p.reraId) score += 4;
  if (p.possession) score += 2;
  if (Array.isArray(p.amenities) && p.amenities.length) score += 2;
  if (Array.isArray(p.specifications)) score += Math.min(p.specifications.length, 6);
  if (p.updatedAt) score += 1;
  return score;
}

/**
 * Collapse multiple broker postings of the same physical unit into one record.
 *
 * Listings that cannot be fingerprinted are passed through untouched — merging
 * on a guess would be worse than leaving duplicates, since it would silently
 * hide real, distinct inventory.
 */
export function dedupeListings(list: RawHomzProperty[]): DedupedListing[] {
  const groups = new Map<string, RawHomzProperty[]>();
  const singles: RawHomzProperty[] = [];

  for (const p of list) {
    const fp = unitFingerprint(p);
    if (!fp) {
      singles.push(p);
      continue;
    }
    const bucket = groups.get(fp);
    if (bucket) bucket.push(p);
    else groups.set(fp, [p]);
  }

  const out: DedupedListing[] = [];
  for (const bucket of groups.values()) {
    const sorted = [...bucket].sort((a, b) => completeness(b) - completeness(a));
    out.push({
      listing: sorted[0],
      postingCount: sorted.length,
      duplicates: sorted.slice(1),
    });
  }
  for (const p of singles) {
    out.push({ listing: p, postingCount: 1, duplicates: [] });
  }
  return out;
}

/** Price spread across the postings for one unit, when brokers disagree.
 *  Real, useful information a single portal listing cannot show. */
export function postingPriceRange(
  group: DedupedListing
): { min: number; max: number; count: number } | null {
  const values = [group.listing, ...group.duplicates]
    .map((p) => p.priceValue ?? p.rentMonthly ?? null)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return null;
  return { min, max, count: values.length };
}
