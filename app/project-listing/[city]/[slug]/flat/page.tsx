import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import Carousel from "@/components/Carousel";
import AppointmentCard from "@/components/Common/Appointment";
import FlatIntelligenceSections from "@/components/Project/intelligence/FlatIntelligenceSections";
import bgImg from "@/public/appointmentBG.jpg";
import { getProjectBySlug, canonicalCitySlug } from "@/lib/intelligence/projects";
import { formatInr, truncateAtWord, type NormalizedProject } from "@/lib/intelligence/normalize";

const SITE = "https://www.homzrealtor.com";

type PageParams = { params: Promise<{ city: string; slug: string }> };

const imgFilter = (u: unknown): u is string =>
  typeof u === "string" && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u);

// A "flat" child page is only genuinely useful (and thus indexable) for
// residential projects that carry some flat-relevant data. Commercial/plot
// projects have no valid "flat" property type, and empty projects would be thin
// duplicates — both get noindex,follow so we never index low-value combos while
// keeping the URL live and its links crawlable.
function isFlatPageIndexable(project: NormalizedProject): boolean {
  const isResidential = project.property_category === "Residential";
  const hasContent =
    project.amenities.length > 0 ||
    project.specifications.length > 0 ||
    project.images.length > 0 ||
    project.interior_images.length > 0 ||
    project.min_price_inr != null;
  return isResidential && hasContent;
}

function locationLabel(project: NormalizedProject): string {
  return project.sector
    ? `${project.sector}, ${project.city_name}`
    : project.micro_market || project.city_name;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);

  if (!project) {
    const fallbackName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `Flats in ${fallbackName} | HomzRealtor`,
      robots: { index: false, follow: true },
    };
  }

  const loc = locationLabel(project);
  const canonicalUrl = `${SITE}/project-listing/${canonicalCitySlug(
    project.city_key
  )}/${slug}/flat`;
  const indexable = isFlatPageIndexable(project);

  const priceBit =
    project.min_price_inr != null
      ? `Prices from ${formatInr(project.min_price_inr)}. `
      : "";
  const title = `Flats in ${project.project_name}, ${loc} — Price & Availability | HomzRealtor`;
  const description =
    `Looking for flats in ${project.project_name}, ${loc}? ${priceBit}` +
    `Check available configurations, floor plans, amenities and specifications, ` +
    `and enquire about current availability on HomzRealtor.`;

  const image = project.images.find(imgFilter) || project.interior_images.find(imgFilter);

  const truncatedDescription = truncateAtWord(description);

  return {
    title,
    description: truncatedDescription,
    keywords: [
      `flats in ${project.project_name}`,
      `${project.project_name} flats`,
      `${project.project_name} ${project.city_name}`,
      `flats for sale in ${loc}`,
      `${project.project_name} price`,
    ],
    alternates: { canonical: canonicalUrl },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description: truncatedDescription,
      url: canonicalUrl,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
  };
}

const FlatChildPage = async ({ params }: PageParams) => {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);
  if (!project) notFound();

  const citySegment = canonicalCitySlug(project.city_key);
  const projectUrl = `/project-listing/${citySegment}/${slug}`;
  const pageUrl = `${SITE}${projectUrl}/flat`;
  const loc = locationLabel(project);

  const gallery = (
    project.interior_images.length ? project.interior_images : project.images
  ).filter(imgFilter);

  const specifications = project.specifications;

  const priceRange =
    project.min_price_inr != null
      ? project.max_price_inr && project.max_price_inr !== project.min_price_inr
        ? `${formatInr(project.min_price_inr)} – ${formatInr(project.max_price_inr)}`
        : formatInr(project.min_price_inr)
      : project.price_text || null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      {
        "@type": "ListItem",
        position: 2,
        name: project.city_name,
        item: `${SITE}/project-listing/${citySegment}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.project_name,
        item: `${SITE}${projectUrl}`,
      },
      { "@type": "ListItem", position: 4, name: "Flats", item: pageUrl },
    ],
  };

  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    <div className="pb-16 text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-7xl mx-auto px-4 mt-28 md:mt-32">
        {/* Breadcrumb — crawlable anchors back to parent entities */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#B77D2B]">Home</Link>
          <ChevronRight size={12} />
          <Link href={`/project-listing/${citySegment}`} className="hover:text-[#B77D2B]">
            {project.city_name}
          </Link>
          <ChevronRight size={12} />
          <Link href={projectUrl} className="hover:text-[#B77D2B]">
            {project.project_name}
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">Flats</span>
        </nav>

        {/* Transactional hero */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Flats in {project.project_name}
        </h1>
        <p className="mt-2 text-gray-600">{loc}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {priceRange && (
            <span className="rounded-full border border-[#B77D2B] bg-white px-4 py-1.5 text-sm font-medium text-[#B77D2B]">
              {priceRange}
            </span>
          )}
          {project.property_type && (
            <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
              {project.property_type}
            </span>
          )}
          {project.possession_text && (
            <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
              Possession: {project.possession_text}
            </span>
          )}
          {project.rera_id && (
            <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
              RERA: {project.rera_id}
            </span>
          )}
        </div>

        {/* Availability status — honest, no fake inventory */}
        <p className="mt-5 max-w-3xl text-gray-600 leading-relaxed">
          Enquire for the latest availability, floor plans and price breakup for flats in{" "}
          {project.project_name}. Our advisors share verified options that match your budget
          and configuration.
        </p>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-8">
          <Carousel images={gallery} alt={`${project.project_name} — flat interior`} />
        </section>
      )}

      {/* Specifications */}
      {specifications.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 my-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
          <div className="overflow-x-auto border border-gray-300 rounded-md">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-yellow-600/80 text-white text-left">
                  <th className="px-6 py-4 border-r border-gray-700">CATEGORY</th>
                  <th className="px-6 py-4">DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {specifications.map(
                  (item: { heading?: string; value?: string }, i: number) => (
                    <tr key={i} className="bg-black text-white border-t">
                      <td className="px-6 py-4 border-r border-gray-200 font-medium">
                        {item.heading}
                      </td>
                      <td className="px-6 py-4">{item.value}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Full flat-buying deep dive — configurations, amenities, location,
          pricing, rental insights, FAQs and similar flats. Exclusive to this
          page; the project page keeps only the investment-analysis bucket. */}
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 my-12 h-40 animate-pulse rounded-xl bg-gray-100" />
        }
      >
        <FlatIntelligenceSections cityParam={city} slug={slug} />
      </Suspense>

      {/* Compact project context — link back to the full project page */}
      <section className="w-full max-w-7xl mx-auto px-4 my-10">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              About {project.project_name}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              See the full project — pricing, floor plans, location intelligence and
              investment insights.
            </p>
          </div>
          <Link
            href={projectUrl}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FDF094] to-[#B77D2B] px-5 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
          >
            View full project details →
          </Link>
        </div>
      </section>

      <AppointmentCard
        bgImage={bgImg}
        heading={`ENQUIRE ABOUT FLATS IN ${project.project_name.toUpperCase()}`}
        para={`Get current availability, floor plans and the best price for flats in ${project.project_name}, ${loc} from the HomzRealtor team.`}
        btnTxt="Check Availability"
      />
    </div>
  );
};

export default FlatChildPage;
