import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  INVESTMENT_SCORE_PATH,
  LISTING_SCORE_NOTE,
  SCORE_BANDS,
  SCORE_CEILING,
  SCORE_COMPONENTS,
  SCORE_FLOOR,
  SCORE_LIMITATIONS,
  SCORE_TOTAL_POINTS,
  SCORE_UPDATE_FREQUENCY,
} from "@/lib/intelligence/investmentScoreMeta";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

// Checklist item 8 (2026-09-22): "Document Investment Score methodology on one
// permanent page... Explain exactly what feeds each component: input data,
// calculation logic, update frequency, missing-data handling, limitations.
// Then link 'How is this score calculated?' from every project page.
// Acceptance criteria: a user should be able to understand where a 72/100
// score came from."
//
// Everything on this page is read from lib/intelligence/investmentScoreMeta.ts,
// which is also what the component's own explainer reads, so the page cannot
// describe a calculation the site is not running.

const SITE = "https://www.homzrealtor.com";
const UPDATED = "2026-09-22";

export const metadata: Metadata = {
  title: "How the Homz Investment Score Is Calculated",
  description:
    "The full methodology behind the Homz Investment Score: the five components, what data feeds each one, how the points are assigned, how missing data is handled, and what the score cannot tell you.",
  alternates: { canonical: `${SITE}${INVESTMENT_SCORE_PATH}` },
  openGraph: {
    title: "How the Homz Investment Score Is Calculated",
    description:
      "The five components, their inputs, the point logic, missing-data handling and the limitations.",
    url: `${SITE}${INVESTMENT_SCORE_PATH}`,
    type: "article",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

// A worked example, computed by hand from the same rules the components
// declare. The acceptance criterion is that a reader can see where a score
// came from, and an abstract description of five weightings does not achieve
// that on its own.
const WORKED_EXAMPLE = {
  score: 72,
  rows: [
    { label: "Developer Reputation", earned: 16, max: 20, why: "On our verified developer list." },
    {
      label: "Connectivity",
      earned: 21,
      max: 25,
      why: "8 base, +7 metro resolvable, +6 airport travel time resolvable. No business-hub time, so no +4.",
    },
    {
      label: "Social Infrastructure",
      earned: 17,
      max: 20,
      why: "8 base, +9 for three of the four categories having at least one place.",
    },
    {
      label: "Product & Compliance",
      earned: 17,
      max: 20,
      why: "8 base, +5 for 10 or more amenities, +4 for an active RERA registration.",
    },
    {
      label: "Entry Timing",
      earned: 14,
      max: 15,
      why: "Ready to move: no construction-completion wait.",
    },
  ],
};

export default function InvestmentScoreMethodologyPage() {
  const exampleEarned = WORKED_EXAMPLE.rows.reduce((s, r) => s + r.earned, 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          {
            "@type": "ListItem",
            position: 2,
            name: "Homz Investment Score methodology",
            item: `${SITE}${INVESTMENT_SCORE_PATH}`,
          },
        ],
      },
      {
        "@type": "TechArticle",
        headline: "How the Homz Investment Score Is Calculated",
        url: `${SITE}${INVESTMENT_SCORE_PATH}`,
        dateModified: UPDATED,
        publisher: { "@id": `${SITE}/#organization` },
        about: "Methodology for the Homz Investment Score used on HomzRealtor project pages",
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
          <span className="text-gray-300 font-medium">Investment Score methodology</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          How the Homz Investment Score Is Calculated
        </h1>
        <p className="mt-3 text-[13px] text-gray-500">
          Methodology last updated{" "}
          <time dateTime={UPDATED}>
            {new Date(UPDATED).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>

        <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-gray-300">
          <p>
            Every project page on HomzRealtor carries a score out of 100. This page is the
            whole of how it is produced. If you want to check a particular number, the five
            component scores are printed on the project page itself and they add up exactly as
            described here.
          </p>
          <p>
            The score is a weighted sum of what our catalogue knows about a project. It is not
            a valuation, not a yield forecast, and not a comparison against anything that has
            actually transacted.{" "}
            <span className="text-gray-100">Price is deliberately not an input.</span> We hold
            asking prices, not registry data, so there is nothing to judge a price as fair or
            unfair against, and scoring one would mean inventing a judgement we cannot support.
            A project can score well and still be expensive at what it is asking.
          </p>
        </div>

        {/* ── the five components ─────────────────────────────────────────── */}
        <section aria-labelledby="components" className="mt-12">
          <h2 id="components" className="mb-2 text-2xl font-bold tracking-tight text-white">
            The five components
          </h2>
          <p className="mb-6 text-[14px] text-gray-500">
            {SCORE_TOTAL_POINTS} points in total, scaled to 100.
          </p>

          <div className="space-y-5">
            {SCORE_COMPONENTS.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">{c.label}</h3>
                  <span className="shrink-0 rounded-full border border-[#B77D2B] px-3 py-0.5 text-[13px] font-semibold text-[#D9B268]">
                    {c.max} points
                  </span>
                </div>

                <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
                  Input data
                </p>
                <ul className="mt-1.5 space-y-1">
                  {c.inputs.map((i) => (
                    <li key={i} className="text-[14.5px] leading-relaxed text-gray-300">
                      {i}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
                  Calculation logic
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {c.logic.map((l) => (
                    <li key={l} className="text-[14.5px] leading-relaxed text-gray-300">
                      {l}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.15em] text-gray-500">
                  When the data is missing
                </p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-gray-400">{c.missingData}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── worked example ──────────────────────────────────────────────── */}
        <section aria-labelledby="worked" className="mt-12">
          <h2 id="worked" className="mb-2 text-2xl font-bold tracking-tight text-white">
            Where a {WORKED_EXAMPLE.score}/100 comes from
          </h2>
          <p className="mb-5 text-[14.5px] leading-relaxed text-gray-400">
            A ready-to-move project by a developer on our verified list, with a metro station and
            an airport travel time resolvable but no business-hub time, places in three of the
            four social-infrastructure categories, more than ten amenities and an active RERA
            registration.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full min-w-[520px] text-left text-[14px]">
              <thead className="bg-[#141416] text-[12px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Component</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">How</th>
                </tr>
              </thead>
              <tbody>
                {WORKED_EXAMPLE.rows.map((r) => (
                  <tr key={r.label} className="border-t border-white/[0.06]">
                    <td className="px-4 py-3 font-medium text-gray-200">{r.label}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#D9B268]">
                      {r.earned}/{r.max}
                    </td>
                    <td className="px-4 py-3 leading-relaxed text-gray-400">{r.why}</td>
                  </tr>
                ))}
                <tr className="border-t border-white/[0.12] bg-[#141416]">
                  <td className="px-4 py-3 font-semibold text-white">Total</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">
                    {exampleEarned}/{SCORE_TOTAL_POINTS}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {exampleEarned} ÷ {SCORE_TOTAL_POINTS} × 100 = {WORKED_EXAMPLE.score}/100
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── bands and range ─────────────────────────────────────────────── */}
        <section aria-labelledby="bands" className="mt-12">
          <h2 id="bands" className="mb-4 text-2xl font-bold tracking-tight text-white">
            What the band label means
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5">
            <ul className="space-y-2">
              {SCORE_BANDS.map((b) => (
                <li key={b.label} className="text-[14.5px] text-gray-300">
                  <span className="font-semibold text-white">{b.label}</span>
                  {" — "}
                  {b.min > 0 ? `${b.min} and above` : `below ${SCORE_BANDS[SCORE_BANDS.length - 2].min}`}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14px] leading-relaxed text-gray-400">
              These describe where a number falls on our own scale. They are not grades on an
              investment, and they are not derived from how other projects scored.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-400">
              <span className="text-gray-200">The practical range is {SCORE_FLOOR}–{SCORE_CEILING}, not 0–100.</span>{" "}
              The calculation applies a floor of {SCORE_FLOOR} and a ceiling of {SCORE_CEILING},
              so no project can score outside that. Reading {SCORE_FLOOR}/100 as though zero were
              reachable would overstate how poor a low score is.
            </p>
          </div>
        </section>

        {/* ── update frequency ────────────────────────────────────────────── */}
        <section aria-labelledby="frequency" className="mt-12">
          <h2 id="frequency" className="mb-4 text-2xl font-bold tracking-tight text-white">
            How often it updates
          </h2>
          <p className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5 text-[14.5px] leading-relaxed text-gray-300">
            {SCORE_UPDATE_FREQUENCY}
          </p>
        </section>

        {/* ── listings vs projects ────────────────────────────────────────── */}
        <section aria-labelledby="listings" className="mt-12">
          <h2 id="listings" className="mb-4 text-2xl font-bold tracking-tight text-white">
            Individual listings score differently
          </h2>
          <p className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5 text-[14.5px] leading-relaxed text-gray-300">
            {LISTING_SCORE_NOTE}
          </p>
        </section>

        {/* ── limitations ─────────────────────────────────────────────────── */}
        <section aria-labelledby="limits" className="mt-12">
          <h2 id="limits" className="mb-4 text-2xl font-bold tracking-tight text-white">
            What this score cannot tell you
          </h2>
          <ul className="space-y-3">
            {SCORE_LIMITATIONS.map((l) => (
              <li
                key={l}
                className="rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[14.5px] leading-relaxed text-gray-300"
              >
                {l}
              </li>
            ))}
          </ul>
        </section>

        {/* ── accountability ──────────────────────────────────────────────── */}
        <section aria-labelledby="accountable" className="mt-12">
          <h2 id="accountable" className="mb-4 text-2xl font-bold tracking-tight text-white">
            If you think a score is wrong
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5">
            <p className="text-[14.5px] leading-relaxed text-gray-300">
              The component scores are printed on the project page, so a wrong score usually
              means a wrong input — a missing amenity list, a RERA status we have stale, a
              sector we could not resolve. Tell us which project and which component and it gets
              checked.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-400">
              Call{" "}
              <a href={`tel:${COMPANY_INFO.phone}`} className="text-[#D9B268] hover:underline">
                {COMPANY_INFO.phoneDisplay}
              </a>{" "}
              or{" "}
              <Link href="/contact" className="text-[#D9B268] hover:underline">
                write to us
              </Link>
              .
            </p>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]">
              <Link href="/editorial-policy" className="text-[#D9B268] hover:underline">
                Editorial and corrections policy
              </Link>
              <Link href="/property-rates-in-gurgaon" className="text-[#D9B268] hover:underline">
                Gurgaon asking-price data
              </Link>
              <Link href="/disclaimer" className="text-[#D9B268] hover:underline">
                Disclaimer
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
