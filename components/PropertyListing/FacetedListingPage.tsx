// Server-rendered faceted landing pages (/buy-property/gurgaon/3-bhk,
// /under-1-crore, /ready-to-move, etc.) — content audit B-04 (2026-09-08):
// seven blog posts target purely transactional queries ("best 3 BHK flats
// in Gurgaon") that had no real landing page to serve — the filtered
// /buy-property?bedrooms=3 URL correctly canonicalises back to the
// unfiltered hub (see PropertyListingPage.tsx), so it was never a real,
// indexable destination. This is that destination.
//
// Reuses filterProperties() — the exact same server-side filter logic
// /api/listings already uses — with a *fixed* filter per facet, not one
// read from the URL. Same "known, finite ID set" principle as H-01's
// compare-page fix: facets are enumerated by generateStaticParams(), never
// combinatorial.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllSorted, PropertyCardLink, PAGE_SIZE } from "./PaginatedListingPage";
import { filterProperties, type ListingFilters, type PropertyCategory } from "@/lib/listings/filters";
import { slugForProperty } from "@/lib/intelligence/property-view";

const SITE = "https://www.homzrealtor.com";

export type FacetDef = {
  slug: string;
  label: string;
  description: string;
  filters: ListingFilters;
};

// The 7 transactional posts this closes the landing-page gap for, minus
// "luxury" (no exact filter match — see the note where it's defined) are
// covered by these 6.
export const BUY_FACETS: Record<string, FacetDef> = {
  "3-bhk": {
    slug: "3-bhk",
    label: "3 BHK Flats for Sale in Gurgaon",
    description: "3 BHK apartments and flats for sale in Gurgaon, from HomzRealtor's live listing catalogue.",
    filters: { bedrooms: "3" },
  },
  "4-bhk": {
    slug: "4-bhk",
    label: "4 BHK Flats for Sale in Gurgaon",
    description: "4 BHK apartments and flats for sale in Gurgaon, from HomzRealtor's live listing catalogue.",
    filters: { bedrooms: "4" },
  },
  "under-1-crore": {
    slug: "under-1-crore",
    label: "Flats Under ₹1 Crore in Gurgaon",
    description: "Properties for sale in Gurgaon priced under ₹1 crore, from HomzRealtor's live listing catalogue.",
    filters: { budget: "under-1cr" },
  },
  "under-2-crore": {
    slug: "under-2-crore",
    label: "Property Investment Under ₹2 Crore in Gurgaon",
    description: "Properties for sale in Gurgaon priced under ₹2 crore, from HomzRealtor's live listing catalogue.",
    filters: { budget: "under-2cr" },
  },
  "ready-to-move": {
    slug: "ready-to-move",
    label: "Ready to Move Flats in Gurgaon",
    description: "Ready-to-move properties for sale in Gurgaon — no construction wait — from HomzRealtor's live listing catalogue.",
    filters: { possession: "ready-to-move" },
  },
  plots: {
    slug: "plots",
    label: "Plots for Sale in Gurgaon",
    description: "Residential and investment plots for sale in Gurgaon, from HomzRealtor's live listing catalogue.",
    filters: { propertyType: "plot" },
  },
};

const CATEGORY: PropertyCategory = "Sale";
const ROUTE_BASE = "buy-property";

export async function getFacetProperties(facet: FacetDef) {
  const all = await getAllSorted(CATEGORY);
  return filterProperties(all, facet.filters, CATEGORY);
}

export async function getFacetPageCount(facet: FacetDef): Promise<number> {
  const filtered = await getFacetProperties(facet);
  return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
}

function safeJson(g: unknown): string {
  return JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

type Props = { facet: FacetDef; pageNum: number };

const FacetedListingPage = async ({ facet, pageNum }: Props) => {
  const filtered = await getFacetProperties(facet);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (pageNum > totalPages) notFound();

  const start = (pageNum - 1) * PAGE_SIZE;
  const pageProperties = filtered.slice(start, start + PAGE_SIZE);

  const basePath = `/${ROUTE_BASE}/gurgaon/${facet.slug}`;
  const pageUrl = pageNum > 1 ? `${SITE}${basePath}/page/${pageNum}` : `${SITE}${basePath}`;
  const prevHref = pageNum > 1 ? (pageNum === 2 ? basePath : `${basePath}/page/${pageNum - 1}`) : null;
  const nextHref = pageNum < totalPages ? `${basePath}/page/${pageNum + 1}` : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Buy Property", item: `${SITE}/${ROUTE_BASE}` },
          { "@type": "ListItem", position: 3, name: facet.label, item: `${SITE}${basePath}` },
        ],
      },
      {
        "@type": "CollectionPage",
        name: facet.label,
        url: pageUrl,
      },
      ...(pageProperties.length > 0
        ? [
            {
              "@type": "ItemList",
              itemListElement: pageProperties.map((p, i) => ({
                "@type": "ListItem",
                position: start + i + 1,
                name: p.title || facet.label,
                url: `${SITE}/${ROUTE_BASE}/gurgaon/${slugForProperty(p)}`,
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
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <Link href={`/${ROUTE_BASE}`} className="hover:text-[#D9B268]">Buy Property</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{facet.label}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {pageNum > 1 ? `${facet.label} — Page ${pageNum}` : facet.label}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">{facet.description}</p>
        <p className="mt-2 text-sm text-gray-500">
          Showing {pageProperties.length} of {filtered.length} listings.
        </p>
      </section>

      <section className="w-full max-w-7xl mx-auto px-4 my-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pageProperties.map((p) => (
            <PropertyCardLink key={p.id || p.listingUrl} property={p} routeBase={ROUTE_BASE} />
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

export default FacetedListingPage;
