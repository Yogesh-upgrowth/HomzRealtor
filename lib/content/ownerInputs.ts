// The single list of everything HomzRealtor has to supply (2026-09-19).
//
// The 19 Sep audit scored five areas: Technical 80, Architecture 45, Content
// originality 20, Trust and local 15, Authority 5. Code can move the first
// three a long way on its own. The last two are mostly not code: they need
// real business facts, real media, and real relationships that only Homz can
// provide, and inventing any of them would be worse than leaving them blank.
//
// So this file is the handover. Every item below is a fact the site is already
// wired to consume: fill the value in the named place and it takes effect on
// the next deploy, with no further code change. `npm run check:owner-inputs`
// prints what is still outstanding, grouped by the score it unblocks.
//
// Nothing here is a guess or a sample value. Where a format matters, the item
// shows the shape, not a plausible-looking fake.

export type ScoreArea =
  | "Technical"
  | "Architecture"
  | "Content originality"
  | "Trust and local"
  | "Authority";

export type OwnerInput = {
  /** Stable key, also used as the [[owner-input: ...]] marker in code. */
  key: string;
  /** Which audit score this unblocks. */
  area: ScoreArea;
  /** What is needed, in plain words. */
  need: string;
  /** Exactly where the value goes. */
  lands: string;
  /** The shape expected, when format matters. Never a fake value. */
  shape?: string;
  /** Why it matters — kept short and specific. */
  why: string;
  /** true once the value is actually in the codebase. */
  done: boolean;
  /** Something Homz must do outside this repo (claim a profile, take photos). */
  offRepo?: boolean;
};

// Kept as a plain literal rather than computed from COMPANY_INFO so this file
// stays readable as a checklist and reviewable in a PR. check-owner-inputs.mjs
// cross-checks the `done` flags against the real values.
export const OWNER_INPUTS: OwnerInput[] = [
  // ---------------------------------------------------------------- Trust
  {
    key: "identity.legalName",
    area: "Trust and local",
    need: "The registered legal entity operating HomzRealtor, and its relationship to the brand",
    lands: "lib/seo/companyInfo.ts → legalName",
    shape: '"Acme Realty Services Pvt Ltd"',
    why: "Organization schema, footer and /contact all currently omit it. Google cannot verify an unnamed operator in a YMYL category.",
    done: false,
  },
  {
    key: "identity.hareraAgentNumber",
    area: "Trust and local",
    need: "HARERA agent / channel-partner registration number",
    lands: "lib/seo/companyInfo.ts → hararaAgentNumber",
    shape: '"HARERA/GGM/XXXX/2026"',
    why: "A visible RERA registration is the single strongest trust signal in Indian real estate and is already wired into Organization.identifier.",
    done: false,
  },
  {
    key: "identity.gst",
    area: "Trust and local",
    need: "GST number, if the business is registered",
    lands: "lib/seo/companyInfo.ts → gstNumber",
    why: "Shown in the footer alongside the legal name. Omit if genuinely not registered — do not invent one.",
    done: false,
  },
  {
    key: "identity.officeAddress",
    area: "Trust and local",
    need: "Registered or operating address, if one exists",
    lands: "lib/seo/companyInfo.ts → officeAddress (+ geo, mapEmbedUrl)",
    why: "PostalAddress and geo only render as a pair. A service-area business with no premises should say so rather than invent an address — Google's service-area rules allow that.",
    done: false,
  },
  {
    key: "identity.hours",
    area: "Trust and local",
    need: "Actual contactable hours, matching the Google Business Profile exactly",
    lands: "lib/seo/companyInfo.ts → hours (display) and openingHours (schema)",
    shape: '{ days: ["Mo","Tu","We","Th","Fr","Sa"], opens: "10:00", closes: "19:00" }',
    why: "openingHoursSpecification is reconciled against the profile. A mismatch is worse than an omission.",
    done: false,
  },
  {
    key: "identity.googleBusinessUrl",
    area: "Trust and local",
    need: "The public URL of the Google Business Profile you created",
    lands: "lib/seo/companyInfo.ts → social.googleBusiness",
    shape: "the g.page or Maps share link, e.g. https://g.page/...",
    why: "Wired into Organization.sameAs and hasMap. The profile exists but nothing on the site points at it, so the entity and the profile are not yet connected.",
    done: false,
  },
  {
    key: "identity.socials",
    area: "Trust and local",
    need: "Controlled social profile URLs (Instagram, Facebook, LinkedIn, YouTube, Justdial)",
    lands: "lib/seo/companyInfo.ts → social.*",
    why: 'sameAs disambiguates this brand from the other "Homz" entities (HOMZ Real Estate CA, Houzz, the HOMZ ETF). Only list profiles Homz actually controls.',
    done: false,
  },
  {
    key: "identity.team",
    area: "Trust and local",
    need: "One or more real, named advisors with their roles",
    lands: "lib/seo/companyInfo.ts → team[]",
    shape: '[{ name: "...", role: "Principal Advisor", reraId: "..." }]',
    why: "A high-stakes purchase site with no human attached is an E-E-A-T gap. Renders as Organization.employee and can then byline content.",
    done: false,
  },
  {
    key: "identity.napConsistency",
    area: "Trust and local",
    need: "Identical name, address and phone on Justdial, Sulekha, IndiaMART, and the agent profiles on 99acres / MagicBricks / Housing",
    lands: "off-repo — the directories themselves",
    why: "Citation consistency is what a map-pack ranking is built on. Any variation in the NAP string weakens all of them.",
    done: false,
    offRepo: true,
  },
  {
    key: "identity.reviews",
    area: "Trust and local",
    need: "A habit of requesting a Google review after every closed deal",
    lands: "off-repo — the Google Business Profile",
    why: "Review count and recency are direct local-ranking factors. Do not add review schema to the site for reviews collected elsewhere.",
    done: false,
    offRepo: true,
  },

  // ------------------------------------------------- Content originality
  {
    key: "content.ownerCallLog",
    area: "Content originality",
    need: 'A source of truth for "an advisor confirmed this unit with the owner on this date"',
    lands: "lib/status/verification.ts → OWNER_CALL_LOG_SOURCE + readOwnerCallLog()",
    shape: "sheet | mongo | crm — columns: homz_listing_id, called_at, outcome, confirmed_price, agent",
    why: 'Every detail page is wired to show "Confirmed with the owner on X". Until this exists it honestly shows only "listing last checked", which is a much weaker claim.',
    done: false,
  },
  {
    key: "content.ownPhotography",
    area: "Content originality",
    need: "Own photographs for the top-traffic ~5% of listings",
    lands: "Vercel Blob via the existing agent upload path; referenced per listing",
    why: "Every image on the site is currently hotlinked from Square Yards or MagicBricks. That is the most visible way a page reads as republished, and the links can be cut at any time.",
    done: false,
    offRepo: true,
  },
  {
    key: "content.builderImagery",
    area: "Content originality",
    need: "Builder/project imagery with written permission, for the remaining listings",
    lands: "same upload path; plus a written rights record",
    why: "Self-hosting does not create a licence. Moving an image to Homz's domain without permission changes the legal exposure, it does not remove it.",
    done: false,
    offRepo: true,
  },
  {
    key: "content.brokerageTerms",
    area: "Content originality",
    need: "The brokerage terms shown on every detail page",
    lands: "components/PropertyListing/HomzRecordSections.tsx (currently states no buyer/tenant viewing fee)",
    why: "The page asserts a fee position today. Confirm it is accurate, or correct it — an inaccurate fee claim is a consumer-facing problem, not an SEO one.",
    done: false,
  },

  // ------------------------------------------------------------ Authority
  {
    key: "authority.gscAccess",
    area: "Authority",
    need: "Search Console access, plus Performance (query + page, India, 12 months), Page indexing and per-segment Sitemaps exports",
    lands: "off-repo — share the exports",
    why: "Nothing about rankings, indexed counts or link profile can be measured without it. Every claim of progress is otherwise a guess.",
    done: false,
    offRepo: true,
  },
  {
    key: "authority.linkTargets",
    area: "Authority",
    need: "Real relationships that can earn a link: builders Homz is an authorised channel partner for, local associations, RWAs, press contacts",
    lands: "off-repo",
    why: "Authority scored 5/100. It is earned, not built — no code change moves it, and buying links actively risks the domain.",
    done: false,
    offRepo: true,
  },
  {
    key: "authority.channelPartnerProof",
    area: "Authority",
    need: "The list of projects Homz is a genuinely authorised channel partner for, with proof",
    lands: "a data file, once supplied — drives an authorised-partner badge and prioritised indexing",
    why: "This is the strongest differentiator available and is currently unstated anywhere on the site.",
    done: false,
  },

  // ---------------------------------------------------------- Technical
  {
    key: "technical.vercelPlan",
    area: "Technical",
    need: "Confirm the Vercel plan",
    lands: "off-repo — Vercel dashboard",
    why: "Deploys were frozen 18-19 Sep because Hobby rejects sub-daily crons (now fixed). Hobby is also limited to non-commercial use under Vercel's terms, and the image quota is already exhausted, which is why every image renders unoptimized.",
    done: false,
    offRepo: true,
  },
  {
    key: "technical.repoPrivate",
    area: "Technical",
    need: "Make the GitHub repo private and put the data feed behind a key",
    lands: "off-repo — GitHub settings; homz-scrape env",
    why: "The repo and its PR pages currently outrank the site for \"homzrealtor.com\", and homz-scrape.vercel.app/api/data is unauthenticated with CORS *.",
    done: false,
    offRepo: true,
  },

  // --------------------------------------------------------- Seller/let
  {
    key: "journeys.sellerLandlordTerms",
    area: "Trust and local",
    need: "Fee amount and payer, mandate/exclusivity, withdrawal terms, what is verified before listing, tenant screening scope, rent-agreement support, routing recipients",
    lands: "lib/content/ownerPending.ts — 17 typed questions, each with the function that owes it",
    why: "/sell-property-in-gurgaon and /rent-out-property-in-gurgaon are built and reachable but noindex; the robots gate is derived, so filling those values publishes them.",
    done: false,
  },
];

export function inputsByArea(area: ScoreArea): OwnerInput[] {
  return OWNER_INPUTS.filter((i) => i.area === area);
}

export function outstanding(): OwnerInput[] {
  return OWNER_INPUTS.filter((i) => !i.done);
}
