// Server component — fetches all intelligence data ONCE (cached) and renders the
// full stack of listing sections in spec order, driven by the Missing Data Engine
// (resolveProjectView). Every section self-hides when it has nothing real to show.

import { CITY_PARAM_MAP, getProjectBySlug, getSimilarProjects, getBuilderProjects, getPriceInsights } from "@/lib/intelligence/projects";
import { slugify } from "@/lib/intelligence/normalize";
import { geocodeProject, fetchNearbyLandmarks, buildConnectivity } from "@/lib/intelligence/geo";
import { generateProjectContent, buildFallbackFaqs } from "@/lib/intelligence/content";
import { resolveProjectView } from "@/lib/intelligence/view-model";

import WhyThisProject from "@/components/Project/listing/WhyThisProject";
import AiSummary from "@/components/Project/listing/AiSummary";
import KeyHighlights from "@/components/Project/listing/KeyHighlights";
import InvestmentScore from "@/components/Project/listing/InvestmentScore";
import AmenitiesShowcase from "@/components/Project/listing/AmenitiesShowcase";
import UnitsAndFloorPlans from "@/components/Project/listing/UnitsAndFloorPlans";
import InternalLinking from "@/components/Project/listing/InternalLinking";

import LocationIntelligence from "./LocationIntelligence";
import ConnectivityScorecard from "./ConnectivityScorecard";
import InvestmentAnalysis from "./InvestmentAnalysis";
import AreaMarketInsights from "./AreaMarketInsights";
import BuilderProfile from "./BuilderProfile";
import Faq from "./Faq";
import ProjectJsonLd from "./ProjectJsonLd";
import LandmarksTable from "@/components/Project/LandmarkTable";
import SimilarProjects from "./SimilarProjects";
import PriceInsights from "./PriceInsights";
import MapEmbed from "./MapEmbed";

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

  const fallbackFaqs = buildFallbackFaqs(project);

  const content = await generateProjectContent(project, landmarks, connectivity).catch(() => ({
    location_intelligence: "",
    investment_analysis: "",
    area_market_insights: "",
    builder_profile: "",
    faq: [],
  }));

  // Single source of truth for FAQs so the visible <Faq> and the FAQPage schema
  // in <ProjectJsonLd> always match — schema must reflect on-page content.
  const faqItems = content.faq.length > 0 ? content.faq : fallbackFaqs;

  const [similarProjects, builderProjects, priceData] = await Promise.all([
    getSimilarProjects(project).catch(() => []),
    getBuilderProjects(project).catch(() => []),
    getPriceInsights(project).catch(() => null),
  ]);

  // Build the safe view model from everything we resolved.
  const view = resolveProjectView(project, {
    connectivity,
    landmarks,
    aiSummary: content.location_intelligence,
    cityParam,
  });

  // Landmarks map for the tabbed table.
  const landmarksForTable: Record<string, { name: string; distance: string }[]> = {};
  for (const [category, list] of Object.entries(landmarks)) {
    if (!list.length) continue;
    landmarksForTable[category] = list.map((l) => ({ name: l.name, distance: l.distance_text }));
  }
  const hasLandmarks = Object.keys(landmarksForTable).length > 0;

  return (
    <>
      <ProjectJsonLd project={project} faq={faqItems} connectivity={connectivity} coords={coords} />

      {/* Why This Project — auto badges */}
      <WhyThisProject title={view.name} badges={view.whyThisProject} />

      {/* Overview — project's own narrative */}
      <AiSummary title={view.name} about={view.about} />

      {/* Key Highlights — derived bullets */}
      <KeyHighlights title={view.name} highlights={view.keyHighlights} />

      {/* Investment Score — visual gauge */}
      <InvestmentScore title={view.name} data={view.investmentScore} />

      {/* Location Intelligence — AI narrative */}
      <LocationIntelligence project={project} text={content.location_intelligence} />

      {/* Interactive map */}
      {coords && (
        <MapEmbed
          title={project.project_name}
          address={address}
          lat={coords.lat}
          lng={coords.lng}
          apiKey={process.env.GOOGLE_MAPS_API_KEY || ""}
        />
      )}

      {/* Nearby landmarks */}
      {hasLandmarks && (
        <div className="px-2">
          <LandmarksTable title={project.project_name} data={landmarksForTable} />
        </div>
      )}

      {/* Connectivity scorecard */}
      <ConnectivityScorecard title={project.project_name} items={connectivity} />

      {/* Amenities */}
      <AmenitiesShowcase title={view.name} data={view.amenities} />

      {/* Available units / floor plans (with fallback) */}
      <UnitsAndFloorPlans
        title={view.name}
        citySlug={view.citySlug}
        slug={view.slug}
        units={view.units}
        propertyType={view.propertyType}
      />

      {/* Price insights */}
      {priceData && (
        <PriceInsights title={project.project_name} data={priceData} priceList={project.price_list} />
      )}

      {/* Investment analysis article */}
      <InvestmentAnalysis title={project.project_name} text={content.investment_analysis} />

      {/* Locality / area market insights */}
      <AreaMarketInsights
        title={project.project_name}
        microMarket={project.micro_market}
        cityName={project.city_name}
        text={content.area_market_insights}
      />

      {/* Builder profile */}
      <BuilderProfile
        builder={project.builder}
        text={content.builder_profile}
        slug={
          project.builder && project.builder !== "Unknown"
            ? slugify(project.builder)
            : undefined
        }
      />

      {/* More by same builder */}
      {builderProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={builderProjects}
          heading={`More Projects by ${project.builder}`}
        />
      )}

      {/* Similar in city */}
      {similarProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={similarProjects}
          heading={`Similar Projects in ${project.city_name}`}
        />
      )}

      {/* Internal linking + popular searches */}
      <InternalLinking similarSearches={view.similarSearches} internalLinks={view.internalLinks} />

      {/* FAQ */}
      <Faq title={project.project_name} items={faqItems} />
    </>
  );
};

export default ProjectIntelligenceSections;
