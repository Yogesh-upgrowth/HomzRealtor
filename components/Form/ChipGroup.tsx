"use client";

// Single/multi-select pill selector — covers every chip row in the listing
// wizard (Property Type, BHK, Additional Spaces, Suited For, Security
// Deposit, Age of Property, Bathroom/Parking counts, Balcony, Furnishing,
// Power Back-up, Highlights, and each amenity-category grid). Reuses the
// gold-pill toggle look already used in PropertyListingPage.tsx.

export type ChipOption = { value: string; label: string };

type ChipGroupProps = {
  options: ChipOption[];
  mode: "single" | "multi";
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
};

const toggleClass = (active: boolean) =>
  `flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
    active
      ? "border-[#D9B268]/60 bg-[#D9B268]/15 text-[#D9B268]"
      : "border-white/10 text-gray-300 hover:border-[#D9B268]/40"
  }`;

export default function ChipGroup({ options, mode, value, onChange, disabled }: ChipGroupProps) {
  const isActive = (optionValue: string) =>
    mode === "multi" ? Array.isArray(value) && value.includes(optionValue) : value === optionValue;

  const handleClick = (optionValue: string) => {
    if (mode === "multi") {
      const current = Array.isArray(value) ? value : [];
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      onChange(next);
    } else {
      if (value === optionValue) return; // matches the reference: exactly one stays chosen once set
      onChange(optionValue);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => handleClick(option.value)}
          className={toggleClass(isActive(option.value))}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
