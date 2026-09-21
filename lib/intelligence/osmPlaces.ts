// Free replacement for the old geo.ts's fetchNearbyLandmarks() (Google
// Places Nearby Search) and buildConnectivity() (Google Distance Matrix).
// Reads data/osm/ncr-pois.json (extracted once via
// scripts/generate-osm-pois.mjs, ~4,300 records) into memory on first use
// and does a plain distance scan — no index needed at this size, no
// network call, no database.
//
// Trade-off, by design: OSM gives straight-line distance, not a real
// driving time. travel_time is left null rather than faking an ETA from an
// assumed speed — ConnectivityScorecard already renders distance_km on its
// own and only shows travel_time when present, so this degrades cleanly.

// Static import, not fs.readFileSync(process.cwd() + ...) — see the same
// note in resolveLocation.ts: this is what Next.js's Vercel file-tracer
// reliably bundles, so a bad/missing file fails the build instead of
// 500-ing every project page in production.
import poisData from "@/data/osm/ncr-pois.json";
import { CITY_ANCHORS } from "./resolveLocation";

export type Landmark = { name: string; distance_km: number; distance_text: string };
export type LandmarksMap = Record<string, Landmark[]>;
export type ConnectivityItem = {
  label: string;
  category: string;
  distance_km: number | null;
  travel_time: string | null;
};

type Poi = { id: number; name: string; category: string; lat: number; lon: number };

// R19-04 (2026-09-19): the audit found a Kotak bank listed under Parks and
// The Body Shop under Supermarkets. classify() in scripts/generate-osm-pois.mjs
// trusts the upstream OSM tag outright (first rule wins, no sanity check), so
// a mistagged node propagates straight onto a project page as a local amenity.
//
// Scoped deliberately narrow. A scan of the committed 4,332-POI set found
// exactly these two contradictions, so this is a data-quality guard, not a
// taxonomy rewrite: broad "name looks like X" heuristics produce false
// positives on legitimate records (e.g. "School of Open Learning Canteen" is
// correctly a Restaurant). Only the two confirmed classes are excluded, and
// only for the categories where they are genuinely impossible.
const IMPLAUSIBLE_BY_CATEGORY: Record<string, RegExp> = {
  // A bank branch or ATM is never a park or a grocery store.
  Parks: /\b(bank|atm)\b/i,
  Supermarkets: /\b(bank|atm|body\s*shop|salon|spa|cosmetics?|pharmacy|chemist|optic(?:al|ians?)?)\b/i,
  // 21 Sep audit: the Schools list on a project page contained "fitness
  // centres, sports facilities and tennis clubs". Confirmed in the committed
  // dataset -- "xtreme tennis academy", "HIRA YOGA TRAINING KENDER" and
  // "Delhi University Sports Council" all arrive tagged amenity=school
  // upstream in OSM, so the generator's taxonomy (which is correct: Schools
  // takes only school/college/university) cannot filter them. Only a name
  // check can.
  //
  // Written as a facility word PAIRED with a facility-type word rather than a
  // list of banned words, because the single words are all legitimate in real
  // school names -- a great many Indian schools are "<Something> Academy",
  // plenty teach music, art and dance, and "sports" appears in school names
  // too. The pairing is what separates "xtreme tennis academy" from "Ryan
  // International Academy".
  //
  // Validated against the real data before shipping: it removes exactly those
  // three of 338 Schools entries, and catches none of a control set of 20
  // real Gurgaon/Delhi school names. Re-check both if the pattern changes.
  Schools:
    /\b(tennis|badminton|squash|cricket|football|basketball|swimming|skating|martial\s*arts|karate|taekwondo|yoga|zumba|aerobics|gymnasium|fitness|dance|music|art)\b[\s\w.-]{0,20}\b(academy|centre|center|club|court|complex|studio|training|kender|kendra|classes|council)\b|\b(academy|centre|center|club|studio|training)\b[\s\w.-]{0,20}\b(tennis|badminton|squash|cricket|swimming|yoga|fitness|dance)\b|\bsports?\s*(council|authority|complex|club|centre|center|academy)\b/i,
};

export function isImplausibleForCategory(name: string, category: string): boolean {
  const rule = IMPLAUSIBLE_BY_CATEGORY[category];
  return rule ? rule.test(String(name ?? "")) : false;
}

// OSM multi-value fields arrive semicolon-separated ("Kotak Mahindra Bank;india").
// Keep the first value; the rest is never part of the display name.
function cleanPoiName(name: string): string {
  return String(name ?? "").split(";")[0].trim();
}

const pois = (poisData as Poi[])
  .filter((p) => !isImplausibleForCategory(p.name, p.category))
  .map((p) => ({ ...p, name: cleanPoiName(p.name) }))
  .filter((p) => p.name.length > 0);

// Exported for lib/intelligence/listingContext.ts, which measures each listing
// against the Gurgaon commute anchors using the same formula.
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Search radius per category — generous enough to usually find something,
// tight enough that "nearby" stays meaningfully nearby.
const RADIUS_KM: Record<string, number> = {
  Schools: 3,
  Hospitals: 3,
  "Shopping Centres": 5,
  Supermarkets: 2,
  Parks: 3,
  Gyms: 2,
  Hotels: 3,
  Restaurants: 2,
  "Metro Stations": 5,
  "Railway Stations": 8,
};
const TOP_N = 10;

// The general "what's nearby" table — matches the categories the UI already
// renders via LandmarksTable. Metro/Railway are surfaced separately through
// nearbyConnectivity(), same split the Google-backed version used.
const LANDMARK_CATEGORIES = [
  "Schools", "Hospitals", "Shopping Centres", "Supermarkets",
  "Parks", "Gyms", "Hotels", "Restaurants",
];

// R19-04 (2026-09-19): resolveCoordinate() falls back to the city anchor when
// a project's sector and micro-market both fail to resolve. For Gurgaon that
// anchor IS Cyber City, so every distance below was then being measured from
// the city centre and presented as the project's own — which is how a Sector
// 79 project came to advertise "Cyber City 0.0 km" and "airport 6.9 km"
// (6.9 km is exactly IGI-to-Cyber-City). The precision flag existed on
// resolveCoordinate's return all along but nothing read it. Both public
// helpers now require it and return nothing at cityAnchor precision: no
// distance table at all is honest, a city-centre one labelled as the
// project's is not. This also keeps the wrong figures out of the AI prose in
// generateProjectContent(), which takes these as input.
export function nearbyLandmarks(
  lat: number,
  lng: number,
  precision: "sector" | "microMarket" | "cityAnchor"
): LandmarksMap {
  if (precision === "cityAnchor") return {};
  const result: LandmarksMap = {};
  for (const category of LANDMARK_CATEGORIES) {
    const radius = RADIUS_KM[category];
    const matches = pois
      .filter((p) => p.category === category)
      .map((p) => ({ ...p, km: haversineKm(lat, lng, p.lat, p.lon) }))
      .filter((p) => p.km <= radius)
      .sort((a, b) => a.km - b.km)
      .slice(0, TOP_N);
    if (matches.length) {
      result[category] = matches.map((m) => ({
        name: m.name,
        distance_km: Math.round(m.km * 100) / 100,
        distance_text: fmtDistance(m.km),
      }));
    }
  }
  return result;
}

function nearestOfCategory(pois: Poi[], category: string, lat: number, lng: number, radius: number) {
  let best: (Poi & { km: number }) | null = null;
  for (const p of pois) {
    if (p.category !== category) continue;
    const km = haversineKm(lat, lng, p.lat, p.lon);
    if (km > radius) continue;
    if (!best || km < best.km) best = { ...p, km };
  }
  return best;
}

export function nearbyConnectivity(
  cityKey: string,
  lat: number,
  lng: number,
  precision: "sector" | "microMarket" | "cityAnchor"
): ConnectivityItem[] {
  // See nearbyLandmarks() above — at cityAnchor precision every row here
  // describes the city centre, not this project.
  if (precision === "cityAnchor") return [];

  const anchors = CITY_ANCHORS[cityKey] || CITY_ANCHORS.ggn;
  const rows: ConnectivityItem[] = [];

  // A row that rounds to 0.0 km carries no information and reads as a data
  // error even when the coordinate is genuinely correct (a project actually
  // sitting on the anchor), so drop it rather than print "0 km away".
  const pushAnchorRow = (
    anchor: { label: string; lat: number; lng: number },
    category: ConnectivityItem["category"]
  ) => {
    const distance_km = Math.round(haversineKm(lat, lng, anchor.lat, anchor.lng) * 10) / 10;
    if (distance_km <= 0) return;
    rows.push({ label: anchor.label, category, distance_km, travel_time: null });
  };

  pushAnchorRow(anchors.airport, "airport");
  pushAnchorRow(anchors.business, "business");

  const metro = nearestOfCategory(pois, "Metro Stations", lat, lng, RADIUS_KM["Metro Stations"]);
  if (metro) {
    rows.push({ label: `${metro.name} (Metro)`, category: "metro", distance_km: Math.round(metro.km * 10) / 10, travel_time: null });
  }

  const railway = nearestOfCategory(pois, "Railway Stations", lat, lng, RADIUS_KM["Railway Stations"]);
  if (railway) {
    rows.push({ label: `${railway.name} (Railway)`, category: "railway", distance_km: Math.round(railway.km * 10) / 10, travel_time: null });
  }

  return rows;
}
