import type { Chip } from "@/lib/intelligence/view-model";

const QuickSnapshot = ({ chips }: { chips: Chip[] }) => {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="border-t border-white/[0.09] pt-6 mt-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {chips.map((chip) => (
          <div key={chip.label} className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
              {chip.label}
            </p>
            <p className="text-sm md:text-base font-semibold text-[#ececea] mt-0.5 line-clamp-2">
              {chip.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickSnapshot;
