import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";
import ProjectCompare from "@/components/Project/compare/ProjectCompare";
import ProjectCompareJsonLd from "@/components/Project/compare/ProjectCompareJsonLd";
import { getProjectBySlug, canonicalCitySlug } from "@/lib/intelligence/projects";
import { resolveProjectView, validImages } from "@/lib/intelligence/view-model";
import { truncateAtWord } from "@/lib/intelligence/normalize";

type PageParams = { params: Promise<{ city: string; slugA: string; slugB: string }> };

function sortedSlugs(slugA: string, slugB: string): [string, string] {
  return [slugA, slugB].sort() as [string, string];
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slugA, slugB } = await params;
  const [sortedA, sortedB] = sortedSlugs(slugA, slugB);

  const [projectA, projectB] = await Promise.all([
    getProjectBySlug(city, sortedA).catch(() => null),
    getProjectBySlug(city, sortedB).catch(() => null),
  ]);

  if (!projectA || !projectB) {
    return {
      title: "Compare Projects",
      description: "Compare real estate projects side by side on HomzRealtor.",
    };
  }

  const cityName = projectA.city_name;
  const locationLabel = projectA.sector
    ? `${projectA.sector} ${cityName}`
    : projectA.micro_market || cityName;

  const title = `${projectA.project_name} vs ${projectB.project_name}, ${locationLabel}: Compare Price & Amenities`;

  const description =
    `Compare ${projectA.project_name} vs ${projectB.project_name} in ${locationLabel} — ` +
    `price, possession, amenities and floor plans side by side on HomzRealtor.`;

  const keywords = [
    `${projectA.project_name} vs ${projectB.project_name}`,
    `${projectA.project_name} vs ${projectB.project_name} price`,
    `compare projects in ${locationLabel}`,
  ];

  const canonicalCity = canonicalCitySlug(projectA.city_key);
  const canonicalUrl = `https://www.homzrealtor.com/project-listing/compare/${canonicalCity}/${sortedA}/${sortedB}`;

  const image = validImages(projectA.images || [])[0] || validImages(projectB.images || [])[0];

  const truncatedDescription = truncateAtWord(description);

  return {
    title,
    description: truncatedDescription,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: truncatedDescription,
      url: canonicalUrl,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: truncatedDescription,
      images: image ? [image] : [],
    },
  };
}

const ComparePage = async ({ params }: PageParams) => {
  const { city, slugA, slugB } = await params;

  if (slugA === slugB) {
    permanentRedirect(`/project-listing/${city}/${slugA}`);
  }

  const [sortedA, sortedB] = sortedSlugs(slugA, slugB);
  if (slugA !== sortedA || slugB !== sortedB) {
    permanentRedirect(`/project-listing/compare/${city}/${sortedA}/${sortedB}`);
  }

  const [projectA, projectB] = await Promise.all([
    getProjectBySlug(city, sortedA).catch(() => null),
    getProjectBySlug(city, sortedB).catch(() => null),
  ]);

  if (!projectA || !projectB) notFound();

  const viewA = resolveProjectView(projectA, { cityParam: city });
  const viewB = resolveProjectView(projectB, { cityParam: city });
  const canonicalCity = canonicalCitySlug(projectA.city_key);
  const pageUrl = `https://www.homzrealtor.com/project-listing/compare/${canonicalCity}/${sortedA}/${sortedB}`;

  return (
    // flow-root contains ProjectCompare's own trailing bottom margin (mb-10)
    // inside this div — without it, that margin escaped past lg:pb-0 on
    // desktop widths, showing as a bare white gap before the footer.
    <div className="pb-24 lg:pb-0 flow-root">
      <ProjectCompareJsonLd
        cityName={viewA.cityName}
        citySlug={canonicalCity}
        nameA={viewA.name}
        nameB={viewB.name}
        urlA={`https://www.homzrealtor.com/project-listing/${viewA.citySlug}/${viewA.slug}`}
        urlB={`https://www.homzrealtor.com/project-listing/${viewB.citySlug}/${viewB.slug}`}
        pageUrl={pageUrl}
      />

      <section className="w-full max-w-5xl mx-auto px-2 mt-28 md:mt-32">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#B77D2B]">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/project-listing" className="hover:text-[#B77D2B]">
            Projects
          </Link>
          <ChevronRight size={12} />
          <Link href={`/project-listing/${canonicalCity}`} className="hover:text-[#B77D2B]">
            {viewA.cityName}
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">
            Compare: {viewA.name} vs {viewB.name}
          </span>
        </nav>
      </section>

      <ProjectCompare viewA={viewA} viewB={viewB} />
    </div>
  );
};

export default ComparePage;
