import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginatedListingPage, { getPageCount, MAX_STATIC_PAGES } from "@/components/PropertyListing/PaginatedListingPage";

const SITE = "https://www.homzrealtor.com";

export const revalidate = 21600;

// SEO audit 2026-09-07 P1: page 1 was reachable both here and at the base
// /commercial hub — a real self-canonical duplicate pair. Page 1 is only
// ever served at the base hub now; this route starts at page 2.
//
// Capped at MAX_STATIC_PAGES for consistency with buy-property/rent-property
// — see that constant's comment.
export async function generateStaticParams() {
  const totalPages = await getPageCount("Commercial");
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

  const title = `Commercial Properties in Gurgaon — Page ${pageNum}`;
  const description = `Browse commercial properties in Gurgaon, page ${pageNum}. Filter by property type, budget and investment grade.`;
  const canonical = `${SITE}/commercial/page/${pageNum}`;

  return { title, description, alternates: { canonical } };
}

const CommercialPagePaginated = async ({ params }: PageParams) => {
  const { page } = await params;
  const pageNum = parsePageNumber(page);
  if (!pageNum) notFound();
  if (pageNum === 1) notFound(); // canonical URL for page 1 is the base hub
  return <PaginatedListingPage category="Commercial" pageNum={pageNum} />;
};

export default CommercialPagePaginated;
