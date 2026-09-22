#!/usr/bin/env node
// The "Needs Review" queue (2026-09-22).
//
// Usage: npm run check:publish-gate
//        npm run check:publish-gate -- --json
//        npm run check:publish-gate -- --rule=readyToMoveFuturePossession
//
// Checklist item 9 asks for a pre-publish QA engine whose failing records land
// in a "Draft / Needs Review" state rather than publishing automatically.
// lib/intelligence/publishGate.ts is the engine and it already withholds those
// records from indexing. This is the queue: the list a person actually works
// through, grouped by rule, with examples and a URL for each.
//
// Withholding alone is not enough. A record that silently stops being indexed
// is a record nobody fixes — it just disappears from the site's search
// presence with no trace. This makes the cost visible: how many URLs are being
// held back, why, and which ones.
//
// It imports the REAL gate rather than reimplementing it, via the same
// temp-dir import rewrite the test suites use, so the numbers here are the
// numbers the site acts on.
//
// Exit codes: 0 always when it ran. This is a report, not a gate on CI — a
// catalogue aggregated from third-party feeds will always have some failing
// records, and failing a build on that would just get the check disabled.
// 2 when the feed is unreachable, so "could not check" never reads as "clean".

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const ruleFilter = args.find((a) => a.startsWith("--rule="))?.slice(7) ?? null;

const BASE = process.env.HOMZ_FEED_BASE || "https://homz-scrape.vercel.app/api/data";
const SITE = "https://www.homzrealtor.com";
const CITY = "ggn";
const LIMIT = 25000;

// ── load the real modules ───────────────────────────────────────────────────

const dir = mkdtempSync(join(tmpdir(), "publishgate-report-"));
const copy = (src, dest, replacements = []) => {
  let text = readFileSync(src, "utf8");
  for (const [from, to] of replacements) text = text.replaceAll(from, to);
  writeFileSync(join(dir, dest), text);
};

writeFileSync(join(dir, "homzbackend.ts"), "export type RawHomzProperty = Record<string, any>;\n");
copy("lib/intelligence/dataQuality.ts", "dataQuality.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
]);
copy("lib/intelligence/normalize.ts", "normalize.ts", [['from "./dataQuality"', 'from "./dataQuality.ts"']]);
copy("lib/intelligence/projectDedupe.ts", "projectDedupe.ts", [['from "./normalize"', 'from "./normalize.ts"']]);
copy("lib/intelligence/excludedProjects.ts", "excludedProjects.ts");
copy("lib/intelligence/projectStatus.ts", "projectStatus.ts");
copy("lib/content/developers.ts", "developers.ts", [
  ['from "@/lib/intelligence/normalize"', 'from "./normalize.ts"'],
]);
copy("lib/intelligence/publishGate.ts", "publishGate.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
  ['from "./normalize"', 'from "./normalize.ts"'],
  ['from "./dataQuality"', 'from "./dataQuality.ts"'],
  ['from "./projectStatus"', 'from "./projectStatus.ts"'],
  ['from "@/lib/content/developers"', 'from "./developers.ts"'],
]);

const load = (f) => import(pathToFileURL(join(dir, f)).href);
const { normalizeProject, slugify } = await load("normalize.ts");
const { sanitizeSegment } = await load("dataQuality.ts");
const { collapseDuplicateProjects } = await load("projectDedupe.ts");
const { isExcludedProject } = await load("excludedProjects.ts");
const { reviewProject, reviewListing } = await load("publishGate.ts");

// ── fetch ───────────────────────────────────────────────────────────────────

async function fetchSegment(segment) {
  const res = await fetch(`${BASE}?city=${encodeURIComponent(segment)}&page=1&limit=${LIMIT}`);
  if (!res.ok) throw new Error(`upstream ${res.status} for ${segment}`);
  const json = await res.json();
  return Array.isArray(json?.results) ? json.results : [];
}

/** Mirrors lib/intelligence/projects.ts fetchCityRaw(). */
async function loadProjects() {
  const [commercial, residential] = await Promise.all([
    fetchSegment(`${CITY}CommercialProjects`),
    fetchSegment(`${CITY}ResidentialProjects`),
  ]);
  const normalized = [
    ...commercial.map((r) => normalizeProject(r, CITY, "Commercial")),
    ...residential.map((r) => normalizeProject(r, CITY, "Residential")),
  ].filter((p) => !isExcludedProject(p.city_key, p.slug));
  return collapseDuplicateProjects(normalized).projects;
}

// ── run ─────────────────────────────────────────────────────────────────────

let data;
try {
  const [projects, sale, rent, commercial] = await Promise.all([
    loadProjects(),
    fetchSegment(`${CITY}SaleProperties`).then(sanitizeSegment),
    fetchSegment(`${CITY}RentProperties`).then(sanitizeSegment),
    fetchSegment(`${CITY}CommercialProperties`).then(sanitizeSegment),
  ]);
  data = { projects, listings: { Sale: sale, Rent: rent, Commercial: commercial } };
} catch (err) {
  console.error(`\nCould not reach the catalogue feed: ${err.message}`);
  console.error("Nothing was checked. Run this where the feed is reachable.\n");
  process.exit(2);
}

const ROUTE_BASE = { Sale: "buy-property", Rent: "rent-property", Commercial: "commercial" };

/** Mirrors lib/intelligence/property-view.ts slugForProperty() closely enough
 *  to produce a clickable URL. Only used for the report. */
function listingSlug(p) {
  const bits = [p.bedrooms ? `${p.bedrooms}-bhk` : null, p.propertyType, p.location, p.id]
    .filter(Boolean)
    .join(" ");
  return slugify(bits);
}

const byRule = new Map();
const record = (rule, severity, entry) => {
  if (!byRule.has(rule)) byRule.set(rule, { rule, severity, count: 0, examples: [] });
  const g = byRule.get(rule);
  g.count += 1;
  if (g.examples.length < 8) g.examples.push(entry);
};

let projectsHeld = 0;
for (const p of data.projects) {
  const state = reviewProject(p);
  if (!state.indexable) projectsHeld += 1;
  for (const f of state.flags) {
    record(f.rule, f.severity, {
      kind: "project",
      name: p.project_name,
      url: `${SITE}/project-listing/gurgaon/${p.slug}`,
      detail: f.detail,
    });
  }
}

let listingsHeld = 0;
let listingTotal = 0;
for (const [category, list] of Object.entries(data.listings)) {
  for (const p of list) {
    listingTotal += 1;
    const state = reviewListing(p);
    if (!state.indexable) listingsHeld += 1;
    for (const f of state.flags) {
      record(f.rule, f.severity, {
        kind: category,
        name: p.title ?? "(untitled)",
        url: `${SITE}/${ROUTE_BASE[category]}/gurgaon/${listingSlug(p)}`,
        detail: f.detail,
      });
    }
  }
}

const groups = Array.from(byRule.values())
  .filter((g) => !ruleFilter || g.rule === ruleFilter)
  .sort((a, b) => (a.severity === b.severity ? b.count - a.count : a.severity === "blocking" ? -1 : 1));

if (asJson) {
  console.log(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        projects: { total: data.projects.length, withheld: projectsHeld },
        listings: { total: listingTotal, withheld: listingsHeld },
        groups,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const pct = (n, of) => (of === 0 ? "0%" : `${((n / of) * 100).toFixed(1)}%`);

console.log(`\nNeeds Review queue — ${new Date().toISOString().slice(0, 10)}\n`);
console.log(
  `Projects  ${data.projects.length.toLocaleString("en-IN").padStart(7)} total   ` +
    `${projectsHeld.toLocaleString("en-IN").padStart(6)} withheld from indexing (${pct(projectsHeld, data.projects.length)})`
);
console.log(
  `Listings  ${listingTotal.toLocaleString("en-IN").padStart(7)} total   ` +
    `${listingsHeld.toLocaleString("en-IN").padStart(6)} withheld from indexing (${pct(listingsHeld, listingTotal)})`
);

if (groups.length === 0) {
  console.log("\nNo records flagged. Every record cleared the gate.\n");
  process.exit(0);
}

console.log("\nBy rule:\n");
console.log("RULE                                SEVERITY   COUNT");
console.log("-".repeat(56));
for (const g of groups) {
  console.log(`${g.rule.padEnd(34)}  ${g.severity.padEnd(9)}  ${String(g.count).padStart(6)}`);
}

console.log("\n\nExamples\n");
for (const g of groups) {
  console.log(`\n${g.rule}  (${g.severity}, ${g.count} record${g.count === 1 ? "" : "s"})`);
  for (const e of g.examples) {
    console.log(`  [${e.kind}] ${e.name}`);
    console.log(`     ${e.detail}`);
    console.log(`     ${e.url}`);
  }
  if (g.count > g.examples.length) {
    console.log(`  ... and ${g.count - g.examples.length} more (--rule=${g.rule} --json for all)`);
  }
}

console.log(
  `\nBlocking flags withhold a record from indexing and from the sitemap. Warnings do not —\n` +
    `they are worth a look but the page is still better published than hidden.\n` +
    `Fixing these properly means fixing them in the homz-scrape source, not here.\n`
);
