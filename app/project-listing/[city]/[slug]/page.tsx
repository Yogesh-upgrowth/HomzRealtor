import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import ProjectIntelligenceSections from "@/components/Project/intelligence/ProjectIntelligenceSections";
import ProjectHero from "@/components/Project/listing/ProjectHero";
import StickyMiniHeader from "@/components/Project/listing/StickyMiniHeader";
import KeyFactsRibbon from "@/components/Project/listing/KeyFactsRibbon";
import StatusStrip from "@/components/Project/listing/StatusStrip";
import EnquiryRail from "@/components/Project/listing/EnquiryRail";
import FinalCtaSection from "@/components/Project/listing/FinalCtaSection";
import StickyCta from "@/components/Project/listing/StickyCta";
import bgImg from "@/public/appointmentBG.jpg";
import { getProjectBySlug, getProjectBySlugResolved, canonicalCitySlug } from "@/lib/intelligence/projects";
import { resolveProjectView, validImages } from "@/lib/intelligence/view-model";
import { truncateAtWord, slugify, formatInr } from "@/lib/intelligence/normalize";
import { instrumentSerif, manrope } from "@/lib/fonts";

// ISR — 14-day cache to reduce API calls from crawler traffic.
// revalidate alone doesn't activate it for a dynamic segment — needs
// generateStaticParams too (verified — see app/project-listing/[city]/
// page.tsx's comment). Returning [] rather than the ~1000 real project
// slugs: an empty list still activates on-demand ISR for every param, not
// just pre-rendered ones (also verified), without slowing the build by
// pre-rendering the whole catalogue up front.
export const revalidate = 1209600;

export function generateStaticParams() {
  return [];
}

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);

  if (!project) {
    const fallbackName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: fallbackName,
      description: `Explore ${fallbackName}: pricing, location, amenities and investment insights on HomzRealtor.`,
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
  // e.g. "M3M Route 65, Sector 65 Gurgaon: Price & Location" — kept to
  // "Price & Location" (not also "Payment Plan") specifically to stay under
  // the ~60-char SERP truncation point once the longest real project names
  // are substituted in; "Payment Plan" was the lowest-intent of the three
  // keywords anyway. Deliberately doesn't promise "Floor Plan" or "Reviews"
  // — this page has neither section, and a title that over-promises just
  // teaches search engines the page bounces.
  const title = `${project.project_name}, ${locationLabel}: Price & Location`;
  // The root layout's title.template ("%s | HomzRealtor") appends the brand
  // suffix to the real <title> tag automatically, but openGraph/twitter
  // titles bypass that template — so they need the suffix added explicitly.
  const socialTitle = `${title} | HomzRealtor`;

  // Always a data-driven, complete-sentence description — never a slice of
  // the scraped "about" narrative. Truncating raw prose mid-sentence (the
  // previous behavior whenever about[0] ran long, which is most real
  // projects) reads as machine output in the SERP; every value below
  // (name, sector, starting price, configuration) is already shown
  // elsewhere on this same page, so nothing here is invented.
  const configBit = project.property_type
    ? `${project.property_type} configurations`
    : `${project.property_category} configurations`;
  const priceBit = project.min_price_inr
    ? `from ${formatInr(project.min_price_inr)}`
    : project.price_text
    ? `from ${project.price_text}`
    : "with the latest pricing";

  // Audit item 10 (2026-09-19): this ran to roughly 100 characters, leaving a
  // third of the SERP snippet unused on the site's highest-intent pages. The
  // additions below are builder, size range, possession/status and RERA state
  // — each already shown on the page, each a fact the searcher is weighing,
  // and each appended only when the record actually carries it, so a sparse
  // project still gets a complete sentence rather than a padded one.
  // truncateAtWord's 158-char default then trims on a word boundary.
  const builderBit =
    project.builder && project.builder !== "Unknown" ? ` by ${project.builder}` : "";
  const sizeBit =
    project.min_size && project.size_unit
      ? `, ${project.min_size.toLocaleString("en-IN")}${
          project.max_size && project.max_size > project.min_size
            ? `-${project.max_size.toLocaleString("en-IN")}`
            : ""
        } ${project.size_unit}`
      : "";
  const statusBit = project.possession_text
    ? ` Possession ${project.possession_text}.`
    : project.project_status
    ? ` ${project.project_status}.`
    : "";
  const reraBit = project.rera_status === "active" ? " RERA registered." : "";
  const description = truncateAtWord(
    `${project.project_name}${builderBit}, ${locationLabel}: ${configBit}${sizeBit} ${priceBit}.` +
      `${statusBit}${reraBit} Compare prices, floor plans and amenities on HomzRealtor.`
  );

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

const ProjectPage = async ({ params }: PageParams) => {
  const { city, slug } = await params;
  const resolved = await getProjectBySlugResolved(city, slug).catch(() => null);

  if (!resolved) notFound();
  const { project, canonicalSlug } = resolved;

  // The feed sometimes carries one development twice ("Emaar Emerald Floors
  // Select" and "Emaar Emrald Floors Select"). The duplicate is collapsed
  // into one record upstream (lib/intelligence/projectDedupe.ts); the losing
  // slug lands here and is sent to the surviving page rather than 404'd, so
  // whatever ranking and links the duplicate had accrued consolidate instead
  // of breaking. 308, because the merge is not temporary.
  if (canonicalSlug !== slug) {
    permanentRedirect(`/project-listing/${canonicalCitySlug(project.city_key)}/${canonicalSlug}`);
  }

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

  // Audit item 10 (2026-09-19): the ribbon led with a starting price and said
  // nothing about when that price was true. This route is ISR'd for 14 days
  // (revalidate above), so a visitor can be reading a fortnight-old figure.
  // Prefer the feed record's own timestamp; fall back to generation time,
  // which for an ISR page is exactly when this copy of the price was read.
  const updatedAt = project.updated_at ? new Date(project.updated_at) : null;
  const pricedAsOf = (
    updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : new Date()
  ).toISOString();

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
          cityKey={project.city_key}
          slug={slug}
          cityName={view.cityName}
          citySlug={view.citySlug}
          sectorLabel={project.sector}
          sectorHref={sectorHref}
          locationLine={view.locationLine}
          propertyCategory={view.propertyCategory}
          propertyType={view.propertyType}
          status={view.status}
          rera={view.rera}
          reraStatus={view.reraStatus}
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
          rera={view.rera}
          reraStatus={view.reraStatus}
          pricedAsOf={pricedAsOf}
        />

        {/* Live listing status (tracked in MongoDB) — streams in after the
            ribbon; renders nothing until the property is tracked. */}
        <Suspense fallback={null}>
          <StatusStrip cityKey={project.city_key} slug={slug} />
        </Suspense>

        <div className="max-w-7xl mx-auto px-2 lg:grid lg:grid-cols-[7fr_3fr] lg:items-start lg:gap-10 mt-4">
          {/* Audit item 10 (2026-09-19): this was wrapped in <Suspense> with a
              skeleton fallback, so the page's actual content arrived after the
              footer in hidden nodes and JavaScript swapped it in. This route is
              ISR (revalidate below), so the page is rendered once and cached --
              streaming buys nothing here and costs in-order HTML. Rendered
              inline so the main content is where a crawler and a reader both
              expect it, with no client-side swap.

              Also was a nested <main>: app/layout.tsx already declares one, and
              a document may only have one. Now a plain <div>. */}
          <div className="min-w-0">
            <ProjectIntelligenceSections cityParam={canonicalCity} slug={slug} />
          </div>

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
