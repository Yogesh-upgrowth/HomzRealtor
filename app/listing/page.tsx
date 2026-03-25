import ContentSection from "@/components/About/ContentSection";
import Hero from "@/components/Hero";
import React from "react";
import aboutPageData from "@/context/utils/AboutPageData";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import ProjectSection from "@/components/ZenithProjectSection";
import { projectSectionData } from "@/context/utils/ProjectDetails";
import FeatureSection from "@/components/FeatureSection";
import { FeatureSectionData } from "@/context/utils/ProjectDetails";

const Listing = () => {
  return (
    <>
      {/* hero section */}
      <Hero variant="image-centric" />

      {/* Zenith development -closer look*/}
      {/* m-web completed */}
      <div className="bg-black text-white">
        <ProjectSection
          title="ZENITH DEVELOPMENTS - A CLOSER LOOK"
          variant="details"
          detailsItems={projectSectionData.detailsData}
          // description={projectSectionData.descriptionText}
        />
      </div>

      {/* overView */}
      {/* m-web completed */}
      <div className="mb-2">
        <ContentSection
          layout="imageLayout"
          isButton={true}
          cardData={aboutPageData.overView}
        />
      </div>

      {/* we're located */}
      {/* m-web completed */}
      <FeatureSection
        title="WHERE WE'RE LOCATED"
        subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique."
        variant="map"
        mapData={FeatureSectionData.locationData}
      />

      {/* RENDER THE "PRICING" VARIANT */}
      {/* m-web completed */}
      <div>
        <ProjectSection
          title="ZENITH DEVELOPMENTS - PRICE LIST"
          variant="pricing"
          subtitle={projectSectionData.priceSubtitle}
          priceList={projectSectionData.priceData}
        />
      </div>

      {/* Amenities */}
      {/* m-web completed */}
      <FeatureSection
        title="AMENITIES"
        subtitle="Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
        variant="gallery"
        galleryImages={FeatureSectionData.amenitiesData}
      />

      {/* Why Zenith development  */}
      {/* m-web completed */}
      <ContentSection
        cardData={aboutPageData.whyZenith}
        layout="reversed"
        theme="dark"
        // txtBold={true}
        isButton={true}
      />

      {/* Make appointment  */}
      {/* m-web completed */}
      <AppointmentCard
        bgImage={bgImg}
        heading="MAKE AN APPOINTMENT NOW"
        para="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique."
        btnTxt="Schedule Site Visit"
      />
    </>
  );
};

export default Listing;
