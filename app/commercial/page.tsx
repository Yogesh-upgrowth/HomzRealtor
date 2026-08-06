import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";

export const metadata = {
  title: "Commercial Properties in Gurgaon | Homz",
  description:
    "Shops, offices, showrooms, and commercial land for sale and rent in Gurgaon — filter by investment grade, property type, and budget.",
  alternates: {
    canonical: "/commercial",
  },
};

export default function CommercialPage() {
  return <PropertyListingPage category="Commercial" />;
}
