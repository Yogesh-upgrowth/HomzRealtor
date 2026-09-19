#!/usr/bin/env node
// R19-07 / index-strategy evidence (2026-09-19). Read-only.
//
// ~34,000 of the site's ~38,800 indexable URLs are listing-detail pages
// rebuilt from a third-party feed. Whether that surface helps or hurts is the
// single biggest open question for Gurgaon rankings, and it must not be
// answered by guessing: mass-noindexing without Search Console evidence can
// drop traffic the site already has. This script produces the site-side half
// of that evidence -- which listing URLs are thin, and why -- so it can be
// diffed against a GSC Performance and Page-indexing export.
//
// It changes nothing. It does not write robots rules, does not touch the
// sitemap, and makes no recommendation on its own.
//
// Usage:
//   node scripts/listing-quality-report.mjs [outDir] [maxPerSegment]
//     outDir         defaults to ./reports
//     maxPerSegment  cap records per segment for a quick pass; omit for all
//
// Output:
//   <outDir>/listing-quality.csv      one row per listing, with its flags
//   <outDir>/listing-quality.json     summary counts
//
// The predicates below mirror the app's own logic. Where a rule lives in
// TypeScript the source file is named; keep the two in sync if either moves.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const UPSTREAM = "https://homz-scrape.vercel.app/api/data";
const OUT_DIR = process.argv[2] || "reports";
const MAX_PER_SEGMENT = process.argv[3] ? parseInt(process.argv[3], 10) : Infinity;
// Matches lib/listings/segmentCache.ts's UPSTREAM_LIMIT.
const UPSTREAM_LIMIT = 25_000;
const TIMEOUT_MS = 120_000;

const SEGMENTS = [
  { segment: "ggnSaleProperties", routeBase: "buy-property", category: "Sale" },
  { segment: "ggnRentProperties", routeBase: "rent-property", category: "Rent" },
  { segment: "ggnCommercialProperties", routeBase: "commercial", category: "Commercial" },
  { segment: "ggnPgProperties", routeBase: "pg-property", category: "Pg" },
];

// --- predicates mirroring the app -------------------------------------------

// lib/intelligence/view-model.ts
const IMG_RE = /\.(jpg|jpeg|png|webp)(\?|$)/i;
const CHROME_PATH_RE =
  /\/assets\/images\/|\/ui-assets\/images\/|\/developerlogo\/|\/tn-projectflagship\/|\/connect\/profilepic\//i;

function validImageCount(images) {
  return (images || []).filter(
    (u) => typeof u === "string" && IMG_RE.test(u) && !CHROME_PATH_RE.test(u)
  ).length;
}

// lib/intelligence/normalize.ts — looksLikeUnitSelectorDump()
const UNIT_SELECTOR_TOKENS = [
  "sqft", "sqyd", "sqyrd", "sqm", "acre", "bigha", "hectare", "marla", "kanal",
  "biswa", "ground", "aankadam", "rood", "chatak", "kottah", "cent", "perch",
  "guntha", "katha", "gaj", "killa", "kuncham",
];
function looksLikeUnitSelectorDump(value) {
  const lower = String(value ?? "").toLowerCase();
  let distinct = 0;
  for (const t of UNIT_SELECTOR_TOKENS) {
    if (lower.includes(t)) distinct++;
    if (distinct >= 2) return true;
  }
  return UNIT_SELECTOR_TOKENS.some((t) => lower.split(t).length - 1 >= 2);
}

// lib/intelligence/property-view.ts — priceText() / priceValue()
function hasDisplayPrice(p) {
  const raw = (p.price || "").trim();
  return Boolean(raw) && raw !== "Price on Request";
}
function numericPrice(p) {
  const isRental = p.listingType === "rent" || p.rentMonthly != null;
  const v = isRental ? p.rentMonthly : p.priceValue;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

// components/utils/slugify.ts, via slugForProperty()
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function slugForProperty(p) {
  const idTail = (p.id || "").split(":").pop()?.slice(-8) || "";
  return `${slugify(p.title || "property")}-${idTail}`;
}

// --- fetch -------------------------------------------------------------------

async function fetchSegment(segment) {
  const url = `${UPSTREAM}?segment=${encodeURIComponent(segment)}&page=1&limit=${UPSTREAM_LIMIT}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${segment}: HTTP ${res.status}`);
    const body = await res.json();
    const rows = Array.isArray(body) ? body : body.data || body.results || [];
    return rows;
  } finally {
    clearTimeout(timer);
  }
}

// --- main --------------------------------------------------------------------

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const rows = [];
  const summary = { generatedAt: new Date().toISOString(), segments: {}, totals: {} };

  for (const { segment, routeBase, category } of SEGMENTS) {
    process.stdout.write(`fetching ${segment}… `);
    let records;
    try {
      records = await fetchSegment(segment);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      summary.segments[segment] = { error: err.message };
      continue;
    }
    if (MAX_PER_SEGMENT !== Infinity) records = records.slice(0, MAX_PER_SEGMENT);
    console.log(`${records.length} records`);

    // Title collisions are only meaningful within a segment: the same title in
    // Sale and Rent is two genuinely different pages.
    const titleCounts = new Map();
    for (const p of records) {
      const t = (p.title || "").trim().toLowerCase();
      if (t) titleCounts.set(t, (titleCounts.get(t) || 0) + 1);
    }

    const seg = {
      total: records.length,
      noPrice: 0,
      noNumericPrice: 0,
      noImage: 0,
      duplicateTitle: 0,
      contaminatedArea: 0,
      noArea: 0,
      thin: 0,
    };

    for (const p of records) {
      const title = (p.title || "").trim();
      const noPrice = !hasDisplayPrice(p);
      const noNumericPrice = numericPrice(p) === null;
      const noImage = validImageCount(p.images) === 0;
      const duplicateTitle = Boolean(title) && titleCounts.get(title.toLowerCase()) > 1;
      const contaminatedArea = looksLikeUnitSelectorDump(p.size);
      const noArea = !p.size || String(p.size).trim() === "";

      // "Thin" here means a page with no price AND no image -- the two facts a
      // listing page exists to convey. Deliberately narrow: this is the set
      // worth examining first against GSC, not a noindex list.
      const thin = noPrice && noImage;

      if (noPrice) seg.noPrice++;
      if (noNumericPrice) seg.noNumericPrice++;
      if (noImage) seg.noImage++;
      if (duplicateTitle) seg.duplicateTitle++;
      if (contaminatedArea) seg.contaminatedArea++;
      if (noArea) seg.noArea++;
      if (thin) seg.thin++;

      if (noPrice || noImage || duplicateTitle || contaminatedArea || noArea) {
        rows.push({
          url: `https://www.homzrealtor.com/${routeBase}/gurgaon/${slugForProperty(p)}`,
          category,
          title,
          noPrice,
          noNumericPrice,
          noImage,
          duplicateTitle,
          contaminatedArea,
          noArea,
          thin,
        });
      }
    }

    summary.segments[segment] = seg;
  }

  for (const seg of Object.values(summary.segments)) {
    if (seg.error) continue;
    for (const [k, v] of Object.entries(seg)) {
      summary.totals[k] = (summary.totals[k] || 0) + v;
    }
  }

  const header = [
    "url", "category", "title", "noPrice", "noNumericPrice", "noImage",
    "duplicateTitle", "contaminatedArea", "noArea", "thin",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) => header.map((h) => csvCell(r[h])).join(",")),
  ].join("\n");

  writeFileSync(join(OUT_DIR, "listing-quality.csv"), csv);
  writeFileSync(join(OUT_DIR, "listing-quality.json"), JSON.stringify(summary, null, 2));

  console.log("\n--- summary ---");
  console.table(summary.segments);
  console.log("totals:", summary.totals);
  console.log(`\nflagged rows: ${rows.length}`);
  console.log(`written: ${join(OUT_DIR, "listing-quality.csv")}`);
  console.log(`written: ${join(OUT_DIR, "listing-quality.json")}`);
  console.log(
    "\nNext: export GSC Performance (query+page, India, 12 months) and Page\n" +
    "indexing, then diff. A flagged URL that already earns impressions is\n" +
    "evidence to improve the record, not to noindex it."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
