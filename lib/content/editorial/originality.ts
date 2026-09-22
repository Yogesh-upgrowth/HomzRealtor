// The anti-spinning checks (2026-09-22).
//
// "Sector 65 is one of Gurgaon's most sought-after residential destinations…
//  Sector 70 is one of Gurgaon's most sought-after residential destinations…
//  Sector 79 is one of Gurgaon's most sought-after residential destinations…
//  That isn't unique content. Changing nouns doesn't make it unique."
//
// That is a machine-checkable rule, and this file checks it. Two tests:
//
//   1. BANNED PHRASING. A list of the specific marketing constructions the
//      standard rules out. These are not style preferences — every one of them
//      is a sentence that carries no information and would be equally true of
//      any of 2,098 projects, which is the definition of the filler the
//      standard bans.
//
//   2. CROSS-PAGE SIMILARITY. The real test. Take every page of the same type
//      that is already written, shingle both into overlapping word runs, and
//      report the overlap. Two sector pages that share long runs of text are
//      spun from each other however different the nouns are, because the
//      shingling is done on a noun-blinded copy: sector numbers, developer
//      names, prices and place names are replaced with placeholders BEFORE
//      comparison. "Sector 65 is one of Gurgaon's most sought-after…" and
//      "Sector 70 is one of Gurgaon's most sought-after…" reduce to the same
//      string and score as the duplicate they are.
//
// The noun-blinding is what makes this worth running. A naive diff would find
// those two sentences 90% similar and could be argued down; blinded, they are
// identical, and there is nothing to argue about.

// ---------------------------------------------------------------------------
// Banned phrasing
// ---------------------------------------------------------------------------

export type BannedPhrase = { id: string; re: RegExp; why: string };

export const BANNED_PHRASES: BannedPhrase[] = [
  {
    id: "sought-after-destination",
    re: /\b(most\s+)?sought[- ]after\s+(residential\s+|commercial\s+)?(destination|location|address|area|locality|neighbourhood|neighborhood)s?\b/i,
    why: "The standard's own example of spun copy. True of every sector, therefore about none of them.",
  },
  {
    id: "strategically-located",
    re: /\bstrategically\s+located\b/i,
    why: "Quoted in the standard as banned language. Say where it is and what that means for a commute.",
  },
  {
    id: "world-class",
    re: /\bworld[- ]class\b/i,
    why: "Unverifiable and unattributable. Name the amenity instead.",
  },
  {
    id: "renowned-developer",
    re: /\b(renowned|reputed|reputable|esteemed|illustrious)\s+(developer|builder|real\s?estate)\b/i,
    why: "'XYZ is a renowned developer known for excellence and innovation' is the sentence the standard bans by name.",
  },
  {
    id: "excellence-and-innovation",
    re: /\b(excellence|innovation|quality)\s+and\s+(innovation|excellence|quality|trust)\b/i,
    why: "Brochure filler. Carries no fact a buyer can act on.",
  },
  {
    id: "ideal-investment",
    re: /\b(ideal|perfect|prime|excellent)\s+(investment\s+)?(destination|opportunity|choice)\b/i,
    why: "If every area is an ideal investment destination, the site has no credibility left to spend.",
  },
  {
    id: "industry-experts",
    re: /\baccording\s+to\s+(industry\s+)?(experts|analysts|sources)\b/i,
    why: "An unnamed source is not a source. Cite the document or drop the claim.",
  },
  {
    id: "luxurious-lifestyle",
    re: /\b(luxurious|opulent|lavish)\s+(lifestyle|living|life)\b/i,
    why: "Brochure adjective with nothing behind it.",
  },
  {
    id: "nestled",
    re: /\bnestled\s+(in|amidst|among|within)\b/i,
    why: "Property-brochure register. Give the coordinates' worth of meaning instead.",
  },
  {
    id: "state-of-the-art",
    re: /\bstate[- ]of[- ]the[- ]art\b/i,
    why: "Unverifiable claim about a specification. Name the specification.",
  },
  {
    id: "seamless-connectivity",
    re: /\bseamless\s+(connectivity|access|connection)\b/i,
    why: "The pages carry real distances and drive times. Use them.",
  },
  {
    id: "dream-home",
    re: /\bdream\s+(home|house|property)\b/i,
    why: "Sales copy, not analysis.",
  },
  {
    id: "unmatched-unparalleled",
    re: /\b(unmatched|unparalleled|unrivalled|unrivaled)\b/i,
    why: "A superlative with no comparison set behind it.",
  },
  {
    id: "vibrant-community",
    re: /\bvibrant\s+(community|neighbourhood|neighborhood|locality)\b/i,
    why: "Swappable between any two pages, which is the test that matters.",
  },
  {
    id: "price-prediction",
    // "is/are expected to", "will", "set to" — the auxiliary varies with the
    // subject ("prices are", "the sector is"), so both forms are matched.
    re: /\b(will|(is|are)\s+(expected|likely|poised|set)\s+to|(is|are)\s+set\s+to)\s+(appreciate|rise|surge|skyrocket|double|grow\b)/i,
    why: "The standard allows analysis of present data only. No future price predictions.",
  },
];

export function bannedPhrasesIn(text: string): BannedPhrase[] {
  return BANNED_PHRASES.filter((p) => p.re.test(text));
}

// ---------------------------------------------------------------------------
// Noun-blinding
// ---------------------------------------------------------------------------

/**
 * Replace the nouns a spinner would swap, so two spun paragraphs collapse onto
 * the same string.
 *
 * Order matters here: sector tokens are blinded before bare numbers, or
 * "Sector 65" would become "Sector NUM" in one pass and "SECTOR" in another
 * depending on which rule ran first, and the two would stop matching.
 */
export function blindNouns(text: string): string {
  return text
    .toLowerCase()
    // sector references, with or without a letter suffix
    .replace(/\bsectors?\s*-?\s*\d+\s*[a-z]?\b/g, " SECTOR ")
    // money, in the forms the site writes it
    .replace(/₹\s*[\d.,]+\s*(cr|crore|lakh|lac|l|k)?\b/gi, " MONEY ")
    .replace(/\b[\d.,]+\s*(cr|crore|lakh|lac)\b/gi, " MONEY ")
    // per-square-foot rates
    .replace(/\b[\d.,]+\s*\/?\s*(per\s+)?sq\.?\s*(ft|m|yd|yard|feet)\b/gi, " RATE ")
    // any remaining number
    .replace(/\b\d[\d.,]*\b/g, " NUM ")
    // punctuation and whitespace
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Proper nouns get blinded too, but only the ones we are given.
 *
 * Developer and place names cannot be guessed from the text — "Emaar" and
 * "Elan" look like any other capitalised word — so the caller passes the live
 * builder list and the sector/corridor labels. Word-boundary matching, for the
 * same reason lib/content/postDeveloperLinks.ts uses it: "Max" must not match
 * "maximum".
 */
export function blindNames(text: string, names: string[]): string {
  let out = text;
  for (const name of names) {
    if (!name || name.trim().length < 3) continue;
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, " NAME ");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Shingled similarity
// ---------------------------------------------------------------------------

const SHINGLE = 8;

function shingles(blinded: string, n = SHINGLE): Set<string> {
  const words = blinded.split(" ").filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

export type SimilarityResult = {
  /** 0–1. The share of this page's word runs that also appear on the other. */
  overlap: number;
  /** Up to five of the shared runs, for the report. */
  examples: string[];
};

/**
 * How much of `a` also appears in `b`, after blinding.
 *
 * Asymmetric on purpose: a short page lifted wholesale from a long one should
 * score 1.0 against it, and a symmetric measure (Jaccard) would dilute that to
 * something forgivable. We care whether THIS page is original, not whether the
 * pair is balanced.
 */
export function similarity(a: string, b: string, names: string[] = []): SimilarityResult {
  const sa = shingles(blindNouns(blindNames(a, names)));
  const sb = shingles(blindNouns(blindNames(b, names)));
  if (sa.size === 0) return { overlap: 0, examples: [] };
  const shared: string[] = [];
  for (const s of sa) if (sb.has(s)) shared.push(s);
  return { overlap: shared.length / sa.size, examples: shared.slice(0, 5) };
}

/**
 * The bar. Above this share of shared runs with any sibling page, the copy is
 * treated as spun and the originality test scores zero.
 *
 * 0.15 rather than something tighter because legitimate overlap exists: every
 * sector page carries the same asking-price disclosure, the same RERA caution
 * and the same "confirm the phase before payment" line, and those SHOULD be
 * identical everywhere. Fifteen per cent leaves room for the shared boilerplate
 * and none for a shared argument.
 */
export const SIMILARITY_CEILING = 0.15;

export type OriginalityReport = {
  banned: BannedPhrase[];
  /** Worst sibling overlap, with the key of the page it overlaps. */
  worst: { key: string; overlap: number; examples: string[] } | null;
  passes: boolean;
};

export function checkOriginality(
  text: string,
  siblings: { key: string; text: string }[],
  names: string[] = []
): OriginalityReport {
  const banned = bannedPhrasesIn(text);
  let worst: OriginalityReport["worst"] = null;
  for (const sib of siblings) {
    const { overlap, examples } = similarity(text, sib.text, names);
    if (!worst || overlap > worst.overlap) worst = { key: sib.key, overlap, examples };
  }
  const passes = banned.length === 0 && (!worst || worst.overlap <= SIMILARITY_CEILING);
  return { banned, worst, passes };
}
