import DiscoverProject from "@/components/DiscoverProjects";
import Hero from "@/components/Hero";
import HotSelling from "@/components/HotSelling";
import Collections from "@/components/Home/Collections";
import LatestLaunches from "@/components/Home/LatestLaunches";
import DevelopersSection from "@/components/Home/DevelopersSection";
import WhyHomz from "@/components/Home/WhyHomz";
import HowItWorks from "@/components/Home/HowItWorks";
import ServicesGrid from "@/components/Home/ServicesGrid";
import LatestNews from "@/components/Home/LatestNews";
import PropertyInsights from "@/components/Home/PropertyInsights";
import HomeFaq from "@/components/Home/HomeFaq";
import PopularSearches from "@/components/Home/PopularSearches";
import GurgaonSectorsSection from "@/components/Home/GurgaonSectorsSection";
import ExpertConsultation from "@/components/Home/ExpertConsultation";
import FinalCta from "@/components/Home/FinalCta";
import FloatingWhatsApp from "@/components/Home/FloatingWhatsApp";
import MobileBottomNav from "@/components/Home/MobileBottomNav";
import { getAllBuilders, getSectorsForCity, canonicalCitySlug, isIndexableDeveloper } from "@/lib/intelligence/projects";
import { getNewLaunchProjects, getFeaturedProjects } from "@/lib/intelligence/homepage";
import { getGurgaonRealEstateNews } from "@/lib/intelligence/news";
import { instrumentSerif, manrope } from "@/lib/fonts";

// Checklist item 17 (2026-09-22). The homepage had no canonical of its own —
// it inherited `alternates.canonical: "/"` from the root layout, which worked
// but made it the one page in the site relying on that inheritance.
//
// The inheritance itself is the thing worth naming: because the root layout
// declares a canonical, ANY route that forgets to set its own silently
// declares the homepage as its canonical, which is far worse than having no
// canonical at all. Every other route does override it today, and
// scripts/check-canonicals.mjs now fails the moment one does not. Stating it
// here means nothing depends on that inheritance by accident.
export const metadata = {
  alternates: { canonical: "/" },
};

const GURGAON_CITY_KEY = "ggn";

export default async function Home() {
  const [builders, sectors, newLaunches, featured, news] = await Promise.all([
    getAllBuilders().catch(() => []),
    getSectorsForCity(GURGAON_CITY_KEY).catch(() => []),
    getNewLaunchProjects(GURGAON_CITY_KEY, 6).catch(() => []),
    getFeaturedProjects(GURGAON_CITY_KEY, 4).catch(() => []),
    getGurgaonRealEstateNews(5).catch(() => []),
  ]);

  // Confirmed developers only — the homepage is the single strongest internal
  // link source on the site (2026-09-21, checklist item 3).
  const topBuilders = builders.filter(isIndexableDeveloper).slice(0, 6);
  const gurgaonSlug = canonicalCitySlug(GURGAON_CITY_KEY);



  return (
    <>

      <div className={`${instrumentSerif.variable} ${manrope.variable} font-ui bg-[#0B0B0C] text-white`}>
        <Hero variant="default" />
        <HotSelling projects={featured} />
        <Collections />
        <LatestLaunches projects={newLaunches} />
        <DevelopersSection developers={topBuilders} />
        <DiscoverProject />
        {/* Owner recheck (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17,
            P1-G): MarketStatsSection removed -- its own numbers (18.4%
            appreciation, ₹9,850/sq.ft, 6,200+ units, 42-day close) were
            static placeholders with no real data source, presented as if
            factual. Deleted rather than left as dead code; rebuild it if
            a real, sourced market-data feed exists later. */}
        <WhyHomz />
        <HowItWorks />
        <ServicesGrid />
        {/* Owner recheck (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17,
            P1-G): HomzIntelligence removed -- hardcoded fake chart data
            (a scripted "+62% cumulative" bar chart) plus a false capability
            claim ("Our proprietary data engine analyzes thousands of
            transactions... to surface... growth signals") that doesn't
            reflect anything this app actually does. Rebuild only once a
            real, sourced analytics capability exists to describe. */}
        <LatestNews items={news} />
        <PropertyInsights />
        {/* SEO audit 2026-09-07 P1 ("Awards, scale claims and identical
            testimonials are not visibly substantiated"): both sections
            removed rather than left live. Testimonial text was word-for-word
            identical across all three named "clients" with clearly invented
            companies (see context/utils/AboutPageData.tsx); AwardsSection's
            own source comment already called its four awards "illustrative
            placeholder" — fabricated wins attributed to real bodies (NAR,
            CREDAI). Restore both once real, consented customer stories and
            real award evidence exist. */}
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
