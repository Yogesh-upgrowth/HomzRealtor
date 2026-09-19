"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

// DEV-08/DEV-07 (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17): the real
// seller process/fee/verification rules are still owner-pending (DEV-07).
// This deliberately does NOT present a process, fee structure, exclusivity
// term or verification step as fact -- it only captures interest and lets
// the team follow up, same /api/contact path every other lead form here
// uses. Expand once DEV-07 is answered; do not guess policy to fill this
// page out.
// R19-08 (2026-09-19): parameterised so the landlord journey reuses this
// instead of becoming a fifth hand-rolled copy of the same fetch/toast block.
// Defaults keep the existing seller behaviour unchanged.
type Props = {
  /** Sent as `interest`, and used to label the lead. */
  interest?: string;
  /** Sent as `source`, so operations can tell the journeys apart. */
  source?: string;
  /** Prefix for field ids, so two forms on one page never collide. */
  idPrefix?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
};

export default function SellPropertyForm({
  interest = "Sell your property",
  source = "sell-property-in-gurgaon",
  idPrefix = "sell",
  messageLabel = "Tell us about your property (optional)",
  messagePlaceholder = "Type, size, expected price, or anything else useful",
}: Props = {}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // R19-05 parity with the other lead forms: `loading` is state and does not
    // reach the button's disabled attribute until the next render.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      setLoading(true);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, interest, source }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Thanks! Our team will get in touch shortly.");
        setSubmitted(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const inputCls =
    "w-full rounded-xl bg-[#1a1a1d] border border-white/10 px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";
  const labelCls = "mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-gray-500";

  if (submitted) {
    return (
      <div className="rounded-[24px] border border-white/[0.08] bg-[#141416] p-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#63C08D]/40 bg-[#63C08D]/14 text-2xl text-[#7fd3a5]">
          ✓
        </div>
        <p className="mb-2 text-lg font-extrabold text-white">Thank you!</p>
        <p className="text-sm leading-relaxed text-gray-400">
          Our team will get in touch shortly to discuss your property.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/[0.08] bg-[#141416] p-7 flex flex-col gap-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-name`} className={labelCls}>Full Name</label>
          <input id={`${idPrefix}-name`} name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className={inputCls} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-phone`} className={labelCls}>Phone Number</label>
          <input id={`${idPrefix}-phone`} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" required className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-email`} className={labelCls}>Email Address</label>
        <input id={`${idPrefix}-email`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email Address" required className={inputCls} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-location`} className={labelCls}>Property Location (Sector/Society)</label>
        <input id={`${idPrefix}-location`} name="location" value={form.location} onChange={handleChange} placeholder="e.g. Sector 65, Gurgaon" required className={inputCls} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-message`} className={labelCls}>{messageLabel}</label>
        <textarea
          id={`${idPrefix}-message`}
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder={messagePlaceholder}
          rows={3}
          className={`${inputCls} resize-vertical`}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 text-[15px] font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-60 cursor-pointer"
      >
        {loading ? "Submitting…" : "Get in Touch"}
      </button>
    </form>
  );
}
