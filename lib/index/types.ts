// The Gurgaon Property Index — what a monthly snapshot contains (2026-09-22).
//
// Checklist item 20: "Continue building the Gurgaon Property Index. This
// should become a major HomzRealtor asset. Store a snapshot every month. For
// each sector/corridor store: median asking price, listing count, residential
// inventory, commercial inventory, ready-to-move %, under-construction %,
// median ticket size, median unit size. Don't overwrite previous months."
//
// Checklist item 21, which is the one that makes it an asset rather than a
// liability: "Build historical trends ONLY from Homz's future snapshots. Don't
// try to reconstruct 2020-2025 numbers unless you have defensible source data.
// Start from September 2026. By September 2027 you can accurately say
// HomzRealtor asking-price index increased/decreased X% over the past 12
// months."
//
// So the whole design is append-only and refuses to invent a past. There is no
// backfill function here, and that is deliberate: the catalogue is a snapshot
// of what is listed TODAY, and nothing in it records what was listed in 2023.
// Any historical series reconstructed from it would be a guess wearing the
// authority of a dataset, which is precisely the kind of claim this project
// has spent its time removing from the site.

/** "2026-09". Months are the unit; a snapshot is of a month, not an instant. */
export type IndexMonth = string;

export type IndexScopeType = "city" | "sector" | "corridor";

export type IndexMetrics = {
  /** Listings in scope at capture time, across all categories. */
  listingCount: number;
  residentialCount: number;
  commercialCount: number;
  /** Median asking price of listings carrying a parsed price, in rupees.
   *  Null when fewer than MIN_SAMPLE priced listings sit behind it. */
  medianAskingInr: number | null;
  /** How many listings that median is computed from. Always published beside
   *  it — a median of four is not the same claim as a median of four hundred. */
  pricedCount: number;
  /** Median of the per-listing asking price, restricted to residential sale
   *  listings. "Ticket size" in the item's wording. */
  medianTicketInr: number | null;
  /** Median built-up area in sq ft, for listings with a confirmed unit. */
  medianUnitSqFt: number | null;
  unitSizeSample: number;
  /** Share of the scope's listings by construction status, 0-100. Null when
   *  too few listings carry a usable status to make a share meaningful. */
  readyToMovePct: number | null;
  underConstructionPct: number | null;
  statusSample: number;
};

export type IndexSnapshot = {
  month: IndexMonth;
  scopeType: IndexScopeType;
  /** "gurgaon", "sector-65", "dwarka-expressway". */
  scopeKey: string;
  scopeLabel: string;
  metrics: IndexMetrics;
  /** When this snapshot was actually captured. */
  capturedAt: string;
  /** The schema version the metrics were computed under. Bumped when a
   *  definition changes, so a trend across a definition change can be
   *  detected rather than silently compared. */
  version: number;
};

/**
 * The current metric definitions' version.
 *
 * If a median's definition changes — a different price field, a different
 * exclusion rule — this must be bumped. A trend line drawn across two
 * different definitions is a fabricated movement, and trendBetween() refuses
 * to draw one.
 */
export const INDEX_VERSION = 1;

/**
 * Minimum priced listings behind a published median.
 *
 * Four is the floor used elsewhere on the site for sector medians. A median of
 * three asking prices in a sector moves wildly month to month for reasons that
 * have nothing to do with the market, and publishing it as an index would
 * manufacture volatility.
 */
export const MIN_SAMPLE = 8;

/** The first month this index exists. Item 21: there is no history before it
 *  and none will be invented. */
export const INDEX_START_MONTH: IndexMonth = "2026-09";

export function currentMonth(now = new Date()): IndexMonth {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Whole months between two IndexMonths, b - a. */
export function monthsBetween(a: IndexMonth, b: IndexMonth): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}
