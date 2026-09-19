// Feed records the owner has asked not to carry (2026-09-19).
//
// The catalogue is built from an external feed, so a record cannot be deleted
// at source. This is the owner-controlled exclusion list, applied at
// fetchCityRaw alongside the duplicate collapse, so an excluded record leaves
// the grid, the sitemap, the sector medians, the developer counts and every
// other figure computed off the catalogue at the same moment.
//
// This is a deliberately blunt instrument and it should stay short. Excluding
// a record removes inventory, and the standing instruction on this project is
// that listings are not to be dropped. Add something here only when the owner
// asks for that specific record to go.
//
// Matching is on the slug, which normalize.ts derives from the project name,
// per city. A record whose name changes upstream will slip back in; that is
// the honest trade-off for not hard-coding feed ids that the feed does not
// guarantee.

export type ExcludedProject = {
  cityKey: string;
  /** slugify(project_name) — see lib/intelligence/normalize.ts. */
  slug: string;
  /** Why, and who asked. Every entry carries one. */
  reason: string;
};

export const EXCLUDED_PROJECTS: ExcludedProject[] = [
  {
    cityKey: "ggn",
    slug: "bharti-airtel-centre",
    reason:
      "Owner instruction 2026-09-19. Flagged by the 19 Sep audit as not a saleable project; it is a corporate office building that reached us through the commercial segment.",
  },
];

const EXCLUDED_KEYS = new Set(EXCLUDED_PROJECTS.map((e) => `${e.cityKey}:${e.slug}`));

export function isExcludedProject(cityKey: string, slug: string): boolean {
  return EXCLUDED_KEYS.has(`${cityKey}:${slug}`);
}
