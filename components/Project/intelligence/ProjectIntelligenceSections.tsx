// Server component — fetches all intelligence data and renders all sections.
// Uses Next.js unstable_cache + fetch caching so every expensive call
// (Google Maps, OpenAI) is made only ONCE per project then served from cache.

import { CITY_PARAM_MAP, getProjectBySlug, getSimilarProjects, getBuilderProjects, getPriceInsights } from "@/lib/intelligence/projects";
import { geocodeProject, fetchNearbyLandmarks, buildConnectivity } from "@/lib/intelligence/geo";
import { generateProjectContent, buildFallbackFaqs } from "@/lib/intelligence/content";

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

type Props = {
  cityParam: string;
  slug: string;
};

const ProjectIntelligenceSections = async ({ cityParam, slug }: Props) => {
  const cityKey = CITY_PARAM_MAP[cityParam.toLowerCase()] || cityParam;

  // 1. Fetch & normalize the project from homzbackend (cached 1h)
  const project = await getProjectBySlug(cityParam, slug);
  if (!project) return null;

  // 2. Geocode the project address (cached 30 days)
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

  // 3. Geo intelligence — only if we have coordinates
  const [landmarks, connectivity] = coords
    ? await Promise.all([
        fetchNearbyLandmarks(coords.lat, coords.lng).catch(() => ({})),
        buildConnectivity(cityKey, coords.lat, coords.lng).catch(() => []),
      ])
    : [{}, []];

  // 4. Fallback FAQs — always available from project data, no API needed
  const fallbackFaqs = buildFallbackFaqs(project);

  // 5. AI content (cached 30 days per project slug) — enhances the page when available
  const content = await generateProjectContent(project, landmarks, connectivity).catch(() => ({
    location_intelligence: "",
    investment_analysis: "",
    area_market_insights: "",
    builder_profile: "",
    faq: [],
  }));

  // 6. Related projects + price data (cached via city fetch, 1h)
  const [similarProjects, builderProjects, priceData] = await Promise.all([
    getSimilarProjects(project).catch(() => []),
    getBuilderProjects(project).catch(() => []),
    getPriceInsights(project).catch(() => null),
  ]);

  // 7. Build landmarks map for the table component
  const landmarksForTable: Record<string, { name: string; distance: string }[]> = {};
  for (const [category, list] of Object.entries(landmarks)) {
    if (!list.length) continue;
    landmarksForTable[category] = list.map((l) => ({
      name: l.name,
      distance: l.distance_text,
    }));
  }
  const hasLandmarks = Object.keys(landmarksForTable).length > 0;

  return (
    <>
      {/* Structured data injected into <head> as JSON-LD */}
      <ProjectJsonLd
        project={project}
        faq={content.faq}
        connectivity={connectivity}
        coords={coords}
      />

      {/* Location Intelligence */}
      <LocationIntelligence project={project} text={content.location_intelligence} />

      {/* Connectivity Scorecard */}
      <ConnectivityScorecard title={project.project_name} items={connectivity} />

      {/* Nearby Landmarks tabbed table */}
      {hasLandmarks && (
        <div className="px-2">
          <LandmarksTable title={project.project_name} data={landmarksForTable} />
        </div>
      )}

      {/* Price Insights comparison bars */}
      {priceData && <PriceInsights title={project.project_name} data={priceData} />}

      {/* Investment Analysis article */}
      <InvestmentAnalysis title={project.project_name} text={content.investment_analysis} />

      {/* Area Market Insights */}
      <AreaMarketInsights
        title={project.project_name}
        microMarket={project.micro_market}
        cityName={project.city_name}
        text={content.area_market_insights}
      />

      {/* Builder Profile */}
      <BuilderProfile builder={project.builder} text={content.builder_profile} />

      {/* Other Projects by Same Builder */}
      {builderProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={builderProjects}
          heading={`More Projects by ${project.builder}`}
        />
      )}

      {/* Similar Projects in Same City */}
      {similarProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={similarProjects}
          heading={`Similar Projects in ${project.city_name}`}
        />
      )}

      {/* FAQ accordion — uses AI FAQs when available, fallback from project data otherwise */}
      <Faq
        title={project.project_name}
        items={content.faq.length > 0 ? content.faq : fallbackFaqs}
      />
    </>
  );
};

export default ProjectIntelligenceSections;
