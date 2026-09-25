// Editorial copy for sector hubs — Homz Content Standard v1 (2026-09-22).
//
// This registry is EMPTY, and it is empty on purpose.
//
// Layer C is the human editorial analysis: why this sector's buyer profile
// differs from the next one's, what a ₹3 Cr buyer actually faces here, which
// of the two adjoining sectors is the real comparison. The standard is
// explicit that it "should not be mechanically generated. That is how we avoid
// pages feeling AI-written", and that the byline may only claim human
// authorship when that is what happened.
//
// So the machinery is finished and the prose is not written. Filling this file
// with generated paragraphs would produce exactly the copy the standard exists
// to prevent, and would leave a choice between rewriting all of it or
// mislabelling its authorship. Neither is worth the shipping date.
//
// HOW TO ADD A SECTOR
//
//   1. Generate the research dossier:  npm run build:dossier -- sector sector-65
//      That emits Layer A and Layer B — every computed figure, the competitive
//      gaps, the questions to answer — and no prose.
//   2. A writer writes the narrative from the dossier, section by section,
//      against the ids in lib/content/editorial/standard.ts (SECTOR_SECTIONS).
//   3. Mark every factual claim (workflow Step 5) in the section's `claims`.
//   4. Add the page below, with `status: "draft"`.
//   5. Score it:  npm run check:content-standard
//   6. At 90+, record the score in `review` and set `status: "published"`.
//      Below 90 it stays draft and renders nothing. That is the gate working.
//
// The first sector to be written is sector-65 — the prototype that defines the
// standard for the nineteen after it (see SECTOR_ROLLOUT).

import type { EditorialPage } from "./types";

export const SECTOR_EDITORIAL: Record<string, EditorialPage> = {};

/** Sector hub slug → its editorial page, or null. Called by the sector route;
 *  null is the normal, expected answer today. */
export function sectorEditorial(slug: string): EditorialPage | null {
  return SECTOR_EDITORIAL[String(slug ?? "").trim().toLowerCase()] ?? null;
}
