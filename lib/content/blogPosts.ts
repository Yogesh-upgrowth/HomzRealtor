import type { StaticImageData } from "next/image";
import discoverImage1 from "@/assets/images/discoverImage1.jpg";
import aboutHomz from "@/assets/images/aboutHomz.jpg";
import heroFamilyDesktop from "@/assets/images/heroFamilyDesktop.jpg";

// HomzRealtor-authored blog — distinct from lib/content/buyerGuides.ts
// (evergreen "how to" education: RERA, loans, checklists). This section is
// for comparative and timing content — sector vs. sector, developer vs.
// developer, when to buy — which is what actually links down into the
// /project-listing/[city]/sectors/[sector] and /developer/[slug] pages,
// giving the 120-sector/254-developer taxonomy an inbound content path.
// Rendered in full at /blog/[slug]. Same static, hand-written pattern as
// buyerGuides.ts — no CMS, no markdown pipeline.

export type BlogSection = { heading?: string; paragraphs: string[] };

export type RelatedSector = { label: string; slug: string };
export type RelatedDeveloper = { label: string; slug: string };

export type BlogPost = {
  slug: string;
  title: string;
  read: string;
  img: StaticImageData;
  sections: BlogSection[];
  // Only populated where the article names that sector/developer directly —
  // same non-fabrication rule as buyerGuides.ts's relatedSectors.
  relatedSectors?: RelatedSector[];
  relatedDevelopers?: RelatedDeveloper[];
  publishedAt: string;
  updatedAt: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "sector-65-vs-sector-66-gurgaon",
    title: "Sector 65 vs Sector 66, Gurgaon: Which Should You Buy In?",
    read: "6 min read",
    publishedAt: "2026-08-29",
    updatedAt: "2026-08-29",
    img: discoverImage1,
    sections: [
      {
        paragraphs: [
          "Sector 65 and Sector 66 sit side by side on Golf Course Extension Road, and buyers cross-shopping Gurgaon almost always end up comparing the two directly. Both are established, well-connected pockets with a genuine mix of residential and commercial stock — the difference is in the details, not in one being obviously better than the other.",
        ],
      },
      {
        heading: "Inventory: what's actually available right now",
        paragraphs: [
          "On HomzRealtor, Sector 65 currently lists 24+ verified projects, split 9 residential to 15 commercial. Sector 66 lists 22+ projects, split 10 residential to 12 commercial — a slightly more residential-leaning mix. Both sectors carry stock from the same major developers, including M3M, Emaar and AIPL, so brand availability isn't a real differentiator between the two.",
        ],
      },
      {
        heading: "Price range: both span a wide band",
        paragraphs: [
          "Neither sector is uniformly priced — both run from sub-₹50 Lakh commercial units up to multi-crore residential and commercial assets. In Sector 65, listed starting prices range from roughly ₹9.90 Lakh (AIPL Joy Central) up to ₹10.55 Cr (M3M), with several ready-to-move options in the ₹40 Lakh–₹6 Cr band. Sector 66 shows a similar spread, from roughly ₹30.61 Lakh (AIPL) up to ₹8.41 Cr (Emaar MGF The Palm Drive Villas). If you're anchoring a budget, don't assume one sector is categorically cheaper — check the specific project, not the sector label.",
        ],
      },
      {
        heading: "Possession status",
        paragraphs: [
          "Both sectors have a mature share of ready-to-move inventory alongside newer launches still under construction, which is typical of an established Golf Course Extension Road micro-market rather than a fresh land parcel. If possession timeline is your deciding factor, filter by project rather than by sector — ready-to-move and under-construction options exist in both.",
        ],
      },
      {
        heading: "How to actually decide",
        paragraphs: [
          "With comparable developer quality, comparable price bands and comparable possession mixes, the honest answer is that Sector 65 vs Sector 66 usually comes down to the specific project — its exact distance to the NH-48/Golf Course Road junction, the individual developer's track record on that project, and unit-level factors like floor, facing and carpet area, not the sector boundary itself. Both are defensible choices in the same micro-market; the comparison worth doing is project-to-project, once you've picked a budget and configuration.",
        ],
      },
      {
        heading: "Compare the current listings yourself",
        paragraphs: [
          "Prices and inventory change as projects launch and sell out, so treat the figures above as a snapshot, not a permanent ranking. The two sector pages below carry the live, current listing set for each — worth checking before you shortlist.",
        ],
      },
    ],
    relatedSectors: [
      { label: "Sector 65", slug: "sector-65" },
      { label: "Sector 66", slug: "sector-66" },
    ],
    relatedDevelopers: [
      { label: "M3M", slug: "m3m" },
      { label: "Emaar", slug: "emaar" },
    ],
  },
  {
    slug: "dlf-vs-m3m-gurgaon",
    title: "DLF vs M3M in Gurgaon: How to Choose Between Them",
    read: "6 min read",
    publishedAt: "2026-08-29",
    updatedAt: "2026-08-29",
    img: aboutHomz,
    sections: [
      {
        paragraphs: [
          "DLF and M3M are two of the names buyers run into most often while shortlisting in Gurgaon, and for good reason — both have a large, established footprint across the city's key corridors. They're not really competing on the same scale, though: DLF is one of India's oldest and largest listed real estate developers, with a Gurgaon presence dating back decades, while M3M is a newer, privately held developer that built its scale specifically around Gurgaon and NCR.",
        ],
      },
      {
        heading: "Portfolio size and mix, on HomzRealtor today",
        paragraphs: [
          "DLF currently has 71 projects listed on HomzRealtor across Gurgaon — 30 residential and 41 commercial. M3M has 50 — 16 residential and 34 commercial. Both developers skew commercial-heavy in their current listed inventory, and both are active across the city's major sectors rather than concentrated in one corridor.",
        ],
      },
      {
        heading: "Track record and positioning",
        paragraphs: [
          "DLF's longer operating history means a longer visible track record — more completed, delivered projects to actually walk through and evaluate, and a brand that predates Gurgaon's current skyline. M3M has moved fast on newer corridors like Golf Course Extension Road and Sohna Road, and has been an active partner on high-visibility commercial and mixed-use developments in recent years. Neither point is a substitute for checking the specific project's own RERA registration, disclosed possession date and construction progress — track record at the company level doesn't guarantee it on every individual project.",
        ],
      },
      {
        heading: "What this means for your shortlist",
        paragraphs: [
          "Both developers are legitimate, large-scale options with real inventory across Gurgaon, so the choice usually shouldn't be decided on brand name alone. The more useful comparison is project-to-project: possession status, RERA compliance for that specific registration, the sector and micro-market it sits in, and the price band against your budget. Use the developer as one input, not the deciding one.",
        ],
      },
      {
        heading: "Browse the current listings",
        paragraphs: [
          "Portfolio counts shift as projects are added or sold out, so check the live developer pages below for the current project list, price ranges and possession status for each.",
        ],
      },
    ],
    relatedDevelopers: [
      { label: "DLF", slug: "dlf" },
      { label: "M3M", slug: "m3m" },
    ],
  },
  {
    slug: "best-time-to-buy-new-gurgaon",
    title: "Best Time to Buy in New Gurgaon: A Practical Buyer's Timeline",
    read: "5 min read",
    publishedAt: "2026-08-29",
    updatedAt: "2026-08-29",
    img: heroFamilyDesktop,
    sections: [
      {
        paragraphs: [
          "\"New Gurgaon\" generally refers to the newer development corridor along and around the Dwarka Expressway — roughly Sectors 81 through 95 — as distinct from the older, established Golf Course Road and MG Road belt. It's a fair question whether to buy now or wait, and the honest answer depends less on a calendar date than on which of three buying stages you're actually looking at.",
        ],
      },
      {
        heading: "Stage 1: Fresh launch, pre-construction",
        paragraphs: [
          "This is the cheapest entry point per unit, and where the largest appreciation potential typically sits — but also where the risk is highest. You're relying on a developer's disclosed RERA timeline rather than a finished product, and infrastructure around a brand-new launch is often still catching up. This stage suits buyers with a longer holding horizon and a genuine appetite for construction and possession-timeline risk, not buyers who need a home to move into soon.",
        ],
      },
      {
        heading: "Stage 2: Under construction, infrastructure maturing",
        paragraphs: [
          "Once a project is a couple of years into construction and the surrounding roads, water and power infrastructure have caught up, pricing typically sits between the launch price and the ready-to-move premium. This is often the more defensible middle ground: you can see actual construction progress against the RERA-disclosed timeline (check the quarterly progress reports on the state RERA portal), while still buying below what a finished unit will command.",
        ],
      },
      {
        heading: "Stage 3: Ready to move",
        paragraphs: [
          "You pay the full premium for certainty — no construction risk, no possession-date uncertainty, and you can inspect the actual unit before paying. For end-users who need to move in on a known date, or buyers who were burned by a delayed possession before, this stage removes the two biggest risks in Gurgaon real estate at the cost of a higher entry price.",
        ],
      },
      {
        heading: "The Dwarka Expressway factor specifically",
        paragraphs: [
          "Because New Gurgaon's growth is tied closely to Dwarka Expressway completion and the connectivity it brings to both central Gurgaon and Delhi's airport-side commercial districts, infrastructure milestones matter more here than in an already-established corridor. Before buying at any stage, it's worth checking the current status of the specific road, metro or utility connection your shortlisted project's marketing leans on — a promised connectivity upgrade that's still pending is a different bet than one that's already operational.",
        ],
      },
      {
        heading: "A practical way to decide",
        paragraphs: [
          "There's no single \"best time\" that applies to every buyer — it depends on your holding horizon, your tolerance for construction risk, and whether you need to move in by a specific date. What does apply universally: verify the project's RERA registration and disclosed possession date before committing at any stage, and weigh the price you're saving at an earlier stage against the additional years of uncertainty you're taking on to get it.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
