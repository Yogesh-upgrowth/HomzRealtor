const STEPS = [
  { num: "01", title: "Tell Us Your Needs", text: "Share your budget, location and property type — our system shortlists matching projects instantly." },
  { num: "02", title: "Meet a Local Expert", text: "A dedicated Gurgaon specialist walks you through verified options and site visits." },
  { num: "03", title: "Finalize with Confidence", text: "Compare pricing, negotiate and complete paperwork with full legal and RERA support." },
  { num: "04", title: "Move In & Beyond", text: "From loan disbursal to handover, we stay with you through possession and after." },
];

const HowItWorks = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Simple, guided, transparent
      </p>
      <h2 className="mb-9 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        How It Works
      </h2>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.num}>
            <div className="mb-4.5 flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#D9B268]/30 bg-[#131315] font-display text-[19px] text-[#D9B268]">
              {s.num}
            </div>
            <h3 className="mb-2 text-[16px] font-bold text-white">{s.title}</h3>
            <p className="text-[14px] leading-relaxed text-gray-400">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
