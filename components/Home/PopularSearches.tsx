import Link from "next/link";

// Audit item 6 (2026-09-19): every chip here pointed at /project-listing?...
// with a query string. That URL declares a static canonical of
// /project-listing, which is force-dynamic and client-rendered with zero
// project links in its server HTML -- so none of these could ever rank, and
// the queries they name ("ready to move flats Gurgaon", "2 BHK in Sector 57")
// are exactly the ones the site should be winning. The chips were the biggest
// block of internal links on the homepage and all of them dead-ended.
//
// Every chip now points at a route that is server-rendered, self-canonical and
// actually filtered: the six BUY_FACETS under /buy-property/gurgaon/ (see
// components/PropertyListing/FacetedListingPage.tsx) and the real sector pages
// under /project-listing/gurgaon/sectors/.
//
// Labels were rewritten to match what the destination genuinely delivers. The
// audit specifically flagged "Studio Apartments Gurgaon" pointing at a plain
// Apartment filter; rather than relabel a lie, chips with no honest
// destination are gone. Three of the originals -- Golf Course Road, Sohna Road
// and Dwarka Expressway -- describe corridors that have no hub page yet; they
// return here once those exist, and inventing a query-string URL for them now
// would just recreate the dead end.
const SEARCHES = [
  { label: "3 BHK Flats in Gurgaon", href: "/buy-property/gurgaon/3-bhk" },
  { label: "4 BHK Flats in Gurgaon", href: "/buy-property/gurgaon/4-bhk" },
  { label: "Ready to Move Flats", href: "/buy-property/gurgaon/ready-to-move" },
  { label: "Flats Under \u20b91 Crore", href: "/buy-property/gurgaon/under-1-crore" },
  { label: "Property Under \u20b92 Crore", href: "/buy-property/gurgaon/under-2-crore" },
  { label: "Plots for Sale in Gurgaon", href: "/buy-property/gurgaon/plots" },
  { label: "Projects in Sector 57", href: "/project-listing/gurgaon/sectors/sector-57" },
  { label: "Projects in Sector 65", href: "/project-listing/gurgaon/sectors/sector-65" },
  { label: "Projects in Sector 92", href: "/project-listing/gurgaon/sectors/sector-92" },
  { label: "Commercial Property in Gurgaon", href: "/commercial" },
  { label: "Browse All Gurgaon Sectors", href: "/project-listing/gurgaon/sectors" },
];

const PopularSearches = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Trending searches
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Popular Searches
      </h2>

      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0">
        {SEARCHES.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-[#141416] px-4.5 py-2.5 text-[13px] font-semibold text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268] transition"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularSearches;
