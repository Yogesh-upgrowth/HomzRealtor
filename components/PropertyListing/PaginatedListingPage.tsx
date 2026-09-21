// Server-rendered pagination for the individual-listing hubs (buy-property,
// rent-property, commercial). Same fix as
// app/project-listing/[city]/page/[page]/page.tsx: PropertyListingPage.tsx
// is a client component that fetches from /api/listings only in the
// browser, shipping zero listing links in its initial HTML — SEO audit
// (C-02, 2026-09-08) found 1,503 buy/rent/commercial URLs orphaned as a
// result. This route exists so every listing has a real, server-rendered
// <a> pointing to it that a crawler can follow without executing JS.
//
// Shared by all three category route files (app/buy-property/page/[page],
// app/rent-property/page/[page], app/commercial/page/[page]) rather than
// duplicated three times — same data shape, same layout, just a different
// category/heading.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HomesCard from "@/components/HomeCards";
import { getSortedSegment } from "@/lib/listings/segmentCache";
import { PROPERTY_TYPE_LABELS, type PropertyCategory } from "@/lib/listings/filters";
import { propertySegment, type RawHomzProperty } from "@/lib/scraping/homzbackend";
import { validImages } from "@/lib/intelligence/view-model";
import { salvageAreaText } from "@/lib/intelligence/normalize";
import { slugForProperty } from "@/lib/intelligence/property-view";
import areaImg from "@/public/Apartment.svg";
import unitImg from "@/public/bedroom.svg";
import statusImg from "@/public/developmentSize.svg";
import devImg from "@/public/totalUnit.svg";

const SITE = "https://www.homzrealtor.com";
// Same size as the project pagination pages — light HTML, still a
// meaningful slice per crawl. Defined in lib/listings/facets.ts, which is
// React-free and so importable by app/sitemap.ts; re-exported here under the
// name every existing caller already uses, so there is one value rather than
// two that can drift.
export { LISTING_PAGE_SIZE as PAGE_SIZE } from "@/lib/listings/facets";
import { LISTING_PAGE_SIZE as PAGE_SIZE } from "@/lib/listings/facets";

// Build-time cap on how many pagination pages generateStaticParams actually
// enumerates. Confirmed by a real production build: with Sale at ~20,957
// listings and Rent at ~12,945 (both at PAGE_SIZE=24), fully pre-rendering
// every page — ~874 + ~540 pages, on top of everything else the site
// statically generates — pushed total static output past 3,750 pages and
// reliably OOM'd `next build` (reproduced with --max-old-space-size up to
// 8192 and reduced worker concurrency; the identical build succeeds at the
// commit before these pagination routes existed). Pages beyond this cap
// still work — `dynamicParams` defaults to true, and `revalidate = 1800` on
// every route using this is what turns that on-demand render into a cached
// one after the first hit — they're just not built preemptively. Real
// crawl/user traffic essentially never reaches page 20+ of a listing feed
// anyway.
export const MAX_STATIC_PAGES = 20;

// Every route using this component (and the project-listing/[city] and
// faceted pagination routes) validates its page-number param with a plain
// "one or more digits" regex, then fetches the *entire* underlying segment
// (up to ~48MB, per lib/listings/segmentCache.ts) just to compute
// totalPages and compare it against the requested page. That means a
// garbage page number a bot guesses (e.g. /buy-property/page/999999999)
// paid the full fetch+parse cost before 404ing — and since these routes
// are ISR-cached for a week, each distinct garbage number tried became its
// own cached 404, in addition to the origin-transfer/CPU cost of computing
// it. Real inventory tops out under 900 pages today (Sale, the largest
// category, at PAGE_SIZE=24); this is a generous ceiling with headroom for
// growth, checked in each route's parsePageNumber() before any fetch runs.
export const MAX_REASONABLE_PAGE = 2000;

export const ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

export const CATEGORY_HEADING: Record<PropertyCategory, string> = {
  Sale: "Properties for Sale in Gurgaon",
  Rent: "Properties for Rent in Gurgaon",
  Pg: "PG Accommodations in Gurgaon",
  Commercial: "Commercial Properties in Gurgaon",
};

function getValidImage(images: string[] = []) {
  return validImages(images)[0];
}

// Must match PropertyListingPage.tsx's formatProperty() exactly (same
// HomesCard props), and slugForProperty() must match its local slugFor() —
// both already share that constraint via lib/intelligence/property-view.ts.
export function formatProperty(property: RawHomzProperty) {
  return {
    imgUrl: getValidImage(property.images) || "/dummy.svg",
    location: property.location || "N/A",
    reranumber: property.reraId || "N/A",
    rerastatus: property.reraStatus,
    title: property.title || "Untitled Listing",
    btntag: property.price || "View Details",
    specifications: [
      // R19-04: see PropertyListingPage.tsx — same guard, same reason.
      { icon: areaImg, label: "Area", value: salvageAreaText(property.size) || "N/A" },
      {
        icon: unitImg,
        label: "Config",
        value: property.configuration || (property.bedrooms ? `${property.bedrooms} BHK` : "N/A"),
      },
      { icon: statusImg, label: "Status", value: property.projectStatus || "N/A" },
      { icon: devImg, label: "Type", value: PROPERTY_TYPE_LABELS[property.propertyType || ""] || "N/A" },
    ],
  };
}

export async function getAllSorted(category: PropertyCategory): Promise<RawHomzProperty[]> {
  // Same RERA-first ordering as /api/listings — kept consistent so the
  // server-rendered pagination sequence a crawler sees matches what the
  // interactive filtered search shows. Pre-sorted and cached alongside the
  // raw segment fetch (lib/listings/segmentCache.ts) rather than re-sorted
  // on every call — this function runs multiple times per page render
  // (generateStaticParams, the page component, JSON-LD) plus once per ISR
  // regeneration across every buy/rent/commercial pagination page.
  const { sorted } = await getSortedSegment(propertySegment("ggn", category)).catch(
    () => ({ sorted: [] as RawHomzProperty[] })
  );
  return sorted;
}

export async function getPageCount(category: PropertyCategory): Promise<number> {
  const all = await getAllSorted(category);
  return Math.max(1, Math.ceil(all.length / PAGE_SIZE));
}

export function PropertyCardLink({ property, routeBase }: { property: RawHomzProperty; routeBase: string }) {
  return (
    <Link href={`/${routeBase}/gurgaon/${slugForProperty(property)}`}>
      <HomesCard {...formatProperty(property)} />
    </Link>
  );
}

// Server-rendered preview block for each hub's own landing page
// (app/buy-property/page.tsx etc.) — gives crawlers real listing links
// plus an entry point into the full paginated sequence without needing JS.
//
// Covers the full first PAGE_SIZE page (records 0..PAGE_SIZE), not a
// smaller preview slice — SEO audit 2026-09-07 P1 ("Base hub and /page/1
// overlap") made /page/1 404 (its content duplicated this hub, both
// self-canonical) so this hub IS page 1 now, and /page/2 starts at index
// PAGE_SIZE; a smaller preview here would silently drop whichever listings
// sit between the old preview size and PAGE_SIZE from every server-rendered
// crawl path on the site.
//
// `skip` (DEV-04, 2026-09-16): the hub page also seeds PropertyListingPage's
// own interactive grid with server-rendered data for records 0..skip (see
// app/buy-property/page.tsx) — passing skip here keeps this section's
// total PAGE_SIZE-wide "page 1" coverage and /page/2 boundary exactly as
// before, just rendering only the remainder (skip..PAGE_SIZE) so nothing
// appears twice on the page.
export async function ListingPreviewSection({
  category,
  skip = 0,
}: {
  category: PropertyCategory;
  skip?: number;
}) {
  const routeBase = ROUTE_BASE[category];
  const all = await getAllSorted(category);
  if (all.length === 0) return null;
  const preview = all.slice(skip, PAGE_SIZE);
  if (preview.length === 0) return null;
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));

  return (
    <section className="w-full bg-[#0B0B0C] py-12">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{CATEGORY_HEADING[category]}</h2>
          {totalPages > 1 && (
            <Link
              href={`/${routeBase}/page/2`}
              className="text-sm font-medium text-[#D9B268] hover:opacity-80 whitespace-nowrap"
            >
              View all {all.length} →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preview.map((p) => (
            <PropertyCardLink key={p.id || p.listingUrl} property={p} routeBase={routeBase} />
          ))}
        </div>
      </div>
    </section>
  );
}

function safeJson(g: unknown): string {
  return JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(String.fromCharCode(0x2028))
    .join("\\u2028")
    .split(String.fromCharCode(0x2029))
    .join("\\u2029");
}

// SEO audit H-04 (2026-09-08): these four hubs emitted only the sitewide
// Organization/WebSite graph — no BreadcrumbList, CollectionPage or
// ItemList, unlike every other collection-type template on the site
// (/project-listing/[city]/sectors/[sector], /developer/[slug]). ItemList is
// built from the same PAGE_SIZE slice ListingPreviewSection actually
// renders on the page, not the full segment — structured data has to match
// what's visibly on the page, not the whole underlying dataset.
// R19-06 (2026-09-19): `filtered` suppresses the ItemList. This component is
// a server component with no access to the visitor's filter state, so once a
// filter is applied the top-24 slice below no longer describes what is on the
// page — the recheck caught a Sector 82 rental query whose ItemList still
// declared 24 unfiltered items against 16 rendered anchors. Emitting no
// ItemList is correct there: the CollectionPage still describes the page, and
// structured data must not assert a list it cannot see.
export async function PropertyHubJsonLd({
  category,
  filtered = false,
}: {
  category: PropertyCategory;
  filtered?: boolean;
}) {
  const routeBase = ROUTE_BASE[category];
  const heading = CATEGORY_HEADING[category];
  const pageUrl = `${SITE}/${routeBase}`;
  const all = await getAllSorted(category);
  const preview = filtered ? [] : all.slice(0, PAGE_SIZE);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: heading, item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: heading,
        url: pageUrl,
      },
      ...(preview.length > 0
        ? [
            {
              "@type": "ItemList",
              // Count the items actually enumerated here, never the segment
              // total — the two disagreeing is what the recheck flagged.
              numberOfItems: preview.length,
              itemListElement: preview.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.title || "Property Listing",
                url: `${SITE}/${routeBase}/gurgaon/${slugForProperty(p)}`,
              })),
            },
          ]
        : []),
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />;
}

type Props = { category: PropertyCategory; pageNum: number };

const PaginatedListingPage = async ({ category, pageNum }: Props) => {
  const routeBase = ROUTE_BASE[category];
  const heading = CATEGORY_HEADING[category];
  const all = await getAllSorted(category);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  if (pageNum > totalPages) notFound();

  const start = (pageNum - 1) * PAGE_SIZE;
  const pageProperties = all.slice(start, start + PAGE_SIZE);

  const pageUrl = `${SITE}/${routeBase}/page/${pageNum}`;
  // page 1 of this pagination now 404s (its content lives at the base hub
  // URL instead — see app/{buy-property,rent-property,commercial}/page/[page]/page.tsx),
  // so "back to the previous page" from page 2 must land on the hub, not /page/1.
  const prevHref = pageNum > 1 ? (pageNum === 2 ? `/${routeBase}` : `/${routeBase}/page/${pageNum - 1}`) : null;
  const nextHref = pageNum < totalPages ? `/${routeBase}/page/${pageNum + 1}` : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: heading, item: `${SITE}/${routeBase}` },
          { "@type": "ListItem", position: 3, name: `Page ${pageNum}`, item: pageUrl },
        ],
      },
      { "@type": "CollectionPage", name: `${heading}, Page ${pageNum}`, url: pageUrl },
    ],
  };
  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    <div className="bg-[#0B0B0C] min-h-screen text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <section className="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <Link href={`/${routeBase}`} className="hover:text-[#D9B268]">{heading}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">Page {pageNum}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {`${heading}, Page ${pageNum} of ${totalPages}`}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
          Showing {pageProperties.length} of {all.length} listings.
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
    </div>
  );
};

export default PaginatedListingPage;
