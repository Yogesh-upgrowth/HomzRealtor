import type { Chip } from "@/lib/intelligence/view-model";

const QuickSnapshot = ({ chips }: { chips: Chip[] }) => {
  if (!chips || chips.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 -mt-4 md:-mt-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {chips.map((chip) => (
          <div
            key={chip.label}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
              {chip.label}
            </p>
            <p className="text-sm md:text-base font-semibold text-gray-900 mt-0.5 line-clamp-2">
              {chip.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default QuickSnapshot;
