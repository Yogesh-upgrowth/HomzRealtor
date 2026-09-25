// Developers an article actually talks about, linked to their hubs
// (2026-09-22).
//
// The DLF rollout added three hand-written editorial links. That does not
// scale, and hand-written links are the wrong shape for this anyway: the
// articles already name M3M 49 times across 12 files, Emaar 47 across 9,
// Signature Global 44 across 12, Vatika 38 across 12. Adding those by hand
// means ~30 more edits now and a fresh omission every time an article is
// written or revised.
//
// So the links are DERIVED from the article's own prose. A guide that says
// "DLF leads the ₹5 Cr+ bracket with 40 listings" links to the DLF hub because
// it said DLF, not because someone remembered to add a link. Write a new guide
// naming Godrej and it links to Godrej the moment it publishes.
//
// TWO GUARDS, both necessary:
//
//   1. Only developers that actually HAVE a hub. The canonical table can name
//      a builder with zero projects in the catalogue, and /developer/{slug}
//      404s for those — so the live builder list is passed in and matched
//      against, never the name table alone. A derived link that 404s is worse
//      than no link.
//   2. Only a real mention. Matching is on word boundaries against the
//      canonical name and its aliases, so "Max" does not match "maximum" and
//      "Ace" does not match "place". Short names are the whole risk here and
//      the reason this is a word-boundary regex rather than an includes().
//
// Ordered by how much the article talks about each developer, so the block
// reads as "who this guide is about" rather than an alphabetical dump.

export type DeveloperMention = {
  slug: string;
  name: string;
  /** How many times the article names them. Drives the ordering. */
  mentions: number;
};

/** The shape needed from a live builder summary. Structural so callers can
 *  pass getAllBuilders() output straight in. */
export type BuilderLike = { slug: string; name: string; count: number };

/** The shape needed from a post. */
export type PostLike = {
  meta: { h1: string };
  sections: { contentMarkdown: string }[];
  faqs?: { q: string; a: string }[];
  keyTakeaways?: string[];
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A word-boundary matcher for a developer name.
 *
 * `\b` around the whole phrase, so "SS Group" matches "SS Group" but "Max"
 * does not match "maximum" and "Ace" does not match "palace". This is the
 * guard that makes deriving links from prose safe at all — several canonical
 * builder names are ordinary English words or their prefixes.
 */
function mentionCount(haystack: string, name: string): number {
  const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "gi");
  return (haystack.match(re) ?? []).length;
}

function proseOf(post: PostLike): string {
  return [
    post.meta.h1,
    ...post.sections.map((s) => s.contentMarkdown),
    ...(post.faqs ?? []).flatMap((f) => [f.q, f.a]),
    ...(post.keyTakeaways ?? []),
  ].join(" \n ");
}

/**
 * Developers this article names, that have a live hub, most-mentioned first.
 *
 * `minMentions` guards against a single passing reference producing a link
 * block — an article that says "DLF" once in a list of six builders is not
 * about DLF. Two is the default: enough to be a subject rather than an aside.
 */
export function developersMentionedIn(
  post: PostLike,
  builders: BuilderLike[],
  opts: { minMentions?: number; limit?: number } = {}
): DeveloperMention[] {
  const minMentions = opts.minMentions ?? 2;
  const limit = opts.limit ?? 6;
  const prose = proseOf(post);

  const found: DeveloperMention[] = [];
  for (const builder of builders) {
    // A hub with no projects behind it does not render; never link one.
    if (builder.count < 1) continue;
    const mentions = mentionCount(prose, builder.name);
    if (mentions < minMentions) continue;
    found.push({ slug: builder.slug, name: builder.name, mentions });
  }

  return found.sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name)).slice(0, limit);
}

// ─────────────────────────────────────────────── inline first-mention links
//
// Developer-page brief 2026-09-25, §7: thirteen posts name DLF and none linked
// to /developer/dlf. The block above lists the developers an article is about;
// this links the FIRST mention of each one inside the prose itself, at render
// time, so every future post gets it without anyone remembering to.
//
// Rules:
//   - Names come from CANONICAL_DEVELOPERS (canonical name + aliases), and a
//     name links only when its hub is live (present in `builders`).
//   - Case-sensitive, word-bounded: developer names are proper nouns, and
//     "Max", "Ace", "Tata" and "Central Park" must not match ordinary words.
//   - First mention per article, not per section.
//   - Never inside an existing link, inline code, raw HTML or a URL, and never
//     in a heading or table line (headings render as their own elements;
//     tables are data, not prose).

import { CANONICAL_DEVELOPERS } from "./developers";

export type Linkable = { name: string; slug: string; re: RegExp };

const AMBIGUOUS_NAMES = new Set(["Max", "Ace", "Brisk", "Adore", "Pioneer", "Elan", "Saya", "Spaze", "Orris"]);
const COMPANY_WORDS = "Estates?|Group|Developers?|Buildcon|Infra\\w*|Realty|Homes|Limited|Ltd|Urban|Properties";

function linkablesFor(builders: BuilderLike[]): Linkable[] {
  const live = new Set(builders.filter((b) => b.count > 0).map((b) => b.slug));
  const out: Linkable[] = [];
  for (const d of CANONICAL_DEVELOPERS) {
    if (!live.has(d.id)) continue;
    for (const name of [d.canonicalName, ...d.aliases]) {
      if (name.length < 3) continue;
      // Names that are also ordinary words ("Max price", "Ace service") link
      // only when a company word follows them.
      const tail = AMBIGUOUS_NAMES.has(name) ? `(?=\\s+(?:${COMPANY_WORDS}))` : "";
      out.push({ name, slug: d.id, re: new RegExp(`(?<![\\w/-])${escapeRegExp(name)}(?![\\w-])${tail}`) });
    }
  }
  // Longest first, so "Signature Global" wins over "Signature".
  return out.sort((a, b) => b.name.length - a.name.length);
}

const PROTECTED = /\[[^\]]*\]\([^)]*\)|`[^`]*`|<[^>]+>|https?:\/\/\S+/g;

function linkLine(line: string, linkables: Linkable[], seen: Set<string>): string {
  if (/^\s*(#|\|)/.test(line)) return line;
  // Split into [unprotected, protected, unprotected, ...] and only ever edit
  // the unprotected runs.
  const parts: { text: string; locked: boolean }[] = [];
  let last = 0;
  for (const m of line.matchAll(PROTECTED)) {
    parts.push({ text: line.slice(last, m.index), locked: false });
    parts.push({ text: m[0], locked: true });
    last = (m.index ?? 0) + m[0].length;
  }
  parts.push({ text: line.slice(last), locked: false });

  const out: string[] = [];
  for (const part of parts) {
    if (part.locked) {
      out.push(part.text);
      continue;
    }
    // Repeatedly take the earliest mention of any developer not yet linked,
    // emit it as a link, and keep scanning the text after it.
    let rest = part.text;
    for (;;) {
      let best: { l: Linkable; index: number; text: string } | null = null;
      for (const l of linkables) {
        if (seen.has(l.slug)) continue;
        const m = rest.match(l.re);
        if (m && m.index != null && (!best || m.index < best.index)) best = { l, index: m.index, text: m[0] };
      }
      if (!best) break;
      seen.add(best.l.slug);
      out.push(rest.slice(0, best.index), `[${best.text}](/developer/${best.l.slug})`);
      rest = rest.slice(best.index + best.text.length);
    }
    out.push(rest);
  }
  return out.join("");
}

/** A markdown string with the first unseen mention of each live developer
 *  linked. `seen` is shared across calls so the rule is per article. */
export function linkDeveloperMentions(markdown: string, linkables: Linkable[], seen: Set<string>): string {
  if (!markdown || linkables.length === 0) return markdown;
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*```/.test(line)) inFence = !inFence;
      return inFence ? line : linkLine(line, linkables, seen);
    })
    .join("\n");
}

/** Linkables for the live developer set. Build once per render. */
export function developerLinkables(builders: BuilderLike[]): Linkable[] {
  return linkablesFor(builders);
}
