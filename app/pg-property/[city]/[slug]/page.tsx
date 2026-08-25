import { makePropertyDetailPage } from "@/components/PropertyListing/propertyDetailRoute";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too (verified — see app/project-listing/[city]/
// page.tsx's comment); [] still activates on-demand ISR for every param.
export const revalidate = 1800;
export function generateStaticParams() {
  return [];
}

const { generateMetadata, Page } = makePropertyDetailPage("Pg");
export { generateMetadata };
export default Page;
