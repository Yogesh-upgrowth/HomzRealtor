import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import HomeFaq from "@/components/Home/HomeFaq";
import { HOME_FAQS } from "@/lib/content/homeFaq";

// SEO audit M-08 (2026-09-08): a FAQPage schema already existed on the
// homepage (built from this same HOME_FAQS content — see app/page.tsx), but
// /faq itself 404'd. This is real, substantive, non-fabricated business FAQ
// content (see the "not fabricated" comment on HOME_FAQS itself) — worth a
// real standalone page and its own indexable URL, not just a homepage
// section.
const SITE = "https://www.homzrealtor.com";
const PAGE_URL = `${SITE}/faq`;

export const metadata: Metadata = {
  title: "FAQs, HomzRealtor Gurgaon Property Advisory",
  description:
    "Answers to common questions about buying property in Gurgaon through HomzRealtor: brokerage fees, RERA verification, home loan assistance and booking a site visit.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "FAQs, HomzRealtor Gurgaon Property Advisory",
    description:
      "Answers to common questions about buying property in Gurgaon through HomzRealtor: brokerage fees, RERA verification, home loan assistance and booking a site visit.",
    url: PAGE_URL,
    type: "website",
  },
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const FaqPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "FAQs", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: HOME_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="bg-[#0B0B0C] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <div className="w-full max-w-4xl mx-auto px-4 pt-28 md:pt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">FAQs</span>
        </nav>

        {/* Distinct wording from HomeFaq's own internal h2 ("Frequently
            Asked Questions") below, so this doesn't read as a literal
            duplicate heading. */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Property Buying FAQs, HomzRealtor Gurgaon
        </h1>
      </div>

      <HomeFaq />
    </div>
  );
};

export default FaqPage;
