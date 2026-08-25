import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  CITY_PARAM_MAP,
  CITY_DISPLAY,
  canonicalCitySlug,
  getProjectsForCity,
} from "@/lib/intelligence/projects";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";
// Same size as a sector page's typical project count — keeps each page's
// HTML light while still surfacing a meaningful slice per crawl.
const PAGE_SIZE = 24;

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
export const revalidate = 1800;

type PageParams = { params: Promise<{ city: string; page: string }> };

function resolveCity(cityParam: string) {
  const cityKey = CITY_PARAM_MAP[cityParam.toLowerCase()];
  if (!cityKey) return null;
  const display = CITY_DISPLAY[cityKey];
  if (!display) return null;
  return {
    cityKey,
    slug: canonicalCitySlug(cityKey),
    name: display.name,
    state: display.state,
  };
}

function parsePageNumber(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null; // no "0", no leading zeros, digits only
  return parseInt(raw, 10);
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, page } = await params;
  const resolved = resolveCity(city);
  const pageNum = parsePageNumber(page);
  if (!resolved || !pageNum) return {};

  const { name, slug } = resolved;
  const title = `Property Projects in ${name} — Page ${pageNum}`;
  const description = `Browse verified residential and commercial property projects in ${name}, page ${pageNum}. Compare prices, floor plans and possession timelines, then enquire directly with HomzRealtor.`;
  const canonical = `${SITE}/project-listing/${slug}/page/${pageNum}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

// This route exists specifically so every project has a real, server-rendered
// <a> pointing to it that a crawler can follow without executing JS — the
// interactive /project-listing hub fetches its cards client-side and ships
// zero project links in its initial HTML. Deliberately not paginating via a
// query string: a real path segment is what makes each page independently
// linkable, cacheable and indexable.
const ProjectsPagePaginated = async ({ params }: PageParams) => {
  const { city, page } = await params;
  const resolved = resolveCity(city);
  if (!resolved) notFound();
  const pageNum = parsePageNumber(page);
  if (!pageNum) notFound();

  const { slug, name } = resolved;
  const allProjects = await getProjectsForCity(resolved.cityKey).catch(() => []);
  const totalPages = Math.max(1, Math.ceil(allProjects.length / PAGE_SIZE));
  if (pageNum > totalPages) notFound();

  const start = (pageNum - 1) * PAGE_SIZE;
  const pageProjects = allProjects.slice(start, start + PAGE_SIZE);

  const pageUrl = `${SITE}/project-listing/${slug}/page/${pageNum}`;
  const prevHref = pageNum > 1 ? `/project-listing/${slug}/page/${pageNum - 1}` : null;
  const nextHref = pageNum < totalPages ? `/project-listing/${slug}/page/${pageNum + 1}` : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}/project-listing` },
          { "@type": "ListItem", position: 3, name, item: `${SITE}/project-listing/${slug}` },
          { "@type": "ListItem", position: 4, name: `Page ${pageNum}`, item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Property Projects in ${name} — Page ${pageNum}`,
        url: pageUrl,
      },
    ],
  };

  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-7xl mx-auto px-4 mt-28 md:mt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#B77D2B]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/project-listing" className="hover:text-[#B77D2B]">Projects</Link>
          <ChevronRight size={12} />
          <Link href={`/project-listing/${slug}`} className="hover:text-[#B77D2B]">{name}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">Page {pageNum}</span>
        </nav>

        {/* Single template-string expression, not text/{expr} JSX children —
            see the identical fix + explanation on the city template's H1
            (app/project-listing/[city]/page.tsx): a space immediately
            before an em-dash on a text node adjacent to an expression gets
            silently dropped by React's SSR output otherwise. */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          {`Property Projects in ${name} — Page ${pageNum} of ${totalPages}`}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-600 leading-relaxed">
          Showing {pageProjects.length} of {allProjects.length} verified projects in {name}.
        </p>
      </section>

      <SimilarProjects
        title={name}
        projects={pageProjects}
        heading={`Projects in ${name} — page ${pageNum}`}
      />

      {/* Real anchors, not buttons — this is the crawl path between pages. */}
      {(prevHref || nextHref) && (
        <nav
          aria-label="Pagination"
          className="w-full max-w-7xl mx-auto px-4 my-12 flex items-center justify-between gap-4"
        >
          {prevHref ? (
            <Link
              href={prevHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
            >
              <ChevronLeft size={14} /> Page {pageNum - 1}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-gray-500">
            Page {pageNum} of {totalPages}
          </span>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
            >
              Page {pageNum + 1} <ChevronRight size={14} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
};

export default ProjectsPagePaginated;
