import React from "react";
import PropertyCard from "@/components/PropertyCard";
import ProjectSection from "@/components/ZenithProjectSection";
import ContentSection from "@/components/About/ContentSection";
import FeatureSection from "@/components/FeatureSection";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";

import {
  FeatureSectionData,
  projectSectionData,
} from "@/context/utils/ProjectDetails";
import aboutPageData from "@/context/utils/AboutPageData";

// ✅ slug helper
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const ProjectDetailPage = async ({ params }: PageProps) => {
  // ✅ FIX: unwrap params
  const { slug } = await params;

  try {
    // ✅ Cities list
    const cities = ["ggn", "delhi", "faridabad", "gNoida", "noida"];

    // ✅ Fetch helper
    const fetchCityData = async (cityKey: string) => {
      const url = `https://homzbackend.vercel.app/api/data?city=${cityKey}&page=1&limit=50`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      return data?.results || [];
    };

    // ✅ Fetch all (commercial + residential)
    const promises = cities.flatMap((city) => [
      fetchCityData(`${city}CommercialProjects`),
      fetchCityData(`${city}ResidentialProjects`),
    ]);

    const results = await Promise.all(promises);
    const allProjects = results.flat();

    // ✅ Find project via slug
    const project = allProjects.find(
      (item: any) => slugify(item.name) === slug
    );

    console.log("Fetched projects:", project);
    // ❌ Not found
    if (!project) {
      return (
        <div className="container mx-auto py-10 text-center">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p>Sorry, we could not find this project.</p>
        </div>
      );
    }

    return (
      <>
        {/* Property */}
        <div className="container mx-auto py-10">
          <PropertyCard data={project} />
        </div>

        {/* Zenith development */}
        <div className="bg-black text-white">
          <ProjectSection
            title={project.name}
            variant="details"
            detailsItems={projectSectionData.detailsData}
            description={project.description}
          />
        </div>

        {/* Overview */}
        <div className="mb-2">
          <ContentSection
            layout="imageLayout"
            isButton={true}
            image={project.image}
            cardData={project.description}
          />
        </div>

        {/* Location */}
        <FeatureSection
          title="WHERE WE'RE LOCATED"
          subtitle="Project location and connectivity details."
          variant="map"
          mapData={FeatureSectionData.locationData}
        />

        {/* Amenities */}
        <FeatureSection
          title="AMENITIES"
          subtitle="Project amenities and features."
          variant="gallery"
          galleryImages={FeatureSectionData.amenitiesData}
        />

        {/* Appointment */}
        <AppointmentCard
          bgImage={bgImg}
          heading="MAKE AN APPOINTMENT NOW"
          para="Schedule a visit to explore this property."
          btnTxt="Schedule Site Visit"
        />
      </>
    );
  } catch (error) {
    return (
      <div className="text-center py-10">
        Error loading project details
      </div>
    );
  }
};

export default ProjectDetailPage;