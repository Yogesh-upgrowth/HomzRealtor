// The owner-call verification log (2026-09-19).
//
// "Homz-verified on [date]" on a property page is a trust claim, and a trust
// claim needs a record behind it. A phone number is not that record: it says
// who calls, not which unit was confirmed on which date at which price. This
// is the record.
//
// One document per confirmed call, keyed by the Homz listing ID so it survives
// the source posting being replaced, reworded or re-listed by another broker
// (see lib/listings/identity.ts). lib/status/verification.ts reads the most
// recent entry per listing; the detail page shows "Confirmed with the owner on
// X" only when one exists, and "listing last checked X" otherwise.

import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type VerificationOutcome =
  /** Owner confirmed the unit is available at the stated price. */
  | "available"
  /** Owner confirmed availability but at a different price. */
  | "price_changed"
  /** Owner says the unit is sold, let, or withdrawn. */
  | "unavailable"
  /** Could not reach the owner. Recorded so repeated failures are visible,
   *  but it is NOT a verification and never surfaces as one. */
  | "no_answer";

export type VerificationLogDoc = {
  _id?: ObjectId;
  /** Homz listing ID, e.g. "HZ-GGN-S-4K2P9A". */
  listing_id: string;
  /** When the call happened. */
  called_at: Date;
  /** What the owner said. */
  outcome: VerificationOutcome;
  /** Price the owner confirmed, in INR, when they gave one. */
  confirmed_price_inr: number | null;
  /** Which Homz number placed the call. */
  agent_phone: string;
  /** The signed-in user who logged it, for accountability. */
  logged_by: string;
  notes: string | null;
  created_at: Date;
};

const COLLECTION = "listing_verifications";

export async function getVerificationLogCollection() {
  const db = await getDb();
  const col = db.collection<VerificationLogDoc>(COLLECTION);
  // Most reads are "latest confirmation for this listing".
  await col.createIndex({ listing_id: 1, called_at: -1 }).catch(() => {});
  return col;
}

/** Only these outcomes mean the unit was actually confirmed available. A
 *  no_answer is a call attempt, not a verification, and must never render as
 *  one -- that distinction is the whole point of this log. */
const CONFIRMING_OUTCOMES: VerificationOutcome[] = ["available", "price_changed"];

export async function recordVerification(
  entry: Omit<VerificationLogDoc, "_id" | "created_at">
): Promise<void> {
  const col = await getVerificationLogCollection();
  await col.insertOne({ ...entry, created_at: new Date() });
}

/** The most recent confirming call for a listing, or null. */
export async function latestVerification(
  listingId: string
): Promise<{ verifiedAt: string; confirmedPriceInr: number | null } | null> {
  const col = await getVerificationLogCollection();
  const doc = await col
    .find({ listing_id: listingId, outcome: { $in: CONFIRMING_OUTCOMES } })
    .sort({ called_at: -1 })
    .limit(1)
    .next();
  if (!doc) return null;
  return {
    verifiedAt: doc.called_at.toISOString(),
    confirmedPriceInr: doc.confirmed_price_inr,
  };
}

/** Counts for the admin screen, so the team can see coverage growing. */
export async function verificationStats(): Promise<{
  confirmed: number;
  last7Days: number;
}> {
  const col = await getVerificationLogCollection();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [confirmed, last7Days] = await Promise.all([
    col.countDocuments({ outcome: { $in: CONFIRMING_OUTCOMES } }),
    col.countDocuments({
      outcome: { $in: CONFIRMING_OUTCOMES },
      called_at: { $gte: weekAgo },
    }),
  ]);
  return { confirmed, last7Days };
}
