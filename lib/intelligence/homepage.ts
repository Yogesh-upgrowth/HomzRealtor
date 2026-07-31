// Homepage-only read-model helpers. Kept separate from projects.ts (core data
// layer) and view-model.ts (per-project-page read-model) — this file only
// composes them for homepage sections, no new data sources.

import { getProjectsForCity, canonicalCitySlug, CITY_DISPLAY } from "./projects";
import { resolveProjectView } from "./view-model";

export type NewLaunchProject = {
  name: string;
  slug: string;
  citySlug: string;
  cityName: string;
  image: string | null;
  priceText: string;
  locationLine: string;
};

// Real "New Launch" projects — status is derived from real feed data via
// resolveProjectView()'s deriveStatus(), nothing fabricated. Defaults to
// Gurgaon (this site's primary market); backfills from other cities if
// Gurgaon alone doesn't have enough so the section is never thin/empty.
export async function getNewLaunchProjects(
  cityKey = "ggn",
  limit = 6
): Promise<NewLaunchProject[]> {
  const collect = async (key: string): Promise<NewLaunchProject[]> => {
    const projects = await getProjectsForCity(key).catch(() => []);
    const citySlug = canonicalCitySlug(key);
    return projects
      .map((p) => resolveProjectView(p, { cityParam: citySlug }))
      .filter((view) => view.status === "New Launch" && view.heroImage)
      .map((view) => ({
        name: view.name,
        slug: view.slug,
        citySlug: view.citySlug,
        cityName: view.cityName,
        image: view.heroImage,
        priceText: view.priceText,
        locationLine: view.locationLine,
      }));
  };

  const results = await collect(cityKey);

  if (results.length < limit) {
    const otherKeys = Object.keys(CITY_DISPLAY).filter((k) => k !== cityKey);
    const seen = new Set(results.map((r) => `${r.citySlug}-${r.slug}`));
    for (const key of otherKeys) {
      if (results.length >= limit) break;
      const more = await collect(key);
      for (const item of more) {
        if (results.length >= limit) break;
        const dedupeKey = `${item.citySlug}-${item.slug}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        results.push(item);
      }
    }
  }

  return results.slice(0, limit);
}

// Real "Featured Projects" (any status/category, cross-city backfill) — same
// resilience pattern as getNewLaunchProjects, so a Gurgaon-only fetch hiccup
// never leaves this section empty.
export async function getFeaturedProjects(
  cityKey = "ggn",
  limit = 4
): Promise<NewLaunchProject[]> {
  const collect = async (key: string): Promise<NewLaunchProject[]> => {
    const projects = await getProjectsForCity(key).catch(() => []);
    const citySlug = canonicalCitySlug(key);
    return projects
      .map((p) => resolveProjectView(p, { cityParam: citySlug }))
      .filter((view) => view.heroImage)
      .map((view) => ({
        name: view.name,
        slug: view.slug,
        citySlug: view.citySlug,
        cityName: view.cityName,
        image: view.heroImage,
        priceText: view.priceText,
        locationLine: view.locationLine,
      }));
  };

  const results = await collect(cityKey);

  if (results.length < limit) {
    const otherKeys = Object.keys(CITY_DISPLAY).filter((k) => k !== cityKey);
    const seen = new Set(results.map((r) => `${r.citySlug}-${r.slug}`));
    for (const key of otherKeys) {
      if (results.length >= limit) break;
      const more = await collect(key);
      for (const item of more) {
        if (results.length >= limit) break;
        const dedupeKey = `${item.citySlug}-${item.slug}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        results.push(item);
      }
    }
  }

  return results.slice(0, limit);
}
