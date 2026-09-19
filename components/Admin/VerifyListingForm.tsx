"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

// Logs one owner-confirmation call (2026-09-19).
//
// Deliberately minimal: an advisor is doing this between calls, so it is a
// listing ID, an outcome, and optionally the price the owner restated. Anything
// more and it stops getting filled in, and a verification log nobody updates is
// worse than none -- the property pages would show stale "verified" dates.

type Stats = { confirmed: number; last7Days: number };

const OUTCOMES = [
  { value: "available", label: "Available at the listed price" },
  { value: "price_changed", label: "Available, price changed" },
  { value: "unavailable", label: "Sold / let / withdrawn" },
  { value: "no_answer", label: "Could not reach the owner" },
] as const;

export default function VerifyListingForm({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [listingId, setListingId] = useState("");
  const [outcome, setOutcome] = useState<string>("available");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";
  const labelCls = "mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-gray-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listingId.trim().toUpperCase(),
          outcome,
          confirmedPriceInr: price.trim() ? Number(price.replace(/[^\d.]/g, "")) : null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          outcome === "no_answer"
            ? "Call attempt logged (not a verification)"
            : "Verification recorded"
        );
        if (data.stats) setStats(data.stats);
        setListingId("");
        setPrice("");
        setNotes("");
      } else {
        toast.error(
          data?.error?.code === "invalid_body"
            ? "Check the listing ID format (HZ-GGN-S-XXXXXX)"
            : "Could not record that. Try again."
        );
      }
    } catch {
      toast.error("Server error. Try again.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Listings verified
          </p>
          <p className="mt-1.5 text-3xl font-bold text-white">{stats.confirmed}</p>
        </div>
        <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Last 7 days
          </p>
          <p className="mt-1.5 text-3xl font-bold text-[#CEA44E]">{stats.last7Days}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/[0.08] bg-[#141416] p-7 flex flex-col gap-4">
        <div>
          <label htmlFor="v-listing" className={labelCls}>
            Homz listing ID
          </label>
          <input
            id="v-listing"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="HZ-GGN-S-4K2P9A"
            required
            className={`${inputCls} font-mono`}
          />
          <p className="mt-1.5 text-[12px] text-gray-500">
            Shown in the HomzRealtor record section at the bottom of every property page.
          </p>
        </div>

        <div>
          <label htmlFor="v-outcome" className={labelCls}>
            What did the owner say?
          </label>
          <select
            id="v-outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className={inputCls}
          >
            {OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {outcome === "no_answer" && (
            <p className="mt-1.5 text-[12px] text-[#f0967f]">
              Logged as an attempt. The property page will not show a verified date for it.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="v-price" className={labelCls}>
            Price the owner confirmed (optional)
          </label>
          <input
            id="v-price"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="in rupees, e.g. 7000000"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="v-notes" className={labelCls}>
            Notes (optional)
          </label>
          <textarea
            id="v-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputCls} resize-vertical`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 text-[15px] font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Recording…" : "Record call"}
        </button>
      </form>
    </div>
  );
}
