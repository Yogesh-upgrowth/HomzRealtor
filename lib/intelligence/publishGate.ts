// The pre-publish QA gate (2026-09-22).
//
// Checklist item 9: "Don't rely on humans spotting incorrect records after
// they reach Google. Create a pre-publish QA engine." It then lists thirteen
// conditions to flag, and says projects failing validation should be
// "Draft / Needs Review rather than published automatically".
//
// WHAT "DRAFT" MEANS HERE, because this repository has no publish step. Every
// record arrives from an external feed at request time; there is no editor, no
// draft state and no save to intercept. The nearest thing with the same effect
// is the indexing decision, so a record that fails validation is WITHHELD FROM
// INDEXING: its page emits noindex,follow and it is dropped from the sitemap.
// It keeps rendering and stays crawlable, because the standing instruction on
// this project is that inventory is not to be deleted, and because a visitor
// who already has the URL should still reach the property. What changes is
// that we stop offering Google a record we know is wrong.
//
// That is a genuinely weaker thing than the checklist asks for, and the reason
// is worth stating plainly: the validation rules the item really wants — the
// ones that stop an impossible combination being SAVED — belong in the
// homz-scrape service that owns the database. This gate cannot prevent a bad
// record existing. It can stop us publishing it as though it were fine.
//
// ORDER OF OPERATIONS MATTERS. This runs AFTER the corrections in
// dataQuality.ts, not before. A residential flat typed as a warehouse is
// reclassified at the read boundary, so by the time it reaches here it is an
// apartment and rule `residentialCommercialType` does not fire. Anything still
// failing at this point is a record the correction layer could not rescue,
// which is exactly the set a human should look at. Running the gate before the
// corrections would flag thousands of records that the site already handles
// correctly, and a flag that fires constantly gets ignored.

import type { RawHomzProperty } from "@/lib/scraping/homzbackend";
import type { NormalizedProject } from "./normalize";
import { competitorMentions } from "./dataQuality";
import { isReadyToMove } from "./projectStatus";
import { isInvalidDeveloperSlug } from "@/lib/content/developers";
import { slugify } from "./normalize";

export type ReviewSeverity =
  /** Impossible or contradictory. The record should not be indexed. */
  | "blocking"
  /** Wrong or missing enough to be worth a human look, but the page is still
   *  usable and indexing it does more good than harm. */
  | "warning";

export type ReviewFlag = {
  rule: string;
  severity: ReviewSeverity;
  detail: string;
};

export type PublishState = {
  /** False when any blocking flag fired. Drives noindex and sitemap exclusion. */
  indexable: boolean;
  flags: ReviewFlag[];
};

const COMMERCIAL_TYPES = new Set(["office", "retail_shop", "showroom", "warehouse", "co_working"]);
const RESIDENTIAL_CONFIG = /\b\d+\s*(?:BHK|RK)\b/i;

/** A RERA id we can recognise as well-formed. Haryana ids look like
 *  "HRERA-PKL-GGN-123-2021" or "RC/REP/HARERA/GGM/123/2021/45"; the check is
 *  deliberately loose, because rejecting a valid id we have not seen is worse
 *  than accepting a malformed one. It only catches obvious junk. */
const RERA_SHAPE = /^[A-Za-z0-9][A-Za-z0-9\/\-. ]{5,}$/;
const RERA_PLACEHOLDER = /^(n\/?a|na|nil|none|null|undefined|not ?applicable|-+|0+)$/i;

function possessionYear(text: string | null | undefined): number | null {
  const m = String(text ?? "").match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

function proseOf(project: NormalizedProject): string {
  return [...(project.about ?? []), ...(project.builder_description ?? [])].join(" ");
}

// ─────────────────────────────────────────────────────────── projects

/**
 * The checklist's rules, applied to a project record.
 *
 * Landmark distances are passed in rather than fetched, because the zero-
 * distance rule needs them and this module must stay free of the geo layer —
 * a caller that has not resolved landmarks simply omits them and that rule
 * does not run.
 */
export function reviewProject(
  project: NormalizedProject,
  opts: { landmarkDistancesKm?: number[] } = {}
): PublishState {
  const flags: ReviewFlag[] = [];
  const add = (rule: string, severity: ReviewSeverity, detail: string) =>
    flags.push({ rule, severity, detail });

  // "IF project description contains apartments/residential/BHK AND
  // project_category = Commercial -> Flag for review". The correction layer
  // moves these to Residential when the evidence is strong, so reaching here
  // means the evidence was the weaker kind and a human should decide.
  if (project.property_category === "Commercial") {
    if (RESIDENTIAL_CONFIG.test(project.property_type ?? "")) {
      add(
        "residentialConfigOnCommercial",
        "blocking",
        `Commercial project carrying a residential configuration (${project.property_type}).`
      );
    } else if (/\bresidential\b|\bapartments?\b/i.test(proseOf(project))) {
      add(
        "residentialWordsOnCommercial",
        "warning",
        "Commercial project whose own copy describes residential space."
      );
    }
  }

  // "Ready to Move + future possession date".
  if (isReadyToMove(project.project_status)) {
    const year = possessionYear(project.possession_text);
    const thisYear = new Date().getFullYear();
    if (year != null && year > thisYear) {
      add(
        "readyToMoveFuturePossession",
        "blocking",
        `Marked ready to move but possession reads ${project.possession_text}.`
      );
    }
  }

  // "Developer name < 3 characters" and "Project without developer".
  const builder = (project.builder ?? "").trim();
  if (!builder || builder === "Unknown") {
    add("noDeveloper", "warning", "No developer could be parsed from the project name.");
  } else if (builder.length < 3 || isInvalidDeveloperSlug(slugify(builder))) {
    add("shortOrInvalidDeveloper", "blocking", `Developer name "${builder}" is not a usable entity.`);
  }

  // SEO audit 2026-09-25 (B7 junkProjectName): RWA/owner bodies and bare
  // business districts reach the catalogue as "projects" -- "DLF City Senior
  // Citizen Council", "DLF Exclusive Floors Owners Society", "Dlf Cyber City".
  // None is a saleable development. Blocking, so they drop out of the index
  // and the developer counts' indexable set without deleting inventory (the
  // exclusion list is reserved for owner instructions).
  const name = project.project_name ?? "";
  if (
    /\b(?:owners?'?\s+(?:society|association|welfare)|resident'?s?\s+(?:welfare\s+)?association|RWA|senior\s+citizens?\s+council|welfare\s+society)\b/i.test(name) ||
    /^\s*dlf\s+cyber\s+(?:city|hub)\s*$/i.test(name)
  ) {
    add("junkProjectName", "blocking", `"${name}" is an association or district, not a development.`);
  }

  // "Project without locality/sector".
  if (!project.sector && !project.micro_market) {
    add("noLocation", "warning", "No sector or micro-market resolved for this project.");
  }

  // "Price <= 0" — a zero or negative price, not an absent one. Price on
  // Request is a legitimate state and is not a data error.
  for (const [label, value] of [
    ["min_price_inr", project.min_price_inr],
    ["max_price_inr", project.max_price_inr],
  ] as const) {
    if (value != null && value <= 0) {
      add("nonPositivePrice", "blocking", `${label} is ${value}.`);
    }
  }

  // "Area <= 0", same reasoning.
  for (const [label, value] of [
    ["min_size", project.min_size],
    ["max_size", project.max_size],
  ] as const) {
    if (value != null && value <= 0) {
      add("nonPositiveArea", "blocking", `${label} is ${value}.`);
    }
  }

  // "RERA malformed". An absent id is not malformed — plenty of older
  // projects genuinely have none — so only a present-but-junk value fires.
  const rera = (project.rera_id ?? "").trim();
  if (rera && (RERA_PLACEHOLDER.test(rera) || !RERA_SHAPE.test(rera))) {
    add("reraMalformed", "warning", `RERA id "${rera}" is not a recognisable registration number.`);
  }

  // "School distance = 0". A landmark at exactly zero kilometres is the
  // city-anchor fallback measuring a coordinate against itself, not a school
  // in the lobby.
  if (opts.landmarkDistancesKm?.some((km) => km === 0)) {
    add(
      "zeroDistanceLandmark",
      "blocking",
      "A landmark resolved to 0.0 km, which means the coordinate fell back to a city anchor."
    );
  }

  // "Competitor brand inside description". The strip runs upstream of this,
  // so anything left is prose the sentence-level cleaner could not remove
  // without destroying the paragraph.
  const competitors = competitorMentions(proseOf(project));
  if (competitors.length > 0) {
    add("competitorContent", "blocking", `Copy still mentions ${competitors.join(", ")}.`);
  }

  return { indexable: !flags.some((f) => f.severity === "blocking"), flags };
}

// ─────────────────────────────────────────────────────────── listings

export function reviewListing(p: RawHomzProperty): PublishState {
  const flags: ReviewFlag[] = [];
  const add = (rule: string, severity: ReviewSeverity, detail: string) =>
    flags.push({ rule, severity, detail });

  // "Residential + Warehouse", "Residential + Retail Shop", "BHK > 0 +
  // Commercial Office" — all one shape: a bedroom count on commercial space.
  // classifyListing corrects this when the title evidences a specific
  // residential type; when it cannot, the record arrives here still wrong.
  const type = String(p.propertyType ?? "");
  const bedrooms = typeof p.bedrooms === "number" ? p.bedrooms : 0;
  const hasResidentialConfig =
    RESIDENTIAL_CONFIG.test(String(p.configuration ?? "")) ||
    RESIDENTIAL_CONFIG.test(String(p.title ?? ""));
  if (COMMERCIAL_TYPES.has(type) && (bedrooms > 0 || hasResidentialConfig)) {
    add(
      "residentialCommercialType",
      "blocking",
      `Typed ${type} but carries ${bedrooms > 0 ? `${bedrooms} bedrooms` : "a BHK configuration"}.`
    );
  }

  if (isReadyToMove(p.projectStatus)) {
    const year = possessionYear(typeof p.possession === "string" ? p.possession : null);
    if (year != null && year > new Date().getFullYear()) {
      add(
        "readyToMoveFuturePossession",
        "blocking",
        `Marked ready to move but possession reads ${p.possession}.`
      );
    }
  }

  const price = typeof p.priceValue === "number" ? p.priceValue : null;
  const rent = typeof p.rentMonthly === "number" ? p.rentMonthly : null;
  if ((price != null && price <= 0) || (rent != null && rent <= 0)) {
    add("nonPositivePrice", "blocking", "Price or monthly rent is zero or negative.");
  }

  const area = typeof p.areaValue === "number" ? p.areaValue : null;
  if (area != null && area <= 0) {
    add("nonPositiveArea", "blocking", `Area is ${area}.`);
  }

  const rera = String(p.reraId ?? "").trim();
  if (rera && (RERA_PLACEHOLDER.test(rera) || !RERA_SHAPE.test(rera))) {
    add("reraMalformed", "warning", `RERA id "${rera}" is not a recognisable registration number.`);
  }

  // SEO audit 2026-09-25 (B7 commercialPlotSanity): Reach Buzz 114 appeared
  // as "Commercial Plots", 945 sq ft at ₹59,153/sq ft -- a retail unit, not
  // land, and it set Sector 114's rate. A commercial plot under 2,000 sq ft
  // priced above ₹30,000/sq ft is almost certainly mistyped. Warning, not a
  // correction: the right type cannot be read off these numbers alone.
  const isPlot = type === "plot" || /\bcommercial\s+plots?\b/i.test(String(p.title ?? ""));
  if (isPlot && p.isCommercial && area != null && area > 0 && area < 2000 && price != null) {
    const perSqft = price / area;
    if (perSqft > 30000) {
      add(
        "commercialPlotSanity",
        "warning",
        `Commercial plot of ${area} sq ft at ₹${Math.round(perSqft).toLocaleString("en-IN")}/sq ft reads as a shop, not land.`
      );
    }
  }

  const text = [
    ...(Array.isArray(p.aboutProject) ? p.aboutProject : []),
    typeof p.builderDescription === "string" ? p.builderDescription : "",
    typeof p.aiSummary === "string" ? p.aiSummary : "",
  ].join(" ");
  const competitors = competitorMentions(text);
  if (competitors.length > 0) {
    add("competitorContent", "blocking", `Copy still mentions ${competitors.join(", ")}.`);
  }

  if (!String(p.location ?? "").trim()) {
    add("noLocation", "warning", "No location string on the record.");
  }

  return { indexable: !flags.some((f) => f.severity === "blocking"), flags };
}

/**
 * The robots value a page should emit for a given state.
 *
 * follow:true always. A record being wrong is no reason to strand the links
 * out of it — the project it belongs to, its sector hub and its developer are
 * all still legitimate destinations.
 */
export function robotsFor(state: PublishState): { index: boolean; follow: boolean } | undefined {
  return state.indexable ? undefined : { index: false, follow: true };
}
