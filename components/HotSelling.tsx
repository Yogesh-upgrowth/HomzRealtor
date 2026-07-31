import Link from "next/link";
import { MapPin } from "lucide-react";
import type { NewLaunchProject } from "@/lib/intelligence/homepage";
import SafeProjectImage from "./Home/SafeProjectImage";

type Props = {
  projects: NewLaunchProject[];
};

// Real projects (see lib/intelligence/homepage.ts's getFeaturedProjects) —
// server-fetched with cross-city backfill, same resilience pattern as
// LatestLaunches, so a transient fetch hiccup never leaves this section empty.
export default function HotSelling({ projects }: Props) {
  return (
    <section id="featured-projects" className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 scroll-mt-24 border-b border-white/[0.06]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Handpicked for you
          </p>
          <h2 className="text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
            Featured Projects in Gurgaon
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/project-listing" className="text-[13px] font-bold text-[#D9B268] whitespace-nowrap">
            View All →
          </Link>
        </div>
      </div>

      {/* Project cards — responsive grid, no horizontal scroll */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {projects.map((p) => (
            <Link
              key={`${p.citySlug}-${p.slug}`}
              href={`/project-listing/${p.citySlug}/${p.slug}`}
              className="group overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#141416] hover:border-[#D9B268]/35 hover:-translate-y-1 transition"
            >
              <div className="relative h-52 w-full overflow-hidden">
                {p.image ? (
                  <SafeProjectImage
                    src={p.image}
                    alt={p.name}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#1a1a1d] text-gray-600">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="mb-1.5 text-[15.5px] font-bold text-white group-hover:text-[#D9B268] transition-colors">
                  {p.name}
                </h3>
                <p className="mb-3 flex items-center gap-1.5 text-[12px] text-gray-500">
                  <MapPin size={12} className="text-[#D9B268]" /> {p.locationLine}
                </p>
                <p className="font-display text-lg text-[#D9B268]">
                  {p.priceText || "View Details"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No projects found</p>
      )}
    </section>
  );
}
