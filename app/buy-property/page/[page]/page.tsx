import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginatedListingPage, { getPageCount, MAX_STATIC_PAGES } from "@/components/PropertyListing/PaginatedListingPage";

const SITE = "https://www.homzrealtor.com";

// Matches segmentCache.ts's 1h TTL — no point revalidating more often than
// the underlying data actually changes.
// 1 week, not 30min or 6h — see app/buy-property/[city]/[slug]/page.tsx's comment on this same line (Vercel Hobby-plan ISR-write/origin-transfer/CPU budget, 2026-09-09).
export const revalidate = 604800;

// SEO audit 2026-09-07 P1: page 1 was reachable both here (its own,
// slightly different "— Page 1" title/canonical) and at the base
// /buy-property hub — a real self-canonical duplicate pair, same issue as
// the buy-property/[city]/[slug]/[facet] route already avoids. Page 1 is
// only ever served at the base hub now; this route starts at page 2.
//
// Capped at MAX_STATIC_PAGES — ~20,957 Sale listings / PAGE_SIZE means
// ~874 real pages; building every one of them is what OOM'd `next build`
// (see MAX_STATIC_PAGES's own comment). Later pages still render, on demand.
export async function generateStaticParams() {
  const totalPages = await getPageCount("Sale");
  const staticCount = Math.max(0, Math.min(totalPages, MAX_STATIC_PAGES + 1) - 1);
  return Array.from({ length: staticCount }, (_, i) => ({ page: String(i + 2) }));
}

function parsePageNumber(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null; // no "0", no leading zeros, digits only
  return parseInt(raw, 10);
}

type PageParams = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { page } = await params;
  const pageNum = parsePageNumber(page);
  if (!pageNum) return {};

  const title = `Buy Property in Gurgaon — Page ${pageNum}`;
  const description = `Browse resale and new-launch properties for sale in Gurgaon, page ${pageNum}. Filter by property type, BHK, budget and possession status.`;
  const canonical = `${SITE}/buy-property/page/${pageNum}`;

  return { title, description, alternates: { canonical } };
}

const BuyPropertyPagePaginated = async ({ params }: PageParams) => {
  const { page } = await params;
  const pageNum = parsePageNumber(page);
  if (!pageNum) notFound();
  if (pageNum === 1) notFound(); // canonical URL for page 1 is the base hub
  return <PaginatedListingPage category="Sale" pageNum={pageNum} />;
};

export default BuyPropertyPagePaginated;
