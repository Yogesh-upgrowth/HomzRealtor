"use client";

import React, { useEffect, useState, useContext } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { X, ShieldCheck, Sparkles, Leaf } from "lucide-react";
import { FormContext } from "@/context/FormContext";

type FormState = {
  name: string;
  email: string;
  phone: string;
  terms: boolean;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

const HIGHLIGHTS = [
  { icon: Sparkles, title: "Exclusive Location", text: "Located in Gurgaon's most prestigious areas." },
  { icon: ShieldCheck, title: "World Class Amenities", text: "Curated for comfort, security and lifestyle." },
  { icon: Leaf, title: "Sustainable Living", text: "Thoughtfully designed, future-ready spaces." },
];

export default function FormComponent({
  initial,
}: {
  onClose?: () => void;
  onSubmit?: (data: FormState) => void;
  initial?: Partial<FormState>;
}) {
  const { isOpen, closeForm } = useContext(FormContext);
  const [portalReady, setPortalReady] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    terms: initial?.terms ?? false,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeForm();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeForm, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.terms) {
      toast.error("Please accept the terms");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Form submitted successfully!");

        setForm({
          name: "",
          email: "",
          phone: "",
          terms: false,
        });

        closeForm();
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !portalReady) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 pt-6 md:items-center md:px-4 md:py-8"
      onClick={closeForm}
      role="presentation"
    >
      <div
        className="relative flex max-h-[calc(100dvh-24px)] w-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-t-[28px] border border-b-0 border-white/10 bg-[#141416] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-10 text-white shadow-[0_-24px_80px_rgba(0,0,0,0.65)] scrollbar-hide md:max-h-[95vh] md:max-w-4xl md:flex-row md:gap-10 md:rounded-[24px] md:border-b md:p-12 md:shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expert-form-title"
      >
        <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/15 md:hidden" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeForm}
          aria-label="Close"
          data-testid="button-close-expert-sheet"
          className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-[#D9B268] hover:text-[#D9B268]"
        >
          <X size={18} />
        </button>

        {/* LEFT SIDE */}
        <div className="flex flex-1 flex-col md:mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Talk to an expert
          </p>
          <h2 id="expert-form-title" className="mb-3 max-w-[17ch] bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-2xl font-bold text-transparent md:mb-6 md:max-w-none md:text-3xl">
            Get a Personalised Property &amp; Loan Estimate
          </h2>

          <div className="hidden md:flex flex-col gap-5">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
                  <h.icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-white">{h.title}</p>
                  <p className="text-sm text-gray-400">{h.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-white/[0.08]">
            <div>
              <p className="font-display text-2xl text-white">25500+</p>
              <p className="text-gray-500 text-xs mt-0.5">Happy Customers</p>
            </div>

            <div>
              <p className="font-display text-2xl text-white">45 Mn+ Sq.Ft.</p>
              <p className="text-gray-500 text-xs mt-0.5">Area Sold</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col gap-3.5 text-sm"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className={inputClass}
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
            className={inputClass}
          />

          <label className="flex items-start gap-2.5 text-xs text-gray-400 mt-1">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#D9B268] cursor-pointer"
            />

            <span>
              I accept the{" "}
              <span className="text-[#D9B268] font-medium">Terms &amp; Conditions</span>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
