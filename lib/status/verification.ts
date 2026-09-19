// Listing verification and history (2026-09-19).
//
// "Homz-verified on [date]" is only worth showing if it means something. This
// module reads the two sources that can back it:
//
//   1. The existing status collections (lib/status/*), which the feed-diffing
//      sync engine already writes — first_seen_at, last_checked_at,
//      last_changed_at, plus a status_events log of listed / delisted /
//      status_change / price_change. That gives a real price and status
//      history per unit, which the source portal does not publish.
//
//   2. The owner-call log — the record of an advisor actually ringing the
//      owner to confirm the unit is still available at the stated price. THAT
//      is what "verified" should mean on a property page, and it is the one
//      input Homz has to supply. See OWNER_CALL_LOG below.
//
// Nothing here fabricates a verification. When the call log is not wired,
// `verifiedAt` is null and the page says the listing is tracked, not verified.

import { getStatusCollections } from "./db";
import type { StatusEventDoc } from "./types";
import { latestVerification } from "./verificationLog";

export type PricePoint = { at: string; priceText: string | null; priceInr: number | null };
export type StatusPoint = { at: string; from: string | null; to: string | null };

export type ListingVerification = {
  /** ISO date an advisor last confirmed this unit with the owner, from the
   *  call log. null until that log is connected — never inferred from a feed
   *  timestamp, which only proves the listing still exists somewhere. */
  verifiedAt: string | null;
  /** When the feed was last checked for this unit. Weaker than verifiedAt and
   *  labelled differently in the UI. */
  lastCheckedAt?: string | null;
  /** First time Homz saw this unit, so the page can state how long it has
   *  been tracked. */
  trackingSince?: string | null;
  priceHistory: PricePoint[];
  statusHistory: StatusPoint[];
};

// Owner-call log: wired 2026-09-19 to the Mongo-backed record in
// lib/status/verificationLog.ts (option (b) of the three originally listed).
// The owner supplied the calling number, 8447909227; that identifies who
// calls, not which unit was confirmed when, so the log itself is what makes
// "Homz-verified on [date]" a claim the site can stand behind.
//
// Entries are written from /api/admin/verify-listing, which the admin screen
// posts to after an advisor rings the owner. Until a listing has a confirming
// entry this still returns null and the page says "listing last checked",
// which is the weaker, true statement.
const OWNER_CALL_LOG_SOURCE: "none" | "sheet" | "mongo" | "crm" = "mongo";

/** The Homz number advisors call owners from. Recorded against each entry so
 *  a verification is attributable, and shown nowhere public. */
export const VERIFICATION_CALLER_PHONE = "8447909227";

async function readOwnerCallLog(
  listingId: string
): Promise<{ verifiedAt: string } | null> {
  if (OWNER_CALL_LOG_SOURCE !== "mongo") return null;
  const hit = await latestVerification(listingId).catch(() => null);
  return hit ? { verifiedAt: hit.verifiedAt } : null;
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getListingVerification(args: {
  cityKey: string;
  slug: string;
  listingId: string;
}): Promise<ListingVerification> {
  const empty: ListingVerification = {
    verifiedAt: null,
    lastCheckedAt: null,
    trackingSince: null,
    priceHistory: [],
    statusHistory: [],
  };

  const callLog = await readOwnerCallLog(args.listingId).catch(() => null);

  let statusDoc: Record<string, unknown> | null = null;
  let events: StatusEventDoc[] = [];
  try {
    const { statuses, events: eventsCol } = await getStatusCollections();
    statusDoc = (await statuses.findOne({
      city_key: args.cityKey,
      slug: args.slug,
    })) as Record<string, unknown> | null;
    events = (await eventsCol
      .find({ city_key: args.cityKey, slug: args.slug })
      .sort({ at: 1 })
      .limit(50)
      .toArray()) as StatusEventDoc[];
  } catch {
    // Mongo unavailable (local dev, cold start, missing URI) — the page still
    // renders, just without history. Never a 500 over a nice-to-have.
    return { ...empty, verifiedAt: callLog?.verifiedAt ?? null };
  }

  const priceHistory: PricePoint[] = events
    .filter((e) => e.type === "price_change")
    .map((e) => ({
      at: toIso(e.at) ?? "",
      priceText: e.to ?? null,
      priceInr: null,
    }))
    .filter((p) => p.at);

  const statusHistory: StatusPoint[] = events
    .filter((e) => e.type === "status_change" || e.type === "listed" || e.type === "delisted")
    .map((e) => ({ at: toIso(e.at) ?? "", from: e.from ?? null, to: e.to ?? null }))
    .filter((p) => p.at);

  return {
    verifiedAt: callLog?.verifiedAt ?? null,
    lastCheckedAt: toIso(statusDoc?.last_checked_at as Date | undefined),
    trackingSince: toIso(statusDoc?.first_seen_at as Date | undefined),
    priceHistory,
    statusHistory,
  };
}
