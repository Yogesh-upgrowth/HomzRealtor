import { z } from "zod";

// TypeScript/Zod implementation of the homzrealtor-blog.schema.v2.7 content
// contract (WhatsApp transfer, 2026-09-04). This file covers the DATA shape
// only — the schema's _rendering_contract, _layout_contract and
// _closing_structure obligations are enforced by the render templates
// (a later phase), not here. quality_gates in the source schema assumes
// three CI scripts (validate-payload.js / check-rendered-html.js /
// run-layout.js) that this repo doesn't run; qualityGates below exists as a
// typed record for a manual pre-publish checklist instead — see
// validateBlogPostBusinessRules for the checks that stand in for
// validate-payload.js.

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const slugSchema = z.string().regex(slugPattern, "lowercase-hyphen, e.g. sector-65-vs-sector-66");

export const BLOG_CATEGORIES = [
  "buying-guides",
  "selling-guides",
  "renting-guides",
  "locality-guides",
  "property-investment",
  "home-loans-and-finance",
  "legal-and-documents",
  "property-pricing",
  "market-trends",
  "comparisons",
  "tools-and-tips",
] as const;
export const categoryEnum = z.enum(BLOG_CATEGORIES);
export type BlogCategory = z.infer<typeof categoryEnum>;

export const DIAGRAM_KINDS = ["bar_chart", "timeline", "location_map", "comparison_split"] as const;

// ---------------------------------------------------------------------------
// head — document-level rendering directives
// ---------------------------------------------------------------------------

export const headSchema = z.object({
  lang: z.enum(["en", "en-IN"]),
  canonicalUrl: z.string().url(),
  robots: z.string().default("index, follow, max-image-preview:large"),
  viewport: z.literal("width=device-width, initial-scale=1"),
  hreflang: z
    .array(z.object({ lang: z.string(), url: z.string().url() }))
    .optional(),
});

// ---------------------------------------------------------------------------
// meta
// ---------------------------------------------------------------------------

export const metaSchema = z.object({
  slug: slugSchema.max(75),
  title: z.string().min(45).max(60),
  h1: z.string().min(20).max(70),
  metaDescription: z.string().min(140).max(160),
  standfirst: z.string().min(60).max(200).optional(),
  // Never rendered — used only by validateBlogPostBusinessRules below.
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).max(8).optional(),
  category: categoryEnum,
  tags: z.array(z.string()).max(6).optional(),
  publishedAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  readingTimeMinutes: z.number().int().min(4).max(20),
});

// ---------------------------------------------------------------------------
// author / reviewer / eeat
// ---------------------------------------------------------------------------

export const authorSchema = z.object({
  // Real individual name, or "Homz Realtor Editorial Team" per
  // _editorial_identity_contract until real author profile pages exist.
  name: z.string().min(1),
  slug: slugSchema.optional(),
  role: z.string().min(1),
  bioShort: z.string().max(240),
  credentials: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
  // Only set once a genuine published profile page exists — never a
  // placeholder.
  profileUrl: z.string().url().nullable().optional(),
  social: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
    })
    .optional(),
});

export const reviewerSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  reviewedAt: z.string().date(),
});

const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  accessedAt: z.string().date(),
});

const priceByLocalityEntrySchema = z.object({
  locality: z.string(),
  avgPriceInr: z.number(),
  pricePerSqftInr: z.number().optional(),
});

const propertyTypeMixEntrySchema = z.object({
  propertyType: z.string(),
  count: z.number().int(),
});

export const eeatSchema = z.object({
  firstHandDataNote: z.string().min(1),
  productDataHook: z.object({
    propertyCount: z.number().int(),
    localityCount: z.number().int().optional(),
    avgPropertyPriceInr: z.number().optional(),
    priceByLocality: z.array(priceByLocalityEntrySchema).optional(),
    topLocalitiesReferenced: z.array(z.string()).optional(),
    propertyTypeMix: z.array(propertyTypeMixEntrySchema).optional(),
    dateRange: z.string().min(1),
  }),
  sources: z.array(sourceSchema).min(2).max(6),
  originalMediaCount: z.number().int().min(3).max(6),
  lastVerifiedAt: z.string().date(),
  disclosure: z.string().min(1),
  aiAssistanceDisclosure: z.string().min(1),
});

// ---------------------------------------------------------------------------
// social (og/twitter)
// ---------------------------------------------------------------------------

export const socialSchema = z.object({
  ogTitle: z.string().max(65),
  ogDescription: z.string().max(200),
  ogImage: z.string().url(),
  ogImageAlt: z.string().optional(),
  twitterCreator: z.string().optional(),
});

// ---------------------------------------------------------------------------
// hero
// ---------------------------------------------------------------------------

export const heroSchema = z.object({
  imageUrl: z.string().url(),
  alt: z.string().min(20).max(125),
  width: z.number().int(),
  height: z.number().int(),
  caption: z.string().max(160).optional(),
  credit: z.string().optional(),
  // Source schema only allowed webp/avif (the performance-optimal formats
  // for a hand-produced hero). Real hero photos here are pulled directly
  // from the live listing catalogue (static.squareyards.com /
  // img.staticmb.com), which serves jpg/png, not webp/avif — declaring
  // "webp" on a jpg url would be fabricating metadata, which the schema's
  // own non-fabrication rule forbids more than a format mismatch does.
  format: z.enum(["webp", "avif", "jpg", "jpeg", "png"]),
  lqip: z.string().optional(),
});

// ---------------------------------------------------------------------------
// quick_answer / introduction
// ---------------------------------------------------------------------------

export const quickAnswerSchema = z.object({
  question: z.string().min(15).max(90),
  answer: z.string().min(200).max(400),
});

export const introductionSchema = z.string().min(500).max(1100);

// ---------------------------------------------------------------------------
// sections + media
// ---------------------------------------------------------------------------

const imageMediaSchema = z.object({
  type: z.literal("image"),
  src: z.string().url(),
  alt: z.string().min(20).max(125),
  width: z.number().int(),
  height: z.number().int(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  loading: z.literal("lazy").default("lazy"),
});

// data's shape depends on diagramKind (bar_chart/timeline/location_map/
// comparison_split); the render layer owns per-kind typing and SVG output,
// this schema only guarantees a diagram carries some data payload.
const diagramMediaSchema = z.object({
  type: z.literal("diagram"),
  diagramKind: z.enum(DIAGRAM_KINDS),
  alt: z.string().min(20),
  caption: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
});

const calloutMediaSchema = z.object({
  type: z.literal("callout"),
  variant: z.enum(["tip", "warning", "pro_tip", "note"]),
  title: z.string().optional(),
  body: z.string().min(1),
});

const tableMediaSchema = z.object({
  type: z.literal("table"),
  caption: z.string().min(1),
  headers: z.array(z.string()).min(2),
  rows: z.array(z.array(z.string())),
});

const productCtaMediaSchema = z.object({
  type: z.literal("product_cta"),
  text: z.string().min(1),
  url: z.string().url(),
  variant: z.enum(["inline", "banner"]).optional(),
});

export const sectionMediaSchema = z.discriminatedUnion("type", [
  imageMediaSchema,
  diagramMediaSchema,
  calloutMediaSchema,
  tableMediaSchema,
  productCtaMediaSchema,
]);
export type SectionMedia = z.infer<typeof sectionMediaSchema>;

const subsectionSchema = z.object({
  h3: z.string().min(12).max(70),
  contentMarkdown: z.string().min(120),
});

export const sectionSchema = z.object({
  id: slugSchema,
  h2: z.string().min(20).max(70),
  contentMarkdown: z.string().min(200),
  subsections: z.array(subsectionSchema).max(4).optional(),
  media: z.array(sectionMediaSchema).optional(),
});
export type BlogSection = z.infer<typeof sectionSchema>;

export const sectionsSchema = z.array(sectionSchema).min(6).max(10);

// ---------------------------------------------------------------------------
// internal_links / faqs / conclusion / related_articles / bottom_cta
// ---------------------------------------------------------------------------

export const internalLinkSchema = z.object({
  anchor: z.string().min(3).max(60),
  url: z.string().min(1),
});

export const faqSchema = z.object({
  q: z.string().min(15).max(100),
  a: z.string().min(200).max(500),
});
export const faqsSchema = z.array(faqSchema).min(8).max(12);

export const conclusionSchema = z.object({
  heading: z.string().max(40).default("The short version"),
  lead: z.string().min(60).max(320),
  checklist: z.array(z.string().max(90)).min(3).max(5),
  closer: z.string().max(220).optional(),
});

export const relatedArticleSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  kicker: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  thumbnailAlt: z.string().optional(),
});

export const bottomCtaSchema = z.object({
  kicker: z.string().max(24).default("Your move"),
  headline: z.string().min(12).max(60),
  body: z.string().max(200).optional(),
  buttonText: z.string().max(30),
  url: z.string().min(1),
});

// ---------------------------------------------------------------------------
// quality_gates — internal-only manual QA record, never rendered
// ---------------------------------------------------------------------------

export const qualityGatesSchema = z.object({
  wordCount: z.number().int().min(1500).max(3500),
  tableCount: z.number().int().min(2).max(5).optional(),
  originalImageCount: z.number().int().min(3).max(6).optional(),
  externalReferenceCount: z.number().int().min(2).max(4).optional(),
  answerFrontLoaded: z.boolean().optional(),
  questionFormatHeadings: z.number().int().min(3).optional(),
  uniqueDataPresent: z.boolean(),
  humanReviewed: z.boolean(),
  sourcesVerified: z.boolean(),
  duplicateCheckPassed: z.boolean(),
  keywordCannibalisationPassed: z.boolean().optional(),
  readingGradeLevel: z.number().optional(),
  // Stand in for validate-payload.js / check-rendered-html.js / run-layout.js
  // — no headless-browser CI in this repo yet, so these are ticked off from
  // a manual pass against the built page, not computed automatically.
  renderedHtmlContractPassed: z.boolean(),
  layoutContractPassed: z.boolean(),
  seoContractPassed: z.boolean(),
  closingStructurePassed: z.boolean(),
});
export type QualityGates = z.infer<typeof qualityGatesSchema>;

// ---------------------------------------------------------------------------
// Top-level payload
// ---------------------------------------------------------------------------

export const blogPostV27Schema = z
  .object({
    head: headSchema,
    meta: metaSchema,
    author: authorSchema,
    reviewer: reviewerSchema,
    eeat: eeatSchema,
    social: socialSchema,
    hero: heroSchema,
    quickAnswer: quickAnswerSchema,
    introduction: introductionSchema,
    sections: sectionsSchema,
    internalLinks: z.array(internalLinkSchema).max(10).default([]),
    faqs: faqsSchema,
    conclusion: conclusionSchema,
    relatedArticles: z.array(relatedArticleSchema).max(6).default([]),
    bottomCta: bottomCtaSchema,
    qualityGates: qualityGatesSchema,
  })
  .refine((post) => post.head.canonicalUrl.endsWith(`/${post.meta.slug}`), {
    message: "head.canonicalUrl must end with /<meta.slug>",
    path: ["head", "canonicalUrl"],
  })
  .refine((post) => new Date(post.meta.updatedAt) >= new Date(post.meta.publishedAt), {
    message: "meta.updatedAt cannot be before meta.publishedAt",
    path: ["meta", "updatedAt"],
  });

export type BlogPostV27 = z.infer<typeof blogPostV27Schema>;

// ---------------------------------------------------------------------------
// Business-rule checks Zod's shape validation can't express — the practical
// stand-in for validate-payload.js. Run this AFTER blogPostV27Schema.parse()
// succeeds. Judgement calls the source schema marks as human-review-only
// (even-handedness of comparisons, GEO posture) are intentionally not here.
// ---------------------------------------------------------------------------

export type ValidationIssue = { path: string; message: string };
export type BusinessRuleResult = {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function computeArticleWordCount(
  post: Pick<BlogPostV27, "introduction" | "sections">,
): number {
  return (
    countWords(post.introduction) +
    post.sections.reduce((total, section) => {
      const subsectionWords =
        section.subsections?.reduce((sum, sub) => sum + countWords(sub.contentMarkdown), 0) ?? 0;
      return total + countWords(section.contentMarkdown) + subsectionWords;
    }, 0)
  );
}

// ~230 wpm, per meta.readingTimeMinutes' "computed, not guessed" rule.
export function computeReadingTimeMinutes(
  post: Pick<BlogPostV27, "introduction" | "sections" | "faqs">,
): number {
  const bodyWords = computeArticleWordCount(post);
  const faqWords = post.faqs.reduce((sum, f) => sum + countWords(f.q) + countWords(f.a), 0);
  return Math.max(4, Math.min(20, Math.round((bodyWords + faqWords) / 230)));
}

const GENERIC_ANCHOR_TEXT = new Set(["click here", "read more", "learn more", "here"]);

export function validateBlogPostBusinessRules(post: BlogPostV27): BusinessRuleResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const titleLower = post.meta.title.toLowerCase();
  const keywordLower = post.meta.primaryKeyword.toLowerCase();

  if (!titleLower.includes(keywordLower)) {
    errors.push({ path: "meta.title", message: "primary_keyword must appear in meta.title" });
  } else {
    const firstFiveWords = titleLower.split(/\s+/).slice(0, 5).join(" ");
    if (!firstFiveWords.includes(keywordLower)) {
      warnings.push({
        path: "meta.title",
        message: "primary_keyword should be front-loaded in the first 3-5 words of meta.title",
      });
    }
  }

  if (!post.meta.h1.toLowerCase().includes(keywordLower)) {
    warnings.push({ path: "meta.h1", message: "primary_keyword is missing from meta.h1" });
  }

  const questionHeadings = post.sections.filter((s) => s.h2.trim().endsWith("?")).length;
  if (questionHeadings < 3) {
    errors.push({
      path: "sections",
      message: `at least 3 H2s must be phrased as questions, found ${questionHeadings}`,
    });
  }

  const keywordHeadings = post.sections.filter((s) => s.h2.toLowerCase().includes(keywordLower)).length;
  if (keywordHeadings !== 1) {
    warnings.push({
      path: "sections",
      message: `exactly one H2 should contain the primary keyword, found ${keywordHeadings}`,
    });
  }

  const wordCount = computeArticleWordCount(post);
  if (wordCount < 1500 || wordCount > 3500) {
    errors.push({
      path: "sections",
      message: `article body is ${wordCount} words, excluding FAQs; must be 1,500-3,500`,
    });
  }

  // _closing_structure.second_half_visual — enforced, not advisory, per the
  // source schema. Position-based: at least one image/diagram from the
  // ceil(sections/2)-th section onward.
  const halfIndex = Math.ceil(post.sections.length / 2);
  const hasSecondHalfVisual = post.sections
    .slice(halfIndex)
    .some((s) => s.media?.some((m) => m.type === "image" || m.type === "diagram"));
  if (!hasSecondHalfVisual) {
    errors.push({
      path: "sections",
      message: "at least one image or diagram must appear from the back half of the sections onward",
    });
  }

  const faqTexts = new Set<string>();
  post.faqs.forEach((faq, i) => {
    const key = faq.q.trim().toLowerCase();
    if (faqTexts.has(key)) {
      warnings.push({ path: `faqs[${i}].q`, message: "duplicate FAQ question" });
    }
    faqTexts.add(key);
  });

  post.internalLinks.forEach((link, i) => {
    if (GENERIC_ANCHOR_TEXT.has(link.anchor.trim().toLowerCase())) {
      errors.push({
        path: `internalLinks[${i}].anchor`,
        message: `"${link.anchor}" is a generic anchor — use descriptive anchor text`,
      });
    }
  });

  if (post.eeat.sources.length < 2) {
    errors.push({ path: "eeat.sources", message: "at least 2 sources are required" });
  }

  const expectedReadingTime = computeReadingTimeMinutes(post);
  if (Math.abs(expectedReadingTime - post.meta.readingTimeMinutes) > 1) {
    warnings.push({
      path: "meta.readingTimeMinutes",
      message: `declared ${post.meta.readingTimeMinutes} min vs ~${expectedReadingTime} min computed at 230wpm`,
    });
  }

  return { errors, warnings };
}
