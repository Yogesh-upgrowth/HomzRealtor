import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { BUYER_GUIDES } from "@/lib/content/buyerGuides";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";

const SITE = "https://www.homzrealtor.com";
const PAGE_URL = `${SITE}/property-insights`;

export const metadata: Metadata = {
  title: "Property Insights — Buyer's Guides",
  description:
    "HomzRealtor's buyer's guides — RERA basics, under-construction property, home loan documentation and Gurgaon micro-market rental yields.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Property Insights — Buyer's Guides",
    description:
      "HomzRealtor's buyer's guides — RERA basics, under-construction property, home loan documentation and Gurgaon micro-market rental yields.",
    url: PAGE_URL,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Property Insights", item: PAGE_URL },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "Property Insights — Buyer's Guides",
      url: PAGE_URL,
    },
    {
      "@type": "ItemList",
      itemListElement: BUYER_GUIDES.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: `${SITE}/property-insights/${g.slug}`,
      })),
    },
  ],
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const PropertyInsightsIndex = () => {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-5xl mx-auto px-4 mt-28 md:mt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#B77D2B]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">Property Insights</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Property Insights — Buyer&apos;s Guides
        </h1>
        <p className="mt-4 max-w-2xl text-gray-600 leading-relaxed">
          Practical, HomzRealtor-authored guides for buyers navigating RERA
          compliance, under-construction purchases, home loan paperwork and
          where rental yields are strongest right now.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {BUYER_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/property-insights/${g.slug}`}
              className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-[#B77D2B]"
            >
              <div className="relative h-[84px] w-[110px] shrink-0 overflow-hidden rounded-xl">
                <Image src={g.img} alt={g.title} fill unoptimized sizes="110px" className="object-cover" />
              </div>
              <div>
                <h2 className="mb-1.5 text-[15px] font-bold leading-snug text-gray-900 group-hover:text-[#B77D2B] transition-colors">
                  {g.title}
                </h2>
                <span className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-500">
                  {g.read}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-16">
        <AppointmentCard
          bgImage={bgImg}
          heading="STILL HAVE QUESTIONS?"
          para="Talk to a HomzRealtor advisor for guidance tailored to your own buying or investment plans."
          btnTxt="Talk to an Expert"
        />
      </div>
    </div>
  );
};

export default PropertyInsightsIndex;
