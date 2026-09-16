// Durable /sitemap.xml index — DEV-01 (2026-09-16). Next's generateSitemaps()
// in app/sitemap.ts serves the flat /sitemap.xml path itself only when there
// is a single segment; with 7 segments it serves at /sitemap/[id].xml
// instead, so a bare /sitemap.xml request — the URL any tool or crawler
// tries first by convention — 404'd with nothing registered here.
// app/robots.ts already lists all 7 child files individually (a
// Google-supported equivalent to a formal index), but a real
// <sitemapindex> at the canonical path is worth having in addition, not
// instead of that.
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
    headers: { "Content-Type": "application/xml" },
  });
}
