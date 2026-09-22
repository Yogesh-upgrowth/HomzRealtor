import type { Metadata } from "next";
import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import { PropertyHubJsonLd, ListingPreviewSection, getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import { computeFacets, hasActiveListingFilters, isIndexableListingUrl } from "@/lib/listings/filters";
import discoverImage5 from "@/assets/images/discoverImage5.jpg";

const title = "Commercial Property in Gurgaon, Price, Photos & Plans";
const description =
  "Shops, offices, showrooms, and commercial land for sale and rent in Gurgaon: filter by investment grade, property type, and budget.";

// Checklist item 18 (2026-09-22): arbitrary filter, sort and search URLs are
// not offered for indexing. Static metadata could not express that — it had no
// access to the query string — so this is a generateMetadata now.
//
// THE CANONICAL IS DROPPED ON A FILTERED URL, and that is the part worth
// reading twice. Emitting noindex on a URL whose canonical points at a page we
// DO want indexed is a conflicting signal: Google may follow the canonical and
// apply the noindex to the target, taking the clean hub down with it. So a
// filtered URL gets noindex,follow and no canonical tag at all, while the
// clean URL keeps its canonical exactly as before. `follow` throughout — every
// listing link on a filtered page is a real destination.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const indexable = isIndexableListingUrl(await searchParams);
  const base: Metadata = {
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
  if (indexable) return base;
  return { ...base, alternates: undefined, robots: { index: false, follow: true } };
}

// See app/buy-property/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

// DEV-04 (2026-09-16) — see app/buy-property/page.tsx's comment on this
// same change: seeds PropertyListingPage's own server-rendered HTML with
// the first 8 results directly, and ListingPreviewSection covers the rest
// of "page 1" (records 8..24) so nothing appears twice.
// R19-01 (2026-09-19): see app/rent-property/page.tsx for why searchParams is
// read here — the fallback grid and the ItemList must both stand down while a
// filter is active.
export default async function CommercialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtered = hasActiveListingFilters(params);

  const all = await getAllSorted("Commercial");
  const initialResults = all.slice(0, 8);
  const initialFacets = computeFacets(all);

  return (
    <>
      <PropertyHubJsonLd category="Commercial" filtered={filtered} />
      <PropertyListingPage
        category="Commercial"
        initialResults={initialResults}
        initialTotal={all.length}
        initialFacets={initialFacets}
      />
      {!filtered && <ListingPreviewSection category="Commercial" skip={8} />}
    </>
  );
}
