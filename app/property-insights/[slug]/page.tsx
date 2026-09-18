import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { BUYER_GUIDES, getBuyerGuide, type BuyerGuide } from "@/lib/content/buyerGuides";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";

const SITE = "https://www.homzrealtor.com";

// Schema audit B-05 (2026-09-08): these 4 guides had @type Article (blog
// posts use BlogPosting) and no articleSection at all. Real categories, not
// placeholders — reuses the same slugs as BLOG_CATEGORIES
// (lib/content/blogPostSchema.ts) so this actually corresponds to a real
// /blog/{category} archive, which is the point of the field per the audit.
const GUIDE_CATEGORY: Record<string, string> = {
  "under-construction-property-buying-guide": "buying-guides",
  "understanding-rera-gurgaon-buyers-guide": "legal-and-documents",
  "home-loan-documentation-checklist": "home-loans-and-finance",
  "gurgaon-micro-markets-best-rental-yields-2026": "property-investment",
};

// Owner recheck (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17, P2-B):
// a plain .slice(0, 155) cut mid-word with no ellipsis ("...get a l"),
// which is what the audit flagged as a "clipped description." Prefers a
// complete first sentence if one fits within the target range; otherwise
// falls back to the last whole word before the limit. Never adds "..."
// since the result is always a complete sentence or word, not a
// mid-thought cut.
function truncateAtBoundary(text: string, max = 155): string {
  if (text.length <= max) return text;

  const firstSentenceEnd = text.slice(0, max + 40).search(/[.!?](?:\s|$)/);
  if (firstSentenceEnd !== -1 && firstSentenceEnd + 1 <= max + 40) {
    return text.slice(0, firstSentenceEnd + 1);
  }

  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

function guideWordCount(guide: BuyerGuide): number {
  return guide.sections
    .flatMap((s) => s.paragraphs)
    .reduce((n, p) => n + p.trim().split(/\s+/).filter(Boolean).length, 0);
}

// Only built where a guide's own H2s are genuinely question-shaped, not
// forced onto every guide — 3 of these 4 guides use instructional headings
// ("Verify RERA registration...", "Identity and address proof") that would
// need rewriting to pass as real reader questions, which isn't something to
// fabricate just to populate FAQPage. This one already asks and answers
// real questions almost verbatim; the mapping below only relabels it into
// schema.org's shape, using the guide's own real paragraph text unchanged.
const RERA_GUIDE_FAQ: { q: string; heading: string }[] = [
  { q: "What does RERA registration actually guarantee?", heading: "What RERA registration actually guarantees" },
  { q: "What happens if possession is delayed?", heading: "What happens if possession is delayed" },
  { q: "How do I actually use HRERA before I buy?", heading: "How to actually use HRERA before you buy" },
  { q: "How do I file a complaint with HRERA?", heading: "Filing a complaint, if you ever need to" },
  { q: "What doesn't RERA cover?", heading: "What RERA doesn't cover" },
];

function buildGuideFaq(guide: BuyerGuide): { q: string; a: string }[] {
  if (guide.slug !== "understanding-rera-gurgaon-buyers-guide") return [];
  return RERA_GUIDE_FAQ.map(({ q, heading }) => {
    const section = guide.sections.find((s) => s.heading === heading);
    const a = section?.paragraphs.join(" ");
    return a ? { q, a } : null;
  }).filter((f): f is { q: string; a: string } => f !== null);
}

type PageParams = { params: Promise<{ slug: string }> };

// A small, fixed set of hand-written guides — safe to fully pre-render.
export function generateStaticParams() {
  return BUYER_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const guide = getBuyerGuide(slug);
  if (!guide) return {};

  const firstParagraph = guide.sections[0]?.paragraphs[0];
  const description = firstParagraph ? truncateAtBoundary(firstParagraph) : guide.title;
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
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      images: [{ url: guide.img.src, width: guide.img.width, height: guide.img.height }],
    },
    twitter: {
      card: "summary_large_image",
      images: [guide.img.src],
    },
  };
}

// en-IN, long form — "20 August 2026", not the region-ambiguous 08/20 vs
// 20/08 numeric formats.
function formatGuideDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const PropertyInsightPage = async ({ params }: PageParams) => {
  const { slug } = await params;
  const guide = getBuyerGuide(slug);
  if (!guide) notFound();

  const others = BUYER_GUIDES.filter((g) => g.slug !== guide.slug);
  const pageUrl = `${SITE}/property-insights/${guide.slug}`;
  const faq = buildGuideFaq(guide);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          {
            "@type": "ListItem",
            position: 2,
            name: "Property Insights",
            item: `${SITE}/property-insights`,
          },
          { "@type": "ListItem", position: 3, name: guide.title, item: pageUrl },
        ],
      },
      {
        // BlogPosting, not Article — schema audit B-05 (2026-09-08): the
        // library's 25 real blog posts already use BlogPosting
        // (lib/seo/blogJsonLd.ts); these 4 guides were the odd ones out.
        "@type": "BlogPosting",
        headline: guide.title,
        // Owner recheck (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17,
        // P2-B): guide.img.src is a Next.js static-import path
        // (/_next/static/media/...), relative -- schema.org/Google's
        // structured-data guidance requires an absolute URL here. Unlike
        // the openGraph.images above, this raw JSON-LD isn't resolved
        // against metadataBase automatically.
        image: [`${SITE}${guide.img.src}`],
        wordCount: guideWordCount(guide),
        articleSection: GUIDE_CATEGORY[guide.slug],
        inLanguage: "en-IN",
        // No named individual author — see the code comment on
        // BuyerGuide.publishedAt in lib/content/buyerGuides.ts. Organization
        // is a real, non-fabricated, schema.org-valid author value; it's
        // just a weaker E-E-A-T signal than a named person would be.
        //
        // "Homz Realtor Editorial Team" (not "HomzRealtor") — matches the
        // blog's own author name exactly (lib/seo/blogJsonLd.ts); content
        // strategy lens (2026-09-08) flagged 3 distinct author values across
        // the library where there should be one. publisher stays
        // "HomzRealtor" — that one already matched the blog and the
        // sitewide Organization entity.
        author: { "@type": "Organization", name: "Homz Realtor Editorial Team" },
        publisher: { "@type": "Organization", name: "HomzRealtor" },
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        mainEntityOfPage: pageUrl,
      },
      // Only this one guide's H2s are genuinely question-shaped — see
      // buildGuideFaq()'s comment. The other 3 correctly emit nothing here
      // rather than a fabricated FAQPage.
      ...(faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };
  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  return (
    // SEO audit follow-up (2026-09-09): converted from the pre-dark-theme
    // light styling, matching /project-listing and /developer.
    <div className="bg-[#0B0B0C] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <article className="w-full max-w-3xl mx-auto px-4 pt-28 md:pt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/property-insights" className="hover:text-[#CEA44E]">Property Insights</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{guide.title}</span>
        </nav>

        <span className="inline-block mb-3 rounded-full border border-[#B77D2B]/40 bg-[#B77D2B]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#CEA44E]">
          {guide.read}
        </span>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
          {guide.title}
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          By the HomzRealtor Team · Published{" "}
          <time dateTime={guide.publishedAt}>{formatGuideDate(guide.publishedAt)}</time>
          {guide.updatedAt !== guide.publishedAt && (
            <>
              {" "}
              · Updated <time dateTime={guide.updatedAt}>{formatGuideDate(guide.updatedAt)}</time>
            </>
          )}
        </p>

        <div className="relative mt-6 w-full aspect-video overflow-hidden rounded-2xl border border-gray-700 bg-black">
          <Image src={guide.img} alt={guide.title} fill unoptimized sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>

        <div className="mt-6 space-y-5 text-[15.5px] leading-relaxed text-gray-300">
          {guide.sections.map((s, i) => (
            <div key={i}>
              {s.heading && (
                <h2 className="mb-2 text-lg font-bold text-white">{s.heading}</h2>
              )}
              {s.paragraphs.map((p, j) => (
                <p key={j} className="mb-3 last:mb-0">{p}</p>
              ))}
            </div>
          ))}
        </div>

        {guide.relatedSectors && guide.relatedSectors.length > 0 && (
          <div className="mt-8 border-t border-gray-800 pt-6">
            <p className="mb-3 text-sm font-semibold text-white">
              Sectors mentioned in this guide
            </p>
            <div className="flex flex-wrap gap-2">
              {guide.relatedSectors.map((s) => (
                <Link
                  key={s.slug}
                  href={`/project-listing/gurgaon/sectors/${s.slug}`}
                  className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E] transition"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/project-listing/gurgaon/sectors"
            className="text-sm font-medium text-[#CEA44E] hover:underline"
          >
            Browse all Gurgaon sectors →
          </Link>
        </div>
      </article>

      {others.length > 0 && (
        <section className="w-full max-w-3xl mx-auto px-4 mt-12">
          <h2 className="mb-4 text-xl font-bold text-white">More Buyer&apos;s Guides</h2>
          <div className="flex flex-col divide-y divide-gray-800 border-y border-gray-800">
            {others.map((g) => (
              <Link
                key={g.slug}
                href={`/property-insights/${g.slug}`}
                className="flex items-center justify-between gap-4 py-4 group"
              >
                <span className="font-medium text-gray-300 group-hover:text-[#CEA44E] transition-colors">
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
