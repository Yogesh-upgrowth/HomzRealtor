"use client";
import Testimonials from "@/components/Common/Testimonial";
import { testimonials } from "@/context/utils/AboutPageData";
import DiscoverProject from "@/components/DiscoverProjects";
import FormComponent from "@/components/FormComponent";
import Hero from "@/components/Hero";
import HotSelling from "@/components/HotSelling";
import StatsSection from "@/components/StatsSection";

export default function Home() {

  return (
    <div className="mt-2 mb-20">
      <Hero variant="default" />
      <HotSelling />
      <DiscoverProject />
      <StatsSection />
      <Testimonials
        title="CUSTOMER TESTIMONIALS"
        subtitle="Here’s what our clients have to say about their experience with us."
        testimonialsData={testimonials}
      />
      <FormComponent />
      
    </div>
  );
}
