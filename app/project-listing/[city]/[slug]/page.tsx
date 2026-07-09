import type { Metadata } from "next";
import { Suspense } from "react";
import ProjectIntelligenceSections from "@/components/Project/intelligence/ProjectIntelligenceSections";
import ProjectHero from "@/components/Project/listing/ProjectHero";
import QuickSnapshot from "@/components/Project/listing/QuickSnapshot";
import StickyCta from "@/components/Project/listing/StickyCta";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { getProjectBySlug } from "@/lib/intelligence/projects";
import { resolveProjectView } from "@/lib/intelligence/view-model";

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);

  const title = project
    ? project.project_name
    : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const description = project?.about?.[0]
    ? project.about[0].slice(0, 155)
    : `Explore ${project?.project_name || slug} — pricing, location, amenities and investment insights on HomzRealtor.`;

  const image = project?.images?.find(
    (u) => typeof u === "string" && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)
  );

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.homzrealtor.com/project-listing/${city}/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.homzrealtor.com/project-listing/${city}/${slug}`,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

const IntelligenceSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-2 my-12 space-y-4 animate-pulse">
    <div className="h-6 w-64 rounded bg-gray-200" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-gray-100" />
      ))}
    </div>
  </div>
);

const ProjectPage = async ({ params }: PageParams) => {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);

  if (!project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h1>
        <p className="text-gray-500 mb-6">
          We couldn&apos;t find this project. It may have been removed or the link is incorrect.
        </p>
        <a
          href="/project-listing"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
        >
          Browse all projects
        </a>
      </div>
    );
  }

  // Fast, gap-safe view (no geo) for the immediately-rendered hero + snapshot.
  const view = resolveProjectView(project, { cityParam: city });
  const enquireHref = `/project-listing/${view.citySlug}/${view.slug}/enquire`;

  const pageUrl = `https://www.homzrealtor.com/project-listing/${city}/${slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.homzrealtor.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Projects",
            item: "https://www.homzrealtor.com/project-listing",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: view.name,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "RealEstateListing",
        name: view.name,
        url: pageUrl,
        ...(view.images?.[0] ? { image: view.images[0] } : {}),
        ...(view.locationLine
          ? {
              spatialCoverage: {
                "@type": "Place",
                name: view.locationLine,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: view.cityName,
                  addressCountry: "IN",
                },
              },
            }
          : {}),
      },
    ],
  };

  return (
    <div className="pb-24 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <ProjectHero
        name={view.name}
        builder={view.builder}
        cityName={view.cityName}
        citySlug={view.citySlug}
        locationLine={view.locationLine}
        propertyCategory={view.propertyCategory}
        propertyType={view.propertyType}
        status={view.status}
        rera={view.rera}
        priceText={view.priceText}
        priceSubtext={view.priceSubtext}
        images={view.images}
        enquireHref={enquireHref}
      />

      <div className="mt-6">
        <QuickSnapshot chips={view.snapshot} />
      </div>

      {/* Geo + AI heavy sections stream in (all cached after first load) */}
      <Suspense fallback={<IntelligenceSkeleton />}>
        <ProjectIntelligenceSections cityParam={city} slug={slug} />
      </Suspense>

      <AppointmentCard
        bgImage={bgImg}
        heading="SCHEDULE YOUR SITE VISIT"
        para={`Get expert guidance on ${view.name} — pricing, availability and a personalised investment view from the HomzRealtor team.`}
        btnTxt="Schedule Site Visit"
      />

      <StickyCta
        name={view.name}
        priceText={view.priceText}
        priceSubtext={view.priceSubtext}
        enquireHref={enquireHref}
      />
    </div>
  );
};

export default ProjectPage;
