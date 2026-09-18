import { Home, IndianRupee, FileCheck2, TrendingUp, Building2, Sparkles } from "lucide-react";

const SERVICES = [
  { icon: Home, title: "Buying & Selling", text: "Full-cycle advisory from shortlisting to registry, with legal due-diligence at every step.", featured: true },
  // Owner recheck (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17, P1-G):
  // "15+ banks", "in as little as 48 hours" and "our in-house legal desk"
  // were specific, unverified capability claims -- removed rather than
  // replaced with different invented specifics. Restore once the actual
  // lender network/turnaround time and legal-team structure are confirmed.
  { icon: IndianRupee, title: "Home Loan Assistance", text: "Help comparing home loan options and support through the pre-approval process." },
  { icon: FileCheck2, title: "Legal & RERA Advisory", text: "Guidance on title verification, RERA checks and registry support." },
  { icon: TrendingUp, title: "Investment Advisory", text: "Data-backed recommendations on high-growth micro-markets and rental yield projections." },
  { icon: Building2, title: "Property Management", text: "Tenant sourcing, rent collection and maintenance for owners who invest and rent out." },
  { icon: Sparkles, title: "Interior & Handover", text: "Curated interior design partners and snag-checking support at possession." },
];

const ServicesGrid = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        End-to-end support
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Services
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div
            key={s.title}
            className={`rounded-[22px] border p-7 ${
              s.featured
                ? "border-[#D9B268]/25 bg-gradient-to-br from-[#17140c] to-[#111113]"
                : "border-white/[0.08] bg-[#141416]"
            }`}
          >
            <span className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
              <s.icon size={24} />
            </span>
            <h3 className="mb-2.5 text-[17px] font-bold text-white">{s.title}</h3>
            <p className="text-[14px] leading-relaxed text-gray-400">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesGrid;
