import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  CITY_PARAM_MAP,
  CITY_DISPLAY,
  canonicalCitySlug,
  getProjectsForSector,
  getSectorsForCity,
  sectorLabelFromSlug,
} from "@/lib/intelligence/projects";
import SimilarProjects from "@/components/Project/intelligence/SimilarProjects";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";

type PageParams = { params: Promise<{ city: string; sector: string }> };

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

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { city, sector } = await params;
  const resolved = resolveCity(city);
  if (!resolved) return {};

  const { name, slug } = resolved;
  const projects = await getProjectsForSector(city, sector).catch(() => []);
  const sectorLabel = projects[0]?.sector || sectorLabelFromSlug(sector);

  const title = `Property in ${sectorLabel} ${name}: Projects, Price & Floor Plans`;
  const description = `Explore ${
    projects.length > 0 ? `${projects.length}+ ` : ""
  }verified property projects in ${sectorLabel}, ${name}. Compare prices, floor plans, amenities and possession timelines, then enquire directly with HomzRealtor.`;

  return {
    title,
    description,
    keywords: [
      `property in ${sectorLabel} ${name}`,
      `projects in ${sectorLabel} ${name}`,
      `${sectorLabel} ${name} flats`,
      `${sectorLabel} ${name} price`,
      `new projects ${sectorLabel} ${name}`,
    ],
    alternates: {
      canonical: `${SITE}/project-listing/${slug}/sectors/${sector.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE}/project-listing/${slug}/sectors/${sector.toLowerCase()}`,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

const SectorProjectsPage = async ({ params }: PageParams) => {
  const { city, sector } = await params;
  const resolved = resolveCity(city);
  if (!resolved) notFound();

  const { cityKey, slug, name, state } = resolved;
  const projects = await getProjectsForSector(city, sector).catch(() => []);
  const sectorLabel = projects[0]?.sector || sectorLabelFromSlug(sector);

  const withImages = projects.filter((p) => p.images.length > 0);
  const residential = projects.filter(
    (p) => p.property_category === "Residential"
  );
  const commercial = projects.filter(
    (p) => p.property_category === "Commercial"
  );
  const builders = Array.from(
    new Set(
      projects.map((p) => p.builder).filter((b) => b && b !== "Unknown")
    )
  ).slice(0, 8);

  // Sibling sectors for internal linking (excludes the current one).
  const allSectors = await getSectorsForCity(cityKey).catch(() => []);
  const otherSectors = allSectors
    .filter((s) => s.slug !== sector.toLowerCase())
    .slice(0, 10);

  const pageUrl = `${SITE}/project-listing/${slug}/sectors/${sector.toLowerCase()}`;

  const intro =
    `Discover ${projects.length > 0 ? `${projects.length}+ ` : ""}verified property ` +
    `projects in ${sectorLabel}, ${name}, ${state} on HomzRealtor` +
    (residential.length && commercial.length
      ? ` — ${residential.length} residential and ${commercial.length} commercial developments.`
      : ".") +
    ` Compare prices, floor plans, amenities and possession timelines, then enquire directly with our advisors.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          {
            "@type": "ListItem",
            position: 2,
            name: "Projects",
            item: `${SITE}/project-listing`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name,
            item: `${SITE}/project-listing/${slug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "Sectors",
            item: `${SITE}/project-listing/${slug}/sectors`,
          },
          {
            "@type": "ListItem",
            position: 5,
            name: sectorLabel,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Property in ${sectorLabel} ${name}`,
        description: intro,
        url: pageUrl,
        about: {
          "@type": "Place",
          name: `${sectorLabel}, ${name}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: name,
            addressRegion: state,
            addressCountry: "IN",
          },
        },
      },
    ],
  };

  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-7xl mx-auto px-4 mt-28 md:mt-32">
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
          <Link
            href={`/project-listing/${slug}`}
            className="hover:text-[#B77D2B]"
          >
            {name}
          </Link>
          <ChevronRight size={12} />
          <Link
            href={`/project-listing/${slug}/sectors`}
            className="hover:text-[#B77D2B]"
          >
            Sectors
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">{sectorLabel}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Property in {sectorLabel}, {name}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-600 leading-relaxed">{intro}</p>

        <div className="mt-6 flex flex-wrap gap-2">
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

      {/* Project grid (reuses the shared card component) */}
      {withImages.length > 0 ? (
        <SimilarProjects
          title={sectorLabel}
          projects={withImages}
          heading={`Projects in ${sectorLabel}, ${name}`}
        />
      ) : projects.length > 0 ? (
        <SimilarProjects
          title={sectorLabel}
          projects={projects}
          heading={`Projects in ${sectorLabel}, ${name}`}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 my-12 text-gray-500">
          No projects found in {sectorLabel}, {name} right now. Please{" "}
          <Link
            href={`/project-listing/${slug}/sectors`}
            className="text-[#B77D2B] underline"
          >
            browse other sectors
          </Link>{" "}
          or{" "}
          <Link
            href={`/project-listing/${slug}`}
            className="text-[#B77D2B] underline"
          >
            all projects in {name}
          </Link>
          .
        </div>
      )}

      {/* Builders in this sector */}
      {builders.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Developers in {sectorLabel}, {name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {builders.map((b) => (
              <span
                key={b}
                className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700"
              >
                {b}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Other sectors — internal linking */}
      {otherSectors.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Explore Other Sectors in {name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherSectors.map((s) => (
              <Link
                key={s.slug}
                href={`/project-listing/${slug}/sectors/${s.slug}`}
                className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
              >
                {s.sector}
              </Link>
            ))}
            <Link
              href={`/project-listing/${slug}/sectors`}
              className="rounded-full border border-[#B77D2B] bg-white px-4 py-1.5 text-sm font-medium text-[#B77D2B] transition"
            >
              View all sectors →
            </Link>
          </div>
        </section>
      )}

      <AppointmentCard
        bgImage={bgImg}
        heading={`FIND YOUR PROPERTY IN ${sectorLabel.toUpperCase()}`}
        para={`Get expert guidance on the best projects in ${sectorLabel}, ${name} — pricing, availability and a personalised investment view from the HomzRealtor team.`}
        btnTxt="Talk to an Expert"
      />
    </div>
  );
};

export default SectorProjectsPage;
