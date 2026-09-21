import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FacetedListingPage, { getFacetPageCount } from "@/components/PropertyListing/FacetedListingPage";
import { RENT_FACETS, resolveFacet } from "@/lib/listings/facets";
import { MAX_STATIC_PAGES, MAX_REASONABLE_PAGE } from "@/components/PropertyListing/PaginatedListingPage";

const SITE = "https://www.homzrealtor.com";

export const revalidate = 604800;

// New 2026-09-21 alongside the Rent facets themselves — the Sale side has had
// this route since the facets were introduced, Rent had no facets to paginate.
//
// Only real for city="gurgaon" plus a known facet slug. No actual property
// ever has a /page/N sub-path (nothing links to one), so this route is
// unreachable for real listings by construction rather than by a runtime check.
//
// Capped at MAX_STATIC_PAGES per facet — see that constant's comment on
// PaginatedListingPage.tsx. Location hubs are excluded from pre-rendering
// entirely (they are not in RENT_FACETS), for the reason given on the base
// route: enumerating ~100 hubs × their pages at build time is the kind of
// volume that got this project's deploys paused once already.
export async function generateStaticParams() {
  const results = await Promise.all(
    Object.keys(RENT_FACETS).map(async (slug) => {
      const totalPages = await getFacetPageCount(RENT_FACETS[slug], "Rent");
      const staticCount = Math.max(0, Math.min(totalPages, MAX_STATIC_PAGES + 1) - 1);
      // Page 1 is served at the base [city]/[slug] URL, not .../page/1.
      return Array.from({ length: staticCount }, (_, i) => ({
        city: "gurgaon",
        slug,
        page: String(i + 2),
      }));
    })
  );
  return results.flat();
}

function parsePageNumber(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  // Reject before any data fetch — see MAX_REASONABLE_PAGE's comment.
  if (n > MAX_REASONABLE_PAGE) return null;
  return n;
}

type PageParams = { params: Promise<{ city: string; slug: string; page: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug, page } = await params;
  const facet = city === "gurgaon" ? resolveFacet("Rent", slug) : undefined;
  const pageNum = parsePageNumber(page);
  if (!facet || !pageNum) return {};

  const url = `${SITE}/rent-property/${city}/${slug}/page/${pageNum}`;
  return {
    title: `${facet.label}, Page ${pageNum}`,
    description: facet.description,
    alternates: { canonical: url },
  };
}

const RentFacetPagePaginated = async ({ params }: PageParams) => {
  const { city, slug, page } = await params;
  const facet = city === "gurgaon" ? resolveFacet("Rent", slug) : undefined;
  const pageNum = parsePageNumber(page);
  if (!facet || !pageNum) notFound();
  if (pageNum === 1) notFound(); // canonical URL for page 1 is the base facet path
  return <FacetedListingPage facet={facet} pageNum={pageNum} category="Rent" />;
};

export default RentFacetPagePaginated;
