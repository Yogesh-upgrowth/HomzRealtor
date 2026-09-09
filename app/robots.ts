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
        // /project-listing/compare/ used to be disallowed here too, as a
        // guard against its combinatorial (city x project-pair) URL space.
        // That backfired: a retired pair 404s correctly (confirmed live —
        // a real 404, not a soft one), but a robots.txt block stops Google
        // from ever re-crawling a URL it already indexed, so a stale
        // compare URL just sits in the index forever as "Indexed, though
        // blocked by robots.txt" instead of getting dropped. Compare pages
        // are still a real, actively-linked feature (SimilarProjects,
        // SectorCompareTeaser) between real projects, and an invalid guess
        // is a cheap, fast 404 rather than an expensive render — allowing
        // the crawl is worth it for letting stale URLs actually deindex.
        disallow: ["/api/"],
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
