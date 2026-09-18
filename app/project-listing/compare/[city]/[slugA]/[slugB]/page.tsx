import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";
import ProjectCompare from "@/components/Project/compare/ProjectCompare";
import ProjectCompareJsonLd from "@/components/Project/compare/ProjectCompareJsonLd";
import { getProjectBySlug, canonicalCitySlug, CITY_PARAM_MAP, getComparePairKeys } from "@/lib/intelligence/projects";
import { resolveProjectView, validImages } from "@/lib/intelligence/view-model";
import { truncateAtWord } from "@/lib/intelligence/normalize";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every visit re-executes the origin function uncached.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too (verified — see app/project-listing/[city]/
// page.tsx's comment). [] rather than enumerating the combinatorial
// city x project-pair space: still activates on-demand ISR for every param
// that passes the pairKeys gate below (enumerating all of them here would
// mean Next tries to statically pre-render them at build time — the same
// kind of build-time OOM MAX_STATIC_PAGES was added elsewhere to avoid).
// 1 week, not 30min or 6h — see app/buy-property/[city]/[slug]/page.tsx's comment on this same line (Vercel Hobby-plan ISR-write/origin-transfer/CPU budget, 2026-09-09).
export const revalidate = 604800;

export function generateStaticParams() {
  return [];
}

// DEV-03 (2026-09-16): robots.txt blocked this whole path from 2026-09-12
// (see git history) because with no gate, every guessed city/slugA/slugB
// combination — and real project slugs are all public via the sitemap, so
// the valid-pair space alone is ~n²/2 — triggered a full render (two
// project lookups + view resolution), the account's single largest
// Active CPU/origin-transfer/ISR-write driver. That also meant Google
// could never see this route's own noindex tag on non-curated pairs
// (a robots-blocked page's meta tags are invisible to the crawler that
// would read them), so stale indexed pairs couldn't cleanly deindex either.
// getComparePairKeys() (lib/intelligence/projects.ts) is a cheap
// (sub-millisecond, grouped-computation, cached) check against the pairs
// actually linked from real project pages — anything outside that set
// 404s here, before either expensive getProjectBySlug lookup ever runs.
// robots.txt no longer blocks this path as of the same date.
async function isRealComparePair(cityParam: string, slugA: string, slugB: string): Promise<boolean> {
  const cityKey = CITY_PARAM_MAP[cityParam.toLowerCase()] || cityParam;
  const citySlug = canonicalCitySlug(cityKey);
  const [sortedA, sortedB] = [slugA, slugB].sort();
  const keys = await getComparePairKeys();
  return keys.has(`${citySlug}/${sortedA}/${sortedB}`);
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

  if (!(await isRealComparePair(city, sortedA, sortedB))) {
    return {
      title: "Compare Projects",
      description: "Compare real estate projects side by side on HomzRealtor.",
      robots: { index: false, follow: true },
    };
  }

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
    `Compare ${projectA.project_name} vs ${projectB.project_name} in ${locationLabel}: ` +
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

  if (!(await isRealComparePair(city, sortedA, sortedB))) notFound();

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
