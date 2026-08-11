"use client";

// Exactly-2-option filled toggle (Sale/Rent, Residential/Commercial) — a
// solid dark active segment, visually distinct from ChipGroup's gold pills.
// Reuses SignupForm.tsx's existing role-toggle markup.

type Option = { value: string; label: string };

type SegmentedToggleProps = {
  options: [Option, Option];
  value: string | null;
  onChange: (value: string) => void;
};

export default function SegmentedToggle({ options, value, onChange }: SegmentedToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-xl px-4 py-3 font-semibold transition cursor-pointer ${
            value === option.value
              ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
              : "border border-white/10 text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
