import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";

export const metadata = {
  title: "PG Accommodation in Gurgaon | Homz",
  description:
    "Paying-guest accommodations in Gurgaon — filter by budget and amenities.",
  alternates: {
    canonical: "/pg-property",
  },
};

export default function PgPropertyPage() {
  return <PropertyListingPage category="Pg" />;
}
