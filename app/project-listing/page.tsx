import type { Metadata } from "next";
import Link from "next/link";
import ProjectListingClient from "@/components/PropertyListing/ProjectListingClient";
import { getProjectsForCity } from "@/lib/intelligence/projects";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";

// The site's main listings hub had no page-specific metadata at all — it was
// inheriting the root layout's generic default title/description.
export const metadata: Metadata = {
  title: "Property Projects in Gurgaon, Price, Photos & Floor Plans",
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

// Real, server-rendered links into each city's already-well-built landing
// page (/project-listing/[city], which itself links deep into sectors,
// developers and the server-rendered pagination sequence) — SEO audit
// (C-02, 2026-09-08) found this hub shipped zero server-rendered links at
// all, since ProjectListingClient above is a client component that only
// fetches/renders after hydration. This block is the missing entry point;
// everything past it was already crawlable once you can reach it.
const ALL_CITIES: { slug: string; name: string; cityKey: string }[] = [
  { slug: "gurgaon", name: "Gurgaon", cityKey: "ggn" },
  { slug: "noida", name: "Noida", cityKey: "noida" },
  { slug: "greaternoida", name: "Greater Noida", cityKey: "gNoida" },
  { slug: "delhi", name: "Delhi", cityKey: "delhi" },
  { slug: "faridabad", name: "Faridabad", cityKey: "faridabad" },
];

// R19-07 (2026-09-19): the city chips below were the only server-rendered
// links on this route, so the initial HTML of the site's most prominent
// discovery page contained zero project-detail anchors — every card came from
// ProjectListingClient after hydration. The city landing pages do server-render
// their projects, so this was never "all project pages are invisible", but it
// made a prominent route depend on client rendering for no reason. Rendering a
// real first page of Gurgaon projects here, with the same SimilarProjects
// component /project-listing/[city] already uses, puts genuine <a href> anchors
// in the initial response. Gurgaon only: it is the one city with real
// inventory (the other four render "being updated"), and the chips already
// cover them.
const HUB_PREVIEW_COUNT = 12;

export default async function ProjectListingPage() {
  const cities = await Promise.all(
    ALL_CITIES.map(async (c) => {
      const projects = await getProjectsForCity(c.cityKey).catch(() => []);
      return { ...c, count: projects.length };
    })
  );

  const gurgaonProjects = await getProjectsForCity("ggn").catch(() => []);
  const gurgaonWithImages = gurgaonProjects.filter((p) => p.images.length > 0);

  return (
    <>
      <ProjectListingClient />
      {gurgaonWithImages.length > 0 && (
        <SimilarProjects
          title="Gurgaon"
          projects={gurgaonWithImages.slice(0, HUB_PREVIEW_COUNT)}
          heading="Featured Projects in Gurgaon"
          viewAllHref="/project-listing/gurgaon"
          viewAllLabel={`View all ${gurgaonWithImages.length} →`}
        />
      )}
      <section className="w-full bg-[#0B0B0C] py-12">
        <div className="w-full max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Browse Projects by City</h2>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/project-listing/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
              >
                Property in {c.name}
                {c.count > 0 ? (
                  <span className="text-gray-500">({c.count})</span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Coming Soon
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
