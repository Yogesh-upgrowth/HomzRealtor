import Link from "next/link";
import type { SectorSummary } from "@/lib/intelligence/projects";

type Props = {
  citySlug: string; // canonical city slug, e.g. "gurgaon"
  sectors: SectorSummary[];
};

// Real, cached sector aggregation (see getSectorsForCity in
// lib/intelligence/projects.ts) — real project counts, real route.
const GurgaonSectorsSection = ({ citySlug, sectors }: Props) => {
  if (sectors.length === 0) return null;
  const top = sectors.slice(0, 12);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Browse by location
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Gurgaon Sectors
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {top.map((s) => (
          <Link
            key={s.slug}
            href={`/project-listing/${citySlug}/sectors/${s.slug}`}
            className="rounded-[16px] border border-white/[0.08] bg-[#141416] px-3 py-4 text-center hover:border-[#D9B268]/40 transition-colors"
          >
            <span className="block text-[13px] font-bold text-gray-200">{s.sector}</span>
            <span className="mt-1 block text-[11px] text-gray-600">{s.count} projects</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GurgaonSectorsSection;
