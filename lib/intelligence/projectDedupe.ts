// Collapses the same project appearing twice in the feed (2026-09-19).
//
// The 19 Sep audit found three kinds of junk on one sector page alone:
// "Emaar Emerald Floors Select" alongside "Emaar Emrald Floors Select", and
// M3M St Andrews listed twice. Both are one development occupying two URLs,
// which splits its ranking signals, shows a visitor two pages for the same
// thing, and inflates every count computed off the catalogue -- the sector
// medians, the developer portfolio figures, the project totals in copy.
//
// This is the project-level twin of lib/listings/identity.ts, and it is
// deliberately the same shape of rule: merge only where the records cannot
// plausibly be different developments, keep the richer record, lose nothing.
//
// It never drops a URL. A collapsed slug resolves to its canonical twin and
// the page redirects, so an indexed duplicate consolidates into the surviving
// page instead of turning into a 404.
//
// What it will NOT merge, and why the guards exist:
//   - anything where the digits differ. "M3M Tower 1"/"M3M Tower 2",
//     "Phase 2"/"Phase 3", "Sector 65"/"Sector 66" are distinct
//     developments whose names are one character apart. Digits must match
//     exactly before edit distance is even considered.
//   - anything from a different builder, sector, city or category.
//   - short names, where two characters is a large share of the name.
//   - anything needing more than a two-character correction, which is a
//     different name rather than a misspelling of the same one.

import type { NormalizedProject } from "./normalize";

/** Words that carry no identity — present in one listing of a project and
 *  absent from another for the same development. */
const NOISE = new Set([
  "the", "a", "an", "at", "by", "in", "of", "and",
  "project", "projects", "property", "properties",
  "apartment", "apartments", "flat", "flats",
  "residency", "residences", "residence",
  "society", "complex", "enclave",
  "gurgaon", "gurugram", "haryana", "india", "delhi", "ncr",
  "new", "launch", "sale", "resale",
]);

/** The name with its sector reference removed. The sector is already part of
 *  the bucket key, and one listing of a project carries it in the title while
 *  another does not -- "Emaar Palm Gardens Sector 83" and "Emaar Palm
 *  Gardens" are the same development. Everything below reads this rather than
 *  the raw name, digitSignature included: a sector number left in would
 *  otherwise block exactly the merge this exists to make. */
function strippedName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsec(?:tor)?\s*\d{1,3}\s*[a-d]?\b/g, " ")
    .trim();
}

function nameTokens(name: string): string[] {
  return strippedName(name)
    .split(" ")
    .filter((t) => t && !NOISE.has(t));
}

/** Every digit run left in the name once the sector is set aside, in order.
 *  Two names may only be considered the same development if these are
 *  identical -- see the header. */
function digitSignature(name: string): string {
  return (strippedName(name).match(/\d+/g) || []).join(".");
}

/** Levenshtein distance, abandoned as soon as it exceeds `max`. */
function editDistanceWithin(a: string, b: string, max: number): number | null {
  if (Math.abs(a.length - b.length) > max) return null;
  if (a === b) return 0;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1);
    row[0] = i;
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (row[j] < best) best = row[j];
    }
    // Every remaining path runs through this row, so if the whole row is
    // already past the budget the answer cannot come back under it.
    if (best > max) return null;
    prev = row;
  }
  return prev[b.length] <= max ? prev[b.length] : null;
}

/** The bucket two records must share before their names are compared at all. */
function bucketKey(p: NormalizedProject): string {
  return [
    p.city_key,
    (p.builder || "").toLowerCase(),
    (p.sector || "").toLowerCase(),
    (p.property_category || "").toLowerCase(),
  ].join("|");
}

/** How much a record actually tells a visitor. The richer of two duplicates
 *  survives; the tie-break on slug is only there to make the outcome
 *  deterministic across rebuilds, so a page does not swap identity between
 *  one regeneration and the next. */
function richness(p: NormalizedProject): number[] {
  return [
    p.images.length,
    (p.about || []).join(" ").length,
    (p.specifications || []).length,
    (p.amenities || []).length,
    (p.price_list || []).length,
    p.min_price_inr ? 1 : 0,
    p.rera_id ? 1 : 0,
  ];
}

function isRicher(a: NormalizedProject, b: NormalizedProject): boolean {
  const ra = richness(a);
  const rb = richness(b);
  for (let i = 0; i < ra.length; i++) {
    if (ra[i] !== rb[i]) return ra[i] > rb[i];
  }
  return a.slug < b.slug;
}

export type CollapseResult = {
  projects: NormalizedProject[];
  /** Collapsed slug -> the slug that survived, per city. Consumed by
   *  getProjectBySlug so the losing URL redirects rather than 404s. */
  aliases: Map<string, string>;
};

export function collapseDuplicateProjects(input: NormalizedProject[]): CollapseResult {
  const buckets = new Map<string, NormalizedProject[]>();
  for (const p of input) {
    // "Unknown" is normalize.ts's honest fallback when the title's first word
    // is not a company name. Two records with an unknown builder are not
    // evidence of anything, so they are never merged on that basis.
    if (!p.builder || p.builder === "Unknown" || !p.sector) {
      buckets.set(`solo:${p.city_key}:${p.slug}`, [p]);
      continue;
    }
    const key = bucketKey(p);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(p);
    else buckets.set(key, [p]);
  }

  const aliases = new Map<string, string>();
  const out: NormalizedProject[] = [];

  for (const bucket of buckets.values()) {
    if (bucket.length === 1) {
      out.push(bucket[0]);
      continue;
    }

    // Groups of records judged to be one development.
    const groups: NormalizedProject[][] = [];
    for (const p of bucket) {
      const tokens = nameTokens(p.project_name);
      const joined = tokens.slice().sort().join("");
      const digits = digitSignature(p.project_name);

      const match = groups.find((g) => {
        const q = g[0];
        if (digitSignature(q.project_name) !== digits) return false;
        const qTokens = nameTokens(q.project_name);
        const qJoined = qTokens.slice().sort().join("");
        // Identical once word order and noise are set aside.
        if (qJoined === joined) return true;
        // A misspelling: same development, one or two characters adrift.
        // Short names are excluded -- at ten characters, two corrections is
        // a fifth of the name and stops being a typo.
        if (joined.length < 10 || qJoined.length < 10) return false;
        return editDistanceWithin(joined, qJoined, 2) !== null;
      });

      if (match) match.push(p);
      else groups.push([p]);
    }

    for (const group of groups) {
      if (group.length === 1) {
        out.push(group[0]);
        continue;
      }
      const winner = group.reduce((best, p) => (isRicher(p, best) ? p : best));
      // Nothing is thrown away: photography from the collapsed records is
      // carried onto the surviving page, deduped and in order.
      const images = [...new Set(group.flatMap((p) => p.images))];
      const interior = [...new Set(group.flatMap((p) => p.interior_images))];
      out.push({ ...winner, images, interior_images: interior });
      for (const loser of group) {
        if (loser.slug !== winner.slug) {
          aliases.set(`${loser.city_key}:${loser.slug}`, winner.slug);
        }
      }
    }
  }

  return { projects: out, aliases };
}
