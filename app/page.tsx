import Testimonials from "@/components/Common/Testimonial";
import { testimonials } from "@/context/utils/AboutPageData";
import DiscoverProject from "@/components/DiscoverProjects";
import Hero from "@/components/Hero";
import HotSelling from "@/components/HotSelling";
import Collections from "@/components/Home/Collections";
import LatestLaunches from "@/components/Home/LatestLaunches";
import DevelopersSection from "@/components/Home/DevelopersSection";
import MarketStatsSection from "@/components/Home/MarketStatsSection";
import WhyHomz from "@/components/Home/WhyHomz";
import HowItWorks from "@/components/Home/HowItWorks";
import ServicesGrid from "@/components/Home/ServicesGrid";
import HomzIntelligence from "@/components/Home/HomzIntelligence";
import LatestNews from "@/components/Home/LatestNews";
import PropertyInsights from "@/components/Home/PropertyInsights";
import AwardsSection from "@/components/Home/AwardsSection";
import HomeFaq from "@/components/Home/HomeFaq";
import PopularSearches from "@/components/Home/PopularSearches";
import GurgaonSectorsSection from "@/components/Home/GurgaonSectorsSection";
import ExpertConsultation from "@/components/Home/ExpertConsultation";
import FinalCta from "@/components/Home/FinalCta";
import FloatingWhatsApp from "@/components/Home/FloatingWhatsApp";
import MobileBottomNav from "@/components/Home/MobileBottomNav";
import { getAllBuilders, getSectorsForCity, canonicalCitySlug } from "@/lib/intelligence/projects";
import { getNewLaunchProjects } from "@/lib/intelligence/homepage";
import { HOME_FAQS } from "@/lib/content/homeFaq";
import { instrumentSerif, manrope } from "@/lib/fonts";

const GURGAON_CITY_KEY = "ggn";

export default async function Home() {
  const [builders, sectors, newLaunches] = await Promise.all([
    getAllBuilders().catch(() => []),
    getSectorsForCity(GURGAON_CITY_KEY).catch(() => []),
    getNewLaunchProjects(GURGAON_CITY_KEY, 6).catch(() => []),
  ]);

  const topBuilders = builders.slice(0, 6);
  const gurgaonSlug = canonicalCitySlug(GURGAON_CITY_KEY);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className={`${instrumentSerif.variable} ${manrope.variable} font-ui bg-[#0B0B0C] text-white`}>
        <Hero variant="default" />
        <HotSelling />
        <Collections />
        <LatestLaunches projects={newLaunches} />
        <DevelopersSection developers={topBuilders} />
        <DiscoverProject />
        <MarketStatsSection />
        <WhyHomz />
        <HowItWorks />
        <ServicesGrid />
        <HomzIntelligence />
        <LatestNews />
        <PropertyInsights />
        <Testimonials
          title="CUSTOMER TESTIMONIALS"
          subtitle="Here’s what our clients have to say about their experience with us."
          testimonialsData={testimonials}
        />
        <AwardsSection />
        <HomeFaq />
        <PopularSearches />
        <GurgaonSectorsSection citySlug={gurgaonSlug} sectors={sectors} />
        <ExpertConsultation />
        <FinalCta />

        <FloatingWhatsApp />
        <MobileBottomNav />
      </div>
    </>
  );
}
