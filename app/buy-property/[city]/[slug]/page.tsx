import type { Metadata } from "next";
import { makePropertyDetailPage } from "@/components/PropertyListing/propertyDetailRoute";
import FacetedListingPage, { BUY_FACETS } from "@/components/PropertyListing/FacetedListingPage";

// ISR — without this every crawl/visit re-executes the origin function
// uncached. revalidate alone doesn't activate it for a dynamic segment —
// needs generateStaticParams too (verified — see app/project-listing/[city]/
// page.tsx's comment); [] still activates on-demand ISR for every param.
//
// 1 week, not the 30min this used to be — Vercel paused the whole project
// (2026-09-09) after this route alone (~20,957 real Sale listings, each
// its own ISR-backed page) blew through the Hobby plan's ISR-write,
// origin-transfer and CPU budgets. lib/listings/segmentCache.ts's own
// comment says the underlying feed "only actually changes once a day" —
// every 30-minute regeneration was needless churn against data that
// hadn't moved. First widened to 6h (~12x fewer regenerations); moved to
// 1 week (2026-09-09, same day) once the plan was to also raise the
// backend's (homz-scrape) own cache TTL to match — no point this frontend
// checking for fresh data faster than the backend it calls could ever
// actually provide it. Same reasoning applied to every other high-volume
// route (rent/commercial/pg detail, all pagination, developer/sector/
// compare pages). A stale-for-up-to-a-week listing is an acceptable
// trade-off against getting the whole project paused again; the /flat and
// project-detail routes already used 14 days for the same reason.
export const revalidate = 604800;

// Content audit B-04 (2026-09-08): faceted landing pages (3-bhk,
// under-1-crore, ...) live at this exact [city]/[slug] shape, not a
// sibling static route — a static "gurgaon" segment alongside this dynamic
// [city] one would take routing precedence over EVERY real Gurgaon
// property slug (confirmed live: it 404'd every existing listing), since
// Next.js prefers the more specific static segment at that path depth.
// Checking the known, finite facet-slug set first, inside this same route,
// is what avoids that.
export function generateStaticParams() {
  return Object.keys(BUY_FACETS).map((slug) => ({ city: "gurgaon", slug }));
}

const SITE = "https://www.homzrealtor.com";
const { generateMetadata: detailMetadata, Page: DetailPage } = makePropertyDetailPage("Sale");

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const { city, slug } = await props.params;
  const facet = city === "gurgaon" ? BUY_FACETS[slug] : undefined;
  if (facet) {
    const url = `${SITE}/buy-property/${city}/${slug}`;
    return {
      title: `${facet.label} — Price, Photos & Details`,
      description: facet.description,
      alternates: { canonical: url },
      openGraph: { title: facet.label, description: facet.description, url, type: "website" },
    };
  }
  return detailMetadata(props);
}

const Page = async (props: PageParams) => {
  const { city, slug } = await props.params;
  const facet = city === "gurgaon" ? BUY_FACETS[slug] : undefined;
  if (facet) {
    return <FacetedListingPage facet={facet} pageNum={1} />;
  }
  return DetailPage(props);
};

export default Page;
