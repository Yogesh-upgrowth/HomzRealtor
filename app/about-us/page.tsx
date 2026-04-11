import Image from "next/image";
// import dummy from "../../../public/dummy.svg";

// import Testimonials from "../../Components/CommonComponents/Testimonials/page";
import PromoBanner from "@/components/Common/PromoBanner";
import ContentSection from "@/components/About/ContentSection";
import aboutPageData, { testimonials } from "@/context/utils/AboutPageData";
import Testimonials from "@/components/Common/Testimonial";
import customer from "@/assets/images/customer.png";

const About = () => {
  return (
    <section className="flex flex-col gap-12 md:gap-16 mt-25">

      {/* ABOUT US */}
      <div className="max-w-[1444px] w-full mx-auto">
        <ContentSection
          layout="imageLayout"
          isButton={true}
          cardData={aboutPageData.aboutUs}
        />
      </div>

      {/* OUR STORY (FULL WIDTH) */}
      <div className="w-full">
        <ContentSection
          cardData={aboutPageData.ourStory}
          layout="reversed"
          theme="dark"
          txtBold={true}
          isButton={true}
        />
      </div>

      {/* OUR MISSION */}
      <div className="max-w-[1444px] w-full mx-auto">
        <ContentSection
          cardData={aboutPageData.ourMission}
          txtBold={true}
        />
      </div>

      {/* TESTIMONIALS */}
      <div className="max-w-[1444px] w-full mx-auto mb-2">
        <Testimonials
          title="What Our Clients Say"
          subtitle="Here’s what our clients have to say about their experience with us."
          testimonialsData={testimonials}
        />
      </div>

      {/* PROMO BANNER */}
      <div className="max-w-[1444px] w-full mx-auto">
        <PromoBanner
          heading="SPACES CRAFTED FOR YOUR NEXT CHAPTER"
          text="Step into homes that resonate with your aspirations. From timeless architecture to thoughtfully designed interiors, discover properties that elevate everyday living. Your perfect match is just a call away."
          buttonText="CONTACT NOW"
          buttonLink="/contact"
          imageSrc={customer}
        />
      </div>

    </section>
  );
};

export default About;
