import React from "react";
import PropertyCard from "@/components/PropertyCard";
import { ProjectDetailData } from "@/context/utils/ProjectDetails";
import { PropertyDetails } from "@/models/types";
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

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = async({ params }) => {
  const { slug } = await params;

  const propertyData = ProjectDetailData[
    slug as keyof typeof ProjectDetailData
  ] as PropertyDetails | undefined;

  // fallback if no data is found
  if (!propertyData) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1>Project Not Found</h1>
        <p>Sorry, we could not find the details for this project.</p>
      </div>
    );
  }


  return (
    <>
      <div className="container mx-auto py-10">
        <PropertyCard data={propertyData} />
      </div>

      {/* Zenith development */}
      <div className="bg-black text-white">
        <ProjectSection
          title="ZENITH DEVELOPMENTS - A CLOSER LOOK"
          variant="details"
          detailsItems={projectSectionData.detailsData}
          description={projectSectionData.descriptionText}
        />
      </div>

      {/* Overview */}
      <div className="mb-2">
        <ContentSection
          layout="imageLayout"
          isButton={true}
          cardData={aboutPageData.overView}
        />
      </div>

      {/* we're located */}
      <FeatureSection
        title="WHERE WE'RE LOCATED"
        subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique."
        variant="map"
        mapData={FeatureSectionData.locationData}
      />

      {/* Amenities */}
      <FeatureSection
        title="AMENITIES"
        subtitle="Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
        variant="gallery"
        galleryImages={FeatureSectionData.amenitiesData}
      />

      {/* why zenith development */}
      <ContentSection
        cardData={aboutPageData.whyZenith}
        layout="reversed"
        theme="dark"
        // txtBold={true}
        isButton={true}
      />

      {/* Make appointment */}
      <AppointmentCard
        bgImage={bgImg}
        heading="MAKE AN APPOINTMENT NOW"
        para="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique."
        btnTxt="Schedule Site Visit"
      />
    </>
  );
};

export default ProjectDetailPage;
