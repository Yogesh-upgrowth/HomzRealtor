// Factory for the four category detail routes (app/{buy-property,rent-
// property,commercial,pg-property}/[city]/[slug]/page.tsx) — same
// generateMetadata + lookup-or-404 logic for all four, parametrized by
// category so it isn't copy-pasted four times.
//
// 2026-09-19: rebuilt onto getListingRecord(), which wraps the same slug
// lookup and adds the HomzRealtor layer — listing ID, cross-broker dedupe,
// computed sector/commute context, and a description composed from structured
// fields instead of the source portal's prose. The description and title now
// come from that record, so the snippet a searcher sees is Homz's own writing
// rather than a copy of the posting this was rebuilt from.

import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getListingRecord } from "@/lib/intelligence/get-listing-record";
import { buildPropertyTitle } from "@/lib/intelligence/property-view";
import { robotsFor } from "@/lib/intelligence/publishGate";
import PropertyDetailView from "@/components/PropertyListing/PropertyDetailView";
import PropertyJsonLd from "@/components/PropertyListing/PropertyJsonLd";
import HomzRecordSections from "@/components/PropertyListing/HomzRecordSections";
import type { PropertyCategory } from "@/lib/scraping/homzbackend";

type PageParams = { params: Promise<{ city: string; slug: string }> };

const ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

export function makePropertyDetailPage(category: PropertyCategory) {
  const routeBase = ROUTE_BASE[category];

  async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { city, slug } = await params;
    const record = await getListingRecord(category, city, slug);
    if (!record) return {};
    const title = buildPropertyTitle(record.view);
    return {
      title,
      // Composed from structured fields + computed sector comparison, never
      // paraphrased from the source listing — see listingNarrative.ts.
      description: record.metaDescription,
      // Checklist item 9 (2026-09-22): a record that still fails validation
      // after the correction layer is withheld from indexing rather than
      // offered to Google. noindex,follow — the page renders and its links
      // still carry. See lib/intelligence/publishGate.ts.
      ...(robotsFor(record.review) ? { robots: robotsFor(record.review) } : {}),
      alternates: { canonical: `/${routeBase}/${city}/${slug}` },
      openGraph: {
        // og:title matches the rendered <title>, which gets its brand
        // suffix from the root layout's template (openGraph does not).
        title: `${title} | HomzRealtor`,
        description: record.metaDescription,
        images: record.view.heroImage ? [record.view.heroImage] : undefined,
      },
      // SEO audit 2026-09-25: twitter:image used to fall through to the
      // root layout's generic hero while og:image was the listing's own.
      ...(record.view.heroImage
        ? { twitter: { card: "summary_large_image", images: [record.view.heroImage] } }
        : {}),
    };
  }

  async function Page({ params }: PageParams) {
    const { city, slug } = await params;
    const record = await getListingRecord(category, city, slug);
    if (!record) notFound();
    // SEO audit 2026-09-25 (B5): a project record republished as a listing
    // (no bedrooms, area, config, price or type) duplicates the project page
    // with less on it. When that project page exists, send the URL there
    // permanently; real unit listings never meet the predicate.
    if (record.isProjectRecord && record.context.project) {
      permanentRedirect(record.context.project.href);
    }
    return (
      <>
        <PropertyJsonLd view={record.view} record={record} />
        <PropertyDetailView view={record.view} breadcrumbs={record.breadcrumbs} />
        <HomzRecordSections record={record} />
      </>
    );
  }

  return { generateMetadata, Page };
}
