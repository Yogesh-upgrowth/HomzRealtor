// Tests lib/intelligence/developerViews.ts — the Developer x Intent x Location
// architecture's view definitions and indexability thresholds.
//
// This decides how many new indexable URLs the site creates. Get the
// thresholds wrong downward and it is the faceted-navigation problem again, at
// developer scale: 57 developers x 5 views x 7 corridors is ~3,400 potential
// URLs, most of them thin. Get them wrong upward and the architecture produces
// nothing.
//
// The case that needs the most care is a view that CLEARS the count but has
// nothing to show — nine projects, none priced. Counting records is easy; the
// page still has to be able to say something the parent does not.
//
// Run: node --experimental-strip-types tests/developer-views.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "devviews-"));
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
copy("lib/listings/listingLocation.ts", "listingLocation.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
]);
copy("lib/intelligence/developerViews.ts", "developerViews.ts", [
  ['from "./normalize"', 'from "./normalize.ts"'],
  ['from "./projectStatus"', 'from "./projectStatus.ts"'],
  ['from "@/lib/listings/listingLocation"', 'from "./listingLocation.ts"'],
]);

const {
  FIXED_DEVELOPER_VIEWS,
  LUXURY_MIN_INR,
  VIEW_INDEX_THRESHOLDS,
  availableDeveloperViews,
  decideViewIndexable,
  projectsForView,
  resolveDeveloperView,
} = await import(pathToFileURL(join(dir, "developerViews.ts")).href);

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

const proj = (over = {}) => ({
  slug: over.slug ?? "p",
  city_key: "ggn",
  city_name: "Gurgaon",
  project_name: over.project_name ?? "A Project",
  builder: "DLF",
  property_category: "Residential",
  property_type: "3 BHK",
  project_status: "Ready to Move",
  possession_text: "2023",
  rera_id: "HRERA-PKL-GGN-1-2021",
  rera_status: "active",
  sector: "Sector 54",
  micro_market: "Golf Course Road",
  min_price_inr: 60000000,
  max_price_inr: 90000000,
  min_size: 3000,
  max_size: 4000,
  size_unit: "sq.ft",
  images: ["x.jpg"],
  amenities: [],
  about: [],
  builder_description: [],
  updated_at: null,
  ...over,
});

const many = (n, over = {}) =>
  Array.from({ length: n }, (_, i) => proj({ slug: `p${i}`, project_name: `Project ${i}`, ...over }));

// ── view resolution ───────────────────────────────────────────────────────

t("the five fixed views exist", FIXED_DEVELOPER_VIEWS.map((v) => v.slug), [
  "residential",
  "commercial",
  "new-launch",
  "ready-to-move",
  "luxury",
]);
t("residential resolves", resolveDeveloperView("residential")?.kind, "category");
t("new-launch resolves", resolveDeveloperView("new-launch")?.kind, "status");
t("luxury resolves", resolveDeveloperView("luxury")?.kind, "price");
t("a corridor resolves", resolveDeveloperView("golf-course-road")?.kind, "corridor");
t("corridor label is the real one", resolveDeveloperView("golf-course-road")?.label, "Projects on Golf Course Road");
t("case-insensitive", resolveDeveloperView("Residential")?.slug, "residential");
t("an unknown segment does not resolve", resolveDeveloperView("banana"), null);
t("an empty segment does not resolve", resolveDeveloperView(""), null);

// Luxury must be the sitewide ₹5 Cr definition, not a developer-only one.
t("luxury threshold is the sitewide 5 Cr", LUXURY_MIN_INR, 50000000);

// ── filters ───────────────────────────────────────────────────────────────

const mixed = [
  proj({ slug: "r1", property_category: "Residential" }),
  proj({ slug: "c1", property_category: "Commercial", property_type: "Office" }),
  proj({ slug: "n1", project_status: "New Launch" }),
  proj({ slug: "u1", project_status: "Under Construction" }),
  proj({ slug: "cheap", min_price_inr: 9000000 }),
];
const view = (slug) => resolveDeveloperView(slug);
const countIn = (slug, list) => projectsForView(view(slug), list).length;

t("residential filter", countIn("residential", mixed), 4);
t("commercial filter", countIn("commercial", mixed), 1);
t("new-launch filter", countIn("new-launch", mixed), 1);
t("ready-to-move filter", countIn("ready-to-move", mixed), 3);
t("luxury filter excludes the sub-5Cr project", countIn("luxury", mixed), 4);
t(
  "an unpriced project is not luxury",
  countIn("luxury", [proj({ min_price_inr: null })]),
  0
);

// ── thresholds ────────────────────────────────────────────────────────────

t("category threshold", VIEW_INDEX_THRESHOLDS.category, 4);
t("corridor threshold is higher", VIEW_INDEX_THRESHOLDS.corridor > VIEW_INDEX_THRESHOLDS.category, true);

t(
  "a category view at the threshold is indexable",
  decideViewIndexable(view("residential"), many(4)).indexable,
  true
);
t(
  "one below the threshold is not",
  decideViewIndexable(view("residential"), many(3)).indexable,
  false
);
t(
  "and says why, on the page not just in a robots tag",
  Boolean(decideViewIndexable(view("residential"), many(3)).reason),
  true
);
t(
  "a corridor needs five, not four",
  decideViewIndexable(view("golf-course-road"), many(4)).indexable,
  false
);
t(
  "a corridor at five is indexable",
  decideViewIndexable(view("golf-course-road"), many(5)).indexable,
  true
);

// THE CASE THAT MATTERS. Nine projects clears every count, but with nothing
// priced the page is a list of links the parent already has.
const unpriced = many(9, { min_price_inr: null, max_price_inr: null });
t("count alone is not enough", decideViewIndexable(view("residential"), unpriced).indexable, false);
t(
  "and the reason names the real problem",
  /price/i.test(decideViewIndexable(view("residential"), unpriced).reason ?? ""),
  true
);
// One priced project is still not enough to say anything comparative.
const onePriced = [...many(8, { min_price_inr: null }), proj({ slug: "priced" })];
t("one priced project is not enough", decideViewIndexable(view("residential"), onePriced).indexable, false);
const twoPriced = [...many(7, { min_price_inr: null }), proj({ slug: "a" }), proj({ slug: "b" })];
t("two priced projects clears it", decideViewIndexable(view("residential"), twoPriced).indexable, true);

// ── available views ───────────────────────────────────────────────────────

const portfolio = [
  ...many(6, { property_category: "Residential" }),
  ...many(3, { property_category: "Commercial", property_type: "Office", slug: "c" }).map((p, i) => ({
    ...p,
    slug: `c${i}`,
  })),
];
const available = availableDeveloperViews(portfolio);
const bySlug = Object.fromEntries(available.map((a) => [a.view.slug, a]));

t("residential is available", bySlug.residential?.count, 6);
t("residential is indexable", bySlug.residential?.indexable, true);
t("commercial is available at 3", bySlug.commercial?.count, 3);
// LINKED at one project, INDEXED only at the threshold — the two bars are
// deliberately different and this is the assertion that pins that.
t("but commercial is not indexable at 3", bySlug.commercial?.indexable, false);

t(
  "a view with zero projects is omitted entirely",
  available.some((a) => a.view.slug === "new-launch"),
  false
);

// Corridors are derived from the portfolio, not listed statically.
t("the corridor appears", Boolean(bySlug["golf-course-road"]), true);
t("with the whole portfolio behind it", bySlug["golf-course-road"]?.count, 9);

// Ordering: fixed views first, then corridors by size.
t(
  "fixed views come before corridors",
  available.findIndex((a) => a.view.kind === "corridor") > 0,
  true
);

t("an empty portfolio yields no views", availableDeveloperViews([]), []);

console.log(fail === 0 ? "\nAll developer-view tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
