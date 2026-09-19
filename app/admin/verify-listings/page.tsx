import VerifyListingForm from "@/components/Admin/VerifyListingForm";
import { verificationStats } from "@/lib/status/verificationLog";

// Owner-call verification (2026-09-19).
//
// Every property page is wired to show "Confirmed with the owner on [date]",
// but only for listings that actually have a confirming call logged. This is
// where advisors log them. Without this screen the claim has no record behind
// it and the pages correctly fall back to the weaker "listing last checked".

export const dynamic = "force-dynamic";

export default async function VerifyListingsPage() {
  const stats = await verificationStats().catch(() => ({ confirmed: 0, last7Days: 0 }));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Verify listings</h1>
      <p className="mb-7 max-w-2xl text-[14px] leading-relaxed text-gray-400">
        After ringing an owner to confirm a unit is still available, log it here.
        The property page then shows the confirmation date to buyers. Calls that
        did not reach the owner can be logged too, and are never shown as a
        verification.
      </p>
      <VerifyListingForm initialStats={stats} />
    </div>
  );
}
