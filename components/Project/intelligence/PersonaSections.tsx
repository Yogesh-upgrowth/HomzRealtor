// Shared, self-fetching server component that renders the Investor / Home-Buyer
// persona tabs. Used by both the project detail page (via ProjectIntelligenceSections)
// and the /flat child page. All data fetches are unstable_cache'd, so rendering it
// on a second page that already fetched the same project is a cache hit.

import { CITY_PARAM_MAP, getProjectBySlug, getPriceInsights } from "@/lib/intelligence/projects";
import { geocodeProject, fetchNearbyLandmarks, buildConnectivity } from "@/lib/intelligence/geo";
import { generateProjectContent } from "@/lib/intelligence/content";
import { resolveProjectView } from "@/lib/intelligence/view-model";
import { buildLocationSummary, buildMarketSummary, buildInvestmentSummary } from "@/lib/intelligence/summaries";

import InvestmentScore from "@/components/Project/listing/InvestmentScore";
import AmenitiesShowcase from "@/components/Project/listing/AmenitiesShowcase";
import UnitsAndFloorPlans from "@/components/Project/listing/UnitsAndFloorPlans";

import LocationIntelligence from "./LocationIntelligence";
import ConnectivityScorecard from "./ConnectivityScorecard";
import InvestmentAnalysis from "./InvestmentAnalysis";
import AreaMarketInsights from "./AreaMarketInsights";
import LandmarksTable from "@/components/Project/LandmarkTable";
import PriceInsights from "./PriceInsights";
import MapEmbed from "./MapEmbed";
import EmiCalculator from "./EmiCalculator";
import InvestmentCalculators from "./InvestmentCalculators";
import AcquisitionCostCalculator from "./AcquisitionCostCalculator";
import PricingDetail from "./PricingDetail";
import PersonaTabs from "./PersonaTabs";

type Props = {
  cityParam: string;
  slug: string;
};

const PersonaSections = async ({ cityParam, slug }: Props) => {
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

  const priceData = await getPriceInsights(project).catch(() => null);

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

  const buyerHeading =
    view.propertyCategory === "Commercial" ? "For End Users / Occupiers" : "For Home Buyers";
  const hasPriceStrip = view.hasPrice || !!view.status || !!view.possession;

  // Narrative sections: use AI text when available, else deterministic data-driven
  // content so Location / Market / Investment are never empty.
  const locationText =
    content.location_intelligence || buildLocationSummary(project, connectivity, landmarks);
  const marketText =
    content.area_market_insights || buildMarketSummary(project, priceData);
  const investmentText =
    content.investment_analysis || buildInvestmentSummary(view, project, connectivity, priceData);

  return (
    <PersonaTabs
      projectName={view.name}
      buyerLabel={buyerHeading}
      investor={
        <>
          {/* Price & timeline strip */}
          {hasPriceStrip && (
            <section className="w-full max-w-7xl mx-auto px-2 my-6">
              <div className="flex flex-wrap gap-2">
                {view.hasPrice && (
                  <span className="rounded-full border border-[#B77D2B] bg-white px-4 py-1.5 text-sm font-medium text-[#B77D2B]">
                    {view.priceText}
                  </span>
                )}
                {view.priceSubtext && (
                  <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
                    {view.priceSubtext}
                  </span>
                )}
                {view.status && (
                  <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
                    Status: {view.status}
                  </span>
                )}
                {view.possession && (
                  <span className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700">
                    Possession: {view.possession}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Detailed pricing: real config table + projected price journey */}
          <PricingDetail
            title={view.name}
            priceList={project.price_list}
            defaultPrice={project.min_price_inr}
            possessionText={project.possession_text}
          />

          {/* Market position */}
          {priceData && (
            <PriceInsights title={project.project_name} data={priceData} priceList={project.price_list} />
          )}

          {/* Investment Score — visual gauge */}
          <InvestmentScore title={view.name} data={view.investmentScore} />

          {/* Rental yield calculator */}
          <InvestmentCalculators title={view.name} defaultPrice={project.min_price_inr} />

          {/* Total acquisition cost breakdown */}
          <AcquisitionCostCalculator
            title={view.name}
            defaultPrice={project.min_price_inr}
            state={project.state}
            propertyCategory={project.property_category}
            readyToMove={view.status === "Ready to Move"}
          />

          {/* Investment analysis article */}
          <InvestmentAnalysis title={project.project_name} text={investmentText} />

          {/* Locality / area market insights */}
          <AreaMarketInsights
            title={project.project_name}
            microMarket={project.micro_market}
            cityName={project.city_name}
            text={marketText}
          />

          {/* Amenities (also relevant to investors as selling points) */}
          <AmenitiesShowcase title={view.name} data={view.amenities} />
        </>
      }
      buyer={
        <>
          {/* EMI / affordability calculator */}
          <EmiCalculator title={view.name} defaultPrice={project.min_price_inr} />

          {/* Connectivity scorecard */}
          <ConnectivityScorecard title={project.project_name} items={connectivity} />

          {/* Nearby landmarks (schools, hospitals, malls, supermarkets, metro) */}
          {hasLandmarks && (
            <div className="px-2">
              <LandmarksTable title={project.project_name} data={landmarksForTable} />
            </div>
          )}

          {/* Location Intelligence — AI narrative (deterministic fallback) */}
          <LocationIntelligence project={project} text={locationText} />

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

          {/* Available units / floor plans (with fallback) */}
          <UnitsAndFloorPlans
            title={view.name}
            citySlug={view.citySlug}
            slug={view.slug}
            units={view.units}
            propertyType={view.propertyType}
          />

          {/* Amenities (also relevant to buyers) */}
          <AmenitiesShowcase title={view.name} data={view.amenities} />
        </>
      }
    />
  );
};

export default PersonaSections;
