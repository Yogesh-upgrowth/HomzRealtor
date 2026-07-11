// Project fetching and similarity helpers — no database required.
// Fetches from homzbackend API with Next.js fetch caching (1 hour).

import { unstable_cache } from "next/cache";
import { normalizeProject, slugify, type NormalizedProject } from "./normalize";

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
