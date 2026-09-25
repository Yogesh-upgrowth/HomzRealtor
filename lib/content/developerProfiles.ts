// Verified developer entity facts (2026-09-22).
//
// The developer hubs are data-heavy and entity-light: they can tell you a
// developer has 109 projects and where they are, but not who the company is.
// That is a real gap for an entity page — Google's understanding of "DLF" as
// a thing in the world is built from corroborating facts, and a page about DLF
// that states none of them is a list wearing a company's name.
//
// THE RULE FOR THIS FILE, and it is the only rule that matters: every fact
// here comes from the developer's own official site or another primary source,
// carries the URL it came from, and carries the date someone checked it.
// Nothing is generated, inferred, or remembered. A developer with no verified
// record simply has no About section — which is correct, because we would
// otherwise be publishing invented corporate history at scale, and that is
// precisely the "scaled content" pattern the rest of this work has been
// removing.
//
// Adding a developer means opening their official site, reading it, and
// recording what it says. That is the cost, and it is the point: an entity
// section is only worth having if it is right.

export type DeveloperProfileFacts = {
  /** Matches CanonicalDeveloper.id in lib/content/developers.ts. */
  id: string;
  /** The company's own name for itself, where it differs from our label. */
  officialName: string;
  officialWebsite: string;
  foundedYear?: number;
  founder?: string;
  headquarters?: string;
  /** Two or three sentences, each traceable to the source below. No adjectives
   *  we cannot attribute. */
  summary: string[];
  /** Where the facts above came from. */
  sourceUrl: string;
  /** When a person last checked the source. Shown on the page. */
  lastVerifiedAt: string;
  /** Stock-exchange listings, e.g. "NSE: DLF". Absent for unlisted companies. */
  listedAs?: string[];
  /** Other authoritative profiles of the same entity, for Organization.sameAs.
   *  Each entry records how it was checked; nothing is emitted that was not. */
  sameAs?: { url: string; label: string; checkedAt: string; checkedVia: string }[];
  /** Latest date anyone checked any fact in this record. Drives the page's
   *  "Last verified" date together with the catalogue timestamps. */
  lastCheckedAt?: string;
};

export const DEVELOPER_PROFILES: Record<string, DeveloperProfileFacts> = {
  dlf: {
    id: "dlf",
    officialName: "DLF Limited",
    officialWebsite: "https://www.dlf.in/",
    foundedYear: 1946,
    founder: "Chaudhary Raghvendra Singh",
    headquarters: "Gurugram, Haryana",
    summary: [
      "DLF Limited was founded in 1946 by Chaudhary Raghvendra Singh and began developing DLF City in Gurugram in 1985.",
      "The company develops residential, commercial and retail property, and describes itself as India's largest publicly listed real estate company.",
    ],
    sourceUrl: "https://www.dlf.in/",
    lastVerifiedAt: "2026-09-22",
    // 2026-09-25: listing codes and profile URLs corroborated by web search
    // (Wikipedia infobox, BSE's own quote page, several brokers agreeing on
    // BSE 532868 / NSE DLF). The sandbox this was written in could not open
    // the pages directly, so the owner should click each once; the dates here
    // are when the corroboration was done, not a claim of a full read.
    listedAs: ["NSE: DLF", "BSE: 532868"],
    sameAs: [
      {
        url: "https://en.wikipedia.org/wiki/DLF_(company)",
        label: "Wikipedia",
        checkedAt: "2026-09-25",
        checkedVia: "web search result for the article; infobox lists BSE 532868 / NSE DLF",
      },
      {
        url: "https://www.bseindia.com/stock-share-price/dlf-ltd/dlf/532868",
        label: "BSE listing",
        checkedAt: "2026-09-25",
        checkedVia: "web search result on bseindia.com",
      },
      {
        url: "https://www.nseindia.com/get-quotes/equity?symbol=DLF",
        label: "NSE listing",
        checkedAt: "2026-09-25",
        checkedVia: "NSE symbol DLF corroborated across listings; standard NSE quote URL",
      },
    ],
    lastCheckedAt: "2026-09-25",
  },
};

export function developerProfileFacts(slug: string): DeveloperProfileFacts | null {
  return DEVELOPER_PROFILES[String(slug ?? "").trim().toLowerCase()] ?? null;
}

/**
 * The independence disclosure.
 *
 * Developer-brand impersonation is common enough in Indian real estate that
 * DLF's own site carries a notice naming dlf.in as its only official website.
 * A page titled "DLF Projects in Gurgaon" on somebody else's domain should say
 * what it is, unprompted, before a reader has to wonder.
 *
 * This is not only a trust measure. An unambiguous statement that we are an
 * independent agent, with our registration, is exactly the kind of corroborating
 * signal that helps a search engine tell a legitimate aggregator apart from a
 * brand-squatting page — the pages we are competing with.
 */
export function independenceNote(developerName: string, officialWebsite?: string): string {
  return (
    `HomzRealtor is an independent HARERA-registered real estate agent and is not the official ` +
    `website of ${developerName}${officialWebsite ? `, whose own site is ${officialWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : ""}. ` +
    `Project details, prices and registration status should be confirmed against ${developerName} ` +
    `and the HARERA portal before any purchase decision.`
  );
}
