import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, permanentRedirect } from "next/navigation";
import ProjectCompare from "@/components/Project/compare/ProjectCompare";
import ProjectCompareJsonLd from "@/components/Project/compare/ProjectCompareJsonLd";
import CompareNarrative from "@/components/Project/compare/CompareNarrative";
import { scoreComparePair } from "@/lib/intelligence/compareQuality";
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
//
// 2026-09-22: robots.txt disallows this path again (see its own comment --
// a crawler started working through the bounded-but-still-large linked-pair
// set at real volume, pushing Fluid Active CPU toward the Hobby-plan
// courtesy ceiling). A disallow only helps once a crawler re-fetches it and
// only if it honors it, so a same-day follow-up added a per-instance render
// budget here as a backstop -- and that backstop did not hold: Fluid Compute
// scales to multiple concurrent instances under load, each with its own
// in-memory counter, so the real ceiling was (budget x instance count), not
// the budget. Confirmed from production logs: 565 real renders on this
// route in 6h on the deployment carrying that "fix". An in-memory,
// per-instance counter cannot bound aggregate cost under concurrent
// scale-out -- there is no cross-instance state here to bound it with
// short of paid storage, which is the upgrade this is trying to avoid.
//
// So: hard-disabled instead. Every request here -- real pair or not --
// costs nothing beyond this flag check; no getComparePairKeys call, no
// getProjectBySlug, no render. This is the guaranteed-zero option while
// robots.txt takes effect and Active CPU settles back under the courtesy
// ceiling. Flip back to true once that's confirmed; the DEV-03 crawlability
// reasoning (letting Google see this route's own noindex tag on non-curated
// pairs) still applies once it's safe to re-enable, and nothing about the
// gate itself changed -- it still 404s the same way generateStaticParams
// and revalidate above still expect.
const COMPARE_PAGES_ENABLED = false;

async function isRealComparePair(cityParam: string, slugA: string, slugB: string): Promise<boolean> {
  if (!COMPARE_PAGES_ENABLED) return false;
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
// crawl budget. noindex,follow became the default; `follow` keeps link equity
// flowing to the two real project pages either side compares.
//
// 2026-09-22, checklist item 10. That fix left an INDEXABLE_COMPARE_PAIRS
// allow-list for hand-picked promotions, and it was empty — so the route was
// safe and also producing exactly zero indexable comparison pages. The item is
// explicit that these "can become excellent high-intent SEO pages", so safe is
// not the goal. A hand-curated list was never going to be filled in either,
// because nobody can tell which of ~10^6 pairs deserve it without computing
// something.
//
// lib/intelligence/compareQuality.ts computes it: the item's five conditions
// as five scored criteria, two of them hard gates (category mismatch and unit-
// type mismatch — the item's own "commercial mall vs residential apartment"
// and "luxury apartment vs warehouse" examples). At or above the threshold the
// page is indexable and enters the sitemap; below it, nothing changes from
// today — it renders, stays crawlable, and passes its follow links on.

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

  const canonicalCity = canonicalCitySlug(projectA.city_key);
  const canonicalUrl = `https://www.homzrealtor.com/project-listing/compare/${canonicalCity}/${sortedA}/${sortedB}`;

  const image = validImages(projectA.images || [])[0] || validImages(projectB.images || [])[0];

  const truncatedDescription = truncateAtWord(description);
  const { indexable } = scoreComparePair(projectA, projectB);

  return {
    title,
    description: truncatedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    // Indexable only above the quality threshold — see the note above.
    // `follow` either way is deliberate: even a noindex compare page should
    // still pass link equity to the two real project pages it links to.
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

  const quality = scoreComparePair(projectA, projectB);
  const feedDates = [projectA.updated_at, projectB.updated_at]
    .map((d) => (d ? new Date(d) : null))
    .filter((d): d is Date => Boolean(d) && !Number.isNaN(d!.getTime()))
    .sort((x, y) => y.getTime() - x.getTime());
  const compareAsOf = (feedDates[0] ?? new Date()).toISOString();

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

      {/* Checklist item 11: everything a comparison needs beyond the table.
          Written from the two records, so no two comparison pages read the
          same. */}
      <CompareNarrative
        a={projectA}
        b={projectB}
        hrefA={`/project-listing/${viewA.citySlug}/${viewA.slug}`}
        hrefB={`/project-listing/${viewB.citySlug}/${viewB.slug}`}
        quality={quality}
        asOf={compareAsOf}
      />
    </div>
  );
};

export default ComparePage;
