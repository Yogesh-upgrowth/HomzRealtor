import type { Metadata } from "next";
import ProjectClient from "./ProjectClient";

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const title = `${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | HomzRealtor`;
  return {
    title,
    alternates: {
      canonical: `https://www.homzrealtor.com/project-listing/${city}/${slug}`,
    },
  };
}

const ProjectPage = async ({ params }: PageParams) => {
  const { city, slug } = await params;
  return <ProjectClient city={city} slug={slug} />;
};

export default ProjectPage;
