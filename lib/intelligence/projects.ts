// Project fetching and similarity helpers — no database required.
// Fetches from homzbackend API with Next.js fetch caching (1 hour).

import { unstable_cache } from "next/cache";
import { normalizeProject, slugify, type NormalizedProject } from "./normalize";
import { normalizeAmenities } from "./view-model";

const ALL_CITY_KEYS = ["ggn", "delhi", "faridabad", "gNoida", "noida"];

export const CITY_PARAM_MAP: Record<string, string> = {
  ggn: "ggn",
  gurgaon: "ggn",
  delhi: "delhi",
  faridabad: "faridabad",
  greaternoida: "gNoida",
  gnoida: "gNoida",
  noida: "noida",
};

// The one true URL segment for each city, used for canonical tags, sitemap
// entries and structured data. Any incoming variant (ggn, gNoida, gnoida…)
// resolves back to these so a project has a single canonical URL — never
// /ggn/x AND /gurgaon/x competing as duplicates.
export const CANONICAL_CITY_SLUG: Record<string, string> = {
  ggn: "gurgaon",
  delhi: "delhi",
  faridabad: "faridabad",
  gNoida: "greaternoida",
  noida: "noida",
};

export function canonicalCitySlug(cityKey: string): string {
  return CANONICAL_CITY_SLUG[cityKey] || cityKey;
}

export const CITY_DISPLAY: Record<string, { name: string; state: string }> = {
  ggn: { name: "Gurgaon", state: "Haryana" },
  delhi: { name: "Delhi", state: "Delhi" },
  faridabad: { name: "Faridabad", state: "Haryana" },
  gNoida: { name: "Greater Noida", state: "Uttar Pradesh" },
  noida: { name: "Noida", state: "Uttar Pradesh" },
};

async function fetchCityRaw(cityKey: string): Promise<NormalizedProject[]> {
  const [commercial, residential] = await Promise.all([
    fetch(
      `https://homzbackend.vercel.app/api/data?city=${cityKey}CommercialProjects&page=1&limit=500`,
      { next: { revalidate: 3600 } }
    )
      .then((r) => r.json())
      .then((d) => (Array.isArray(d?.results) ? d.results : []))
      .catch(() => []),
    fetch(
      `https://homzbackend.vercel.app/api/data?city=${cityKey}ResidentialProjects&page=1&limit=500`,
      { next: { revalidate: 3600 } }
    )
      .then((r) => r.json())
      .then((d) => (Array.isArray(d?.results) ? d.results : []))
      .catch(() => []),
  ]);
  return [
    ...commercial.map((r: any) => normalizeProject(r, cityKey, "Commercial")),
    ...residential.map((r: any) => normalizeProject(r, cityKey, "Residential")),
  ];
}

export const getProjectsForCity = unstable_cache(
  fetchCityRaw,
  ["city-projects"],
  { revalidate: 3600 }
);

export async function getProjectBySlug(
  cityParam: string,
  slug: string
): Promise<NormalizedProject | null> {
  const cityKey = CITY_PARAM_MAP[cityParam.toLowerCase()] || cityParam;
  const projects = await getProjectsForCity(cityKey);
  return projects.find((p) => p.slug === slug) ?? null;
}

// ── Sector browsing ──────────────────────────────────────────────────────────
// The backend has no structured "sector" field; it is derived by regex in
// normalize.ts (extractSector). These helpers group the already-normalized,
// already-cached projects by that derived sector so we can render
// /project-listing/[city]/sectors and /sectors/[sector] with zero extra fetches.

export type SectorSummary = {
  sector: string; // display label, e.g. "Sector 63A"
  slug: string; // URL segment, e.g. "sector-63a"
  count: number;
  withImages: number;
  residential: number;
  commercial: number;
};

// Natural-sort weight: "Sector 63A" -> 63 so sectors list 9, 63, 63A, 104…
function sectorSortKey(sector: string): number {
  const m = sector.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 9999;
}

// "sector-63a" -> "Sector 63A" (fallback label when a sector has no projects).
export function sectorLabelFromSlug(slug: string): string {
  const m = slug.match(/^sector-(.+)$/i);
  if (m) return `Sector ${m[1].toUpperCase()}`;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getSectorsForCity(cityKey: string): Promise<SectorSummary[]> {
  const projects = await getProjectsForCity(cityKey);
  const map = new Map<string, SectorSummary>();

  for (const p of projects) {
    if (!p.sector) continue;
    const slug = slugify(p.sector);
    let entry = map.get(slug);
    if (!entry) {
      entry = {
        sector: p.sector,
        slug,
        count: 0,
        withImages: 0,
        residential: 0,
        commercial: 0,
      };
      map.set(slug, entry);
    }
    entry.count += 1;
    if (p.images.length > 0) entry.withImages += 1;
    if (p.property_category === "Commercial") entry.commercial += 1;
    else entry.residential += 1;
  }

  return Array.from(map.values()).sort(
    (a, b) => sectorSortKey(a.sector) - sectorSortKey(b.sector)
  );
}

export async function getProjectsForSector(
  cityParam: string,
  sectorSlug: string
): Promise<NormalizedProject[]> {
  const cityKey = CITY_PARAM_MAP[cityParam.toLowerCase()] || cityParam;
  const projects = await getProjectsForCity(cityKey);
  const target = sectorSlug.toLowerCase();
  return projects.filter((p) => p.sector && slugify(p.sector) === target);
}

export async function getSimilarProjects(
  current: NormalizedProject,
  limit = 6
): Promise<NormalizedProject[]> {
  const projects = await getProjectsForCity(current.city_key);
  return projects
    .filter(
      (p) =>
        p.slug !== current.slug &&
        p.property_category === current.property_category &&
        p.images.length > 0
    )
    .slice(0, limit);
}

export async function getSectorProjects(
  current: NormalizedProject,
  limit = 6
): Promise<NormalizedProject[]> {
  if (!current.sector) return [];
  const projects = await getProjectsForCity(current.city_key);
  return projects
    .filter(
      (p) =>
        p.slug !== current.slug &&
        p.sector === current.sector &&
        p.images.length > 0
    )
    .slice(0, limit);
}

export async function getBuilderProjects(
  current: NormalizedProject,
  limit = 6
): Promise<NormalizedProject[]> {
  // Search across all cities to find other projects by the same builder
  const allCities = await Promise.all(ALL_CITY_KEYS.map(getProjectsForCity));
  return allCities
    .flat()
    .filter(
      (p) =>
        p.builder === current.builder &&
        p.slug !== current.slug &&
        p.images.length > 0
    )
    .slice(0, limit);
}

// Price intelligence helpers

export type PriceInsightsData = {
  project_price_text: string | null;
  project_min_inr: number | null;
  city_avg_inr: number | null;
  micro_market_avg_inr: number | null;
  city_name: string;
  micro_market: string | null;
};

export async function getPriceInsights(current: NormalizedProject): Promise<PriceInsightsData> {
  const projects = await getProjectsForCity(current.city_key);
  const priced = projects.filter((p) => p.min_price_inr != null && p.min_price_inr > 0);

  const cityAvg =
    priced.length > 0
      ? Math.round(priced.reduce((s, p) => s + p.min_price_inr!, 0) / priced.length)
      : null;

  const mmProjects = priced.filter(
    (p) => current.micro_market && p.micro_market === current.micro_market
  );
  const mmAvg =
    mmProjects.length > 0
      ? Math.round(mmProjects.reduce((s, p) => s + p.min_price_inr!, 0) / mmProjects.length)
      : null;

  return {
    project_price_text: current.price_text,
    project_min_inr: current.min_price_inr,
    city_avg_inr: cityAvg,
    micro_market_avg_inr: mmAvg,
    city_name: current.city_name,
    micro_market: current.micro_market,
  };
}

// Sector-average aggregation — deliberately queries the unfiltered project
// list (not getSectorProjects, which drops image-less projects for display
// cards) since an honest average must include every peer, not just the
// photogenic ones. Returns null when there are too few peers for "average"
// to mean anything rather than one arbitrary comparison.
export type SectorAverages = {
  sector: string;
  sampleSize: number;
  avg_min_price_inr: number | null;
  avg_unit_options: number | null;
  avg_amenity_count: number | null;
};

const MIN_SECTOR_SAMPLE = 2;

export async function getSectorAverages(current: NormalizedProject): Promise<SectorAverages | null> {
  if (!current.sector) return null;

  const projects = await getProjectsForCity(current.city_key);
  const peers = projects.filter((p) => p.sector === current.sector && p.slug !== current.slug);
  if (peers.length < MIN_SECTOR_SAMPLE) return null;

  const priced = peers.filter((p) => p.min_price_inr != null && p.min_price_inr > 0);
  const avg_min_price_inr =
    priced.length > 0
      ? Math.round(priced.reduce((s, p) => s + p.min_price_inr!, 0) / priced.length)
      : null;

  const avg_unit_options = Math.round(
    peers.reduce((s, p) => s + (Array.isArray(p.price_list) ? p.price_list.length : 0), 0) / peers.length
  );

  const avg_amenity_count = Math.round(
    peers.reduce((s, p) => {
      const amenities = normalizeAmenities(p.amenities);
      return s + amenities.reduce((n, c) => n + c.amenities.length, 0);
    }, 0) / peers.length
  );

  return {
    sector: current.sector,
    sampleSize: peers.length,
    avg_min_price_inr,
    avg_unit_options: avg_unit_options || null,
    avg_amenity_count: avg_amenity_count || null,
  };
}

// ── Developer browsing ───────────────────────────────────────────────────────
// The backend has no structured "developer" entity; `builder` is derived by
// matching the project title against KNOWN_BUILDERS (normalize.ts). These helpers
// group the already-normalized, already-cached projects (across all cities) by
// that derived builder so we can render /developer and /developer/[slug] with no
// extra fetches — the underlying getProjectsForCity calls are unstable_cache'd.

export type DeveloperSummary = {
  name: string; // display label, e.g. "DLF"
  slug: string; // URL segment, e.g. "dlf"
  count: number;
  withImages: number;
  residential: number;
  commercial: number;
  cities: { slug: string; name: string }[]; // canonical city slug + display name
};

async function buildDeveloperIndex(): Promise<
  Map<string, { summary: DeveloperSummary; projects: NormalizedProject[] }>
> {
  const allCities = await Promise.all(ALL_CITY_KEYS.map(getProjectsForCity));
  const map = new Map<
    string,
    { summary: DeveloperSummary; projects: NormalizedProject[] }
  >();

  for (const projects of allCities) {
    for (const p of projects) {
      const builder = p.builder;
      if (!builder || builder === "Unknown") continue;
      // Skip junk names the first-word builder heuristic can produce (e.g. a
      // title starting with a lone "A ..."). Avoids thin, low-quality developer
      // pages/sitemap entries. Fuller eligibility gating is a later slice.
      if (builder.trim().length < 3) continue;
      const slug = slugify(builder);
      if (!slug || slug.length < 3) continue;

      let entry = map.get(slug);
      if (!entry) {
        entry = {
          summary: {
            name: builder,
            slug,
            count: 0,
            withImages: 0,
            residential: 0,
            commercial: 0,
            cities: [],
          },
          projects: [],
        };
        map.set(slug, entry);
      }

      entry.projects.push(p);
      entry.summary.count += 1;
      if (p.images.length > 0) entry.summary.withImages += 1;
      if (p.property_category === "Commercial") entry.summary.commercial += 1;
      else entry.summary.residential += 1;

      const citySlug = canonicalCitySlug(p.city_key);
      if (!entry.summary.cities.some((c) => c.slug === citySlug)) {
        const disp = CITY_DISPLAY[p.city_key];
        entry.summary.cities.push({
          slug: citySlug,
          name: disp ? disp.name : p.city_name,
        });
      }
    }
  }

  return map;
}

export async function getAllBuilders(): Promise<DeveloperSummary[]> {
  const map = await buildDeveloperIndex();
  return Array.from(map.values())
    .map((e) => e.summary)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getBuilderBySlug(
  slug: string
): Promise<{ summary: DeveloperSummary; projects: NormalizedProject[] } | null> {
  const map = await buildDeveloperIndex();
  const entry = map.get(slug.toLowerCase());
  if (!entry) return null;
  // Projects with images first, then alphabetical — best cards lead the grid.
  const projects = [...entry.projects].sort((a, b) => {
    const ai = a.images.length > 0 ? 0 : 1;
    const bi = b.images.length > 0 ? 0 : 1;
    return ai - bi || a.project_name.localeCompare(b.project_name);
  });
  return { summary: entry.summary, projects };
}
