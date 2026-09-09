import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginatedListingPage, { getPageCount, MAX_STATIC_PAGES } from "@/components/PropertyListing/PaginatedListingPage";

const SITE = "https://www.homzrealtor.com";

export const revalidate = 1800;

// SEO audit 2026-09-07 P1: page 1 was reachable both here and at the base
// /rent-property hub — a real self-canonical duplicate pair. Page 1 is
// only ever served at the base hub now; this route starts at page 2.
//
// Capped at MAX_STATIC_PAGES — see that constant's comment (this route
// alone was ~540 real pages, a real contributor to the build OOM).
export async function generateStaticParams() {
  const totalPages = await getPageCount("Rent");
  const staticCount = Math.max(0, Math.min(totalPages, MAX_STATIC_PAGES + 1) - 1);
  return Array.from({ length: staticCount }, (_, i) => ({ page: String(i + 2) }));
}

function parsePageNumber(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  return parseInt(raw, 10);
}

type PageParams = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { page } = await params;
  const pageNum = parsePageNumber(page);
  if (!pageNum) return {};

  const title = `Rent Property in Gurgaon — Page ${pageNum}`;
  const description = `Browse properties for rent in Gurgaon, page ${pageNum}. Filter by property type, BHK, budget and possession status.`;
  const canonical = `${SITE}/rent-property/page/${pageNum}`;

  return { title, description, alternates: { canonical } };
}

const RentPropertyPagePaginated = async ({ params }: PageParams) => {
  const { page } = await params;
  const pageNum = parsePageNumber(page);
  if (!pageNum) notFound();
  if (pageNum === 1) notFound(); // canonical URL for page 1 is the base hub
  return <PaginatedListingPage category="Rent" pageNum={pageNum} />;
};

export default RentPropertyPagePaginated;
