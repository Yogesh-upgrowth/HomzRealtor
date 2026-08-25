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
      ...blockedAiAgents.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
