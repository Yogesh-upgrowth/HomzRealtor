import type { FaqItem } from "@/lib/intelligence/content";

// Real, site-wide business FAQ copy — not fabricated. Matches the FAQPage
// content already used as reference for the homepage's structured data.
export const HOME_FAQS: FaqItem[] = [
  {
    q: "Is HomzRealtor a broker or a direct seller?",
    a: "HomzRealtor is an authorized channel partner for leading developers such as M3M, DLF, Emaar, Godrej and Tata Realty, offering verified listings at the same price as the developer with no hidden markup.",
  },
  {
    // SEO audit 2026-09-07 P0: this used to claim every listed project is
    // RERA registered and verified — directly contradicted by the site's
    // own project pages, which show a real per-project status (RERA
    // Verified / Lapsed / Unverified / Not Registered — see
    // components/Common/ReraBadge.tsx) sourced from the feed, not a
    // uniformly "verified" state. The honest answer describes what the
    // site actually does: display the real status, not guarantee one.
    q: "Are all listings on HomzRealtor RERA registered?",
    a: "Not automatically. Every project page on HomzRealtor shows that project's actual RERA status registered, lapsed, unverified or not registered as sourced from available records, so you can check it before proceeding. Always confirm the current registration on the official HARERA portal before making any payment.",
  },
  {
    q: "Does HomzRealtor charge buyers a brokerage fee?",
    a: "No. HomzRealtor is paid a commission by the developer, so buyers can use our advisory, site visits and paperwork support at zero additional cost.",
  },
  {
    q: "Can HomzRealtor help with home loans?",
    a: "Yes, our in-house loan desk works with 15+ banks and NBFCs to help you compare rates and get pre-approved financing before you finalize a unit.",
  },
  {
    q: "How do I schedule a site visit?",
    a: "You can book a free site visit directly from any project page, through the Expert Consultation form on this site, or by messaging our team on WhatsApp.",
  },
];
