import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import { PropertyHubJsonLd, ListingPreviewSection, getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import HubDirectory from "@/components/PropertyListing/HubDirectory";
import { computeFacets, hasActiveListingFilters } from "@/lib/listings/filters";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";

const title = "Rent Property in Gurgaon, Price, Photos & Floor Plans";
const description =
  "Browse verified rental listings in Gurgaon: apartments, builder floors, and more. Filter by property type, BHK, budget, and possession status.";

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
//
// R19-01 (2026-09-19): ListingPreviewSection is a server component that never
// sees the visitor's filters, so with a filter applied it kept rendering 16
// citywide cards directly beneath PropertyListingPage's own "No listings match
// your search" empty state, under a second <h2> repeating the page H1. The
// recheck reproduced this with Plot + Under 25k: an honest no-match message
// followed immediately by unrelated rentals at 28,000 and 69,000. Reading
// searchParams here (the route is already force-dynamic) lets both the
// fallback grid and the ItemList markup stand down while filtering is active.
export default async function RentPropertyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtered = hasActiveListingFilters(params);

  const all = await getAllSorted("Rent");
  const initialResults = all.slice(0, 8);
  const initialFacets = computeFacets(all);

  return (
    <>
      <PropertyHubJsonLd category="Rent" filtered={filtered} />
      <PropertyListingPage
        category="Rent"
        initialResults={initialResults}
        initialTotal={all.length}
        initialFacets={initialFacets}
      />
      {!filtered && <ListingPreviewSection category="Rent" skip={8} />}
      {/* 2026-09-21: the entry point into the sector and corridor hubs.
          Before these existed, most of the catalogue was reachable only
          hundreds of pages into a pagination chain — offered to Google in
          the sitemap and buried by the site's own link graph. Hidden while
          a filter is active, same as the preview grid above: the visitor
          has already narrowed the set and a full area index under their
          results is noise. */}
      {!filtered && <HubDirectory category="Rent" />}
    </>
  );
}
