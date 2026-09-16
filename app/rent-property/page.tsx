import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import { PropertyHubJsonLd, ListingPreviewSection, getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import { computeFacets } from "@/lib/listings/filters";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";

const title = "Rent Property in Gurgaon — Price, Photos & Floor Plans";
const description =
  "Browse verified rental listings in Gurgaon — apartments, builder floors, and more. Filter by property type, BHK, budget, and possession status.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/rent-property",
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: discoverImage2.src,
        width: discoverImage2.width,
        height: discoverImage2.height,
        alt: "Rent property in Gurgaon",
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
export default async function RentPropertyPage() {
  const all = await getAllSorted("Rent");
  const initialResults = all.slice(0, 8);
  const initialFacets = computeFacets(all);

  return (
    <>
      <PropertyHubJsonLd category="Rent" />
      <PropertyListingPage
        category="Rent"
        initialResults={initialResults}
        initialTotal={all.length}
        initialFacets={initialFacets}
      />
      <ListingPreviewSection category="Rent" skip={8} />
    </>
  );
}
