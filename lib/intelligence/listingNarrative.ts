// Original listing narrative (2026-09-19).
//
// Google's spam policies name two patterns that both applied here: scraping a
// feed to generate many pages, and generating many pages with AI without
// adding value. The site was doing both — the detail page rendered the source
// portal's own description, and `lib/intelligence/content.ts` put an LLM
// paraphrase of the same facts on top. A paraphrase of scraped copy is still
// scraped copy, and is exactly what "scaled content abuse" describes.
//
// This module replaces that with description text composed deterministically
// from Homz's own structured fields and the computed context in
// listingContext.ts. There is no model call, no source prose in, and no
// randomness: the same record always produces the same sentences, so the page
// is stable across rebuilds and reviewable by a human.
//
// Rules this file holds itself to:
//   - Never state a fact that is not in a structured field.
//   - Never characterise value ("great investment", "prime location",
//     "selling fast"). The sector price delta is a computed number and is
//     allowed; an adjective about it is not.
//   - Omit a sentence entirely rather than emit one with a hole in it.

import type { ListingContext } from "./listingContext";
import { formatInr } from "./normalize";

export type NarrativeInput = {
  configuration: string | null;
  bedrooms: number | null;
  propertyTypeLabel: string | null;
  areaText: string | null;
  location: string | null;
  priceText: string;
  hasPrice: boolean;
  priceIsMonthly: boolean;
  status: string | null;
  possession: string | null;
  amenityCount: number;
  topAmenities: string[];
  listingId: string;
  postingCount: number;
};

function unitPhrase(i: NarrativeInput): string {
  const config = i.configuration || (i.bedrooms ? `${i.bedrooms} BHK` : null);
  const type = i.propertyTypeLabel;
  if (config && type) return `${config} ${type.toLowerCase()}`;
  if (config) return config;
  if (type) return type.toLowerCase();
  return "property";
}

/** Lead sentence: what the unit is and where. Structured fields only. */
function leadSentence(i: NarrativeInput, ctx: ListingContext): string | null {
  const unit = unitPhrase(i);
  const where = ctx.sectorLabel || i.location;
  if (!where) return null;

  const area = i.areaText ? ` measuring ${i.areaText}` : "";
  const verb = i.priceIsMonthly ? "available to rent" : "available to buy";
  const project = ctx.project ? ` in ${ctx.project.name},` : "";
  return `This is a ${unit}${area}${project} in ${where}, ${verb} through HomzRealtor.`;
}

/** Price, and where it sits against the sector. The delta is computed in
 *  listingContext.ts across the live segment — a portal listing has no
 *  equivalent. Stated as a number and a direction, never as a judgement. */
function priceSentence(i: NarrativeInput, ctx: ListingContext): string | null {
  if (!i.hasPrice) return null;
  const basis = i.priceIsMonthly ? "monthly rent" : "asking price";
  let s = `The ${basis} is ${i.priceText}.`;

  const p = ctx.price;
  if (p) {
    const med = formatInr(p.medianInr);
    const comparable = p.bedroomMatched
      ? `${p.sampleSize} comparable ${i.bedrooms} BHK listings`
      : `${p.sampleSize} comparable listings`;
    const direction =
      p.deltaPct === 0
        ? "level with"
        : p.deltaPct < 0
          ? `${Math.abs(p.deltaPct)}% below`
          : `${p.deltaPct}% above`;
    s += ` Across ${comparable} we currently track in Sector ${p.sector.toUpperCase()}, the median is ${med}, which puts this one ${direction} the sector median.`;
  }
  return s;
}

/** Commute context, from real distances to the anchors Gurgaon buyers ask
 *  about. Suppressed entirely when the coordinate was a city-centre fallback. */
function commuteSentence(ctx: ListingContext): string | null {
  if (ctx.anchors.length === 0) return null;
  const top = ctx.anchors.slice(0, 3).map((a) => `${a.label} ${a.km} km`);
  if (top.length === 0) return null;
  return `Measured from the sector centre, the nearest reference points are ${top.join(", ")}.`;
}

/** Nearby social infrastructure, named rather than counted. */
function amenitiesNearbySentence(ctx: ListingContext): string | null {
  const parts: string[] = [];
  if (ctx.schools.length) {
    parts.push(
      `schools including ${ctx.schools.slice(0, 2).map((s) => s.name).join(" and ")}`
    );
  }
  if (ctx.hospitals.length) {
    parts.push(
      `hospitals including ${ctx.hospitals.slice(0, 2).map((h) => h.name).join(" and ")}`
    );
  }
  if (parts.length === 0) return null;
  return `Within about 3 km there are ${parts.join(", and ")}.`;
}

/** Project-level facts joined from Homz's own catalogue — RERA, builder and
 *  possession the source listing does not carry. */
function projectSentence(ctx: ListingContext): string | null {
  const p = ctx.project;
  if (!p) return null;
  const bits: string[] = [];
  if (p.builder) bits.push(`developed by ${p.builder}`);
  if (p.possession) bits.push(`possession ${p.possession}`);
  if (p.reraId && p.reraStatus === "active") bits.push(`RERA ${p.reraId}`);
  else if (p.reraId) bits.push(`RERA number on file: ${p.reraId} (status not independently confirmed)`);
  if (bits.length === 0) return null;
  return `${p.name} is ${bits.join(", ")}.`;
}

/** In-unit amenities, counted and sampled from structured data. */
function inUnitSentence(i: NarrativeInput): string | null {
  if (i.amenityCount <= 0) return null;
  const sample = i.topAmenities.slice(0, 4);
  if (sample.length === 0) return `The project lists ${i.amenityCount} amenities.`;
  return `The project lists ${i.amenityCount} amenities, among them ${sample.join(", ")}.`;
}

/** Homz's own record-keeping — the listing ID a caller can quote, and whether
 *  we have consolidated several broker postings of the same unit. */
function recordSentence(i: NarrativeInput): string {
  const base = `HomzRealtor reference ${i.listingId}.`;
  if (i.postingCount > 1) {
    return `${base} We have consolidated ${i.postingCount} separate listings of this same unit into this single record.`;
  }
  return base;
}

/**
 * The full description. Paragraph one is the unit and its price context;
 * paragraph two is location and project context; paragraph three is Homz's
 * own record. Empty sentences drop out, so a sparse record produces a short
 * honest page rather than a padded one.
 */
export function buildListingNarrative(
  input: NarrativeInput,
  ctx: ListingContext
): string[] {
  const para1 = [leadSentence(input, ctx), priceSentence(input, ctx)].filter(Boolean);
  const para2 = [
    commuteSentence(ctx),
    amenitiesNearbySentence(ctx),
    projectSentence(ctx),
    inUnitSentence(input),
  ].filter(Boolean);
  const para3 = [recordSentence(input)];

  return [para1.join(" "), para2.join(" "), para3.join(" ")].filter((p) => p.length > 0);
}

/**
 * Meta description, from the same structured facts.
 *
 * Deliberately not the first paragraph of the body: a description that repeats
 * the opening sentence wastes the snippet. Leads with the differentiators a
 * searcher is choosing between — configuration, sector, price, and the sector
 * comparison only Homz computes.
 */
export function buildListingMetaDescription(
  input: NarrativeInput,
  ctx: ListingContext
): string {
  const unit = unitPhrase(input);
  const where = ctx.sectorLabel || input.location || "Gurgaon";
  const bits: string[] = [`${unit} in ${where}`];

  if (input.areaText) bits.push(input.areaText);
  if (input.hasPrice) bits.push(input.priceIsMonthly ? `${input.priceText} rent` : input.priceText);

  const p = ctx.price;
  if (p && p.deltaPct !== 0) {
    bits.push(
      `${Math.abs(p.deltaPct)}% ${p.deltaPct < 0 ? "below" : "above"} the Sector ${p.sector.toUpperCase()} median`
    );
  }
  if (ctx.project?.builder) bits.push(`by ${ctx.project.builder}`);

  const sentence = `${bits.join(" · ")}. Verified details, sector price comparison and site visits with HomzRealtor.`;
  return sentence.length > 160 ? `${sentence.slice(0, 157).trimEnd()}...` : sentence;
}
