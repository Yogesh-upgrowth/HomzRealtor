import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FacetedListingPage, { BUY_FACETS, getFacetPageCount } from "@/components/PropertyListing/FacetedListingPage";
import { MAX_STATIC_PAGES } from "@/components/PropertyListing/PaginatedListingPage";

const SITE = "https://www.homzrealtor.com";

export const revalidate = 604800;

// Only real for city="gurgaon" + a known facet slug — no actual property
// ever has a /page/N sub-path (nothing links to one), so this route is
// unreachable for real listings by construction, not by a runtime check.
//
// Capped at MAX_STATIC_PAGES per facet (see that constant's comment on
// PaginatedListingPage.tsx) — broad facets like "3-bhk" or "ready-to-move"
// each matched several hundred pages of the ~874-page Sale catalogue, and
// building all of them across all 6 facets was a second, compounding
// contributor to the same build-time OOM the base pagination caused.
export async function generateStaticParams() {
  const results = await Promise.all(
    Object.keys(BUY_FACETS).map(async (slug) => {
      const totalPages = await getFacetPageCount(BUY_FACETS[slug]);
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
  return parseInt(raw, 10);
}

type PageParams = { params: Promise<{ city: string; slug: string; page: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug, page } = await params;
  const facet = city === "gurgaon" ? BUY_FACETS[slug] : undefined;
  const pageNum = parsePageNumber(page);
  if (!facet || !pageNum) return {};

  const url = `${SITE}/buy-property/${city}/${slug}/page/${pageNum}`;
  return {
    title: `${facet.label} — Page ${pageNum}`,
    description: facet.description,
    alternates: { canonical: url },
  };
}

const FacetPagePaginated = async ({ params }: PageParams) => {
  const { city, slug, page } = await params;
  const facet = city === "gurgaon" ? BUY_FACETS[slug] : undefined;
  const pageNum = parsePageNumber(page);
  if (!facet || !pageNum) notFound();
  if (pageNum === 1) notFound(); // canonical URL for page 1 is the base facet path
  return <FacetedListingPage facet={facet} pageNum={pageNum} />;
};

export default FacetPagePaginated;
