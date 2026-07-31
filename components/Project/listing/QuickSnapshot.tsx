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
            {chip.label === "RERA" && chip.href ? (
              <a
                href={chip.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm md:text-base font-semibold text-[#D9B268] hover:text-[#e8c88a] mt-0.5 line-clamp-2 underline decoration-[#D9B268]/40 underline-offset-2"
              >
                {chip.value} — verify ↗
              </a>
            ) : (
              <p className="text-sm md:text-base font-semibold text-[#ececea] mt-0.5 line-clamp-2">
                {chip.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickSnapshot;
