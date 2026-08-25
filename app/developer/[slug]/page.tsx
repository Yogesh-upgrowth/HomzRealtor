import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { getBuilderBySlug, getAllBuilders, canonicalCitySlug } from "@/lib/intelligence/projects";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";

// ISR — matches lib/scraping/homzbackend.ts's 30-min data-cache TTL; without
// this every crawl/visit re-executes the origin function uncached.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too, see app/project-listing/[city]/page.tsx's
// comment for how this was verified.
export const revalidate = 1800;

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

  const title = `${summary.name} Projects — Price, Properties & Developments in ${cityLabel}`;
  const description =
    `Explore ${summary.count} ${summary.name} ${summary.count === 1 ? "project" : "projects"} ` +
    `across ${cityLabel} on HomzRealtor` +
    (summary.residential && summary.commercial
      ? ` — ${summary.residential} residential and ${summary.commercial} commercial developments.`
      : ".") +
    ` Compare prices, floor plans, amenities and locations, and enquire directly.`;

  return {
    title,
    description,
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
    ` Browse their portfolio below to compare prices, configurations, amenities and ` +
    `possession timelines, then enquire directly with our advisors.`;

  // Other developers for internal linking (exclude the current one).
  const others = (await getAllBuilders().catch(() => []))
    .filter((d) => d.slug !== summary.slug)
    .slice(0, 12);

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
        "@type": "RealEstateAgent",
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
      // ItemList does, matching exactly the capped preview grid rendered
      // below (withImages.slice(0, 9)), never more than what's on screen.
      ...(withImages.length > 0
        ? [
            {
              "@type": "ItemList",
              itemListElement: withImages.slice(0, 9).map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.project_name,
                url: `${SITE}/project-listing/${canonicalCitySlug(p.city_key)}/${p.slug}`,
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
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-7xl mx-auto px-4 mt-28 md:mt-32">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#B77D2B]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/developer" className="hover:text-[#B77D2B]">Developers</Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">{summary.name}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          {summary.name} Projects in {cityLabel}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-600 leading-relaxed">{intro}</p>

        {/* Quick facts */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#B77D2B] bg-white px-4 py-1.5 text-sm font-medium text-[#B77D2B]">
            {summary.count} {summary.count === 1 ? "Project" : "Projects"}
          </span>
          {summary.residential > 0 && (
            <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
              {summary.residential} Residential
            </span>
          )}
          {summary.commercial > 0 && (
            <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
              {summary.commercial} Commercial
            </span>
          )}
        </div>

        {/* Cities this developer builds in — internal linking */}
        {summary.cities.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-500">Active in:</span>
            {summary.cities.map((c) => (
              <Link
                key={c.slug}
                href={`/project-listing/${c.slug}`}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Project grid (reuses the shared card component) — capped preview;
          the real, filterable, paginated grid lives at /project-listing. */}
      {withImages.length > 0 ? (
        <SimilarProjects
          title={summary.name}
          projects={withImages.slice(0, 9)}
          heading={`Projects by ${summary.name}`}
          viewAllHref={`/project-listing?builder=${summary.slug}`}
          viewAllLabel={`View all ${withImages.length} →`}
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

      {/* Other developers — internal linking + crawlability */}
      {others.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Explore Other Developers</h2>
            <Link
              href="/developer"
              className="text-sm font-medium text-[#B77D2B] hover:underline whitespace-nowrap"
            >
              View all developers →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {others.map((d) => (
              <Link
                key={d.slug}
                href={`/developer/${d.slug}`}
                className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
              >
                {d.name} <span className="text-gray-400">({d.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AppointmentCard
        bgImage={bgImg}
        heading={`EXPLORE ${summary.name.toUpperCase()} PROJECTS`}
        para={`Get expert guidance on ${summary.name} developments — pricing, availability and a personalised investment view from the HomzRealtor team.`}
        btnTxt="Talk to an Expert"
      />
    </div>
  );
};

export default DeveloperPage;
