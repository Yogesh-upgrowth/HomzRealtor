import { NextResponse, after } from "next/server";
import { CITY_PARAM_MAP } from "@/lib/intelligence/projects";
import { getPropertyStatus, refreshCityStatusIfStale } from "@/lib/status/queries";

// Public: current status + recent change events for one property. Every hit
// also schedules a background re-check of the property's city when its data
// is stale — this is the "user looked at it, go verify it" trigger.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ city: string; slug: string }> }
) {
  const { city, slug } = await params;
  const cityKey = CITY_PARAM_MAP[city.toLowerCase()] || city;

  after(() => refreshCityStatusIfStale(cityKey));

  const view = await getPropertyStatus(cityKey, slug);
  if (!view) {
    return NextResponse.json(
      { tracked: false },
      { status: 404, headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }

  const { status, events } = view;
  return NextResponse.json(
    {
      tracked: true,
      status: {
        slug: status.slug,
        title: status.project_title,
        status: status.status,
        listed: status.listed,
        priceText: status.price_text,
        possession: status.possession_text,
        lastCheckedAt: status.last_checked_at.toISOString(),
        lastChangedAt: status.last_changed_at?.toISOString() ?? null,
        firstSeenAt: status.first_seen_at.toISOString(),
      },
      events: events.map((e) => ({
        at: e.at.toISOString(),
        type: e.type,
        from: e.from,
        to: e.to,
        source: e.source,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
