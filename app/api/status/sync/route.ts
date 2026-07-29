import { NextResponse } from "next/server";
import { CITY_KEYS } from "@/lib/scraping/homzbackend";
import { syncAllCities, syncCityStatus } from "@/lib/status/sync";

// Full sweep of 5 cities × 2 feed segments + Mongo writes needs headroom
// beyond the serverless default.
export const maxDuration = 60;

// Protected sync trigger. Vercel Cron calls GET with
// `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is
// set; any external scheduler can send the same header. POST supports manual
// runs (e.g. curl) with the same auth.
async function handleSync(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Refuse to run unprotected — an open sync endpoint is a free DoS lever.
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const city = new URL(req.url).searchParams.get("city");
  if (city && !CITY_KEYS.includes(city as (typeof CITY_KEYS)[number])) {
    return NextResponse.json({ error: `Unknown city: ${city}` }, { status: 400 });
  }

  try {
    const summaries = city ? [await syncCityStatus(city)] : await syncAllCities();
    return NextResponse.json({ ok: true, summaries });
  } catch (error) {
    console.error("[status/sync] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleSync(req);
}

export async function POST(req: Request) {
  return handleSync(req);
}
