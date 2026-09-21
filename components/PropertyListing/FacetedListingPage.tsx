// Server-rendered listing landing pages.
//
// Two kinds share this component:
//
//   - Static facets (/buy-property/gurgaon/3-bhk, /rent-property/gurgaon/
//     under-25000). Content audit B-04 (2026-09-08): transactional queries had
//     no real destination, because the filtered ?bedrooms=3 URL correctly
//     canonicalises back to the unfiltered hub. These are that destination.
//   - Location hubs (/buy-property/gurgaon/sector-65, /rent-property/gurgaon/
//     sohna-road). New 2026-09-21. See the long note in lib/listings/facets.ts
//     for why these are the highest-leverage change available and where the
//     doorway-page line is.
//
// Both use filterProperties() — the exact same server-side filter logic
// /api/listings uses — with a *fixed* filter per facet, never one read from the
// URL, and both are enumerated from a finite set rather than combinatorially.
//
// Definitions live in lib/listings/facets.ts, which is React-free so the
// sitemap can import it directly.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllSorted, PropertyCardLink } from "./PaginatedListingPage";
import HubIntelligence from "./HubIntelligence";
import Faq from "@/components/Project/intelligence/Faq";
import { type PropertyCategory } from "@/lib/listings/filters";
import { formatInr } from "@/lib/intelligence/normalize";
import { slugForProperty } from "@/lib/intelligence/property-view";
import { buildHubFaqs, buildHubIntel } from "@/lib/listings/hubIntel";
import {
  buildLocationHubs,
  facetProperties,
  LISTING_PAGE_SIZE,
  MIN_HUB_LISTINGS,
  ROUTE_BASE_BY_CATEGORY,
  staticFacetsFor,
  type FacetDef,
} from "@/lib/listings/facets";
import { corridorBySlug, sectorLabelFromToken } from "@/lib/listings/listingLocation";

const SITE = "https://www.homzrealtor.com";

// Re-exported so the pre-existing importers (the buy routes, app/sitemap.ts)
// keep working unchanged now the definitions have moved to lib.
export { BUY_FACETS, RENT_FACETS, resolveFacet } from "@/lib/listings/facets";
export type { FacetDef } from "@/lib/listings/facets";

const HUB_LABEL: Record<PropertyCategory, string> = {
  Sale: "Buy Property",
  Rent: "Rent Property",
  Pg: "PG Accommodation",
  Commercial: "Commercial Property",
};

export async function getFacetProperties(facet: FacetDef, category: PropertyCategory = "Sale") {
  const all = await getAllSorted(category);
  return facetProperties(all, facet, category);
}

export async function getFacetPageCount(
  facet: FacetDef,
  category: PropertyCategory = "Sale"
): Promise<number> {
  const filtered = await getFacetProperties(facet, category);
  return Math.max(1, Math.ceil(filtered.length / LISTING_PAGE_SIZE));
}

function safeJson(g: unknown): string {
  return JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Display name of the place a location hub covers. */
function hubLocationLabel(facet: FacetDef): string | null {
  if (!facet.location) return null;
  return facet.location.kind === "sector"
    ? sectorLabelFromToken(facet.location.token)
    : corridorBySlug(facet.location.slug)?.label ?? null;
}

type Props = { facet: FacetDef; pageNum: number; category?: PropertyCategory };

const FacetedListingPage = async ({ facet, pageNum, category = "Sale" }: Props) => {
  const routeBase = ROUTE_BASE_BY_CATEGORY[category];
  const all = await getAllSorted(category);
  const filtered = facetProperties(all, facet, category);

  // The inventory gate, enforced here rather than at build time so it stays
  // true as inventory moves.
  //
  // It applies to SECTOR hubs only, and the distinction is the whole
  // doorway-page argument. Sector hubs are derived — one per sector that
  // appears in the feed, up to ~115 of them — so without a floor the tail of
  // that set is pages with three listings each, which is a doorway to a
  // listing that already has its own page. Corridor hubs and the static facets
  // are a hand-written finite set (7 and 6-10 respectively), chosen because
  // people search those exact terms; an empty one is an honest "nothing right
  // now" answer to a real query, and it stays linkable from static editorial
  // content without a live inventory check.
  //
  // Empty hubs of either kind are still kept out of the sitemap, the hub
  // directory and the sibling links — rendering on request and advertising
  // are different things.
  if (facet.location?.kind === "sector" && filtered.length < MIN_HUB_LISTINGS) notFound();

  const totalPages = Math.max(1, Math.ceil(filtered.length / LISTING_PAGE_SIZE));
  if (pageNum > totalPages) notFound();

  const start = (pageNum - 1) * LISTING_PAGE_SIZE;
  const pageProperties = filtered.slice(start, start + LISTING_PAGE_SIZE);

  const basePath = `/${routeBase}/gurgaon/${facet.slug}`;
  const pageUrl = pageNum > 1 ? `${SITE}${basePath}/page/${pageNum}` : `${SITE}${basePath}`;
  const prevHref = pageNum > 1 ? (pageNum === 2 ? basePath : `${basePath}/page/${pageNum - 1}`) : null;
  const nextHref = pageNum < totalPages ? `${basePath}/page/${pageNum + 1}` : null;

  // Hub intelligence and FAQs only on page 1. On page 7 of a sector they would
  // be the same blocks repeated under a different URL, which is the near
  // duplication paginated pages are supposed to avoid.
  const locationLabel = hubLocationLabel(facet);
  const showIntel = Boolean(facet.location && locationLabel && pageNum === 1);
  const intel = showIntel
    ? buildHubIntel(filtered, category, {
        kind: facet.location!.kind,
        label: locationLabel!,
      })
    : null;
  const faqs = intel ? buildHubFaqs(locationLabel!, category, intel, formatInr) : [];

  // Sibling hubs: the other sectors and corridors with real inventory in this
  // same category. This is what actually collapses crawl depth — every hub is
  // one click from every other, so the whole set is reachable in two clicks
  // from the homepage instead of eight hundred pages into a pagination chain.
  const siblingHubs = facet.location
    ? buildLocationHubs(all, category)
        .filter((h) => h.facet.slug !== facet.slug)
        .slice(0, 24)
    : [];

  const staticFacets = Object.values(staticFacetsFor(category)).filter(
    (f) => f.slug !== facet.slug
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: HUB_LABEL[category], item: `${SITE}/${routeBase}` },
          { "@type": "ListItem", position: 3, name: facet.label, item: `${SITE}${basePath}` },
        ],
      },
      {
        "@type": "CollectionPage",
        name: facet.label,
        description: facet.description,
        url: pageUrl,
      },
      ...(pageProperties.length > 0
        ? [
            {
              "@type": "ItemList",
              numberOfItems: filtered.length,
              itemListElement: pageProperties.map((p, i) => ({
                "@type": "ListItem",
                position: start + i + 1,
                name: p.title || facet.label,
                url: `${SITE}/${routeBase}/gurgaon/${slugForProperty(p)}`,
              })),
            },
          ]
        : []),
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${SITE}${basePath}#faq`,
              url: `${SITE}${basePath}`,
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

  return (
    <div className="bg-[#0B0B0C] min-h-screen text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <section className="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <Link href={`/${routeBase}`} className="hover:text-[#D9B268]">{HUB_LABEL[category]}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{facet.label}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {pageNum > 1 ? `${facet.label}, Page ${pageNum}` : facet.label}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">{facet.description}</p>
        <p className="mt-2 text-sm text-gray-500">
          Showing {pageProperties.length} of {filtered.length} listings.
        </p>
      </section>

      <section className="w-full max-w-7xl mx-auto px-4 my-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pageProperties.map((p) => (
            <PropertyCardLink key={p.id || p.listingUrl} property={p} routeBase={routeBase} />
          ))}
        </div>
      </section>

      {(prevHref || nextHref) && (
        <nav
          aria-label="Pagination"
          className="w-full max-w-7xl mx-auto px-4 my-12 flex items-center justify-between gap-4"
        >
          {prevHref ? (
            <Link
              href={prevHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-black px-4 py-2 text-sm font-medium text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
            >
              <ChevronLeft size={14} /> Page {pageNum - 1}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-gray-500">
            Page {pageNum} of {totalPages}
          </span>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-black px-4 py-2 text-sm font-medium text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
            >
              Page {pageNum + 1} <ChevronRight size={14} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      {intel && locationLabel && (
        <HubIntelligence
          locationLabel={locationLabel}
          category={category}
          intel={intel}
          bedroomHref={(bedrooms) => {
            const slug = `${bedrooms}-bhk`;
            return staticFacetsFor(category)[slug] ? `/${routeBase}/gurgaon/${slug}` : null;
          }}
        />
      )}

      {faqs.length > 0 && <Faq title={locationLabel ?? facet.label} items={faqs} />}

      {siblingHubs.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <h2 className="mb-1 text-2xl font-bold text-white">
            {category === "Rent" ? "Rentals" : "Property"} in other parts of Gurgaon
          </h2>
          <p className="mb-4 text-[13px] text-gray-500">
            Sectors and corridors where we currently have inventory, with the number of live
            listings in each.
          </p>
          <div className="flex flex-wrap gap-2">
            {siblingHubs.map((h) => (
              <Link
                key={h.facet.slug}
                href={`/${routeBase}/gurgaon/${h.facet.slug}`}
                className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
              >
                {hubLocationLabel(h.facet)} <span className="text-gray-500">({h.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {staticFacets.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Browse by {category === "Rent" ? "budget and size" : "budget, size and status"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {staticFacets.map((f) => (
              <Link
                key={f.slug}
                href={`/${routeBase}/gurgaon/${f.slug}`}
                className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
              >
                {f.label}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-gray-500">
            Looking for current rates by sector?{" "}
            <Link href="/property-rates-in-gurgaon" className="text-[#D9B268] hover:underline">
              See Gurgaon property rates, sector by sector
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
};

export default FacetedListingPage;
