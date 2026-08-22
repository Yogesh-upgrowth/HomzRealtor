import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";

const title = "Rent Property in Gurgaon";
const description =
  "Browse verified rental listings in Gurgaon — apartments, builder floors, and more. Filter by property type, BHK, budget, and possession status.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/rent-property",
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: discoverImage2.src,
        width: discoverImage2.width,
        height: discoverImage2.height,
        alt: "Rent property in Gurgaon",
      },
    ],
  },
};

// See app/buy-property/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

export default function RentPropertyPage() {
  return <PropertyListingPage category="Rent" />;
}
