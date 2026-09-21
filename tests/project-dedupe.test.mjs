// Tests lib/intelligence/projectDedupe.ts — the real module.
//
// Same temp-dir trick as tests/developer-profile.test.mjs: the module imports
// its sibling extensionlessly, which Node's ESM resolver will not resolve to a
// .ts file, so both real files are copied out with that one specifier
// rewritten. Nothing else is changed, so a change to the merge rules in the
// repo is a change to what runs here.
//
// Run: node --experimental-strip-types tests/project-dedupe.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "projdedupe-"));
writeFileSync(
  join(dir, "normalize.ts"),
  readFileSync("lib/intelligence/normalize.ts", "utf8").replace(
    'from "./dataQuality"',
    'from "./dataQuality.ts"'
  )
);
// normalize.ts imports ./dataQuality (added 2026-09-21 for the competitor-prose
// and classification corrections), so that sibling has to come along too — with
// its own "@/" import rewritten to a local stub the same way.
writeFileSync(
  join(dir, "homzbackend.ts"),
  "export type RawHomzProperty = Record<string, any>;\n"
);
writeFileSync(
  join(dir, "dataQuality.ts"),
  readFileSync("lib/intelligence/dataQuality.ts", "utf8").replace(
    'from "@/lib/scraping/homzbackend"',
    'from "./homzbackend.ts"'
  )
);

writeFileSync(
  join(dir, "projectDedupe.ts"),
  readFileSync("lib/intelligence/projectDedupe.ts", "utf8").replace(
    'from "./normalize"',
    'from "./normalize.ts"'
  )
);
const { collapseDuplicateProjects } = await import(
  pathToFileURL(join(dir, "projectDedupe.ts")).href
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

const p = (name, over = {}) => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  city_key: "ggn",
  project_name: name,
  builder: "Emaar",
  property_category: "Residential",
  property_type: "Apartment",
  project_status: null,
  rera_id: null,
  rera_status: null,
  sector: "Sector 65",
  micro_market: null,
  city_name: "Gurgaon",
  min_price_inr: null,
  max_price_inr: null,
  min_size: null,
  max_size: null,
  size_unit: null,
  images: [],
  interior_images: [],
  about: [],
  amenities: [],
  specifications: [],
  price_list: [],
  ...over,
});

const names = (r) => r.projects.map((x) => x.project_name).sort();

// --- the cases the audit actually found ------------------------------------
const misspelt = collapseDuplicateProjects([
  p("Emaar Emerald Floors Select", { images: ["a.jpg", "b.jpg"] }),
  p("Emaar Emrald Floors Select", { images: ["b.jpg", "c.jpg"] }),
]);
t("one-character misspelling merges", misspelt.projects.length, 1);
t("richer record survives", misspelt.projects[0].project_name, "Emaar Emerald Floors Select");
// Nothing is thrown away, and the collapsed URL must resolve rather than 404.
t("images unioned, deduped", misspelt.projects[0].images, ["a.jpg", "b.jpg", "c.jpg"]);
t("loser aliased to winner",
  misspelt.aliases.get("ggn:emaar-emrald-floors-select"), "emaar-emerald-floors-select");

const restated = collapseDuplicateProjects([
  p("M3M St Andrews", { builder: "M3M" }),
  p("St Andrews by M3M", { builder: "M3M", slug: "st-andrews-by-m3m" }),
]);
t("same name, different word order and filler, merges", restated.projects.length, 1);

const sectorInName = collapseDuplicateProjects([
  p("Emaar Palm Gardens Sector 83", { sector: "Sector 83" }),
  p("Emaar Palm Gardens", { sector: "Sector 83", slug: "emaar-palm-gardens" }),
]);
t("sector in one name only still merges", sectorInName.projects.length, 1);

// --- what must never merge -------------------------------------------------
// Names one character apart that differ in a digit are different buildings.
t("Tower 1 vs Tower 2 stay separate",
  names(collapseDuplicateProjects([
    p("M3M Heights Tower 1", { builder: "M3M" }),
    p("M3M Heights Tower 2", { builder: "M3M", slug: "m3m-heights-tower-2" }),
  ])),
  ["M3M Heights Tower 1", "M3M Heights Tower 2"]);

t("Phase 2 vs Phase 3 stay separate",
  collapseDuplicateProjects([
    p("Emaar Palm Hills Phase 2"),
    p("Emaar Palm Hills Phase 3", { slug: "emaar-palm-hills-phase-3" }),
  ]).projects.length, 2);

t("different sector never merges",
  collapseDuplicateProjects([
    p("Emaar Emerald Floors"),
    p("Emaar Emerald Floors", { sector: "Sector 66", slug: "emaar-emerald-floors-66" }),
  ]).projects.length, 2);

t("different builder never merges",
  collapseDuplicateProjects([
    p("Emerald Floors Select"),
    p("Emerald Floors Select", { builder: "DLF", slug: "dlf-emerald-floors-select" }),
  ]).projects.length, 2);

t("different category never merges",
  collapseDuplicateProjects([
    p("Emaar Business Park"),
    p("Emaar Business Park", { property_category: "Commercial", slug: "emaar-business-park-c" }),
  ]).projects.length, 2);

// Genuinely different developments from the same builder in the same sector.
t("Golf Estate vs Golf Hills stay separate",
  collapseDuplicateProjects([
    p("M3M Golf Estate", { builder: "M3M" }),
    p("M3M Golf Hills", { builder: "M3M", slug: "m3m-golf-hills" }),
  ]).projects.length, 2);

// Two characters is a fifth of a short name, not a typo in it.
t("short names never merge on edit distance",
  collapseDuplicateProjects([
    p("Emaar Digi"),
    p("Emaar Dagi", { slug: "emaar-dagi" }),
  ]).projects.length, 2);

// Three characters adrift is a different name, not a misspelling.
t("three-character difference does not merge",
  collapseDuplicateProjects([
    p("Emaar Emerald Floors Select"),
    p("Emaar Sapphire Floors Select", { slug: "emaar-sapphire-floors-select" }),
  ]).projects.length, 2);

// "Unknown" is normalize.ts's fallback when the title's first word is not a
// company name — two such records are not evidence of anything.
t("unknown builder never merges",
  collapseDuplicateProjects([
    p("Emerald Floors Select", { builder: "Unknown" }),
    p("Emrald Floors Select", { builder: "Unknown", slug: "emrald-floors-select" }),
  ]).projects.length, 2);

t("no sector never merges",
  collapseDuplicateProjects([
    p("Emaar Emerald Floors Select", { sector: null }),
    p("Emaar Emrald Floors Select", { sector: null, slug: "emaar-emrald-floors-select" }),
  ]).projects.length, 2);

// --- determinism -----------------------------------------------------------
// Feed order changes between fetches; the surviving page must not.
const a = p("Emaar Emerald Floors Select");
const b = p("Emaar Emrald Floors Select");
t("outcome independent of input order",
  collapseDuplicateProjects([a, b]).projects[0].slug ===
    collapseDuplicateProjects([b, a]).projects[0].slug,
  true);

// --- untouched input -------------------------------------------------------
const singles = [p("Emaar Emerald Floors"), p("M3M Golf Estate", { builder: "M3M", slug: "m3m-golf-estate" })];
const untouched = collapseDuplicateProjects(singles);
t("distinct projects pass through", untouched.projects.length, 2);
t("no aliases when nothing merged", untouched.aliases.size, 0);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail ? 1 : 0);
