// The research dossier — workflow Step 3 (2026-09-22).
//
// "Step 3 — Research dossier. I can prepare this. No prose pretending to be
//  human-written. Just: facts, sources, numbers, questions, angle, competitive
//  gaps."
//
// That sentence is the whole specification for this file, and the constraint
// in it is the important part: a dossier is NOT a draft. It contains no
// sentences a writer could paste. Everything is a fact, a number with its
// source, an open question, or a note about what the competing pages do not
// answer. A writer reads it and writes; a writer cannot lift from it, because
// there is nothing shaped like prose to lift.
//
// That is deliberate and it is the difference between a research pack and a
// laundered AI draft. If this file ever grows a `suggestedParagraph` field,
// the standard's authorship rule has been quietly abandoned.
//
// A dossier is built by scripts/build-dossier.mjs, which runs the real
// pipeline modules against the live catalogue. It is emitted as JSON to
// docs/editorial/dossiers/ rather than committed as TypeScript, because a
// dossier is a snapshot for a writer working this week — not a source of truth
// the site renders. The site renders computed figures, always.

import type { EditorialPageType } from "./types";

/** A number the writer may quote, with the field it came from. Every figure in
 *  a dossier carries its provenance so the writer can mark the claim (Step 5)
 *  without going back to ask where it came from. */
export type DossierFigure = {
  /** Human label, e.g. "Median entry asking price". */
  label: string;
  /** Formatted for a reader, e.g. "₹1.61 Cr". */
  display: string;
  /** Raw value, for the writer's own arithmetic. */
  value: number | string | null;
  /** The computed field, e.g. "sector.medianEntryPrice" — this becomes the
   *  claim's `homzField` when the writer marks it up. */
  field: string;
  /** How many records sit behind it. A median of two is noise, and a writer
   *  who cannot see the base has no way to know that. */
  sampleSize?: number;
  /** Set where the figure is below the platform's own publishing threshold —
   *  the writer should describe the thinness rather than quote the number. */
  belowThreshold?: boolean;
};

/** Something the writer must establish from outside our data. The dossier
 *  states the question and where to look; it never guesses the answer. */
export type DossierQuestion = {
  question: string;
  /** Where the answer is likely to be found. */
  lookIn: string[];
  /** Why it matters to this page, so a writer can drop it if it does not. */
  why: string;
};

/** A gap in what the currently-ranking pages answer. The differentiator, and
 *  the reason a page is worth writing rather than matching. */
export type CompetitiveGap = {
  gap: string;
  /** What our data lets us say about it that theirs does not. */
  weCanAnswer: string;
};

export type ResearchDossier = {
  standard: "v1";
  pageType: EditorialPageType;
  key: string;
  /** Display name — "Sector 65, Gurgaon", "DLF". */
  title: string;
  /** When the catalogue was read. Everything below is as of this moment. */
  generatedAt: string;

  /** Layer A + Layer B, grouped by the section of the standard that uses them.
   *  Keyed on SectionSpec.id so a writer working through section 4 sees only
   *  section 4's numbers. */
  figuresBySection: Record<string, DossierFigure[]>;

  /** Every section's brief, copied from the frozen standard, so the dossier is
   *  self-contained on a writer's desk. */
  briefs: { id: string; label: string; brief: string; words: string }[];

  /** Named things the writer will need to check outside our data: RERA
   *  registration numbers, official developer sites, infrastructure sources. */
  externalSources: { label: string; url: string; whatToCheck: string }[];

  questions: DossierQuestion[];
  competitiveGaps: CompetitiveGap[];

  /** Data-quality findings on this page's records, from the publish gate. A
   *  writer must not write around a contradiction — it gets fixed in the data
   *  first. */
  dataWarnings: string[];

  /** The angle: what makes THIS page different from its nineteen siblings.
   *  Stated as observations about the data, never as a sentence to open with. */
  angle: string[];
};

/** Where a built dossier lands. Not rendered by the site. */
export const DOSSIER_DIR = "docs/editorial/dossiers";

export function dossierPath(pageType: EditorialPageType, key: string): string {
  return `${DOSSIER_DIR}/${pageType}-${key}.json`;
}
