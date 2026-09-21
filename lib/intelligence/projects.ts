// Project fetching and similarity helpers — no database required.
// Fetches from homzbackend API with Next.js fetch caching (1 hour).

import { normalizeProject, slugify, type NormalizedProject } from "./normalize";
import { collapseDuplicateProjects, type CollapseResult } from "./projectDedupe";
import { isExcludedProject } from "./excludedProjects";
import { normalizeAmenities } from "./view-model";
import { fetchProjects, categorySegment } from "@/lib/scraping/homzbackend";

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

async function fetchCityRaw(cityKey: string): Promise<CityData> {
  const [commercial, residential] = await Promise.all([
    fetchProjects(categorySegment(cityKey, "Commercial")).catch(() => []),
    fetchProjects(categorySegment(cityKey, "Residential")).catch(() => []),
  ]);
  // One development sometimes reaches us twice -- "Emaar Emerald Floors
  // Select" alongside "Emaar Emrald Floors Select", M3M St Andrews listed
  // twice. Collapsing here, at the single boundary every consumer reads
  // through, keeps the duplicate out of the sector medians, the developer
  // portfolio figures and the project counts in copy, not just out of the
  // grid. See lib/intelligence/projectDedupe.ts for what it will and will not
  // merge; the collapsed slug redirects rather than 404s (getProjectBySlug).
  const normalized = [
    ...commercial.map((r) => normalizeProject(r, cityKey, "Commercial")),
    ...residential.map((r) => normalizeProject(r, cityKey, "Residential")),
  // Records the owner has asked not to carry (lib/intelligence/
  // excludedProjects.ts). Dropped here so an excluded record leaves the
  // sitemap, the sector medians and the developer counts at the same moment
  // it leaves the grid, rather than being hidden in one place and still
  // counted in another.
  ].filter((p) => !isExcludedProject(p.city_key, p.slug));

  return collapseDuplicateProjects(normalized);
}

// fetchProjects() (lib/scraping/homzbackend.ts) caches the *raw* segment (via
// a plain in-memory Map with no size limit, since Next's own fetch cache and
// unstable_cache both silently drop anything over 2MB, and a real city
// segment routinely runs 5-8MB) -- but every call here still re-ran
// normalizeProject() over the whole city from scratch. Multiple call sites
// request the *same* city within one render/regeneration cycle (the
// homepage alone calls this indirectly 3-4 times for "ggn": getAllBuilders,
// getSectorsForCity, getNewLaunchProjects, getFeaturedProjects), so that
// normalization pass -- not the network fetch -- was the redundant work.
// Cached here too, same TTL as the underlying raw-segment cache, so repeat
// calls for the same city within the window reuse the normalized array
// instead of recomputing it. 2026-09-16.
const NORMALIZED_TTL_MS = 30 * 60 * 1000;
type CityData = CollapseResult;
type CityCacheEntry = { data: CityData; expiresAt: number };
const cityCache = new Map<string, CityCacheEntry>();
const cityInFlight = new Map<string, Promise<CityData>>();

async function getCityData(cityKey: string): Promise<CityData> {
  const hit = cityCache.get(cityKey);
  if (hit && hit.expiresAt > Date.now()) return hit.data;

  const pending = cityInFlight.get(cityKey);
  if (pending) return pending;

  const request = (async () => {
    const data = await fetchCityRaw(cityKey);
    cityCache.set(cityKey, { data, expiresAt: Date.now() + NORMALIZED_TTL_MS });
    return data;
  })();

  cityInFlight.set(cityKey, request);
  try {
    return await request;
  } finally {
    if (cityInFlight.get(cityKey) === request) cityInFlight.delete(cityKey);
  }
}

export async function getProjectsForCity(cityKey: string): Promise<NormalizedProject[]> {
  return (await getCityData(cityKey)).projects;
}

/**
 * A project by slug, plus where the canonical page for it lives.
 *
 * `canonicalSlug` differs from the slug asked for when that slug was a
 * duplicate record collapsed into another (see projectDedupe.ts). The page
 * redirects there rather than rendering or 404ing, so an already-indexed
 * duplicate consolidates into the surviving page instead of breaking.
 */
export async function getProjectBySlugResolved(
  cityParam: string,
  slug: string
): Promise<{ project: NormalizedProject; canonicalSlug: string } | null> {
  const cityKey = CITY_PARAM_MAP[cityParam.toLowerCase()] || cityParam;
  const { projects, aliases } = await getCityData(cityKey);

  const direct = projects.find((p) => p.slug === slug);
  if (direct) return { project: direct, canonicalSlug: direct.slug };

  const canonical = aliases.get(`${cityKey}:${slug}`);
  if (!canonical) return null;
  const target = projects.find((p) => p.slug === canonical);
  return target ? { project: target, canonicalSlug: target.slug } : null;
}

export async function getProjectBySlug(
  cityParam: string,
  slug: string
): Promise<NormalizedProject | null> {
  return (await getProjectBySlugResolved(cityParam, slug))?.project ?? null;
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

  // Highest-inventory sectors first — this is the single source every sector
  // listing (homepage, city hub, /sectors index, footer) renders in as-is, so
  // sorting here is what makes the order consistent everywhere at once. Ties
  // fall back to natural sector-number order for a stable secondary sort.
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || sectorSortKey(a.sector) - sectorSortKey(b.sector)
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

// DEV-03 (2026-09-16): the compare route (app/project-listing/compare/...)
// needs a bounded set of pair keys to gate against, so the real n^2/2
// city/slugA/slugB combinatorial space (every valid pair of ~7,500+ real
// projects, all publicly slug-discoverable via the sitemap) isn't a
// crawlable/renderable surface -- that was the account's single largest
// Active CPU/origin-transfer/ISR-write driver before robots.txt blocked it
// outright on 2026-09-12. This set instead matches exactly what real pages
// actually link to (ProjectIntelligenceSections.tsx's "More by {builder}",
// up to 6, cross-city, and "Similar Projects", up to 3, same-city
// sector/category match with builder-matches excluded -- the same shape as
// getBuilderProjects/getSectorProjects/getSimilarProjects above), computed
// via one grouped O(n) pass rather than by calling those per-project
// functions ~7,500 times each (benchmarked: the naive per-project-call
// approach costs ~625ms CPU at this scale; this grouped approach is
// sub-millisecond). Cached the same way getProjectsForCity is.
const COMPARE_PAIRS_TTL_MS = 30 * 60 * 1000;
let comparePairsCache: { data: Set<string>; expiresAt: number } | null = null;
let comparePairsInFlight: Promise<Set<string>> | null = null;

function pairKey(citySlug: string, slugA: string, slugB: string): string {
  const [a, b] = [slugA, slugB].sort();
  return `${citySlug}/${a}/${b}`;
}

async function buildComparePairKeys(): Promise<Set<string>> {
  const allCities = await Promise.all(ALL_CITY_KEYS.map((k) => getProjectsForCity(k)));
  const allProjects = allCities.flat();

  const byBuilder = new Map<string, NormalizedProject[]>();
  const bySectorInCity = new Map<string, Map<string, NormalizedProject[]>>();
  const byCategoryInCity = new Map<string, Map<string, NormalizedProject[]>>();

  for (const p of allProjects) {
    if (!byBuilder.has(p.builder)) byBuilder.set(p.builder, []);
    byBuilder.get(p.builder)!.push(p);

    if (!bySectorInCity.has(p.city_key)) bySectorInCity.set(p.city_key, new Map());
    if (!byCategoryInCity.has(p.city_key)) byCategoryInCity.set(p.city_key, new Map());
    if (p.sector) {
      const sectorMap = bySectorInCity.get(p.city_key)!;
      if (!sectorMap.has(p.sector)) sectorMap.set(p.sector, []);
      sectorMap.get(p.sector)!.push(p);
    }
    const categoryMap = byCategoryInCity.get(p.city_key)!;
    if (!categoryMap.has(p.property_category)) categoryMap.set(p.property_category, []);
    categoryMap.get(p.property_category)!.push(p);
  }

  const keys = new Set<string>();

  for (const current of allProjects) {
    const citySlug = canonicalCitySlug(current.city_key);

    const builderMatches = (byBuilder.get(current.builder) || [])
      .filter((p) => p.slug !== current.slug && p.images.length > 0)
      .slice(0, 6);
    for (const m of builderMatches) keys.add(pairKey(citySlug, current.slug, m.slug));

    const sectorMatches = current.sector
      ? (bySectorInCity.get(current.city_key)?.get(current.sector) || [])
          .filter((p) => p.slug !== current.slug && p.images.length > 0)
          .slice(0, 6)
      : [];
    const categoryMatches = (byCategoryInCity.get(current.city_key)?.get(current.property_category) || [])
      .filter((p) => p.slug !== current.slug && p.images.length > 0)
      .slice(0, 6);

    const builderSlugs = new Set(builderMatches.map((p) => `${p.city_key}-${p.slug}`));
    const seen = new Set<string>();
    let combinedCount = 0;
    for (const p of [...sectorMatches, ...categoryMatches]) {
      if (combinedCount >= 3) break;
      const dedupeKey = `${p.city_key}-${p.slug}`;
      if (builderSlugs.has(dedupeKey) || seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      combinedCount++;
      keys.add(pairKey(citySlug, current.slug, p.slug));
    }
  }

  return keys;
}

export async function getComparePairKeys(): Promise<Set<string>> {
  if (comparePairsCache && comparePairsCache.expiresAt > Date.now()) return comparePairsCache.data;
  if (comparePairsInFlight) return comparePairsInFlight;

  const request = buildComparePairKeys().then((data) => {
    comparePairsCache = { data, expiresAt: Date.now() + COMPARE_PAIRS_TTL_MS };
    return data;
  });
  comparePairsInFlight = request;
  try {
    return await request;
  } finally {
    if (comparePairsInFlight === request) comparePairsInFlight = null;
  }
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
// extra fetches — the underlying getProjectsForCity calls are cached one layer
// down, by fetchSegment()'s own `next: { revalidate }` fetch.

export type DeveloperSummary = {
  name: string; // display label, e.g. "DLF"
  slug: string; // URL segment, e.g. "dlf"
  count: number;
  withImages: number;
  residential: number;
  commercial: number;
  cities: { slug: string; name: string }[]; // canonical city slug + display name
};

// Skip junk names the first-word builder heuristic (extractBuilder in
// normalize.ts) can produce — a title starting with a lone "MV ..." or
// "SS ..." that isn't the actual known "SS Group" — by requiring both the
// raw name and its slug to clear 3 characters. Avoids thin, low-quality
// developer pages/sitemap entries.
//
// SEO audit 2026-09-07 P1 (broken /developer/mv, /developer/ss links):
// buildDeveloperIndex applied this gate, but every OTHER place that turned
// a project's raw `builder` field into a /developer/{slug} link — the
// Gurgaon hub's "Top Developers" chips (app/project-listing/[city]/page.tsx)
// and a project page's own developer-profile link
// (ProjectIntelligenceSections.tsx via BuilderProfile) — did not, so a
// short fallback name could render a link to a developer page that
// buildDeveloperIndex, and therefore getBuilderBySlug, would never serve.
// Exporting this instead of duplicating the length check keeps every
// builder-name-to-link decision behind one gate.
export function isLinkableBuilder(builder: string | null | undefined): boolean {
  if (!builder || builder === "Unknown") return false;
  if (builder.trim().length < 3) return false;
  const slug = slugify(builder);
  return Boolean(slug && slug.length >= 3);
}

/**
 * Projects a developer needs before its hub is worth indexing.
 *
 * The 21 Sep audit asked for an entity-validation layer before developer
 * pages become indexable, having found indexed hubs for "The" and "J". The
 * name parsing that produced those is already fixed (see extractBuilder's
 * BUILDER_STOPWORDS and the length floor in isLinkableBuilder), but the other
 * half of that finding is still true: a hub holding one project is a thin
 * indexable page whose entire content is a single card that already has its
 * own page.
 *
 * Two, not more. A developer with two Gurgaon projects is a real developer and
 * the hub genuinely aggregates something. Setting the bar higher would
 * de-index legitimate smaller builders, which is a different mistake.
 *
 * Thin hubs are NOT removed — they keep rendering and stay crawlable so the
 * project stays reachable. They are noindex,follow and absent from the
 * sitemap, which is what the audit recommends for thin developer pages and
 * avoids 404ing URLs Google has already indexed.
 */
export const MIN_INDEXABLE_DEVELOPER_PROJECTS = 2;

export function isIndexableDeveloper(summary: Pick<DeveloperSummary, "count">): boolean {
  return summary.count >= MIN_INDEXABLE_DEVELOPER_PROJECTS;
}

type DeveloperIndex = Map<string, { summary: DeveloperSummary; projects: NormalizedProject[] }>;

// Called independently by getAllBuilders(), getBuilderBySlug() (any slug)
// and the sitemap's developers segment -- each used to rebuild this same
// across-all-5-cities index from scratch. Cached alongside
// getProjectsForCity's own per-city cache, same TTL, so those calls share
// one build per window instead of each redoing the full grouping pass.
let developerIndexCache: { data: DeveloperIndex; expiresAt: number } | null = null;
let developerIndexInFlight: Promise<DeveloperIndex> | null = null;

async function buildDeveloperIndex(): Promise<DeveloperIndex> {
  if (developerIndexCache && developerIndexCache.expiresAt > Date.now()) {
    return developerIndexCache.data;
  }
  if (developerIndexInFlight) return developerIndexInFlight;

  const request = buildDeveloperIndexUncached().then((data) => {
    developerIndexCache = { data, expiresAt: Date.now() + NORMALIZED_TTL_MS };
    return data;
  });
  developerIndexInFlight = request;
  try {
    return await request;
  } finally {
    if (developerIndexInFlight === request) developerIndexInFlight = null;
  }
}

async function buildDeveloperIndexUncached(): Promise<DeveloperIndex> {
  const allCities = await Promise.all(ALL_CITY_KEYS.map(getProjectsForCity));
  const map = new Map<
    string,
    { summary: DeveloperSummary; projects: NormalizedProject[] }
  >();

  for (const projects of allCities) {
    for (const p of projects) {
      const builder = p.builder;
      if (!isLinkableBuilder(builder)) continue;
      const slug = slugify(builder);

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
