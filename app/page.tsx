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
import { getNewLaunchProjects, getFeaturedProjects } from "@/lib/intelligence/homepage";
import { getGurgaonRealEstateNews } from "@/lib/intelligence/news";
import { HOME_FAQS } from "@/lib/content/homeFaq";
import { instrumentSerif, manrope } from "@/lib/fonts";

const GURGAON_CITY_KEY = "ggn";

export default async function Home() {
  const [builders, sectors, newLaunches, featured, news] = await Promise.all([
    getAllBuilders().catch(() => []),
    getSectorsForCity(GURGAON_CITY_KEY).catch(() => []),
    getNewLaunchProjects(GURGAON_CITY_KEY, 6).catch(() => []),
    getFeaturedProjects(GURGAON_CITY_KEY, 4).catch(() => []),
    getGurgaonRealEstateNews(5).catch(() => []),
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

  const safeJsonLd = (data: unknown) =>
    JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
      />

      <div className={`${instrumentSerif.variable} ${manrope.variable} font-ui bg-[#0B0B0C] text-white`}>
        <Hero variant="default" />
        <HotSelling projects={featured} />
        <Collections />
        <LatestLaunches projects={newLaunches} />
        <DevelopersSection developers={topBuilders} />
        <DiscoverProject />
        <MarketStatsSection />
        <WhyHomz />
        <HowItWorks />
        <ServicesGrid />
        <HomzIntelligence />
        <LatestNews items={news} />
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
