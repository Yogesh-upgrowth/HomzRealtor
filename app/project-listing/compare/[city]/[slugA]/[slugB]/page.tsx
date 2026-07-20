import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import ProjectCompare from "@/components/Project/compare/ProjectCompare";
import ProjectCompareJsonLd from "@/components/Project/compare/ProjectCompareJsonLd";
import { getProjectBySlug, canonicalCitySlug } from "@/lib/intelligence/projects";
import { resolveProjectView } from "@/lib/intelligence/view-model";

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

  const image =
    projectA.images?.find((u) => typeof u === "string" && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)) ||
    projectB.images?.find((u) => typeof u === "string" && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u));

  return {
    title,
    description: description.slice(0, 158),
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: description.slice(0, 158),
      url: canonicalUrl,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 158),
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

  if (!projectA || !projectB) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects not found</h1>
        <p className="text-gray-500 mb-6">
          We couldn&apos;t find one or both of these projects. They may have been removed or the
          link is incorrect.
        </p>
        <Link
          href="/project-listing"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
        >
          Browse all projects
        </Link>
      </div>
    );
  }

  const viewA = resolveProjectView(projectA, { cityParam: city });
  const viewB = resolveProjectView(projectB, { cityParam: city });
  const canonicalCity = canonicalCitySlug(projectA.city_key);
  const pageUrl = `https://www.homzrealtor.com/project-listing/compare/${canonicalCity}/${sortedA}/${sortedB}`;

  return (
    <div className="pb-24 lg:pb-0">
      <ProjectCompareJsonLd
        cityName={viewA.cityName}
        citySlug={canonicalCity}
        nameA={viewA.name}
        nameB={viewB.name}
        urlA={`https://www.homzrealtor.com/project-listing/${viewA.citySlug}/${viewA.slug}`}
        urlB={`https://www.homzrealtor.com/project-listing/${viewB.citySlug}/${viewB.slug}`}
        pageUrl={pageUrl}
      />
      <ProjectCompare viewA={viewA} viewB={viewB} />
    </div>
  );
};

export default ComparePage;
