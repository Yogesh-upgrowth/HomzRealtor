// Server component — the redesigned project detail page's full section flow,
// modeled on the dark-luxury reference design. Fetches every real data source
// exactly once (previously split across this file and the now-retired
// PersonaSections.tsx, which re-fetched the same geocode/landmarks/connectivity/
// content) and renders every section as an independent flat block instead of
// gating half of them behind an Investor/Buyer tab switch. Every section
// self-hides when it has nothing real to show.

import {
  CITY_PARAM_MAP,
  getProjectBySlug,
  getPriceInsights,
  getSimilarProjects,
  getBuilderProjects,
  getSectorProjects,
  getSectorAverages,
} from "@/lib/intelligence/projects";
import { slugify } from "@/lib/intelligence/normalize";
import { geocodeProject, fetchNearbyLandmarks, buildConnectivity } from "@/lib/intelligence/geo";
import { generateProjectContent, buildFallbackFaqs } from "@/lib/intelligence/content";
import { resolveProjectView, isKnownBuilder } from "@/lib/intelligence/view-model";
import { buildLocationSummary, buildMarketSummary, buildInvestmentSummary } from "@/lib/intelligence/summaries";
import type { Chapter } from "./OverviewSheet";

import HighlightStats from "@/components/Project/listing/HighlightStats";
import AmenitiesShowcase from "@/components/Project/listing/AmenitiesShowcase";
import LandmarksTable from "@/components/Project/LandmarkTable";

import OverviewSection from "./OverviewSection";
import GalleryTabs from "./GalleryTabs";
import ConfigurationsTable from "./ConfigurationsTable";
import PricingAndPayment from "./PricingAndPayment";
import InvestmentToolsTabs from "./InvestmentToolsTabs";
import InvestmentCase from "./InvestmentCase";
import LocationIntelligence from "./LocationIntelligence";
import ConnectivityScorecard from "./ConnectivityScorecard";
import MapEmbed from "./MapEmbed";
import AreaMarketInsights from "./AreaMarketInsights";
import InvestmentAnalysis from "./InvestmentAnalysis";
import SpecificationsAccordion from "./SpecificationsAccordion";
import BuilderProfile from "./BuilderProfile";
import SectorCompareTeaser from "./SectorCompareTeaser";
import SimilarProjects from "./SimilarProjects";
import Faq from "./Faq";
import ProjectJsonLd from "./ProjectJsonLd";

type Props = {
  cityParam: string;
  slug: string;
};

const ProjectIntelligenceSections = async ({ cityParam, slug }: Props) => {
  const cityKey = CITY_PARAM_MAP[cityParam.toLowerCase()] || cityParam;

  const project = await getProjectBySlug(cityParam, slug);
  if (!project) return null;

  const address = [
    project.project_name,
    project.sector,
    project.micro_market,
    project.city_name,
    project.state,
    "India",
  ]
    .filter(Boolean)
    .join(", ");

  const coords = await geocodeProject(address).catch(() => null);

  const [landmarks, connectivity] = coords
    ? await Promise.all([
        fetchNearbyLandmarks(coords.lat, coords.lng).catch(() => ({})),
        buildConnectivity(cityKey, coords.lat, coords.lng).catch(() => []),
      ])
    : [{}, []];

  const content = await generateProjectContent(project, landmarks, connectivity).catch(() => ({
    location_intelligence: "",
    investment_analysis: "",
    area_market_insights: "",
    builder_profile: "",
    faq: [],
  }));

  const fallbackFaqs = buildFallbackFaqs(project);
  const faqItems = content.faq.length > 0 ? content.faq : fallbackFaqs;

  const [priceData, sectorAverages, similarProjects, builderProjects, sectorProjects] = await Promise.all([
    getPriceInsights(project).catch(() => null),
    getSectorAverages(project).catch(() => null),
    getSimilarProjects(project).catch(() => []),
    getBuilderProjects(project).catch(() => []),
    getSectorProjects(project).catch(() => []),
  ]);

  const view = resolveProjectView(project, {
    connectivity,
    landmarks,
    aiSummary: content.location_intelligence,
    cityParam,
  });

  // Combined, deduped "Similar Projects" preview for the Compare+Similar
  // section — one compact set rather than three separate full grids. Excludes
  // anything already shown above under "More by {builder}" so the same card
  // never appears twice on the page.
  const builderSlugs = new Set(builderProjects.map((p) => `${p.city_key}-${p.slug}`));
  const combinedSimilar = [...sectorProjects, ...similarProjects]
    .filter((p) => !builderSlugs.has(`${p.city_key}-${p.slug}`))
    .filter((p, i, arr) => arr.findIndex((x) => x.city_key === p.city_key && x.slug === p.slug) === i)
    .slice(0, 3);

  // Overview chapters — real content only, deterministic fallback when AI text
  // is unavailable (same fallback helpers used elsewhere in the codebase).
  const locationText = content.location_intelligence || buildLocationSummary(project, connectivity, landmarks);
  const marketText = content.area_market_insights || buildMarketSummary(project, priceData);
  const investmentText = content.investment_analysis || buildInvestmentSummary(view, project, connectivity, priceData);

  // Only the About text lives in the "Read full overview" sheet. Location,
  // Investment and Market text are NOT duplicated here — they already render
  // in full, always-visible, further down this same page (the Location
  // section, the Investment/Market grid) — repeating them in the sheet too
  // printed identical paragraphs twice on the page.
  const chapters: Chapter[] = [
    view.about.length > 2 && { kicker: "OVERVIEW", title: `About ${view.name}`, body: view.about.slice(2).join("\n\n") },
  ].filter(Boolean) as Chapter[];

  // Developer stats/badges — only honestly-derivable facts, nothing fabricated.
  const builderStats = [
    builderProjects.length > 0 && { label: "projects listed", value: `${builderProjects.length}+` },
    { label: `developer active in ${view.cityName}`, value: "✓" },
  ].filter(Boolean) as { label: string; value: string }[];
  const builderBadges = [
    isKnownBuilder(project.builder) && "Established Developer",
    project.rera_id && "RERA Registered",
  ].filter(Boolean) as string[];

  const landmarksForTable: Record<string, { name: string; distance: string }[]> = {};
  for (const [category, list] of Object.entries(landmarks)) {
    if (!list.length) continue;
    landmarksForTable[category] = list.map((l) => ({ name: l.name, distance: l.distance_text }));
  }
  const hasLandmarks = Object.keys(landmarksForTable).length > 0;
  const isCommercial = view.propertyCategory === "Commercial";

  return (
    <>
      {/* Why this property — three reasons it stands out */}
      <HighlightStats title={view.name} stats={view.highlightStats} />

      {/* Overview + snapshot grid + full-overview reading sheet */}
      <OverviewSection title={view.name} about={view.about} chapters={chapters} chips={view.snapshot} />

      {/* Gallery & plans */}
      <GalleryTabs
        title={view.name}
        exterior={view.images}
        interior={project.interior_images || []}
        masterPlan={view.masterPlan}
      />

      {/* Configurations — compact per-unit-type price list */}
      <ConfigurationsTable title={view.name} priceList={project.price_list} />

      {/* Pricing & payment — real price/possession data + static payment plans */}
      <PricingAndPayment
        title={view.name}
        slug={view.slug}
        priceText={view.priceText}
        priceSubtext={view.priceSubtext}
        minPriceInr={project.min_price_inr}
        priceData={priceData}
        priceList={project.price_list}
        possessionText={project.possession_text}
      />

      {/* Investment tools — EMI / rental yield / acquisition cost calculators */}
      <InvestmentToolsTabs
        title={view.name}
        defaultPrice={project.min_price_inr}
        state={project.state}
        propertyCategory={project.property_category}
        readyToMove={view.status === "Ready to Move"}
      />

      {/* Investment case — Investor / End-user toggle + Homz Score */}
      <InvestmentCase
        title={view.name}
        personaReasons={view.personaReasons}
        isCommercial={isCommercial}
        investmentScore={view.investmentScore}
      />

      {(investmentText || marketText) && (
        <section className="w-full max-w-7xl mx-auto px-2 my-12 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InvestmentAnalysis title={project.project_name} text={investmentText} />
          <AreaMarketInsights
            title={project.project_name}
            microMarket={project.micro_market}
            cityName={project.city_name}
            text={marketText}
          />
        </section>
      )}

      {/* Location — address, commute, landmarks, map */}
      <section id="location" className="w-full max-w-7xl mx-auto px-2 my-12 scroll-mt-24">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">Location</p>
        <h2 className="mb-6 text-[clamp(26px,3.6vw,40px)] font-bold tracking-tight text-white">
          In the middle of everything.
        </h2>
        <LocationIntelligence project={project} text={locationText} variant="dark" />
        <div className="mt-8">
          <ConnectivityScorecard title={project.project_name} items={connectivity} />
        </div>
        {hasLandmarks && (
          <div className="mt-4">
            <LandmarksTable title={project.project_name} data={landmarksForTable} />
          </div>
        )}
        {coords && (
          <div className="mt-4">
            <MapEmbed
              title={project.project_name}
              address={address}
              lat={coords.lat}
              lng={coords.lng}
              apiKey={process.env.GOOGLE_MAPS_API_KEY || ""}
            />
          </div>
        )}
      </section>

      {/* Amenities */}
      <AmenitiesShowcase title={view.name} data={view.amenities} />

      {/* Specifications */}
      <SpecificationsAccordion title={view.name} specifications={project.specifications} />

      {/* Developer */}
      <section id="developer" className="scroll-mt-24">
        <BuilderProfile
          builder={project.builder}
          text={content.builder_profile}
          slug={
            project.builder && project.builder !== "Unknown"
              ? slugify(project.builder)
              : undefined
          }
          stats={builderStats}
          badges={builderBadges}
        />
        {builderProjects.length > 0 && (
          <SimilarProjects
            title={project.project_name}
            projects={builderProjects}
            heading={`More by ${project.builder}`}
            currentProject={{ city_key: project.city_key, slug: project.slug }}
          />
        )}
      </section>

      {/* Compare — this project vs. sector average, plus similar projects */}
      <SectorCompareTeaser
        title={view.name}
        minPriceInr={project.min_price_inr}
        unitCount={view.units.length}
        amenityCount={view.amenityCount}
        averages={sectorAverages}
      />
      {combinedSimilar.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={combinedSimilar}
          heading="Similar Projects"
          currentProject={{ city_key: project.city_key, slug: project.slug }}
        />
      )}

      {/* FAQ — full list now lives on the main project page */}
      <Faq title={project.project_name} items={faqItems} />
      <ProjectJsonLd project={project} faq={faqItems} />
    </>
  );
};

export default ProjectIntelligenceSections;
