import type { Metadata } from "next";
import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import { PropertyHubJsonLd, getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import { computeFacets } from "@/lib/listings/filters";

const title = "PG Accommodation in Gurgaon";
const description =
  "Paying-guest accommodations in Gurgaon: filter by budget and amenities.";

// DEV-04 (2026-09-16): confirmed live against the real production feed —
// PG genuinely has zero listings right now, not a one-session fluke (the
// handoff's own guardrail against inferring permanent absence from one
// check). This hub was previously unconditionally indexable despite
// rendering "No listings found" with no cards/ItemList. `generateMetadata`
// (was a static object) now checks real inventory and sets noindex,follow
// only while it's actually empty — automatically reverts to indexable the
// moment real PG supply exists in the feed, no manual flag to remember to
// flip back. See app/sitemap.ts's buildContentSegment for the matching
// sitemap-exclusion half of this.
export async function generateMetadata(): Promise<Metadata> {
  const all = await getAllSorted("Pg");
  const hasInventory = all.length > 0;
  return {
    title,
    description,
    alternates: { canonical: "/pg-property" },
    openGraph: { title, description },
    ...(hasInventory ? {} : { robots: { index: false, follow: true } }),
  };
}

// See app/buy-property/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

// This hub never had a ListingPreviewSection at all — confirmed live: 200/
// indexable, CollectionPage/BreadcrumbList present, but "No listings found"
// and zero cards/ItemList, since PropertyListingPage ships no content
// pre-hydration. Seeding it with real server-fetched data (same fix as
// buy/rent/commercial, see app/buy-property/page.tsx's comment) gives this
// hub real server-rendered cards the moment real PG inventory exists.
export default async function PgPropertyPage() {
  const all = await getAllSorted("Pg");
  const initialResults = all.slice(0, 8);
  const initialFacets = computeFacets(all);

  return (
    <>
      <PropertyHubJsonLd category="Pg" />
      <PropertyListingPage
        category="Pg"
        initialResults={initialResults}
        initialTotal={all.length}
        initialFacets={initialFacets}
      />
    </>
  );
}
