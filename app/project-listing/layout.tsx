import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

export const metadata: Metadata = {
  title: {
    default: "All Projects — Residential & Commercial Properties in Gurgaon",
    // No "| HomzRealtor" suffix — same reasoning as the root layout's
    // template. This nested template overrides the root's for every route
    // under /project-listing/* (city, sector, project detail, ...), which
    // is exactly why those pages still carried the suffix after only
    // changing app/layout.tsx.
    template: "%s",
  },
  description:
    "Browse verified residential and commercial projects in Gurgaon. Filter by sector, compare prices and enquire directly on HomzRealtor.",
  keywords: [
    "projects in Gurgaon",
    "residential projects Gurgaon",
    "commercial projects Gurgaon",
    "property listing Gurgaon",
    "new projects Gurgaon",
    "flats in Gurgaon",
  ],
  alternates: {
    canonical: "/project-listing",
  },
  openGraph: {
    title: "All Projects — Residential & Commercial Properties in Gurgaon",
    description:
      "Browse verified residential and commercial projects across Gurgaon on HomzRealtor.",
    url: "https://www.homzrealtor.com/project-listing",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function ProjectListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
