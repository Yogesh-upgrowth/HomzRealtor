"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail } from "lucide-react";

// Real lead-capture form, modeled on EnquiryRail.tsx's fetch/toast pattern —
// posts to the same /api/contact webhook the rest of the site uses.
const ExpertConsultation = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "Interested in Buying", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
        body: JSON.stringify({ ...form, source: "homepage-consultation" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Thanks! Our team will call you back shortly.");
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

  return (
    <section id="consult" className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 scroll-mt-24 border-b border-white/[0.06]">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Talk to a specialist
          </p>
          <h2 className="mb-4 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
            Expert Consultation, Zero Obligation
          </h2>
          <p className="mb-7 max-w-[420px] text-[15px] leading-relaxed text-gray-400">
            Share a few details and a Gurgaon property specialist will call you back
            to discuss options that fit your budget and timeline.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
                <Phone size={20} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-white">Call us anytime</p>
                <p className="text-[12.5px] text-gray-500">+91 84479 09227</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
                <Mail size={20} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-white">Email our team</p>
                <p className="text-[12.5px] text-gray-500">hello@homzrealtor.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/[0.08] bg-[#141416] p-7">
          {submitted ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#63C08D]/40 bg-[#63C08D]/14 text-2xl text-[#7fd3a5]">
                ✓
              </div>
              <p className="mb-2 text-lg font-extrabold text-white">Thank you!</p>
              <p className="text-sm leading-relaxed text-gray-400">
                Our team will call you back shortly to discuss your requirement.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className={inputCls} />
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" required className={inputCls} />
              </div>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email Address" required className={inputCls} />
              <select name="interest" value={form.interest} onChange={handleChange} className={inputCls}>
                <option>Interested in Buying</option>
                <option>Interested in Renting</option>
                <option>Interested in Commercial</option>
                <option>Interested in Investment</option>
              </select>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your requirement (optional)"
                rows={3}
                className={`${inputCls} resize-vertical`}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 text-[15px] font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Submitting…" : "Request a Callback"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ExpertConsultation;
