// Real <sitemapindex> content, served at the conventional /sitemap.xml path
// via a rewrite in next.config.ts (not a route literally named
// app/sitemap.xml/route.ts — that was tried 2026-09-16 and reliably failed
// Vercel's production build: Next.js/Turbopack reserves the exact filename
// "sitemap.xml" for its own metadata-route convention, and creating a
// second route there fails with "Conflicting route and metadata at
// /sitemap.xml". A local `next build --webpack` run didn't catch that
// conflict, which is how it shipped once before being reverted the same
// day — this route lives under a name Next has no reserved meaning for
// ("sitemap-index.xml"), and next.config.ts's rewrite maps the public,
// conventional /sitemap.xml URL to it at the routing layer, so Next's
// build-time file scanner never sees a literal "sitemap.xml" route file
// at all. Verified against both `next build --webpack` and plain
// `next build` (Turbopack, matching Vercel exactly) before shipping this
// version.
import { NextResponse } from "next/server";

const BASE_URL = "https://www.homzrealtor.com";

// Must match app/sitemap.ts's own SEGMENT_IDS exactly — duplicated here
// (rather than imported) since app/sitemap.ts's generateSitemaps() export
// is a Next.js route-config convention, not a plain function this route
// handler can safely import from without pulling in that whole module.
const SEGMENT_IDS = ["projects", "sectors", "developers", "buy", "rent", "commercial", "content"] as const;

export const revalidate = 3600;

export async function GET() {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    SEGMENT_IDS.map((id) => `  <sitemap><loc>${BASE_URL}/sitemap/${id}.xml</loc></sitemap>`).join("\n") +
    `\n</sitemapindex>\n`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
