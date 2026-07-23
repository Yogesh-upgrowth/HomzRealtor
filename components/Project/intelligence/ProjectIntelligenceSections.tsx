// Server component — the project detail page's full section flow, modeled on
// a reference mobile template. The Investor/Home-Buyer breakdown is the
// original full-detail PersonaSections (price insights, calculators, location
// intelligence, connectivity, configurations, amenities) restored per user
// request — everything else (Compare, Specifications, FAQ teaser, Similar
// Projects) still avoids duplicating what /flat already shows in full. Every
// section self-hides when it has nothing real to show.

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

import OverviewSection from "./OverviewSection";
import GalleryTabs from "./GalleryTabs";
import PersonaSections from "./PersonaSections";
import SpecificationsAccordion from "./SpecificationsAccordion";
import BuilderProfile from "./BuilderProfile";
import SectorCompareTeaser from "./SectorCompareTeaser";
import SimilarProjects from "./SimilarProjects";
import FaqTeaser from "./FaqTeaser";

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

  // Combined, deduped "Similar Projects" preview — one compact set instead of
  // the three separate full sections /flat shows.
  const combinedSimilar = [...sectorProjects, ...builderProjects, ...similarProjects]
    .filter((p, i, arr) => arr.findIndex((x) => x.city_key === p.city_key && x.slug === p.slug) === i)
    .slice(0, 3);

  // Overview chapters — real content only, deterministic fallback when AI text
  // is unavailable (same fallback helpers used elsewhere in the codebase).
  const locationText = content.location_intelligence || buildLocationSummary(project, connectivity, landmarks);
  const marketText = content.area_market_insights || buildMarketSummary(project, priceData);
  const investmentText = content.investment_analysis || buildInvestmentSummary(view, project, connectivity, priceData);

  const chapters: Chapter[] = [
    view.about.length > 0 && { kicker: "OVERVIEW", title: `About ${view.name}`, body: view.about.join("\n\n") },
    locationText && { kicker: "LOCATION", title: "Location Intelligence", body: locationText },
    investmentText && { kicker: "INVESTMENT", title: "Investment Analysis", body: investmentText },
    marketText && { kicker: "MARKET", title: "Area & Market Insights", body: marketText },
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

  return (
    <>
      {/* Why this property — three reasons it stands out */}
      <HighlightStats title={view.name} stats={view.highlightStats} />

      {/* Overview + full-overview reading sheet */}
      <OverviewSection title={view.name} about={view.about} chapters={chapters} />

      {/* Gallery & plans */}
      <GalleryTabs
        title={view.name}
        exterior={view.images}
        interior={project.interior_images || []}
        masterPlan={view.masterPlan}
      />

      {/* Investor / Home-Buyer persona tabs — full detail, as before */}
      <PersonaSections cityParam={cityParam} slug={slug} />

      {/* Specifications */}
      <SpecificationsAccordion title={view.name} specifications={project.specifications} />

      {/* Developer */}
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
          heading={`Similar Projects`}
          currentProject={{ city_key: project.city_key, slug: project.slug }}
        />
      )}

      {/* FAQ — teaser, full list lives on /flat */}
      <FaqTeaser title={project.project_name} items={faqItems} citySlug={view.citySlug} slug={view.slug} />
    </>
  );
};

export default ProjectIntelligenceSections;
