import Link from "next/link";
import { Building2 } from "lucide-react";
import type { DeveloperSummary } from "@/lib/intelligence/projects";

type Props = {
  developers: DeveloperSummary[];
};

// Real builder aggregation (see getAllBuilders in lib/intelligence/projects.ts)
// — only renders fields that actually exist on DeveloperSummary. No invented
// "years of experience" or similar unverifiable stats.
const DevelopersSection = ({ developers }: Props) => {
  if (developers.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Partnered with the best
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Leading Developers
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {developers.map((d) => (
          <Link
            key={d.slug}
            href={`/developer/${d.slug}`}
            className="flex flex-col gap-4 rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-[#17140c] to-[#111113] p-7 hover:border-[#D9B268]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
                <Building2 size={22} />
              </span>
              <h3 className="text-[17px] font-bold text-white">{d.name}</h3>
            </div>
            <p className="text-[13.5px] leading-relaxed text-gray-400">
              {d.count}+ project{d.count === 1 ? "" : "s"} across {d.cities.length}{" "}
              {d.cities.length === 1 ? "city" : "cities"} in Delhi NCR.
            </p>
            <div className="mt-auto flex gap-6 border-t border-white/[0.08] pt-4">
              <div>
                <div className="font-display text-xl text-white">{d.count}+</div>
                <div className="text-[11.5px] text-gray-500">Projects</div>
              </div>
              {d.residential > 0 && (
                <div>
                  <div className="font-display text-xl text-white">{d.residential}</div>
                  <div className="text-[11.5px] text-gray-500">Residential</div>
                </div>
              )}
              {d.commercial > 0 && (
                <div>
                  <div className="font-display text-xl text-white">{d.commercial}</div>
                  <div className="text-[11.5px] text-gray-500">Commercial</div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DevelopersSection;
