import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getMonth, getSnapshots, longestTrend } from "@/lib/index/snapshot";
import { currentMonth, INDEX_START_MONTH, MIN_SAMPLE, monthsBetween, type IndexSnapshot } from "@/lib/index/types";
import { formatInr } from "@/lib/intelligence/normalize";
import { DataUpdated } from "@/components/Common/DataUpdated";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

// The Gurgaon Property Index (2026-09-22, checklist items 20 and 21).
//
// Item 20 calls this "a major HomzRealtor asset". It becomes one only if the
// series is trustworthy, which is item 21's whole point: the trend is built
// from our own monthly snapshots and from nothing else, starting September
// 2026. Until there are two months on record there is no trend, and this page
// says so rather than filling the space with a number.
//
// That is the uncomfortable part and it is also the entire value. Every
// competitor quotes a year-on-year percentage. Most cannot show you what they
// measured or when. In twelve months this page will be able to, because it is
// refusing to pretend today.

export const revalidate = 3600;

const SITE = "https://www.homzrealtor.com";

export const metadata: Metadata = {
  title: "Gurgaon Property Index: Monthly Asking-Price Snapshots",
  description:
    "HomzRealtor's own monthly record of Gurgaon asking prices, inventory and possession mix, by sector and corridor. Built from our live catalogue, one snapshot a month, never backfilled.",
  alternates: { canonical: `${SITE}/gurgaon-property-index` },
  openGraph: {
    title: "Gurgaon Property Index",
    description:
      "Monthly asking-price and inventory snapshots for Gurgaon, by sector and corridor, from HomzRealtor's own catalogue.",
    url: `${SITE}/gurgaon-property-index`,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{note}</p>}
    </div>
  );
}

export default async function GurgaonPropertyIndexPage() {
  const month = currentMonth();

  // Everything is best-effort: the database may be unreachable, and an index
  // page that 500s is worse than one that says it has nothing yet.
  const [latestMonth, cityHistory] = await Promise.all([
    getMonth(month).catch(() => [] as IndexSnapshot[]),
    getSnapshots("city", "gurgaon", 24).catch(() => [] as IndexSnapshot[]),
  ]);

  // If this month has not been captured yet (the cron runs on the 1st), show
  // the most recent month that has been.
  const rows = latestMonth.length > 0 ? latestMonth : await getSnapshots("city", "gurgaon", 1).catch(() => []);
  const city = rows.find((r) => r.scopeType === "city" && r.scopeKey === "gurgaon") ?? cityHistory[0];
  const rent = rows.find((r) => r.scopeKey === "gurgaon-rent");
  const sectors = rows.filter((r) => r.scopeType === "sector").sort((a, b) => b.metrics.listingCount - a.metrics.listingCount);
  const corridors = rows.filter((r) => r.scopeType === "corridor").sort((a, b) => b.metrics.listingCount - a.metrics.listingCount);

  const trend = longestTrend(cityHistory);
  const monthsRecorded = cityHistory.length;
  const monthsToYearOnYear = Math.max(0, 12 - monthsBetween(INDEX_START_MONTH, month));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Gurgaon Property Index", item: `${SITE}/gurgaon-property-index` },
        ],
      },
      {
        "@type": "Dataset",
        name: "HomzRealtor Gurgaon Property Index",
        description:
          "Monthly snapshots of median asking prices, inventory counts, possession mix and unit sizes across Gurgaon sectors and corridors, computed from HomzRealtor's own live listing catalogue.",
        url: `${SITE}/gurgaon-property-index`,
        creator: { "@id": `${SITE}/#organization` },
        temporalCoverage: city ? `${INDEX_START_MONTH}/${city.month}` : INDEX_START_MONTH,
        spatialCoverage: { "@type": "Place", name: "Gurugram, Haryana, India" },
        measurementTechnique:
          "Median of asking prices across active listings in scope, with a minimum sample of " +
          `${MIN_SAMPLE} priced listings before a median is published.`,
        isAccessibleForFree: true,
      },
    ],
  };

  return (
    <div className="bg-[#0B0B0C] min-h-screen text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <div className="w-full max-w-6xl mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-24">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">Gurgaon Property Index</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          The Gurgaon Property Index
        </h1>
        <p className="mt-4 max-w-3xl text-[15.5px] leading-relaxed text-gray-300">
          Once a month we take a snapshot of every Gurgaon sector and corridor in our
          catalogue: what is being asked, how much is on the market, and how much of it is
          finished. Each month is written once and never revised, so what you read here is what
          we said at the time.
        </p>

        {/* ── the honesty block, and the most important thing on the page ── */}
        <section
          aria-labelledby="index-history"
          className="mt-8 rounded-2xl border border-[#B77D2B]/40 bg-[#141416] px-6 py-5"
        >
          <h2 id="index-history" className="text-lg font-bold text-white">
            {trend ? "What the series shows so far" : "This index starts in September 2026"}
          </h2>
          {trend ? (
            <>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-300">
                Across the {trend.months} month{trend.months === 1 ? "" : "s"} from{" "}
                {monthLabel(trend.from)} to {monthLabel(trend.to)}, the median Gurgaon asking
                price in our catalogue moved from {formatInr(trend.fromValue)} to{" "}
                {formatInr(trend.toValue)} —{" "}
                <span className="font-semibold text-white">
                  {trend.changePct >= 0 ? "+" : ""}
                  {trend.changePct}%
                </span>
                .
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-gray-400">
                That is a movement in what sellers are ASKING across our own inventory. It is
                not a transacted price index, and the mix of what is listed changes month to
                month, which moves a median on its own.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-300">
                We have {monthsRecorded === 0 ? "no months" : `${monthsRecorded} month${monthsRecorded === 1 ? "" : "s"}`}{" "}
                on record, so there is no trend to report yet. There will be one from{" "}
                {monthLabel("2026-10")}, and a full year-on-year figure{" "}
                {monthsToYearOnYear > 0
                  ? `in ${monthsToYearOnYear} month${monthsToYearOnYear === 1 ? "" : "s"}`
                  : "now"}
                .
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-gray-400">
                We could produce a 2020&ndash;2025 series by inferring it from today&apos;s
                listings. We are not going to. Our catalogue records what is on the market now
                and holds nothing about what was on the market three years ago, so any history
                built from it would be a guess with a dataset&apos;s authority. Waiting is the
                only honest way to have a real one.
              </p>
            </>
          )}
        </section>

        {!city ? (
          <p className="mt-10 rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5 text-[15px] leading-relaxed text-gray-400">
            The first snapshot has not been captured yet. It runs on the first of the month.
            In the meantime,{" "}
            <Link href="/property-rates-in-gurgaon" className="text-[#D9B268] hover:underline">
              current asking rates by sector
            </Link>{" "}
            are computed live from the same catalogue.
          </p>
        ) : (
          <>
            {/* ── this month, citywide ── */}
            <section aria-labelledby="index-city" className="mt-12">
              <h2 id="index-city" className="mb-1 text-2xl font-bold tracking-tight text-white">
                Gurgaon, {monthLabel(city.month)}
              </h2>
              <p className="mb-5 text-[13px] text-gray-500">
                Sale and commercial inventory. Rental listings are counted separately and never
                mixed into a sale median.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Median asking price"
                  value={city.metrics.medianAskingInr ? formatInr(city.metrics.medianAskingInr)! : "—"}
                  note={`from ${city.metrics.pricedCount.toLocaleString("en-IN")} priced listings`}
                />
                <Metric
                  label="Listings tracked"
                  value={city.metrics.listingCount.toLocaleString("en-IN")}
                  note={`${city.metrics.residentialCount.toLocaleString("en-IN")} residential, ${city.metrics.commercialCount.toLocaleString("en-IN")} commercial`}
                />
                <Metric
                  label="Ready to move"
                  value={city.metrics.readyToMovePct != null ? `${city.metrics.readyToMovePct}%` : "—"}
                  note={
                    city.metrics.underConstructionPct != null
                      ? `${city.metrics.underConstructionPct}% under construction, of ${city.metrics.statusSample.toLocaleString("en-IN")} with a stated status`
                      : undefined
                  }
                />
                <Metric
                  label="Median unit size"
                  value={city.metrics.medianUnitSqFt ? `${city.metrics.medianUnitSqFt.toLocaleString("en-IN")} sq ft` : "—"}
                  note={`from ${city.metrics.unitSizeSample.toLocaleString("en-IN")} listings with a confirmed size`}
                />
              </div>
              {rent && (
                <p className="mt-4 text-[13.5px] text-gray-400">
                  Rental inventory this month: {rent.metrics.listingCount.toLocaleString("en-IN")}{" "}
                  listings.{" "}
                  <Link href="/rent-property" className="text-[#D9B268] hover:underline">
                    Browse rentals
                  </Link>
                  .
                </p>
              )}
              <DataUpdated date={city.capturedAt} label="Snapshot captured" className="mt-3 text-[12.5px] text-gray-500" />
            </section>

            {/* ── corridors: item 23's aggregate view ── */}
            {corridors.length > 0 && (
              <section aria-labelledby="index-corridors" className="mt-12">
                <h2 id="index-corridors" className="mb-4 text-2xl font-bold tracking-tight text-white">
                  By corridor
                </h2>
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                  <table className="w-full min-w-[680px] text-left text-[14px]">
                    <thead className="bg-[#141416] text-[12px] uppercase tracking-wider text-gray-500">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Corridor</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Median asking</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Listings</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Ready to move</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Median size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corridors.map((c) => (
                        <tr key={c.scopeKey} className="border-t border-white/[0.06]">
                          <td className="px-4 py-3 font-medium text-gray-200">
                            <Link href={`/buy-property/gurgaon/${c.scopeKey}`} className="hover:text-[#D9B268]">
                              {c.scopeLabel}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-[#D9B268]">
                            {c.metrics.medianAskingInr ? formatInr(c.metrics.medianAskingInr) : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{c.metrics.listingCount.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-gray-300">
                            {c.metrics.readyToMovePct != null ? `${c.metrics.readyToMovePct}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {c.metrics.medianUnitSqFt ? `${c.metrics.medianUnitSqFt.toLocaleString("en-IN")} sq ft` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── sectors ── */}
            {sectors.length > 0 && (
              <section aria-labelledby="index-sectors" className="mt-12">
                <h2 id="index-sectors" className="mb-1 text-2xl font-bold tracking-tight text-white">
                  By sector
                </h2>
                <p className="mb-4 text-[13px] text-gray-500">
                  Sectors carrying at least {MIN_SAMPLE} listings this month. A sector below that
                  is left out rather than published with a median computed from a handful of
                  records.
                </p>
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                  <table className="w-full min-w-[680px] text-left text-[14px]">
                    <thead className="bg-[#141416] text-[12px] uppercase tracking-wider text-gray-500">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Sector</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Median asking</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Listings</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Ready to move</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Median size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectors.map((s) => (
                        <tr key={s.scopeKey} className="border-t border-white/[0.06]">
                          <td className="px-4 py-3 font-medium text-gray-200">
                            <Link href={`/buy-property/gurgaon/${s.scopeKey}`} className="hover:text-[#D9B268]">
                              {s.scopeLabel}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-[#D9B268]">
                            {s.metrics.medianAskingInr ? formatInr(s.metrics.medianAskingInr) : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{s.metrics.listingCount.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-gray-300">
                            {s.metrics.readyToMovePct != null ? `${s.metrics.readyToMovePct}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {s.metrics.medianUnitSqFt ? `${s.metrics.medianUnitSqFt.toLocaleString("en-IN")} sq ft` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── months on record ── */}
            {cityHistory.length > 1 && (
              <section aria-labelledby="index-months" className="mt-12">
                <h2 id="index-months" className="mb-4 text-2xl font-bold tracking-tight text-white">
                  Every month on record
                </h2>
                <ul className="space-y-2">
                  {[...cityHistory]
                    .sort((a, b) => b.month.localeCompare(a.month))
                    .map((s) => (
                      <li
                        key={s.month}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.06] pb-2 text-[14.5px] last:border-b-0"
                      >
                        <span className="text-gray-300">{monthLabel(s.month)}</span>
                        <span className="text-gray-400">
                          {s.metrics.medianAskingInr ? formatInr(s.metrics.medianAskingInr) : "no median"}
                          {" · "}
                          {s.metrics.listingCount.toLocaleString("en-IN")} listings
                        </span>
                      </li>
                    ))}
                </ul>
              </section>
            )}
          </>
        )}

        {/* ── methodology ── */}
        <section aria-labelledby="index-method" className="mt-12">
          <h2 id="index-method" className="mb-4 text-2xl font-bold tracking-tight text-white">
            How this is built
          </h2>
          <ul className="space-y-3">
            {[
              `One snapshot per month, written on the first and never revised. A month already on record cannot be overwritten — that is enforced by the database, not by convention.`,
              `Every figure is an asking price from active HomzRealtor inventory, not a price recorded at registration. Transacted prices are routinely lower.`,
              `A median is published only where at least ${MIN_SAMPLE} priced listings sit behind it. Below that the cell reads "—" rather than showing a figure that would swing wildly month to month for reasons unrelated to the market.`,
              `Rental and sale prices are never mixed into one median.`,
              `Listings our data-quality gate holds back — impossible combinations, zero prices — are excluded before anything is computed.`,
              `The sample behind every figure is printed beside it. A median of twelve is a different claim from a median of twelve hundred, and you should be able to tell which you are reading.`,
              `If we ever change what a metric means, the change is versioned and the trend refuses to compare across it rather than showing a movement that is really a definition change.`,
            ].map((line) => (
              <li
                key={line}
                className="rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[14.5px] leading-relaxed text-gray-300"
              >
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px]">
            <Link href="/property-rates-in-gurgaon" className="text-[#D9B268] hover:underline">
              Live asking rates by sector
            </Link>
            <Link href="/editorial-policy" className="text-[#D9B268] hover:underline">
              Editorial and corrections policy
            </Link>
            <Link href="/homz-investment-score-methodology" className="text-[#D9B268] hover:underline">
              Investment Score methodology
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
