// Computed sector intelligence (2026-09-19).
//
// Audit item 7: "Sector pages are a title and a card grid. The pages that rank
// carry rates, connectivity, social infrastructure, pros and cons, and FAQs."
// A templated sentence plus a grid of cards is thin against a small broker's
// sector guide leading with real per-sq-ft rates, and those broker guides are
// what currently occupy the results for "property in sector 65 gurgaon".
//
// This computes the missing substance from Homz's own catalogue and the
// committed OSM dataset — the same engine behind lib/intelligence/listingContext.ts.
// Nothing is copied, paraphrased or model-generated, and every figure is
// derived from records the site already holds, so it stays true as inventory
// changes.
//
// Every field is nullable and the page omits sections it cannot compute: a
// sector with four projects should render a short honest page, not a padded one.

import { haversineKm, nearbyLandmarks } from "./osmPlaces";
import { resolveCoordinate } from "./resolveLocation";
import { GURGAON_ANCHORS } from "./listingContext";
import type { NormalizedProject } from "./normalize";

export type SectorPriceStats = {
  /** Median project entry price in the sector, INR. */
  medianInr: number;
  minInr: number;
  maxInr: number;
  /** How many projects carried a parsed price. Always shown alongside the
   *  median so a reader knows the base it rests on. */
  pricedCount: number;
  /** Total projects in the sector, priced or not. */
  totalCount: number;
  /** Median per-sq-ft rate, when enough projects carry both price and size.
   *  This is the number the ranking broker guides lead with. */
  perSqFtInr: number | null;
  perSqFtSample: number;
};

export type SectorContext = {
  price: SectorPriceStats | null;
  anchors: { key: string; label: string; km: number }[];
  schools: { name: string; distanceKm: number }[];
  hospitals: { name: string; distanceKm: number }[];
  malls: { name: string; distanceKm: number }[];
  /** Builders active in the sector, by project count, most first. */
  builders: { name: string; count: number }[];
  /** Possession mix, so a reader can tell a ready-to-move sector from a
   *  under-construction one at a glance. */
  readyToMove: number;
  underConstruction: number;
  newLaunch: number;
  coordinatePrecision: "sector" | "microMarket" | "cityAnchor";
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function priceStats(projects: NormalizedProject[]): SectorPriceStats | null {
  const priced = projects
    .map((p) => p.min_price_inr)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);

  // Below four priced projects a "median" is noise presented as insight.
  if (priced.length < 4) return null;

  // Per-sq-ft needs both a price and a confirmed size on the same record.
  // size_unit is null when the unit could not be confirmed (see
  // normalize.ts's detectAreaUnit) -- those are excluded rather than assumed
  // to be sq.ft, which is the bug DEV-02 fixed upstream.
  const rates: number[] = [];
  for (const p of projects) {
    const price = p.min_price_inr;
    const size = p.min_size;
    if (
      typeof price === "number" && price > 0 &&
      typeof size === "number" && size > 0 &&
      p.size_unit === "sq.ft"
    ) {
      rates.push(Math.round(price / size));
    }
  }

  return {
    medianInr: median(priced)!,
    minInr: Math.min(...priced),
    maxInr: Math.max(...priced),
    pricedCount: priced.length,
    totalCount: projects.length,
    perSqFtInr: rates.length >= 4 ? median(rates) : null,
    perSqFtSample: rates.length,
  };
}

export function buildSectorContext(
  cityKey: string,
  sectorLabel: string,
  projects: NormalizedProject[]
): SectorContext {
  const coords = resolveCoordinate(cityKey, sectorLabel, null);
  const landmarks = nearbyLandmarks(coords.lat, coords.lng, coords.precision);
  const take = (key: string, n = 4) =>
    (landmarks[key] || []).slice(0, n).map((l) => ({
      name: l.name,
      distanceKm: l.distance_km,
    }));

  const builderCounts = new Map<string, number>();
  for (const p of projects) {
    // "Unknown" is normalize.ts's honest fallback for a title whose first word
    // is not a company name -- it must never surface as a builder.
    if (!p.builder || p.builder === "Unknown") continue;
    builderCounts.set(p.builder, (builderCounts.get(p.builder) ?? 0) + 1);
  }

  const statusOf = (p: NormalizedProject) => (p.project_status || "").toLowerCase();

  return {
    price: priceStats(projects),
    anchors:
      coords.precision === "cityAnchor"
        ? []
        : GURGAON_ANCHORS.map((a) => ({
            key: a.key,
            label: a.label,
            km: Math.round(haversineKm(coords.lat, coords.lng, a.lat, a.lng) * 10) / 10,
          }))
            .filter((a) => a.km > 0)
            .sort((a, b) => a.km - b.km),
    schools: take("Schools"),
    hospitals: take("Hospitals"),
    malls: take("Shopping Centres", 3),
    builders: [...builderCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    readyToMove: projects.filter((p) => /ready|rtm|completed|delivered/.test(statusOf(p))).length,
    underConstruction: projects.filter((p) => /under.?construction|ongoing/.test(statusOf(p))).length,
    newLaunch: projects.filter((p) => /new.?launch|launch/.test(statusOf(p))).length,
    coordinatePrecision: coords.precision,
  };
}

/**
 * FAQs for the sector, answered from the computed context.
 *
 * Only questions the data can actually answer are emitted -- this feeds
 * FAQPage markup, and an answer that hedges because the number is missing is
 * worse than no question. Mirrors the questions these searches actually carry
 * ("what is the rate in sector X", "is it ready to move", "which builders").
 */
export function buildSectorFaqs(
  sectorLabel: string,
  cityName: string,
  ctx: SectorContext,
  formatInr: (n: number | null | undefined) => string | null
): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];

  if (ctx.price?.perSqFtInr) {
    faqs.push({
      q: `What is the property rate in ${sectorLabel}, ${cityName}?`,
      a: `Across the ${ctx.price.perSqFtSample} projects in ${sectorLabel} that list both a price and a confirmed size, the median works out to about ₹${ctx.price.perSqFtInr.toLocaleString("en-IN")} per sq ft. That is a listed asking rate from HomzRealtor's catalogue, not a transacted price, and individual projects sit either side of it.`,
    });
  }

  if (ctx.price) {
    faqs.push({
      q: `What do properties cost in ${sectorLabel}?`,
      a: `Entry prices across the ${ctx.price.pricedCount} priced projects here run from ${formatInr(ctx.price.minInr)} to ${formatInr(ctx.price.maxInr)}, with a median of ${formatInr(ctx.price.medianInr)}. ${ctx.price.totalCount - ctx.price.pricedCount > 0 ? `A further ${ctx.price.totalCount - ctx.price.pricedCount} project${ctx.price.totalCount - ctx.price.pricedCount === 1 ? " is" : "s are"} listed as price on request.` : ""}`.trim(),
    });
  }

  const totalStatus = ctx.readyToMove + ctx.underConstruction + ctx.newLaunch;
  if (totalStatus > 0) {
    faqs.push({
      q: `Are there ready-to-move properties in ${sectorLabel}?`,
      a: `Of the projects HomzRealtor tracks in ${sectorLabel}, ${ctx.readyToMove} ${ctx.readyToMove === 1 ? "is" : "are"} ready to move, ${ctx.underConstruction} ${ctx.underConstruction === 1 ? "is" : "are"} under construction and ${ctx.newLaunch} ${ctx.newLaunch === 1 ? "is a" : "are"} new launch${ctx.newLaunch === 1 ? "" : "es"}.`,
    });
  }

  if (ctx.anchors.length > 0) {
    const top = ctx.anchors.slice(0, 3).map((a) => `${a.label} is about ${a.km} km away`);
    faqs.push({
      q: `How well connected is ${sectorLabel}?`,
      a: `Measured from the sector centre, ${top.join(", ")}. These are straight-line distances rather than driving times.`,
    });
  }

  if (ctx.schools.length > 0 || ctx.hospitals.length > 0) {
    const bits: string[] = [];
    if (ctx.schools.length) bits.push(`schools including ${ctx.schools.slice(0, 2).map((s) => s.name).join(" and ")}`);
    if (ctx.hospitals.length) bits.push(`hospitals including ${ctx.hospitals.slice(0, 2).map((h) => h.name).join(" and ")}`);
    faqs.push({
      q: `What schools and hospitals are near ${sectorLabel}?`,
      a: `Within roughly 3 km of the sector centre there are ${bits.join(", and ")}.`,
    });
  }

  if (ctx.builders.length > 0) {
    faqs.push({
      q: `Which builders have projects in ${sectorLabel}?`,
      a: `${ctx.builders.slice(0, 5).map((b) => `${b.name} (${b.count} project${b.count === 1 ? "" : "s"})`).join(", ")}${ctx.builders.length > 5 ? ", among others" : ""}.`,
    });
  }

  return faqs;
}
