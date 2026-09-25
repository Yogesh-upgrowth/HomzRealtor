import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AUTHORS, EDITORIAL_TEAM_SLUG } from "@/lib/content/authors";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";

// Editorial and corrections policy (2026-09-21).
//
// 21 Sep audit, section 19: for a category where users make decisions
// involving large amounts of money, it listed what the site should lean into
// — HARERA details, data timestamps, source disclosures, asking-price vs
// transaction-price distinctions, clear brokerage information, a corrections
// policy and an editorial policy. Everything on that list existed somewhere
// on the site except the last two, which existed nowhere.
//
// This is not a compliance page written to be ignored. Each section states
// something the site actually does and can be held to, and where a rule has
// a consequence the consequence is named. A policy that promises more than
// the code does would be worse than having none.

const SITE = "https://www.homzrealtor.com";
const PAGE_URL = `${SITE}/editorial-policy`;

const DESCRIPTION =
  "How HomzRealtor produces its Gurgaon property research: where the figures come from, the minimum sample behind any median, the asking-price distinction, how we handle errors, and who is accountable.";

export const metadata: Metadata = {
  title: "Editorial and Corrections Policy",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Editorial and Corrections Policy",
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

type Section = { heading: string; body: string[] };

const SECTIONS: Section[] = [
  {
    heading: "Where the numbers come from",
    body: [
      "Every price, rate, median, count and distribution published on this site is computed from HomzRealtor's own catalogue of live Gurgaon listings and projects. Nothing is copied from another portal, and nothing is estimated by a language model.",
      "That has a consequence we accept: our figures describe the inventory we hold, not the whole Gurgaon market. Where our coverage of an area is thin, the figure is either absent or labelled with the sample it rests on, rather than presented as a market-wide truth.",
    ],
  },
  {
    heading: "Asking prices, never transacted prices",
    body: [
      "Everything derived from listings is what a seller or landlord is currently asking. Transacted prices are recorded at registration, are not public in a usable form, and are routinely lower than asking.",
      "No page on this site presents an asking figure as a transacted one. Where the distinction matters — the rates page, the sector pages, every property page — it is stated on the page rather than left to the reader to infer.",
    ],
  },
  {
    heading: "A median needs a base",
    body: [
      "No median, rate or distribution is published for an area with fewer than four priced records behind it. A median of two is noise presented as insight, and a reader cannot tell the difference by looking.",
      "A per-square-foot rate additionally requires both a price and a size whose unit we could confirm as square feet. Listings in square yards, or whose size text is ambiguous, are excluded from the rate rather than converted on an assumption.",
      "Where a figure cannot be computed to that standard, the page omits it. It does not fall back to a wider area, an older number or a guess.",
    ],
  },
  {
    heading: "We do not hold historical price data",
    body: [
      "This site publishes current asking prices. It does not publish year-on-year appreciation, multi-year growth or price forecasts, because we do not have a historical transaction dataset to support them and will not assert a change we cannot verify.",
      "Where a page shows a projection — a possession-value estimate on an under-construction project, for example — the appreciation rate is set by you, labelled as an illustrative estimate, and never shown on a project that is already complete.",
    ],
  },
  {
    heading: "What we verify, and what we do not",
    body: [
      "We surface each project's RERA status as it appears in the records available to us, and we flag inconsistencies we find. RERA registration is granted per project and per phase; confirm the number on the Haryana RERA portal against the specific phase you are buying into before any payment.",
      "We do not verify property titles, and you should be wary of any agent that claims to. Title due diligence is a job for a lawyer you instruct.",
      "Listing photography is often supplied by the developer or originates from the listing feed. We are progressively replacing it with our own, starting with the properties people view most.",
    ],
  },
  {
    heading: "Dates mean what they say",
    body: [
      "\"Prices as listed on [date]\" is the date those figures were read from our catalogue. \"Listing last checked\" means the listing was still present in our tracked inventory on that date. \"Confirmed with the owner\" means an advisor called the owner and confirmed availability and price on that date.",
      "Those are three different claims and no page conflates them. A listing with no confirming call shows only that it was last checked.",
    ],
  },
  {
    heading: "AI and how this content is written",
    body: [
      "Our guides are written from our own catalogue data by the HomzRealtor editorial team. We do not generate articles by handing a keyword to a language model and publishing the output, and we do not rewrite other sites' copy.",
      "Where a page is assembled programmatically — a sector page, a property record — the facts come from structured fields, not from generated prose. If a field is missing, the page says so instead of filling the gap.",
    ],
  },
  {
    heading: "Commercial interests we have",
    body: [
      "HomzRealtor is a brokerage. We earn a fee on transactions, and we are an authorised channel partner for some Gurgaon developers. Many pages discuss inventory we would earn on.",
      "That does not change the arithmetic, which is computed identically across every area and project whether we broker there or not — but you are entitled to know it, and our brokerage rates are published rather than raised at the end.",
    ],
  },
  {
    heading: "Corrections",
    body: [
      "If something on this site is wrong, tell us and it gets corrected. Wrong data is worth reporting: a corrected record helps the next person looking at that property as much as it helps you.",
      "For a specific property, quote the HomzRealtor reference shown on its page — that identifies the exact record. For a guide, the page title is enough.",
      "Where a correction changes a figure or a factual claim in a guide, we update the page and move its \"facts verified\" date. We do not silently edit a claim and leave the old date standing.",
      "Our catalogue is aggregated from third-party feeds, so a proportion of records arrive malformed. We run automated checks against the full database for exactly the errors that matter — a home typed as a warehouse, a completed project showing a future possession date, a competitor's copy in ours — and correct them at the source rather than page by page.",
    ],
  },
];

export default function EditorialPolicyPage() {
  const author = AUTHORS[EDITORIAL_TEAM_SLUG];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Editorial Policy", item: PAGE_URL },
        ],
      },
      {
        "@type": "WebPage",
        name: "Editorial and Corrections Policy",
        description: DESCRIPTION,
        url: PAGE_URL,
        publisher: { "@id": `${SITE}/#organization` },
      },
    ],
  };

  return (
    <div className="bg-[#0B0B0C] min-h-screen text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <div className="w-full max-w-4xl mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-24">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">Editorial Policy</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Editorial and corrections policy
        </h1>
        <p className="mt-4 max-w-3xl text-[15.5px] leading-relaxed text-gray-400">
          Buying or renting a home in Gurgaon involves a large amount of your money, so you are
          entitled to know how the figures on this site are produced, what they do and do not
          claim, and what happens when we get something wrong. Everything below describes what
          this site actually does today.
        </p>

        <div className="mt-11 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.heading} aria-labelledby={s.heading.replace(/\s+/g, "-").toLowerCase()}>
              <h2
                id={s.heading.replace(/\s+/g, "-").toLowerCase()}
                className="mb-3 text-2xl font-bold tracking-tight text-white"
              >
                {s.heading}
              </h2>
              <div className="space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-gray-300">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="accountable" className="mt-12">
          <h2 id="accountable" className="mb-3 text-2xl font-bold tracking-tight text-white">
            Who is accountable
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-6">
            <p className="text-[15px] leading-relaxed text-gray-300">
              {COMPANY_INFO.legalStructure} {COMPANY_INFO.hareraHolder} holds HARERA agent
              registration {COMPANY_INFO.hararaAgentNumber} and is the person accountable for what
              is published here. Both that registration and GSTIN {COMPANY_INFO.gstNumber} can be
              checked on the issuing authority&rsquo;s own portal.
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-gray-400">
              To report an error, call{" "}
              <a href={`tel:${COMPANY_INFO.phone}`} className="text-[#D9B268] hover:underline">
                {COMPANY_INFO.phoneDisplay}
              </a>{" "}
              &mdash; {COMPANY_INFO.hours.toLowerCase()} &mdash; or{" "}
              <Link href="/contact" className="text-[#D9B268] hover:underline">
                write to us
              </Link>
              .
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]">
              {author && (
                <Link href={`/author/${author.slug}`} className="text-[#D9B268] hover:underline">
                  Who writes our research
                </Link>
              )}
              <Link href="/about-us#credentials" className="text-[#D9B268] hover:underline">
                Registration and company details
              </Link>
              <Link href="/property-rates-in-gurgaon" className="text-[#D9B268] hover:underline">
                Rates methodology
              </Link>
              <Link href="/faq" className="text-[#D9B268] hover:underline">
                FAQs
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
