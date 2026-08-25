import { makePropertyDetailPage } from "@/components/PropertyListing/propertyDetailRoute";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
export const revalidate = 1800;

const { generateMetadata, Page } = makePropertyDetailPage("Pg");
export { generateMetadata };
export default Page;
