import type { StaticImageData } from "next/image";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";
import discoverImage3 from "@/assets/images/discoverImage3.jpg";
import discoverImage4 from "@/assets/images/discoverImage4.jpg";
import discoverImage5 from "@/assets/images/discoverImage5.jpg";

// HomzRealtor-authored buyer's guides shown on the homepage's "Property
// Insights" section (components/Home/PropertyInsights.tsx) and rendered in
// full at /property-insights/[slug]. Static, hand-written, evergreen content
// — not tied to any live feed, unlike the "Latest News" section.

export type GuideSection = { heading?: string; paragraphs: string[] };

export type RelatedSector = { label: string; slug: string };

export type BuyerGuide = {
  slug: string;
  title: string;
  read: string;
  img: StaticImageData;
  sections: GuideSection[];
  // Real HomzRealtor sector pages this guide's own content names by name —
  // only populated where the article text actually calls out a specific
  // sector (see the micro-markets guide below), never a generic tack-on.
  relatedSectors?: RelatedSector[];
  // Real dates, not placeholders — sourced from git history (`git log
  // --follow -- lib/content/buyerGuides.ts`), which shows this content was
  // first added 2026-08-20 and hasn't had a genuine prose edit since (a
  // later commit only added the relatedSectors field above, not new
  // content). publishedAt/updatedAt are equal for that reason; bump
  // updatedAt only when a guide's actual text changes — inflating it
  // without a real edit is the "fake freshness" pattern search engines
  // specifically distrust.
  publishedAt: string;
  updatedAt: string;
};

export const BUYER_GUIDES: BuyerGuide[] = [
  {
    slug: "under-construction-property-buying-guide",
    title: "A Complete Guide to Buying Under-Construction Property",
    read: "6 min read",
    publishedAt: "2026-08-20",
    updatedAt: "2026-08-20",
    img: discoverImage2,
    sections: [
      {
        paragraphs: [
          "Under-construction homes are usually priced lower than ready-to-move units in the same project or micro-market, and buyers often get a longer, more flexible payment schedule instead of paying the full amount upfront. That combination — a lower entry price plus appreciation between booking and possession — is the main reason investors and end-users alike keep buying before the building is finished. But it also means you're relying on a developer's execution, not a finished product you can walk through, so the due-diligence steps matter more than they would for a ready flat.",
        ],
      },
      {
        heading: "Verify RERA registration and the promised timeline",
        paragraphs: [
          "Every project should carry a RERA registration number, which you can look up on your state's RERA portal to confirm the developer's own disclosed possession date, sanctioned layout and any past delays on their other projects. A project without a valid RERA number, or one that's been registered but shows extensions on its original timeline, deserves extra scrutiny before you commit.",
        ],
      },
      {
        heading: "Understand the payment plan you're signing up for",
        paragraphs: [
          "Most under-construction projects offer either a construction-linked plan (you pay in instalments tied to actual building milestones — foundation, slab casting, brick work, and so on) or a time-linked plan (fixed instalments on fixed dates regardless of progress). Construction-linked plans generally protect the buyer better, since a stalled project means your payments pause too; time-linked plans put more of that risk on you. Read the payment schedule in the agreement itself, not just the sales brochure, since verbal promises from a sales team aren't binding.",
        ],
      },
      {
        heading: "Check what's actually included in the price",
        paragraphs: [
          "The quoted base price rarely includes everything. Preferential Location Charges (PLC) for a specific floor or facing, car parking, club membership, GST, stamp duty and registration, and maintenance deposits are typically charged separately — ask for a complete cost sheet before booking so you're comparing like-for-like across projects.",
        ],
      },
      {
        heading: "Read the builder-buyer agreement carefully",
        paragraphs: [
          "This is the document that actually governs your purchase, not the brochure. Look specifically for the clause on compensation if possession is delayed beyond the committed date — RERA mandates that buyers are entitled to a penalty interest in such cases — as well as the exact carpet area being sold (RERA requires sale on carpet area, not the older, larger-sounding super built-up area) and the process for cancellation and refund if you need to exit.",
        ],
      },
      {
        heading: "Factor in GST and possession-time costs",
        paragraphs: [
          "Under-construction purchases attract GST on the base price (5% for most units, 1% for those qualifying as affordable housing), which completed, ready-to-move properties don't. Budget for this separately from stamp duty and registration, calculated later, at possession, on the circle rate value at that time — not your original booking price. You'll also typically owe periodic maintenance and, on some projects, a one-time infrastructure or club charge that isn't always itemised upfront, so ask for it in writing.",
        ],
      },
      {
        heading: "Track construction progress yourself",
        paragraphs: [
          "RERA requires registered projects to upload quarterly progress reports to the state portal, covering construction completed against the promised schedule. Checking these yourself every few months — rather than relying solely on the sales team — gives an independent early signal if a project is falling behind, well before a delay becomes a dispute.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "Under-construction property can be a genuinely good deal when the developer has a credible delivery track record and the project is RERA-registered with a realistic timeline. The homework — checking RERA status, reading the payment plan and the builder-buyer agreement, pricing in every additional charge, and monitoring quarterly progress — is what separates a good investment from a multi-year headache. If you're unsure how to read any of these documents, HomzRealtor's advisory team can walk through them with you before you sign.",
        ],
      },
    ],
  },
  {
    slug: "understanding-rera-gurgaon-buyers-guide",
    title: "Understanding RERA: What Every Gurgaon Buyer Should Know",
    read: "5 min read",
    publishedAt: "2026-08-20",
    updatedAt: "2026-08-20",
    img: discoverImage3,
    sections: [
      {
        paragraphs: [
          "The Real Estate (Regulation and Development) Act, 2016 — RERA — was introduced to fix a real problem: buyers had almost no legal protection against delayed possession, misleading project sizes, or developers diverting funds from one project to another. In Haryana, the state authority that enforces it for Gurgaon and the rest of the state is HRERA (Haryana Real Estate Regulatory Authority), with a dedicated Gurugram bench. If you're buying in Gurgaon, HRERA's rules are the ones that actually apply to your purchase.",
        ],
      },
      {
        heading: "What RERA registration actually guarantees",
        paragraphs: [
          "A project can't legally be advertised, marketed or sold until it's registered with HRERA. Registration requires the developer to disclose the sanctioned layout plan, the promised possession date, and details of the land title — and to deposit at least 70% of money collected from buyers in a separate escrow account that can only be used for that project's construction and land cost. That escrow rule is the single biggest structural change RERA made: it's designed to stop developers from using one project's booking money to fund a different, unrelated project.",
        ],
      },
      {
        heading: "Carpet area, not super built-up area",
        paragraphs: [
          "Before RERA, developers commonly quoted price per square foot on \"super built-up area,\" a figure that could include a share of lobbies, lift shafts and common walls, making the flat sound bigger than its actual usable space. RERA requires sale agreements to state the carpet area — the actual usable floor space within the walls — so two projects' prices can finally be compared on the same basis.",
        ],
      },
      {
        heading: "What happens if possession is delayed",
        paragraphs: [
          "If a developer misses the RERA-registered possession date, the buyer is entitled to either withdraw from the project with a full refund plus interest, or continue and receive monthly interest compensation for every month of delay, at a rate prescribed by the state authority. This right exists whether or not it was mentioned in your builder-buyer agreement — RERA overrides a weaker clause in the contract.",
        ],
      },
      {
        heading: "How to actually use HRERA before you buy",
        paragraphs: [
          "Search the project's RERA number on haryanarera.gov.in before booking. The listing will show the registered promoter, the sanctioned plan, the original promised completion date, and any complaints filed against the project. A developer with multiple unresolved complaints or a history of extended deadlines across projects is a meaningful red flag, even if the specific project you're considering looks fine on paper today.",
        ],
      },
      {
        heading: "Filing a complaint, if you ever need to",
        paragraphs: [
          "If a developer breaches the agreement — an unreasonable delay, a change to the sanctioned plan without consent, or diversion of funds — HRERA has an adjudicating officer specifically empowered to hear buyer complaints, and cases are meant to be disposed of within 60 days, far faster than a typical civil suit. You don't need a lawyer to file the initial complaint, though most buyers bring one in for anything beyond a straightforward delay claim.",
        ],
      },
      {
        heading: "What RERA doesn't cover",
        paragraphs: [
          "It's worth knowing the limits too: RERA governs the promoter-buyer relationship for registered projects going forward, so it generally doesn't apply retroactively to disputes that predate a project's registration, and plots or projects below the size threshold set by the state (currently 500 sq. metres or 8 units in Haryana) aren't required to register at all. For those smaller developments, the usual contract-law and consumer-court protections still apply, just without RERA's specific escrow and timeline enforcement.",
        ],
      },
      {
        paragraphs: [
          "RERA doesn't eliminate risk in under-construction buying, but it gives Gurgaon buyers a real paper trail and legal recourse that simply didn't exist before 2016. Making the RERA check a standard first step — before you get attached to a floor plan or a sales pitch — is one of the simplest ways to protect a purchase this large.",
        ],
      },
    ],
  },
  {
    slug: "home-loan-documentation-checklist",
    title: "Home Loan Documentation Checklist for First-Time Buyers",
    read: "4 min read",
    publishedAt: "2026-08-20",
    updatedAt: "2026-08-20",
    img: discoverImage4,
    sections: [
      {
        paragraphs: [
          "A home loan application moves faster when your paperwork is complete and consistent the first time you submit it — most delays come from mismatched addresses, missing income proof, or documents that don't match across forms, not from the bank's processing time itself. Here's what to have ready before you approach a lender.",
        ],
      },
      {
        heading: "Identity and address proof",
        paragraphs: [
          "PAN card (mandatory for any loan application in India), Aadhaar card, and a second government-issued ID such as a passport or voter ID. If your current address differs from what's on your Aadhaar, carry a recent utility bill or rent agreement as address proof — lenders will ask for one that's dated within the last two to three months.",
        ],
      },
      {
        heading: "Income proof — salaried applicants",
        paragraphs: [
          "Last 3 months' salary slips, Form 16 or income tax returns for the last 2-3 years, and bank statements for the last 6 months showing salary credits. If you've recently changed jobs, keep your offer letter and previous employer's relieving letter handy — lenders often ask for continuity of employment history.",
        ],
      },
      {
        heading: "Income proof — self-employed applicants",
        paragraphs: [
          "Income tax returns for the last 3 years along with computation of income, audited profit and loss statement and balance sheet (typically the last 2-3 years), GST returns if applicable, and business bank statements for the last 6-12 months. Self-employed applicants generally face more documentation scrutiny than salaried ones, so having a consistent, complete set upfront meaningfully speeds up approval.",
        ],
      },
      {
        heading: "Property documents",
        paragraphs: [
          "For an under-construction property: the builder-buyer agreement, allotment letter, payment receipts so far, and the project's RERA registration certificate. For a resale or ready property: the chain of title deeds, the seller's own loan clearance/NOC if the property was mortgaged, latest property tax receipts, and an approved building plan. Your lender's own legal team will verify these, but having them ready avoids a second round of requests.",
        ],
      },
      {
        heading: "Co-applicant documents",
        paragraphs: [
          "Adding a co-applicant — typically a spouse or parent — can increase your eligible loan amount, since the bank considers combined income. Whoever is added as co-applicant needs to submit the full identity, address and income document set in their own name too, not just sign the form, and will be equally liable for repayment for the life of the loan.",
        ],
      },
      {
        heading: "Understand loan-to-value and your down payment",
        paragraphs: [
          "Lenders in India typically finance 75-90% of the property's value depending on the loan amount, meaning you'll need to fund the remaining 10-25% yourself as a down payment, on top of stamp duty, registration and any GST due. Keep bank statements showing this down payment amount as genuine, traceable savings — a large last-minute cash deposit just before applying often draws additional questions from the underwriting team about its source.",
        ],
      },
      {
        heading: "A few things that trip up first-time applicants",
        paragraphs: [
          "Keep your name spelling and date of birth identical across PAN, Aadhaar and bank records — even a minor mismatch can stall verification. Check your credit score (CIBIL) before applying, since a low score may mean a higher interest rate or a co-applicant requirement. And avoid taking on new credit card debt or another loan in the months before applying, since it changes your debt-to-income ratio right when the lender is evaluating it. Once your sanction letter arrives, read the processing fee, prepayment charges and interest reset clauses before signing — these vary meaningfully between lenders even at similar headline rates.",
        ],
      },
      {
        paragraphs: [
          "Getting this list organised before your first branch visit or online application is the single biggest thing a first-time buyer can do to move from application to sanction faster. HomzRealtor's in-house loan desk works with multiple banks and NBFCs and can pre-check your documents before you formally apply.",
        ],
      },
    ],
  },
  {
    slug: "gurgaon-micro-markets-best-rental-yields-2026",
    title: "5 Micro-Markets Delivering the Best Rental Yields in 2026",
    read: "7 min read",
    publishedAt: "2026-08-20",
    updatedAt: "2026-08-20",
    img: discoverImage5,
    sections: [
      {
        paragraphs: [
          "Rental yield — annual rent as a percentage of the property's value — is a different metric from capital appreciation, and the two don't always move together. Gurgaon's overall residential rental yield has typically hovered in the 2-3.5% range in recent years, but certain micro-markets consistently outperform that average because of one shared factor: a dense, walkable concentration of white-collar jobs that keeps tenant demand steady even when the broader market cools.",
        ],
      },
      {
        heading: "1. Golf Course Road",
        paragraphs: [
          "Golf Course Road's premium high-rises sit close enough to DLF Cyber City and Cyber Hub that senior executives and expat tenants routinely prioritise walkable or short-commute housing over a cheaper unit further out. That willingness to pay a premium for location, combined with limited fresh supply on the corridor itself, keeps rents firm relative to purchase price.",
        ],
      },
      {
        heading: "2. Golf Course Extension Road",
        paragraphs: [
          "The extension corridor offers a similar profile to Golf Course Road at a somewhat lower entry price, which structurally lifts its rental yield even where absolute rents are a bit lower. It has absorbed much of the demand priced out of the older Golf Course Road stretch while staying close enough to the same commercial catchment.",
        ],
      },
      {
        heading: "3. Sohna Road",
        paragraphs: [
          "Sohna Road benefits from a large, relatively affordable housing stock and proximity to both established commercial hubs and newer business parks along the corridor. That affordability draws a big pool of mid-level executive and dual-income tenants, and a large, liquid rental market tends to support steadier yields than a thin, ultra-premium one — there are simply more comparable transactions here to anchor a fair asking rent against.",
        ],
      },
      {
        heading: "4. Sector 62 & 65 (NH-48 / Golf Course Road junction belt)",
        paragraphs: [
          "This stretch sits within easy reach of Udyog Vihar and the broader NH-48 commercial belt, home to a mix of IT/ITES firms and corporate offices. Housing here draws a steady base of company-leased and employee tenants, which tends to mean lower vacancy periods between tenancies — a factor that matters as much for effective yield as the headline rent does, since a flat sitting empty for even one extra month can erase a meaningful chunk of a year's rental return.",
        ],
      },
      {
        heading: "5. New Gurgaon (Sectors 81-95, Dwarka Expressway corridor)",
        paragraphs: [
          "New Gurgaon's appeal for yield-focused buyers is its lower entry price relative to the established southern corridors, combined with the Dwarka Expressway's improving connectivity to both Gurgaon and Delhi's airport-side commercial districts. As more of that infrastructure comes online and occupancy in these newer townships matures, the area has room to close the rental gap with older micro-markets while still being bought in at a lower base — the trade-off is that some pockets are still building up their tenant base, so vacancy periods can run longer than in an established corridor until that catches up.",
        ],
      },
      {
        heading: "How to read this list",
        paragraphs: [
          "These rankings reflect the structural demand drivers behind each corridor — employment proximity, rental market depth, and the balance between entry price and achievable rent — not a single fixed yield figure, since actual returns shift with each project's pricing and unit mix. Treat this as a shortlist of corridors worth investigating property-by-property, not a guarantee for any specific unit.",
        ],
      },
      {
        heading: "What this means if you're buying for rental income",
        paragraphs: [
          "Yield-focused buying is a different discipline from buying for appreciation: prioritise proximity to a real, established employment cluster over a marginally better address, check actual rented-out comparables in the specific micro-market rather than relying on a builder's projected rental figure, and factor in maintenance charges and vacancy periods when you calculate your real, net yield — not just the advertised gross number. HomzRealtor's advisors can pull comparable rental data for any of these corridors before you commit.",
        ],
      },
    ],
    // Sector 62/65 and the New Gurgaon range (81-95) are named directly in
    // the sections above — real HomzRealtor sector pages, not a generic
    // add-on.
    relatedSectors: [
      { label: "Sector 62", slug: "sector-62" },
      { label: "Sector 65", slug: "sector-65" },
      { label: "Sector 81", slug: "sector-81" },
      { label: "Sector 95", slug: "sector-95" },
    ],
  },
];

export function getBuyerGuide(slug: string): BuyerGuide | undefined {
  return BUYER_GUIDES.find((g) => g.slug === slug);
}
