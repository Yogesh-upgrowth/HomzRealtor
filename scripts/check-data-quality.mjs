#!/usr/bin/env node
// The data-error count the 21 September audit asked for (2026-09-21).
//
// Usage: npm run check:data-quality
//        npm run check:data-quality -- --samples   (show example records)
//        npm run check:data-quality -- --json      (machine-readable)
//
// The audit put "data-error count" among its monthly KPIs and called it
// "unusually important for HomzRealtor", with a named list of checks to run
// against the full database. This is that list, runnable, so the number is
// measured rather than estimated:
//
//     Residential project marked commercial       -> CHECKS.projectMiscategorised
//     3 BHK classified warehouse                  -> CHECKS.listingMiscategorised
//     Ready-to-move + future possession           -> CHECKS.rtmWithFuturePossession
//     Price missing currency/unit                 -> CHECKS.priceWithoutUnit
//     Zero-distance landmark                      -> CHECKS.zeroDistanceLandmark
//     Developer name under three characters       -> CHECKS.shortDeveloperName
//     Unknown RERA values                         -> CHECKS.reraUnknown
//     Competitor names present in content         -> CHECKS.competitorContent
//     No project image                            -> CHECKS.noImage
//     No developer entity                         -> CHECKS.noDeveloper
//     No geographic coordinates                   -> CHECKS.noSector
//
// WHY A COUNT RATHER THAN A PASS/FAIL. Most of these can never reach zero:
// the catalogue is aggregated from third-party feeds and a proportion of every
// day's records will arrive malformed. The number that matters is the trend,
// and whether the correction layer (lib/intelligence/dataQuality.ts) is
// catching what it should. So the script reports counts and rates, and only
// exits non-zero on the checks that represent a fixed bug regressing — the
// ones the correction layer is supposed to make impossible.
//
// It reads the live feed, so it needs network access. Where the feed is
// unreachable it says so and exits 0 rather than reporting a clean bill of
// health it has not earned.

const BASE = process.env.HOMZ_FEED_BASE || "https://homz-scrape.vercel.app/api/data";
const LIMIT = 25000;

const PROJECT_SEGMENTS = ["ggnResidentialProjects", "ggnCommercialProjects"];
const PROPERTY_SEGMENTS = [
  "ggnSaleProperties",
  "ggnRentProperties",
  "ggnCommercialProperties",
];

// Mirrors lib/intelligence/dataQuality.ts. Duplicated rather than imported
// because this script runs without a build step; if the two drift, the tests
// in tests/data-quality.test.mjs exercise the module, and this is a monitor
// rather than the enforcement point.
const COMPETITORS = [
  [/\bsquare[\s-]?yards?\b/i, "Square Yards"],
  [/\bmagic[\s-]?bricks?\b/i, "MagicBricks"],
  [/\b99\s?acres\b/i, "99acres"],
  [/\bhousing\.com\b/i, "Housing.com"],
  [/\bno[\s-]?broker\b/i, "NoBroker"],
  [/\bprop[\s-]?tiger\b/i, "PropTiger"],
  [/\bcommon[\s-]?floor\b/i, "CommonFloor"],
];

const COMMERCIAL_TYPES = new Set([
  "office",
  "retail_shop",
  "showroom",
  "warehouse",
  "co_working",
]);
const RESIDENTIAL_CONFIG = /\b\d+\s*(?:BHK|RK)\b/i;
const RTM = /ready\s*to\s*move|\brtm\b|completed|delivered/i;

async function fetchSegment(segment) {
  const url = `${BASE}?segment=${encodeURIComponent(segment)}&page=1&limit=${LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.results) ? json.results : [];
}

function competitorsIn(text) {
  if (!text) return [];
  const s = String(text);
  return COMPETITORS.filter(([re]) => re.test(s)).map(([, label]) => label);
}

function proseOf(record) {
  const bits = [];
  for (const key of ["aboutProject", "about", "builderDescription"]) {
    const v = record[key];
    if (Array.isArray(v)) bits.push(...v.filter((x) => typeof x === "string"));
    else if (typeof v === "string") bits.push(v);
  }
  return bits.join(" \u0000 ");
}

function possessionYear(text) {
  const m = String(text ?? "").match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

/** Each check: a label, whether a non-zero count is a regression, and a
 *  predicate returning a reason string (or null when the record is fine). */
const CHECKS = {
  // --- regressions: the correction layer should make these impossible ------
  competitorContent: {
    label: "Competitor name in our own copy",
    regression: true,
    why: "dataQuality.stripCompetitorProse should have removed the sentence",
    test: (r) => {
      const found = competitorsIn(proseOf(r));
      return found.length ? `mentions ${found.join(", ")}` : null;
    },
  },
  listingMiscategorised: {
    label: "Residential unit typed as commercial space",
    regression: true,
    why: "dataQuality.classifyListing should have corrected the type",
    appliesTo: "properties",
    test: (r) => {
      if (!COMMERCIAL_TYPES.has(String(r.propertyType ?? ""))) return null;
      const beds = typeof r.bedrooms === "number" && r.bedrooms >= 1;
      const cfg =
        RESIDENTIAL_CONFIG.test(String(r.configuration ?? "")) ||
        RESIDENTIAL_CONFIG.test(String(r.title ?? ""));
      if (!beds && !cfg) return null;
      return `typed "${r.propertyType}"${beds ? ` with bedrooms=${r.bedrooms}` : ""}${
        cfg ? " and a BHK/RK configuration" : ""
      }`;
    },
  },
  rtmWithFuturePossession: {
    label: "Ready to move, but carries a future possession year",
    regression: false,
    why: "a source contradiction; the projection module is gated so nothing renders from it",
    test: (r) => {
      const status = String(r.projectStatus ?? "");
      if (!RTM.test(status)) return null;
      const yr = possessionYear(r.possession);
      const now = new Date().getFullYear();
      return yr && yr > now ? `status "${status}" but possession "${r.possession}"` : null;
    },
  },

  // --- source-data quality: counts to watch, not regressions --------------
  projectMiscategorised: {
    label: "Residential project in the commercial bucket",
    regression: false,
    why: "corrected on read by normalizeProject; the count tracks upstream quality",
    appliesTo: "projects",
    segmentFilter: (seg) => seg.includes("Commercial"),
    test: (r) => {
      const bhk = String(r.BHKType ?? "");
      if (RESIDENTIAL_CONFIG.test(bhk) || /\bBHK\b/i.test(bhk)) {
        return `commercial bucket but BHKType "${bhk}"`;
      }
      return null;
    },
  },
  shortDeveloperName: {
    label: "Developer name under three characters",
    regression: false,
    why: "extractBuilder returns Unknown and no hub is minted; tracks feed quality",
    appliesTo: "projects",
    test: (r) => {
      const first = String(r.projectTitle ?? "").trim().split(/\s+/)[0] ?? "";
      const letters = first.toLowerCase().replace(/[^a-z]/g, "");
      return letters.length > 0 && letters.length < 3
        ? `title starts with "${first}"`
        : null;
    },
  },
  noDeveloper: {
    label: "No usable developer entity",
    regression: false,
    why: "the project renders without a developer hub link",
    appliesTo: "projects",
    test: (r) => (String(r.projectTitle ?? "").trim() ? null : "no project title at all"),
  },
  priceWithoutUnit: {
    label: "Price text with no currency or unit",
    regression: false,
    why: "renders as a bare number; the view layer falls back to price-on-request",
    test: (r) => {
      const p = String(r.price ?? "").trim();
      if (!p) return null;
      if (/[₹$]|\b(cr|crore|lakh|lac|l|k|month|sq)\b/i.test(p)) return null;
      return /^\d[\d,.]*$/.test(p) ? `price "${p}"` : null;
    },
  },
  zeroDistanceLandmark: {
    label: "Landmark at 0.0 km",
    regression: false,
    why: "suppressed at render, but the source value is wrong",
    test: (r) => {
      const lm = r.landmarks;
      if (!lm || typeof lm !== "object") return null;
      for (const [cat, items] of Object.entries(lm)) {
        if (!Array.isArray(items)) continue;
        for (const it of items) {
          if (/^0(\.0+)?\s*(km|m)?$/i.test(String(it?.distance ?? ""))) {
            return `${cat}: "${it?.name}" at "${it?.distance}"`;
          }
        }
      }
      return null;
    },
  },
  reraUnknown: {
    label: "RERA id present but status unknown",
    regression: false,
    why: "ReraBadge renders Unverified; a registration lookup is an ops task",
    test: (r) => {
      const id = String(r.reraId ?? "").trim();
      if (!id) return null;
      const st = String(r.reraStatus ?? "").trim().toLowerCase();
      return st === "" || st === "unknown" ? `id "${id}" with status "${st || "(empty)"}"` : null;
    },
  },
  noImage: {
    label: "No image",
    regression: false,
    why: "cards render a fallback; these sort last everywhere",
    test: (r) => (Array.isArray(r.images) && r.images.length > 0 ? null : "images[] empty"),
  },
  noSector: {
    label: "No Gurgaon sector resolvable",
    regression: false,
    why: "cannot join to a sector hub or compute a sector median",
    test: (r) => {
      const blob = `${r.location ?? ""} ${r.title ?? ""} ${r.projectTitle ?? ""}`;
      return /\bsec(?:tor)?[\s.\-]*\d{1,3}/i.test(blob) ? null : "no sector in location or title";
    },
  },
};

// ------------------------------------------------------------------- run

const showSamples = process.argv.includes("--samples");
const asJson = process.argv.includes("--json");

const results = {};
for (const key of Object.keys(CHECKS)) {
  results[key] = { count: 0, scanned: 0, samples: [] };
}

let totalScanned = 0;
const failures = [];

async function scan(segment, kind) {
  let records;
  try {
    records = await fetchSegment(segment);
  } catch (err) {
    failures.push(`${segment}: ${err.message}`);
    return;
  }
  totalScanned += records.length;

  for (const [key, check] of Object.entries(CHECKS)) {
    if (check.appliesTo && check.appliesTo !== kind) continue;
    if (check.segmentFilter && !check.segmentFilter(segment)) continue;
    results[key].scanned += records.length;
    for (const r of records) {
      let reason = null;
      try {
        reason = check.test(r);
      } catch {
        continue;
      }
      if (!reason) continue;
      results[key].count += 1;
      if (results[key].samples.length < 5) {
        results[key].samples.push({
          id: r.id ?? r.projectTitle ?? r.title ?? "(no id)",
          title: r.projectTitle ?? r.title ?? "(untitled)",
          segment,
          reason,
        });
      }
    }
  }
}

for (const seg of PROJECT_SEGMENTS) await scan(seg, "projects");
for (const seg of PROPERTY_SEGMENTS) await scan(seg, "properties");

if (failures.length === PROJECT_SEGMENTS.length + PROPERTY_SEGMENTS.length) {
  console.error(
    "\nCould not reach the feed — every segment failed. Reporting nothing rather " +
      "than a clean bill of health.\n"
  );
  for (const f of failures) console.error(`  ${f}`);
  console.error("");
  process.exit(2);
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        at: new Date().toISOString(),
        totalScanned,
        unreachableSegments: failures,
        checks: Object.fromEntries(
          Object.entries(results).map(([k, v]) => [
            k,
            { label: CHECKS[k].label, regression: Boolean(CHECKS[k].regression), ...v },
          ])
        ),
      },
      null,
      2
    )
  );
  process.exit(0);
}

const pct = (n, d) => (d > 0 ? `${((n / d) * 100).toFixed(2)}%` : "—");

console.log("\nHomzRealtor — data quality\n");
console.log(`${totalScanned.toLocaleString("en-IN")} records scanned across ${
  PROJECT_SEGMENTS.length + PROPERTY_SEGMENTS.length - failures.length
} segments.\n`);
if (failures.length) {
  console.log("Segments that could not be read (their records are NOT in the counts below):");
  for (const f of failures) console.log(`  ! ${f}`);
  console.log("");
}

const regressions = Object.entries(results).filter(
  ([k, v]) => CHECKS[k].regression && v.count > 0
);

console.log("REGRESSIONS — the correction layer should make these impossible\n");
if (regressions.length === 0) {
  console.log("  none.\n");
} else {
  for (const [k, v] of regressions) {
    console.log(`  [!] ${CHECKS[k].label}: ${v.count.toLocaleString("en-IN")} of ${v.scanned.toLocaleString("en-IN")} (${pct(v.count, v.scanned)})`);
    console.log(`      ${CHECKS[k].why}`);
    if (showSamples) for (const s of v.samples) console.log(`      · ${s.title} — ${s.reason}`);
    console.log("");
  }
}

console.log("SOURCE DATA — counts to watch, not failures\n");
for (const [k, v] of Object.entries(results)) {
  if (CHECKS[k].regression) continue;
  const flag = v.count > 0 ? "~" : "x";
  console.log(
    `  [${flag}] ${CHECKS[k].label}: ${v.count.toLocaleString("en-IN")} of ${v.scanned.toLocaleString("en-IN")} (${pct(v.count, v.scanned)})`
  );
  if (v.count > 0) console.log(`      ${CHECKS[k].why}`);
  if (showSamples) for (const s of v.samples) console.log(`      · ${s.title} — ${s.reason}`);
}
console.log("");

const errorTotal = Object.values(results).reduce((a, v) => a + v.count, 0);
console.log(
  `Data-error count: ${errorTotal.toLocaleString("en-IN")} across ${totalScanned.toLocaleString("en-IN")} records. ` +
    `Track the trend, not the absolute — the catalogue is aggregated from third-party feeds and a\n` +
    `proportion will always arrive malformed. What must stay at zero is the regressions block.\n`
);

process.exit(regressions.length > 0 ? 1 : 0);
