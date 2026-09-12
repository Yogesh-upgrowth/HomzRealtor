import type { MetadataRoute } from "next";

// Robots directives. Points crawlers at the XML sitemap and keeps the API,
// and query-string-only URL variants (filters/search — never the canonical
// content URL for a page), out of the index. Served at /robots.txt.
//
// Enquiry pages carry a noindex,follow meta tag and are intentionally left
// crawlable here so that directive can be seen — they are not disallowed.
//
// This is the single source for /robots.txt — a static app/robots.txt file
// used to sit alongside this route and silently win or conflict depending on
// build order, serving stale/inconsistent directives. Do not reintroduce one.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.homzrealtor.com";

  // Bulk AI-training scrapers stay blocked. Retrieval/citation agents that
  // fetch pages live on behalf of a user's assistant query — OAI-SearchBot,
  // ChatGPT-User, Perplexity-User, ClaudeBot, and Google-Extended (which
  // also gates eligibility for Google AI Overviews grounding) — are
  // deliberately allowed so the site can be cited in AI answers. These get
  // their own explicit `allow` rules below rather than relying on the
  // wildcard `User-Agent: *` fallback — SEO audit (C-01, 2026-09-08) flagged
  // that as fragile: a future edit to the wildcard rule for an unrelated
  // reason could silently kill AI-citation visibility with nothing in the
  // file to catch it.
  //
  // PerplexityBot is NOT treated like GPTBot/Applebot-Extended below (also
  // blocked): those companies split "training crawler" from "live per-query
  // retrieval crawler" into separate user-agents, so blocking the training
  // one costs zero citation visibility. Perplexity doesn't split cleanly —
  // PerplexityBot also feeds the standing index their answers draw from,
  // not just Perplexity-User's live fetches — so blocking it would
  // plausibly cost real citations in a research-heavy category like real
  // estate. It gets an explicit allow rule alongside the retrieval agents.
  //
  // GPTBot deliberately stays blocked (2026-09-08 decision): it's OpenAI's
  // training crawler, not the one that powers ChatGPT search citations
  // (that's OAI-SearchBot, already allowed) — blocking it costs no citation
  // visibility while avoiding unrestricted training-data use of the site's
  // content. anthropic-ai and Claude-Web (previously blocked here) are
  // retired agent names Anthropic no longer uses; ClaudeBot is the live one
  // and is explicitly allowed below instead.
  const blockedAiAgents = ["GPTBot", "CCBot", "Bytespider", "Applebot-Extended", "cohere-ai"];

  // Live retrieval/citation agents — explicitly allowed, not just left to
  // fall through the wildcard rule. See comment above for why each is here.
  const allowedAiAgents = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "Perplexity-User",
    "PerplexityBot",
    "ClaudeBot",
    "Google-Extended",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // "/*?*" used to blanket-disallow every query-string URL, including
        // the homepage's own "Trending Searches" links and every filtered
        // listing state.
        //
        // /project-listing/compare/ was briefly left crawlable (SEO audit
        // H-01, 2026-09-08) specifically so a stale indexed pair could 404
        // and cleanly deindex, rather than sit as "Indexed, though blocked
        // by robots.txt". Reversed 2026-09-12: with ~1,165+ real Gurgaon
        // projects (all publicly listed in /sitemap/projects.xml) the valid
        // city/slugA/slugB space is ~n²/2 — hundreds of thousands of real,
        // renderable URLs, every guess a full function invocation + ISR
        // write + origin transfer (dynamicParams defaults to true here by
        // design, see that route's own comment). That combinatorial crawl
        // surface was the single largest driver of the account blowing
        // through its Fluid Active CPU, Fast Origin Transfer and ISR-write
        // budgets. Compare pages are noindex,follow already (not earning
        // rankings), so the cost of the occasional stale pair staying
        // "indexed, though blocked" is worth it against that.
        disallow: ["/api/", "/project-listing/compare/"],
      },
      ...allowedAiAgents.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
      ...blockedAiAgents.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    // SEO audit H-05 (2026-09-08): app/sitemap.ts now uses generateSitemaps()
    // to split the 2,967-URL sitemap into 7 segments so Search Console can
    // report indexation per segment. Next.js doesn't auto-build a
    // <sitemapindex> for generateSitemaps() output, so all 7 are listed here
    // directly — multiple Sitemap: lines is a Google-supported equivalent to
    // a formal index file.
    sitemap: [
      `${baseUrl}/sitemap/projects.xml`,
      `${baseUrl}/sitemap/sectors.xml`,
      `${baseUrl}/sitemap/developers.xml`,
      `${baseUrl}/sitemap/buy.xml`,
      `${baseUrl}/sitemap/rent.xml`,
      `${baseUrl}/sitemap/commercial.xml`,
      `${baseUrl}/sitemap/content.xml`,
    ],
  };
}
