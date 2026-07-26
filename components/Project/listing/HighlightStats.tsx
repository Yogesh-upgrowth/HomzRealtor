import type { HighlightStat } from "@/lib/intelligence/view-model";

const HighlightStats = ({ title, stats }: { title: string; stats: HighlightStat[] }) => {
  if (!stats || stats.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 py-10 md:py-12">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Why this property
      </p>
      <h2 className="mb-8 max-w-[18ch] text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white">
        Three reasons {title} stands out.
      </h2>

      <div>
        {stats.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-1 items-center gap-3 border-t border-white/[0.09] py-6 sm:grid-cols-[minmax(90px,140px)_1fr] sm:gap-8 md:py-8"
          >
            <div className="font-display text-[clamp(46px,6vw,68px)] leading-[0.85] text-[#D9B268]">
              {s.big}
            </div>
            <div>
              <p className="mb-1.5 text-lg font-bold text-white md:text-xl">{s.title}</p>
              <p className="max-w-[54ch] text-[15px] leading-relaxed text-gray-400">{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HighlightStats;
