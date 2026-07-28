"use client";

import { useState } from "react";
import { toast } from "sonner";
import { buildWhatsAppHref } from "@/lib/intelligence/whatsapp";

type Props = {
  projectName: string;
  locationLine: string;
};

const PERKS = [
  "Dedicated relationship manager for life",
  "Legal protection & litigation support",
  "Taxation & compliance guidance",
  "Construction & pricing updates",
];

// Sticky aside enquiry card — additive to the site's global FormContext modal,
// not a replacement for it. Its own local state posts to the same /api/contact
// webhook, tagged with a distinct `source` so submissions can be told apart.
const EnquiryRail = ({ projectName, locationLine }: Props) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, phone: digitsOnly }));
  };

  const isValidPhone = /^[6-9]\d{9}$/.test(form.phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) {
      toast.error("Enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          project: projectName,
          source: "project-page-rail",
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Thanks! Our team will call you shortly.");
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

  const whatsappHref = buildWhatsAppHref(projectName, locationLine);
  const inputCls =
    "w-full rounded-xl bg-[#1a1a1d] border border-white/10 px-4 py-3 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

  return (
    <aside id="enquire" className="scroll-mt-24">
      <div className="rounded-[22px] border border-[#D9B268]/25 bg-[#141416] shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D9B268]/18 to-[#D9B268]/[0.03] border-b border-[#D9B268]/20">
          <span className="h-2 w-2 rounded-full bg-[#D9B268] shrink-0 animate-pulse" />
          <span className="text-[12.5px] font-bold tracking-wide text-[#e8c88a]">
            Selling fast · Limited-time pricing
          </span>
        </div>

        <div className="p-5 md:p-6">
          {submitted ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#63C08D]/40 bg-[#63C08D]/14 text-[#7fd3a5] text-2xl">
                ✓
              </div>
              <p className="mb-2 text-lg font-extrabold text-white">
                Thank you{form.name ? `, ${form.name}` : ""}!
              </p>
              <p className="text-sm leading-relaxed text-gray-400">
                Our property expert will call you shortly with pricing, availability and a
                personalised view on {projectName}.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", email: "", phone: "" });
                }}
                className="mt-5 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:border-[#D9B268] transition-colors cursor-pointer"
              >
                Make another enquiry
              </button>
            </div>
          ) : (
            <>
              <p className="mb-1.5 text-xl font-extrabold tracking-tight text-white">
                Talk to a property expert
              </p>
              <p className="mb-5 text-[13.5px] leading-relaxed text-gray-400">
                Exclusive access to new launches &amp; developer deals — only for Homz clients.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  className={inputCls}
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  required
                  className={inputCls}
                />
                <div className="flex gap-2">
                  <span className="flex shrink-0 items-center rounded-xl border border-white/10 bg-[#1a1a1d] px-3.5 text-[14.5px] font-semibold text-gray-300">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="phone"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="Phone number"
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    required
                    className={inputCls}
                  />
                </div>
                {form.phone.length > 0 && !isValidPhone && (
                  <p className="text-[12px] text-red-400">
                    Enter a valid 10-digit mobile number starting with 6-9.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 text-[15px] font-bold text-[#1c1608] shadow-[0_10px_28px_rgba(201,154,75,0.3)] hover:brightness-105 transition disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Submitting…" : "Request a call back →"}
                </button>
              </form>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
                By continuing you agree to be contacted by Homz Realtor.
              </p>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] tracking-widest text-gray-500">OR</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-[13.5px] font-semibold text-white hover:border-[#D9B268] transition-colors"
              >
                Call Now on WhatsApp
              </a>
            </>
          )}
        </div>

        {!submitted && (
          <div className="border-t border-white/[0.06] bg-[#0f0f11] px-5 py-5 md:px-6">
            <p className="mb-3.5 text-[13px] font-bold text-gray-200">Make a smarter enquiry</p>
            <div className="flex flex-col gap-2.5">
              {PERKS.map((p) => (
                <div key={p} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-[#D9B268]/30 bg-[#D9B268]/14 text-[10px] font-extrabold text-[#D9B268]">
                    ✓
                  </span>
                  <span className="text-[13.5px] leading-tight text-gray-300">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default EnquiryRail;
