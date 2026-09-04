import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/content/blogPostSchema";
import { BLOG_POSTS_V27, getBlogPostV27BySlug, getBlogPostsV27ByCategory } from "@/lib/content/blogRegistry";
import BlogPostV27Article from "@/components/Blog/BlogPostV27Article";
import BlogImageOrFallback from "@/components/Blog/BlogImageOrFallback";

type PageParams = { params: Promise<{ slug: string }> };

function isCategory(slug: string): slug is BlogCategory {
  return (BLOG_CATEGORIES as readonly string[]).includes(slug);
}

const CATEGORY_LABELS: Record<BlogCategory, string> = {
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

// Every real /blog/[slug] path this route serves: the fixed category list
// (/blog/buying-guides etc.) and every v2.7 article slug — both
// single-segment, which is why category and article share one dynamic
// route instead of colliding as [category] vs [slug] (Next.js doesn't
// allow two dynamic names at the same path level).
export function generateStaticParams() {
  return [
    ...BLOG_CATEGORIES.map((c) => ({ slug: c })),
    ...BLOG_POSTS_V27.map((p) => ({ slug: p.meta.slug })),
  ];
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const SITE = "https://www.homzrealtor.com";

  if (isCategory(slug)) {
    const label = CATEGORY_LABELS[slug];
    const url = `${SITE}/blog/${slug}`;
    return {
      title: `${label} — HomzRealtor Blog`,
      description: `Gurgaon ${label.toLowerCase()} from HomzRealtor — real listing data, not generic advice.`,
      alternates: { canonical: url },
    };
  }

  const v27 = getBlogPostV27BySlug(slug);
  if (!v27) return {};

  const url = `${SITE}/blog/${v27.meta.slug}`;
  return {
    title: v27.meta.title,
    description: v27.meta.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: v27.social.ogTitle,
      description: v27.social.ogDescription,
      url,
      type: "article",
      publishedTime: v27.meta.publishedAt,
      modifiedTime: v27.meta.updatedAt,
      images: [{ url: v27.social.ogImage, alt: v27.social.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      images: [v27.social.ogImage],
    },
    robots: v27.head.robots,
  };
}

const CategoryArchive = ({ category }: { category: BlogCategory }) => {
  const posts = getBlogPostsV27ByCategory(category);
  const label = CATEGORY_LABELS[category];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-16">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/blog" className="hover:text-[#CEA44E]">Blog</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{label}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{label}</h1>
        <p className="mt-3 max-w-2xl text-gray-400">
          {posts.length > 0
            ? `${posts.length} ${posts.length === 1 ? "guide" : "guides"} in this category, built from HomzRealtor's live Gurgaon catalogue.`
            : "No guides published in this category yet — check back soon."}
        </p>

        {posts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.meta.slug}
                href={`/blog/${p.meta.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-700 bg-black transition hover:border-[#B77D2B]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <BlogImageOrFallback
                    src={p.hero.imageUrl}
                    alt={p.hero.alt}
                    categoryLabel={label}
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <div className="p-5">
                  <h2 className="mb-2 text-base font-bold leading-snug text-white group-hover:text-[#CEA44E]">
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
      </div>
    </div>
  );
};

const BlogPostPage = async ({ params }: PageParams) => {
  const { slug } = await params;

  if (isCategory(slug)) {
    return <CategoryArchive category={slug} />;
  }

  const v27 = getBlogPostV27BySlug(slug);
  if (v27) {
    return <BlogPostV27Article post={v27} />;
  }

  notFound();
};

export default BlogPostPage;
