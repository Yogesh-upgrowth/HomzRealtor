import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";

export const metadata = {
  title: "Buy Property in Gurgaon | Homz",
  description:
    "Resale and new-launch properties for sale in Gurgaon — filter by property type, BHK, budget, and possession status.",
  alternates: {
    canonical: "/buy-property",
  },
};

export default function BuyPropertyPage() {
  return <PropertyListingPage category="Sale" />;
}
