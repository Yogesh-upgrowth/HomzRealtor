import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import Faq from "@/components/Project/intelligence/Faq";
import { formatInr } from "@/lib/intelligence/normalize";
import { buildLocationHubs, MIN_HUB_LISTINGS } from "@/lib/listings/facets";
import { buildHubIntel } from "@/lib/listings/hubIntel";
import { corridorBySlug, sectorLabelFromToken } from "@/lib/listings/listingLocation";
import { filterProperties } from "@/lib/listings/filters";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";

// Gurgaon property rates, sector by sector (2026-09-21).
//
// Three jobs at once, which is why it earns its place rather than being
// another landing page:
//
//   1. It serves a head-term query class the site had nothing for — "property
//      rates in gurgaon", "property price in sector 65", "gurgaon per sq ft
//      rate". Those searches want a table, and nobody had given them one built
//      from live broker inventory.
//   2. Every figure is computed from HomzRealtor's own catalogue. It is not
//      obtainable elsewhere and it cannot be copied from us in a way that
//      stays true, because it moves as inventory moves. That is the kind of
//      page that earns links without asking for them.
//   3. It is the master internal-link hub for the sector and corridor pages:
//      one page linking to every area hub for both buying and renting, which
//      is what keeps them two clicks from the homepage.
//
// Every number is a median of asking prices, and the page says so repeatedly
// and without hedging. Asking prices are not transacted prices, and a rates
// page that blurs the two is misinformation dressed as authority.

export const revalidate = 604800;

const SITE = "https://www.homzrealtor.com";
const PAGE_URL = `${SITE}/property-rates-in-gurgaon`;

const DESCRIPTION =
  "Median asking prices and per sq ft rates across every Gurgaon sector and corridor we track, computed from HomzRealtor's live listing catalogue. Sale and rental figures, updated as inventory moves.";

export const metadata: Metadata = {
  title: "Gurgaon Property Rates by Sector, Median Prices & Per Sq Ft",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Gurgaon Property Rates by Sector",
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

type Row = {
  slug: string;
  label: string;
  kind: "sector" | "corridor";
  saleCount: number;
  saleMedian: number | null;
  perSqFt: number | null;
  perSqFtSample: number;
  rentCount: number;
  rentMedian: number | null;
};

export default async function PropertyRatesPage() {
  const [sale, rent] = await Promise.all([
    getAllSorted("Sale").catch(() => []),
    getAllSorted("Rent").catch(() => []),
  ]);

  // Rows come from the Sale hubs, with rent joined on where it exists: the
  // sale side is the larger catalogue and the one these queries are about. A
  // corridor or sector with rental inventory but no sale inventory still gets
  // a row, so nothing with a live hub is missing from the index.
  const saleHubs = buildLocationHubs(sale, "Sale");
  const rentHubs = buildLocationHubs(rent, "Rent");

  const bySlug = new Map<string, Row>();

  for (const { facet, count } of saleHubs) {
    const filtered = filterProperties(sale, facet.filters, "Sale");
    const label =
      facet.location!.kind === "sector"
        ? sectorLabelFromToken(facet.location!.token)
        : corridorBySlug(facet.location!.slug)?.label ?? facet.slug;
    const intel = buildHubIntel(filtered, "Sale", {
      kind: facet.location!.kind,
      label,
    });
    bySlug.set(facet.slug, {
      slug: facet.slug,
      label,
      kind: facet.location!.kind,
      saleCount: count,
      saleMedian: intel.price?.medianInr ?? null,
      perSqFt: intel.price?.perSqFtInr ?? null,
      perSqFtSample: intel.price?.perSqFtSample ?? 0,
      rentCount: 0,
      rentMedian: null,
    });
  }

  for (const { facet, count } of rentHubs) {
    const filtered = filterProperties(rent, facet.filters, "Rent");
    const label =
      facet.location!.kind === "sector"
        ? sectorLabelFromToken(facet.location!.token)
        : corridorBySlug(facet.location!.slug)?.label ?? facet.slug;
    const intel = buildHubIntel(filtered, "Rent", {
      kind: facet.location!.kind,
      label,
    });
    const existing = bySlug.get(facet.slug);
    if (existing) {
      existing.rentCount = count;
      existing.rentMedian = intel.price?.medianInr ?? null;
    } else {
      bySlug.set(facet.slug, {
        slug: facet.slug,
        label,
        kind: facet.location!.kind,
        saleCount: 0,
        saleMedian: null,
        perSqFt: null,
        perSqFtSample: 0,
        rentCount: count,
        rentMedian: intel.price?.medianInr ?? null,
      });
    }
  }

  const rows = [...bySlug.values()];
  const corridorRows = rows
    .filter((r) => r.kind === "corridor")
    .sort((a, b) => (b.perSqFt ?? 0) - (a.perSqFt ?? 0) || a.label.localeCompare(b.label));

  // Sectors sort by rate, highest first — that is the comparison a reader
  // actually came for. Sectors with no computable rate go last rather than
  // being silently dropped: their listing counts are still real information.
  const sectorRows = rows
    .filter((r) => r.kind === "sector")
    .sort((a, b) => {
      if ((a.perSqFt ?? 0) !== (b.perSqFt ?? 0)) return (b.perSqFt ?? 0) - (a.perSqFt ?? 0);
      const an = parseInt(a.slug.replace(/\D/g, ""), 10);
      const bn = parseInt(b.slug.replace(/\D/g, ""), 10);
      return an - bn;
    });

  const rated = rows.filter((r) => r.perSqFt !== null);
  const cityMedianRate =
    rated.length >= 4
      ? (() => {
          const v = rated.map((r) => r.perSqFt!).sort((a, b) => a - b);
          const mid = Math.floor(v.length / 2);
          return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
        })()
      : null;

  const asOf = new Date();
  const asOfLabel = asOf.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const faqs: { q: string; a: string }[] = [];
  if (cityMedianRate) {
    faqs.push({
      q: "What is the property rate in Gurgaon per square foot?",
      a: `Across the ${rated.length} Gurgaon sectors and corridors where we track enough priced listings with confirmed sizes, the median works out to about ₹${cityMedianRate.toLocaleString("en-IN")} per sq ft as of ${asOfLabel}. Individual sectors sit well either side of that — the table on this page gives each one. These are asking rates from our own listing catalogue, not transacted prices.`,
    });
  }
  if (sectorRows.length > 0 && sectorRows[0].perSqFt) {
    const top = sectorRows.filter((r) => r.perSqFt).slice(0, 3);
    faqs.push({
      q: "Which sector in Gurgaon has the highest property rates?",
      a: `Of the sectors we currently track, ${top
        .map((r) => `${r.label} (about ₹${r.perSqFt!.toLocaleString("en-IN")} per sq ft)`)
        .join(", ")} carry the highest median asking rates. This reflects the inventory we hold today rather than the whole market, and it changes as listings move.`,
    });
  }
  faqs.push({
    q: "Are these transacted prices or asking prices?",
    a: "Asking prices, without exception. Every figure on this page is a median of what sellers and landlords are currently asking across our live catalogue. Transacted prices are recorded at registration and are routinely lower than asking. Treat these as the starting point for a negotiation, not its outcome.",
  });
  faqs.push({
    q: "How often are these rates updated?",
    a: `They are recomputed from the live catalogue rather than written by hand, so they move as inventory moves. This page states the date it was generated — ${asOfLabel} — and a sector's figure is only shown once there are at least four priced listings behind it, because a median of two is noise.`,
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Gurgaon Property Rates", item: PAGE_URL },
        ],
      },
      {
        "@type": "Dataset",
        name: "Gurgaon property asking rates by sector",
        description: DESCRIPTION,
        url: PAGE_URL,
        creator: { "@id": `${SITE}/#organization` },
        temporalCoverage: asOf.toISOString().slice(0, 10),
        isAccessibleForFree: true,
        variableMeasured: [
          "Median asking price",
          "Median asking rate per square foot",
          "Median monthly asking rent",
          "Live listing count",
        ],
      },
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${PAGE_URL}#faq`,
              url: PAGE_URL,
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  const renderRows = (list: Row[], caption: string) => (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-white/[0.12] text-[11px] uppercase tracking-wide text-gray-500">
            <th scope="col" className="py-3 pr-4 font-bold">Area</th>
            <th scope="col" className="py-3 pr-4 font-bold">Median rate</th>
            <th scope="col" className="py-3 pr-4 font-bold">Median asking price</th>
            <th scope="col" className="py-3 pr-4 font-bold">Median rent</th>
            <th scope="col" className="py-3 pr-4 font-bold">Live listings</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.slug} className="border-b border-white/[0.06] text-[14.5px]">
              <th scope="row" className="py-3 pr-4 font-medium text-white">
                {r.saleCount > 0 ? (
                  <Link
                    href={`/buy-property/gurgaon/${r.slug}`}
                    className="hover:text-[#D9B268]"
                  >
                    {r.label}
                  </Link>
                ) : (
                  <Link
                    href={`/rent-property/gurgaon/${r.slug}`}
                    className="hover:text-[#D9B268]"
                  >
                    {r.label}
                  </Link>
                )}
              </th>
              <td className="py-3 pr-4 text-gray-300">
                {r.perSqFt ? (
                  <>
                    ₹{r.perSqFt.toLocaleString("en-IN")}
                    <span className="text-gray-600">/sq ft</span>
                  </>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td className="py-3 pr-4 text-gray-300">
                {r.saleMedian ? formatInr(r.saleMedian) : <span className="text-gray-600">—</span>}
              </td>
              <td className="py-3 pr-4 text-gray-300">
                {r.rentMedian ? (
                  <>
                    {formatInr(r.rentMedian)}
                    <span className="text-gray-600">/mo</span>
                  </>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td className="py-3 pr-4 text-gray-400">
                {r.saleCount > 0 && (
                  <Link href={`/buy-property/gurgaon/${r.slug}`} className="hover:text-[#D9B268]">
                    {r.saleCount} for sale
                  </Link>
                )}
                {r.saleCount > 0 && r.rentCount > 0 && <span className="text-gray-600"> · </span>}
                {r.rentCount > 0 && (
                  <Link href={`/rent-property/gurgaon/${r.slug}`} className="hover:text-[#D9B268]">
                    {r.rentCount} to rent
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-[#0B0B0C] min-h-screen text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <section className="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">Gurgaon Property Rates</span>
        </nav>

        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
          From our own catalogue
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Gurgaon property rates, sector by sector
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-gray-400">
          Median asking prices, per sq ft rates and monthly rents across the{" "}
          {rows.length} Gurgaon sectors and corridors where we currently hold inventory. Every
          figure is computed from HomzRealtor&rsquo;s live listing catalogue as of{" "}
          <time dateTime={asOf.toISOString()}>{asOfLabel}</time>, not copied from a portal or
          written by hand.
        </p>

        {cityMedianRate && (
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Citywide median rate
              </p>
              <p className="mt-1.5 text-2xl font-bold text-white">
                ₹{cityMedianRate.toLocaleString("en-IN")}/sq ft
              </p>
              <p className="mt-1 text-[12px] text-gray-500">
                median across {rated.length} rated areas
              </p>
            </div>
            <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Areas tracked
              </p>
              <p className="mt-1.5 text-2xl font-bold text-white">{rows.length}</p>
              <p className="mt-1 text-[12px] text-gray-500">
                sectors and corridors with live inventory
              </p>
            </div>
            <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Listings behind these figures
              </p>
              <p className="mt-1.5 text-2xl font-bold text-white">
                {(sale.length + rent.length).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[12px] text-gray-500">sale and rental listings tracked</p>
            </div>
          </div>
        )}

        <div className="mt-7 rounded-2xl border border-[#D9B268]/25 bg-[#D9B268]/[0.06] px-5 py-4">
          <p className="text-[14px] leading-relaxed text-gray-300">
            <strong className="font-semibold text-white">These are asking prices.</strong> Every
            figure here is a median of what sellers and landlords currently ask across our live
            catalogue. Transacted prices are recorded at registration and are routinely lower.
            Treat these as the starting point for a negotiation, not its outcome, and confirm any
            specific property with an advisor on{" "}
            <a href={`tel:${COMPANY_INFO.phone}`} className="text-[#D9B268] hover:underline">
              {COMPANY_INFO.phoneDisplay}
            </a>
            .
          </p>
        </div>
      </section>

      {corridorRows.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 mt-12">
          <h2 className="text-2xl font-bold text-white">Rates by corridor</h2>
          <p className="mt-1.5 text-[13px] text-gray-500">
            The named roads Gurgaon buyers search by. Highest median rate first.
          </p>
          {renderRows(corridorRows, "Median asking rates by Gurgaon corridor")}
        </section>
      )}

      {sectorRows.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 mt-14">
          <h2 className="text-2xl font-bold text-white">Rates by sector</h2>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Highest median rate first. A rate is shown only where at least four listings carry
            both a price and a confirmed size — below that a median is noise, so the cell is left
            blank rather than filled with a guess. Sectors with fewer than {MIN_HUB_LISTINGS} live
            listings are not listed at all.
          </p>
          {renderRows(sectorRows, "Median asking rates by Gurgaon sector")}
        </section>
      )}

      <section className="w-full max-w-7xl mx-auto px-4 mt-14">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-7">
          <h2 className="text-xl font-bold tracking-tight text-white">How these figures are built</h2>
          <ul className="mt-3 space-y-2.5 text-[14.5px] leading-relaxed text-gray-300">
            <li>
              <strong className="font-semibold text-white">Median, not average.</strong> One
              ₹40 crore penthouse would drag a sector&rsquo;s average somewhere no real buyer
              recognises. The median is the middle listing.
            </li>
            <li>
              <strong className="font-semibold text-white">A floor of four.</strong> No rate or
              price is published for an area with fewer than four priced listings behind it.
            </li>
            <li>
              <strong className="font-semibold text-white">Confirmed sizes only.</strong> A per sq
              ft rate needs both a price and a size whose unit we could confirm as square feet.
              Listings in square yards, or whose size text is ambiguous, are excluded from the
              rate rather than converted on an assumption.
            </li>
            <li>
              <strong className="font-semibold text-white">Live, not historical.</strong> These
              are today&rsquo;s asking figures. This page carries no trend or forecast, because a
              catalogue of current listings cannot honestly produce one.
            </li>
          </ul>
        </div>
      </section>

      <Faq title="Gurgaon property rates" items={faqs} />

      <section className="w-full max-w-7xl mx-auto px-4 my-12">
        <div className="flex flex-wrap gap-2.5 text-[13.5px]">
          <Link href="/buy-property" className="rounded-full bg-[#D9B268] px-4 py-2 font-medium text-[#0B0B0C] hover:opacity-90">
            Browse property for sale
          </Link>
          <Link href="/rent-property" className="rounded-full border border-white/[0.12] px-4 py-2 text-gray-200 hover:border-[#D9B268]/50 hover:text-[#D9B268]">
            Browse rentals
          </Link>
          <Link href="/project-listing/gurgaon/sectors" className="rounded-full border border-white/[0.12] px-4 py-2 text-gray-200 hover:border-[#D9B268]/50 hover:text-[#D9B268]">
            Browse projects by sector
          </Link>
        </div>
      </section>
    </div>
  );
}
