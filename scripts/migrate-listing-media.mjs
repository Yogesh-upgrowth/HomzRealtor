#!/usr/bin/env node
// Copies listing images off the source portals' CDNs and onto Homz's own
// storage (2026-09-19).
//
// Every image on a detail page is currently hotlinked from
// static.squareyards.com or img.staticmb.com. That is both the most visible
// way a page reads as republished and a standing outage risk -- if those links
// are cut, every image and social preview on ~35,000 pages breaks at once.
//
// This migrates them incrementally. lib/listings/media.ts reads the manifest
// this writes and serves Homz-hosted media the moment any exists for a
// listing, falling back to the source until then, so there is no flag day and
// partial progress is useful immediately.
//
// IMPORTANT, and it is not a technicality: self-hosting an image does not
// create a licence for it. Run this only for media Homz has the right to use
// -- own photography, or builder imagery with written permission. See
// OWNER_INPUTS content.builderImagery. Moving someone else's photo to Homz's
// domain changes the legal exposure, it does not remove it.
//
// Usage:
//   BLOB_READ_WRITE_TOKEN=... node scripts/migrate-listing-media.mjs <segment> [limit]
//
//   segment  ggnSaleProperties | ggnRentProperties | ggnCommercialProperties
//   limit    how many listings to migrate this run (default 50)
//
// Re-runnable: listings already in the manifest are skipped.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const MANIFEST = "data/media/listing-media.json";
const UPSTREAM = "https://homz-scrape.vercel.app/api/data";
const SEGMENT = process.argv[2];
const LIMIT = process.argv[3] ? parseInt(process.argv[3], 10) : 50;
const MAX_IMAGES_PER_LISTING = 6;

if (!SEGMENT) {
  console.error("usage: node scripts/migrate-listing-media.mjs <segment> [limit]");
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN is not set. This script uploads to Vercel Blob,\n" +
      "the same store the agent photo upload path already uses."
  );
  process.exit(1);
}

const { put } = await import("@vercel/blob");

function loadManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch {
    return {};
  }
}

function saveManifest(m) {
  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + "\n");
}

// Mirrors lib/listings/identity.ts. Kept in sync by hand; the test suite
// (npm run test:identity) pins the behaviour on the TypeScript side.
const NOISE = new Set(["the","a","an","apartment","apartments","flat","flats","residency","residences","residence","society","project","tower","towers","phase","sector","sec","gurgaon","gurugram","haryana","india","sale","rent","for","in","at","bhk","rk","sq","ft","sqft","yard","yards","unit","units","property","house","floor","builder","independent"]);
const CODE = { ggnSaleProperties: "S", ggnRentProperties: "R", ggnCommercialProperties: "C", ggnPgProperties: "P" };
const norm = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sig = (v) => norm(v).replace(/\bsec(?:tor)?[\s.-]*[0-9]{1,3}\s*[a-d]?\b/gi, " ").split(" ").filter((t) => t && !NOISE.has(t) && !/^\d+$/.test(t));
const sectorOf = (t) => { const m = String(t ?? "").match(/\bsec(?:tor)?[\s.-]*([0-9]{1,3}\s*[a-d]?)\b/i); return m ? m[1].replace(/\s+/g, "").toLowerCase() : null; };
function fnv1a(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
function fingerprint(p) {
  const society = sig((p.specifications || []).find((s) => /project|society|building/i.test(s?.heading || ""))?.value || p.title || "").slice(0, 4);
  const sector = sectorOf(p.location) || sectorOf(p.title);
  const bedrooms = p.bedrooms != null ? String(p.bedrooms) : "";
  const type = norm(p.propertyType);
  const area = typeof p.areaValue === "number" && p.areaValue > 0 ? String(Math.round(p.areaValue / 25) * 25) : "";
  if (!sector && society.length < 2) return null;
  if (!bedrooms && !area) return null;
  if (!sector && !area) return null;
  return [society.join("-"), sector || "", type, bedrooms, area].join("|");
}
function listingId(p, segment) {
  const fp = fingerprint(p);
  const basis = fp ?? `src:${p.id ?? p.title ?? ""}`;
  return `HZ-GGN-${CODE[segment] ?? "S"}-${fnv1a(basis).toString(36).toUpperCase().padStart(6, "0").slice(-6)}`;
}

const IMG_RE = /\.(jpg|jpeg|png|webp)(\?|$)/i;
const CHROME_RE = /\/assets\/images\/|\/ui-assets\/images\/|\/developerlogo\/|\/tn-projectflagship\/|\/connect\/profilepic\//i;
const usable = (u) => typeof u === "string" && IMG_RE.test(u) && !CHROME_RE.test(u);

async function main() {
  const manifest = loadManifest();

  process.stdout.write(`fetching ${SEGMENT}… `);
  const res = await fetch(`${UPSTREAM}?segment=${encodeURIComponent(SEGMENT)}&page=1&limit=25000`);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const body = await res.json();
  const records = Array.isArray(body) ? body : body.data || body.results || [];
  console.log(`${records.length} records`);

  // Migrate the listings with the most usable images first -- those are the
  // pages where owned media makes the biggest difference, and it front-loads
  // the value if the run is stopped early.
  const queue = records
    .map((p) => ({ p, id: listingId(p, SEGMENT), images: (p.images || []).filter(usable) }))
    .filter((r) => r.images.length > 0 && !manifest[r.id])
    .sort((a, b) => b.images.length - a.images.length)
    .slice(0, LIMIT);

  console.log(`migrating ${queue.length} listings (skipping ${Object.keys(manifest).length} already done)\n`);

  let uploaded = 0;
  let failed = 0;
  for (const { id, images } of queue) {
    const hosted = [];
    for (const [i, src] of images.slice(0, MAX_IMAGES_PER_LISTING).entries()) {
      try {
        const r = await fetch(src);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        const ext = (src.match(IMG_RE)?.[1] || "jpg").toLowerCase();
        const { url } = await put(`listings/${id}/${i}.${ext}`, buf, {
          access: "public",
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
          addRandomSuffix: false,
        });
        hosted.push(url);
      } catch (err) {
        failed++;
        console.warn(`  ${id} image ${i}: ${err.message}`);
      }
    }
    if (hosted.length > 0) {
      manifest[id] = hosted;
      uploaded += hosted.length;
      saveManifest(manifest); // save as we go so a crash keeps progress
      console.log(`  ${id}: ${hosted.length} image(s)`);
    }
  }

  console.log(`\nuploaded ${uploaded} images across ${queue.length} listings, ${failed} failures`);
  console.log(`manifest: ${MANIFEST} (${Object.keys(manifest).length} listings total)`);
  console.log("\nCommit the manifest. lib/listings/media.ts picks these up on the next deploy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
