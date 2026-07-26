import { Trophy, Medal, Building2, Zap } from "lucide-react";

// Illustrative placeholder awards — same editorial-content precedent as
// Testimonials; replace with real award names/years when available.
const AWARDS = [
  { icon: Trophy, title: "Best Real Estate Portal", note: "NAR Realty Awards, 2025" },
  { icon: Medal, title: "Top Channel Partner — M3M", note: "M3M India, 2025" },
  { icon: Building2, title: "Excellence in Customer Trust", note: "CREDAI NCR, 2024" },
  { icon: Zap, title: "Fastest Growing PropTech", note: "Realty+ Conclave, 2024" },
];

const AwardsSection = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Recognized for excellence
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Awards &amp; Recognition
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AWARDS.map((a) => (
          <div key={a.title} className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-7 text-center">
            <span className="mx-auto mb-4 flex h-[56px] w-[56px] items-center justify-center rounded-2xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
              <a.icon size={26} />
            </span>
            <h3 className="mb-1 text-[14.5px] font-bold text-white">{a.title}</h3>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">{a.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AwardsSection;
