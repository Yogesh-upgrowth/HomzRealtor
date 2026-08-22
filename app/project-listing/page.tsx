import type { Metadata } from "next";
import ProjectListingClient from "@/components/PropertyListing/ProjectListingClient";

// The site's main listings hub had no page-specific metadata at all — it was
// inheriting the root layout's generic default title/description.
export const metadata: Metadata = {
  title: "Property Projects in Gurgaon",
  description:
    "Browse residential and commercial property projects in Gurgaon. Filter by sector, budget, BHK and status, compare prices and enquire directly with HomzRealtor.",
  alternates: { canonical: "/project-listing" },
};

// ProjectListingClient reads useSearchParams(), which only forces a dynamic
// boundary around itself during static generation — the rest of this route
// still gets statically prerendered, and that static shell is exactly what a
// crawler receives, with the search-params-dependent subtree replaced by its
// bare Suspense fallback (an empty div). `export const dynamic` has no effect
// declared inside a "use client" file (that module is only ever compiled into
// the client bundle), so it has to live here, in this server component.
// Confirmed live before this fix: production served no h1, no intro copy and
// no cards on this route — only sitewide Header/Footer chrome.
export const dynamic = "force-dynamic";

export default function ProjectListingPage() {
  return <ProjectListingClient />;
}
