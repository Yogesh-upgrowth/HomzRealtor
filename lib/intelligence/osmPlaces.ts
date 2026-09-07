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

const pois = poisData as Poi[];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export function nearbyLandmarks(lat: number, lng: number): LandmarksMap {
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

export function nearbyConnectivity(cityKey: string, lat: number, lng: number): ConnectivityItem[] {
  const anchors = CITY_ANCHORS[cityKey] || CITY_ANCHORS.ggn;
  const rows: ConnectivityItem[] = [];

  rows.push({
    label: anchors.airport.label,
    category: "airport",
    distance_km: Math.round(haversineKm(lat, lng, anchors.airport.lat, anchors.airport.lng) * 10) / 10,
    travel_time: null,
  });

  rows.push({
    label: anchors.business.label,
    category: "business",
    distance_km: Math.round(haversineKm(lat, lng, anchors.business.lat, anchors.business.lng) * 10) / 10,
    travel_time: null,
  });

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
