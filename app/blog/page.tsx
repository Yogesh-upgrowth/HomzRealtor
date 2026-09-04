import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { BLOG_POSTS_V27 } from "@/lib/content/blogRegistry";
import { BLOG_CATEGORIES } from "@/lib/content/blogPostSchema";
import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";
import BlogImageOrFallback from "@/components/Blog/BlogImageOrFallback";

const SITE = "https://www.homzrealtor.com";
const PAGE_URL = `${SITE}/blog`;

const CATEGORY_LABELS: Record<string, string> = {
  "buying-guides": "Buying Guides",
  "selling-guides": "Selling Guides",
  "renting-guides": "Renting Guides",
  "locality-guides": "Locality Guides",
  "property-investment": "Property Investment",
  "home-loans-and-finance": "Home Loans & Finance",
  "legal-and-documents": "Legal & Documents",
  "property-pricing": "Property Pricing",
  "market-trends": "Market Trends",
  comparisons: "Comparisons",
  "tools-and-tips": "Tools & Tips",
};

export const metadata: Metadata = {
  title: "Blog — Gurgaon Real Estate Guides & Market Data",
  description:
    "HomzRealtor's blog — corridor comparisons, sector-level investment guides and price data built from our live Gurgaon listing catalogue.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Blog — Gurgaon Real Estate Guides & Market Data",
    description:
      "HomzRealtor's blog — corridor comparisons, sector-level investment guides and price data built from our live Gurgaon listing catalogue.",
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
        { "@type": "ListItem", position: 2, name: "Blog", item: PAGE_URL },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "Blog — Gurgaon Real Estate Guides & Market Data",
      url: PAGE_URL,
    },
    {
      "@type": "ItemList",
      itemListElement: [
        ...BLOG_POSTS_V27.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.meta.h1,
          url: `${SITE}/blog/${p.meta.slug}`,
        })),
      ],
    },
  ],
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const BlogIndex = () => {
  const categoriesWithPosts = BLOG_CATEGORIES.filter((c) =>
    BLOG_POSTS_V27.some((p) => p.meta.category === c)
  );

  return (
    <div className="bg-[#0B0B0C] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">Blog</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Blog
        </h1>
        <p className="mt-4 max-w-2xl text-gray-400 leading-relaxed">
          Corridor comparisons, sector-level investment guides and price data
          for Gurgaon real estate — built directly from HomzRealtor&apos;s
          live listing catalogue, not generic advice.
        </p>

        {categoriesWithPosts.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {categoriesWithPosts.map((c) => (
              <Link
                key={c}
                href={`/blog/${c}`}
                className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
              >
                {CATEGORY_LABELS[c]}
              </Link>
            ))}
          </div>
        )}

        {BLOG_POSTS_V27.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS_V27.map((p) => (
              <Link
                key={p.meta.slug}
                href={`/blog/${p.meta.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-700 bg-black transition hover:border-[#B77D2B]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <BlogImageOrFallback
                    src={p.hero.imageUrl}
                    alt={p.hero.alt}
                    categoryLabel={CATEGORY_LABELS[p.meta.category]}
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <div className="p-5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#CEA44E]">
                    {CATEGORY_LABELS[p.meta.category]}
                  </span>
                  <h2 className="mt-1.5 mb-2 text-base font-bold leading-snug text-white group-hover:text-[#CEA44E] transition-colors">
                    {p.meta.h1}
                  </h2>
                  <p className="mb-3 text-sm text-gray-400 line-clamp-2">{p.meta.standfirst}</p>
                  <span className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-500">
                    {p.meta.readingTimeMinutes} min read
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
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

export default BlogIndex;
