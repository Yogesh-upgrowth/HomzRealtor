// Homz Content Standard v1 — the frozen section list (2026-09-22).
//
// "I would freeze the content structure above as Homz Content Standard v1, so
// we don't keep changing page formats."
//
// This file IS that freeze. Every section of a sector, developer and project
// page is declared here with its id, its heading intent, the layer it belongs
// to, its word target and whether it is required. Writers work from this list.
// The checker (scripts/check-content-standard.mjs) reports any section written
// against an id that is not here, and any required section missing — so format
// drift is a build-visible fact rather than something noticed six pages later.
//
// WORD TARGETS ARE TARGETS, NOT A SCORE. The rubric puts 5 of 100 points on
// word count on purpose: "I don't want us measuring quality by word count."
// The targets below exist so a writer knows the intended depth of a section,
// not so a page can be padded to a number. A 240-word section that says
// something is worth more than a 400-word section that does not, and the
// checker reports the shortfall as information rather than failing on it.
//
// A DISCREPANCY WORTH KNOWING ABOUT, rather than quietly resolving. The stated
// page targets are 2,500–3,500 words for a sector, 2,500–4,000 for a developer
// and 2,000–3,000 for a project. The per-section minimums below sum to 3,520,
// 3,550 and 2,500 — i.e. writing every section at its own minimum already
// exceeds the sector and developer page targets. The section figures are the
// ones taken verbatim from the standard wherever it gave one; the arithmetic
// simply does not close, and both numbers cannot be met at once.
//
// This file treats the SECTION targets as the guide, because that is what a
// writer actually works to, and treats the page range as the headline. If the
// page range is the binding constraint instead, the sections to compress are
// the ones with no stated target (major-projects, notable-projects, the FAQ
// blocks) rather than the analytical ones. Either way it is a decision to make
// deliberately, not a rounding error to absorb.
//
// WHAT IS NOT HERE. No Layer A or Layer B section is listed as editorial.
// "Sector at a glance", the price table, the corridor concentration table,
// the project grid, the connectivity distances — those already exist as
// computed modules and they stay computed. Listing them here would invite
// somebody to type a median into a TS file. The editorial sections are the
// ones that EXPLAIN those modules, and they are placed around them.

import type { EditorialPageType } from "./types";

export const CONTENT_STANDARD_VERSION = "v1" as const;
export const CONTENT_STANDARD_FROZEN_AT = "2026-09-22";

/** Which of the three layers a section belongs to. Only Layer C sections are
 *  written by hand; A and B are listed on the page map for orientation. */
export type ContentLayer = "A" | "B" | "C";

export type SectionSpec = {
  id: string;
  /** What the section is for. Not the page's actual <h2> — that is written
   *  per page, because "What Sector 70 is actually like" and "What Sector 65
   *  is actually like" are the same spec and must not be the same sentence. */
  label: string;
  layer: ContentLayer;
  /** Target prose length. null for Layer A/B modules, which are computed. */
  words: { min: number; max: number } | null;
  required: boolean;
  /** What the writer is being asked to do, in the standard's own terms. Read
   *  by the dossier builder so a research pack is organised by section. */
  brief: string;
};

// ---------------------------------------------------------------------------
// Sector pages — target 2,500–3,500 editorial words
// ---------------------------------------------------------------------------

export const SECTOR_SECTIONS: SectionSpec[] = [
  {
    id: "quick-answer",
    label: "Quick answer: what kind of market this is",
    layer: "C",
    words: { min: 120, max: 150 },
    required: true,
    brief:
      "Answer the question immediately: established or developing, residential vs commercial mix, typical entry price, main buyer type, main corridor, ready vs under-construction mix. Written editorially from the facts, not a restatement of the table below it.",
  },
  {
    id: "at-a-glance",
    label: "Sector at a glance (computed table)",
    layer: "B",
    words: null,
    required: true,
    brief:
      "Computed. Projects tracked, residential/commercial split, median entry asking price, asking range, ready/UC/launch counts, main corridor, data-updated date. Never typed by hand.",
  },
  {
    id: "what-its-like",
    label: "What the sector is actually like",
    layer: "C",
    words: { min: 250, max: 350 },
    required: true,
    brief:
      "Where it sits in Gurgaon, how it relates to the adjoining sectors, established or growth-stage, main roads, residential character, commercial development, what someone sees when they actually compare property here. Requires location research, not adjectives.",
  },
  {
    id: "prices",
    label: "Property prices in this sector",
    layer: "C",
    words: { min: 300, max: 400 },
    required: true,
    brief:
      "Explain the computed numbers: median asking price, the low/high range, why the spread is as wide as it is, what sits at each end, residential vs commercial difference, ready vs new-launch difference. Disclose asking-not-transacted.",
  },
  {
    id: "budgets",
    label: "What different budgets buy here",
    layer: "C",
    words: { min: 250, max: 400 },
    required: true,
    brief:
      "Below ₹1 Cr / ₹1–2 Cr / ₹2–4 Cr / ₹4 Cr+. Computed from live inventory, then explained. Say plainly where a band has nothing in it. No recommendations that the inventory does not support.",
  },
  {
    id: "residential",
    label: "The residential market",
    layer: "C",
    words: { min: 250, max: 300 },
    required: true,
    brief:
      "Apartment, builder floor, plot, villa; BHK distribution; ready/UC/launch. Explain what dominates and what that means for a buyer.",
  },
  {
    id: "commercial",
    label: "Commercial property",
    layer: "C",
    words: { min: 150, max: 300 },
    required: false,
    brief:
      "Only where there is meaningful inventory. Three commercial projects is three commercial projects — say so rather than describing a major commercial market.",
  },
  {
    id: "major-projects",
    label: "Major projects, with stated selection criteria",
    layer: "C",
    words: { min: 300, max: 600 },
    required: true,
    brief:
      "An editorial shortlist against transparent criteria (largest inventory, newer launches, ready options, budget spread, important developers) — not the card grid in prose. ~70–100 factual words each, each linking to its project page.",
  },
  {
    id: "developers",
    label: "Developers active here",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief:
      "How much actual presence each has, from the catalogue. Links to the developer hubs. Nobody is 'renowned'.",
  },
  {
    id: "connectivity",
    label: "Connectivity",
    layer: "C",
    words: { min: 300, max: 450 },
    required: true,
    brief:
      "Verified distances to NH-48, SPR, Golf Course Extension Road, the metro, Cyber City, IGI. Keep straight-line distance and driving time distinct, as the live pages already do. Then explain which route actually matters for which commuter.",
  },
  {
    id: "infrastructure",
    label: "Schools, healthcare and daily infrastructure",
    layer: "C",
    words: { min: 250, max: 400 },
    required: true,
    brief:
      "Organised by schools / healthcare / shopping / daily needs / employment centres. Verified places only — a named school that does not exist is the worst kind of error on this page.",
  },
  {
    id: "suitability",
    label: "Who should and should not consider it",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief:
      "Both sides, specifically. Every place has disadvantages; a site where every sector is an 'ideal investment destination' has no credibility left to spend.",
  },
  {
    id: "vs-nearby",
    label: "Versus the neighbouring sectors",
    layer: "C",
    words: { min: 300, max: 500 },
    required: true,
    brief:
      "Two or three real comparisons against adjacent sectors, using our own data. Ranks for comparison searches without spawning comparison URLs.",
  },
  {
    id: "market-read",
    label: "What the current data says about this market",
    layer: "C",
    words: { min: 250, max: 400 },
    required: true,
    brief:
      "Is inventory mostly ready? Are launches increasing? Is the mix skewed premium? Is it dominated by a few developers? How does its median sit against Gurgaon's? Present data only — no price predictions.",
  },
  {
    id: "faqs",
    label: "Sector FAQs",
    layer: "C",
    words: { min: 400, max: 900 },
    required: true,
    brief:
      "10–15 questions people genuinely ask, answered. Not keyword-spam FAQs and not questions invented to hold a keyword.",
  },
];

// ---------------------------------------------------------------------------
// Developer pages — target 2,500–4,000 editorial words
// ---------------------------------------------------------------------------

export const DEVELOPER_SECTIONS: SectionSpec[] = [
  {
    id: "quick-answer",
    label: "Quick answer: this developer in Gurgaon",
    layer: "C",
    words: { min: 100, max: 150 },
    required: true,
    brief:
      "What they actually build here, where, at what price range, how much inventory. Four facts, answered before a reader scrolls.",
  },
  {
    id: "portfolio-snapshot",
    label: "Portfolio snapshot (computed)",
    layer: "B",
    words: null,
    required: true,
    brief:
      "Computed. Project count, residential/commercial split, how many carry current asking prices, median entry price, ready/UC/launch counts. Never typed by hand.",
  },
  {
    id: "about",
    label: "About the developer",
    layer: "A",
    words: null,
    required: true,
    brief:
      "Verified entity facts only, from lib/content/developerProfiles.ts: official name, founding year, founder, headquarters, official site, each with a source URL and a checked date. A developer with no verified record renders no About section.",
  },
  {
    id: "gurgaon-history",
    label: "Their history in Gurgaon specifically",
    layer: "C",
    words: { min: 300, max: 500 },
    required: true,
    brief:
      "Different from company history. When they became active here, which micro-markets define the portfolio, what types of project, how the product mix has changed. This is what makes the page Gurgaon-specific rather than a rewritten corporate About page.",
  },
  {
    id: "footprint",
    label: "Current Gurgaon footprint",
    layer: "C",
    words: { min: 300, max: 500 },
    required: true,
    brief:
      "Explain the computed sector and corridor concentration — which clusters define them and why the portfolio sits where it does. Our own research, not available anywhere else.",
  },
  {
    id: "price-analysis",
    label: "Price analysis",
    layer: "C",
    words: { min: 300, max: 450 },
    required: true,
    brief:
      "Explain the range rather than printing it. Commercial vs residential, older inventory vs current luxury, apartment vs independent floor. A range from lakhs to tens of crores needs a reason attached.",
  },
  {
    id: "residential-portfolio",
    label: "Residential portfolio",
    layer: "C",
    words: { min: 250, max: 400 },
    required: true,
    brief: "What they build residentially here, in what configurations, at what stage.",
  },
  {
    id: "commercial-portfolio",
    label: "Commercial portfolio",
    layer: "C",
    words: { min: 200, max: 400 },
    required: false,
    brief: "Only where there is meaningful commercial inventory.",
  },
  {
    id: "pipeline",
    label: "New launches and under construction",
    layer: "C",
    words: { min: 150, max: 300 },
    required: false,
    brief: "What is actually in the pipeline, from catalogue status. Two launches is two launches.",
  },
  {
    id: "ready-inventory",
    label: "Ready-to-move inventory",
    layer: "C",
    words: { min: 150, max: 300 },
    required: false,
    brief: "What a buyer who needs possession now can actually see.",
  },
  {
    id: "by-corridor",
    label: "The portfolio by Gurgaon corridor",
    layer: "C",
    words: { min: 300, max: 500 },
    required: true,
    brief:
      "Golf Course Road, MG Road, Dwarka Expressway, Golf Course Extension Road, SPR, New Gurgaon. Every developer produces a different story here, which is exactly why this section makes each hub genuinely unique.",
  },
  {
    id: "notable-projects",
    label: "Notable projects in the Homz catalogue",
    layer: "C",
    words: { min: 300, max: 600 },
    required: true,
    brief:
      "Not 'best' unless the criteria are stated. Say why each was selected and link to its page.",
  },
  {
    id: "rera",
    label: "RERA status",
    layer: "C",
    words: { min: 150, max: 300 },
    required: true,
    brief:
      "RERA is granted per project and per phase. Never 'this developer is RERA approved' — that claim is conceptually wrong and the live pages already avoid it.",
  },
  {
    id: "suitability",
    label: "Who might consider this developer",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief: "Buyer types, derived from the actual portfolio. Both sides, as on sector pages.",
  },
  {
    id: "verify",
    label: "What buyers should verify",
    layer: "C",
    words: { min: 250, max: 400 },
    required: true,
    brief:
      "Exact RERA phase, current inventory, current asking price, payment schedule, possession, maintenance, parking, transfer charges, PLC, registry and ownership. The trust section.",
  },
  {
    id: "faqs",
    label: "Developer FAQs",
    layer: "C",
    words: { min: 600, max: 1200 },
    required: true,
    brief: "15 meaningful questions, answered from the portfolio.",
  },
];

// ---------------------------------------------------------------------------
// Project pages — target 2,000–3,000 editorial words
// ---------------------------------------------------------------------------
//
// One rule on this page type is load-bearing and easy to get wrong at scale:
// the developer context section is 100–150 words with a link to the developer
// hub. Repeating a 500-word developer biography across a hundred project pages
// is duplicate content, and it is the single most likely way this standard
// gets misapplied.

export const PROJECT_SECTIONS: SectionSpec[] = [
  {
    id: "overview",
    label: "Overview",
    layer: "C",
    words: { min: 200, max: 300 },
    required: true,
    brief: "What the project actually is. Not a rewritten developer brochure.",
  },
  {
    id: "facts",
    label: "Project facts (source-backed table)",
    layer: "A",
    words: null,
    required: true,
    brief: "Computed and source-backed. Only publishes after the project's structured facts pass the publish gate.",
  },
  {
    id: "configurations",
    label: "Configuration analysis",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief: "Explain the options rather than restating the table.",
  },
  {
    id: "price-analysis",
    label: "Price analysis",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief: "Current Homz asking data, explained, with the asking-vs-transacted disclosure.",
  },
  {
    id: "sector-position",
    label: "Position within its sector",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief: "Against the sector dataset — where this project sits on price, stage and configuration.",
  },
  {
    id: "location",
    label: "Location analysis",
    layer: "C",
    words: { min: 250, max: 400 },
    required: true,
    brief: "Actual connectivity, with straight-line and driving distance kept distinct.",
  },
  {
    id: "infrastructure",
    label: "Nearby infrastructure",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief: "Verified places only.",
  },
  {
    id: "amenities",
    label: "Amenities that matter",
    layer: "C",
    words: { min: 150, max: 300 },
    required: true,
    brief: "Explain the meaningful ones. Fifty icons is not a section.",
  },
  {
    id: "developer-context",
    label: "Developer context",
    layer: "C",
    words: { min: 100, max: 150 },
    required: true,
    brief:
      "100–150 words and a link to the developer hub. Never the same developer biography across a hundred project pages — that is duplicate content by construction.",
  },
  {
    id: "status-rera",
    label: "Status and RERA",
    layer: "C",
    words: { min: 120, max: 250 },
    required: true,
    brief: "Verified, per phase.",
  },
  {
    id: "suitability",
    label: "Who it suits",
    layer: "C",
    words: { min: 180, max: 300 },
    required: true,
    brief: "Home buyer versus investor, and who it does not suit.",
  },
  {
    id: "check-before-buying",
    label: "Things to check before buying",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief: "The differentiating section. Specific to this project, not a generic checklist.",
  },
  {
    id: "alternatives",
    label: "Alternatives nearby",
    layer: "C",
    words: { min: 200, max: 350 },
    required: true,
    brief: "Real alternatives on location, budget and configuration, from the catalogue.",
  },
  {
    id: "faqs",
    label: "Project FAQs",
    layer: "C",
    words: { min: 300, max: 700 },
    required: true,
    brief: "Project-specific questions. If the answer would fit any project, it is not one of these.",
  },
];

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export const SECTION_SPECS: Record<EditorialPageType, SectionSpec[]> = {
  sector: SECTOR_SECTIONS,
  developer: DEVELOPER_SECTIONS,
  project: PROJECT_SECTIONS,
};

/** Editorial word target for a page type, summed over its Layer C sections.
 *  Reported by the checker as context for the word-count test. */
export function editorialWordTarget(pageType: EditorialPageType): { min: number; max: number } {
  return SECTION_SPECS[pageType]
    .filter((s) => s.layer === "C" && s.words)
    .reduce(
      (acc, s) => ({ min: acc.min + s.words!.min, max: acc.max + s.words!.max }),
      { min: 0, max: 0 }
    );
}

export function sectionSpec(pageType: EditorialPageType, specId: string): SectionSpec | undefined {
  return SECTION_SPECS[pageType].find((s) => s.id === specId);
}

/** Layer C sections a writer must deliver for this page type. */
export function requiredWritableSections(pageType: EditorialPageType): SectionSpec[] {
  return SECTION_SPECS[pageType].filter((s) => s.layer === "C" && s.required);
}

/** The minimum FAQ count the standard names for each page type. */
export const MIN_FAQS: Record<EditorialPageType, number> = {
  sector: 10,
  developer: 15,
  project: 6,
};

/** "Minimum ~2,000 useful words on every important indexable platform page." */
export const MIN_USEFUL_WORDS = 2000;

// ---------------------------------------------------------------------------
// Rollout order — the batches, as declared
// ---------------------------------------------------------------------------

/** Batch 1. Sector hub slugs, in the order they are to be written. */
export const SECTOR_ROLLOUT: string[] = [
  "sector-56", "sector-43", "sector-65", "sector-48", "sector-102",
  "sector-54", "sector-67", "sector-70", "sector-79", "sector-113",
  "sector-37d", "sector-82", "sector-84", "sector-85", "sector-89",
  "sector-92", "sector-99a", "sector-109", "sector-111", "sector-106",
];

/** Batch 2. Developer hub slugs. Ordered by portfolio depth AND commercial
 *  search importance, which is why this is not simply the project-count
 *  ranking — Ansal and Unitech carry more inventory than several entries here
 *  and sit lower because the search demand is not there. */
export const DEVELOPER_ROLLOUT: string[] = [
  "dlf", "m3m", "emaar", "signature-global", "godrej",
  "central-park", "adani", "sobha", "bestech", "bptp",
  "vatika", "ats", "aipl", "conscient", "tulip",
];

/** The two prototypes that define the standard for everything after them. */
export const PROTOTYPES = { sector: "sector-65", developer: "dlf" } as const;
