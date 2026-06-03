// Google Maps Platform helpers — used ONLY by the ingestion pipeline.
// Requires GOOGLE_MAPS_API_KEY with Geocoding, Places, and Distance Matrix APIs enabled.

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const BASE = "https://maps.googleapis.com/maps/api";

// Per-city connectivity anchors (lat,lng + label).
export const CITY_ANCHORS = {
  ggn: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1 },
    business: { label: "Cyber City, Gurgaon", lat: 28.4949, lng: 77.0895 },
  },
  delhi: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1 },
    business: { label: "Connaught Place, Delhi", lat: 28.6315, lng: 77.2167 },
  },
  faridabad: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1 },
    business: { label: "Faridabad City Centre", lat: 28.4089, lng: 77.3178 },
  },
  gNoida: {
    airport: {
      label: "Noida Int'l Airport (Jewar)",
      lat: 28.1717,
      lng: 77.545,
    },
    business: { label: "Knowledge Park, Greater Noida", lat: 28.4612, lng: 77.491 },
  },
  noida: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1 },
    business: { label: "Sector 62 IT Hub, Noida", lat: 28.628, lng: 77.3649 },
  },
};

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function geocode(address) {
  const url = `${BASE}/geocode/json?address=${encodeURIComponent(
    address,
  )}&region=in&key=${KEY}`;
  const data = await getJson(url);
  if (data.status !== "OK" || !data.results?.length) {
    return { lat: null, lng: null, formatted: null, status: data.status };
  }
  const r = data.results[0];
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    formatted: r.formatted_address || null,
    status: "OK",
  };
}

export async function nearestPlace(lat, lng, type) {
  const url = `${BASE}/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${type}&key=${KEY}`;
  const data = await getJson(url);
  if (data.status !== "OK" || !data.results?.length) return null;
  const p = data.results[0];
  return {
    name: p.name,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
  };
}

export async function distanceMatrix(origin, destLat, destLng) {
  const url = `${BASE}/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destLat},${destLng}&mode=driving&key=${KEY}`;
  const data = await getJson(url);
  const el = data.rows?.[0]?.elements?.[0];
  if (!el || el.status !== "OK") return { distanceKm: null, travelTime: null };
  return {
    distanceKm: el.distance ? el.distance.value / 1000 : null,
    travelTime: el.duration ? el.duration.text : null,
  };
}

// Build connectivity rows for a geocoded project.
export async function buildConnectivity(cityKey, lat, lng) {
  const origin = { lat, lng };
  const anchors = CITY_ANCHORS[cityKey] || CITY_ANCHORS.ggn;
  const rows = [];

  // Airport (fixed anchor)
  try {
    const dm = await distanceMatrix(origin, anchors.airport.lat, anchors.airport.lng);
    rows.push({
      label: anchors.airport.label,
      category: "airport",
      distance_km: dm.distanceKm,
      travel_time: dm.travelTime,
      sort_order: 0,
    });
  } catch {}

  // Business hub (fixed anchor)
  try {
    const dm = await distanceMatrix(origin, anchors.business.lat, anchors.business.lng);
    rows.push({
      label: anchors.business.label,
      category: "business",
      distance_km: dm.distanceKm,
      travel_time: dm.travelTime,
      sort_order: 1,
    });
  } catch {}

  // Nearest metro station (dynamic)
  try {
    const metro = await nearestPlace(lat, lng, "subway_station");
    if (metro) {
      const dm = await distanceMatrix(origin, metro.lat, metro.lng);
      rows.push({
        label: `${metro.name} (Metro)`,
        category: "metro",
        distance_km: dm.distanceKm,
        travel_time: dm.travelTime,
        sort_order: 2,
      });
    }
  } catch {}

  // Nearest railway station (dynamic)
  try {
    const rail = await nearestPlace(lat, lng, "train_station");
    if (rail) {
      const dm = await distanceMatrix(origin, rail.lat, rail.lng);
      rows.push({
        label: `${rail.name} (Railway)`,
        category: "highway",
        distance_km: dm.distanceKm,
        travel_time: dm.travelTime,
        sort_order: 3,
      });
    }
  } catch {}

  return rows;
}
