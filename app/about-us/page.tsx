import PromoBanner from "@/components/Common/PromoBanner";
import ContentSection from "@/components/About/ContentSection";
import AboutSections from "@/components/About/AboutSections";
import aboutPageData, { testimonials } from "@/context/utils/AboutPageData";
import Testimonials from "@/components/Common/Testimonial";
import customer from "@/assets/images/customer.png";

export const metadata = {
  title: "About Us — Trusted Real Estate Advisory & Property Solutions",
  description:
    "Learn about Homz, a trusted real estate advisory platform helping homebuyers and investors discover verified residential and commercial properties with confidence.",
  keywords: [
    "about HomzRealtor",
    "real estate advisory Delhi NCR",
    "trusted property consultants Gurgaon",
    "property solutions company",
    "real estate experts Noida",
  ],
  alternates: {
    canonical: "/about-us",
  },
  openGraph: {
    title: "About Us — Trusted Real Estate Advisory & Property Solutions",
    description:
      "Learn about Homz, a trusted real estate advisory platform helping homebuyers and investors discover verified residential and commercial properties with confidence.",
    url: "https://www.homzrealtor.com/about-us",
    type: "website",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Homz",
  description:
    "Homz is a customer-focused real estate advisory and property solutions platform helping individuals and businesses discover verified residential and commercial opportunities with confidence.",
  publisher: {
    "@type": "Organization",
    name: "Homz",
    slogan: "Where Your Property Journey Begins.",
  },
};

const safeJsonLd = (data: unknown) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

const About = () => {
  return (
    <section className="flex flex-col gap-12 md:gap-16 mt-25">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutSchema) }}
      />

      {/* HERO (unchanged) */}
      <div className="max-w-[1444px] w-full mx-auto">
        <ContentSection
          layout="imageLayout"
          isButton={true}
          cardData={aboutPageData.aboutUs}
        />
      </div>

      {/* EXPANDED ABOUT CONTENT */}
      <AboutSections />

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
