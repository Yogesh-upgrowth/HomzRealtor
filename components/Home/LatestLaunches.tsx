import Link from "next/link";
import { MapPin } from "lucide-react";
import type { NewLaunchProject } from "@/lib/intelligence/homepage";
import { CITY_PARAM_MAP } from "@/lib/intelligence/projects";
import SafeProjectImage from "./SafeProjectImage";
import SaveToggleButton from "@/components/Common/SaveToggleButton";

// NewLaunchProject.citySlug is already the canonical display slug (e.g.
// "gurgaon") — the wishlist keys Projects by the raw feed city_key (e.g.
// "ggn"), matching lib/status's convention, so it needs converting back.
function toCityKey(citySlug: string): string {
  return CITY_PARAM_MAP[citySlug.toLowerCase()] || citySlug;
}

type Props = {
  projects: NewLaunchProject[];
};

// Real "New Launch" projects (see lib/intelligence/homepage.ts) — self-hides
// when there's nothing real to show rather than fabricating entries.
const LatestLaunches = ({ projects }: Props) => {
  if (projects.length === 0) return null;
  const [feature, ...rest] = projects;
  const listItems = rest.slice(0, 4);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Just announced
          </p>
          <h2 className="text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
            Latest Launches
          </h2>
        </div>
        <Link href="/project-listing" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#D9B268]">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Link
          href={`/project-listing/${feature.citySlug}/${feature.slug}`}
          className="group flex flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#141416] hover:border-[#D9B268]/35 transition-colors"
        >
          <div className="relative aspect-video">
            {feature.image && (
              <SafeProjectImage
                src={feature.image}
                alt={feature.name}
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            )}
            <span className="absolute left-4 top-4 rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[#1c1608]">
              New Launch
            </span>
            <div className="absolute right-4 top-4 z-10">
              <SaveToggleButton
                item={{
                  itemType: "project",
                  citySegment: toCityKey(feature.citySlug),
                  slug: feature.slug,
                  title: feature.name,
                  imageUrl: feature.image,
                  priceText: feature.priceText,
                  locationText: feature.locationLine,
                }}
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h3 className="mb-1.5 text-[19px] font-bold text-white">{feature.name}</h3>
            <p className="mb-4 flex items-center gap-1.5 text-[12.5px] text-gray-500">
              <MapPin size={13} className="text-[#D9B268]" /> {feature.locationLine}
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-white/[0.08] pt-4">
              <span className="font-display text-2xl text-white">{feature.priceText}</span>
              <span className="rounded-lg bg-[#1a1a1d] px-4 py-2 text-[13px] font-semibold text-white group-hover:text-[#D9B268]">
                View Details →
              </span>
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-3.5">
          {listItems.map((p) => (
            <Link
              key={`${p.citySlug}-${p.slug}`}
              href={`/project-listing/${p.citySlug}/${p.slug}`}
              className="relative flex flex-1 items-center gap-3.5 rounded-[18px] border border-white/[0.08] bg-[#141416] p-3.5 hover:border-[#D9B268]/35 transition-colors"
            >
              <div className="relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded-xl">
                {p.image && <SafeProjectImage src={p.image} alt={p.name} sizes="70px" />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-[14.5px] font-bold text-white">{p.name}</h4>
                <p className="mt-1 truncate text-[12px] text-gray-500">{p.locationLine}</p>
                <span className="mt-1 block font-display text-[15px] text-[#D9B268]">{p.priceText}</span>
              </div>
              <div className="shrink-0 self-start">
                <SaveToggleButton
                  item={{
                    itemType: "project",
                    citySegment: toCityKey(p.citySlug),
                    slug: p.slug,
                    title: p.name,
                    imageUrl: p.image,
                    priceText: p.priceText,
                    locationText: p.locationLine,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestLaunches;
