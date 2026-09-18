import { NextResponse } from "next/server";
import { getSortedSegment } from "@/lib/listings/segmentCache";
import { propertySegment } from "@/lib/scraping/homzbackend";
import { getProjectsForCity, getSectorsForCity, getAllBuilders, getComparePairKeys } from "@/lib/intelligence/projects";

// Real listings only exist for Gurgaon today — every other NCR city renders
// a live but empty "being updated" page, so warming their caches would just
// spend cron time fetching nothing.
const CITY_KEY = "ggn";
const CATEGORIES = ["Sale", "Rent", "Pg", "Commercial"] as const;

// Room for several segment fetches (each ~6-8s cold, per live measurement)
// plus the projects-intelligence calls, run in parallel below.
export const maxDuration = 60;

// Both lib/listings/segmentCache.ts (1h TTL) and lib/intelligence/projects.ts
// (30min TTL) are process-lifetime in-memory caches -- they reset on a cold
// Fluid Compute instance, and a real visitor landing on one pays the full
// fetch+parse+sort cost live (measured: ~6-8s for /buy-property or
// /rent-property on a cold instance, matching the "navigation feels slow"
// report this cron exists to fix). Running this on a schedule comfortably
// under both TTLs means the *currently warm* instance Fluid keeps reusing
// never actually lets either cache expire, so most real requests hit an
// already-warm cache instead of paying that cost themselves. It cannot
// guarantee a brand-new instance spun up mid-traffic-burst is warm on its
// very first request -- that's a structural property of per-instance
// in-memory caching under elastic scaling, not something a cron can fix --
// but it removes the far more common case of a cache simply going cold
// from inactivity between real visits.
async function warm(): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all([
    ...CATEGORIES.map(async (category) => {
      const key = `listings:${category}`;
      try {
        const { sorted } = await getSortedSegment(propertySegment(CITY_KEY, category));
        results[key] = `ok (${sorted.length})`;
      } catch (error) {
        results[key] = `error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }),
    (async () => {
      try {
        const projects = await getProjectsForCity(CITY_KEY);
        results["projects"] = `ok (${projects.length})`;
      } catch (error) {
        results["projects"] = `error: ${error instanceof Error ? error.message : String(error)}`;
      }
    })(),
    (async () => {
      try {
        const sectors = await getSectorsForCity(CITY_KEY);
        results["sectors"] = `ok (${sectors.length})`;
      } catch (error) {
        results["sectors"] = `error: ${error instanceof Error ? error.message : String(error)}`;
      }
    })(),
    (async () => {
      try {
        const builders = await getAllBuilders();
        results["builders"] = `ok (${builders.length})`;
      } catch (error) {
        results["builders"] = `error: ${error instanceof Error ? error.message : String(error)}`;
      }
    })(),
    (async () => {
      try {
        const pairs = await getComparePairKeys();
        results["comparePairs"] = `ok (${pairs.size})`;
      } catch (error) {
        results["comparePairs"] = `error: ${error instanceof Error ? error.message : String(error)}`;
      }
    })(),
  ]);

  return results;
}

// Protected the same way as /api/status/sync: Vercel Cron sends
// `Authorization: Bearer ${CRON_SECRET}` automatically when that env var is
// set; any external scheduler (or a manual curl) can use the same header.
async function handleWarm(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Refuse to run unprotected -- an open warming endpoint is a free lever
    // to force repeated expensive recomputation.
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await warm();
  return NextResponse.json({ ok: true, results });
}

export async function GET(req: Request) {
  return handleWarm(req);
}

export async function POST(req: Request) {
  return handleWarm(req);
}
