import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";

const title = "PG Accommodation in Gurgaon";
const description =
  "Paying-guest accommodations in Gurgaon — filter by budget and amenities.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/pg-property",
  },
  openGraph: { title, description },
};

// See app/buy-property/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

export default function PgPropertyPage() {
  return <PropertyListingPage category="Pg" />;
}
