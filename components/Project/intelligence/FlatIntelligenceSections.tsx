// Self-fetching server component for the /flat child page. Renders the full
// buyer-facing deep dive for a project's flats, in this fixed order:
// Flat Overview → Configurations → Amenities → Location Advantages →
// Price Trends → Rental Insights → Why Buy These Flats → SEO Content → FAQs →
// Similar Flats. Every section only renders when the underlying project data
// actually supports it — nothing here is fabricated. This content is
// deliberately exclusive to /flat (not repeated on the project page) so the
// two pages never show identical content for the same project.

import { CITY_PARAM_MAP, getProjectBySlug, getPriceInsights, getSimilarProjects, getBuilderProjects, getSectorProjects } from "@/lib/intelligence/projects";
import { geocodeProject, fetchNearbyLandmarks, buildConnectivity } from "@/lib/intelligence/geo";
import { generateProjectContent, buildFallbackFaqs } from "@/lib/intelligence/content";
import { resolveProjectView } from "@/lib/intelligence/view-model";
import { buildLocationSummary } from "@/lib/intelligence/summaries";

import FlatOverview from "@/components/Project/listing/FlatOverview";
import AmenitiesShowcase from "@/components/Project/listing/AmenitiesShowcase";
import WhyThisProject from "@/components/Project/listing/WhyThisProject";
import AiSummary from "@/components/Project/listing/AiSummary";
import KeyHighlights from "@/components/Project/listing/KeyHighlights";
import InternalLinking from "@/components/Project/listing/InternalLinking";

import ConfigurationsTable from "./ConfigurationsTable";
import PriceTrendChart from "./PriceTrendChart";
import PriceInsights from "./PriceInsights";
import InvestmentCalculators from "./InvestmentCalculators";
import ConnectivityScorecard from "./ConnectivityScorecard";
import LandmarksTable from "@/components/Project/LandmarkTable";
import LocationIntelligence from "./LocationIntelligence";
import MapEmbed from "./MapEmbed";
import Faq from "./Faq";
import ProjectJsonLd from "./ProjectJsonLd";
import SimilarProjects from "./SimilarProjects";

type Props = {
  cityParam: string;
  slug: string;
};

const FlatIntelligenceSections = async ({ cityParam, slug }: Props) => {
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

  const priceData = await getPriceInsights(project).catch(() => null);

  const [similarProjects, builderProjects, sectorProjects] = await Promise.all([
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

  const landmarksForTable: Record<string, { name: string; distance: string }[]> = {};
  for (const [category, list] of Object.entries(landmarks)) {
    if (!list.length) continue;
    landmarksForTable[category] = list.map((l) => ({ name: l.name, distance: l.distance_text }));
  }
  const hasLandmarks = Object.keys(landmarksForTable).length > 0;

  const locationText =
    content.location_intelligence || buildLocationSummary(project, connectivity, landmarks);

  return (
    <>
      <ProjectJsonLd project={project} faq={faqItems} connectivity={connectivity} coords={coords} />

      {/* Flat Overview */}
      <FlatOverview
        title={view.name}
        propertyType={view.propertyType}
        minSize={project.min_size}
        maxSize={project.max_size}
        sizeUnit={project.size_unit}
      />

      {/* Configurations */}
      <ConfigurationsTable title={view.name} priceList={project.price_list} />

      {/* Amenities */}
      <AmenitiesShowcase title={view.name} data={view.amenities} />

      {/* Location Advantages */}
      <ConnectivityScorecard title={project.project_name} items={connectivity} />
      {hasLandmarks && (
        <div className="px-2">
          <LandmarksTable title={project.project_name} data={landmarksForTable} />
        </div>
      )}
      <LocationIntelligence project={project} text={locationText} />
      {coords && (
        <MapEmbed
          title={project.project_name}
          address={address}
          lat={coords.lat}
          lng={coords.lng}
          apiKey={process.env.GOOGLE_MAPS_API_KEY || ""}
        />
      )}

      {/* Price Trends */}
      <PriceTrendChart
        title={view.name}
        priceList={project.price_list}
        defaultPrice={project.min_price_inr}
        possessionText={project.possession_text}
      />
      {priceData && (
        <PriceInsights title={project.project_name} data={priceData} priceList={project.price_list} />
      )}

      {/* Rental Insights */}
      <InvestmentCalculators title={view.name} defaultPrice={project.min_price_inr} />

      {/* Why Buy These Flats? */}
      <WhyThisProject title={view.name} badges={view.whyThisProject} heading={`Why Buy Flats in ${view.name}?`} />

      {/* SEO Content */}
      <AiSummary title={view.name} aiText={content.location_intelligence} about={view.about} />
      <KeyHighlights title={view.name} highlights={view.keyHighlights} />

      {/* FAQs */}
      <Faq title={project.project_name} items={faqItems} />

      {/* Similar Flats */}
      {sectorProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={sectorProjects}
          heading={`Similar Flats in ${project.sector}`}
          currentProject={{ city_key: project.city_key, slug: project.slug }}
          linkTo="flat"
        />
      )}
      {builderProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={builderProjects}
          heading={`More Flats by ${project.builder}`}
          currentProject={{ city_key: project.city_key, slug: project.slug }}
          linkTo="flat"
        />
      )}
      {similarProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={similarProjects}
          heading={`Similar Flats in ${project.city_name}`}
          currentProject={{ city_key: project.city_key, slug: project.slug }}
          linkTo="flat"
        />
      )}

      <InternalLinking similarSearches={view.similarSearches} internalLinks={view.internalLinks} />
    </>
  );
};

export default FlatIntelligenceSections;
