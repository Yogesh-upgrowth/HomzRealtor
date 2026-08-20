import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { BUYER_GUIDES, getBuyerGuide } from "@/lib/content/buyerGuides";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";

const SITE = "https://www.homzrealtor.com";

type PageParams = { params: Promise<{ slug: string }> };

// A small, fixed set of hand-written guides — safe to fully pre-render.
export function generateStaticParams() {
  return BUYER_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const guide = getBuyerGuide(slug);
  if (!guide) return {};

  const description = guide.sections[0]?.paragraphs[0]?.slice(0, 155) || guide.title;
  const url = `${SITE}/property-insights/${guide.slug}`;

  return {
    title: guide.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description,
      url,
      type: "article",
      images: [{ url: guide.img.src, width: guide.img.width, height: guide.img.height }],
    },
    twitter: {
      card: "summary_large_image",
      images: [guide.img.src],
    },
  };
}

const PropertyInsightPage = async ({ params }: PageParams) => {
  const { slug } = await params;
  const guide = getBuyerGuide(slug);
  if (!guide) notFound();

  const others = BUYER_GUIDES.filter((g) => g.slug !== guide.slug);
  const pageUrl = `${SITE}/property-insights/${guide.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    image: [guide.img.src],
    author: { "@type": "Organization", name: "HomzRealtor" },
    publisher: { "@type": "Organization", name: "HomzRealtor" },
    mainEntityOfPage: pageUrl,
  };
  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <article className="w-full max-w-3xl mx-auto px-4 mt-28 md:mt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#B77D2B]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">Property Insights</span>
        </nav>

        <span className="inline-block mb-3 rounded-full bg-[#B77D2B]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#B77D2B]">
          {guide.read}
        </span>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
          {guide.title}
        </h1>

        <div className="relative mt-6 w-full aspect-video overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          <Image src={guide.img} alt={guide.title} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>

        <div className="mt-6 space-y-5 text-[15.5px] leading-relaxed text-gray-700">
          {guide.sections.map((s, i) => (
            <div key={i}>
              {s.heading && (
                <h2 className="mb-2 text-lg font-bold text-gray-900">{s.heading}</h2>
              )}
              {s.paragraphs.map((p, j) => (
                <p key={j} className="mb-3 last:mb-0">{p}</p>
              ))}
            </div>
          ))}
        </div>
      </article>

      {others.length > 0 && (
        <section className="w-full max-w-3xl mx-auto px-4 mt-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">More Buyer&apos;s Guides</h2>
          <div className="flex flex-col divide-y divide-gray-200 border-y border-gray-200">
            {others.map((g) => (
              <Link
                key={g.slug}
                href={`/property-insights/${g.slug}`}
                className="flex items-center justify-between gap-4 py-4 group"
              >
                <span className="font-medium text-gray-800 group-hover:text-[#B77D2B] transition-colors">
                  {g.title}
                </span>
                <span className="shrink-0 text-xs text-gray-500">{g.read}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14">
        <AppointmentCard
          bgImage={bgImg}
          heading="TALK TO A GURGAON REAL ESTATE EXPERT"
          para="Have questions about your own buying or investment plans? HomzRealtor's advisors can walk you through the details."
          btnTxt="Talk to an Expert"
        />
      </div>
    </div>
  );
};

export default PropertyInsightPage;
