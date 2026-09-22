// Where a listing actually is: sector and corridor, read from the feed's own
// free text (2026-09-21).
//
// The listings feed has no structured locality field — only `location` ("Sector
// 65, Golf Course Extension Road, Gurgaon") and `title`. Every sector- or
// corridor-level grouping on the site therefore comes down to parsing those
// two strings, so it happens here once rather than in each consumer.
//
// Deliberately kept free of any import from filters.ts or the hub definitions,
// so both can depend on this without a cycle.

import type { RawHomzProperty } from "@/lib/scraping/homzbackend";

/** Gurgaon's sector numbering runs to the low 110s. Anything above is either
 *  another town's numbering or a parse of something that is not a sector at
 *  all. Mirrors GURGAON_MAX_SECTOR in lib/intelligence/normalize.ts. */
const GURGAON_MAX_SECTOR = 115;

// "Sector 6, Sohna" is Sohna's Sector 6, not Gurgaon's. Sohna *Road*, though,
// is a Gurgaon corridor along which genuine Gurgaon sectors sit ("Sector 48,
// Sohna Road"), hence the lookahead. Same rule, and the same reasoning, as
// normalize.ts's OTHER_TOWNS — see the note there.
const OTHER_TOWNS = /\b(sohna(?!\s+road)|manesar|bhiwadi|dharuhera|pataudi|farukh?nagar|noida|faridabad|delhi)\b/i;

const SECTOR_RE = /\bsec(?:tor)?[\s.\-]*([0-9]{1,3})\s*([a-d])?\b/i;

/**
 * The listing's Gurgaon sector, normalised to a slug-safe token ("65", "82a"),
 * or null when it cannot be established.
 *
 * Returns null rather than guessing: a hub built on a mis-parsed sector shows
 * a visitor flats in the wrong part of the city, which is worse than not
 * having the hub.
 */
export function listingSectorToken(p: RawHomzProperty): string | null {
  for (const text of [p.location, p.title]) {
    const blob = String(text ?? "");
    const m = blob.match(SECTOR_RE);
    if (!m) continue;

    const num = parseInt(m[1], 10);
    if (!Number.isFinite(num) || num < 1 || num > GURGAON_MAX_SECTOR) continue;

    // Only reject when the other town is named *near* the sector mention, so a
    // listing whose description happens to mention a Noida commute is not
    // discarded.
    const at = m.index ?? 0;
    const around = blob.slice(Math.max(0, at - 40), at + m[0].length + 40);
    if (OTHER_TOWNS.test(around)) continue;

    return `${num}${(m[2] || "").toLowerCase()}`;
  }
  return null;
}

/** Display form of a sector token: "65" -> "Sector 65", "82a" -> "Sector 82A". */
export function sectorLabelFromToken(token: string): string {
  return `Sector ${token.replace(/([a-d])$/i, (c) => c.toUpperCase())}`;
}

/**
 * The Gurgaon corridors buyers and tenants actually search by name.
 *
 * Only Gurgaon's own corridors are listed — normalize.ts's MICRO_MARKETS is a
 * wider NCR list (Yamuna Expressway, Noida Extension, Greater Noida West)
 * covering cities this site does not service, and a hub for one of those would
 * be an empty page advertising coverage Homz does not have.
 *
 * Order matters: the first match wins, so "Golf Course Extension Road" must be
 * tested before "Golf Course Road" or every Extension Road listing would be
 * filed under the wrong corridor. `match` carries the alternatives the feed
 * actually uses (SPR, GCE, "Golf Course Ext").
 */
export type CorridorDef = {
  /** URL token. */
  slug: string;
  /** Display name. */
  label: string;
  match: RegExp;
};

export const GURGAON_CORRIDORS: CorridorDef[] = [
  {
    slug: "golf-course-extension-road",
    label: "Golf Course Extension Road",
    match: /golf\s*course\s*(extension|ext\.?)\s*road|\bgce\b/i,
  },
  {
    slug: "golf-course-road",
    label: "Golf Course Road",
    match: /golf\s*course\s*road/i,
  },
  {
    slug: "dwarka-expressway",
    label: "Dwarka Expressway",
    match: /dwarka\s*express\s*way|dwarka\s*expressway/i,
  },
  {
    slug: "sohna-road",
    label: "Sohna Road",
    match: /sohna\s*road/i,
  },
  {
    slug: "southern-peripheral-road",
    label: "Southern Peripheral Road",
    match: /southern\s*peripheral\s*road|\bspr\b/i,
  },
  {
    slug: "new-gurgaon",
    label: "New Gurgaon",
    match: /new\s*gurgaon|new\s*gurugram/i,
  },
  {
    slug: "mg-road",
    label: "MG Road",
    match: /\bm\.?\s*g\.?\s*road\b/i,
  },
];

const CORRIDOR_BY_SLUG = new Map(GURGAON_CORRIDORS.map((c) => [c.slug, c]));

export function corridorBySlug(slug: string): CorridorDef | undefined {
  return CORRIDOR_BY_SLUG.get(slug);
}

/** The listing's corridor slug, or null. First match wins — see the ordering
 *  note on GURGAON_CORRIDORS. */
export function listingCorridorSlug(p: RawHomzProperty): string | null {
  const blob = `${p.location ?? ""} ${p.title ?? ""}`;
  for (const c of GURGAON_CORRIDORS) {
    if (c.match.test(blob)) return c.slug;
  }
  return null;
}
