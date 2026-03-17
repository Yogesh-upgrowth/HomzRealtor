import Image from "next/image";
// import dummy from "../../../public/dummy.svg";

// import Testimonials from "../../Components/CommonComponents/Testimonials/page";

import ContentSection from "@/components/About/ContentSection";
import aboutPageData, { testimonials } from "@/context/utils/AboutPageData";
import Testimonials from "@/components/Common/Testimonial";

const About = () => {
  return (
    <section className="flex flex-col gap-12 md:gap-16 mt-25">
      {/* about us  */}
      {/* <div className="bg-gray-400 max-w-7xl mx-auto px-6 pt-8  sm:pt-16 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-shrink-0 w-full md:w-1/2">
          <Image
            className="w-full h-auto rounded-lg object-cover"
            src={dummy}
            alt="About MoneyRateFinder team and services"
            priority
          />
        </div>

        <div className="w-full md:w-1/2 ">
          <div className="flex items-center gap-4 mb-6">
            <h1
              id="about-heading"
              className="text-3xl md:text-[40px] text-[#212121] font-bold tracking-wide"
            >
              ABOUT US
            </h1>
            <div className=" md:w-[200px] w-[100px] h-px bg-gradient-to-l from-[#1E1E1E] to-[#FFFFFF]"></div>
          </div>

          <p className="mb-4 text-gray-700 leading-relaxed">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry&apos;s standard dummy
            text ever since the 1500s, when an unknown printer took a galley of
            type and scrambled it to make a type specimen book. Dummy text ever
            since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been.
          </p>

          <div className="pt-8">
            <button
              aria-label="Contact us now"
              className="w-full sm:w-[220px] h-[48px] rounded-md px-6 py-3 font-medium text-black 
              bg-gradient-to-b from-[#fdf094] to-[#b77d2b] hover:opacity-90 transition cursor-pointer"
            >
              Contact Now
            </button>
          </div>
        </div>
      </div> */}
      {/* about Us */}
      <ContentSection
        layout="imageLayout"
        isButton={true}
        cardData={aboutPageData.aboutUs}
      />
      {/* Our Story  */}
      <ContentSection
        cardData={aboutPageData.ourStory}
        layout="reversed"
        theme="dark"
        txtBold={true}
        isButton={true}
      />
      {/* Our Mission Section */}
      <ContentSection cardData={aboutPageData.ourMission} txtBold={true} />
      {/* testinonals */}
      <div className="mb-2">
        <Testimonials
          title="What Our Clients Say"
          subtitle="Here’s what our clients have to say about their experience with us."
          testimonialsData={testimonials}
        />
      </div>
    </section>
  );
};

export default About;
