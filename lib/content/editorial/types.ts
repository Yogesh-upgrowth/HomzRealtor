// Homz Content Standard v1 — the data model (2026-09-22).
//
// This is the shape every editorial page on the platform is written into:
// sector hubs first, then developer hubs, then project pages. It exists so
// the page formats stop moving. Once a writer's copy is in this shape it
// renders through the same components forever, and adding the next SEO layer
// (M3M, Adani, Central Park, corridor pages, rental locality pages) means
// filling registries, not rebuilding templates.
//
// THE THREE LAYERS, and which one this file holds.
//
//   Layer A — structured facts. Price, area, status, configuration, developer,
//             sector, RERA, amenities. Already live, from the catalogue feed.
//   Layer B — computed Homz intelligence. Sector medians, developer footprint,
//             price position, ready-vs-UC distribution, budget distribution,
//             corridor concentration. Already live, from lib/intelligence/.
//   Layer C — human editorial analysis. Why Sector 65 has a different buyer
//             profile from Sector 70. Why DLF's Gurgaon portfolio concentrates
//             on certain corridors. What a ₹3 Cr buyer actually faces.
//
// This file models LAYER C ONLY, and that is deliberate. Layers A and B are
// computed and must never be typed in — a median written into a TS file is
// stale the day inventory moves, which is the rule we already enforce in
// lib/content/catalogueStats.ts. Layer C is prose, and prose has an author.
//
// THE AUTHORSHIP RULE, which is the whole reason this file is careful.
//
// The byline "Written by HomzRealtor Editorial Team / Reviewed by HomzRealtor
// Research Team" renders ONLY when a human actually wrote and actually
// reviewed the section. There is no default, no fallback and no way to get
// that byline onto machine-drafted prose: `authorshipByline()` returns null
// for `machine-generated` and returns a different, honest line for
// `human-edited`. Claiming human authorship for generated copy is the exact
// failure mode Google's scaled-content guidance is looking for, and it is
// also just a lie told to a reader deciding where to spend three crore.
//
// SO: an unfilled slot renders NOTHING. A page with no editorial copy is the
// page we have today — good data, thin narrative — and that is a fine state
// to sit in. It is much better than a page that fills the slot with
// generated filler and signs a human's name to it.

// ---------------------------------------------------------------------------
// Claim provenance — workflow Step 5
// ---------------------------------------------------------------------------

/**
 * How a factual claim in the prose is known to be true.
 *
 * Step 5 of the workflow requires every factual claim to carry one of these.
 * They are not decoration: the rubric's 15-point "all factual claims sourced"
 * test is scored from them, and the page's Sources block is rendered from
 * them.
 */
export type ClaimProvenance =
  /** Checked by a person against a primary document, with the date recorded. */
  | "verified"
  /** Computed from HomzRealtor's own catalogue. Cites a Layer B field. */
  | "homz-data"
  /** Stated by an official or primary source at a URL we link. */
  | "official-source"
  /** The writer's own reading of the data. Not a fact claim about the world,
   *  and labelled as opinion so a reader can weigh it as one. */
  | "editorial-observation";

export type EditorialClaim = {
  /** The claim as the prose states it, close enough to find by search. */
  text: string;
  provenance: ClaimProvenance;
  /** Required for `official-source`. The document that says it. */
  sourceUrl?: string;
  /** Human label for the Sources block, e.g. "Haryana RERA project search". */
  sourceLabel?: string;
  /** Required for `verified`. Who checked, and when. */
  verifiedAt?: string;
  verifiedBy?: string;
  /** For `homz-data`: the computed field the number comes from, e.g.
   *  "sector.medianEntryPrice". Names the Layer B source so a reader — and
   *  the checker — can tell a computed figure from a typed one. */
  homzField?: string;
};

// ---------------------------------------------------------------------------
// Authorship — workflow Steps 4 and 7
// ---------------------------------------------------------------------------

/**
 * Who wrote the prose. Three honest states, and no fourth.
 *
 * `human-written` — a named person wrote the narrative from the research
 *   dossier. This is the only state that earns the editorial byline.
 *
 * `human-edited` — machine-drafted, then rewritten and fact-checked by a named
 *   person who stands behind it. This renders a DIFFERENT line that says so.
 *   It is a legitimate state; pretending it is the one above is not.
 *
 * `machine-generated` — drafted without a human rewrite. Renders no byline at
 *   all, and `isPublishable()` refuses it. A page in this state is not
 *   publishable under the standard, full stop.
 */
export type Authorship =
  | {
      kind: "human-written";
      /** The person who wrote it. A real name or a real team, not a persona. */
      writer: string;
      writtenAt: string;
      reviewer?: string;
      reviewedAt?: string;
    }
  | {
      kind: "human-edited";
      /** The person who rewrote and fact-checked the draft. */
      editor: string;
      editedAt: string;
      reviewer?: string;
      reviewedAt?: string;
    }
  | { kind: "machine-generated" };

export type Byline = {
  /** e.g. "Written by Asha Menon" or "Rewritten and fact-checked by …". */
  primary: string;
  /** e.g. "Reviewed by HomzRealtor Research Team, 22 September 2026". */
  secondary?: string;
};

/**
 * The byline to display, or null when there is none to honestly display.
 *
 * This function is the enforcement point for the authorship rule. Nothing else
 * in the codebase constructs a byline string, so there is one place to read to
 * be sure the site never claims a human wrote something a machine did.
 */
export function authorshipByline(authorship: Authorship): Byline | null {
  if (authorship.kind === "machine-generated") return null;

  const reviewed = (reviewer?: string, at?: string) =>
    reviewer ? `Reviewed by ${reviewer}${at ? ` on ${formatDate(at)}` : ""}` : undefined;

  if (authorship.kind === "human-written") {
    return {
      primary: `Written by ${authorship.writer}`,
      secondary: reviewed(authorship.reviewer, authorship.reviewedAt),
    };
  }

  // The honest middle state. It says "drafted from catalogue data" because
  // that is what happened, and names the person who took responsibility for
  // the words. It does not say "written by".
  return {
    primary: `Drafted from HomzRealtor catalogue data, rewritten and fact-checked by ${authorship.editor}`,
    secondary: reviewed(authorship.reviewer, authorship.reviewedAt),
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export type EditorialStatus = "draft" | "in-review" | "published";

/**
 * One narrative section of a page.
 *
 * `specId` binds it to an entry in the frozen section list for its page type
 * (lib/content/editorial/standard.ts). A section with no matching spec is a
 * format drift and the checker reports it — that binding is what "freeze the
 * structure" actually means in code.
 */
export type EditorialSectionContent = {
  specId: string;
  /** Rendered as the section <h2>. Page-specific, not the spec's generic
   *  label — "What Sector 70 is actually like", not "Character". */
  heading: string;
  /** The prose. Markdown. This is the part a human writes. */
  bodyMarkdown: string;
  claims?: EditorialClaim[];
  /** Layer B fields this section cites, e.g. ["medianEntryPrice",
   *  "readyToMoveCount"]. Scored by the rubric's first-party-data test and
   *  the reason that test is checkable at all. */
  usesHomzData?: string[];
  status: EditorialStatus;
};

/**
 * The tradeoffs section, structured rather than prose-only.
 *
 * "Who should consider this / who should not" is one of the standard's
 * differentiating sections and the rubric puts 10 points on it. Grepping prose
 * for the word "however" would be a fake check, so the section declares both
 * sides as data: the checker can then verify that a real disadvantage was
 * actually stated, not merely gestured at.
 */
export type TradeoffContent = {
  suits: string[];
  doesNotSuit: string[];
};

export type EditorialFaq = {
  q: string;
  a: string;
  claims?: EditorialClaim[];
};

// ---------------------------------------------------------------------------
// Provenance — the "About this page's data" block
// ---------------------------------------------------------------------------

/**
 * What the page's footer block declares about its own research.
 *
 * Every field here is a statement the site is making, so every field is
 * required except the two that are legitimately absent on some pages. The
 * catalogue snapshot date is NOT stored here — it is computed at render time
 * from the live data, because a typed snapshot date is a lie the moment the
 * data refreshes.
 */
export type PageProvenanceDeclaration = {
  /** Always an asking price on this platform. Named so the reader sees it
   *  stated rather than inferring it. */
  priceType: "Listed asking price";
  /** What we do and do not claim about transacted prices. */
  transactionsNote: string;
  /** How project status was established. */
  statusSource: string;
  /** The RERA authority whose register was consulted. */
  reraSource: string;
  /** When someone last checked RERA for this page. */
  reraCheckedAt: string;
  /** Where infrastructure/POI facts came from. */
  infrastructureSource: string;
  /** When the editorial content was last reviewed by a person. */
  editorialReviewedAt?: string;
  /** References the page cites, beyond the per-claim source URLs. */
  sources?: { label: string; url: string }[];
};

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

export type EditorialPageType = "sector" | "developer" | "project";

export type EditorialPage = {
  /** Pinned so a future v2 can coexist rather than silently reformat v1 copy. */
  standard: "v1";
  pageType: EditorialPageType;
  /** The slug this attaches to: a sector slug, developer slug or project
   *  slug. How the page finds its copy. */
  key: string;
  sections: EditorialSectionContent[];
  tradeoffs?: TradeoffContent;
  faqs?: EditorialFaq[];
  authorship: Authorship;
  provenance: PageProvenanceDeclaration;
  status: EditorialStatus;
  /** The last recorded rubric score. Written by the checker, read by the
   *  publish gate. Absent means never scored, which is not publishable. */
  review?: { scoredAt: string; score: number };
};

/**
 * Whether a page may render its editorial layer at all.
 *
 * Three gates, all of them the user's own rules:
 *   1. status published — nobody publishes by forgetting to set a flag;
 *   2. a recorded score of 90 or more — "Publish only at 90+";
 *   3. authorship that is not machine-generated — "Do not falsely claim human
 *      authorship if the content wasn't human-written".
 *
 * A page that fails any of these renders exactly what the site renders today:
 * the Layer A and Layer B modules, and no narrative. That is the correct
 * failure mode. Half-published editorial copy on a property page is worse
 * than none.
 */
export function isPublishable(page: EditorialPage | null | undefined): page is EditorialPage {
  if (!page) return false;
  if (page.status !== "published") return false;
  if (page.authorship.kind === "machine-generated") return false;
  if (!page.review) return false;
  return page.review.score >= PUBLISH_SCORE_THRESHOLD;
}

/** "Publish only at 90+." Imported by the rubric and the checker so the
 *  number lives in one place. */
export const PUBLISH_SCORE_THRESHOLD = 90;

/** Sections a reader should see, in the standard's order, on a publishable
 *  page. Unpublished sections are dropped individually — a page can ship with
 *  twelve of sixteen sections written, and the four unwritten ones simply do
 *  not appear. */
export function publishedSections(page: EditorialPage): EditorialSectionContent[] {
  if (!isPublishable(page)) return [];
  return page.sections.filter((s) => s.status === "published" && s.bodyMarkdown.trim().length > 0);
}
