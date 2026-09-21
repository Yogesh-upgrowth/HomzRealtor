import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  getBuilderBySlug,
  getAllBuilders,
  canonicalCitySlug,
  isIndexableDeveloper,
} from "@/lib/intelligence/projects";
import { buildDeveloperProfile, buildDeveloperFaqs } from "@/lib/intelligence/developerProfile";
import { formatInr } from "@/lib/intelligence/normalize";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";
import DeveloperIntelligence from "@/components/Developer/DeveloperIntelligence";
import Faq from "@/components/Project/intelligence/Faq";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too, see app/project-listing/[city]/page.tsx's
// comment for how this was verified.
// 1 week, not 30min or 6h — see app/buy-property/[city]/[slug]/page.tsx's comment on this same line (Vercel Hobby-plan ISR-write/origin-transfer/CPU budget, 2026-09-09).
export const revalidate = 604800;

export async function generateStaticParams() {
  const builders = await getAllBuilders().catch(() => []);
  return builders.map((b) => ({ slug: b.slug }));
}

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBuilderBySlug(slug).catch(() => null);
  if (!data) return {};

  const { summary } = data;
  const cityNames = summary.cities.map((c) => c.name);
  const cityLabel =
    cityNames.length > 1
      ? `${cityNames.slice(0, -1).join(", ")} & ${cityNames[cityNames.length - 1]}`
      : cityNames[0] || "Delhi NCR";

  const title = `${summary.name} Projects, Price, Properties & Developments in ${cityLabel}`;
  const description =
    `Explore ${summary.count} ${summary.name} ${summary.count === 1 ? "project" : "projects"} ` +
    `across ${cityLabel} on HomzRealtor` +
    (summary.residential && summary.commercial
      ? `: ${summary.residential} residential and ${summary.commercial} commercial developments.`
      : ".") +
    ` Compare prices, floor plans, amenities and locations, and enquire directly.`;

  return {
    title,
    description,
    // 2026-09-21, per the 21 Sep audit's entity-validation recommendation: a
    // hub holding a single project is a thin indexable page whose whole
    // content is one card that already has its own URL. It keeps rendering
    // and stays crawlable, so the project remains reachable and any already
    // indexed URL does not start 404ing -- it is simply not offered for
    // indexing. follow:true so the link equity still flows to the project.
    ...(isIndexableDeveloper(summary) ? {} : { robots: { index: false, follow: true } }),
    keywords: [
      `${summary.name} projects`,
      `${summary.name} property`,
      `${summary.name} ${cityNames[0] || "Delhi NCR"}`,
      `${summary.name} new launch`,
      `${summary.name} price`,
    ],
    alternates: { canonical: `${SITE}/developer/${summary.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/developer/${summary.slug}`,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

const DeveloperPage = async ({ params }: PageParams) => {
  const { slug } = await params;
  const data = await getBuilderBySlug(slug).catch(() => null);
  if (!data) notFound();

  const { summary, projects } = data;
  const withImages = projects.filter((p) => p.images.length > 0);
  const pageUrl = `${SITE}/developer/${summary.slug}`;

  // Audit item 9 (2026-09-19): computed portfolio facts, so the page is about
  // the builder rather than being a nine-card teaser with their name on it.
  const profile = buildDeveloperProfile(projects, canonicalCitySlug);

  const cityNames = summary.cities.map((c) => c.name);
  const cityLabel =
    cityNames.length > 1
      ? `${cityNames.slice(0, -1).join(", ")} & ${cityNames[cityNames.length - 1]}`
      : cityNames[0] || "Delhi NCR";

  // Unique, data-driven intro so no two developer pages read the same.
  const intro =
    `${summary.name} has ${summary.count} ${summary.count === 1 ? "project" : "projects"} ` +
    `listed on HomzRealtor across ${cityLabel}` +
    (summary.residential && summary.commercial
      ? `, spanning ${summary.residential} residential and ${summary.commercial} commercial ${
          summary.residential + summary.commercial === 1 ? "development" : "developments"
        }.`
      : ".") +
    (profile.price
      ? ` Listed entry prices run from ${formatInr(profile.price.minInr)} to ${formatInr(
          profile.price.maxInr
        )}, with a median of ${formatInr(profile.price.medianInr)} across the ${
          profile.price.pricedCount
        } projects carrying a price.`
      : "") +
    (profile.readyToMove + profile.underConstruction > 0
      ? ` ${profile.readyToMove} ${profile.readyToMove === 1 ? "is" : "are"} ready to move and ${
          profile.underConstruction
        } ${profile.underConstruction === 1 ? "is" : "are"} under construction.`
      : "") +
    ` Everything below is computed from our own catalogue, and every project is linked by name.`;

  // Other developers for internal linking (exclude the current one).
  const others = (await getAllBuilders().catch(() => []))
    .filter((d) => d.slug !== summary.slug)
    .slice(0, 12);

  // Answered entirely from the computed profile — only questions the data can
  // actually answer are emitted, since these feed FAQPage markup.
  const faqs = buildDeveloperFaqs(summary.name, cityLabel, profile, formatInr);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Developers", item: `${SITE}/developer` },
          { "@type": "ListItem", position: 3, name: summary.name, item: pageUrl },
        ],
      },
      {
        // R19-06 (2026-09-19): was RealEstateAgent. This node describes the
        // builder, not Homz, but sitting on a homzrealtor.com URL with a
        // multi-city areaServed it read as a second estate-agent entity
        // claiming NCR-wide coverage — directly contradicting the sitewide
        // Organization.areaServed: ["Gurgaon"]. A property developer is an
        // Organization; areaServed here is the developer's own project
        // footprint, which is a fact about them, not a Homz service claim.
        "@type": "Organization",
        name: summary.name,
        url: pageUrl,
        areaServed: summary.cities.map((c) => ({
          "@type": "City",
          name: c.name,
        })),
      },
      {
        "@type": "CollectionPage",
        name: `${summary.name} Projects`,
        description: intro,
        url: pageUrl,
      },
      // CollectionPage alone doesn't enumerate the developer's projects —
      // ItemList does, and it matches exactly what the page renders. That
      // used to be withImages.slice(0, 9); the page now links every project
      // by name in the index below the grid, so the list is the full set.
      ...(projects.length > 0
        ? [
            {
              "@type": "ItemList",
              numberOfItems: projects.length,
              itemListElement: projects.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.project_name,
                url: `${SITE}/project-listing/${canonicalCitySlug(p.city_key)}/${p.slug}`,
              })),
            },
          ]
        : []),
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              url: pageUrl,
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    // SEO audit follow-up (2026-09-09): converted from the pre-dark-theme
    // light styling, matching /project-listing/[city]/sectors/[sector].
    <div className="bg-[#0B0B0C] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-32">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/developer" className="hover:text-[#CEA44E]">Developers</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{summary.name}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {summary.name} Projects in {cityLabel}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">{intro}</p>

        {/* Quick facts */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#B77D2B] bg-black px-4 py-1.5 text-sm font-medium text-[#CEA44E]">
            {summary.count} {summary.count === 1 ? "Project" : "Projects"}
          </span>
          {summary.residential > 0 && (
            <span className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300">
              {summary.residential} Residential
            </span>
          )}
          {summary.commercial > 0 && (
            <span className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300">
              {summary.commercial} Commercial
            </span>
          )}
        </div>

        {/* Cities this developer builds in — internal linking */}
        {summary.cities.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span className="text-gray-500">Active in:</span>
            {summary.cities.map((c) => (
              <Link
                key={c.slug}
                href={`/project-listing/${c.slug}`}
                className="rounded-full border border-gray-700 bg-black px-3 py-1 text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Project grid (reuses the shared card component) — a visual preview of
          the nine best-presented projects. "View all" used to point at
          /project-listing?builder=<slug>, a query-param view this site does
          not server-render as anchors, so a builder with 40 projects linked 9
          of them and orphaned the rest. It now points at the complete index
          below, which links every one of them by name. */}
      {withImages.length > 0 ? (
        <SimilarProjects
          title={summary.name}
          projects={withImages.slice(0, 9)}
          heading={`Projects by ${summary.name}`}
          viewAllHref="#all-projects"
          viewAllLabel={`See all ${projects.length} →`}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 my-12 text-gray-500">
          Project listings for {summary.name} are being updated. Please{" "}
          <Link href="/project-listing" className="text-[#B77D2B] underline">
            browse all projects
          </Link>{" "}
          in the meantime.
        </div>
      )}

      <DeveloperIntelligence name={summary.name} cityLabel={cityLabel} profile={profile} />

      {/* The complete index. Every project this builder has on HomzRealtor,
          linked by name, so nothing in the portfolio depends on a query-param
          view to be reachable. Grouped by city where the builder spans more
          than one. */}
      {projects.length > 0 && (
        <section id="all-projects" className="w-full max-w-7xl mx-auto px-4 mt-12 scroll-mt-28">
          <h2 className="mb-1 text-2xl font-bold text-white">
            All {projects.length} {summary.name}{" "}
            {projects.length === 1 ? "project" : "projects"}
          </h2>
          <p className="mb-5 text-[13px] text-gray-500">
            Every project we list for this developer, with its location and current status.
          </p>
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={`${p.city_key}-${p.slug}`} className="border-b border-white/[0.05] pb-2.5">
                <Link
                  href={`/project-listing/${canonicalCitySlug(p.city_key)}/${p.slug}`}
                  className="text-[14.5px] text-gray-300 transition hover:text-[#CEA44E]"
                >
                  {p.project_name}
                </Link>
                <span className="block text-[12px] text-gray-600">
                  {[p.sector, p.micro_market, p.city_name]
                    .filter((v, i, a) => v && a.indexOf(v) === i)
                    .join(", ")}
                  {p.project_status ? ` · ${p.project_status}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Faq title={summary.name} items={faqs} />

      {/* Other developers — internal linking + crawlability */}
      {others.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Explore Other Developers</h2>
            <Link
              href="/developer"
              className="text-sm font-medium text-[#CEA44E] hover:underline whitespace-nowrap"
            >
              View all developers →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {others.map((d) => (
              <Link
                key={d.slug}
                href={`/developer/${d.slug}`}
                className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
              >
                {d.name} <span className="text-gray-500">({d.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AppointmentCard
        bgImage={bgImg}
        heading={`EXPLORE ${summary.name.toUpperCase()} PROJECTS`}
        para={`Get expert guidance on ${summary.name} developments: pricing, availability and a personalised investment view from the HomzRealtor team.`}
        btnTxt="Talk to an Expert"
      />
    </div>
  );
};

export default DeveloperPage;
