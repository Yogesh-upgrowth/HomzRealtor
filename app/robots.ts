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
  // ChatGPT-User, Perplexity-User, Claude-SearchBot, Claude-User, and
  // Google-Extended (which also gates eligibility for Google AI Overviews
  // grounding) — are deliberately allowed so the site can be cited in AI
  // answers. These get their own explicit `allow` rules below rather than
  // relying on the wildcard `User-Agent: *` fallback — SEO audit (C-01,
  // 2026-09-08) flagged that as fragile: a future edit to the wildcard rule
  // for an unrelated reason could silently kill AI-citation visibility with
  // nothing in the file to catch it.
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
  // content.
  //
  // Anthropic (DEV-03, 2026-09-16 — corrected per Anthropic's own published
  // crawler docs): anthropic-ai and Claude-Web (previously blocked here)
  // are retired agent names Anthropic no longer uses. The three live
  // tokens split the same way OpenAI's do: Claude-SearchBot (search),
  // Claude-User (user-triggered retrieval) and ClaudeBot (possible
  // training). This file previously allowed only ClaudeBot, which is the
  // wrong one for the stated "allow citation, block training" policy — the
  // same mismatch this policy already avoids for every other vendor.
  // Claude-SearchBot/Claude-User are now the ones explicitly allowed;
  // ClaudeBot moves to blockedAiAgents alongside GPTBot for consistency.
  const blockedAiAgents = ["GPTBot", "CCBot", "Bytespider", "Applebot-Extended", "cohere-ai", "ClaudeBot"];

  // Live retrieval/citation agents — explicitly allowed, not just left to
  // fall through the wildcard rule. See comment above for why each is here.
  const allowedAiAgents = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "Perplexity-User",
    "PerplexityBot",
    "Claude-SearchBot",
    "Claude-User",
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
        // /project-listing/compare/ was blocked 2026-09-12 through
        // 2026-09-16: with ~7,500+ real projects (all publicly listed in
        // /sitemap/projects.xml) the valid city/slugA/slugB space is
        // ~n²/2 — hundreds of thousands of real, renderable URLs, and with
        // no gate at the route level every guess was a full function
        // invocation + ISR write + origin transfer, the single largest
        // driver of the account's Fluid Active CPU/origin-transfer/ISR-write
        // overage. Blocking crawl also meant Google could never see this
        // route's own noindex tag on non-curated pairs (DEV-03) — a
        // robots-blocked page's meta tags are invisible to the crawler that
        // would read them — so a stale indexed pair couldn't cleanly
        // deindex either. Unblocked 2026-09-16 once
        // getComparePairKeys() (lib/intelligence/projects.ts) gated the
        // route itself: only pairs actually linked from real project pages
        // render (cheap, cached, sub-millisecond check); everything else
        // 404s before either expensive project lookup runs. See that
        // route's own comment.
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
    // <sitemapindex> for generateSitemaps() output, so all 7 stayed listed
    // here directly — multiple Sitemap: lines is a Google-supported
    // equivalent to a formal index file. DEV-01 (2026-09-16) added a real
    // <sitemapindex> at /sitemap.xml (app/sitemap.xml/route.ts) for tools
    // that only try the conventional path — listed first, in addition to
    // (not instead of) the 7 direct entries, which stay for GSC's
    // per-segment indexation reporting.
    sitemap: [
      `${baseUrl}/sitemap.xml`,
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
