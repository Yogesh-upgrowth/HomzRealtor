#!/usr/bin/env node
// Developer hub coverage (2026-09-22).
//
// Usage: npm run check:developer-coverage
//        npm run check:developer-coverage -- --json
//
// The Developer x Intent architecture is generic: every developer already has
// a hub, child views, a price list, a locations table and schema, all computed
// from their own inventory. Nothing needs "rolling out" per developer.
//
// ONE THING DOES NOT AUTO-GENERATE, and cannot: the verified entity facts in
// lib/content/developerProfiles.ts — official name, founding year, founder,
// headquarters, official website. Those come from reading the developer's own
// site, and that is the point. A generated founding year is a fabricated fact
// on an entity page, which is worse than no About section at all.
//
// So this is the worklist for that one task, ordered by how much it is worth:
// developers with the most inventory, and therefore the most pages carrying
// their name, come first. Verifying DLF (109 projects) is worth more than
// verifying a builder with three.
//
// It also reports which child views each developer's inventory actually
// unlocks, so the SEO value of the whole architecture is visible as a number
// rather than assumed.
//
// Exit codes: 0 always when it ran — missing profiles are a backlog, not a
// build failure. 2 when the feed is unreachable.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const asJson = process.argv.includes("--json");
const BASE = process.env.HOMZ_FEED_BASE || "https://homz-scrape.vercel.app/api/data";
const LIMIT = 25000;
const CITY = "ggn";

// ── load the real modules ───────────────────────────────────────────────────

const dir = mkdtempSync(join(tmpdir(), "devcoverage-"));
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
copy("lib/listings/listingLocation.ts", "listingLocation.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
]);
copy("lib/content/developers.ts", "developers.ts", [
  ['from "@/lib/intelligence/normalize"', 'from "./normalize.ts"'],
]);
copy("lib/content/developerProfiles.ts", "developerProfiles.ts");
copy("lib/intelligence/developerViews.ts", "developerViews.ts", [
  ['from "./normalize"', 'from "./normalize.ts"'],
  ['from "./projectStatus"', 'from "./projectStatus.ts"'],
  ['from "@/lib/listings/listingLocation"', 'from "./listingLocation.ts"'],
]);

const load = (f) => import(pathToFileURL(join(dir, f)).href);
const { normalizeProject, slugify } = await load("normalize.ts");
const { collapseDuplicateProjects } = await load("projectDedupe.ts");
const { isExcludedProject } = await load("excludedProjects.ts");
const { canonicalDeveloperByName, developerStatusFor, isInvalidDeveloperSlug } = await load(
  "developers.ts"
);
const { developerProfileFacts } = await load("developerProfiles.ts");
const { availableDeveloperViews } = await load("developerViews.ts");

// ── fetch ───────────────────────────────────────────────────────────────────

async function fetchSegment(segment) {
  const res = await fetch(`${BASE}?city=${encodeURIComponent(segment)}&page=1&limit=${LIMIT}`);
  if (!res.ok) throw new Error(`upstream ${res.status} for ${segment}`);
  const json = await res.json();
  return Array.isArray(json?.results) ? json.results : [];
}

let projects;
try {
  const [commercial, residential] = await Promise.all([
    fetchSegment(`${CITY}CommercialProjects`),
    fetchSegment(`${CITY}ResidentialProjects`),
  ]);
  const normalized = [
    ...commercial.map((r) => normalizeProject(r, CITY, "Commercial")),
    ...residential.map((r) => normalizeProject(r, CITY, "Residential")),
  ].filter((p) => !isExcludedProject(p.city_key, p.slug));
  projects = collapseDuplicateProjects(normalized).projects;
} catch (err) {
  console.error(`\nCould not reach the catalogue feed: ${err.message}`);
  console.error("Nothing was checked. Run this where the feed is reachable.\n");
  process.exit(2);
}

// ── group by canonical developer, the way the site does ─────────────────────

const byDeveloper = new Map();
for (const p of projects) {
  const builder = p.builder;
  if (!builder || builder === "Unknown" || builder.trim().length < 3) continue;
  const canonical = canonicalDeveloperByName(builder);
  const slug = canonical ? canonical.id : slugify(builder);
  if (!slug || slug.length < 3 || isInvalidDeveloperSlug(slug)) continue;
  const name = canonical ? canonical.canonicalName : builder;
  if (!byDeveloper.has(slug)) byDeveloper.set(slug, { slug, name, projects: [] });
  byDeveloper.get(slug).projects.push(p);
}

const rows = Array.from(byDeveloper.values())
  .map((d) => {
    const status = developerStatusFor(d.slug, d.projects.length, 2);
    const views = availableDeveloperViews(d.projects);
    const indexableViews = views.filter((v) => v.indexable);
    return {
      slug: d.slug,
      name: d.name,
      projects: d.projects.length,
      status,
      hasProfile: Boolean(developerProfileFacts(d.slug)),
      viewsAvailable: views.length,
      viewsIndexable: indexableViews.length,
      indexableViewSlugs: indexableViews.map((v) => v.view.slug),
    };
  })
  .sort((a, b) => b.projects - a.projects);

const verified = rows.filter((r) => r.status === "verified");
const missingProfile = verified.filter((r) => !r.hasProfile);
const totalIndexablePages = verified.reduce((n, r) => n + 1 + r.viewsIndexable, 0);

if (asJson) {
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), rows }, null, 2));
  process.exit(0);
}

console.log(`\nDeveloper hub coverage — ${new Date().toISOString().slice(0, 10)}\n`);
console.log(`${rows.length} developer entities in the catalogue, ${verified.length} verified.`);
console.log(
  `${totalIndexablePages} indexable developer pages across them ` +
    `(${verified.length} hubs + ${totalIndexablePages - verified.length} child views).\n`
);

console.log("DEVELOPER                  PROJECTS  STATUS      ABOUT  INDEXABLE VIEWS");
console.log("-".repeat(88));
for (const r of rows.slice(0, 30)) {
  console.log(
    `${r.name.slice(0, 24).padEnd(24)}  ${String(r.projects).padStart(8)}  ` +
      `${r.status.padEnd(10)}  ${(r.hasProfile ? "yes" : "—").padEnd(5)}  ` +
      `${r.viewsIndexable}/${r.viewsAvailable}  ${r.indexableViewSlugs.slice(0, 4).join(", ")}`
  );
}
if (rows.length > 30) console.log(`... and ${rows.length - 30} more`);

if (missingProfile.length > 0) {
  console.log(`\n\nVerified developers with no About section (${missingProfile.length}), most inventory first:\n`);
  for (const r of missingProfile.slice(0, 15)) {
    console.log(`  ${r.name.padEnd(24)} ${String(r.projects).padStart(4)} projects   /developer/${r.slug}`);
  }
  console.log(
    `\nTo add one: open the developer's official site, read it, and add an entry to\n` +
      `lib/content/developerProfiles.ts with officialName, officialWebsite, foundedYear,\n` +
      `founder, headquarters, a two-sentence summary, the source URL and today's date.\n` +
      `\nEverything in that entry must come from the source. A developer with no entry\n` +
      `renders no About section, which is correct — an invented founding year on an\n` +
      `entity page is worse than an absent one.`
  );
} else {
  console.log("\n\nEvery verified developer has a verified About section.");
}

console.log("");
