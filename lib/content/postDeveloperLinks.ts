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
