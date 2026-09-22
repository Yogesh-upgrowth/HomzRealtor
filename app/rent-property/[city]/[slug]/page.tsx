import type { Metadata } from "next";
import { makePropertyDetailPage } from "@/components/PropertyListing/propertyDetailRoute";
import FacetedListingPage from "@/components/PropertyListing/FacetedListingPage";
import { resolveFacet } from "@/lib/listings/facets";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too (verified — see app/project-listing/[city]/
// page.tsx's comment); [] still activates on-demand ISR for every param.
// 1 week, not 30min or 6h — see app/buy-property/[city]/[slug]/page.tsx's comment on this same line (Vercel Hobby-plan ISR-write/origin-transfer/CPU budget, 2026-09-09).
export const revalidate = 604800;

// 2026-09-21: Rent now carries landing pages of its own. It had ~13,000
// listings and not one — every rental search fell back to the citywide hub,
// and "2 BHK for rent in Sohna Road" had nowhere to land.
//
// Same route shape as the Sale side, and for the same reason: a static
// "gurgaon" segment alongside this dynamic [city] one would take routing
// precedence over every real property slug (confirmed live on the Sale side —
// it 404'd every listing). Checking the known facet set first, inside this
// same route, is what avoids that. See app/buy-property/[city]/[slug]/page.tsx.
//
// Returns [] deliberately, which is what this route did before it grew a facet
// branch — and the reason is worth recording, because returning the facet
// slugs here looks more thorough and is worse.
//
// getAllSorted() reads the segment through lib/listings/segmentCache.ts, which
// fetches with `cache: "no-store"` on purpose (Next's data cache silently
// drops responses over 2MB and a real segment is 5-48MB). A param list that
// Next then tries to prerender hits that no-store fetch during the build and
// the whole route is demoted to fully dynamic — measured: listing the 10
// RENT_FACETS slugs here turned this route from ● to ƒ, which would mean every
// one of the ~13,000 rent detail pages served by the same route re-renders per
// request instead of being ISR-cached. That is the exact class of load that
// got this project paused by Vercel on 2026-09-09.
//
// An empty list still activates on-demand ISR for every param (verified — see
// app/project-listing/[city]/page.tsx's comment), so facets and detail pages
// alike are rendered once and then cached for the revalidate window above.
export function generateStaticParams() {
  return [];
}

const SITE = "https://www.homzrealtor.com";
const { generateMetadata: detailMetadata, Page: DetailPage } = makePropertyDetailPage("Rent");

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const { city, slug } = await props.params;
  const facet = city === "gurgaon" ? resolveFacet("Rent", slug) : undefined;
  if (facet) {
    const url = `${SITE}/rent-property/${city}/${slug}`;
    const title = facet.location ? facet.label : `${facet.label}, Rent, Photos & Details`;
    return {
      title,
      description: facet.description,
      alternates: { canonical: url },
      openGraph: { title: facet.label, description: facet.description, url, type: "website" },
    };
  }
  return detailMetadata(props);
}

const Page = async (props: PageParams) => {
  const { city, slug } = await props.params;
  const facet = city === "gurgaon" ? resolveFacet("Rent", slug) : undefined;
  if (facet) {
    return <FacetedListingPage facet={facet} pageNum={1} category="Rent" />;
  }
  return DetailPage(props);
};

export default Page;
