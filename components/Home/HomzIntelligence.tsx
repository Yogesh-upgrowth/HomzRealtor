// Illustrative "price growth by sector" bar chart — a single series (one
// metric across years), so per dataviz guidance it needs no legend (the
// title names it) and only a selective direct label on the most important
// bar (the latest year), not a number on every bar. Uses one hue (the site's
// gold accent) ramping from muted/recessive (older, less relevant) to full
// intensity (current year) rather than a categorical palette, since this is
// a magnitude-over-time job, not an identity comparison.
const BARS = [
  { year: "2020", height: 30 },
  { year: "2021", height: 42 },
  { year: "2022", height: 36 },
  { year: "2023", height: 58 },
  { year: "2024", height: 50 },
  { year: "2025", height: 72 },
  { year: "2026", height: 100 },
];

const HomzIntelligence = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <div className="relative overflow-hidden rounded-[24px] border border-[#D9B268]/20 bg-gradient-to-br from-[#17140c] to-[#111113] p-7 md:p-12">
        <div className="pointer-events-none absolute -right-[10%] -top-[40%] h-[180%] w-[60%] rounded-full bg-[radial-gradient(circle,rgba(217,178,104,0.12),transparent_70%)]" />

        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
              AI-powered insights
            </p>
            <h2 className="mb-4 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
              Homz Intelligence
            </h2>
            <p className="mb-6 max-w-[440px] text-[15px] leading-relaxed text-gray-400">
              Our proprietary data engine analyzes thousands of transactions across
              Gurgaon to surface the sectors, developers and unit types with the
              strongest growth signals.
            </p>
            <a
              href="#consult"
              className="inline-flex items-center rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-3.5 text-[14.5px] font-bold text-[#1c1608] hover:brightness-105 transition"
            >
              Talk to an Analyst
            </a>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#111113] p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Price growth by sector (6yr)
              </span>
              <span className="rounded-full border border-[#63C08D]/30 bg-[#63C08D]/12 px-3 py-1 text-[12px] font-bold text-[#7fd3a5]">
                +62% cumulative
              </span>
            </div>

            <div className="flex h-[140px] items-end gap-2.5" role="img" aria-label="Illustrative price growth by year, 2020 to 2026, trending upward">
              {BARS.map((b, i) => {
                const isLast = i === BARS.length - 1;
                return (
                  <div key={b.year} className="flex flex-1 flex-col items-center gap-2">
                    {isLast && (
                      <span className="text-[11px] font-bold text-[#D9B268]">+62%</span>
                    )}
                    <div
                      className={`w-full rounded-t-[4px] ${
                        isLast ? "bg-gradient-to-t from-[#C99A4B] to-[#F2D79B]" : "bg-[#D9B268]/25"
                      }`}
                      style={{ height: `${b.height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 flex justify-between text-[11px] text-gray-600">
              <span>{BARS[0].year}</span>
              <span>{BARS[BARS.length - 1].year}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomzIntelligence;
