import { getProjectIntelligence } from "@/lib/projects/queries";
import LocationIntelligence from "./LocationIntelligence";
import ConnectivityScorecard from "./ConnectivityScorecard";
import InvestmentAnalysis from "./InvestmentAnalysis";
import Faq from "./Faq";
import ProjectJsonLd from "./ProjectJsonLd";
import LandmarksTable from "@/components/Project/LandmarkTable";

type Props = {
  cityKey: string;
  slug: string;
};

const ProjectIntelligenceSections = async ({ cityKey, slug }: Props) => {
  const data = await getProjectIntelligence(cityKey, slug);
  if (!data) return null;

  const { project, landmarks, connectivity, content } = data;

  const landmarksForTable: Record<
    string,
    { name: string; distance: string }[]
  > = {};
  for (const [category, list] of Object.entries(landmarks)) {
    if (!list.length) continue;
    landmarksForTable[category] = list.map((l) => ({
      name: l.name,
      distance:
        l.distance_text ??
        (l.distance_km != null ? `${Number(l.distance_km).toFixed(2)} KM` : ""),
    }));
  }

  const hasLandmarks = Object.keys(landmarksForTable).length > 0;

  return (
    <>
      <ProjectJsonLd
        project={project}
        faq={content.faq}
        connectivity={connectivity}
      />

      <LocationIntelligence
        project={project}
        text={content.location_intelligence}
      />

      <ConnectivityScorecard
        title={project.project_name}
        items={connectivity}
      />

      {hasLandmarks && (
        <div className="px-2">
          <LandmarksTable
            title={project.project_name}
            data={landmarksForTable}
          />
        </div>
      )}

      <InvestmentAnalysis
        title={project.project_name}
        text={content.investment_analysis}
      />

      <Faq title={project.project_name} items={content.faq} />
    </>
  );
};

export default ProjectIntelligenceSections;
