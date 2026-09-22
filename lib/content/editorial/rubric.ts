// The content quality score (2026-09-22).
//
// "Before any rewritten page publishes, score it out of 100. Publish only at
// 90+. Word count is intentionally only 5 points."
//
// The eleven tests and their point values below are the standard's, unchanged.
// What this file adds is making them CHECKABLE, which is the only way a score
// out of 100 means anything. A rubric that is filled in by the person who
// wrote the page scores what they think they did; a rubric computed from the
// page's own declared data scores what is actually there.
//
// Nine of the eleven are computed. Two cannot be and are attested:
//
//   - "Human editorial review" is a fact about a person, so it is read from
//     the page's `authorship` block. It cannot be faked into existence by the
//     checker, and if it is faked into the data then the site is lying about
//     authorship, which is a different and much bigger problem than a score.
//   - "All factual claims sourced" is computed from the declared claims, which
//     means it measures whether the DECLARED claims are sourced. A writer who
//     declares no claims scores zero rather than full marks — see the note on
//     that test — but nothing here can tell that an undeclared sentence was a
//     factual claim. That is what workflow Step 5 is for, and the score is not
//     a substitute for it.
//
// The scoring is proportional wherever proportional makes sense, because an
// all-or-nothing score at 90+ would mean one unsourced claim costs 15 points
// and fails the page. The point of the gate is to stop weak pages publishing,
// not to make the gate impassable.

import {
  MIN_FAQS,
  MIN_USEFUL_WORDS,
  editorialWordTarget,
  requiredWritableSections,
  sectionSpec,
} from "./standard";
import { checkOriginality, SIMILARITY_CEILING } from "./originality";
import { PUBLISH_SCORE_THRESHOLD, type EditorialPage } from "./types";

export { PUBLISH_SCORE_THRESHOLD };

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

/**
 * The page's prose, as a reader meets it.
 *
 * Markdown syntax, link targets and image references are stripped, because a
 * word count that counts URLs is a word count that can be inflated with links.
 * Headings count — a writer's heading is prose a reader reads.
 */
export function proseOf(page: EditorialPage): string {
  const parts: string[] = [];
  for (const s of page.sections) {
    parts.push(s.heading);
    parts.push(s.bodyMarkdown);
  }
  if (page.tradeoffs) parts.push(...page.tradeoffs.suits, ...page.tradeoffs.doesNotSuit);
  for (const f of page.faqs ?? []) parts.push(f.q, f.a);
  return parts.join("\n\n");
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[>#\-*+\s]+/gm, " ")
    .replace(/[*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(md: string): number {
  const text = stripMarkdown(md);
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => /[a-zA-Z0-9₹]/.test(w)).length;
}

/** Markdown links in the prose, as [text](href) pairs. */
export function linksIn(md: string): { text: string; href: string }[] {
  const out: { text: string; href: string }[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) out.push({ text: m[1], href: m[2] });
  return out;
}

/** The route prefixes an internal editorial link is allowed to point at.
 *  Anything else is either a typo or a link into a route family that does not
 *  exist, and both render as a 404 in a paragraph a human wrote. */
export const ALLOWED_LINK_PREFIXES = [
  "/project-listing/",
  "/buy-property/",
  "/rent-property/",
  "/commercial",
  "/developer/",
  "/blog/",
  "/property-insights/",
  "/property-rates-in-gurgaon",
  "/gurgaon-property-index",
  "/homz-investment-score-methodology",
  "/author/",
  "/contact",
  "/about",
  "/faq",
];

/** Internal links must be at least this many before the test scores full
 *  marks. Below it the page is a dead end in the internal graph, which is a
 *  ranking problem regardless of how good the prose is. */
export const MIN_INTERNAL_LINKS = 8;

// ---------------------------------------------------------------------------
// The rubric
// ---------------------------------------------------------------------------

export type RubricContext = {
  /** Other written pages of the same type, for the originality test. Pass all
   *  of them; the test takes the worst pairing. */
  siblings?: { key: string; text: string }[];
  /** Developer and place names to blind before comparing. */
  names?: string[];
};

export type TestResult = {
  id: string;
  label: string;
  max: number;
  points: number;
  /** Why it scored what it scored. Read by the checker's report — a score with
   *  no reason attached cannot be acted on. */
  note: string;
  scoring: "computed" | "attested";
};

type Test = {
  id: string;
  label: string;
  max: number;
  scoring: "computed" | "attested";
  run: (page: EditorialPage, ctx: RubricContext) => { points: number; note: string };
};

const pct = (fraction: number, max: number) => Math.round(Math.max(0, Math.min(1, fraction)) * max);

export const RUBRIC_TESTS: Test[] = [
  // ---------------------------------------------------------------- 15 pts
  {
    id: "claims-sourced",
    label: "All factual claims sourced",
    max: 15,
    scoring: "computed",
    run: (page) => {
      const claims = [
        ...page.sections.flatMap((s) => s.claims ?? []),
        ...(page.faqs ?? []).flatMap((f) => f.claims ?? []),
      ];
      // No declared claims is not a clean sheet. A 2,500-word market analysis
      // that declares nothing to check has not been through Step 5 at all,
      // and scoring it 15/15 would reward skipping the step.
      if (claims.length === 0) {
        return { points: 0, note: "No claims declared. Step 5 marks every factual claim; none are recorded." };
      }
      const bad: string[] = [];
      for (const c of claims) {
        if (c.provenance === "official-source" && !c.sourceUrl) {
          bad.push(`official-source claim with no sourceUrl: "${c.text.slice(0, 60)}"`);
        }
        if (c.provenance === "verified" && !c.verifiedAt) {
          bad.push(`verified claim with no verifiedAt: "${c.text.slice(0, 60)}"`);
        }
        if (c.provenance === "homz-data" && !c.homzField) {
          bad.push(`homz-data claim naming no computed field: "${c.text.slice(0, 60)}"`);
        }
      }
      const ok = claims.length - bad.length;
      return {
        points: pct(ok / claims.length, 15),
        note:
          bad.length === 0
            ? `${claims.length} claims, all carrying a provenance and a source.`
            : `${ok}/${claims.length} claims complete. ${bad.slice(0, 3).join("; ")}${bad.length > 3 ? ` (+${bad.length - 3} more)` : ""}`,
      };
    },
  },

  // ---------------------------------------------------------------- 15 pts
  {
    id: "homz-first-party",
    label: "Homz first-party data used",
    max: 15,
    scoring: "computed",
    run: (page) => {
      const fields = new Set(page.sections.flatMap((s) => s.usesHomzData ?? []));
      const sectionsCiting = page.sections.filter((s) => (s.usesHomzData ?? []).length > 0).length;
      const writable = page.sections.filter(
        (s) => sectionSpec(page.pageType, s.specId)?.layer === "C"
      ).length;
      if (writable === 0) return { points: 0, note: "No Layer C sections written." };
      // Two halves: breadth of distinct computed fields cited, and how much of
      // the page leans on them at all. A page that cites eight fields in one
      // section and nothing anywhere else is a data table with an essay
      // attached, not an analysis of our data.
      const breadth = pct(fields.size / 8, 8);
      const spread = pct(sectionsCiting / writable, 7);
      return {
        points: breadth + spread,
        note: `${fields.size} distinct computed fields cited across ${sectionsCiting}/${writable} written sections.`,
      };
    },
  },

  // ---------------------------------------------------------------- 15 pts
  {
    id: "unique-analysis",
    label: "Unique local analysis",
    max: 15,
    scoring: "computed",
    run: (page, ctx) => {
      const text = proseOf(page);
      const report = checkOriginality(text, ctx.siblings ?? [], ctx.names ?? []);
      if (report.banned.length > 0) {
        return {
          points: 0,
          note: `Banned phrasing: ${report.banned.map((b) => b.id).join(", ")}.`,
        };
      }
      const overlap = report.worst?.overlap ?? 0;
      if (overlap > SIMILARITY_CEILING) {
        return {
          points: 0,
          note: `${Math.round(overlap * 100)}% of this page's word runs also appear on ${report.worst!.key} (ceiling ${Math.round(SIMILARITY_CEILING * 100)}%). Spun copy.`,
        };
      }
      // Below the ceiling, score the margin: a page at 14% overlap is closer
      // to a sibling than one at 2%, and the difference is worth saying.
      const margin = 1 - overlap / SIMILARITY_CEILING;
      return {
        points: pct(0.6 + 0.4 * margin, 15),
        note: report.worst
          ? `No banned phrasing. Worst sibling overlap ${Math.round(overlap * 100)}% (${report.worst.key}).`
          : "No banned phrasing. No sibling pages to compare against yet.",
      };
    },
  },

  // ---------------------------------------------------------------- 10 pts
  {
    id: "buyer-questions",
    label: "Buyer questions answered",
    max: 10,
    scoring: "computed",
    run: (page) => {
      const faqs = page.faqs ?? [];
      const min = MIN_FAQS[page.pageType];
      const answered = faqs.filter((f) => wordCount(f.a) >= 25).length;
      return {
        points: pct(answered / min, 10),
        note: `${answered} substantively answered questions against a minimum of ${min}${faqs.length !== answered ? ` (${faqs.length - answered} answered in under 25 words)` : ""}.`,
      };
    },
  },

  // ---------------------------------------------------------------- 10 pts
  {
    id: "tradeoffs",
    label: "Real disadvantages and tradeoffs included",
    max: 10,
    scoring: "computed",
    run: (page) => {
      const t = page.tradeoffs;
      if (!t) return { points: 0, note: "No tradeoffs declared." };
      const suits = t.suits.filter((s) => s.trim().length > 20).length;
      const not = t.doesNotSuit.filter((s) => s.trim().length > 20).length;
      if (not === 0) {
        return {
          points: 0,
          note: "No disadvantages stated. Every place has them; a page that lists none is selling, not analysing.",
        };
      }
      // Weighted toward the "does not suit" side deliberately. The positive
      // list writes itself; the negative one is the section's whole value.
      return {
        points: pct(suits / 3, 4) + pct(not / 3, 6),
        note: `${suits} suitability points, ${not} stated disadvantages.`,
      };
    },
  },

  // ---------------------------------------------------------------- 10 pts
  {
    id: "pricing-methodology",
    label: "Current pricing methodology disclosed",
    max: 10,
    scoring: "computed",
    run: (page) => {
      const p = page.provenance;
      const misses: string[] = [];
      if (p.priceType !== "Listed asking price") misses.push("priceType not declared as asking");
      if (!p.transactionsNote?.trim()) misses.push("no transactions note");
      if (!p.statusSource?.trim()) misses.push("no status source");
      // And the prose has to say it too, not only the footer block.
      const prose = stripMarkdown(proseOf(page)).toLowerCase();
      const saysAsking = /asking price/.test(prose);
      if (!saysAsking) misses.push("the prose never says 'asking price'");
      return {
        points: pct((4 - misses.length) / 4, 10),
        note: misses.length === 0 ? "Asking-price basis declared in the provenance block and stated in the prose." : misses.join("; "),
      };
    },
  },

  // ----------------------------------------------------------------- 5 pts
  {
    id: "internal-links",
    label: "Internal links correct",
    max: 5,
    scoring: "computed",
    run: (page) => {
      const links = page.sections.flatMap((s) => linksIn(s.bodyMarkdown));
      const internal = links.filter((l) => l.href.startsWith("/"));
      const bad = internal.filter(
        (l) => !ALLOWED_LINK_PREFIXES.some((p) => l.href.startsWith(p))
      );
      if (bad.length > 0) {
        return {
          points: 0,
          note: `${bad.length} link(s) point outside every known route family: ${bad.slice(0, 3).map((l) => l.href).join(", ")}.`,
        };
      }
      return {
        points: pct(internal.length / MIN_INTERNAL_LINKS, 5),
        note: `${internal.length} internal links against a target of ${MIN_INTERNAL_LINKS}, all on known routes.`,
      };
    },
  },

  // ----------------------------------------------------------------- 5 pts
  {
    id: "rera-status",
    label: "RERA and status checked",
    max: 5,
    scoring: "computed",
    run: (page) => {
      const p = page.provenance;
      if (!p.reraSource?.trim() || !p.reraCheckedAt?.trim()) {
        return { points: 0, note: "No RERA source or check date declared." };
      }
      // "This developer is RERA approved" is conceptually wrong — registration
      // is granted per project and per phase — and it is the specific error
      // the standard calls out, so it fails the test outright.
      const prose = stripMarkdown(proseOf(page));
      const wrong = /\b[A-Z][A-Za-z&. ]{2,30}\s+is\s+RERA[- ]?(approved|registered|certified)\b/.test(prose);
      if (wrong) {
        return {
          points: 0,
          note: "Prose claims a developer or project is 'RERA approved' as a blanket fact. Registration is per project and per phase.",
        };
      }
      return { points: 5, note: `RERA checked against ${p.reraSource} on ${p.reraCheckedAt}.` };
    },
  },

  // ----------------------------------------------------------------- 5 pts
  {
    id: "no-copied-content",
    label: "No competitor or copied content",
    max: 5,
    scoring: "computed",
    run: (page, ctx) => {
      const text = proseOf(page);
      const report = checkOriginality(text, ctx.siblings ?? [], ctx.names ?? []);
      const competitors = COMPETITOR_NAMES.filter((n) =>
        new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)
      );
      if (competitors.length > 0) {
        return { points: 0, note: `Names a competitor portal: ${competitors.join(", ")}.` };
      }
      if (report.banned.length > 0) {
        return { points: 0, note: `Banned phrasing present: ${report.banned.map((b) => b.id).join(", ")}.` };
      }
      return { points: 5, note: "No competitor content and no banned phrasing." };
    },
  },

  // ----------------------------------------------------------------- 5 pts
  {
    id: "human-review",
    label: "Human editorial review",
    max: 5,
    scoring: "attested",
    run: (page) => {
      const a = page.authorship;
      if (a.kind === "machine-generated") {
        return { points: 0, note: "Machine-generated. Not publishable under the standard at any score." };
      }
      const reviewer = a.reviewer;
      const author = a.kind === "human-written" ? a.writer : a.editor;
      if (!author?.trim()) return { points: 0, note: "No writer or editor named." };
      if (!reviewer?.trim()) {
        return { points: 3, note: `Written by ${author}, but no second reviewer recorded.` };
      }
      return { points: 5, note: `${author}, reviewed by ${reviewer}.` };
    },
  },

  // ----------------------------------------------------------------- 5 pts
  {
    id: "word-count",
    label: "2,000+ useful words",
    max: 5,
    scoring: "computed",
    run: (page) => {
      const words = wordCount(proseOf(page));
      const target = editorialWordTarget(page.pageType);
      return {
        points: words >= MIN_USEFUL_WORDS ? 5 : pct(words / MIN_USEFUL_WORDS, 5),
        note: `${words} words (minimum ${MIN_USEFUL_WORDS}; section targets sum to ${target.min}–${target.max}).`,
      };
    },
  },
];

/** Portal names that must never appear in our own copy. Kept here rather than
 *  imported from lib/intelligence/dataQuality so this module stays free of the
 *  scraping types and can run in the checker without the feed. */
export const COMPETITOR_NAMES = [
  "Square Yards",
  "SquareYards",
  "Housing.com",
  "Magicbricks",
  "MagicBricks",
  "99acres",
  "NoBroker",
  "PropTiger",
  "CommonFloor",
  "Makaan",
];

export type RubricScore = {
  total: number;
  max: number;
  passes: boolean;
  tests: TestResult[];
  /** Required Layer C sections with nothing written in them yet. Not scored —
   *  a missing section shows up in the word count and the FAQ count already —
   *  but reported, because it is what the writer does next. */
  missingSections: string[];
};

export function scoreEditorialPage(page: EditorialPage, ctx: RubricContext = {}): RubricScore {
  const tests: TestResult[] = RUBRIC_TESTS.map((t) => {
    const { points, note } = t.run(page, ctx);
    return { id: t.id, label: t.label, max: t.max, points, note, scoring: t.scoring };
  });
  const total = tests.reduce((n, t) => n + t.points, 0);
  const max = RUBRIC_TESTS.reduce((n, t) => n + t.max, 0);

  const written = new Set(
    page.sections.filter((s) => s.bodyMarkdown.trim().length > 0).map((s) => s.specId)
  );
  const missingSections = requiredWritableSections(page.pageType)
    .filter((s) => !written.has(s.id))
    .map((s) => s.id);

  return { total, max, passes: total >= PUBLISH_SCORE_THRESHOLD, tests, missingSections };
}

/** Section ids written against no spec in the frozen standard. Format drift,
 *  reported separately from the score because it is a structural problem
 *  rather than a quality one. */
export function unknownSections(page: EditorialPage): string[] {
  return page.sections
    .filter((s) => !sectionSpec(page.pageType, s.specId))
    .map((s) => s.specId);
}
