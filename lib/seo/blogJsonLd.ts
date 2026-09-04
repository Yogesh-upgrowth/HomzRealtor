import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// hero/og images across every v2.7 post are still placeholders on this
// domain (see each post file's header comment) — used by the render
// templates to show a graceful gradient fallback instead of a broken <img>
// until real photography or a Vercel Blob upload replaces them.
export function isPlaceholderImage(url: string): boolean {
  return url.includes("placeholder.homzrealtor.invalid");
}

// Builds the structured_data block from the v2.7 schema (blog_posting +
// breadcrumb_list + faq_page) directly off the validated post object, so
// visible content and markup can never drift apart — the #1 v1 failure this
// schema exists to prevent. See lib/content/blogPostSchema.ts.

const SITE = "https://www.homzrealtor.com";
// Real, already-deployed site asset (public/android-icon-192x192.png) —
// 192x192 clears the >=112x112 floor structured_data.blog_posting.publisher
// requires. Not the same asset as the header's logo.png (a webpack import
// with no stable URL), which is why this one was chosen instead.
const PUBLISHER_LOGO = `${SITE}/android-icon-192x192.png`;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function computeStructuredDataWordCount(post: BlogPostV27): number {
  const bodyWords =
    countWords(post.introduction) +
    post.sections.reduce((total, section) => {
      const subsectionWords =
        section.subsections?.reduce((sum, sub) => sum + countWords(sub.contentMarkdown), 0) ?? 0;
      return total + countWords(section.contentMarkdown) + subsectionWords;
    }, 0);
  const faqWords = post.faqs.reduce((sum, f) => sum + countWords(f.q) + countWords(f.a), 0);
  return bodyWords + faqWords;
}

export function buildBlogPostingJsonLd(post: BlogPostV27, url: string) {
  const authorSameAs = post.author.social
    ? [post.author.social.twitter, post.author.social.linkedin, post.author.social.instagram].filter(
        (v): v is string => Boolean(v)
      )
    : [];

  return {
    "@type": "BlogPosting",
    headline: post.meta.h1,
    image: [post.hero.imageUrl],
    datePublished: post.meta.publishedAt,
    dateModified: post.meta.updatedAt,
    wordCount: computeStructuredDataWordCount(post),
    articleSection: post.meta.category,
    inLanguage: post.head.lang,
    author: {
      "@type": post.author.name === "Homz Realtor Editorial Team" ? "Organization" : "Person",
      name: post.author.name,
      ...(post.author.profileUrl ? { url: post.author.profileUrl } : {}),
      ...(authorSameAs.length ? { sameAs: authorSameAs } : {}),
    },
    reviewedBy: {
      "@type": "Organization",
      name: post.reviewer.name,
    },
    publisher: {
      "@type": "Organization",
      name: "HomzRealtor",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: PUBLISHER_LOGO,
        width: 192,
        height: 192,
      },
    },
    mainEntityOfPage: url,
  };
}

export function buildBreadcrumbListJsonLd(post: BlogPostV27, url: string) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.meta.category,
        item: `${SITE}/blog/${post.meta.category}`,
      },
      { "@type": "ListItem", position: 4, name: post.meta.h1, item: url },
    ],
  };
}

// Question.name must match the visible <summary> text character-for-character
// — the template renders faqs[].q verbatim as each <summary>, so this is safe
// by construction as long as both read from the same post.faqs array.
export function buildFaqPageJsonLd(post: BlogPostV27) {
  return {
    "@type": "FAQPage",
    mainEntity: post.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export function buildArticleJsonLd(post: BlogPostV27, url: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildBreadcrumbListJsonLd(post, url),
      buildBlogPostingJsonLd(post, url),
      buildFaqPageJsonLd(post),
    ],
  };
}

export function safeJsonLd(graph: unknown): string {
  return JSON.stringify(graph)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
