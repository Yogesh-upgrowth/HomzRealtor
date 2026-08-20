import Link from "next/link";
import { MapPin } from "lucide-react";

// Real /project-listing micromarket filters (see app/project-listing/page.tsx's
// micromarket handling, which slugifies NormalizedProject._microMarket the
// same way lib/intelligence/normalize.ts's slugify() does here) — picked as
// Gurgaon's four highest-inventory, most-searched corridors rather than every
// micro-market in normalize.ts's MICRO_MARKETS list, so every chip returns a
// real, well-stocked result set instead of a handful of projects.
const LOCATIONS = [
  { label: "Golf Course Road", href: "/project-listing?micromarket=golf-course-road" },
  { label: "Dwarka Expressway", href: "/project-listing?micromarket=dwarka-expressway" },
  { label: "Sohna Road", href: "/project-listing?micromarket=sohna-road" },
  { label: "Southern Peripheral Road", href: "/project-listing?micromarket=southern-peripheral-road" },
];

// No <section> wrapper — meant to be embedded inside another section (e.g.
// HotSelling, between its title and card grid), not used as a standalone
// homepage block.
export default function QuickLocationFilters() {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2.5">
      <span className="mr-1 text-[13px] font-semibold text-gray-500">
        Explore by location:
      </span>
      {LOCATIONS.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#141416] px-4.5 py-2.5 text-[13px] font-semibold text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268] transition"
        >
          <MapPin size={13} className="text-[#D9B268]" />
          {l.label}
        </Link>
      ))}
    </div>
  );
}
