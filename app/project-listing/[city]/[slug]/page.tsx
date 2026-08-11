import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProjectIntelligenceSections from "@/components/Project/intelligence/ProjectIntelligenceSections";
import ProjectHero from "@/components/Project/listing/ProjectHero";
import StickyMiniHeader from "@/components/Project/listing/StickyMiniHeader";
import KeyFactsRibbon from "@/components/Project/listing/KeyFactsRibbon";
import StatusStrip from "@/components/Project/listing/StatusStrip";
import EnquiryRail from "@/components/Project/listing/EnquiryRail";
import FinalCtaSection from "@/components/Project/listing/FinalCtaSection";
import StickyCta from "@/components/Project/listing/StickyCta";
import bgImg from "@/public/appointmentBG.jpg";
import { getProjectBySlug, canonicalCitySlug } from "@/lib/intelligence/projects";
import { resolveProjectView, validImages } from "@/lib/intelligence/view-model";
import { truncateAtWord, slugify } from "@/lib/intelligence/normalize";
import { instrumentSerif, manrope } from "@/lib/fonts";

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);

  if (!project) {
    const fallbackName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: fallbackName,
      description: `Explore ${fallbackName} — pricing, location, amenities and investment insights on HomzRealtor.`,
      alternates: {
        canonical: `https://www.homzrealtor.com/project-listing/${city}/${slug}`,
      },
    };
  }

  const cityName = project.city_name;
  const locationLabel = project.sector
    ? `${project.sector} ${cityName}`
    : project.micro_market || cityName;

  // Rich, keyword-led title built from real data (never just the bare name).
  // e.g. "M3M Route 65, Sector 65 Gurgaon: Price, Payment Plan & Location"
  // Deliberately doesn't promise "Floor Plan" or "Reviews" — this page has
  // neither section, and a title that over-promises just teaches search
  // engines the page bounces.
  const title = `${project.project_name}, ${locationLabel}: Price, Payment Plan & Location`;
  // The root layout's title.template ("%s | HomzRealtor") appends the brand
  // suffix to the real <title> tag automatically, but openGraph/twitter
  // titles bypass that template — so they need the suffix added explicitly.
  const socialTitle = `${title} | HomzRealtor`;

  // Prefer the project's own narrative when it is substantial; otherwise fall
  // back to a unique, data-driven template so no two pages share a description.
  const priceBit =
    project.min_price_inr || project.price_text ? "latest price, " : "";
  const templatedDescription =
    `Explore ${project.project_name} in ${locationLabel}. Check ${priceBit}payment plans, ` +
    `amenities, ${project.property_category.toLowerCase()} configurations, location ` +
    `advantages and nearby projects on HomzRealtor.`;
  const description =
    project.about?.[0] && project.about[0].length >= 90
      ? truncateAtWord(project.about[0])
      : truncateAtWord(templatedDescription);

  const keywords = [
    project.project_name,
    `${project.project_name} ${cityName}`,
    `${project.project_name} price`,
    `${project.property_category} projects in ${cityName}`,
    project.builder && project.builder !== "Unknown"
      ? `${project.builder} projects`
      : null,
    project.sector ? `projects in ${project.sector} ${cityName}` : null,
  ].filter(Boolean) as string[];

  const canonicalUrl = `https://www.homzrealtor.com/project-listing/${canonicalCitySlug(
    project.city_key
  )}/${slug}`;

  const rawImage = validImages(project.images || [])[0];
  // The scraped CDN URL's resize params (e.g. "aio=w-0;h-550;") reflect
  // whatever size the scrape happened to capture, often below the
  // 1200x630 social-share target — request an OG-appropriate size for
  // sharing purposes only (on-page display is unaffected).
  const image = rawImage?.replace(/aio=[^&]*/i, "aio=w-1200;h-630;");

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: image ? [image] : [],
    },
  };
}

const IntelligenceSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-2 my-12 space-y-4 animate-pulse">
    <div className="h-6 w-64 rounded bg-white/10" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-white/5" />
      ))}
    </div>
  </div>
);

const ProjectPage = async ({ params }: PageParams) => {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);

  if (!project) notFound();

  // Fast, gap-safe view (no geo) for the immediately-rendered hero + snapshot.
  // Always resolve the view against the canonical city slug (e.g. "gurgaon",
  // never "ggn") — the route itself accepts both, but every internal link
  // generated from `view.citySlug` (breadcrumb, similar-project cards, sector
  // links, etc.) must consistently point at the one canonical URL, matching
  // the <link rel="canonical"> tag below rather than mirroring whichever
  // non-canonical alias the visitor happened to land on.
  const canonicalCity = canonicalCitySlug(project.city_key);
  const view = resolveProjectView(project, { cityParam: canonicalCity });
  // Points at the in-page enquiry rail (below) rather than navigating away —
  // this page now carries its own configs/pricing/location/calculators/FAQ, so
  // there's no need to funnel enquiries out to /flat.
  const enquireHref = "#enquire";

  // Canonical, deduped URL for structured data — matches the <link rel=canonical>.
  const pageUrl = `https://www.homzrealtor.com/project-listing/${canonicalCity}/${slug}`;

  // Links this project back up to its sector hub page — the hub already
  // links down to its projects, but nothing on the project page itself
  // linked back up, leaving sector pages under-linked internally.
  const sectorSlug = project.sector ? slugify(project.sector) : null;
  const sectorHref = sectorSlug ? `/project-listing/${canonicalCity}/sectors/${sectorSlug}` : null;

  // Core structured data (BreadcrumbList + RealEstateListing) is emitted here, in
  // the immediately-rendered HTML. FAQPage schema lives in <ProjectJsonLd> inside
  // the streamed intelligence sections — no type is emitted in both places.
  const listing: Record<string, any> = {
    "@type": "RealEstateListing",
    name: view.name,
    url: pageUrl,
    ...(view.about[0] ? { description: view.about[0] } : {}),
    ...(view.images.length ? { image: view.images.slice(0, 5) } : {}),
    provider: { "@type": "Organization", name: project.builder },
    address: {
      "@type": "PostalAddress",
      ...(project.sector || project.micro_market
        ? {
            streetAddress: [project.sector, project.micro_market]
              .filter(Boolean)
              .join(", "),
          }
        : {}),
      addressLocality: project.city_name,
      addressRegion: project.state,
      addressCountry: "IN",
    },
  };
  if (project.min_price_inr) {
    listing.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: project.min_price_inr,
      ...(project.max_price_inr ? { highPrice: project.max_price_inr } : {}),
    };
  }

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
            name: view.cityName,
            item: `https://www.homzrealtor.com/project-listing/${canonicalCity}`,
          },
          ...(sectorHref
            ? [
                {
                  "@type": "ListItem",
                  position: 4,
                  name: project.sector,
                  item: `https://www.homzrealtor.com${sectorHref}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: sectorHref ? 5 : 4,
            name: view.name,
            item: pageUrl,
          },
        ],
      },
      listing,
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <StickyMiniHeader name={view.name} />

      <div
        className={`${instrumentSerif.variable} ${manrope.variable} font-ui bg-[#0B0B0C] text-white pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0`}
      >
        <ProjectHero
          name={view.name}
          builder={view.builder}
          cityName={view.cityName}
          citySlug={view.citySlug}
          sectorLabel={project.sector}
          sectorHref={sectorHref}
          locationLine={view.locationLine}
          propertyCategory={view.propertyCategory}
          propertyType={view.propertyType}
          status={view.status}
          rera={view.rera}
          priceText={view.priceText}
          priceSubtext={view.priceSubtext}
          possession={view.possession}
          images={view.images}
          enquireHref={enquireHref}
        />
        <div id="hero-sentinel" />

        <KeyFactsRibbon
          priceText={view.priceText}
          priceSubtext={view.priceSubtext}
          possession={view.possession}
          status={view.status}
          unitCount={view.units.length}
        />

        {/* Live listing status (tracked in MongoDB) — streams in after the
            ribbon; renders nothing until the property is tracked. */}
        <Suspense fallback={null}>
          <StatusStrip cityKey={project.city_key} slug={slug} />
        </Suspense>

        <div className="max-w-7xl mx-auto px-2 lg:grid lg:grid-cols-[7fr_3fr] lg:items-start lg:gap-10 mt-4">
          <main className="min-w-0">
            {/* Geo + AI heavy sections stream in (all cached after first load) */}
            <Suspense fallback={<IntelligenceSkeleton />}>
              <ProjectIntelligenceSections cityParam={canonicalCity} slug={slug} />
            </Suspense>
          </main>

          <aside className="mt-10 lg:mt-0 lg:sticky lg:top-28 lg:self-start lg:py-10">
            <EnquiryRail projectName={view.name} locationLine={view.locationLine} />
          </aside>
        </div>

        <FinalCtaSection projectName={view.name} locationLine={view.locationLine} bgImage={bgImg} />
      </div>

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
