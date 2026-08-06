import PropertyListingPage from "@/components/PropertyListing/PropertyListingPage";

export const metadata = {
  title: "Rent Property in Gurgaon | Homz",
  description:
    "Browse verified rental listings in Gurgaon — apartments, builder floors, and more. Filter by property type, BHK, budget, and possession status.",
  alternates: {
    canonical: "/rent-property",
  },
};

export default function RentPropertyPage() {
  return <PropertyListingPage category="Rent" />;
}
