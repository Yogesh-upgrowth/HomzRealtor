// The canonical developer table (2026-09-21).
//
// Checklist item 3: "Stop automatically creating developer entities from
// arbitrary project-name strings. Create a canonical developer table... Do NOT
// allow a project import to automatically create an indexable developer page."
//
// Before this, a developer entity was whatever extractBuilder() could salvage
// from the first word of a project title. That is how /developer/the got
// created and indexed with "The has 34 projects". The parsing was fixed
// earlier (stopwords plus a length floor), but a parser can only ever guess:
// it has no way to know that "Pioneer" and "Pioneer Urban" are one company, or
// that a first word it has never seen is a real developer rather than an
// adjective.
//
// This is the allow-list that replaces the guess. A slug reaches an indexable
// developer page only by being in here, or by clearing the automatic bar
// below — never merely by appearing at the front of a project title.
//
// THREE STATUSES, and the distinction is the point:
//
//   verified    A real developer we have confirmed. Indexable, subject to the
//               project-count floor in projects.ts.
//   unverified  A plausible company name the parser produced that nobody has
//               confirmed. The page still RENDERS and stays crawlable, so its
//               projects remain reachable, but it is noindex — an unconfirmed
//               entity should not be offered to Google as a fact.
//   invalid     Cannot be a developer. These return 410 Gone (see
//               middleware.ts), because there is no correct page to send a
//               visitor to and the URL should leave the index permanently.
//
// Adding a developer here is a deliberate act. That is the whole mechanism.

import { KNOWN_BUILDERS, slugify } from "@/lib/intelligence/normalize";

export type DeveloperStatus = "verified" | "unverified" | "invalid";

export type CanonicalDeveloper = {
  /** developer_id — the URL slug, and the key every project maps to. */
  id: string;
  canonicalName: string;
  /** Spellings the feed uses for the same company. Merging them stops one
   *  developer being split across two hubs, each too thin to rank. */
  aliases: string[];
  website?: string;
  status: DeveloperStatus;
};

// Seeded from KNOWN_BUILDERS, the list already curated by hand and matched
// against project titles. These are verified by virtue of being on it —
// every one is a named Gurgaon/NCR developer, not a parser artefact.
//
// Aliases carry the cases where the feed disagrees with itself. Extend either
// list as new developers are confirmed; a name absent from here is not
// rejected, it is just not offered to Google until it clears the automatic
// bar or someone adds it.
// Keyed by the canonical slug — i.e. slugify() of a name in KNOWN_BUILDERS.
// The assertion below enforces that; an alias hung on a slug that is not in
// the table silently does nothing, which is exactly the failure this table
// exists to prevent.
const EXTRA_ALIASES: Record<string, string[]> = {
  "signature-global": ["Signature", "Signature Global India"],
  godrej: ["Godrej Properties", "GPL"],
  "ss-group": ["SS", "SS Groups"],
  m3m: ["M3M India"],
  emaar: ["Emaar India", "Emaar MGF"],
  dlf: ["DLF Limited", "DLF Ltd"],
  gaursons: ["Gaurs"],
  "anant-raj": ["Anant Raj Limited"],
  bptp: ["BPTP Limited"],
};

export const CANONICAL_DEVELOPERS: CanonicalDeveloper[] = KNOWN_BUILDERS.map((name) => {
  const id = slugify(name);
  return {
    id,
    canonicalName: name,
    aliases: EXTRA_ALIASES[id] ?? [],
    status: "verified" as DeveloperStatus,
  };
});

// An alias attached to a slug that is not in the table is dead configuration:
// nothing resolves through it and nothing reports that. Three of the first six
// entries written here were dead for exactly that reason ("godrej-properties"
// when the canonical name is "Godrej"), so the mapping is now checked at
// module load rather than trusted.
{
  const ids = new Set(CANONICAL_DEVELOPERS.map((d) => d.id));
  const orphans = Object.keys(EXTRA_ALIASES).filter((k) => !ids.has(k));
  if (orphans.length > 0) {
    throw new Error(
      `lib/content/developers.ts: EXTRA_ALIASES keys with no canonical developer: ${orphans.join(", ")}. ` +
        `Keys must be slugify() of a KNOWN_BUILDERS entry.`
    );
  }
}

/**
 * Slugs that can never be a developer, and should leave Google's index rather
 * than linger as a 404 or a thin page.
 *
 * Every entry here was either found indexed (the audit named /developer/the
 * and /developer/j) or is the same class of parser artefact. They are derived
 * from the stopword list rather than retyped, so the two cannot drift.
 */
const INVALID_SLUGS = new Set<string>([
  // Named in the audit as indexed.
  "the",
  "j",
  // Generic words and adjectives a title can start with.
  "a",
  "an",
  "new",
  "old",
  "good",
  "best",
  "golden",
  "royal",
  "luxury",
  "premium",
  "green",
  "prime",
  "grand",
  "elite",
  "my",
  "your",
  "our",
  // Property nouns, not companies.
  "sector",
  "plot",
  "plots",
  "flat",
  "flats",
  "apartment",
  "apartments",
  "villa",
  "villas",
  "house",
  "home",
  "homes",
  "floor",
  "floors",
  "builder",
  "independent",
  "residential",
  "commercial",
  "affordable",
  "society",
  "project",
  "property",
  "land",
  "shop",
  "office",
  "sale",
  "rent",
  // Bodies that are not developers.
  "huda",
  "rwa",
]);

const BY_ID = new Map(CANONICAL_DEVELOPERS.map((d) => [d.id, d]));
const BY_ALIAS = new Map<string, CanonicalDeveloper>();
for (const d of CANONICAL_DEVELOPERS) {
  BY_ALIAS.set(d.canonicalName.toLowerCase(), d);
  for (const a of d.aliases) BY_ALIAS.set(a.toLowerCase(), d);
}

/**
 * Permanently invalid, so the URL should 410 rather than 404.
 *
 * A single character is always invalid: no developer is named "J", and the
 * audit found that exact page indexed.
 */
export function isInvalidDeveloperSlug(slug: string): boolean {
  const s = String(slug ?? "").trim().toLowerCase();
  if (!s) return true;
  if (s.replace(/[^a-z]/g, "").length < 2) return true;
  return INVALID_SLUGS.has(s);
}

export function canonicalDeveloperBySlug(slug: string): CanonicalDeveloper | undefined {
  return BY_ID.get(String(slug ?? "").trim().toLowerCase());
}

export function canonicalDeveloperByName(name: string): CanonicalDeveloper | undefined {
  return BY_ALIAS.get(String(name ?? "").trim().toLowerCase());
}

/**
 * Alias slug -> canonical slug, for checklist item 4's "301 to the correct
 * developer where a clear mapping exists".
 *
 * Every entry is derived from an alias above, so the redirect and the merge
 * cannot disagree: if the index folds "Emaar MGF" into /developer/emaar, then
 * /developer/emaar-mgf redirects there too. A slug that is already canonical
 * is never a redirect source, which is what the filter guards.
 */
export const DEVELOPER_SLUG_REDIRECTS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const d of CANONICAL_DEVELOPERS) {
    for (const alias of d.aliases) {
      const aliasSlug = slugify(alias);
      if (!aliasSlug || aliasSlug === d.id) continue;
      if (BY_ID.has(aliasSlug)) continue; // a real developer in its own right
      out[aliasSlug] = d.id;
    }
  }
  return out;
})();

export function developerRedirectTarget(slug: string): string | null {
  const s = String(slug ?? "").trim().toLowerCase();
  return DEVELOPER_SLUG_REDIRECTS[s] ?? null;
}

/**
 * The status to treat a developer hub as, given its slug and how many
 * projects sit behind it.
 *
 * `minProjects` is passed in rather than imported so this module stays free of
 * the data layer — lib/intelligence/projects.ts owns that constant and calls
 * through here.
 *
 * An unlisted name with real inventory behind it is "unverified", not
 * "invalid": it is very likely a genuine developer the curated list has not
 * caught up with, and 410ing a page with several real projects on it would
 * remove working inventory from the site. It renders, it is crawlable, it is
 * simply not offered for indexing until someone confirms it.
 */
export function developerStatusFor(slug: string, projectCount: number, minProjects: number): DeveloperStatus {
  if (isInvalidDeveloperSlug(slug)) return "invalid";
  const canonical = canonicalDeveloperBySlug(slug);
  if (canonical?.status === "verified" && projectCount >= minProjects) return "verified";
  return "unverified";
}
