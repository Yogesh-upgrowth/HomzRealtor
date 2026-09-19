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

// [[owner-input: owner-call-log]]
//
// Homz needs one source of truth for "an advisor spoke to the owner of this
// unit on this date and confirmed it is available at this price". Options, in
// order of how quickly they could be wired:
//
//   a) A Google Sheet the calling team already keeps, with columns
//      homz_listing_id | called_at | outcome | confirmed_price | agent.
//      Read it the same way /api/contact writes: one Apps Script endpoint.
//   b) A `listing_verifications` collection in the existing MongoDB, written
//      by a small form in /admin. Best long-term; needs the admin screen.
//   c) The CRM, if enquiries already route to one.
//
// Until one is chosen this resolver returns null and the page degrades
// honestly. Set OWNER_CALL_LOG_SOURCE and implement readOwnerCallLog() below.
const OWNER_CALL_LOG_SOURCE: "none" | "sheet" | "mongo" | "crm" = "none";

async function readOwnerCallLog(
  _listingId: string
): Promise<{ verifiedAt: string } | null> {
  if (OWNER_CALL_LOG_SOURCE === "none") return null;
  // Implement against the chosen source above. Deliberately unimplemented
  // rather than stubbed with a plausible date: a wrong "verified on" date on a
  // property page is a trust claim Homz cannot stand behind.
  return null;
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
