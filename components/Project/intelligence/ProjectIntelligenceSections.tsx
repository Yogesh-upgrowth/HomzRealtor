// Server component — fetches shared intelligence data and renders the overview
// (top), the Investor / Home-Buyer persona tabs (via PersonaSections), and the
// discovery tail. Every section self-hides when it has nothing real to show.

import { CITY_PARAM_MAP, getProjectBySlug, getSimilarProjects, getBuilderProjects, getSectorProjects } from "@/lib/intelligence/projects";
import { slugify } from "@/lib/intelligence/normalize";
import { geocodeProject, fetchNearbyLandmarks, buildConnectivity } from "@/lib/intelligence/geo";
import { generateProjectContent, buildFallbackFaqs } from "@/lib/intelligence/content";
import { resolveProjectView } from "@/lib/intelligence/view-model";

import WhyThisProject from "@/components/Project/listing/WhyThisProject";
import AiSummary from "@/components/Project/listing/AiSummary";
import KeyHighlights from "@/components/Project/listing/KeyHighlights";
import InternalLinking from "@/components/Project/listing/InternalLinking";

import BuilderProfile from "./BuilderProfile";
import Faq from "./Faq";
import ProjectJsonLd from "./ProjectJsonLd";
import SimilarProjects from "./SimilarProjects";
import PersonaSections from "./PersonaSections";

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

  return (
    <>
      <ProjectJsonLd project={project} faq={faqItems} connectivity={connectivity} coords={coords} />

      {/* Why This Project — auto badges */}
      <WhyThisProject title={view.name} badges={view.whyThisProject} />

      {/* Overview — project's own narrative */}
      <AiSummary title={view.name} about={view.about} />

      {/* Key Highlights — derived bullets */}
      <KeyHighlights title={view.name} highlights={view.keyHighlights} />

      {/* Persona tabs (Investor / Home Buyer) — shared with the /flat page */}
      <PersonaSections cityParam={cityParam} slug={slug} />

      {/* ══════════════════════ ABOUT & DISCOVERY ══════════════════════ */}
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

      {/* Compare projects in the same sector */}
      {sectorProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={sectorProjects}
          heading={`Compare Other Projects in ${project.sector}`}
          currentProject={{ city_key: project.city_key, slug: project.slug }}
        />
      )}

      {/* More by same builder */}
      {builderProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={builderProjects}
          heading={`${project.builder}'s Other Projects`}
          currentProject={{ city_key: project.city_key, slug: project.slug }}
        />
      )}

      {/* Similar in city */}
      {similarProjects.length > 0 && (
        <SimilarProjects
          title={project.project_name}
          projects={similarProjects}
          heading={`Similar Projects in ${project.city_name}`}
          currentProject={{ city_key: project.city_key, slug: project.slug }}
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
