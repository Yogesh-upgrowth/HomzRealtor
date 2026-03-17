"use client";

import React, { useState } from "react";
import { FormContext } from "@/context/FormContext";
import { useContext } from "react";
type FormState = {
  name: string;
  email: string;
  phone: string;
  pan: string;
  terms: boolean;
};

export default function FormComponent({
  onClose,
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

  if (!isOpen) return;

  return (
    // Rounded card container ONLY (no backdrop)
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center mx-1 md:mt-6">
      <div className="bg-[#1c1c1c] top-15 inset-0 text-white rounded-3xl shadow-xl w-full max-w-5xl min-h-[80vh] p-4 md:p-8 flex flex-col md:flex-row gap-10 relative">
        {/* Close button (inside the rounded card) */}
        <button
          type="button"
          onClick={closeForm}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-300 hover:text-white p-1 rounded-full cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* LEFT SIDE (marketing + stats) */}
        <div className="flex-1 flex flex-col mt-2 md:mt-10 ml-2 p-2">
          <div>
            <h2 className="text-[20px] md:text-3xl font-bold text-center md:text-start mb-2 md:mb-6 bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
              GET A CIBIL LINKED HOME LOAN ESTIMATE
            </h2>

            <div className="hidden md:block space-y-5 text-sm text-gray-300">
              <div>
                <p className="font-semibold text-lg">🏠 EXCLUSIVE LOCATION</p>
                <p className="text-sm text-gray-400">
                  Located in Pune’s most prestigious areas.
                </p>
              </div>

              <div>
                <p className="font-semibold text-lg">
                  🌍 WORLD CLASS AMENITIES
                </p>
                <p className="text-sm text-gray-400">
                  Located in Pune’s most prestigious areas.
                </p>
              </div>

              <div>
                <p className="font-semibold text-lg">🌿 SUSTAINABLE LIVING</p>
                <p className="text-sm text-gray-400">
                  Located in Pune’s most prestigious areas.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:grid grid-cols-2 gap-6 mt-10 text-yellow-400 text-sm">
            <div>
              <p className="text-2xl font-bold">25500+</p>
              <p className="text-gray-300 text-xs">Happy Customers</p>
            </div>

            <div>
              <p className="text-2xl font-bold">45 Million Sq.Ft.</p>
              <p className="text-gray-300 text-xs">Area Sold</p>
            </div>

            <div>
              <p className="text-2xl font-bold">500+</p>
              <p className="text-gray-300 text-xs">Skilled Professionals</p>
            </div>

            <div>
              <p className="text-2xl font-bold">750+</p>
              <p className="text-gray-300 text-xs">Channel Associates</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (form) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col gap-4 md:gap-8 text-sm justify-center"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-600 rounded-md bg-transparent placeholder-gray-400 focus:bg-white focus:text-black focus:border-yellow-400 transition"
            aria-label="Name"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-600 rounded-md bg-transparent placeholder-gray-400 focus:bg-white focus:text-black focus:border-yellow-400 transition"
            aria-label="Email"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-3 border border-gray-600 rounded-md bg-transparent placeholder-gray-400 focus:bg-white focus:text-black focus:border-yellow-400 transition"
            aria-label="Phone Number"
          />

          <input
            type="text"
            name="pan"
            placeholder="PAN Number"
            value={form.pan}
            onChange={handleChange}
            className="w-full p-3 border border-gray-600 rounded-md bg-transparent placeholder-gray-400 focus:bg-white focus:text-black focus:border-yellow-400 transition"
            aria-label="PAN Number"
          />

          <label className="flex items-start gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              className="mt-1 accent-yellow-400"
              aria-label="Accept terms"
            />
            <span>
              I accept the <span className="text-yellow-400">Terms</span>,
              world’s best companies social proof to build credibility.
            </span>
          </label>

          <button
            type="submit"
            className="mt-4 p-3 rounded-md bg-white text-black font-semibold hover:bg-gray-100"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
