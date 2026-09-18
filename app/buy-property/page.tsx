import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import { PropertyHubJsonLd, ListingPreviewSection, getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import { computeFacets } from "@/lib/listings/filters";
import discoverImage1 from "@/assets/images/discoverImage1.jpg";

const title = "Buy Property in Gurgaon, Price, Photos & Floor Plans";
const description =
  "Resale and new-launch properties for sale in Gurgaon: filter by property type, BHK, budget, and possession status.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/buy-property",
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: discoverImage1.src,
        width: discoverImage1.width,
        height: discoverImage1.height,
        alt: "Buy property in Gurgaon",
      },
    ],
  },
};

// Forces per-request rendering instead of a static shell — PropertyListingPage
// is a client component that reads useSearchParams(), and without this,
// Next.js's static optimization bails that subtree out to its Suspense
// fallback (an empty div) in the prerendered HTML crawlers actually see.
export const dynamic = "force-dynamic";

// DEV-04 (2026-09-16): PropertyListingPage's own grid used to ship zero
// content pre-hydration (a client component reading useSearchParams()),
// which is why ListingPreviewSection existed — a separate 24-card static
// block giving crawlers real server-rendered links. But a real visitor
// with JS enabled then saw the same top 8-24 listings twice: once via that
// static section, once via PropertyListingPage's own grid once it fetched.
// Passing the same first-8 data PropertyListingPage would otherwise fetch
// client-side as `initial*` props instead means its own server-rendered
// HTML now carries those 8 real cards directly (see
// hooks/useListingsPage.ts), and ListingPreviewSection's `skip={8}` renders
// only records 8..24 — together still the full PAGE_SIZE=24 "page 1" the
// /page/2 boundary already assumes, just with no record appearing twice.
export default async function BuyPropertyPage() {
  const all = await getAllSorted("Sale");
  const initialResults = all.slice(0, 8);
  const initialFacets = computeFacets(all);

  return (
    <>
      <PropertyHubJsonLd category="Sale" />
      <PropertyListingPage
        category="Sale"
        initialResults={initialResults}
        initialTotal={all.length}
        initialFacets={initialFacets}
      />
      <ListingPreviewSection category="Sale" skip={8} />
    </>
  );
}
