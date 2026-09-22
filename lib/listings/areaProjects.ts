// The project-side facts a sector or corridor hub is missing (2026-09-22).
//
// Checklist item 22 lists what a priority sector page should carry
// "consistently": median asking price, price range, active listings, project
// count, new launch count, ready-to-move count, top developers, connectivity,
// schools, hospitals, offices, nearby infrastructure, top projects, FAQs, data
// update date. Item 23 asks for corridor hubs aggregating "sector data,
// projects, current pricing, maps, connectivity, infrastructure, articles,
// current inventory".
//
// lib/listings/hubIntel.ts already supplies most of it — but it reads the
// LISTING segments, and six of those bullets are facts about PROJECTS: the
// project count, the status mix, who is building there, and which projects
// they are. Those live in a different dataset entirely
// (lib/intelligence/projects.ts), which is why they were absent rather than
// overlooked.
//
// "Offices" is the one bullet not answered here, and not by an omission: the
// OSM dataset has no office category. What a buyer is actually asking — how
// far is the work — is answered by the business-hub distance in hubIntel's
// anchors (Cyber City, Udyog Vihar), which is a better answer than a list of
// individual office buildings would be.

import { getProjectsForCity, developerHubSlug, canonicalCitySlug } from "@/lib/intelligence/projects";
import type { NormalizedProject } from "@/lib/intelligence/normalize";
import { projectStatusKind } from "@/lib/intelligence/projectStatus";
import { slugify } from "@/lib/intelligence/normalize";
import { GURGAON_CORRIDORS } from "./listingLocation";

export type AreaDeveloper = { name: string; slug: string | null; count: number };

export type AreaProject = {
  name: string;
  href: string;
  status: string | null;
  priceInr: number | null;
};

export type AreaProjects = {
  projectCount: number;
  residentialCount: number;
  commercialCount: number;
  readyToMove: number;
  underConstruction: number;
  newLaunch: number;
  /** Projects whose status the feed does not state. Surfaced rather than
   *  folded into one of the buckets above — see the note in projectStatus.ts
   *  about what guessing on a missing status produced last time. */
  statusUnknown: number;
  topDevelopers: AreaDeveloper[];
  topProjects: AreaProject[];
  /** For a corridor: the sectors it covers, largest first. Empty for a
   *  sector scope. */
  sectors: { label: string; slug: string; count: number }[];
};

/** Matches a project to a sector token ("65", "82a") the way the listing
 *  hubs name them, via the project's own derived sector string. */
function projectSectorToken(p: NormalizedProject): string | null {
  const m = String(p.sector ?? "").match(/sector\s*([0-9]{1,3}[a-z]?)/i);
  return m ? m[1].toLowerCase() : null;
}

function projectCorridorSlug(p: NormalizedProject): string | null {
  const blob = `${p.sector ?? ""} ${p.micro_market ?? ""} ${p.project_name ?? ""}`;
  return GURGAON_CORRIDORS.find((c) => c.match.test(blob))?.slug ?? null;
}

function summarise(projects: NormalizedProject[], includeSectors: boolean): AreaProjects {
  const citySlug = canonicalCitySlug("ggn");

  const byDeveloper = new Map<string, { name: string; slug: string | null; count: number }>();
  for (const p of projects) {
    const name = p.builder;
    if (!name || name === "Unknown") continue;
    const slug = developerHubSlug(name);
    const key = slug ?? name.toLowerCase();
    const entry = byDeveloper.get(key) ?? { name, slug, count: 0 };
    entry.count += 1;
    byDeveloper.set(key, entry);
  }

  const statusOf = (p: NormalizedProject) => projectStatusKind(p.project_status);

  // Best-presented first, then priced, then alphabetical — a "top projects"
  // list with no images is a list of text links, and the ranking is otherwise
  // arbitrary rather than a quality claim we cannot support.
  const topProjects = [...projects]
    .sort((a, b) => {
      const ai = a.images.length > 0 ? 0 : 1;
      const bi = b.images.length > 0 ? 0 : 1;
      if (ai !== bi) return ai - bi;
      const ap = a.min_price_inr != null ? 0 : 1;
      const bp = b.min_price_inr != null ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.project_name.localeCompare(b.project_name);
    })
    .slice(0, 8)
    .map((p) => ({
      name: p.project_name,
      href: `/project-listing/${citySlug}/${p.slug}`,
      status: p.project_status,
      priceInr: p.min_price_inr,
    }));

  const sectors: { label: string; slug: string; count: number }[] = [];
  if (includeSectors) {
    const bySector = new Map<string, { label: string; count: number }>();
    for (const p of projects) {
      if (!p.sector) continue;
      const entry = bySector.get(p.sector) ?? { label: p.sector, count: 0 };
      entry.count += 1;
      bySector.set(p.sector, entry);
    }
    for (const [label, v] of bySector) {
      sectors.push({ label, slug: slugify(label), count: v.count });
    }
    sectors.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  return {
    projectCount: projects.length,
    residentialCount: projects.filter((p) => p.property_category === "Residential").length,
    commercialCount: projects.filter((p) => p.property_category === "Commercial").length,
    readyToMove: projects.filter((p) => statusOf(p) === "ready-to-move").length,
    underConstruction: projects.filter((p) => statusOf(p) === "under-construction").length,
    newLaunch: projects.filter((p) => statusOf(p) === "new-launch").length,
    statusUnknown: projects.filter((p) => statusOf(p) === "unknown").length,
    topDevelopers: Array.from(byDeveloper.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8),
    topProjects,
    sectors: sectors.slice(0, 20),
  };
}

/**
 * Projects in a sector or corridor, summarised.
 *
 * Returns null when nothing matches, so a caller renders no block at all
 * rather than a section full of zeroes — a hub claiming "0 projects, 0
 * developers" reads as broken rather than as empty.
 */
export async function getAreaProjects(
  scope: { kind: "sector"; token: string } | { kind: "corridor"; slug: string }
): Promise<AreaProjects | null> {
  const all = await getProjectsForCity("ggn").catch(() => []);
  if (all.length === 0) return null;

  const matched =
    scope.kind === "sector"
      ? all.filter((p) => projectSectorToken(p) === scope.token.toLowerCase())
      : all.filter((p) => projectCorridorSlug(p) === scope.slug);

  if (matched.length === 0) return null;
  return summarise(matched, scope.kind === "corridor");
}
