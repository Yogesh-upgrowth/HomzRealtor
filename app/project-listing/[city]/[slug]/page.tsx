import { cache } from "react";
import type { Metadata } from "next";
import ProjectClient from "./ProjectClient";
import ProjectIntelligenceSections from "@/components/Project/intelligence/ProjectIntelligenceSections";
import { getProjectIntelligence } from "@/lib/projects/queries";

// URL city segment -> stored city_key
const normalizeCityKey = (city: string): string => {
  const map: Record<string, string> = {
    ggn: "ggn",
    gurgaon: "ggn",
    delhi: "delhi",
    faridabad: "faridabad",
    greaternoida: "gNoida",
    gnoida: "gNoida",
    noida: "noida",
  };
  return map[(city || "").toLowerCase()] ?? city;
};

const loadIntelligence = cache((cityKey: string, slug: string) =>
  getProjectIntelligence(cityKey, slug),
);

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const cityKey = normalizeCityKey(city);
  const data = await loadIntelligence(cityKey, slug);
  if (!data) return {};

  const { project } = data;
  const locationBits = [project.sector, project.city_name]
    .filter(Boolean)
    .join(", ");
  const title = `${project.project_name}${
    locationBits ? ` - ${locationBits}` : ""
  } | HomzRealtor`;
  const description =
    project.about?.[0] ||
    `Explore ${project.project_name}${
      project.builder ? ` by ${project.builder}` : ""
    }${locationBits ? ` in ${locationBits}` : ""} — pricing, connectivity, nearby landmarks and investment insights.`;

  return {
    title,
    description: description.slice(0, 300),
    alternates: {
      canonical: `https://www.homzrealtor.com/project-listing/${project.city_key}/${project.slug}`,
    },
    openGraph: {
      title,
      description: description.slice(0, 300),
      images: project.images?.slice(0, 1),
    },
  };
}

const ProjectPage = async ({ params }: PageParams) => {
  const { city, slug } = await params;
  const cityKey = normalizeCityKey(city);

  return (
    <>
      <ProjectClient city={city} slug={slug} />
      <ProjectIntelligenceSections cityKey={cityKey} slug={slug} />
    </>
  );
};

export default ProjectPage;
