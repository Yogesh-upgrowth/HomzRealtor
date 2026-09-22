import type { Metadata } from "next";
import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import { PropertyHubJsonLd, ListingPreviewSection, getAllSorted } from "@/components/PropertyListing/PaginatedListingPage";
import HubDirectory from "@/components/PropertyListing/HubDirectory";
import { computeFacets, hasActiveListingFilters, isIndexableListingUrl } from "@/lib/listings/filters";
import discoverImage1 from "@/assets/images/discoverImage1.jpg";

const title = "Buy Property in Gurgaon, Price, Photos & Floor Plans";
const description =
  "Resale and new-launch properties for sale in Gurgaon: filter by property type, BHK, budget, and possession status.";

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
  if (indexable) return base;
  return { ...base, alternates: undefined, robots: { index: false, follow: true } };
}

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
// R19-01 (2026-09-19): see app/rent-property/page.tsx for why searchParams is
// read here — the fallback grid and the ItemList must both stand down while a
// filter is active.
export default async function BuyPropertyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filtered = hasActiveListingFilters(params);

  const all = await getAllSorted("Sale");
  const initialResults = all.slice(0, 8);
  const initialFacets = computeFacets(all);

  return (
    <>
      <PropertyHubJsonLd category="Sale" filtered={filtered} />
      <PropertyListingPage
        category="Sale"
        initialResults={initialResults}
        initialTotal={all.length}
        initialFacets={initialFacets}
      />
      {!filtered && <ListingPreviewSection category="Sale" skip={8} />}
      {/* 2026-09-21: the entry point into the sector and corridor hubs.
          Before these existed, most of the catalogue was reachable only
          hundreds of pages into a pagination chain — offered to Google in
          the sitemap and buried by the site's own link graph. Hidden while
          a filter is active, same as the preview grid above: the visitor
          has already narrowed the set and a full area index under their
          results is noise. */}
      {!filtered && <HubDirectory category="Sale" />}
    </>
  );
}
