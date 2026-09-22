// Whether a project comparison is worth indexing (2026-09-22).
//
// Checklist item 10: "Keep project comparison pages — they can become
// excellent high-intent SEO pages. But don't let every possible combination
// become indexable. Index only when: both projects are genuine alternatives;
// same general property category; similar geography/corridor; enough
// comparison data exists; the page has useful unique information. Noindex
// combinations like a commercial mall vs an unrelated residential apartment,
// or a Sector 113 luxury apartment vs a Sector 70 warehouse. Also keep
// low-value comparison pages out of XML sitemaps."
//
// WHAT THIS REPLACES. The route already defaulted to noindex,follow and kept
// an INDEXABLE_COMPARE_PAIRS allow-list for hand-picked promotions. That set
// was empty, and had been since it was added — so the route was safe and also
// producing exactly zero indexable comparison pages. Safe is not the goal; the
// item explicitly says these can be excellent pages. A hand-curated list was
// never going to be filled in by anyone, because nobody knows which of ~10^6
// possible pairs deserve it without computing something.
//
// So this computes it. The five conditions the item lists become two hard
// gates and four scored criteria. The gates are hard because no amount of
// quality elsewhere rescues them: comparing a warehouse to a flat is not a
// comparison a buyer is making, whatever else the two records have. The four
// scored criteria are geography, comparable budget, how much data the two
// records actually share, and whether they differ anywhere worth a page.
//
// THE THRESHOLD IS DELIBERATELY HIGH. Index bloat on a combinatorial route is
// the failure mode that got this path robots-blocked once already (see
// DEV-03 in the route file). A pair that scores just under the bar loses
// nothing: the page still renders, still carries follow links to both
// projects, and is simply not offered to Google.

import type { NormalizedProject } from "./normalize";
import { projectStatusKind } from "./projectStatus";

export type CompareCriterion = {
  key: string;
  label: string;
  /** Points earned, out of max. */
  earned: number;
  max: number;
  /** Why, in a sentence, for the report and the page's own disclosure. */
  note: string;
};

export type CompareQuality = {
  score: number;
  /** Below this and the page is noindex,follow and absent from the sitemap. */
  threshold: number;
  indexable: boolean;
  /** Set when a hard gate failed — nothing else was even scored. */
  disqualifiedBy: string | null;
  criteria: CompareCriterion[];
};

export const COMPARE_INDEX_THRESHOLD = 70;

/** Corridors, for the geography test. Deliberately coarse: two projects in
 *  neighbouring sectors of the same corridor are alternatives even when the
 *  sector numbers differ. */
const CORRIDOR_PATTERNS: { slug: string; match: RegExp }[] = [
  { slug: "golf-course-extension", match: /golf\s*course\s*(extension|ext\.?)|^\s*gce\b/i },
  { slug: "golf-course", match: /golf\s*course\s*road/i },
  { slug: "dwarka-expressway", match: /dwarka\s*express\s*way/i },
  { slug: "new-gurgaon", match: /new\s*gur(gaon|ugram)/i },
  { slug: "sohna-road", match: /sohna\s*road/i },
  { slug: "spr", match: /southern\s*peripheral|(^|\s)spr(\s|$)/i },
];

function corridorOf(p: NormalizedProject): string | null {
  const blob = `${p.sector ?? ""} ${p.micro_market ?? ""} ${p.project_name ?? ""}`;
  return CORRIDOR_PATTERNS.find((c) => c.match.test(blob))?.slug ?? null;
}

function sectorNumber(p: NormalizedProject): number | null {
  const m = String(p.sector ?? "").match(/\b(\d{1,3})\b/);
  return m ? parseInt(m[1], 10) : null;
}

/** Residential unit types that are genuinely alternatives to one another. A
 *  buyer choosing between a 3 BHK flat and a 4 BHK flat is comparing; one
 *  choosing between a flat and a plot is doing something else. */
function broadType(p: NormalizedProject): "apartment" | "plot" | "villa" | "commercial" | "other" {
  if (p.property_category === "Commercial") return "commercial";
  const t = `${p.property_type ?? ""} ${p.project_name ?? ""}`;
  if (/\bplot|\bland\b/i.test(t)) return "plot";
  if (/\bvilla|\bfloor\b|independent/i.test(t)) return "villa";
  if (/\bbhk\b|apartment|residence/i.test(t)) return "apartment";
  return "other";
}

/** How far apart two prices are, as a ratio of the smaller. */
function priceGapRatio(a: number, b: number): number {
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return lo > 0 ? hi / lo : Infinity;
}

/**
 * Score a pair.
 *
 * The two hard gates come first and short-circuit. Everything after them is
 * additive, so a pair can fail one criterion and still clear the bar on the
 * strength of the rest — which is right, because a missing possession date is
 * not the same kind of problem as comparing a mall to a flat.
 */
export function scoreComparePair(a: NormalizedProject, b: NormalizedProject): CompareQuality {
  const criteria: CompareCriterion[] = [];
  const disqualify = (reason: string): CompareQuality => ({
    score: 0,
    threshold: COMPARE_INDEX_THRESHOLD,
    indexable: false,
    disqualifiedBy: reason,
    criteria,
  });

  // HARD GATE 1 — "same general property category". The item's own example:
  // "Commercial mall vs unrelated residential apartment".
  if (a.property_category !== b.property_category) {
    return disqualify(
      `${a.property_category} compared against ${b.property_category}: not the same kind of purchase.`
    );
  }

  // HARD GATE 2 — the item's other example, "Sector 113 luxury apartment vs
  // Sector 70 warehouse", is really a unit-type mismatch inside one category.
  // A flat and a plot are both residential and are not alternatives.
  const [typeA, typeB] = [broadType(a), broadType(b)];
  if (typeA !== typeB) {
    return disqualify(`A ${typeA} compared against a ${typeB}: different unit types.`);
  }

  // ── geography (30) ──────────────────────────────────────────────────────
  const [corrA, corrB] = [corridorOf(a), corridorOf(b)];
  const [secA, secB] = [sectorNumber(a), sectorNumber(b)];
  let geo = 0;
  let geoNote: string;
  if (a.sector && a.sector === b.sector) {
    geo = 30;
    geoNote = `Both in ${a.sector}.`;
  } else if (corrA && corrA === corrB) {
    geo = 26;
    geoNote = "Both on the same corridor.";
  } else if (secA != null && secB != null && Math.abs(secA - secB) <= 8) {
    geo = 20;
    geoNote = `Sectors ${secA} and ${secB} are close together.`;
  } else if (a.micro_market && a.micro_market === b.micro_market) {
    geo = 18;
    geoNote = `Both in ${a.micro_market}.`;
  } else {
    geo = 0;
    geoNote = "Different parts of the city, with no shared corridor or micro-market.";
  }
  criteria.push({ key: "geography", label: "Similar geography", earned: geo, max: 30, note: geoNote });

  // ── comparable price bracket (20) ───────────────────────────────────────
  //
  // "Genuine alternatives" is mostly a budget question. Someone weighing a
  // ₹1.2 Cr flat is not also weighing a ₹12 Cr one, and a page pretending
  // they are has no audience.
  const [pa, pb] = [a.min_price_inr, b.min_price_inr];
  let price = 0;
  let priceNote: string;
  if (pa != null && pb != null && pa > 0 && pb > 0) {
    const ratio = priceGapRatio(pa, pb);
    if (ratio <= 1.5) {
      price = 20;
      priceNote = "Entry prices within 50% of each other.";
    } else if (ratio <= 2.5) {
      price = 12;
      priceNote = "Entry prices within roughly 2.5x.";
    } else {
      price = 0;
      priceNote = `Entry prices differ by about ${Math.round(ratio)}x: different budgets entirely.`;
    }
  } else {
    // Not a penalty for being unpriced so much as an absence of evidence that
    // they are alternatives. Price on Request is common and legitimate.
    price = 6;
    priceNote = "At least one project is Price on Request, so budgets cannot be compared.";
  }
  criteria.push({ key: "price", label: "Comparable budget", earned: price, max: 20, note: priceNote });

  // ── enough data to fill a comparison (30) ───────────────────────────────
  //
  // "Enough comparison data exists". A table with four of its ten rows empty
  // on both sides is not a comparison, it is a stub.
  const FIELDS: { label: string; get: (p: NormalizedProject) => unknown }[] = [
    { label: "price", get: (p) => p.min_price_inr ?? p.price_text },
    { label: "configuration", get: (p) => p.property_type },
    { label: "status", get: (p) => p.project_status },
    { label: "possession", get: (p) => p.possession_text },
    { label: "location", get: (p) => p.sector ?? p.micro_market },
    { label: "developer", get: (p) => (p.builder && p.builder !== "Unknown" ? p.builder : null) },
    { label: "RERA", get: (p) => p.rera_id },
    { label: "size", get: (p) => p.min_size },
    { label: "amenities", get: (p) => (p.amenities?.length ? p.amenities.length : null) },
    { label: "images", get: (p) => (p.images?.length ? p.images.length : null) },
  ];
  const bothPresent = FIELDS.filter((f) => Boolean(f.get(a)) && Boolean(f.get(b)));
  const coverage = bothPresent.length / FIELDS.length;
  const data = Math.round(coverage * 30);
  criteria.push({
    key: "data",
    label: "Comparable data",
    earned: data,
    max: 30,
    note: `${bothPresent.length} of ${FIELDS.length} fields are present on both projects.`,
  });

  // ── something to actually say (20) ──────────────────────────────────────
  //
  // "Page has useful unique information". A comparison earns its URL when the
  // two projects DIFFER somewhere a buyer cares about. Two identical-looking
  // records produce a page whose every row reads the same, which is the
  // clearest possible signal there was nothing to compare.
  const differences: string[] = [];
  if (projectStatusKind(a.project_status) !== projectStatusKind(b.project_status)) {
    differences.push("construction status");
  }
  if (a.builder && b.builder && a.builder !== b.builder) differences.push("developer");
  if (a.sector && b.sector && a.sector !== b.sector) differences.push("sector");
  if (pa != null && pb != null && priceGapRatio(pa, pb) >= 1.15) differences.push("price");
  if (a.min_size != null && b.min_size != null && priceGapRatio(a.min_size, b.min_size) >= 1.15) {
    differences.push("unit size");
  }
  if (Boolean(a.rera_status === "active") !== Boolean(b.rera_status === "active")) {
    differences.push("RERA status");
  }
  const distinct = Math.min(differences.length * 5, 20);
  criteria.push({
    key: "distinct",
    label: "Meaningful differences",
    earned: distinct,
    max: 20,
    note:
      differences.length > 0
        ? `They differ on ${differences.join(", ")}.`
        : "The two records are near-identical on every field compared.",
  });

  const score = criteria.reduce((s, c) => s + c.earned, 0);
  return {
    score,
    threshold: COMPARE_INDEX_THRESHOLD,
    indexable: score >= COMPARE_INDEX_THRESHOLD,
    disqualifiedBy: null,
    criteria,
  };
}

/** The differences a comparison page should lead with, for item 11's
 *  "Key differences" section. Same derivation as the scoring above, returned
 *  as prose rather than a count. */
export function keyDifferences(a: NormalizedProject, b: NormalizedProject): string[] {
  const out: string[] = [];

  const kindA = projectStatusKind(a.project_status);
  const kindB = projectStatusKind(b.project_status);
  if (kindA !== kindB && kindA !== "unknown" && kindB !== "unknown") {
    out.push(
      `${a.project_name} is ${kindA.replace(/-/g, " ")} while ${b.project_name} is ${kindB.replace(/-/g, " ")}, ` +
        `so one carries a construction-completion wait the other does not.`
    );
  }

  if (a.min_price_inr && b.min_price_inr) {
    const ratio = priceGapRatio(a.min_price_inr, b.min_price_inr);
    if (ratio >= 1.15) {
      const dearer = a.min_price_inr > b.min_price_inr ? a : b;
      const cheaper = a.min_price_inr > b.min_price_inr ? b : a;
      out.push(
        `${dearer.project_name} starts about ${Math.round((ratio - 1) * 100)}% above ${cheaper.project_name} ` +
          `on entry asking price.`
      );
    }
  }

  if (a.min_size && b.min_size && priceGapRatio(a.min_size, b.min_size) >= 1.15) {
    const bigger = a.min_size > b.min_size ? a : b;
    out.push(`${bigger.project_name} starts at a larger entry unit size.`);
  }

  if (a.builder && b.builder && a.builder !== b.builder && a.builder !== "Unknown" && b.builder !== "Unknown") {
    out.push(`Different developers: ${a.builder} and ${b.builder}.`);
  }

  const reraA = a.rera_status === "active";
  const reraB = b.rera_status === "active";
  if (reraA !== reraB) {
    const registered = reraA ? a : b;
    const other = reraA ? b : a;
    out.push(
      `${registered.project_name} carries an active RERA registration in our records; ` +
        `${other.project_name} does not, which is worth checking directly on the HARERA portal.`
    );
  }

  if (a.sector && b.sector && a.sector !== b.sector) {
    out.push(`${a.project_name} is in ${a.sector}; ${b.project_name} is in ${b.sector}.`);
  }

  return out;
}
