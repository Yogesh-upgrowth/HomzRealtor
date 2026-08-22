import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import discoverImage5 from "@/assets/images/discoverImage5.jpg";

const title = "Commercial Properties in Gurgaon";
const description =
  "Shops, offices, showrooms, and commercial land for sale and rent in Gurgaon — filter by investment grade, property type, and budget.";

export const metadata = {
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

// See app/buy-property/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

export default function CommercialPage() {
  return <PropertyListingPage category="Commercial" />;
}
