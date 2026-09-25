// Computed per-listing context (2026-09-19).
//
// This is the layer that makes a Homz detail page genuinely different from the
// portal posting it came from. None of it is copied, paraphrased or
// LLM-rewritten from source text — every value below is computed here, from
// Homz's own dataset:
//
//   - where this unit's price sits against the median for its sector, computed
//     across the whole live segment we already hold;
//   - real distances from the unit's resolved coordinate to the commute
//     anchors Gurgaon buyers actually ask about;
//   - nearby schools and hospitals from the committed OSM dataset;
//   - the project-level facts (RERA, builder, possession) joined from Homz's
//     own project catalogue, which the source listing does not carry.
//
// A portal listing cannot show any of it, which is the point. Everything
// returns null rather than a guess when the inputs are not there — a
// fabricated "12% below market" is worse than an absent one.

import { haversineKm, nearbyLandmarks } from "./osmPlaces";
import { resolveCoordinate } from "./resolveLocation";
import { listingSectorToken } from "@/lib/listings/listingLocation";
import { isProjectRecord } from "./dataQuality";
import { getProjectsForCity } from "./projects";
import { slugify } from "@/components/utils/slugify";
import type { RawHomzProperty } from "@/lib/scraping/homzbackend";

// Commute anchors Gurgaon buyers actually ask about. Fixed, well-known points
// — not geocoded, so nothing here depends on a paid API or can silently drift.
export const GURGAON_ANCHORS = [
  { key: "cyber-hub", label: "DLF Cyber Hub", lat: 28.4949, lng: 77.0895 },
  { key: "rapid-metro", label: "Rapid Metro (Sikanderpur)", lat: 28.4817, lng: 77.0937 },
  { key: "nh48", label: "NH-48 (Rajiv Chowk)", lat: 28.4462, lng: 77.0266 },
  { key: "golf-course-road", label: "Golf Course Road", lat: 28.4483, lng: 77.0982 },
  { key: "igi", label: "IGI Airport", lat: 28.5562, lng: 77.1 },
] as const;

export type AnchorDistance = { key: string; label: string; km: number };

export type SectorPriceContext = {
  sector: string;
  /** Median of this sector's comparable listings, in INR. */
  medianInr: number;
  /** This unit's price as a percentage delta from that median. Negative is
   *  below market. */
  deltaPct: number;
  /** How many comparable listings the median was computed from. */
  sampleSize: number;
  /** True when the comparison set was narrowed to the same bedroom count. */
  bedroomMatched: boolean;
};

export type ProjectFacts = {
  name: string;
  slug: string;
  href: string;
  builder: string | null;
  reraId: string | null;
  reraStatus: string | null;
  possession: string | null;
};

export type ListingContext = {
  sectorNumber: string | null;
  sectorLabel: string | null;
  sectorHref: string | null;
  price: SectorPriceContext | null;
  anchors: AnchorDistance[];
  schools: { name: string; distanceKm: number }[];
  hospitals: { name: string; distanceKm: number }[];
  project: ProjectFacts | null;
  /** Precision of the coordinate everything spatial was computed from. At
   *  "cityAnchor" the distances describe the city centre, not this unit, so
   *  they are suppressed entirely (see R19-04). */
  coordinatePrecision: "sector" | "microMarket" | "cityAnchor";
};

/** Median without pulling in a stats dependency. */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function priceOf(p: RawHomzProperty): number | null {
  const isRental = p.listingType === "rent" || p.rentMonthly != null;
  const v = isRental ? p.rentMonthly : p.priceValue;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Where this unit sits against its sector.
 *
 * Compared like for like: same sector, same rental-vs-sale basis, and the same
 * bedroom count when there are enough of those to be meaningful (falling back
 * to the whole sector otherwise, flagged via `bedroomMatched` so the page can
 * say which comparison it is showing). Needs at least 5 comparables — below
 * that a "median" is noise dressed as insight.
 */
export function sectorPriceContext(
  subject: RawHomzProperty,
  segment: RawHomzProperty[]
): SectorPriceContext | null {
  // listingSectorToken, not a bare sector regex: it refuses a sector number
  // that belongs to another town ("Sector 4, Sohna"), which the bare parse
  // compared against Gurgaon Sector 4's median (SEO audit 2026-09-25).
  const sector = listingSectorToken(subject);
  if (!sector) return null;

  const subjectPrice = priceOf(subject);
  if (subjectPrice === null) return null;

  const subjectIsRental = subject.listingType === "rent" || subject.rentMonthly != null;

  const inSector = segment.filter((p) => {
    if (p.id === subject.id) return false;
    if (listingSectorToken(p) !== sector) return false;
    // Residential and commercial never share a median: a ₹9.9 Lakh retail
    // unit is not a comparable for a flat (audit B7,
    // residentialCommercialMedian).
    if (Boolean(p.isCommercial) !== Boolean(subject.isCommercial)) return false;
    const isRental = p.listingType === "rent" || p.rentMonthly != null;
    return isRental === subjectIsRental && priceOf(p) !== null;
  });

  const MIN_SAMPLE = 5;
  let pool = inSector;
  let bedroomMatched = false;
  if (subject.bedrooms != null) {
    const sameBhk = inSector.filter((p) => p.bedrooms === subject.bedrooms);
    if (sameBhk.length >= MIN_SAMPLE) {
      pool = sameBhk;
      bedroomMatched = true;
    }
  }
  if (pool.length < MIN_SAMPLE) return null;

  const med = median(pool.map((p) => priceOf(p)!));
  if (med === null || med <= 0) return null;

  return {
    sector,
    medianInr: med,
    deltaPct: Math.round(((subjectPrice - med) / med) * 1000) / 10,
    sampleSize: pool.length,
    bedroomMatched,
  };
}

/** Distances to the commute anchors, from the unit's resolved coordinate. */
export function anchorDistances(
  lat: number,
  lng: number,
  precision: ListingContext["coordinatePrecision"]
): AnchorDistance[] {
  // At cityAnchor precision the coordinate IS a city-centre point, so every
  // distance below would describe the city rather than the unit.
  if (precision === "cityAnchor") return [];
  return GURGAON_ANCHORS.map((a) => ({
    key: a.key,
    label: a.label,
    km: Math.round(haversineKm(lat, lng, a.lat, a.lng) * 10) / 10,
  }))
    .filter((a) => a.km > 0)
    .sort((a, b) => a.km - b.km);
}

/**
 * Join this listing to Homz's own project catalogue, so the page can carry
 * project-level RERA, builder and possession the source posting lacks — and so
 * the listing is hard-linked to its project page (no orphans).
 *
 * Matched on normalised society/project name within the city. Returns null on
 * no confident match; a wrong project attribution would put another builder's
 * RERA number on this page, which is far worse than omitting it.
 */
export async function matchProject(
  subject: RawHomzProperty,
  cityKey = "ggn",
  citySlug = "gurgaon"
): Promise<ProjectFacts | null> {
  const explicit = (subject.specifications || []).find((s) =>
    /project|society|building/i.test(s?.heading || "")
  )?.value;

  // Fall back to the "... in {Project}, {Sector}" shape the feed's own titles
  // use — the same pattern extractProjectName() relies on.
  const fromTitle = String(subject.title ?? "").match(/\bin\s+([^,]+?),\s*sec/i)?.[1];
  // A project record's title *is* the project name ("GLS Aureva"), with no
  // "in X, Sector" phrase around it (audit B5). Only used for those records,
  // where there is no unit-level text for a bare title to be confused with.
  const wholeTitle = isProjectRecord(subject)
    ? String(subject.title ?? "").replace(/\s*[,|-]\s*(sector|sohna|gurgaon|gurugram)\b.*$/i, "")
    : "";
  const candidate = (explicit || fromTitle || wholeTitle || "").trim();
  if (!candidate || candidate.length < 4) return null;

  const wanted = slugify(candidate);
  if (!wanted) return null;

  const projects = await getProjectsForCity(cityKey).catch(() => []);
  const hit =
    projects.find((p) => p.slug === wanted) ||
    projects.find((p) => p.slug.startsWith(wanted) || wanted.startsWith(p.slug));
  if (!hit) return null;

  return {
    name: hit.project_name,
    slug: hit.slug,
    href: `/project-listing/${citySlug}/${hit.slug}`,
    builder: hit.builder || null,
    reraId: hit.rera_id || null,
    reraStatus: hit.rera_status || null,
    possession: hit.possession_text || null,
  };
}

/**
 * Everything above, assembled for one listing.
 *
 * `segment` is the already-loaded city+category list the detail route holds, so
 * this adds no upstream fetch — the sector median is computed over data already
 * in memory.
 */
export async function buildListingContext(
  subject: RawHomzProperty,
  segment: RawHomzProperty[],
  opts: { cityKey?: string; citySlug?: string } = {}
): Promise<ListingContext> {
  const cityKey = opts.cityKey ?? "ggn";
  const citySlug = opts.citySlug ?? "gurgaon";

  const sectorNumber = listingSectorToken(subject);
  const sectorLabel = sectorNumber ? `Sector ${sectorNumber.toUpperCase()}` : null;

  const coords = resolveCoordinate(
    cityKey,
    sectorLabel,
    typeof subject.location === "string" ? subject.location : null
  );

  const landmarks = nearbyLandmarks(coords.lat, coords.lng, coords.precision);
  const take = (key: string) =>
    (landmarks[key] || []).slice(0, 3).map((l) => ({
      name: l.name,
      distanceKm: l.distance_km,
    }));

  const [project] = await Promise.all([matchProject(subject, cityKey, citySlug)]);

  return {
    sectorNumber,
    sectorLabel,
    sectorHref: sectorNumber
      ? `/project-listing/${citySlug}/sectors/sector-${sectorNumber}`
      : null,
    price: sectorPriceContext(subject, segment),
    anchors: anchorDistances(coords.lat, coords.lng, coords.precision),
    schools: take("Schools"),
    hospitals: take("Hospitals"),
    project,
    coordinatePrecision: coords.precision,
  };
}
