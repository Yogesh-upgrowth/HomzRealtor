// The editorial registry, and the assertions that keep it honest (2026-09-22).
//
// One entry point for the three page registries, plus the load-time checks
// that catch the two mistakes that are easy to make and invisible once made:
//
//   1. A page keyed on one slug carrying `key` for another — it would render
//      Sector 65's analysis on Sector 70's page, which is the exact
//      content-spinning failure the standard bans, achieved by accident.
//   2. A section written against a specId that is not in the frozen standard.
//      It renders nothing and nobody notices the writer's work is missing.
//
// Both throw at module load rather than failing quietly at request time. This
// is the same pattern as the orphan-alias assertion in lib/content/developers.ts,
// and for the same reason: a content registry that is wrong in a way the type
// system cannot see needs something that actually looks.

import { developerEditorial, DEVELOPER_EDITORIAL } from "./developerPages";
import { projectEditorial, PROJECT_EDITORIAL } from "./projectPages";
import { sectorEditorial, SECTOR_EDITORIAL } from "./sectorPages";
import { sectionSpec } from "./standard";
import { isPublishable, type EditorialPage, type EditorialPageType } from "./types";

const REGISTRIES: Record<EditorialPageType, Record<string, EditorialPage>> = {
  sector: SECTOR_EDITORIAL,
  developer: DEVELOPER_EDITORIAL,
  project: PROJECT_EDITORIAL,
};

// ── load-time assertions ────────────────────────────────────────────────────

for (const [pageType, registry] of Object.entries(REGISTRIES) as [
  EditorialPageType,
  Record<string, EditorialPage>,
][]) {
  for (const [slug, page] of Object.entries(registry)) {
    if (page.key !== slug) {
      throw new Error(
        `[editorial] ${pageType} registry: entry keyed "${slug}" carries key "${page.key}". ` +
          `A mismatched key renders one page's analysis on another's URL.`
      );
    }
    if (page.pageType !== pageType) {
      throw new Error(
        `[editorial] ${pageType} registry: entry "${slug}" declares pageType "${page.pageType}".`
      );
    }
    if (page.standard !== "v1") {
      throw new Error(
        `[editorial] ${pageType}/${slug}: standard "${page.standard}" — this codebase renders v1 only.`
      );
    }
    for (const section of page.sections) {
      if (!sectionSpec(pageType, section.specId)) {
        throw new Error(
          `[editorial] ${pageType}/${slug}: section "${section.specId}" is not in the frozen ` +
            `${pageType} section list. Add it to lib/content/editorial/standard.ts, or fix the id.`
        );
      }
    }
    const seen = new Set<string>();
    for (const section of page.sections) {
      if (seen.has(section.specId)) {
        throw new Error(`[editorial] ${pageType}/${slug}: duplicate section "${section.specId}".`);
      }
      seen.add(section.specId);
    }
    // A page cannot be marked published without a recorded score of 90+. The
    // render path already refuses it via isPublishable(); this makes the
    // contradiction loud at load rather than silently rendering nothing.
    if (page.status === "published" && !isPublishable(page)) {
      throw new Error(
        `[editorial] ${pageType}/${slug}: status is "published" but it does not pass the ` +
          `publish gate (needs a recorded score of 90+ and non-generated authorship). ` +
          `Run: npm run check:content-standard`
      );
    }
  }
}

// ── lookup ──────────────────────────────────────────────────────────────────

export function editorialFor(pageType: EditorialPageType, key: string): EditorialPage | null {
  switch (pageType) {
    case "sector":
      return sectorEditorial(key);
    case "developer":
      return developerEditorial(key);
    case "project":
      return projectEditorial(key);
  }
}

/** Every registered page, for the checker and the originality comparison. */
export function allEditorialPages(): EditorialPage[] {
  return Object.values(REGISTRIES).flatMap((r) => Object.values(r));
}

/** Registered pages of one type — the sibling set the originality test
 *  compares a page against. */
export function editorialPagesOfType(pageType: EditorialPageType): EditorialPage[] {
  return Object.values(REGISTRIES[pageType]);
}

/** The one the routes call: copy to render, or null. Null is the normal
 *  answer for every page that has not been written yet, and the routes treat
 *  it as "render the data modules and nothing else". */
export function publishedEditorialFor(
  pageType: EditorialPageType,
  key: string
): EditorialPage | null {
  const page = editorialFor(pageType, key);
  return isPublishable(page) ? page : null;
}

/**
 * A published page's FAQs, for routes that already build a computed FAQ list
 * and a FAQPage schema block.
 *
 * Returned as plain q/a pairs so a route can concatenate them onto its own
 * list and get both the rendered accordion and the structured data from one
 * change. Editorial questions go AFTER the computed ones on purpose: the
 * computed set answers the mechanical questions (what does it cost, who builds
 * here) that a searcher arrives with, and the written set answers the ones
 * that need a person.
 */
export function editorialFaqsFor(
  pageType: EditorialPageType,
  key: string
): { q: string; a: string }[] {
  const page = publishedEditorialFor(pageType, key);
  if (!page?.faqs) return [];
  return page.faqs
    .filter((f) => f.q.trim() && f.a.trim())
    .map((f) => ({ q: f.q, a: f.a }));
}
