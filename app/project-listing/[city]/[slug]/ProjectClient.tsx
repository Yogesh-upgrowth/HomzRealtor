"use client";

import React, { useEffect, useState } from "react";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import ProjectSection from "@/components/ZenithProjectSection";
import Carousel from "@/components/Carousel";
import AboutProject from "@/components/Project/AboutProject";
import BuilderDescription from "@/components/Project/BuilderDescription";
import RecentUpdates from "@/components/Project/RecentUpdates";
import MasterPlan from "@/components/Project/MasterPlan";
import Amenities from "@/components/Project/Amenities";

// ✅ slugify helper
const slugify = (text: string) =>
  text?.toLowerCase().replace(/\s+/g, "-");

// ✅ filter ONLY valid image URLs
const getValidImages = (images: string[] = []): string[] => {
  return images
    .filter(
      (url) =>
        typeof url === "string" &&
        /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
    )
    .slice(0, 8); // limit for performance
};

// ✅ session cache helpers
const getCachedProject = (key: string) => {
  if (typeof window === "undefined") return null;
  const data = sessionStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const setCachedProject = (key: string, value: any) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
};

type Props = {
  city: string;
  slug: string;
};

const ProjectClient = ({ city, slug }: Props) => {
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const cacheKey = `${city}-${slug}`;

        // ✅ Check cache first
        const cached = getCachedProject(cacheKey);
        if (cached) {
          setProject(cached);
          return;
        }

        const cityKeyMap: any = {
          ggn: "ggn",
          delhi: "delhi",
          faridabad: "faridabad",
          greaternoida: "gNoida",
          noida: "noida",
        };

        const base = cityKeyMap[city];
        if (!base) return;

        const fetchData = async (type: string) => {
          const res = await fetch(
            `https://homzbackend.vercel.app/api/data?city=${base}${type}&page=1&limit=200`
          );
          const data = await res.json();
          return data?.results || [];
        };

        // ✅ fetch both APIs
        const [commercial, residential] = await Promise.all([
          fetchData("CommercialProjects"),
          fetchData("ResidentialProjects"),
        ]);

        // ✅ merge data
        const allProjects = [...commercial, ...residential];

        // ✅ match by slug
        const matched = allProjects.find(
          (p) => slugify(p?.projectTitle || "") === slug
        );

        if (matched) {
          setProject(matched);
          setCachedProject(cacheKey, matched);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      }
    }

    if (city && slug) {
      fetchProject();
    }
  }, [city, slug]);

  // ✅ loading state
  if (!project) {
    return <div className="text-center mt-20">Loading project...</div>;
  }

  // ✅ filtered + optimized images
  const validImages: string[] = getValidImages(project.images);

  return (
    <>
      {/* ✅ HERO CAROUSEL */}
      <div className="max-w-7xl mx-auto mt-36 px-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 items-stretch">
          {/* Carousel - 75% */}
          <div className="lg:col-span-3 h-full">
            <Carousel images={validImages} />
          </div>
          {/* Builder Description - 25% */}
          <div className="lg:col-span-1 h-full">
            <BuilderDescription
              title={project.projectTitle}
              description={project.builderDescription}
              />
            </div>
          </div>
        </div>

        <div className="my-20 px-2">
          <AboutProject title={project.projectTitle} description={project.aboutProject} />
        </div>

      {/* Pricing */}
      <div className="px-2">
        <ProjectSection
          title={`${project?.projectTitle || "Project"} PRICING`}
          variant="pricing"
          subtitle={project?.aboutProject?.[0] || "No description available"}
          priceList={project?.priceList || []}
          city={city}
          slug={slug}
        />
      </div>

      <div className="px-2">
        <RecentUpdates title={project.projectTitle} updates={project.recentUpdates || []} />
      </div>

      <div className="px-2">
        <MasterPlan title={project.projectTitle} image={project.masterPlan.image || ""} description={project.masterPlan.content || "No master plan description available."} />
      </div>

      <div className="max-w-7xl px-2 mx-auto my-10">
        <Amenities data={project.amenities || []} />
      </div>

      {/* Appointment */}
      <AppointmentCard
        bgImage={bgImg}
        heading="MAKE AN APPOINTMENT NOW"
        para="Lorem ipsum dolor sit amet..."
        btnTxt="Schedule Site Visit"
      />
    </>
  );
};

export default ProjectClient;
