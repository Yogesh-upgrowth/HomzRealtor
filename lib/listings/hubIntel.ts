// What a location hub knows about its own patch (2026-09-21).
//
// A hub per sector is only defensible if each one says something true and
// specific about that sector — see the doorway-page note in facets.ts. This
// computes that from two sources the site already owns:
//
//   - the hub's own listings, for asking prices and the configuration mix
//   - data/osm/*.json, for connectivity and social infrastructure
//
// Nothing here is model-generated or copied. Every figure is derived from
// records on hand, so it stays true as inventory moves instead of being
// written once and going stale.
//
// Every field is nullable and the page omits what it cannot compute. A sector
// with nine listings and no confirmed sizes gets a short honest page.

import type { RawHomzProperty } from "@/lib/scraping/homzbackend";
import type { PropertyCategory } from "./filters";
import { isRentScale } from "./filters";
import { GURGAON_ANCHORS } from "@/lib/intelligence/listingContext";
import { detectAreaUnit, looksLikeUnitSelectorDump } from "@/lib/intelligence/normalize";
import { haversineKm, nearbyLandmarks } from "@/lib/intelligence/osmPlaces";
import { resolveCoordinate } from "@/lib/intelligence/resolveLocation";

export type HubPriceStats = {
  /** Median asking price (Sale) or monthly rent (Rent), in rupees. */
  medianInr: number;
  minInr: number;
  maxInr: number;
  /** How many listings carried a price. Always shown with the median. */
  pricedCount: number;
  totalCount: number;
  /** Median rate per sq ft. Sale only — a per-sq-ft rent is not a figure
   *  anyone uses, and publishing one would invite the wrong comparison. */
  perSqFtInr: number | null;
  perSqFtSample: number;
};

export type HubIntel = {
  price: HubPriceStats | null;
  /** Straight-line distances to the anchors Gurgaon buyers ask about. Empty
   *  when the coordinate could only be resolved to the city centre — see the
   *  precision note below. */
  anchors: { key: string; label: string; km: number }[];
  schools: { name: string; distanceKm: number }[];
  hospitals: { name: string; distanceKm: number }[];
  malls: { name: string; distanceKm: number }[];
  /** Configuration mix, most common first — "what can I actually get here". */
  bedroomMix: { bedrooms: number; count: number }[];
  typeMix: { type: string; count: number }[];
  coordinatePrecision: "sector" | "microMarket" | "cityAnchor";
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function priceOf(p: RawHomzProperty, category: PropertyCategory): number | null {
  const v = isRentScale(category) ? p.rentMonthly ?? p.priceValue : p.priceValue;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

function priceStats(
  all: RawHomzProperty[],
  category: PropertyCategory
): HubPriceStats | null {
  // SEO audit 2026-09-25 (B7 residentialCommercialMedian): Sale and Rent hubs
  // are residential pages, so their medians, minimums and per-sq-ft rates
  // exclude commercial units. A ₹9.9 Lakh retail unit was Sector 65's "lowest
  // entry price" and commercial space drove Sector 114's ₹37,243/sq ft. The
  // units still list on the hub; they just never set its numbers.
  const properties =
    category === "Sale" || category === "Rent" ? all.filter((p) => !p.isCommercial) : all;
  const priced = properties
    .map((p) => priceOf(p, category))
    .filter((v): v is number => v !== null);

  // Same floor as the sector and developer pages: below four, a "median" is
  // noise wearing the clothes of an insight.
  if (priced.length < 4) return null;

  const rates: number[] = [];
  if (!isRentScale(category)) {
    for (const p of properties) {
      const price = priceOf(p, category);
      const area = p.areaValue;
      if (price === null || typeof area !== "number" || area <= 0) continue;

      // The feed carries no structured area unit — only the free-text `size`
      // ("1350 sqft") — so the unit has to be read from that string, and two
      // things must be true before dividing by it.
      //
      // First, the string must not be one of the scraped unit-selector dumps
      // ("1350 sqft sqft sqyrd…"), which mention several units at once and so
      // cannot establish any of them. Second, the unit it does establish must
      // be square feet: dividing a sq-yd area as though it were sq ft yields
      // a rate about nine times too low. That is the DEV-02 bug, and an
      // unconfirmed unit is excluded here rather than assumed.
      const sizeText = p.size ?? "";
      if (!sizeText || looksLikeUnitSelectorDump(sizeText)) continue;
      if (detectAreaUnit(sizeText) !== "sq.ft") continue;

      rates.push(Math.round(price / area));
    }
  }

  return {
    medianInr: median(priced)!,
    minInr: Math.min(...priced),
    maxInr: Math.max(...priced),
    pricedCount: priced.length,
    totalCount: properties.length,
    perSqFtInr: rates.length >= 4 ? median(rates) : null,
    perSqFtSample: rates.length,
  };
}

export function buildHubIntel(
  properties: RawHomzProperty[],
  category: PropertyCategory,
  location: { kind: "sector"; label: string } | { kind: "corridor"; label: string }
): HubIntel {
  // A sector name resolves against the committed OSM locality set; a corridor
  // name resolves as a micro-market. Both fall back to the city anchor, which
  // for Gurgaon *is* Cyber City — so measuring anchors from a cityAnchor
  // coordinate would report Cyber Hub as 0.0 km away. That was a real bug on
  // the project pages; the precision flag is read here rather than ignored.
  const coords =
    location.kind === "sector"
      ? resolveCoordinate("ggn", location.label, null)
      : resolveCoordinate("ggn", null, location.label);

  const landmarks = nearbyLandmarks(coords.lat, coords.lng, coords.precision);
  const take = (key: string, n = 4) =>
    (landmarks[key] || []).slice(0, n).map((l) => ({ name: l.name, distanceKm: l.distance_km }));

  const bedroomCounts = new Map<number, number>();
  const typeCounts = new Map<string, number>();
  for (const p of properties) {
    if (typeof p.bedrooms === "number" && p.bedrooms > 0) {
      bedroomCounts.set(p.bedrooms, (bedroomCounts.get(p.bedrooms) ?? 0) + 1);
    }
    if (p.propertyType) typeCounts.set(p.propertyType, (typeCounts.get(p.propertyType) ?? 0) + 1);
  }

  return {
    price: priceStats(properties, category),
    anchors:
      coords.precision === "cityAnchor"
        ? []
        : GURGAON_ANCHORS.map((a) => ({
            key: a.key,
            label: a.label,
            km: Math.round(haversineKm(coords.lat, coords.lng, a.lat, a.lng) * 10) / 10,
          }))
            // A 0.0 km reading means the anchor and the resolved point are the
            // same place; reporting it as a distance is meaningless.
            .filter((a) => a.km > 0)
            .sort((a, b) => a.km - b.km),
    schools: take("Schools"),
    hospitals: take("Hospitals"),
    malls: take("Shopping Centres", 3),
    bedroomMix: [...bedroomCounts.entries()]
      .map(([bedrooms, count]) => ({ bedrooms, count }))
      .sort((a, b) => b.count - a.count || a.bedrooms - b.bedrooms)
      .slice(0, 6),
    typeMix: [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    coordinatePrecision: coords.precision,
  };
}

/**
 * FAQs for a location hub, answered from the computed intel.
 *
 * Only questions the data can answer are emitted — these feed FAQPage markup,
 * and an answer that hedges because the figure is missing is worse than no
 * question. The questions mirror what these searches actually carry.
 */
export function buildHubFaqs(
  locationLabel: string,
  category: PropertyCategory,
  intel: HubIntel,
  formatInr: (n: number | null | undefined) => string | null
): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];
  const renting = isRentScale(category);

  if (intel.price) {
    const { medianInr, minInr, maxInr, pricedCount, totalCount } = intel.price;
    const unpriced = totalCount - pricedCount;
    faqs.push({
      q: renting
        ? `What is the average rent in ${locationLabel}, Gurgaon?`
        : `What is the average property price in ${locationLabel}, Gurgaon?`,
      a:
        `Across the ${pricedCount} ${renting ? "rental listings" : "listings"} in ${locationLabel} that carry a ` +
        `${renting ? "rent" : "price"}, the median is ${formatInr(medianInr)}${renting ? " a month" : ""}, ` +
        `with a range from ${formatInr(minInr)} to ${formatInr(maxInr)}. ` +
        (unpriced > 0 ? `A further ${unpriced} ${unpriced === 1 ? "is" : "are"} listed on request. ` : "") +
        `These are asking ${renting ? "rents" : "prices"} from our own catalogue, not transacted figures, and they are negotiable.`,
    });
  }

  if (intel.price?.perSqFtInr) {
    faqs.push({
      q: `What is the per sq ft rate in ${locationLabel}, Gurgaon?`,
      a: `Across the ${intel.price.perSqFtSample} listings in ${locationLabel} carrying both a price and a confirmed size, the median works out to about ₹${intel.price.perSqFtInr.toLocaleString("en-IN")} per sq ft. Individual properties sit either side of that depending on the society, the floor and the condition of the unit.`,
    });
  }

  if (intel.bedroomMix.length > 0) {
    faqs.push({
      q: renting
        ? `What size flats are available to rent in ${locationLabel}?`
        : `What configurations are available in ${locationLabel}?`,
      a: `Currently ${intel.bedroomMix
        .map((b) => `${b.count} ${b.bedrooms} BHK`)
        .join(", ")}${intel.typeMix.length > 1 ? `, across ${intel.typeMix.length} property types` : ""}. The mix changes as inventory moves, so the counts on this page are the live ones.`,
    });
  }

  if (intel.anchors.length > 0) {
    faqs.push({
      q: `How well connected is ${locationLabel}?`,
      a: `Measured from the centre of ${locationLabel}, ${intel.anchors
        .slice(0, 3)
        .map((a) => `${a.label} is about ${a.km} km away`)
        .join(", ")}. These are straight-line distances rather than driving times, which in Gurgaon traffic can differ a lot.`,
    });
  }

  if (intel.schools.length > 0 || intel.hospitals.length > 0) {
    const bits: string[] = [];
    if (intel.schools.length) {
      bits.push(`schools including ${intel.schools.slice(0, 2).map((s) => s.name).join(" and ")}`);
    }
    if (intel.hospitals.length) {
      bits.push(`hospitals including ${intel.hospitals.slice(0, 2).map((h) => h.name).join(" and ")}`);
    }
    faqs.push({
      q: `What schools and hospitals are near ${locationLabel}?`,
      a: `Within roughly 3 km of the centre of ${locationLabel} there are ${bits.join(", and ")}.`,
    });
  }

  return faqs;
}
