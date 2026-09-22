#!/usr/bin/env node
// Score every registered editorial page against the Homz Content Standard v1
// rubric (2026-09-22).
//
// Usage: npm run check:content-standard
//        npm run check:content-standard -- --json
//        npm run check:content-standard -- --verbose   (per-test breakdown)
//
// "Before any rewritten page publishes, score it out of 100. Publish only at
//  90+."
//
// This is that gate, run from the page's own declared data rather than from a
// spreadsheet somebody filled in. It reports:
//
//   - the score and whether it clears 90;
//   - every test's points and the reason;
//   - required sections not yet written;
//   - sections written against an id that is not in the frozen standard —
//     format drift, which is the thing "freeze the structure" is meant to stop;
//   - a page marked published that does not pass, which is the only state here
//     that fails the build.
//
// Exit codes
//   0  nothing is published that should not be. An empty registry exits 0:
//      no copy written is a true and acceptable state, and this script's job
//      is to stop bad copy publishing, not to demand copy exist.
//   1  a page is marked published but does not pass the gate, or a section is
//      written against an unknown id.
//
// Drafts below 90 are reported, loudly, and do NOT fail. That is the working
// state of a page being written.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const asJson = process.argv.includes("--json");
const verbose = process.argv.includes("--verbose");

// ── load the real modules ───────────────────────────────────────────────────

const dir = mkdtempSync(join(tmpdir(), "contentstd-"));
const MODULES = [
  "types",
  "standard",
  "originality",
  "provenance",
  "rubric",
  "sectorPages",
  "developerPages",
  "projectPages",
  "registry",
];
for (const name of MODULES) {
  const text = readFileSync(`lib/content/editorial/${name}.ts`, "utf8").replace(
    /from "\.\/([A-Za-z]+)"/g,
    'from "./$1.ts"'
  );
  writeFileSync(join(dir, `${name}.ts`), text);
}

const load = (f) => import(pathToFileURL(join(dir, f)).href);
const { scoreEditorialPage, unknownSections, proseOf, PUBLISH_SCORE_THRESHOLD } =
  await load("rubric.ts");
const { allEditorialPages, editorialPagesOfType } = await load("registry.ts");
const { SECTOR_ROLLOUT, DEVELOPER_ROLLOUT, PROTOTYPES, editorialWordTarget } =
  await load("standard.ts");

// ── score ───────────────────────────────────────────────────────────────────

const pages = allEditorialPages();
const results = [];
let failures = 0;

for (const page of pages) {
  // Siblings of the same type, for the originality comparison. A page never
  // compares against itself, or every page would score 100% overlap.
  const siblings = editorialPagesOfType(page.pageType)
    .filter((p) => p.key !== page.key)
    .map((p) => ({ key: p.key, text: proseOf(p) }));

  const score = scoreEditorialPage(page, { siblings });
  const unknown = unknownSections(page);
  const publishedButFailing = page.status === "published" && !score.passes;

  if (unknown.length > 0 || publishedButFailing) failures++;

  results.push({
    pageType: page.pageType,
    key: page.key,
    status: page.status,
    authorship: page.authorship.kind,
    score: score.total,
    passes: score.passes,
    tests: score.tests,
    missingSections: score.missingSections,
    unknownSections: unknown,
    publishedButFailing,
  });
}

if (asJson) {
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  process.exit(failures > 0 ? 1 : 0);
}

// ── report ──────────────────────────────────────────────────────────────────

console.log(`\nHomz Content Standard v1 — ${new Date().toISOString().slice(0, 10)}`);
console.log(`Publish threshold: ${PUBLISH_SCORE_THRESHOLD}/100\n`);

if (pages.length === 0) {
  console.log("No editorial pages registered yet.\n");
  console.log("The scaffolding is in place and every sector and developer hub renders");
  console.log("its computed modules with no narrative layer. That is the expected state");
  console.log("until a writer's copy lands.\n");
  console.log(`Prototypes to write first: sector "${PROTOTYPES.sector}", developer "${PROTOTYPES.developer}".`);
  const s = editorialWordTarget("sector");
  const d = editorialWordTarget("developer");
  console.log(
    `Section targets — sector ${s.min}–${s.max} words, developer ${d.min}–${d.max} words.\n`
  );
  console.log(`Rollout queue: ${SECTOR_ROLLOUT.length} sectors, ${DEVELOPER_ROLLOUT.length} developers.`);
  console.log("\nTo start one:  npm run build:dossier -- sector sector-65\n");
  process.exit(0);
}

for (const r of results) {
  const verdict = r.passes ? "PASS" : "BELOW BAR";
  console.log(`${r.pageType}/${r.key}  ${r.score}/100  ${verdict}  [${r.status}, ${r.authorship}]`);

  if (verbose || !r.passes) {
    for (const t of r.tests) {
      const flag = t.points === t.max ? " " : t.points === 0 ? "!" : "~";
      console.log(`   ${flag} ${String(t.points).padStart(2)}/${String(t.max).padEnd(2)}  ${t.label}`);
      console.log(`        ${t.note}`);
    }
  }
  if (r.missingSections.length > 0) {
    console.log(`   not yet written: ${r.missingSections.join(", ")}`);
  }
  if (r.unknownSections.length > 0) {
    console.log(`   FORMAT DRIFT — section ids not in the frozen standard: ${r.unknownSections.join(", ")}`);
  }
  if (r.publishedButFailing) {
    console.log(`   PUBLISHED BELOW THE BAR — this page is marked published and scores under ${PUBLISH_SCORE_THRESHOLD}.`);
  }
  console.log("");
}

const published = results.filter((r) => r.status === "published").length;
const drafts = results.length - published;
console.log(`${results.length} editorial pages: ${published} published, ${drafts} in draft.`);

if (failures > 0) {
  console.log(`\n${failures} page(s) need attention before this passes.\n`);
  process.exit(1);
}
console.log("");
process.exit(0);
