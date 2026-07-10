import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "All Projects — Residential & Commercial Properties in Delhi NCR",
    template: "%s | HomzRealtor",
  },
  description:
    "Browse verified residential and commercial projects in Gurgaon, Noida, Greater Noida, Delhi and Faridabad. Filter by city, compare prices and enquire directly on HomzRealtor.",
  keywords: [
    "projects in Delhi NCR",
    "residential projects Gurgaon",
    "commercial projects Noida",
    "property listing Delhi NCR",
    "new projects Greater Noida",
    "flats in Faridabad",
  ],
  alternates: {
    canonical: "/project-listing",
  },
  openGraph: {
    title: "All Projects — Residential & Commercial Properties in Delhi NCR",
    description:
      "Browse verified residential and commercial projects across Delhi NCR on HomzRealtor.",
    url: "https://www.homzrealtor.com/project-listing",
    type: "website",
  },
};

export default function ProjectListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
