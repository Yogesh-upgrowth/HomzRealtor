"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NormalizedProject } from "@/lib/intelligence/normalize";
import { formatInr } from "@/lib/intelligence/normalize";
import { clean, validImages } from "@/lib/intelligence/view-model";
import { canonicalCitySlug } from "@/lib/intelligence/projects";
import SaveToggleButton from "@/components/Common/SaveToggleButton";

type CurrentProject = { city_key: string; slug: string };

type Props = {
  title: string;
  projects: NormalizedProject[];
  heading?: string;
  currentProject?: CurrentProject;
  linkTo?: "project" | "flat";
  /** Renders a "View all →" link next to the heading — for callers passing a
   *  capped preview of a much larger set (see app/project-listing/[city]/page.tsx,
   *  which used to pass every project in the city here uncapped: ~1,000 cards
   *  on one page for Gurgaon, a multi-hundred-thousand-pixel-tall render). */
  viewAllHref?: string;
  viewAllLabel?: string;
};

function ProjectCard({
  project,
  currentProject,
  linkTo = "project",
}: {
  project: NormalizedProject;
  currentProject?: CurrentProject;
  linkTo?: "project" | "flat";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const img = validImages(project.images)[0];
  const price = project.min_price_inr
    ? formatInr(project.min_price_inr)
    : clean(project.price_text) || "Price on Request";
  const builder = clean(project.builder);
  const possession = clean(project.possession_text);
  const category = clean(project.property_category);

  const compareHref =
    currentProject && currentProject.city_key === project.city_key
      ? `/project-listing/compare/${canonicalCitySlug(project.city_key)}/${[
          currentProject.slug,
          project.slug,
        ]
          .sort()
          .join("/")}`
      : null;

  return (
    <div className="group bg-black border border-gray-700 rounded-xl overflow-hidden hover:border-[#CEA44E] transition-colors">
      <Link
        href={`/project-listing/${canonicalCitySlug(project.city_key)}/${project.slug}${linkTo === "flat" ? "/flat" : ""}`}
        className="block"
      >
        {/* Image */}
        <div className="relative h-44 w-full bg-gray-800">
          {img && !imgFailed ? (
            <Image
              src={img}
              alt={project.project_name}
              fill
              onError={() => setImgFailed(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
              No Image
            </div>
          )}
          {/* Category badge */}
          {category && (
            <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-[#CEA44E] border border-[#CEA44E]/40">
              {category}
            </span>
          )}
          <div className="absolute top-2 right-2 z-10">
            <SaveToggleButton
              item={{
                itemType: "project",
                citySegment: project.city_key,
                slug: project.slug,
                title: project.project_name,
                imageUrl: img || null,
                priceText: price,
                locationText: [clean(project.sector), clean(project.city_name)].filter(Boolean).join(", ") || null,
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-1">
            {project.project_name}
          </h3>
          <p className="text-gray-400 text-xs mb-2">
            {[clean(project.sector), clean(project.city_name)].filter(Boolean).join(", ")}
          </p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-[#CEA44E] font-bold text-sm">{price}</span>
            {builder && (
              <span className="text-gray-500 text-[10px]">{builder}</span>
            )}
          </div>

          {possession && (
            <p className="text-gray-500 text-[11px] mt-1">
              Possession: {possession}
            </p>
          )}
        </div>
      </Link>

      {compareHref && (
        <Link
          href={compareHref}
          className="block text-center text-xs font-semibold text-[#CEA44E] border-t border-gray-700 py-2 hover:bg-[#CEA44E]/10 transition-colors"
        >
          Compare with current project
        </Link>
      )}
    </div>
  );
}

const SimilarProjects = ({ title, projects, heading, currentProject, linkTo = "project", viewAllHref, viewAllLabel }: Props) => {
  if (!projects || projects.length === 0) return null;

  const seen = new Set<string>();
  const unique = projects.filter((p) => {
    const key = `${p.city_key}-${p.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent">
          {heading ?? `Similar Projects – ${title}`}
        </h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-medium text-[#CEA44E] hover:underline whitespace-nowrap">
            {viewAllLabel ?? "View all →"}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {unique.map((p) => (
          <ProjectCard key={`${p.city_key}-${p.slug}`} project={p} currentProject={currentProject} linkTo={linkTo} />
        ))}
      </div>
    </section>
  );
};

export default SimilarProjects;
