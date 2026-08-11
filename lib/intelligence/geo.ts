// Google Maps API helpers for the intelligence engine.
// All results are cached via Next.js unstable_cache (Vercel Data Cache, 30 days).
// Requires GOOGLE_MAPS_API_KEY with Geocoding, Places, and Distance Matrix APIs enabled.

import { unstable_cache } from "next/cache";

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const BASE = "https://maps.googleapis.com/maps/api";

export type Landmark = {
  name: string;
  distance_km: number;
  distance_text: string;
};

export type LandmarksMap = Record<string, Landmark[]>;

export type ConnectivityItem = {
  label: string;
  category: string;
  distance_km: number | null;
  travel_time: string | null;
};

const CITY_ANCHORS: Record<string, { airport: { label: string; lat: number; lng: number }; business: { label: string; lat: number; lng: number } }> = {
  ggn: {
    airport:  { label: "IGI Airport, Delhi",          lat: 28.5562, lng: 77.1000 },
    business: { label: "Cyber City, Gurgaon",          lat: 28.4949, lng: 77.0895 },
  },
  delhi: {
    airport:  { label: "IGI Airport, Delhi",          lat: 28.5562, lng: 77.1000 },
    business: { label: "Connaught Place, Delhi",       lat: 28.6315, lng: 77.2167 },
  },
  faridabad: {
    airport:  { label: "IGI Airport, Delhi",          lat: 28.5562, lng: 77.1000 },
    business: { label: "Faridabad City Centre",        lat: 28.4089, lng: 77.3178 },
  },
  gNoida: {
    airport:  { label: "Noida Int'l Airport (Jewar)", lat: 28.1717, lng: 77.5450 },
    business: { label: "Knowledge Park, Greater Noida",lat: 28.4612, lng: 77.4910 },
  },
  noida: {
    airport:  { label: "IGI Airport, Delhi",          lat: 28.5562, lng: 77.1000 },
    business: { label: "Sector 62 IT Hub, Noida",     lat: 28.6280, lng: 77.3649 },
  },
};

const LANDMARK_TYPES = [
  { category: "Schools",          type: "school"        },
  { category: "Hospitals",        type: "hospital"      },
  { category: "Shopping Centres", type: "shopping_mall" },
  { category: "Supermarkets",     type: "supermarket"   },
  { category: "Parks",            type: "park"          },
  { category: "Gyms",             type: "gym"           },
  { category: "Metro Stations",   type: "subway_station"},
  { category: "Hotels",           type: "lodging"       },
  { category: "Restaurants",      type: "restaurant"    },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

async function gFetch(url: string) {
  const res = await fetch(url, { next: { revalidate: 2592000 } }); // 30 days
  if (!res.ok) throw new Error(`Google API ${res.status}`);
  return res.json();
}

async function geocodeRaw(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string | null } | null> {
  if (!KEY) return null;
  const data = await gFetch(`${BASE}/geocode/json?address=${encodeURIComponent(address)}&region=in&key=${KEY}`);
  if (data.status !== "OK" || !data.results?.length) return null;
  const result = data.results[0];
  const loc = result.geometry.location;
  return {
    lat: loc.lat as number,
    lng: loc.lng as number,
    formattedAddress: (result.formatted_address as string) || null,
  };
}

async function nearbyRaw(lat: number, lng: number, type: string, limit = 6): Promise<any[]> {
  if (!KEY) return [];
  const data = await gFetch(`${BASE}/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${type}&key=${KEY}`);
  if (data.status !== "OK" || !data.results?.length) return [];
  return (data.results as any[]).slice(0, limit);
}

async function distanceRaw(oLat: number, oLng: number, dLat: number, dLng: number) {
  if (!KEY) return { distanceKm: null, travelTime: null };
  const data = await gFetch(`${BASE}/distancematrix/json?origins=${oLat},${oLng}&destinations=${dLat},${dLng}&mode=driving&key=${KEY}`);
  const el = data.rows?.[0]?.elements?.[0];
  if (!el || el.status !== "OK") return { distanceKm: null, travelTime: null };
  return {
    distanceKm: el.distance ? (el.distance.value / 1000) as number : null,
    travelTime: el.duration ? (el.duration.text as string) : null,
  };
}

// ── Public cached functions ──────────────────────────────────────────────────

// Bump this when geocodeRaw's return shape changes so previously-cached
// entries (missing new fields) don't linger for the rest of their 30-day
// window — same pattern as content.ts's CONTENT_CACHE_VERSION.
const GEOCODE_CACHE_VERSION = "v2";

export function geocodeProject(address: string) {
  return unstable_cache(
    () => geocodeRaw(address),
    ["geocode", GEOCODE_CACHE_VERSION, address.slice(0, 60)],
    { revalidate: 2592000 }
  )();
}

export function fetchNearbyLandmarks(lat: number, lng: number) {
  const latKey = lat.toFixed(3);
  const lngKey = lng.toFixed(3);
  return unstable_cache(
    async (): Promise<LandmarksMap> => {
      const result: LandmarksMap = {};
      const seen = new Set<string>();
      for (const { category, type } of LANDMARK_TYPES) {
        try {
          const places = await nearbyRaw(lat, lng, type, 10);
          if (!places.length) continue;
          // Google's nearbysearch `type` filter is a request hint, not a hard
          // guarantee — it can still return loosely-matched businesses whose
          // own `types` don't actually include what we asked for (e.g. a nail
          // studio surfacing under "school"). Enforce it ourselves, and dedupe
          // on name+distance since the same place can otherwise resurface
          // across categories or within one.
          const landmarks = places
            .filter((p) => Array.isArray(p.types) && p.types.includes(type))
            .map((p) => {
              const km = haversineKm(lat, lng, p.geometry.location.lat, p.geometry.location.lng);
              return {
                name: p.name as string,
                distance_km: Math.round(km * 100) / 100,
                distance_text: fmtDistance(km),
              };
            })
            .filter((l) => {
              const key = `${l.name}|${l.distance_km}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          if (landmarks.length) result[category] = landmarks;
        } catch {
          // Skip category if Places API fails — section still renders without it
        }
      }
      return result;
    },
    ["landmarks", "v2", latKey, lngKey],
    { revalidate: 2592000 }
  )();
}

export function buildConnectivity(cityKey: string, lat: number, lng: number) {
  const latKey = lat.toFixed(3);
  const lngKey = lng.toFixed(3);
  return unstable_cache(
    async (): Promise<ConnectivityItem[]> => {
      const anchors = CITY_ANCHORS[cityKey] || CITY_ANCHORS.ggn;
      const rows: ConnectivityItem[] = [];

      try {
        const dm = await distanceRaw(lat, lng, anchors.airport.lat, anchors.airport.lng);
        rows.push({ label: anchors.airport.label, category: "airport", distance_km: dm.distanceKm, travel_time: dm.travelTime });
      } catch (err) {
        console.error("[buildConnectivity] airport lookup failed", err);
      }

      try {
        const dm = await distanceRaw(lat, lng, anchors.business.lat, anchors.business.lng);
        rows.push({ label: anchors.business.label, category: "business", distance_km: dm.distanceKm, travel_time: dm.travelTime });
      } catch (err) {
        console.error("[buildConnectivity] business anchor lookup failed", err);
      }

      try {
        const metros = await nearbyRaw(lat, lng, "subway_station", 1);
        if (metros[0]) {
          const m = metros[0];
          const dm = await distanceRaw(lat, lng, m.geometry.location.lat, m.geometry.location.lng);
          rows.push({ label: `${m.name} (Metro)`, category: "metro", distance_km: dm.distanceKm, travel_time: dm.travelTime });
        }
      } catch (err) {
        console.error("[buildConnectivity] metro lookup failed", err);
      }

      try {
        const trains = await nearbyRaw(lat, lng, "train_station", 1);
        if (trains[0]) {
          const t = trains[0];
          const dm = await distanceRaw(lat, lng, t.geometry.location.lat, t.geometry.location.lng);
          rows.push({ label: `${t.name} (Railway)`, category: "railway", distance_km: dm.distanceKm, travel_time: dm.travelTime });
        }
      } catch (err) {
        console.error("[buildConnectivity] railway lookup failed", err);
      }

      return rows;
    },
    ["connectivity", cityKey, latKey, lngKey],
    { revalidate: 2592000 }
  )();
}
