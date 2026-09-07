// Free replacement for the old geo.ts's geocodeProject() (Google Geocoding
// API). Resolves a project's coordinate by matching its sector/micro-market
// text against data/osm/ncr-places.json — named locality nodes extracted
// once from an OSM PBF (see scripts/generate-osm-pois.mjs) — instead of
// calling any paid geocoding API.
//
// Precision ceiling, by design: this is a sector/locality centroid, not a
// building location. Verified against the live homz-scrape feed that none
// of these individual residential projects exist in OSM by name, so a
// sector centroid is the best available free signal — not a shortcut taken
// over a more precise option. Two projects in the same sector resolve to
// the identical coordinate.

// Static import, not fs.readFileSync(process.cwd() + ...): Next.js's
// serverless file-tracer (what decides which files ship with a deployed
// Vercel function) reliably picks up a static import but can miss a
// dynamically-constructed fs path, which would 500 every project page in
// production with an ENOENT. A bad/missing file here now fails the build
// instead, which is the safe direction to fail in.
import placesData from "@/data/osm/ncr-places.json";

type PlaceNode = { id: number; name: string; kind: string; lat: number; lon: number };

const places = placesData as PlaceNode[];

// Rough per-city boxes — only needed to disambiguate a locality name (e.g.
// "Sector 65") that exists in more than one NCR city. Same city-key set as
// CITY_ANCHORS below and the site's own CITY_PARAM_MAP.
const CITY_BBOX: Record<string, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  ggn: { minLat: 28.35, maxLat: 28.55, minLon: 76.90, maxLon: 77.15 },
  delhi: { minLat: 28.40, maxLat: 28.90, minLon: 76.85, maxLon: 77.35 },
  faridabad: { minLat: 28.25, maxLat: 28.45, minLon: 77.25, maxLon: 77.45 },
  gNoida: { minLat: 28.40, maxLat: 28.55, minLon: 77.45, maxLon: 77.65 },
  noida: { minLat: 28.50, maxLat: 28.65, minLon: 77.30, maxLon: 77.45 },
};

// Airport + business-hub anchors, carried over verbatim from the old geo.ts
// (CITY_ANCHORS) — these are fixed, well-known points, not geocoded, so
// they never depended on Google in the first place. Also doubles as the
// last-resort coordinate fallback (`business`) when no sector/micro-market
// match is found at all.
export const CITY_ANCHORS: Record<
  string,
  { airport: { label: string; lat: number; lng: number }; business: { label: string; lat: number; lng: number } }
> = {
  ggn: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1000 },
    business: { label: "Cyber City, Gurgaon", lat: 28.4949, lng: 77.0895 },
  },
  delhi: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1000 },
    business: { label: "Connaught Place, Delhi", lat: 28.6315, lng: 77.2167 },
  },
  faridabad: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1000 },
    business: { label: "Faridabad City Centre", lat: 28.4089, lng: 77.3178 },
  },
  gNoida: {
    airport: { label: "Noida Int'l Airport (Jewar)", lat: 28.1717, lng: 77.5450 },
    business: { label: "Knowledge Park, Greater Noida", lat: 28.4612, lng: 77.4910 },
  },
  noida: {
    airport: { label: "IGI Airport, Delhi", lat: 28.5562, lng: 77.1000 },
    business: { label: "Sector 62 IT Hub, Noida", lat: 28.6280, lng: 77.3649 },
  },
};

export type ResolvedCoordinate = {
  lat: number;
  lng: number;
  /** How precise this coordinate is — surface this in the UI if you ever
   *  want to caveat "approximate location" for the cityAnchor fallback. */
  precision: "sector" | "microMarket" | "cityAnchor";
  matchedName: string;
};

function exactPlace(norm: string, cityKey: string): PlaceNode | null {
  const box = CITY_BBOX[cityKey] || CITY_BBOX.ggn;
  return (
    places.find(
      (p) =>
        p.name.trim().toLowerCase() === norm &&
        p.lat >= box.minLat && p.lat <= box.maxLat &&
        p.lon >= box.minLon && p.lon <= box.maxLon
    ) || null
  );
}

// Verified against the live feed: OSM tags NCR sectors like "Sector 95" but
// routinely lacks the lettered sub-sector variant ("Sector 95A") as its own
// place node, even though the sub-sector is a small subdivision of the same
// parent sector. Falling back to the parent sector's centroid is a much
// closer approximation than the city-wide anchor two steps down the chain
// (measured: 58/60 lettered-sector mismatches in live Gurgaon data resolve
// correctly via this fallback).
function stripSubSectorLetter(name: string): string | null {
  const m = name.trim().match(/^(sector\s*\d+)[a-z]$/i);
  return m ? m[1] : null;
}

function findPlace(name: string | null | undefined, cityKey: string): PlaceNode | null {
  if (!name) return null;
  const norm = name.trim().toLowerCase();
  if (!norm) return null;

  const exact = exactPlace(norm, cityKey);
  if (exact) return exact;

  const base = stripSubSectorLetter(norm);
  if (base) return exactPlace(base, cityKey);

  return null;
}

/**
 * Resolves a project's approximate coordinate for free, from text already
 * on the project record — no network call, no database write.
 * Fallback chain: sector -> micro_market -> city business anchor.
 */
export function resolveCoordinate(
  cityKey: string,
  sector?: string | null,
  microMarket?: string | null
): ResolvedCoordinate {
  const bySector = findPlace(sector, cityKey);
  if (bySector) {
    return { lat: bySector.lat, lng: bySector.lon, precision: "sector", matchedName: bySector.name };
  }

  const byMicroMarket = findPlace(microMarket, cityKey);
  if (byMicroMarket) {
    return { lat: byMicroMarket.lat, lng: byMicroMarket.lon, precision: "microMarket", matchedName: byMicroMarket.name };
  }

  const anchor = (CITY_ANCHORS[cityKey] || CITY_ANCHORS.ggn).business;
  return { lat: anchor.lat, lng: anchor.lng, precision: "cityAnchor", matchedName: anchor.label };
}
