import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import { PropertyHubJsonLd, ListingPreviewSection, getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import { computeFacets } from "@/lib/listings/filters";
import discoverImage5 from "@/assets/images/discoverImage5.jpg";

const title = "Commercial Property in Gurgaon, Price, Photos & Plans";
const description =
  "Shops, offices, showrooms, and commercial land for sale and rent in Gurgaon: filter by investment grade, property type, and budget.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/commercial",
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: discoverImage5.src,
        width: discoverImage5.width,
        height: discoverImage5.height,
        alt: "Commercial properties in Gurgaon",
      },
    ],
  },
};

// See app/buy-property/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

// DEV-04 (2026-09-16) — see app/buy-property/page.tsx's comment on this
// same change: seeds PropertyListingPage's own server-rendered HTML with
// the first 8 results directly, and ListingPreviewSection covers the rest
// of "page 1" (records 8..24) so nothing appears twice.
export default async function CommercialPage() {
  const all = await getAllSorted("Commercial");
  const initialResults = all.slice(0, 8);
  const initialFacets = computeFacets(all);

  return (
    <>
      <PropertyHubJsonLd category="Commercial" />
      <PropertyListingPage
        category="Commercial"
        initialResults={initialResults}
        initialTotal={all.length}
        initialFacets={initialFacets}
      />
      <ListingPreviewSection category="Commercial" skip={8} />
    </>
  );
}
