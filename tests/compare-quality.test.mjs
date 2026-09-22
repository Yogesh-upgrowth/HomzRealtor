// Tests lib/intelligence/compareQuality.ts — which comparison pages get
// indexed.
//
// Checklist item 10. This decides indexability across a ~10^6 combinatorial
// URL space, so a threshold set slightly wrong in either direction is either
// index bloat on a scale that got this path robots-blocked once before, or a
// route that produces zero indexable pages (which is what the empty
// hand-curated allow-list it replaces was doing).
//
// The two hard gates get the most attention, because they encode the item's
// own examples and must not be rescuable by a high score elsewhere.
//
// Run: node --experimental-strip-types tests/compare-quality.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "comparequality-"));
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
copy("lib/intelligence/projectStatus.ts", "projectStatus.ts");
copy("lib/intelligence/compareQuality.ts", "compareQuality.ts", [
  ['from "./normalize"', 'from "./normalize.ts"'],
  ['from "./projectStatus"', 'from "./projectStatus.ts"'],
]);

const { scoreComparePair, keyDifferences, COMPARE_INDEX_THRESHOLD } = await import(
  pathToFileURL(join(dir, "compareQuality.ts")).href
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

// Two well-populated flats in the same sector, by different developers, at
// comparable prices. This is the pair the feature exists for.
const base = {
  slug: "a",
  city_key: "ggn",
  city_name: "Gurgaon",
  project_name: "Project A",
  builder: "M3M",
  property_category: "Residential",
  property_type: "3 BHK",
  project_status: "Ready to Move",
  possession_text: "2023",
  rera_id: "HRERA-PKL-GGN-1-2021",
  rera_status: "active",
  sector: "Sector 65",
  micro_market: "Golf Course Extension Road",
  min_price_inr: 25000000,
  max_price_inr: 40000000,
  min_size: 1800,
  max_size: 2400,
  size_unit: "sq.ft",
  amenities: [1, 2, 3],
  images: ["x.jpg"],
  about: [],
  builder_description: [],
};
const mk = (over) => ({ ...base, ...over });

const goodA = mk({ slug: "a", project_name: "M3M Latitude" });
const goodB = mk({
  slug: "b",
  project_name: "Emaar Palm Gardens",
  builder: "Emaar",
  min_price_inr: 30000000,
  project_status: "Under Construction",
  possession_text: "Dec 2027",
});

// ── the pair the feature is for ───────────────────────────────────────────

const good = scoreComparePair(goodA, goodB);
t("a well-matched pair clears the threshold", good.indexable, true);
t("and is not disqualified", good.disqualifiedBy, null);
t("all four scored criteria are present", good.criteria.length, 4);
t(
  "score equals the sum of its criteria",
  good.score,
  good.criteria.reduce((s, c) => s + c.earned, 0)
);

// ── hard gate 1: category ─────────────────────────────────────────────────
//
// The item's own example: "Commercial mall vs unrelated residential
// apartment". A category mismatch must not be rescuable by anything else, so
// this pair is otherwise perfect — same sector, same price, full data.

const mall = mk({ slug: "m", project_name: "A Mall", property_category: "Commercial", property_type: "Retail" });
const crossCategory = scoreComparePair(goodA, mall);
t("commercial vs residential is disqualified", crossCategory.indexable, false);
t("and says why", Boolean(crossCategory.disqualifiedBy), true);
t("a disqualified pair scores zero, not a partial score", crossCategory.score, 0);

// ── hard gate 2: unit type ────────────────────────────────────────────────
//
// The item's other example, "Sector 113 luxury apartment vs Sector 70
// warehouse", is a unit-type mismatch. Both residential, both in the same
// sector, and still not a comparison anyone is making.

const plot = mk({ slug: "p", project_name: "Green Plots", property_type: "Plot" });
const crossType = scoreComparePair(goodA, plot);
t("a flat vs a plot is disqualified", crossType.indexable, false);
t("villas and flats are also different purchases", scoreComparePair(goodA, mk({ slug: "v", project_name: "Ireo Villas", property_type: "Independent Floor" })).indexable, false);

// ── geography ─────────────────────────────────────────────────────────────

const geoOf = (a, b) => scoreComparePair(a, b).criteria.find((c) => c.key === "geography").earned;
t("same sector scores full geography", geoOf(goodA, goodB), 30);
// The sector test is checked first and these differ, so the corridor rule
// applies: 26, not the full 30 an exact sector match earns.
t(
  "same corridor, different sector",
  geoOf(goodA, mk({ slug: "c", sector: "Sector 66", micro_market: "Golf Course Extension Road" })),
  26
);
t(
  "opposite ends of the city score nothing for geography",
  geoOf(
    goodA,
    mk({ slug: "d", sector: "Sector 102", micro_market: "Dwarka Expressway", project_name: "Far Away" })
  ),
  0
);

// ── budget ────────────────────────────────────────────────────────────────

const priceOf = (a, b) => scoreComparePair(a, b).criteria.find((c) => c.key === "price").earned;
t("similar prices score full", priceOf(goodA, mk({ slug: "e", min_price_inr: 30000000 })), 20);
t("a 10x gap scores nothing", priceOf(goodA, mk({ slug: "f", min_price_inr: 250000000 })), 0);
t(
  "Price on Request is not punished as hard as a mismatch",
  priceOf(goodA, mk({ slug: "g", min_price_inr: null, max_price_inr: null })) > 0,
  true
);

// ── thin data ─────────────────────────────────────────────────────────────

const sparse = {
  slug: "sparse",
  city_key: "ggn",
  city_name: "Gurgaon",
  project_name: "Sparse Project",
  builder: "Unknown",
  property_category: "Residential",
  property_type: "3 BHK",
  project_status: null,
  possession_text: null,
  rera_id: null,
  rera_status: null,
  sector: "Sector 65",
  micro_market: null,
  min_price_inr: null,
  max_price_inr: null,
  min_size: null,
  max_size: null,
  size_unit: null,
  amenities: [],
  images: [],
  about: [],
  builder_description: [],
};
const thin = scoreComparePair(goodA, sparse);
t("a pair with almost no comparable data does not clear the bar", thin.indexable, false);
t(
  "and the data criterion is what drags it down",
  thin.criteria.find((c) => c.key === "data").earned < 15,
  true
);

// ── nothing to say ────────────────────────────────────────────────────────

const twin = mk({ slug: "twin", project_name: "Project A Twin" });
const identical = scoreComparePair(goodA, twin);
t(
  "two near-identical records earn nothing for distinctness",
  identical.criteria.find((c) => c.key === "distinct").earned,
  0
);

// ── threshold sanity ──────────────────────────────────────────────────────

t("the threshold is the published constant", good.threshold, COMPARE_INDEX_THRESHOLD);
t(
  "indexable is exactly score >= threshold",
  good.indexable === good.score >= COMPARE_INDEX_THRESHOLD,
  true
);

// ── key differences (item 11's prose) ─────────────────────────────────────

const diffs = keyDifferences(goodA, goodB);
t("differences are produced for a real pair", diffs.length > 0, true);
t(
  "possession difference is named",
  diffs.some((d) => /ready to move/i.test(d) && /under construction/i.test(d)),
  true
);
t(
  "developer difference is named",
  diffs.some((d) => /M3M/.test(d) && /Emaar/.test(d)),
  true
);
t("identical records produce no differences", keyDifferences(goodA, twin), []);

console.log(fail === 0 ? "\nAll compare-quality tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
