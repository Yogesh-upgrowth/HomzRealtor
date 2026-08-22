import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import discoverImage1 from "@/assets/images/discoverImage1.jpg";

const title = "Buy Property in Gurgaon";
const description =
  "Resale and new-launch properties for sale in Gurgaon — filter by property type, BHK, budget, and possession status.";

export const metadata = {
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

// Forces per-request rendering instead of a static shell — PropertyListingPage
// is a client component that reads useSearchParams(), and without this,
// Next.js's static optimization bails that subtree out to its Suspense
// fallback (an empty div) in the prerendered HTML crawlers actually see.
export const dynamic = "force-dynamic";

export default function BuyPropertyPage() {
  return <PropertyListingPage category="Sale" />;
}
