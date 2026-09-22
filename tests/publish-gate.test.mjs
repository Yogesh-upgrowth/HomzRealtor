// Tests lib/intelligence/publishGate.ts — the pre-publish QA gate.
//
// Checklist item 9. This gate decides what Google is offered, so both failure
// directions cost real traffic: a false positive noindexes a perfectly good
// listing and removes it from the sitemap, a false negative publishes a record
// we already know is wrong. Neither shows up in a build.
//
// The rules that need the most care are the ones about ABSENCE, because the
// checklist says "Price <= 0" and "Area <= 0", not "price missing". Price on
// Request is a legitimate state across thousands of real records, and treating
// it as a data error would de-index most of the catalogue.
//
// Run: node --experimental-strip-types tests/publish-gate.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "publishgate-"));
const copy = (src, dest, replacements = []) => {
  let text = readFileSync(src, "utf8");
  for (const [from, to] of replacements) text = text.replace(from, to);
  writeFileSync(join(dir, dest), text);
};

writeFileSync(join(dir, "homzbackend.ts"), "export type RawHomzProperty = Record<string, any>;\n");
copy("lib/intelligence/dataQuality.ts", "dataQuality.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
]);
copy("lib/intelligence/normalize.ts", "normalize.ts", [
  ['from "./dataQuality"', 'from "./dataQuality.ts"'],
]);
copy("lib/content/developers.ts", "developers.ts", [
  ['from "@/lib/intelligence/normalize"', 'from "./normalize.ts"'],
]);
copy("lib/intelligence/projectStatus.ts", "projectStatus.ts");
copy("lib/intelligence/publishGate.ts", "publishGate.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
  ['from "./normalize"', 'from "./normalize.ts"'],
  ['from "./dataQuality"', 'from "./dataQuality.ts"'],
  ['from "./projectStatus"', 'from "./projectStatus.ts"'],
  ['from "@/lib/content/developers"', 'from "./developers.ts"'],
]);
// publishGate imports slugify from "./normalize" in a second statement.
{
  const p = join(dir, "publishGate.ts");
  writeFileSync(p, readFileSync(p, "utf8").replaceAll('from "./normalize"', 'from "./normalize.ts"'));
}

const { reviewProject, reviewListing, robotsFor } = await import(
  pathToFileURL(join(dir, "publishGate.ts")).href
);

let fail = 0;
const t = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    fail++;
    console.log(`FAIL ${label}\n  expected ${JSON.stringify(expected)}\n  actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS ${label}  => ${JSON.stringify(actual)}`);
  }
};

const rules = (state) => state.flags.map((f) => f.rule).sort();

// A clean, ordinary project. Everything below is this with one thing wrong.
const goodProject = {
  slug: "m3m-latitude",
  city_key: "ggn",
  project_name: "M3M Latitude",
  builder: "M3M",
  property_category: "Residential",
  property_type: "3 BHK",
  project_status: "Ready to Move",
  rera_id: "HRERA-PKL-GGN-123-2021",
  sector: "Sector 65",
  micro_market: "Golf Course Extension Road",
  possession_text: "2023",
  min_price_inr: 25000000,
  max_price_inr: 40000000,
  min_size: 1800,
  max_size: 2600,
  about: ["A residential project in Sector 65."],
  builder_description: ["M3M builds in Gurgaon."],
};

const p = (over) => ({ ...goodProject, ...over });

// ── projects: the clean case ──────────────────────────────────────────────

t("a clean project is indexable", reviewProject(goodProject).indexable, true);
t("a clean project raises no flags", rules(reviewProject(goodProject)), []);
t("robotsFor leaves a clean record alone", robotsFor(reviewProject(goodProject)), undefined);

// ── projects: each checklist rule ─────────────────────────────────────────

t(
  "ready to move with a future possession year",
  rules(reviewProject(p({ possession_text: "Dec 2028" }))),
  ["readyToMoveFuturePossession"]
);
t(
  "ready to move with a PAST possession year is fine",
  rules(reviewProject(p({ possession_text: "Dec 2021" }))),
  []
);
t(
  "'Completed' counts as ready to move for this rule",
  rules(reviewProject(p({ project_status: "Completed", possession_text: "2029" }))),
  ["readyToMoveFuturePossession"]
);
t(
  "an under-construction project with a future possession is normal",
  rules(reviewProject(p({ project_status: "Under Construction", possession_text: "Dec 2028" }))),
  []
);

t("developer name under three characters", rules(reviewProject(p({ builder: "MV" }))), [
  "shortOrInvalidDeveloper",
]);
t("developer name from the invalid list", rules(reviewProject(p({ builder: "The" }))), [
  "shortOrInvalidDeveloper",
]);
t("project without a developer", rules(reviewProject(p({ builder: "Unknown" }))), ["noDeveloper"]);
t("no developer is a warning, so the page still indexes", reviewProject(p({ builder: "Unknown" })).indexable, true);
t(
  "an invalid developer is blocking, so the page does not index",
  reviewProject(p({ builder: "The" })).indexable,
  false
);

t(
  "project without a sector or micro-market",
  rules(reviewProject(p({ sector: null, micro_market: null }))),
  ["noLocation"]
);
t(
  "a micro-market alone satisfies the location rule",
  rules(reviewProject(p({ sector: null }))),
  []
);

t("price of zero", rules(reviewProject(p({ min_price_inr: 0 }))), ["nonPositivePrice"]);
t("negative price", rules(reviewProject(p({ max_price_inr: -1 }))), ["nonPositivePrice"]);
// The important non-rule: Price on Request is not a data error.
t(
  "an ABSENT price is not an error — Price on Request is legitimate",
  rules(reviewProject(p({ min_price_inr: null, max_price_inr: null }))),
  []
);

t("area of zero", rules(reviewProject(p({ min_size: 0 }))), ["nonPositiveArea"]);
t("absent area is not an error", rules(reviewProject(p({ min_size: null, max_size: null }))), []);

t("malformed RERA id", rules(reviewProject(p({ rera_id: "N/A" }))), ["reraMalformed"]);
t("placeholder RERA id", rules(reviewProject(p({ rera_id: "0000" }))), ["reraMalformed"]);
t("absent RERA id is not malformed", rules(reviewProject(p({ rera_id: null }))), []);
t("a real RERA id passes", rules(reviewProject(p({ rera_id: "RC/REP/HARERA/GGM/123/2021/45" }))), []);

t(
  "a landmark at exactly 0.0 km",
  rules(reviewProject(goodProject, { landmarkDistancesKm: [0, 2.4, 3.1] })),
  ["zeroDistanceLandmark"]
);
t(
  "ordinary landmark distances are fine",
  rules(reviewProject(goodProject, { landmarkDistancesKm: [0.4, 2.4] })),
  []
);

t(
  "competitor content surviving the strip",
  rules(reviewProject(p({ about: ["Listed on MagicBricks"] }))),
  ["competitorContent"]
);

t(
  "commercial project carrying a BHK configuration",
  rules(reviewProject(p({ property_category: "Commercial", property_type: "3 BHK" }))),
  ["residentialConfigOnCommercial"]
);
t(
  "commercial project whose copy reads residential is a warning only",
  reviewProject(
    p({
      property_category: "Commercial",
      property_type: "Office",
      about: ["A residential catchment surrounds the tower."],
    })
  ).indexable,
  true
);

// Several things wrong at once must all be reported, not just the first.
t(
  "every failing rule is reported",
  rules(reviewProject(p({ builder: "J", min_price_inr: 0, sector: null, micro_market: null }))),
  ["noLocation", "nonPositivePrice", "shortOrInvalidDeveloper"]
);

// ── listings ──────────────────────────────────────────────────────────────

const goodListing = {
  title: "3 BHK Flat in Sector 65",
  location: "Sector 65, Gurgaon",
  propertyType: "apartment",
  bedrooms: 3,
  priceValue: 25000000,
  areaValue: 1800,
  projectStatus: "Ready to Move",
  possession: "2022",
  aboutProject: ["A bright corner unit."],
};
const l = (over) => ({ ...goodListing, ...over });

t("a clean listing is indexable", reviewListing(goodListing).indexable, true);
t("a clean listing raises no flags", rules(reviewListing(goodListing)), []);

t(
  "bedrooms on a warehouse",
  rules(reviewListing(l({ propertyType: "warehouse" }))),
  ["residentialCommercialType"]
);
t(
  "BHK in the title on a retail shop",
  rules(reviewListing(l({ propertyType: "retail_shop", bedrooms: null }))),
  ["residentialCommercialType"]
);
t(
  "a genuine office with no bedrooms is fine",
  rules(reviewListing({ ...goodListing, propertyType: "office", bedrooms: null, title: "Office in Cyber City" })),
  []
);
t(
  "ready to move with a future possession",
  rules(reviewListing(l({ possession: "2029" }))),
  ["readyToMoveFuturePossession"]
);
t("zero rent", rules(reviewListing(l({ priceValue: null, rentMonthly: 0 }))), ["nonPositivePrice"]);
t("zero area", rules(reviewListing(l({ areaValue: 0 }))), ["nonPositiveArea"]);
t(
  "competitor text in aiSummary",
  rules(reviewListing(l({ aiSummary: "Data by Square Yards." }))),
  ["competitorContent"]
);
t("missing location is a warning", reviewListing(l({ location: "" })).indexable, true);

// ── robots ────────────────────────────────────────────────────────────────

t(
  "a blocked record is noindex but still followed",
  robotsFor(reviewListing(l({ areaValue: 0 }))),
  { index: false, follow: true }
);

console.log(fail === 0 ? "\nAll publish-gate tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
