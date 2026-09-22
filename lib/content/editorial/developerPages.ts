// Editorial copy for developer hubs — Homz Content Standard v1 (2026-09-22).
//
// Empty for the same reason as sectorPages.ts: Layer C is human-written, and
// the machinery is what ships ahead of the writer, not a stand-in for them.
//
// ONE DIFFERENCE WORTH KNOWING about this page type. The "About the developer"
// section is Layer A, not Layer C — it is verified entity facts and it already
// has a home in lib/content/developerProfiles.ts, where every fact carries the
// URL it came from and the date a person checked it. Do not write company
// history into this file. The section that belongs here is "their history in
// GURGAON": when they became active, which micro-markets define the portfolio,
// how the product mix has changed. That is the analysis, and it is what makes
// a developer hub something other than a rewritten corporate About page.
//
//   npm run build:dossier -- developer dlf
//   npm run check:developer-coverage     (which developers still lack verified
//                                         entity facts, most inventory first)
//
// DLF is the prototype. M3M, Emaar, Signature Global and the twelve after them
// follow the same structure with a different story in it — that is the whole
// point of the corridor and footprint sections.

import type { EditorialPage } from "./types";

export const DEVELOPER_EDITORIAL: Record<string, EditorialPage> = {};

/** Developer hub slug → its editorial page, or null. */
export function developerEditorial(slug: string): EditorialPage | null {
  return DEVELOPER_EDITORIAL[String(slug ?? "").trim().toLowerCase()] ?? null;
}
