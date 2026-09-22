// Every data-driven figure the editorial content asserts, declared once
// (2026-09-22).
//
// Checklist item 6: "After fixing classifications, rerun calculations for:
// Gurgaon residential project counts, Commercial project counts, Sector-level
// counts, Ready-to-move counts, Under-construction counts, BHK counts, Median
// asking prices, Developer counts, New Gurgaon studies, Dwarka Expressway
// studies, 'Best Residential Projects' articles."
//
// THE PROBLEM THIS SOLVES. "2,098 Gurgaon projects" appears in nine files and
// "1,463 residential projects" in fifteen, hand-written into prose, FAQ
// answers, author credentials and eeat.productDataHook blocks. There was no
// record of what each number counted, when it was counted, or which files
// carried it — so when the catalogue changed, nothing could tell you the prose
// was now wrong, and correcting one file left the other fourteen stale.
//
// Those numbers are stale right now, and by our own hand: the residential /
// commercial split moved when dataQuality.ts began correcting misfiled
// records at the read boundary, and the totals moved again when
// projectDedupe.ts started collapsing duplicates and excludedProjects.ts
// started dropping records. Every count below was measured before those
// three changes landed.
//
// WHAT THIS FILE IS. One declaration per figure: the value the prose
// currently states, what exactly it counts, when it was measured, and a
// machine-executable query. scripts/check-content-stats.mjs runs each query
// against the live catalogue through the real normalization pipeline and
// reports three things: figures where the live value has moved, figures whose
// stated value no longer appears in any file (a claim that was edited away),
// and the file:line of every occurrence to change.
//
// WHY THE PROSE IS NOT INTERPOLATED FROM HERE. It was the obvious design and
// it is the wrong one. These are published, dated claims — "1,190 of 1,463
// residential projects, 81%, snapshotted 4 September 2026" — sitting beside
// analysis written against those exact figures. Interpolating live values
// would silently rewrite a published article's numbers while leaving the
// sentences around them arguing from the old ones, producing prose that
// contradicts itself and a "snapshotted on" date that is a lie. An editorial
// claim should change when someone reads the new number and rewrites the
// paragraph. This file's job is to make sure someone is told.
//
// ADDING A FIGURE. Declare it here with its query, then run the checker. A
// figure with no `appearsAs` match in any file is reported too — that is how
// this list stays honest rather than accumulating claims nobody makes.

/** When the current `value` on every claim below was measured. */
export const STATS_MEASURED_AT = "2026-09-04";

/**
 * Corridor definitions, matched against a project's sector, micro-market and
 * name. Mirrors lib/listings/listingLocation.ts's GURGAON_CORRIDORS, which
 * matches *listings* on their own location fields — the two datasets carry
 * different shapes, so the patterns live in both places rather than one
 * importing the other. Order matters for the same reason it does there:
 * "Golf Course Extension Road" contains "Golf Course Road" as a substring, so
 * the extension pattern is tested first.
 */
export const PROJECT_CORRIDORS: { slug: string; label: string; match: RegExp }[] = [
  {
    slug: "golf-course-extension-road",
    label: "Golf Course Extension Road",
    match: /golf\s*course\s*(extension|ext\.?)\s*road|\bgce\b/i,
  },
  { slug: "golf-course-road", label: "Golf Course Road", match: /golf\s*course\s*road/i },
  { slug: "dwarka-expressway", label: "Dwarka Expressway", match: /dwarka\s*express\s*way/i },
  { slug: "new-gurgaon", label: "New Gurgaon", match: /new\s*gurgaon|new\s*gurugram/i },
  { slug: "sohna-road", label: "Sohna Road", match: /sohna\s*road/i },
  {
    slug: "southern-peripheral-road",
    label: "Southern Peripheral Road",
    match: /southern\s*peripheral\s*road|\bspr\b/i,
  },
];

export type StatMetric =
  /** Number of matching projects. */
  | "count"
  /** Distinct non-empty sector values among matching projects. */
  | "distinctSectors"
  /** Median of min_price_inr across matching projects that carry one. */
  | "medianEntryPriceInr"
  /** Matching projects carrying a parsed min_price_inr. */
  | "countWithPrice"
  /** Distinct developer hubs, counted the way /developer counts them. */
  | "verifiedDevelopers";

export type StatQuery = {
  /** "projects" reads the project segments; "listings" the sale segment. */
  dataset: "projects" | "listings";
  /** Post-correction property_category — i.e. after dataQuality reclassifies. */
  category?: "Residential" | "Commercial";
  corridor?: string;
  /** projectStatusKind() of project_status. */
  status?: "ready-to-move" | "under-construction" | "new-launch";
  /** Inclusive bounds on the entry (minimum) price. */
  minEntryPriceInr?: number;
  maxEntryPriceInr?: number;
  /** listings only: bedroom count. */
  bhk?: number;
  metric: StatMetric;
};

export type CatalogueStat = {
  id: string;
  /** What the published prose currently says. */
  value: number;
  label: string;
  /** Exactly what is counted. A reader should be able to check the query
   *  against this sentence and see whether they agree. */
  definition: string;
  query: StatQuery;
  /** The literal strings to search the content tree for. A figure usually
   *  appears both formatted ("2,098") and bare (2098, in productDataHook). */
  appearsAs: string[];
};

export const CATALOGUE_STATS: CatalogueStat[] = [
  // ── Citywide Gurgaon ────────────────────────────────────────────────────
  {
    id: "gurgaonProjectsTotal",
    value: 2098,
    label: "Gurgaon projects tracked",
    definition:
      "Every Gurgaon project in the catalogue, residential and commercial, after duplicate collapse and owner exclusions.",
    query: { dataset: "projects", metric: "count" },
    appearsAs: ["2,098", "2098"],
  },
  {
    id: "gurgaonResidentialProjects",
    value: 1463,
    label: "Gurgaon residential projects",
    definition:
      "Gurgaon projects whose corrected category is Residential. Moves when dataQuality reclassifies a misfiled commercial record.",
    query: { dataset: "projects", category: "Residential", metric: "count" },
    appearsAs: ["1,463", "1463"],
  },
  {
    id: "gurgaonCommercialProjects",
    value: 635,
    label: "Gurgaon commercial projects",
    definition: "Gurgaon projects whose corrected category is Commercial.",
    query: { dataset: "projects", category: "Commercial", metric: "count" },
    appearsAs: ["635"],
  },
  {
    id: "gurgaonDistinctSectors",
    value: 133,
    label: "Distinct Gurgaon sectors with inventory",
    definition:
      "Distinct non-empty sector values across all Gurgaon projects. This is the localityCount in every eeat.productDataHook.",
    query: { dataset: "projects", metric: "distinctSectors" },
    appearsAs: ["133"],
  },
  {
    id: "gurgaonMedianEntryPriceInr",
    value: 21800000,
    label: "Median Gurgaon entry price",
    definition:
      "Median of the entry (lowest quoted) price across Gurgaon projects carrying a parsed price. Published as avgPropertyPriceInr, which is a schema field name, not a claim that it is a mean.",
    query: { dataset: "projects", metric: "medianEntryPriceInr" },
    appearsAs: ["21800000"],
  },
  {
    id: "gurgaonResidentialReadyToMove",
    value: 1190,
    label: "Gurgaon residential projects ready to move",
    definition:
      "Residential Gurgaon projects whose status resolves to ready-to-move via projectStatusKind(). Tolerant matching, so 'Completed' and 'RTM' count.",
    query: {
      dataset: "projects",
      category: "Residential",
      status: "ready-to-move",
      metric: "count",
    },
    appearsAs: ["1,190", "1190"],
  },
  {
    id: "gurgaonResidentialUnderConstruction",
    value: 191,
    label: "Gurgaon residential projects under construction",
    definition: "Residential Gurgaon projects whose status resolves to under-construction.",
    query: {
      dataset: "projects",
      category: "Residential",
      status: "under-construction",
      metric: "count",
    },
    appearsAs: ["191"],
  },
  {
    id: "gurgaonResidentialNewLaunch",
    value: 58,
    label: "Gurgaon residential new launches",
    definition: "Residential Gurgaon projects whose status resolves to new-launch.",
    query: {
      dataset: "projects",
      category: "Residential",
      status: "new-launch",
      metric: "count",
    },
    appearsAs: ["58"],
  },
  {
    id: "gurgaonResidentialWithPrice",
    value: 1151,
    label: "Gurgaon residential projects carrying a parsed price",
    definition:
      "Residential Gurgaon projects with a parsed entry price. This is the denominator the price-trends article's corridor bands actually cover — the article states 1,463 and sums to this, leaving the gap unexplained.",
    query: { dataset: "projects", category: "Residential", metric: "countWithPrice" },
    appearsAs: ["1,151", "1151"],
  },
  {
    id: "gurgaonResidentialUnder1Cr",
    value: 263,
    label: "Gurgaon residential projects with an entry unit under ₹1 Cr",
    definition: "Residential Gurgaon projects whose entry price is below ₹1 crore.",
    query: {
      dataset: "projects",
      category: "Residential",
      maxEntryPriceInr: 10000000,
      metric: "count",
    },
    appearsAs: ["263"],
  },
  {
    id: "gurgaonProjectsUnder2Cr",
    value: 624,
    label: "Gurgaon projects with an entry unit under ₹2 Cr",
    definition:
      "All Gurgaon projects (both categories) whose entry price is below ₹2 crore — the article says 'of 2,098 Gurgaon projects', so the denominator is the full catalogue.",
    query: { dataset: "projects", maxEntryPriceInr: 20000000, metric: "count" },
    appearsAs: ["624"],
  },
  {
    id: "gurgaonLuxuryProjects",
    value: 374,
    label: "Gurgaon projects quoting ₹5 Cr or above",
    definition: "Gurgaon projects whose entry price is ₹5 crore or more.",
    query: { dataset: "projects", minEntryPriceInr: 50000000, metric: "count" },
    appearsAs: ["374"],
  },

  // ── Dwarka Expressway ───────────────────────────────────────────────────
  {
    id: "dwarkaExpresswayProjects",
    value: 439,
    label: "Dwarka Expressway projects",
    definition: "Gurgaon projects matching the Dwarka Expressway corridor pattern, both categories.",
    query: { dataset: "projects", corridor: "dwarka-expressway", metric: "count" },
    appearsAs: ["439"],
  },
  {
    id: "dwarkaExpresswayResidential",
    value: 299,
    label: "Dwarka Expressway residential projects",
    definition: "Dwarka Expressway projects whose corrected category is Residential.",
    query: {
      dataset: "projects",
      corridor: "dwarka-expressway",
      category: "Residential",
      metric: "count",
    },
    appearsAs: ["299"],
  },
  {
    id: "dwarkaExpresswayCommercial",
    value: 140,
    label: "Dwarka Expressway commercial projects",
    definition: "Dwarka Expressway projects whose corrected category is Commercial.",
    query: {
      dataset: "projects",
      corridor: "dwarka-expressway",
      category: "Commercial",
      metric: "count",
    },
    appearsAs: ["140"],
  },
  {
    id: "dwarkaExpresswayReadyToMove",
    value: 249,
    label: "Dwarka Expressway residential projects ready to move",
    definition: "Dwarka Expressway residential projects whose status resolves to ready-to-move.",
    query: {
      dataset: "projects",
      corridor: "dwarka-expressway",
      category: "Residential",
      status: "ready-to-move",
      metric: "count",
    },
    appearsAs: ["249"],
  },
  {
    id: "dwarkaExpresswaySectors",
    value: 60,
    label: "Dwarka Expressway distinct sectors",
    definition: "Distinct sector values across Dwarka Expressway projects.",
    query: { dataset: "projects", corridor: "dwarka-expressway", metric: "distinctSectors" },
    appearsAs: ["60"],
  },
  {
    id: "dwarkaExpresswayMedianEntryPriceInr",
    value: 18300000,
    label: "Dwarka Expressway median entry price",
    definition: "Median entry price across Dwarka Expressway projects carrying a parsed price.",
    query: {
      dataset: "projects",
      corridor: "dwarka-expressway",
      metric: "medianEntryPriceInr",
    },
    appearsAs: ["18300000"],
  },

  // ── New Gurgaon ─────────────────────────────────────────────────────────
  {
    id: "newGurgaonProjects",
    value: 209,
    label: "New Gurgaon projects",
    definition: "Gurgaon projects matching the New Gurgaon corridor pattern, both categories.",
    query: { dataset: "projects", corridor: "new-gurgaon", metric: "count" },
    appearsAs: ["209"],
  },
  {
    id: "newGurgaonResidential",
    value: 141,
    label: "New Gurgaon residential projects",
    definition: "New Gurgaon projects whose corrected category is Residential.",
    query: {
      dataset: "projects",
      corridor: "new-gurgaon",
      category: "Residential",
      metric: "count",
    },
    appearsAs: ["141"],
  },
  {
    id: "newGurgaonReadyToMove",
    value: 96,
    label: "New Gurgaon residential projects ready to move",
    definition: "New Gurgaon residential projects whose status resolves to ready-to-move.",
    query: {
      dataset: "projects",
      corridor: "new-gurgaon",
      category: "Residential",
      status: "ready-to-move",
      metric: "count",
    },
    appearsAs: ["96"],
  },
  {
    id: "newGurgaonSectors",
    value: 34,
    label: "New Gurgaon distinct sectors",
    definition: "Distinct sector values across New Gurgaon projects.",
    query: { dataset: "projects", corridor: "new-gurgaon", metric: "distinctSectors" },
    appearsAs: ["34"],
  },
  {
    id: "newGurgaonMedianEntryPriceInr",
    value: 19200000,
    label: "New Gurgaon median entry price",
    definition: "Median entry price across New Gurgaon projects carrying a parsed price.",
    query: { dataset: "projects", corridor: "new-gurgaon", metric: "medianEntryPriceInr" },
    appearsAs: ["19200000"],
  },

  // ── Golf Course Road and Extension ──────────────────────────────────────
  {
    id: "golfCourseRoadProjects",
    value: 103,
    label: "Golf Course Road projects",
    definition:
      "Gurgaon projects matching the Golf Course Road pattern. The extension pattern is tested first, so Golf Course Extension Road projects are NOT counted here.",
    query: { dataset: "projects", corridor: "golf-course-road", metric: "count" },
    appearsAs: ["103"],
  },
  {
    id: "golfCourseRoadMedianEntryPriceInr",
    value: 43800000,
    label: "Golf Course Road median entry price",
    definition: "Median entry price across Golf Course Road projects carrying a parsed price.",
    query: { dataset: "projects", corridor: "golf-course-road", metric: "medianEntryPriceInr" },
    appearsAs: ["43800000"],
  },
  {
    id: "golfCourseExtensionProjects",
    value: 251,
    label: "Golf Course Extension Road projects",
    definition: "Gurgaon projects matching the Golf Course Extension Road pattern.",
    query: { dataset: "projects", corridor: "golf-course-extension-road", metric: "count" },
    appearsAs: ["251"],
  },
  {
    id: "golfCourseExtensionMedianEntryPriceInr",
    value: 29150000,
    label: "Golf Course Extension Road median entry price",
    definition:
      "Median entry price across Golf Course Extension Road projects carrying a parsed price.",
    query: {
      dataset: "projects",
      corridor: "golf-course-extension-road",
      metric: "medianEntryPriceInr",
    },
    appearsAs: ["29150000"],
  },

  // ── Listings-level (BHK) ────────────────────────────────────────────────
  {
    id: "gurgaon3BhkListings",
    value: 9440,
    label: "Gurgaon 3 BHK sale listings",
    definition:
      "Sale listings in Gurgaon with three bedrooms, after the sanitizer drops competitor content and corrects misfiled types. A listing count, not a project count.",
    query: { dataset: "listings", bhk: 3, metric: "count" },
    appearsAs: ["9440", "9,440"],
  },
  {
    id: "gurgaon4BhkListings",
    value: 4413,
    label: "Gurgaon 4 BHK sale listings",
    definition: "Sale listings in Gurgaon with four bedrooms, same pipeline as the 3 BHK count.",
    query: { dataset: "listings", bhk: 4, metric: "count" },
    appearsAs: ["4413", "4,413"],
  },

  // ── Developers ──────────────────────────────────────────────────────────
  {
    id: "gurgaonVerifiedDevelopers",
    value: 0,
    label: "Confirmed developers with a Gurgaon hub",
    definition:
      "Developer hubs that are 'verified' — in the canonical table (lib/content/developers.ts) and clearing the two-project floor. Declared at 0 because no published sentence states this number yet; the checker reports the live value so a claim can be written from a measured figure rather than an estimated one.",
    query: { dataset: "projects", metric: "verifiedDevelopers" },
    appearsAs: [],
  },
];

export const STAT_BY_ID = new Map(CATALOGUE_STATS.map((s) => [s.id, s]));

// Ids must be unique — two claims sharing one would make the checker's report
// ambiguous about which sentence to correct.
{
  if (STAT_BY_ID.size !== CATALOGUE_STATS.length) {
    throw new Error("lib/content/catalogueStats.ts: duplicate stat id");
  }
}
