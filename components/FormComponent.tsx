"use client";

import React, { useState, useContext } from "react";
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

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    terms: initial?.terms ?? false,
  });

  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-2 sm:px-4">
      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-[24px] border border-white/10 bg-[#141416] text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] flex flex-col md:flex-row gap-8 md:gap-10 p-6 sm:p-8 md:p-12">

        {/* Close Button */}
        <button
          onClick={closeForm}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 hover:border-[#D9B268] hover:text-[#D9B268] transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col mt-2 md:mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Talk to an expert
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
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
    </div>
  );
}
