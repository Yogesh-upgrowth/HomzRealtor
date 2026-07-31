// Illustrative market snapshot — no historical transaction data exists in this
// app's data sources to derive these from, so they're static placeholder
// content (same precedent as Testimonials), clearly generic rather than tied
// to a specific claimed source.
const STATS = [
  { value: "18.4%", label: "Avg. YoY price appreciation" },
  { value: "₹9,850", label: "Avg. price / sq.ft., New Gurgaon" },
  { value: "6,200+", label: "Units sold this quarter" },
  { value: "42 days", label: "Avg. time to close a deal" },
];

const MarketStatsSection = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Market snapshot
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Gurgaon Real Estate at a Glance
      </h2>

      <div className="grid grid-cols-2 gap-6 rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-[#17140c] to-[#111113] p-7 md:grid-cols-4 md:p-10">
        {STATS.map((s, i) => (
          <div key={s.label} className={i > 0 ? "border-white/[0.08] md:border-l md:pl-6" : ""}>
            <p className="font-display text-3xl text-white md:text-4xl">{s.value}</p>
            <p className="mt-1.5 text-[13px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarketStatsSection;
