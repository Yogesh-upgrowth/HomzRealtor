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

  const blockedAiAgents = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Google-Extended",
    "PerplexityBot",
    "Perplexity-User",
    "ClaudeBot",
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
        disallow: ["/api/", "/*?*"],
      },
      ...blockedAiAgents.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
