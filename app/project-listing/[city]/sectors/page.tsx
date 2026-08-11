import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";

import {
  CITY_PARAM_MAP,
  CITY_DISPLAY,
  canonicalCitySlug,
  getSectorsForCity,
} from "@/lib/intelligence/projects";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";

type PageParams = { params: Promise<{ city: string }> };

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
  const { city } = await params;
  const resolved = resolveCity(city);
  if (!resolved) return {};

  const { name, slug } = resolved;
  const title = `Property by Sector in ${name} — Browse Projects Sector-wise`;
  const description = `Browse residential and commercial property projects in ${name} by sector. Pick a sector to see verified projects, prices, floor plans and availability, then enquire directly with HomzRealtor.`;

  return {
    title,
    description,
    keywords: [
      `property by sector in ${name}`,
      `${name} sectors`,
      `projects in ${name} sector wise`,
      `sector wise property ${name}`,
      `new projects ${name} sector`,
    ],
    alternates: {
      canonical: `${SITE}/project-listing/${slug}/sectors`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE}/project-listing/${slug}/sectors`,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

const CitySectorsPage = async ({ params }: PageParams) => {
  const { city } = await params;
  const resolved = resolveCity(city);
  if (!resolved) notFound();

  const { cityKey, slug, name, state } = resolved;
  const sectors = await getSectorsForCity(cityKey).catch(() => []);

  const pageUrl = `${SITE}/project-listing/${slug}/sectors`;
  const totalProjects = sectors.reduce((s, x) => s + x.count, 0);

  const intro =
    `Browse property projects in ${name}, ${state} sector by sector on HomzRealtor. ` +
    (sectors.length
      ? `We currently cover ${sectors.length} ${
          sectors.length === 1 ? "sector" : "sectors"
        } with ${totalProjects}+ verified residential and commercial developments. `
      : "") +
    `Select a sector below to compare prices, floor plans, amenities and possession timelines.`;

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
          { "@type": "ListItem", position: 4, name: "Sectors", item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Property by Sector in ${name}`,
        description: intro,
        url: pageUrl,
        ...(sectors.length
          ? {
              hasPart: sectors.map((s) => ({
                "@type": "CollectionPage",
                name: `${s.sector} ${name}`,
                url: `${SITE}/project-listing/${slug}/sectors/${s.slug}`,
              })),
            }
          : {}),
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
          <span className="text-gray-800 font-medium">Sectors</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Property by Sector in {name}
        </h1>
        <p className="mt-4 max-w-3xl text-gray-600 leading-relaxed">{intro}</p>
      </section>

      {/* Sector grid */}
      {sectors.length > 0 ? (
        <section className="w-full max-w-7xl mx-auto px-4 mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sectors.map((s) => (
              <Link
                key={s.slug}
                href={`/project-listing/${slug}/sectors/${s.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-[#B77D2B] hover:shadow-sm transition"
              >
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <MapPin
                    size={16}
                    className="text-[#B77D2B] shrink-0"
                  />
                  <span className="group-hover:text-[#B77D2B] transition">
                    {s.sector}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {s.count} {s.count === 1 ? "project" : "projects"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.residential > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {s.residential} Residential
                    </span>
                  )}
                  {s.commercial > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {s.commercial} Commercial
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 my-12 text-gray-500">
          Sector-wise listings for {name} are being updated. Please{" "}
          <Link
            href={`/project-listing/${slug}`}
            className="text-[#B77D2B] underline"
          >
            browse all projects in {name}
          </Link>{" "}
          in the meantime.
        </div>
      )}

      <div className="mt-10" />
      <AppointmentCard
        bgImage={bgImg}
        heading={`FIND YOUR PROPERTY IN ${name.toUpperCase()}`}
        para={`Tell us the sector you're interested in and get expert guidance on the best projects in ${name} — pricing, availability and a personalised investment view from the HomzRealtor team.`}
        btnTxt="Talk to an Expert"
      />
    </div>
  );
};

export default CitySectorsPage;
