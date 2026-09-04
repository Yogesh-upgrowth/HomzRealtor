import Link from "next/link";
import Markdown from "markdown-to-jsx";
import { ChevronRight } from "lucide-react";
import type { BlogPostV27 } from "@/lib/content/blogPostSchema";
import { buildArticleJsonLd, safeJsonLd } from "@/lib/seo/blogJsonLd";
import ReadingProgressBar from "./ReadingProgressBar";
import BlogImageOrFallback from "./BlogImageOrFallback";
import QuickAnswerBlock from "./QuickAnswerBlock";
import TableOfContents from "./TableOfContents";
import SectionMedia from "./SectionMedia";
import FaqAccordion from "./FaqAccordion";
import TakeawayCard from "./TakeawayCard";
import DominantCta from "./DominantCta";
import CredibilityFooter from "./CredibilityFooter";

const SITE = "https://www.homzrealtor.com";

// en-IN, long form — "4 September 2026", not the region-ambiguous 09/04 vs
// 04/09 numeric formats.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const markdownOptions = {
  overrides: {
    p: { props: { className: "mb-4 last:mb-0" } },
    ul: { props: { className: "mb-4 list-disc space-y-1 pl-5" } },
    ol: { props: { className: "mb-4 list-decimal space-y-1 pl-5" } },
    strong: { props: { className: "font-semibold text-white" } },
    a: { props: { className: "text-[#CEA44E] underline hover:no-underline" } },
  },
};

// bg-[#0B0B0C] text-white matches the site's dark shell (app/page.tsx, the
// project-detail pages) — the blog previously stood out as a light island
// against it.
const BlogPostV27Article = ({ post }: { post: BlogPostV27 }) => {
  const pageUrl = `${SITE}${post.head.canonicalUrl.replace(SITE, "")}`;
  const related = post.relatedArticles;
  const halfIndex = Math.ceil(post.sections.length / 2);

  return (
    <div className="bg-[#0B0B0C] text-white">
      <ReadingProgressBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(buildArticleJsonLd(post, pageUrl)) }}
      />

      <article className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#CEA44E]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/blog" className="hover:text-[#CEA44E]">Blog</Link>
          <ChevronRight size={12} />
          <Link href={`/blog/${post.meta.category}`} className="hover:text-[#CEA44E] capitalize">
            {post.meta.category.replace(/-/g, " ")}
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{post.meta.h1}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
          {post.meta.h1}
        </h1>
        {post.meta.standfirst && (
          <p className="mt-3 text-lg text-gray-400 leading-relaxed">{post.meta.standfirst}</p>
        )}

        {/* Byline: author, fact-checked badge, dates — all REQUIRED VISIBLE per the schema's rendering contract */}
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
          <span>
            By <span className="font-medium text-gray-200">{post.author.name}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center rounded-full bg-[#B77D2B]/15 px-2.5 py-0.5 text-xs font-semibold text-[#CEA44E]">
            Fact-checked by {post.reviewer.name}
          </span>
          <span aria-hidden="true">·</span>
          <span>{post.meta.readingTimeMinutes} min read</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Updated <time dateTime={post.meta.updatedAt}>{formatDate(post.meta.updatedAt)}</time>
          {" · "}
          Facts verified <time dateTime={post.eeat.lastVerifiedAt}>{formatDate(post.eeat.lastVerifiedAt)}</time>
        </p>

        <p className="mt-4 rounded-lg border-l-4 border-[#B77D2B] bg-black px-4 py-3 text-[15px] text-gray-200">
          {post.eeat.firstHandDataNote}
        </p>

        <div className="relative mt-6 w-full aspect-video overflow-hidden rounded-2xl border border-gray-700 bg-gray-900">
          <BlogImageOrFallback
            src={post.hero.imageUrl}
            alt={post.hero.alt}
            categoryLabel={post.meta.category.replace(/-/g, " ")}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>
        {post.hero.caption && <p className="mt-2 text-xs text-gray-500">{post.hero.caption}</p>}

        <div className="mt-6">
          <QuickAnswerBlock quickAnswer={post.quickAnswer} />
        </div>

        <div className="mt-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 xl:gap-14">
          <div className="lg:order-2 lg:max-w-[720px]">
            <div className="prose-content text-[16px] leading-[1.75] text-gray-300">
              <div className="mb-6">
                <Markdown options={markdownOptions}>{post.introduction}</Markdown>
              </div>

              {post.sections.map((section, i) => (
                <section key={section.id} id={section.id} className="mb-8 scroll-mt-24">
                  <h2 className="mb-3 text-xl md:text-2xl font-bold text-white">{section.h2}</h2>
                  <Markdown options={markdownOptions}>{section.contentMarkdown}</Markdown>

                  {section.subsections?.map((sub, si) => (
                    <div key={si} className="mt-4 mb-4">
                      <h3 className="mb-2 text-lg font-semibold text-white">{sub.h3}</h3>
                      <Markdown options={markdownOptions}>{sub.contentMarkdown}</Markdown>
                    </div>
                  ))}

                  {section.media && section.media.length > 0 && (
                    <SectionMedia items={section.media} />
                  )}

                  {i === halfIndex - 1 && post.internalLinks.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-800 pt-4">
                      {post.internalLinks.map((link, li) => (
                        <Link
                          key={li}
                          href={link.url}
                          className="text-sm font-medium text-[#CEA44E] hover:underline"
                        >
                          {link.anchor} →
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>

          <aside className="lg:order-1">
            <TableOfContents sections={post.sections} />
          </aside>
        </div>

        <section id="faqs" className="mt-10 scroll-mt-24">
          <h2 className="mb-4 text-xl md:text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <FaqAccordion faqs={post.faqs} />
        </section>

        <div className="mt-10">
          <TakeawayCard conclusion={post.conclusion} />
        </div>

        <div className="mt-10">
          <DominantCta cta={post.bottomCta} />
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-white">Related Articles</h2>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {related.map((r, i) => (
                <Link
                  key={i}
                  href={r.url}
                  className="min-w-[240px] max-w-[240px] shrink-0 snap-start rounded-xl border border-gray-700 bg-black p-4 hover:border-[#B77D2B]"
                >
                  {r.kicker && (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#CEA44E]">
                      {r.kicker}
                    </span>
                  )}
                  <p className="mt-1 text-sm font-semibold text-white">{r.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 mb-16">
          <CredibilityFooter post={post} />
        </div>
      </article>
    </div>
  );
};

export default BlogPostV27Article;
