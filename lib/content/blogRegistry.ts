import type { BlogCategory, BlogPostV27 } from "./blogPostSchema";

import { best3BhkFlatsInGurgaon } from "./blog/best-3-bhk-flats-in-gurgaon";
import { best4BhkFlatsInGurgaon } from "./blog/best-4-bhk-flats-in-gurgaon";
import { bestAreasToBuyPropertyInGurgaon } from "./blog/best-areas-to-buy-property-in-gurgaon";
import { bestPlacesToLiveInGurgaon } from "./blog/best-places-to-live-in-gurgaon";
import { bestPlotsInGurgaonForInvestment } from "./blog/best-plots-in-gurgaon-for-investment";
import { bestProjectsInNewGurgaon } from "./blog/best-projects-in-new-gurgaon";
import { bestProjectsOnDwarkaExpressway } from "./blog/best-projects-on-dwarka-expressway";
import { bestProjectsOnGolfCourseExtensionRoad } from "./blog/best-projects-on-golf-course-extension-road";
import { bestPropertyInvestmentInGurgaonUnder2Crore } from "./blog/best-property-investment-in-gurgaon-under-2-crore";
import { bestResidentialProjectsInGurgaon } from "./blog/best-residential-projects-in-gurgaon";
import { bestSectorsInGurgaonForInvestment } from "./blog/best-sectors-in-gurgaon-for-investment";
import { bestSectorsOnDwarkaExpressway } from "./blog/best-sectors-on-dwarka-expressway";
import { dwarkaExpresswayPropertyPriceTrends } from "./blog/dwarka-expressway-property-price-trends";
import { dwarkaExpresswayVsNewGurgaon } from "./blog/dwarka-expressway-vs-new-gurgaon";
import { flatsInGurgaonUnder1Crore } from "./blog/flats-in-gurgaon-under-1-crore";
import { golfCourseRoadPropertyPriceTrends } from "./blog/golf-course-road-property-price-trends";
import { golfCourseRoadVsDwarkaExpressway } from "./blog/golf-course-road-vs-dwarka-expressway";
import { gurgaonPropertyPriceTrends2026 } from "./blog/gurgaon-property-price-trends-2026";
import { isDwarkaExpresswayGoodForInvestment } from "./blog/is-dwarka-expressway-good-for-investment";
import { isGurgaonGoodForPropertyInvestment } from "./blog/is-gurgaon-good-for-property-investment";
import { luxuryApartmentsInGurgaon } from "./blog/luxury-apartments-in-gurgaon";
import { luxuryApartmentsOnGolfCourseRoad } from "./blog/luxury-apartments-on-golf-course-road";
import { newGurgaonPropertyInvestmentGuide } from "./blog/new-gurgaon-property-investment-guide";
import { newLaunchProjectsInGurgaon } from "./blog/new-launch-projects-in-gurgaon";
import { readyToMoveFlatsInGurgaon } from "./blog/ready-to-move-flats-in-gurgaon";

// Every v2.7-schema blog post, in one place. Each post file is independently
// authored and validated (blogPostV27Schema + validateBlogPostBusinessRules)
// — this registry only aggregates for routing/listing, it doesn't re-validate.
export const BLOG_POSTS_V27: BlogPostV27[] = [
  bestAreasToBuyPropertyInGurgaon,
  bestSectorsInGurgaonForInvestment,
  bestPlacesToLiveInGurgaon,
  gurgaonPropertyPriceTrends2026,
  isGurgaonGoodForPropertyInvestment,
  bestResidentialProjectsInGurgaon,
  newLaunchProjectsInGurgaon,
  readyToMoveFlatsInGurgaon,
  luxuryApartmentsInGurgaon,
  best3BhkFlatsInGurgaon,
  best4BhkFlatsInGurgaon,
  flatsInGurgaonUnder1Crore,
  bestPropertyInvestmentInGurgaonUnder2Crore,
  bestProjectsOnDwarkaExpressway,
  dwarkaExpresswayPropertyPriceTrends,
  isDwarkaExpresswayGoodForInvestment,
  bestSectorsOnDwarkaExpressway,
  newGurgaonPropertyInvestmentGuide,
  bestProjectsInNewGurgaon,
  golfCourseRoadPropertyPriceTrends,
  luxuryApartmentsOnGolfCourseRoad,
  bestProjectsOnGolfCourseExtensionRoad,
  dwarkaExpresswayVsNewGurgaon,
  golfCourseRoadVsDwarkaExpressway,
  bestPlotsInGurgaonForInvestment,
];

export function getBlogPostV27BySlug(slug: string): BlogPostV27 | undefined {
  return BLOG_POSTS_V27.find((p) => p.meta.slug === slug);
}

export function getBlogPostsV27ByCategory(category: BlogCategory): BlogPostV27[] {
  return BLOG_POSTS_V27.filter((p) => p.meta.category === category);
}

// Same corridor/topic cluster as the given post, for the related_articles
// rail — matched by shared tags rather than a hand-maintained list, capped
// at 6 per the schema's relatedArticles max. Never includes the post itself.
export function getRelatedBlogPostsV27(post: BlogPostV27, limit = 6): BlogPostV27[] {
  const tagSet = new Set(post.meta.tags ?? []);
  return BLOG_POSTS_V27.filter((p) => p.meta.slug !== post.meta.slug)
    .map((p) => ({ post: p, shared: (p.meta.tags ?? []).filter((t) => tagSet.has(t)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map((x) => x.post);
}
