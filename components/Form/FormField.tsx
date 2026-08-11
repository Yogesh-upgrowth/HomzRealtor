"use client";

import type { ReactNode } from "react";

// Generic label/required/helper/error wrapper so every field across the
// wizard's 5 steps (text input, select, textarea, or a nested ChipGroup/
// SegmentedToggle) gets consistent spacing and error styling.

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

export const selectClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D9B268] transition-colors";

type FormFieldProps = {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
};

export default function FormField({ label, required, helperText, error, htmlFor, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-gray-200 mb-2">
        {label}
        {required && <span className="text-[#D9B268] ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] text-red-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-[12.5px] text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
