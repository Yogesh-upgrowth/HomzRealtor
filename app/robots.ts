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
  // deliberately allowed so the site can be cited in AI answers.
  //
  // PerplexityBot is NOT in this list, unlike GPTBot/anthropic-ai/
  // Applebot-Extended: those companies split "training crawler" from
  // "live per-query retrieval crawler" into separate user-agents, so
  // blocking the training one costs zero citation visibility. Perplexity
  // doesn't split cleanly — PerplexityBot also feeds the standing index
  // their answers draw from, not just Perplexity-User's live fetches — so
  // blocking it would plausibly cost real citations in a research-heavy
  // category like real estate.
  const blockedAiAgents = [
    "GPTBot",
    "anthropic-ai",
    "Claude-Web",
    "CCBot",
    "Applebot-Extended",
    "cohere-ai",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // "/*?*" used to blanket-disallow every query-string URL, including
        // the homepage's own "Trending Searches" links and every filtered
        // listing state. Comparison pages are the one genuinely unbounded
        // URL space (city × project-pair), so those stay disallowed instead.
        disallow: ["/api/", "/project-listing/compare/"],
      },
      ...blockedAiAgents.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
