import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  CITY_PARAM_MAP,
  CITY_DISPLAY,
  canonicalCitySlug,
  getProjectsForCity,
  getSectorsForCity,
} from "@/lib/intelligence/projects";
import { slugify } from "@/lib/intelligence/normalize";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";

type PageParams = { params: Promise<{ city: string }> };

// Every other city, used for the "explore nearby markets" internal-link block.
const ALL_CITIES: { slug: string; name: string }[] = [
  { slug: "gurgaon", name: "Gurgaon" },
  { slug: "noida", name: "Noida" },
  { slug: "greaternoida", name: "Greater Noida" },
  { slug: "delhi", name: "Delhi" },
  { slug: "faridabad", name: "Faridabad" },
];

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

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city } = await params;
  const resolved = resolveCity(city);
  if (!resolved) return {};

  const { cityKey, name, slug } = resolved;
  const title = `Property in ${name} — Residential & Commercial Projects`;
  const description = `Explore verified residential and commercial property projects in ${name}. Compare prices, floor plans, amenities and locations, and enquire directly with HomzRealtor.`;

  // A city with no live inventory yet still renders (as a "being updated"
  // placeholder) but shouldn't be indexed as if it were a real listings hub —
  // that mismatch between what's promised and what's on the page is exactly
  // what erodes trust with both crawlers and buyers.
  const projects = await getProjectsForCity(cityKey).catch(() => []);
  const hasInventory = projects.length > 0;

  return {
    title,
    description,
    keywords: [
      `property in ${name}`,
      `residential projects in ${name}`,
      `commercial projects in ${name}`,
      `new projects in ${name}`,
      `flats in ${name}`,
      `real estate ${name}`,
    ],
    alternates: {
      canonical: `${SITE}/project-listing/${slug}`,
    },
    ...(hasInventory ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: `${SITE}/project-listing/${slug}`,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

const CityLandingPage = async ({ params }: PageParams) => {
  const { city } = await params;
  const resolved = resolveCity(city);
  if (!resolved) notFound();

  const { cityKey, slug, name, state } = resolved;

  const projects = await getProjectsForCity(cityKey).catch(() => []);
  const withImages = projects.filter((p) => p.images.length > 0);
  const sectors = await getSectorsForCity(cityKey).catch(() => []);

  const residential = projects.filter((p) => p.property_category === "Residential");
  const commercial = projects.filter((p) => p.property_category === "Commercial");
  const builders = Array.from(
    new Set(
      projects
        .map((p) => p.builder)
        .filter((b) => b && b !== "Unknown")
    )
  ).slice(0, 8);
  const microMarkets = Array.from(
    new Set(projects.map((p) => p.micro_market).filter(Boolean) as string[])
  ).slice(0, 6);

  const pageUrl = `${SITE}/project-listing/${slug}`;

  // Unique, data-driven intro so no two city pages read the same (doc §4/§6).
  const intro =
    `Discover ${projects.length > 0 ? `${projects.length}+ ` : ""}verified property ` +
    `projects in ${name}, ${state} on HomzRealtor` +
    (residential.length && commercial.length
      ? ` — spanning ${residential.length} residential and ${commercial.length} commercial developments.`
      : ".") +
    (microMarkets.length
      ? ` Popular corridors include ${microMarkets.slice(0, 3).join(", ")}.`
      : "") +
    ` Compare prices, floor plans, amenities and possession timelines, then enquire directly with our advisors.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}/project-listing` },
          { "@type": "ListItem", position: 3, name: name, item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Property in ${name}`,
        description: intro,
        url: pageUrl,
        about: { "@type": "Place", name, address: { "@type": "PostalAddress", addressLocality: name, addressRegion: state, addressCountry: "IN" } },
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
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#B77D2B]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/project-listing" className="hover:text-[#B77D2B]">Projects</Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">{name}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Property in {name} — Residential &amp; Commercial Projects
        </h1>
        <p className="mt-4 max-w-3xl text-gray-600 leading-relaxed">{intro}</p>

        {/* Category quick links */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/project-listing"
            className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
          >
            All Projects in {name}
          </Link>
          {sectors.length > 0 && (
            <Link
              href={`/project-listing/${slug}/sectors`}
              className="rounded-full border border-[#B77D2B] bg-white px-4 py-1.5 text-sm font-medium text-[#B77D2B] transition"
            >
              Browse by Sector ({sectors.length})
            </Link>
          )}
          {residential.length > 0 && (
            <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
              {residential.length} Residential
            </span>
          )}
          {commercial.length > 0 && (
            <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
              {commercial.length} Commercial
            </span>
          )}
        </div>
      </section>

      {/* Project grid (reuses the shared card component) — capped preview,
          not the full city list (which can run into the hundreds); the real,
          filterable, paginated grid lives at /project-listing. */}
      {withImages.length > 0 ? (
        <SimilarProjects
          title={name}
          projects={withImages.slice(0, 9)}
          heading={`Projects in ${name}`}
          viewAllHref="/project-listing"
          viewAllLabel={`View all ${withImages.length} →`}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 my-12 text-gray-500">
          Project listings for {name} are being updated. Please{" "}
          <Link href="/project-listing" className="text-[#B77D2B] underline">
            browse all projects
          </Link>{" "}
          in the meantime.
        </div>
      )}

      {/* Browse by sector — programmatic internal linking hub */}
      {sectors.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Browse Property in {name} by Sector
            </h2>
            <Link
              href={`/project-listing/${slug}/sectors`}
              className="text-sm font-medium text-[#B77D2B] hover:underline whitespace-nowrap"
            >
              View all {sectors.length} sectors →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {sectors.slice(0, 18).map((s) => (
              <Link
                key={s.slug}
                href={`/project-listing/${slug}/sectors/${s.slug}`}
                className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
              >
                {s.sector}{" "}
                <span className="text-gray-400">({s.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Builders in this city — internal linking + content depth */}
      {builders.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Top Developers in {name}
            </h2>
            <Link
              href="/developer"
              className="text-sm font-medium text-[#B77D2B] hover:underline whitespace-nowrap"
            >
              View all developers →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {builders.map((b) => (
              <Link
                key={b as string}
                href={`/developer/${slugify(b as string)}`}
                className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-white hover:text-[#B77D2B] border border-transparent hover:border-[#B77D2B] transition"
              >
                {b}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Explore other cities — internal linking (doc §7) */}
      <section className="w-full max-w-7xl mx-auto px-4 my-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Explore Property in Other Cities
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_CITIES.filter((c) => c.slug !== slug).map((c) => (
            <Link
              key={c.slug}
              href={`/project-listing/${c.slug}`}
              className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
            >
              Property in {c.name}
            </Link>
          ))}
        </div>
      </section>

      <AppointmentCard
        bgImage={bgImg}
        heading={`FIND YOUR PROPERTY IN ${name.toUpperCase()}`}
        para={`Get expert guidance on the best residential and commercial projects in ${name} — pricing, availability and a personalised investment view from the HomzRealtor team.`}
        btnTxt="Talk to an Expert"
      />
    </div>
  );
};

export default CityLandingPage;
