import { NextResponse, type NextRequest } from "next/server";
import { captureSnapshot } from "@/lib/index/snapshot";
import { currentMonth } from "@/lib/index/types";

// Monthly capture for the Gurgaon Property Index (2026-09-22, checklist
// item 20: "Store a snapshot every month").
//
// Called by a scheduler rather than by a visitor. On Vercel that is a cron
// entry in vercel.json hitting this path on the 1st of each month; anything
// that can issue an authenticated GET works equally well.
//
// SAFE TO CALL REPEATEDLY, and that is the design rather than a caveat. The
// unique index on (month, scope) means the first call in a month writes the
// row and every later call in that month is rejected at the database and
// counted as alreadyRecorded. A cron that fires daily therefore produces
// exactly one snapshot per month, written on the 1st — and a cron that misses
// its day still captures when it next runs. Neither can overwrite a month that
// is already on record, which is the property item 21 depends on.
//
// AUTHENTICATION. CRON_SECRET as a bearer token, the same variable
// /api/status/sync already uses — Vercel Cron sends it automatically when the
// env var is set, so a separate secret would simply have failed to
// authenticate against the cron entry added in vercel.json. Without it set the
// route refuses rather than running open: this endpoint writes to a permanent,
// append-only record, and an unauthenticated caller could fill the current
// month with a snapshot taken at a moment of their choosing, which cannot then
// be corrected without a manual delete.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
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

  // The month is never taken from the request. Allowing a caller to name a
  // month would let a backfill be written for a month we hold no data for,
  // which is the one thing item 21 forbids.
  const month = currentMonth();

  try {
    const result = await captureSnapshot(month);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[index-snapshot] capture failed", err);
    return NextResponse.json(
      { error: "capture failed", month, detail: (err as Error)?.message },
      { status: 500 }
    );
  }
}
