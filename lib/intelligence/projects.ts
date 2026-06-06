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
