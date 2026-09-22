// Corrections applied to feed data before anything renders it (2026-09-21).
//
// From the 21 Sep audit, which put data integrity across the programmatic
// layer above every other SEO problem on the site and was right to: a wrong
// category contaminates the category pages, the internal links, the
// breadcrumbs, the similar-property recommendations, the structured data and
// Google's understanding of the project all at once. Meta descriptions do not
// matter next to that.
//
// Two findings are handled here.
//
// 1. COMPETITOR CONTENT LEAKING INTO OUR OWN COPY. The audit found this inside
//    the M3M Latitude project description:
//
//        "Square Yards exceptional legal team can assist you..."
//
//    A HomzRealtor page advertising a competitor's legal team is bad enough on
//    its own. What it actually signals is worse: that prose reached our
//    template from an external source without being cleaned, which is exactly
//    the "scaled content assembled from scraped or stitched sources" Google's
//    spam guidance names. Removing it from one URL would fix nothing.
//
// 2. RESIDENTIAL RECORDS CARRYING COMMERCIAL CLASSIFICATIONS. Flats typed as
//    Warehouse or Retail Shop, and residential projects arriving in the
//    upstream commercial bucket.
//
// Both are corrected at the single boundary every consumer reads through
// (lib/listings/segmentCache.ts for listings, normalizeProject for projects),
// so a correction reaches the grid, the category pages, the medians, the
// sitemap and the structured data at the same moment — not page by page.
//
// The direction of every correction is deliberately one-way. See the note on
// each.

import type { RawHomzProperty } from "@/lib/scraping/homzbackend";

// --------------------------------------------------------- competitor content

/**
 * The portals this catalogue is aggregated from, plus the other majors.
 *
 * Matching is on word boundaries and tolerant of the spacings the feed uses
 * ("Square Yards", "SquareYards", "square-yards"). "Housing.com" is matched
 * with the domain required, because the bare word "housing" is ordinary
 * English in property copy ("housing society", "affordable housing") and
 * stripping sentences containing it would delete real content.
 */
export const COMPETITOR_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "Square Yards", re: /\bsquare[\s-]?yards?\b/i },
  { label: "MagicBricks", re: /\bmagic[\s-]?bricks?\b/i },
  { label: "99acres", re: /\b99\s?acres\b/i },
  { label: "Housing.com", re: /\bhousing\.com\b/i },
  { label: "NoBroker", re: /\bno[\s-]?broker\b/i },
  { label: "PropTiger", re: /\bprop[\s-]?tiger\b/i },
  { label: "CommonFloor", re: /\bcommon[\s-]?floor\b/i },
  { label: "Makaan", re: /\bmakaan\b/i },
  { label: "Quikr", re: /\bquikr\b/i },
  { label: "OLX", re: /\bolx\b/i },
];

export function competitorMentions(text: string | null | undefined): string[] {
  if (!text) return [];
  return COMPETITOR_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.label);
}

/**
 * Drop whole sentences that name a competitor, rather than just the name.
 *
 * Deleting only the brand leaves "exceptional legal team can assist you..."
 * behind — a dangling offer of a service that is now attributed to nobody,
 * which is worse than the original because it reads as ours. The sentence is
 * the smallest unit that can be removed without leaving a lie.
 *
 * Returns null when nothing survives, so callers can drop the paragraph
 * instead of rendering an empty one.
 */
export function stripCompetitorProse(text: string | null | undefined): string | null {
  if (!text) return null;
  // Split on sentence ends while keeping the terminator, so rejoining does not
  // mangle the punctuation of the sentences that stay.
  const parts = text.split(/(?<=[.!?])\s+/);
  const kept = parts.filter((s) => competitorMentions(s).length === 0);
  const out = kept.join(" ").replace(/\s{2,}/g, " ").trim();
  return out.length > 0 ? out : null;
}

/** Same, over the paragraph arrays the feed uses for `about`/`aboutProject`. */
export function stripCompetitorParagraphs(
  paragraphs: (string | null | undefined)[] | null | undefined
): string[] {
  if (!Array.isArray(paragraphs)) return [];
  return paragraphs
    .map((p) => stripCompetitorProse(p))
    .filter((p): p is string => Boolean(p && p.trim()));
}

/**
 * Strip competitor prose from the structured fields, not just the paragraphs.
 *
 * Checklist item 2 asks for "all text fields — price section, FAQs,
 * investment sections, specifications", and the first pass only covered
 * `aboutProject`, `about` and `builderDescription`. Everything else the feed
 * sends as structured data — specification rows, amenity labels, the recent-
 * updates feed, the master-plan caption, price-list notes — passed through
 * untouched, and any of them can carry the same syndicated sentence.
 *
 * Rules, and the reasoning for each:
 *
 *   - Strings are sentence-stripped, same as prose.
 *   - A short LABEL that is entirely a competitor mention ("Square Yards
 *     Verified") strips to nothing. Returning "" would render an empty table
 *     row or a blank chip, so the whole entry is dropped instead: `null` for
 *     a scalar, and the element is removed from its array.
 *   - An object loses ONE string field entirely, and the whole object goes.
 *     Keeping the rest renders a half-record: a specification row that is a
 *     heading with no value is a blank table row, which is worse than the
 *     row's absence. It also means a record part of which was pure competitor
 *     content is not treated as trustworthy in its remaining parts. This
 *     discards a little more than the minimum, deliberately.
 *   - Nothing is invented to fill a hole. A specification row whose value was
 *     entirely competitor text is not worth keeping with a guessed value.
 *   - Keys are never touched, only values. A key is our own schema.
 *
 * Returns the input unchanged (by reference) when nothing matched, so this is
 * cheap on the overwhelming majority of records that are clean.
 */
export function stripCompetitorDeep<T>(value: T): T {
  if (typeof value === "string") {
    if (competitorMentions(value).length === 0) return value;
    return stripCompetitorProse(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    let changed = false;
    const out: unknown[] = [];
    for (const item of value) {
      const next = stripCompetitorDeep(item);
      if (next !== item) changed = true;
      // A string that stripped to nothing, or an object that lost every field
      // it had, leaves no row worth rendering.
      if (next === null || next === undefined) continue;
      if (typeof next === "object" && !Array.isArray(next) && Object.keys(next).length === 0) {
        continue;
      }
      out.push(next);
    }
    return (changed ? out : value) as unknown as T;
  }

  if (value && typeof value === "object") {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      const next = stripCompetitorDeep(v);
      if (next !== v) changed = true;
      // A string field that survived nothing takes the record with it — see
      // the half-record rule above. So does a list that emptied out: an
      // amenity group whose every amenity was competitor text is a heading
      // over nothing.
      if (next === null && typeof v === "string") return null as unknown as T;
      if (Array.isArray(v) && v.length > 0 && Array.isArray(next) && next.length === 0) {
        return null as unknown as T;
      }
      out[key] = next;
    }
    return (changed ? out : value) as unknown as T;
  }

  return value;
}

// ----------------------------------------------------------- classification

/** Property types that only describe commercial space. */
const COMMERCIAL_TYPES = new Set([
  "office",
  "retail_shop",
  "showroom",
  "warehouse",
  "co_working",
]);

/**
 * "3 BHK", "2 BHK + 2T", "1 RK" — the Bedroom-Hall-Kitchen / Room-Kitchen
 * format, which only ever describes a residential unit. This is the same
 * narrow signal the project-side correction has relied on since DEV-02
 * (2026-09-16); see the note in normalize.ts.
 */
const RESIDENTIAL_CONFIG = /\b\d+\s*(?:BHK|RK)\b/i;

/** A residential unit type named in the listing title, when it is explicit. */
function residentialTypeFromTitle(title: string | null | undefined): string | null {
  const t = String(title ?? "");
  if (/\bpenthouse\b/i.test(t)) return "penthouse";
  if (/\bvilla\b/i.test(t)) return "villa";
  if (/\bbuilder\s*floor\b/i.test(t)) return "builder_floor";
  if (/\bindependent\s*(house|kothi)\b/i.test(t)) return "independent_house";
  if (/\bstudio\b/i.test(t)) return "studio";
  if (/\b(flat|apartment)\b/i.test(t)) return "apartment";
  return null;
}

export type ListingClassification = {
  /** True when a commercial-typed record is unambiguously a home. */
  misclassified: boolean;
  /** The type to use instead, or null when no specific type is evidenced. */
  correctedType: string | null;
  /** Human-readable reason, for the QA report. */
  reason: string | null;
};

/**
 * Detect a residential unit wearing a commercial property type.
 *
 * ONE DIRECTION ONLY, and this is the important part: a commercial type plus a
 * BHK/RK configuration or a bedroom count is strong evidence the type is
 * wrong, because neither of those describes an office or a warehouse. The
 * reverse — a residential type on a record that merely mentions "commercial"
 * somewhere — is not remotely the same strength of evidence, so it is never
 * corrected. A wrong correction is worse than the wrong source value, since it
 * hides the problem instead of reporting it.
 *
 * When no residential type is evidenced in the title, correctedType is null:
 * "not confirmed" is honest, and naming it an apartment on no evidence would
 * be inventing a fact to make a page look tidier.
 */
export function classifyListing(p: RawHomzProperty): ListingClassification {
  const type = String(p.propertyType ?? "");
  if (!COMMERCIAL_TYPES.has(type)) {
    return { misclassified: false, correctedType: null, reason: null };
  }

  const hasBedrooms = typeof p.bedrooms === "number" && p.bedrooms >= 1;
  const hasResidentialConfig =
    RESIDENTIAL_CONFIG.test(String(p.configuration ?? "")) ||
    RESIDENTIAL_CONFIG.test(String(p.title ?? ""));

  if (!hasBedrooms && !hasResidentialConfig) {
    return { misclassified: false, correctedType: null, reason: null };
  }

  const evidence = [
    hasResidentialConfig ? "BHK/RK configuration" : null,
    hasBedrooms ? `bedrooms=${p.bedrooms}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    misclassified: true,
    correctedType: residentialTypeFromTitle(p.title),
    reason: `typed "${type}" but has ${evidence}`,
  };
}

/**
 * The corrected listing, or the original when nothing needed changing.
 *
 * Carries `reclassified` so the commercial category pages can exclude these
 * records (a flat has no business on a commercial landing page, which is the
 * contamination the audit describes) and so the QA report can count them
 * without re-deriving the judgement.
 */
/**
 * Every listing field that can carry free text from the source.
 *
 * 2026-09-22, checklist item 2 ("Check ALL text fields, not just the
 * description: price section, FAQs, investment sections, specifications").
 * The first pass covered aboutProject and builderDescription only. A
 * specification row reading "Square Yards verified" or an aiSummary carrying
 * the provider's own sentence rendered untouched, on the same page that had
 * just been cleaned.
 *
 * `title` and `location` are deliberately absent. They are identity fields:
 * blanking a title leaves a listing with no name and no heading, which breaks
 * the page rather than cleaning it. A competitor name appearing there is a
 * feed-level problem for check-data-quality.mjs to report, not something to
 * paper over at render time.
 */
const LISTING_TEXT_FIELDS = [
  "aboutProject",
  "builderDescription",
  "specifications",
  "amenities",
  "masterPlan",
  "aiSummary",
] as const;

export function sanitizeListing(p: RawHomzProperty): RawHomzProperty {
  const cls = classifyListing(p);

  const dirty = LISTING_TEXT_FIELDS.filter((f) => {
    const v = p[f];
    if (v == null) return false;
    // A cheap scan of the field's own text, so a clean record (the large
    // majority) costs one regex pass per field and no object rebuilding.
    return competitorMentions(typeof v === "string" ? v : JSON.stringify(v)).length > 0;
  });

  if (!cls.misclassified && dirty.length === 0) return p;

  const next: RawHomzProperty = { ...p };

  if (cls.misclassified) {
    next.propertyType = cls.correctedType ?? undefined;
    next.isCommercial = false;
    next.reclassified = "residential-in-commercial";
  }

  // Handled field by field rather than through one loop: each has its own
  // shape, and a generic assignment back into RawHomzProperty widens every
  // one of them to the union of all of them.
  for (const field of dirty) {
    switch (field) {
      case "aboutProject":
        next.aboutProject = Array.isArray(p.aboutProject)
          ? stripCompetitorParagraphs(p.aboutProject)
          : undefined;
        break;
      case "builderDescription":
        next.builderDescription = stripCompetitorProse(p.builderDescription) ?? undefined;
        break;
      case "aiSummary":
        next.aiSummary = stripCompetitorProse(p.aiSummary) ?? null;
        break;
      case "specifications":
        next.specifications = stripCompetitorDeep(p.specifications);
        break;
      case "amenities":
        next.amenities = stripCompetitorDeep(p.amenities);
        break;
      case "masterPlan":
        next.masterPlan = stripCompetitorDeep(p.masterPlan) ?? undefined;
        break;
    }
  }

  return next;
}

/** Applied to a whole segment at the cache boundary. */
export function sanitizeSegment(list: RawHomzProperty[]): RawHomzProperty[] {
  return list.map(sanitizeListing);
}

// -------------------------------------------------------------- project side

/**
 * Residential evidence for a project sitting in the upstream commercial
 * bucket, beyond the BHKType signal the correction already used.
 *
 * Same one-way rule: this only ever moves Commercial -> Residential. The extra
 * signals exist because BHKType alone is often absent on exactly the records
 * that need correcting, and "512 spacious homes" or "residential towers" in
 * the project's own description is not ambiguous.
 */
export function projectLooksResidential(
  bhkType: unknown,
  name: string | null | undefined,
  about: (string | null | undefined)[] | null | undefined
): boolean {
  if (typeof bhkType === "string" && RESIDENTIAL_CONFIG.test(bhkType)) return true;
  if (typeof bhkType === "string" && /\bBHK\b/i.test(bhkType)) return true;

  const blob = [name, ...(Array.isArray(about) ? about : [])].filter(Boolean).join(" ");
  if (!blob) return false;

  // Each of these describes homes and nothing else. "residential" on its own
  // is deliberately not enough — a commercial complex's copy routinely says
  // "close to residential catchment".
  return /\b\d+\s*(?:BHK|RK)\b/i.test(blob) ||
    /\bresidential\s+(?:apartments?|towers?|project|complex|society|homes?)\b/i.test(blob) ||
    /\b(?:spacious|luxurious|premium)\s+(?:homes|apartments|flats)\b/i.test(blob) ||
    /\bapartments?\s+(?:for\s+sale|with)\b/i.test(blob);
}
