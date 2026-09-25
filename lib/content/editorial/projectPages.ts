// Editorial copy for project pages — Homz Content Standard v1 (2026-09-22).
//
// Empty, and the LAST of the three to fill. Two reasons, both from the
// standard itself:
//
//   1. "These are the largest volume, so we must be careful." A project page
//      only gets editorial copy "after its structured facts pass QA" — which
//      in this repo means lib/intelligence/publishGate.ts returns no blocking
//      findings for it. Writing 2,500 words about a project whose possession
//      status contradicts its own payment plan publishes the contradiction in
//      prose, where it is much harder to correct than in a data field.
//
//   2. The order is set by search demand, not by the catalogue. "A strong DLF
//      project with 20,000 impressions should be rewritten before an obscure
//      project with zero impressions. Search Console should determine the
//      exact order." That export is not in this repo, so the queue for this
//      file cannot be built here — it is an input, not a computation.
//
// THE DUPLICATE-CONTENT TRAP on this page type, stated once so it is on the
// page a writer reads: the developer context section is 100–150 words and a
// link to the developer hub. The same 500-word developer biography across a
// hundred project pages is duplicate content by construction, and it is the
// most likely way this standard gets misapplied at volume.

import type { EditorialPage } from "./types";

export const PROJECT_EDITORIAL: Record<string, EditorialPage> = {};

/** Project slug → its editorial page, or null. */
export function projectEditorial(slug: string): EditorialPage | null {
  return PROJECT_EDITORIAL[String(slug ?? "").trim().toLowerCase()] ?? null;
}
