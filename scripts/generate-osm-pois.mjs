#!/usr/bin/env node
// Offline, one-off (re-run only when the source PBF is refreshed) pipeline:
// streams a regional OSM PBF extract, keeps only node-type features that fall
// inside the NCR bounding box and match a category we care about, and writes
// two small static JSON files the app reads at runtime instead of calling any
// paid geocoding/places/distance-matrix API.
//
// Usage: node scripts/generate-osm-pois.mjs <path-to-.osm.pbf>
//
// Deliberately nodes-only for this first pass: schools, hospitals, metro/rail
// stations, malls etc. are overwhelmingly mapped as point nodes in OSM India.
// Large polygon-mapped venues (a mall drawn as a building outline rather than
// a point) are missed here — resolving way geometry needs holding every
// referenced node's coordinates in memory for a second pass, which isn't
// worth the memory cost for a first cut. Revisit if spot-checks show gaps.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import parseOSM from "osm-pbf-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "data", "osm");

// Covers Gurgaon, Delhi, Noida, Greater Noida, Faridabad — the only cities
// this site serves today (see CITY_ANCHORS in lib/intelligence/geo.ts).
// Generous margin beyond each city's built-up area on purpose.
const BBOX = { minLat: 28.15, maxLat: 28.95, minLon: 76.70, maxLon: 77.70 };

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inBbox(lat, lon) {
  return (
    lat >= BBOX.minLat && lat <= BBOX.maxLat &&
    lon >= BBOX.minLon && lon <= BBOX.maxLon
  );
}

// tag key -> tag value -> category label (labels match the existing
// LANDMARK_TYPES categories in lib/intelligence/geo.ts so the UI needs no
// changes). A node can only land in one category — first match wins, checked
// in the order below.
const POI_RULES = [
  { key: "amenity", values: ["school"], category: "Schools" },
  { key: "amenity", values: ["college", "university"], category: "Schools" },
  { key: "amenity", values: ["hospital"], category: "Hospitals" },
  { key: "amenity", values: ["clinic"], category: "Hospitals" },
  { key: "shop", values: ["mall"], category: "Shopping Centres" },
  { key: "shop", values: ["supermarket"], category: "Supermarkets" },
  { key: "leisure", values: ["park"], category: "Parks" },
  { key: "leisure", values: ["fitness_centre"], category: "Gyms" },
  { key: "tourism", values: ["hotel"], category: "Hotels" },
  { key: "amenity", values: ["restaurant"], category: "Restaurants" },
  // Connectivity-specific categories, not in the original LANDMARK_TYPES list
  // but needed to replace buildConnectivity()'s metro/railway/airport lookups.
  { key: "aeroway", values: ["aerodrome"], category: "Airports" },
];

function classify(tags) {
  if (!tags) return null;
  // Delhi Metro / NCR metro stations: railway=station + station=subway
  // (sometimes subway=yes instead of/alongside station=subway).
  if (tags.railway === "station") {
    if (tags.station === "subway" || tags.subway === "yes") return "Metro Stations";
    return "Railway Stations";
  }
  if (tags.railway === "subway_entrance") return "Metro Stations";
  for (const rule of POI_RULES) {
    const v = tags[rule.key];
    if (v && rule.values.includes(v)) return rule.category;
  }
  return null;
}

// Locality/place names, kept separately — this is the free replacement for
// Google Geocoding: a static sector/locality -> centroid lookup built from
// these, matched against a project's sector/micro_market/city_name text.
const PLACE_KINDS = new Set([
  "suburb", "neighbourhood", "quarter", "locality", "village", "town", "city",
]);

async function main() {
  const pbfPath = process.argv[2];
  if (!pbfPath) {
    console.error("Usage: node scripts/generate-osm-pois.mjs <path-to-.osm.pbf>");
    process.exit(1);
  }
  if (!fs.existsSync(pbfPath)) {
    console.error(`File not found: ${pbfPath}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pois = [];
  const places = [];
  const seenPoiIds = new Set();
  const seenPlaceIds = new Set();
  // Multiple OSM nodes commonly represent one physical station (platform,
  // each entrance, the station building), all separately tagged
  // railway=station. Dedup those two categories by normalized name so
  // "nearest metro" doesn't return the same station 2-3x. Not applied to
  // other categories, where the same name at different coordinates is
  // usually a genuine separate branch (e.g. a supermarket chain).
  const STATION_CATEGORIES = new Set(["Metro Stations", "Railway Stations"]);
  const seenStationKeys = new Set();
  const normalizeStationName = (name) =>
    name.toLowerCase().replace(/\s*\([^)]*\)\s*$/, "").trim(); // strip "(Blue Line)" etc.

  let nodesSeen = 0;
  let itemsSeen = 0;
  const startedAt = Date.now();

  const osm = parseOSM();
  const input = fs.createReadStream(pbfPath);

  await new Promise((resolve, reject) => {
    osm.on("data", (items) => {
      itemsSeen += items.length;
      for (const item of items) {
        if (item.type !== "node") continue;
        nodesSeen++;
        if (typeof item.lat !== "number" || typeof item.lon !== "number") continue;
        if (!inBbox(item.lat, item.lon)) continue;

        const tags = item.tags || {};
        const name = tags.name || tags["name:en"] || null;

        const category = classify(tags);
        // Skip unnamed POIs outright rather than inventing a label from the
        // category — a card that just says "Shopping Centres" as if that
        // were the venue's name is worse than not showing it.
        if (category && name && !seenPoiIds.has(item.id)) {
          if (STATION_CATEGORIES.has(category)) {
            const key = `${category}|${normalizeStationName(name)}`;
            if (seenStationKeys.has(key)) continue;
            seenStationKeys.add(key);
          }
          seenPoiIds.add(item.id);
          pois.push({
            id: item.id,
            name,
            category,
            lat: item.lat,
            lon: item.lon,
          });
        }

        if (name && tags.place && PLACE_KINDS.has(tags.place) && !seenPlaceIds.has(item.id)) {
          seenPlaceIds.add(item.id);
          places.push({
            id: item.id,
            name,
            kind: tags.place,
            lat: item.lat,
            lon: item.lon,
          });
        }
      }

      if (itemsSeen % 2_000_000 < items.length) {
        const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
        console.log(
          `[generate-osm-pois] ${itemsSeen.toLocaleString()} items scanned (${nodesSeen.toLocaleString()} nodes), ` +
          `${pois.length.toLocaleString()} POIs + ${places.length.toLocaleString()} places kept — ${mins} min elapsed`
        );
      }
    });
    osm.on("end", resolve);
    osm.on("error", reject);
    input.on("error", reject);
    input.pipe(osm);
  });

  // Post-process pass: drop generic/placeholder names OSM contributors used
  // literally (verified against real output: "the shopping mall", "Shopping
  // Complex"), and dedup same-name POIs within ~150m of each other — the
  // per-category streaming dedup above only covers Metro/Railway stations;
  // this generalizes it (e.g. a hospital or restaurant chain sometimes has
  // duplicate nodes from separate edits, verified via "Kulinary Kala"
  // appearing twice at the identical distance in a real lookup test).
  const DENYLIST_RE = /^(the )?shopping (mall|centre|centres|complex)$|^(mall|complex|shop|store)$/i;
  const cleaned = pois.filter((p) => !DENYLIST_RE.test(p.name.trim()));

  const DEDUP_KM = 0.15;
  const byCategoryForDedup = new Map();
  for (const p of cleaned) {
    if (!byCategoryForDedup.has(p.category)) byCategoryForDedup.set(p.category, []);
    byCategoryForDedup.get(p.category).push(p);
  }
  const finalPois = [];
  for (const [, group] of byCategoryForDedup) {
    const kept = [];
    for (const p of group) {
      const dupe = kept.find(
        (k) => k.name.trim().toLowerCase() === p.name.trim().toLowerCase() && haversineKm(k.lat, k.lon, p.lat, p.lon) <= DEDUP_KM
      );
      if (!dupe) kept.push(p);
    }
    finalPois.push(...kept);
  }

  const poisOut = path.join(OUT_DIR, "ncr-pois.json");
  const placesOut = path.join(OUT_DIR, "ncr-places.json");
  fs.writeFileSync(poisOut, JSON.stringify(finalPois));
  fs.writeFileSync(placesOut, JSON.stringify(places));

  const byCategory = {};
  for (const p of finalPois) byCategory[p.category] = (byCategory[p.category] || 0) + 1;

  const totalMins = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\nDone in ${totalMins} min. Scanned ${itemsSeen.toLocaleString()} items (${nodesSeen.toLocaleString()} nodes).`);
  console.log(`Wrote ${pois.length.toLocaleString()} POIs -> ${path.relative(process.cwd(), poisOut)}`);
  console.log(`Wrote ${places.length.toLocaleString()} places -> ${path.relative(process.cwd(), placesOut)}`);
  console.log("By category:", byCategory);
}

main().catch((err) => {
  console.error("[generate-osm-pois] failed:", err);
  process.exit(1);
});
