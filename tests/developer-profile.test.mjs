// Tests lib/intelligence/developerProfile.ts — the real module, not a
// reimplementation of it.
//
// The module imports its sibling extensionlessly ("./normalize"), which Node's
// ESM resolver will not resolve to a .ts file. So both real files are copied
// to a temp dir with that one specifier rewritten to an explicit ".ts", and
// imported under --experimental-strip-types. Nothing else about either file is
// touched, so a change to the arithmetic in the repo is a change to what runs
// here.
//
// Run: node --experimental-strip-types tests/developer-profile.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "devprofile-"));
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
  join(dir, "developerProfile.ts"),
  readFileSync("lib/intelligence/developerProfile.ts", "utf8").replace(
    'from "./normalize"',
    'from "./normalize.ts"'
  )
);
const { buildDeveloperProfile, buildDeveloperFaqs } = await import(
  pathToFileURL(join(dir, "developerProfile.ts")).href
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

const citySlug = (k) => (k === "ggn" ? "gurgaon" : k);
const p = (over = {}) => ({
  slug: "x",
  city_key: "ggn",
  project_name: "X",
  builder: "B",
  property_category: "Residential",
  property_type: "Apartment",
  project_status: null,
  rera_id: null,
  rera_status: null,
  sector: null,
  micro_market: null,
  city_name: "Gurgaon",
  min_price_inr: null,
  max_price_inr: null,
  min_size: null,
  max_size: null,
  size_unit: null,
  images: [],
  ...over,
});

// --- price stats -----------------------------------------------------------
const priced = [1e7, 2e7, 3e7, 4e7].map((v, i) =>
  p({ slug: `a${i}`, min_price_inr: v, min_size: 1000, size_unit: "sq.ft" })
);
const prof = buildDeveloperProfile(priced, citySlug);
t("median of 4 priced projects", prof.price.medianInr, 25000000);
t("min/max entry price", [prof.price.minInr, prof.price.maxInr], [10000000, 40000000]);
t("per sq ft median", prof.price.perSqFtInr, 25000);

// Three priced projects is below the floor — no median at all, rather than a
// median computed from a sample too small to mean anything.
t("3 priced projects -> no price block", buildDeveloperProfile(priced.slice(0, 3), citySlug).price, null);

// A sq.yd record must never be divided as though it were sq.ft (the DEV-02
// bug). It drops out of the rate sample but stays in the price sample.
const mixedUnits = [
  ...priced.slice(0, 3),
  p({ slug: "yd", min_price_inr: 5e7, min_size: 100, size_unit: "sq.yd" }),
];
const mu = buildDeveloperProfile(mixedUnits, citySlug);
t("sq.yd counted in prices", mu.price.pricedCount, 4);
t("sq.yd excluded from rate sample", mu.price.perSqFtSample, 3);
t("rate needs 4 samples -> null", mu.price.perSqFtInr, null);

// An unconfirmed unit (size_unit null) is excluded the same way.
t(
  "null size_unit excluded from rate sample",
  buildDeveloperProfile(
    [...priced.slice(0, 3), p({ slug: "u", min_price_inr: 5e7, min_size: 900, size_unit: null })],
    citySlug
  ).price.perSqFtSample,
  3
);

// Price-on-request records count toward the total but not the sample.
const withPor = [...priced, p({ slug: "por" }), p({ slug: "por2" })];
const wp = buildDeveloperProfile(withPor, citySlug);
t("price-on-request in total, not sample", [wp.price.pricedCount, wp.price.totalCount], [4, 6]);

// --- status ----------------------------------------------------------------
const statuses = buildDeveloperProfile(
  [
    p({ slug: "s1", project_status: "Ready to Move" }),
    p({ slug: "s2", project_status: "Under Construction" }),
    p({ slug: "s3", project_status: "New Launch" }),
    p({ slug: "s4", project_status: null }),
    p({ slug: "s5", project_status: "Mid Stage" }),
  ],
  citySlug
);
t("status buckets", [statuses.readyToMove, statuses.underConstruction, statuses.newLaunch], [1, 1, 1]);
// The unclassified two must be surfaced, never folded into a known bucket —
// the page states them as "status not stated".
t("unclassified statuses surfaced", statuses.statusUnknown, 2);

// --- RERA ------------------------------------------------------------------
const rera = buildDeveloperProfile(
  [
    p({ slug: "r1", rera_id: "HRERA-1", rera_status: "active" }),
    p({ slug: "r2", rera_id: "HRERA-2", rera_status: "lapsed" }),
    p({ slug: "r3", rera_id: null, rera_status: null }),
  ],
  citySlug
);
// A well-formed id is not a live registration — the two counts stay separate.
t("rera with id vs active", [rera.reraWithId, rera.reraActive], [3 - 1, 1]);

// --- sectors ---------------------------------------------------------------
const sectors = buildDeveloperProfile(
  [
    p({ slug: "g1", sector: "Sector 65" }),
    p({ slug: "g2", sector: "Sector 65" }),
    p({ slug: "g3", sector: "Sector 82A" }),
    p({ slug: "n1", city_key: "gNoida", city_name: "Greater Noida", sector: "Sector 150" }),
  ],
  citySlug
);
t("sectors counted and ordered", sectors.sectors.map((s) => [s.label, s.count]), [
  ["Sector 65", 2],
  ["Sector 150", 1],
  ["Sector 82A", 1],
]);
t("gurgaon sector links", sectors.sectors[0].href, "/project-listing/gurgaon/sectors/sector-65");
// No sector route exists outside Gurgaon, so the label must not become a link.
t("non-gurgaon sector unlinked", sectors.sectors.find((s) => s.label === "Sector 150").href, null);

// --- faqs ------------------------------------------------------------------
const fmt = (n) => (n == null ? null : `₹${(n / 1e7).toFixed(2)} Cr`);
const faqs = buildDeveloperFaqs("Acme", "Gurgaon", prof, fmt);
t("every faq has a non-empty answer", faqs.every((f) => f.q && f.a && f.a.length > 40), true);
t("no faq for a figure that could not be computed",
  buildDeveloperFaqs("Acme", "Gurgaon", buildDeveloperProfile([p()], citySlug), fmt)
    .some((f) => /price range|per sq ft/.test(f.q)),
  false);
t("rera faq names both counts", 
  /2 of the 3 .* and 1 of those/.test(buildDeveloperFaqs("Acme", "Gurgaon", rera, fmt).find((f) => /RERA/.test(f.q)).a),
  true);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail ? 1 : 0);
