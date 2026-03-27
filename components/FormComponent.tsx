"use client";

import React, { useState, useContext } from "react";
import { FormContext } from "@/context/FormContext";

type FormState = {
  name: string;
  email: string;
  phone: string;
  pan: string;
  terms: boolean;
};

export default function FormComponent({
  onSubmit,
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
    pan: initial?.pan ?? "",
    terms: initial?.terms ?? false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    else console.log("Form submitted:", form);
  };

  if (!isOpen) return null;

  return (
    // 🔥 Fullscreen overlay
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-2 sm:px-4">
      
      {/* Container */}
      <div className="bg-[#1c1c1c] text-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col md:flex-row gap-6 md:gap-10 p-4 sm:p-6 md:p-18 relative">

        {/* Close Button */}
        <button
          onClick={closeForm}
          className="absolute top-3 right-3 text-gray-300 hover:text-white"
        >
          ✕
        </button>

        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col mt-2 md:mt-6">
          <h2 className="text-lg sm:text-xl md:text-3xl font-bold text-center md:text-left mb-4 bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
            GET A CIBIL LINKED HOME LOAN ESTIMATE
          </h2>

          {/* Hide heavy content on mobile */}
          <div className="hidden md:block space-y-5 text-sm text-gray-300">
            <div>
              <p className="font-semibold text-lg">🏠 EXCLUSIVE LOCATION</p>
              <p className="text-gray-400">
                Located in Pune’s most prestigious areas.
              </p>
            </div>

            <div>
              <p className="font-semibold text-lg">🌍 WORLD CLASS AMENITIES</p>
              <p className="text-gray-400">
                Located in Pune’s most prestigious areas.
              </p>
            </div>

            <div>
              <p className="font-semibold text-lg">🌿 SUSTAINABLE LIVING</p>
              <p className="text-gray-400">
                Located in Pune’s most prestigious areas.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:grid grid-cols-2 gap-6 mt-8 text-yellow-400 text-sm">
            <div>
              <p className="text-xl font-bold">25500+</p>
              <p className="text-gray-300 text-xs">Happy Customers</p>
            </div>
            <div>
              <p className="text-xl font-bold">45 Million Sq.Ft.</p>
              <p className="text-gray-300 text-xs">Area Sold</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col gap-4 text-sm"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-transparent focus:bg-white focus:text-black"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-transparent focus:bg-white focus:text-black"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-transparent focus:bg-white focus:text-black"
          />

          <input
            type="text"
            name="pan"
            placeholder="PAN Number"
            value={form.pan}
            onChange={handleChange}
            className="p-3 border border-gray-600 rounded-md bg-transparent focus:bg-white focus:text-black"
          />

          <label className="flex items-start gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              className="mt-1 accent-yellow-400"
            />
            <span>
              I accept the <span className="text-yellow-400">Terms</span>.
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 p-3 rounded-md bg-white text-black font-semibold"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}