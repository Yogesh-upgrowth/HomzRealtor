import { makePropertyDetailPage } from "@/components/PropertyListing/propertyDetailRoute";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too (verified — see app/project-listing/[city]/
// page.tsx's comment); [] still activates on-demand ISR for every param.
// 1 week, not 30min or 6h — see app/buy-property/[city]/[slug]/page.tsx's comment on this same line (Vercel Hobby-plan ISR-write/origin-transfer/CPU budget, 2026-09-09).
export const revalidate = 604800;
export function generateStaticParams() {
  return [];
}

const { generateMetadata, Page } = makePropertyDetailPage("Rent");
export { generateMetadata };
export default Page;
