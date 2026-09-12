import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";
import ProjectCompare from "@/components/Project/compare/ProjectCompare";
import ProjectCompareJsonLd from "@/components/Project/compare/ProjectCompareJsonLd";
import { getProjectBySlug, canonicalCitySlug } from "@/lib/intelligence/projects";
import { resolveProjectView, validImages } from "@/lib/intelligence/view-model";
import { truncateAtWord } from "@/lib/intelligence/normalize";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every visit re-executes the origin function uncached. robots.txt
// disallows /project-listing/compare/ again as of 2026-09-12 (see that
// file's comment) — the real n²/2 project-pair space made this the biggest
// driver of the account's Fluid Active CPU / origin-transfer / ISR-write
// overage, so direct/shared links still render and cache normally, but
// bots no longer get to enumerate the full combinatorial space.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too (verified — see app/project-listing/[city]/
// page.tsx's comment). [] rather than enumerating the combinatorial
// city x project-pair space: still activates on-demand ISR for every param.
// 1 week, not 30min or 6h — see app/buy-property/[city]/[slug]/page.tsx's comment on this same line (Vercel Hobby-plan ISR-write/origin-transfer/CPU budget, 2026-09-09).
export const revalidate = 604800;

export function generateStaticParams() {
  return [];
}

type PageParams = { params: Promise<{ city: string; slugA: string; slugB: string }> };

function sortedSlugs(slugA: string, slugB: string): [string, string] {
  return [slugA, slugB].sort() as [string, string];
}

// SEO audit H-01 (2026-09-08): with 1,165 projects the reachable
// city/slugA/slugB space is ~10^6 near-identical pages — every valid pair
// was indexable by default, none in the sitemap, pure index bloat diluting
// crawl budget. noindex,follow is now the default (still crawlable, so a
// stale/retired pair still 404s and deindexes — see the ISR comment below);
// `follow` keeps link equity flowing to the two real project pages either
// side compares. A hand-picked set of genuinely-searched pairs (e.g. two
// prominent builders in the same sector) can be promoted to indexable by
// adding "city/sortedSlugA/sortedSlugB" here — each one then needs real,
// unique intro copy (not just this template) and a sitemap entry to be a
// real win rather than the same bloat on a shorter list.
const INDEXABLE_COMPARE_PAIRS = new Set<string>([
  // "gurgaon/dlf-the-camellias/m3m-golf-estate",
]);

function isIndexableCompare(city: string, sortedA: string, sortedB: string): boolean {
  return INDEXABLE_COMPARE_PAIRS.has(`${city}/${sortedA}/${sortedB}`);
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
      robots: { index: false, follow: true },
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
  const indexable = isIndexableCompare(canonicalCity, sortedA, sortedB);

  return {
    title,
    description: truncatedDescription,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    // Default noindex,follow — see INDEXABLE_COMPARE_PAIRS above. `follow`
    // is deliberate: even a noindex compare page should still pass link
    // equity to the two real project pages it links to.
    robots: indexable ? undefined : { index: false, follow: true },
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
