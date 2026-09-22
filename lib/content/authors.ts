// Who writes the editorial content, and who answers for it (2026-09-21).
//
// All 25 posts in lib/content/blog/ carry `author.name: "Homz Realtor
// Editorial Team"` and an author `slug` — but there was no page at that slug,
// so the byline linked nowhere and the schema's own contract for
// `author.profileUrl` ("only set once a genuine published profile page
// exists — never a placeholder", see lib/content/blogPostSchema.ts) could
// never be satisfied. This is that page's data.
//
// WHAT THIS DELIBERATELY DOES NOT DO. Google's guidance for high-stakes
// categories rewards identifiable expertise, and there are now two real named
// people attached to this business — the HARERA-registered proprietor and a
// named advisor. It would be easy, and it would look better, to put one of
// their names on all 25 articles.
//
// That would be a lie. They did not write them. Fabricated authorship on
// financial-advice content is the same category of problem as the
// channel-partner claim that was removed from the FAQs for lack of evidence,
// and inventing a byline to farm an E-E-A-T signal is precisely the behaviour
// the signal exists to detect.
//
// So the page states what is actually true: a named, registered business
// stands behind this analysis, the analysis is computed from a catalogue the
// business owns, and a named human is accountable for it. Accountability is
// not authorship and the copy does not blur them. If real people write or
// review future pieces, give them their own entry here and byline them
// properly — the machinery is ready for it.

import { COMPANY_INFO } from "@/lib/seo/companyInfo";

export type AuthorProfile = {
  slug: string;
  /** Must match `author.name` in the posts exactly — that string is how a
   *  post is matched to this profile. */
  name: string;
  role: string;
  /** schema.org type. "Organization" for a collective byline; a real
   *  individual gets "Person". */
  schemaType: "Organization" | "Person";
  /** Rendered as the page's intro. */
  bio: string[];
  /** How the work is actually produced. The substance of the page — a bio
   *  alone is a claim, a method is checkable. */
  method: string[];
  /** What the byline does not cover. Stated rather than left to inference. */
  limits: string[];
};

export const EDITORIAL_TEAM_SLUG = "homz-realtor-editorial-team";

export const AUTHORS: Record<string, AuthorProfile> = {
  [EDITORIAL_TEAM_SLUG]: {
    slug: EDITORIAL_TEAM_SLUG,
    name: "Homz Realtor Editorial Team",
    role: "Real Estate Research & Content Team",
    schemaType: "Organization",
    bio: [
      `The Homz Realtor editorial team writes the Gurgaon buying, renting and investment guides on this site. It is a collective byline, not a pen name for one person, and it sits on work produced from HomzRealtor's own property catalogue rather than from press releases or republished portal copy.`,
      `The business behind it is a real, registered one. HomzRealtor is the trading name of a sole proprietorship registered in the name of ${COMPANY_INFO.hareraHolder}, who holds HARERA real estate agent registration ${COMPANY_INFO.hararaAgentNumber} and is accountable for what is published here. Both that number and the GST registration ${COMPANY_INFO.gstNumber} can be checked on the issuing authority's own portal.`,
    ],
    method: [
      `Figures come from the catalogue, not from a source we cannot show you. Sector medians, per-sq-ft rates, price bands, delivery mix and RERA coverage are all computed from the listings and projects this site tracks — roughly 21,000 sale listings, 13,000 rentals and 2,098 Gurgaon projects at the time of writing — and they are recomputed as inventory moves rather than typed in once.`,
      `A median needs a base. No rate, median or distribution is published for an area with fewer than four priced records behind it, because a median of two is noise presented as insight. Where the base is thin, the guide says so instead of filling the gap.`,
      `Asking prices are labelled as asking prices. Everything derived from listings reflects what sellers and landlords are currently asking, which is routinely higher than what transacts. No guide on this site presents an asking figure as a transacted one.`,
      `Rates set by government are linked, not quoted. Stamp duty, registration charges and GST change, and vary by buyer. The guides point at the issuing department rather than printing a percentage that may be wrong by the time someone acts on it.`,
      `Every guide carries the date its facts were last verified, and that date is bumped only on an actual review — not on every deploy.`,
    ],
    limits: [
      `This is not legal, tax or investment advice, and nothing here is a substitute for your own lawyer or chartered accountant. Title due diligence in particular is a job for a lawyer you instruct; no agent can do it for you, and any that says otherwise is overstating.`,
      `RERA registration is granted per project and per phase. Where a guide names a registration, confirm it on the Haryana RERA portal against the specific phase you are buying into before any payment.`,
      `Where a guide discusses a project or area HomzRealtor brokers, that is a commercial interest. It does not change the arithmetic, which is computed the same way throughout, but you are entitled to know it.`,
    ],
  },
};

export function authorBySlug(slug: string): AuthorProfile | undefined {
  return AUTHORS[slug];
}

const BY_NAME = new Map(Object.values(AUTHORS).map((a) => [a.name, a]));

/** The profile for a post's `author.name`, when one exists. Matching on the
 *  name rather than the post's own `slug` field keeps the 25 post files
 *  untouched: they already carry the name, and a profile appears the moment
 *  it is added here. */
export function authorByName(name: string): AuthorProfile | undefined {
  return BY_NAME.get(name);
}

/** Canonical profile URL for a post's author, or null when there is no page
 *  for them. Never returns a URL for a profile that does not exist — that is
 *  the rule authorSchema.profileUrl states. */
export function authorProfilePath(name: string): string | null {
  const profile = authorByName(name);
  return profile ? `/author/${profile.slug}` : null;
}
