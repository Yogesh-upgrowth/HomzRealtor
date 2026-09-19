import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import {
  recordVerification,
  verificationStats,
  type VerificationOutcome,
} from "@/lib/status/verificationLog";
import { VERIFICATION_CALLER_PHONE } from "@/lib/status/verification";

// Records one owner-confirmation call against a listing (2026-09-19).
//
// This is what turns "Homz-verified on [date]" on a property page from a
// slogan into a claim with a record behind it. Admin-gated: a verification is
// an assertion the business makes to buyers, so it needs an accountable,
// signed-in author, and every entry stores who logged it.

const bodySchema = z.object({
  listingId: z
    .string()
    .trim()
    .regex(/^HZ-[A-Z]{3}-[SRCP]-[A-Z0-9]{6}$/, "Not a Homz listing ID"),
  outcome: z.enum(["available", "price_changed", "unavailable", "no_answer"]),
  // Optional: the owner may confirm availability without restating a price.
  confirmedPriceInr: z.number().positive().finite().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  // Defaults to now; allows logging a call made earlier in the day.
  calledAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "invalid_json" } },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "invalid_body", issues: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { listingId, outcome, confirmedPriceInr, notes, calledAt } = parsed.data;

  try {
    await recordVerification({
      listing_id: listingId,
      called_at: calledAt ? new Date(calledAt) : new Date(),
      outcome: outcome as VerificationOutcome,
      confirmed_price_inr: confirmedPriceInr ?? null,
      agent_phone: VERIFICATION_CALLER_PHONE,
      logged_by: auth.user.email,
      notes: notes ?? null,
    });
    const stats = await verificationStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Failed to record verification:", error);
    return NextResponse.json(
      { success: false, error: { code: "write_failed" } },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ success: true, stats: await verificationStats() });
  } catch {
    return NextResponse.json({ success: false, error: { code: "read_failed" } }, { status: 500 });
  }
}
