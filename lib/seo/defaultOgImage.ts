import ogImage from "@/assets/images/herobg.png";

// Branded fallback social-share image for templates with no natural
// per-entity photo (listing index, city/sector/developer hubs, static
// pages). Project detail pages use their own scraped photo instead —
// see generateMetadata in app/project-listing/[city]/[slug]/page.tsx.
export const DEFAULT_OG_IMAGE = {
  url: ogImage.src,
  width: ogImage.width,
  height: ogImage.height,
  alt: "HomzRealtor — Residential & Commercial Property in Gurgaon, Noida & Delhi NCR",
};
