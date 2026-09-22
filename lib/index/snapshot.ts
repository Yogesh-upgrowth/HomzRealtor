// Computing and storing a Gurgaon Property Index snapshot (2026-09-22).
//
// Checklist items 20 and 21. See lib/index/types.ts for the metric
// definitions and for why this is append-only.
//
// THE ONE RULE THIS MODULE ENFORCES ABOVE ALL: a stored month is never
// overwritten. saveSnapshots() inserts and lets a duplicate-key error stand —
// it does not upsert. Re-running the capture in the same month is a no-op, not
// a revision. That matters because the value of the index is entirely in its
// being a record of what we said at the time; a series that silently rewrites
// its own past is worth nothing as evidence and worse than nothing as a claim.
//
// The only way to correct a bad month is deliberately, by hand, with a note —
// and if the metric DEFINITION changed rather than the data, the right move is
// to bump INDEX_VERSION so trendBetween() refuses to compare across it.

import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSortedSegment } from "@/lib/listings/segmentCache";
import { propertySegment, type RawHomzProperty } from "@/lib/scraping/homzbackend";
import { listingSectorToken, sectorLabelFromToken, listingCorridorSlug, GURGAON_CORRIDORS } from "@/lib/listings/listingLocation";
import { detectAreaUnit, looksLikeUnitSelectorDump } from "@/lib/intelligence/normalize";
import { projectStatusKind } from "@/lib/intelligence/projectStatus";
import { reviewListing } from "@/lib/intelligence/publishGate";
import {
  currentMonth,
  INDEX_VERSION,
  MIN_SAMPLE,
  monthsBetween,
  type IndexMetrics,
  type IndexMonth,
  type IndexScopeType,
  type IndexSnapshot,
} from "./types";

const COLLECTION = "gurgaon_property_index";

let indexEnsured = false;

export async function getIndexCollection(): Promise<Collection<IndexSnapshot>> {
  const db = await getDb();
  const col = db.collection<IndexSnapshot>(COLLECTION);
  if (!indexEnsured) {
    indexEnsured = true;
    // Unique on (month, scope) is what makes "never overwrite" a database
    // guarantee rather than an application convention. An accidental second
    // capture in the same month fails at the write, not silently at the read.
    await col
      .createIndex({ month: 1, scopeType: 1, scopeKey: 1 }, { unique: true })
      .catch(() => {});
    await col.createIndex({ scopeType: 1, scopeKey: 1, month: -1 }).catch(() => {});
  }
  return col;
}

// ── metric computation ──────────────────────────────────────────────────────

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** Built-up area in sq ft, only where the unit is actually square feet and the
 *  size field is not the scraped unit-selector dump. Same guards the hub
 *  intelligence uses — a "1350 sqft sqft sqyrd" value is not a measurement. */
function sqFtOf(p: RawHomzProperty): number | null {
  const raw = typeof p.size === "string" ? p.size : "";
  if (!raw || looksLikeUnitSelectorDump(raw)) return null;
  if (detectAreaUnit(raw) !== "sq.ft") return null;
  const v = typeof p.areaValue === "number" ? p.areaValue : null;
  return v != null && v > 0 ? v : null;
}

function priceOf(p: RawHomzProperty): number | null {
  const v = typeof p.priceValue === "number" ? p.priceValue : null;
  return v != null && v > 0 ? v : null;
}

export function computeMetrics(listings: RawHomzProperty[]): IndexMetrics {
  const prices = listings.map(priceOf).filter((n): n is number => n != null);
  const residential = listings.filter((p) => !p.isCommercial);
  const ticketPrices = residential.map(priceOf).filter((n): n is number => n != null);
  const sizes = listings.map(sqFtOf).filter((n): n is number => n != null);

  const statuses = listings
    .map((p) => projectStatusKind(typeof p.projectStatus === "string" ? p.projectStatus : null))
    .filter((k) => k !== "unknown");
  const rtm = statuses.filter((k) => k === "ready-to-move").length;
  const uc = statuses.filter((k) => k === "under-construction").length;

  const pct = (n: number) =>
    statuses.length >= MIN_SAMPLE ? Math.round((n / statuses.length) * 1000) / 10 : null;

  return {
    listingCount: listings.length,
    residentialCount: residential.length,
    commercialCount: listings.length - residential.length,
    medianAskingInr: prices.length >= MIN_SAMPLE ? median(prices) : null,
    pricedCount: prices.length,
    medianTicketInr: ticketPrices.length >= MIN_SAMPLE ? median(ticketPrices) : null,
    medianUnitSqFt: sizes.length >= MIN_SAMPLE ? median(sizes) : null,
    unitSizeSample: sizes.length,
    readyToMovePct: pct(rtm),
    underConstructionPct: pct(uc),
    statusSample: statuses.length,
  };
}

type ScopeBucket = { scopeType: IndexScopeType; scopeKey: string; scopeLabel: string; listings: RawHomzProperty[] };

/**
 * Every scope a snapshot covers: the city, each sector with inventory, each
 * corridor.
 *
 * Records the publish gate blocks are excluded. A listing we will not offer to
 * Google is not one whose price should move a published index — and a zero or
 * negative price is exactly the kind of record that would.
 */
export async function buildScopes(): Promise<ScopeBucket[]> {
  const [saleSeg, rentSeg, commercialSeg] = await Promise.all([
    getSortedSegment(propertySegment("ggn", "Sale")),
    getSortedSegment(propertySegment("ggn", "Rent")),
    getSortedSegment(propertySegment("ggn", "Commercial")),
  ]);
  const sale = saleSeg.sorted;
  const rent = rentSeg.sorted;
  const commercial = commercialSeg.sorted;

  // Rent is deliberately excluded from the index. A rental asking price and a
  // sale asking price are different quantities, and a median mixing them is
  // meaningless. Rent has its own inventory counts below but no price median.
  const forSale = [...sale, ...commercial].filter((p) => reviewListing(p).indexable);

  const buckets: ScopeBucket[] = [
    { scopeType: "city", scopeKey: "gurgaon", scopeLabel: "Gurgaon", listings: forSale },
  ];

  const bySector = new Map<string, RawHomzProperty[]>();
  for (const p of forSale) {
    const token = listingSectorToken(p);
    if (!token) continue;
    if (!bySector.has(token)) bySector.set(token, []);
    bySector.get(token)!.push(p);
  }
  for (const [token, listings] of bySector) {
    if (listings.length < MIN_SAMPLE) continue;
    buckets.push({
      scopeType: "sector",
      scopeKey: `sector-${token}`,
      scopeLabel: sectorLabelFromToken(token),
      listings,
    });
  }

  const byCorridor = new Map<string, RawHomzProperty[]>();
  for (const p of forSale) {
    const slug = listingCorridorSlug(p);
    if (!slug) continue;
    if (!byCorridor.has(slug)) byCorridor.set(slug, []);
    byCorridor.get(slug)!.push(p);
  }
  for (const [slug, listings] of byCorridor) {
    if (listings.length < MIN_SAMPLE) continue;
    buckets.push({
      scopeType: "corridor",
      scopeKey: slug,
      scopeLabel: GURGAON_CORRIDORS.find((c) => c.slug === slug)?.label ?? slug,
      listings,
    });
  }

  // Rent inventory, as its own city-level scope so the counts exist without
  // contaminating any sale median.
  const rentLive = rent.filter((p) => reviewListing(p).indexable);
  buckets.push({
    scopeType: "city",
    scopeKey: "gurgaon-rent",
    scopeLabel: "Gurgaon (rental inventory)",
    listings: rentLive,
  });

  return buckets;
}

export type CaptureResult = {
  month: IndexMonth;
  attempted: number;
  inserted: number;
  /** Scopes already recorded for this month. Not an error — see the note on
   *  never overwriting. */
  alreadyRecorded: number;
};

/**
 * Capture this month's snapshot.
 *
 * Idempotent by construction: the unique index rejects a second write for the
 * same (month, scope), and those rejections are counted rather than raised.
 * Running the capture daily would therefore produce exactly one row per month,
 * written on the first run of that month.
 */
export async function captureSnapshot(month = currentMonth()): Promise<CaptureResult> {
  const col = await getIndexCollection();
  const scopes = await buildScopes();
  const capturedAt = new Date().toISOString();

  let inserted = 0;
  let alreadyRecorded = 0;

  for (const scope of scopes) {
    const doc: IndexSnapshot = {
      month,
      scopeType: scope.scopeType,
      scopeKey: scope.scopeKey,
      scopeLabel: scope.scopeLabel,
      metrics: computeMetrics(scope.listings),
      capturedAt,
      version: INDEX_VERSION,
    };
    try {
      await col.insertOne(doc as IndexSnapshot & { _id?: never });
      inserted += 1;
    } catch (err) {
      // 11000 is the duplicate-key code: this month is already on record and
      // must not be rewritten.
      if ((err as { code?: number })?.code === 11000) alreadyRecorded += 1;
      else throw err;
    }
  }

  return { month, attempted: scopes.length, inserted, alreadyRecorded };
}

// ── reading ─────────────────────────────────────────────────────────────────

export async function getSnapshots(
  scopeType: IndexScopeType,
  scopeKey: string,
  limit = 24
): Promise<IndexSnapshot[]> {
  const col = await getIndexCollection();
  const rows = await col
    .find({ scopeType, scopeKey }, { projection: { _id: 0 } })
    .sort({ month: -1 })
    .limit(limit)
    .toArray();
  return rows as IndexSnapshot[];
}

export async function getMonth(month: IndexMonth): Promise<IndexSnapshot[]> {
  const col = await getIndexCollection();
  return (await col.find({ month }, { projection: { _id: 0 } }).toArray()) as IndexSnapshot[];
}

export type IndexTrend = {
  from: IndexMonth;
  to: IndexMonth;
  months: number;
  fromValue: number;
  toValue: number;
  changePct: number;
};

/**
 * The movement between two snapshots, or null.
 *
 * Item 21 in one function. It returns null — rather than a number — whenever
 * the comparison would not be honest:
 *
 *   - fewer than two snapshots exist, which is the situation until October
 *     2026 and the reason the public page says so plainly;
 *   - either month has no median (too few priced listings behind it);
 *   - the two were computed under different INDEX_VERSIONs, meaning the
 *     definition changed and any movement between them is partly an artefact
 *     of that change rather than the market.
 *
 * There is no interpolation and no extrapolation. A gap in the series stays a
 * gap.
 */
export function trendBetween(
  earlier: IndexSnapshot | undefined,
  later: IndexSnapshot | undefined
): IndexTrend | null {
  if (!earlier || !later) return null;
  if (earlier.version !== later.version) return null;
  const a = earlier.metrics.medianAskingInr;
  const b = later.metrics.medianAskingInr;
  if (a == null || b == null || a <= 0) return null;
  const months = monthsBetween(earlier.month, later.month);
  if (months <= 0) return null;
  return {
    from: earlier.month,
    to: later.month,
    months,
    fromValue: a,
    toValue: b,
    changePct: Math.round(((b - a) / a) * 1000) / 10,
  };
}

/** The longest honest trend available for a scope: oldest comparable snapshot
 *  against the newest. Null while the series is too short — which is the
 *  correct answer, not a failure. */
export function longestTrend(snapshots: IndexSnapshot[]): IndexTrend | null {
  if (snapshots.length < 2) return null;
  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const latest = sorted[sorted.length - 1];
  // Walk backwards to the oldest snapshot that shares the latest's version and
  // carries a median, so a definition change truncates the series rather than
  // invalidating it.
  for (const candidate of sorted) {
    const trend = trendBetween(candidate, latest);
    if (trend) return trend;
  }
  return null;
}
