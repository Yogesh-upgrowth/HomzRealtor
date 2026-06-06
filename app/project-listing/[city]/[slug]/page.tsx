import type { Metadata } from "next";
import { Suspense } from "react";
import ProjectClient from "./ProjectClient";
import ProjectIntelligenceSections from "@/components/Project/intelligence/ProjectIntelligenceSections";
import { getProjectBySlug } from "@/lib/intelligence/projects";

type PageParams = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const project = await getProjectBySlug(city, slug).catch(() => null);

  const title = project
    ? `${project.project_name} | HomzRealtor`
    : `${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | HomzRealtor`;

  const description = project?.about?.[0]
    ? project.about[0].slice(0, 155)
    : `Explore ${project?.project_name || slug} — pricing, location, amenities and investment insights on HomzRealtor.`;

  const image = project?.images?.find(
    (u) => typeof u === "string" && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)
  );

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.homzrealtor.com/project-listing/${city}/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.homzrealtor.com/project-listing/${city}/${slug}`,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

const ProjectPage = async ({ params }: PageParams) => {
  const { city, slug } = await params;
  return (
    <>
      <ProjectClient city={city} slug={slug} />
      {/* Intelligence sections stream in after the main content */}
      <Suspense fallback={null}>
        <ProjectIntelligenceSections cityParam={city} slug={slug} />
      </Suspense>
    </>
  );
};

export default ProjectPage;
