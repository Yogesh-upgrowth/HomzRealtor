"use client";

import { useState } from "react";
import { toast } from "sonner";

// DEV-08/DEV-07 (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17): the real
// seller process/fee/verification rules are still owner-pending (DEV-07).
// This deliberately does NOT present a process, fee structure, exclusivity
// term or verification step as fact -- it only captures interest and lets
// the team follow up, same /api/contact path every other lead form here
// uses. Expand once DEV-07 is answered; do not guess policy to fill this
// page out.
export default function SellPropertyForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, interest: "Sell your property", source: "sell-property-in-gurgaon" }),
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
          <label htmlFor="sell-name" className={labelCls}>Full Name</label>
          <input id="sell-name" name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="sell-phone" className={labelCls}>Phone Number</label>
          <input id="sell-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" required className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="sell-email" className={labelCls}>Email Address</label>
        <input id="sell-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email Address" required className={inputCls} />
      </div>
      <div>
        <label htmlFor="sell-location" className={labelCls}>Property Location (Sector/Society)</label>
        <input id="sell-location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Sector 65, Gurgaon" required className={inputCls} />
      </div>
      <div>
        <label htmlFor="sell-message" className={labelCls}>Tell us about your property (optional)</label>
        <textarea
          id="sell-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Type, size, expected price, or anything else useful"
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
