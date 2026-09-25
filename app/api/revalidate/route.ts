import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { clearSegmentCache } from "@/lib/listings/segmentCache";

// On-demand revalidation after a completed scraper run (SEO audit
// 2026-09-25, §1.1 / B10).
//
// The listing and project routes use 7- and 14-day ISR windows because
// shorter ones got the Vercel project paused on 2026-09-09 (see
// app/buy-property/[city]/[slug]/page.tsx). Shortening them again would
// regenerate ~38k pages on a timer whether or not the feed moved. This lets
// the scraper say "the feed moved" instead: one authenticated POST at the
// end of each successful run marks every catalogue route stale, and each page
// regenerates on its next request. A sold listing then leaves the site within
// hours of the scrape, not up to two weeks later, and nothing regenerates on
// days the feed did not change.
//
// Paths are revalidated at the "layout" level, which covers every dynamic
// segment beneath them. The sitemap already revalidates hourly on its own.
//
// AUTH: CRON_SECRET as a bearer token, the same variable the other cron
// routes use. Without it set the route refuses rather than running open —
// an unauthenticated caller could otherwise force mass regeneration.
export const dynamic = "force-dynamic";

const CATALOGUE_ROOTS = [
  "/buy-property",
  "/rent-property",
  "/commercial",
  "/pg-property",
  "/project-listing",
  "/developer",
  "/property-rates-in-gurgaon",
  "/gurgaon-property-index",
  "/",
];

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured; refusing to run unauthenticated." },
      { status: 503 }
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const clearedSegments = clearSegmentCache();
  for (const path of CATALOGUE_ROOTS) revalidatePath(path, "layout");

  return NextResponse.json(
    { revalidated: CATALOGUE_ROOTS, clearedSegments, at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
