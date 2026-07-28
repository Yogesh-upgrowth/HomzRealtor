import Link from "next/link";

// Each chip maps to real, working /project-listing filters (q/type/budget/bhk/
// status/micromarket — see app/project-listing/page.tsx). Two of the original
// twelve labels ("Rental Yield Properties", "Pre-Leased Retail Gurgaon")
// described attributes with no backing field anywhere in the data model
// (rental yield is a calculator on the project detail page, not a listing
// attribute; lease status isn't tracked at all) — rather than link them to a
// filter that silently returns the full unfiltered list, they're dropped
// until that data actually exists.
const SEARCHES = [
  { label: "2 BHK in Sector 57", href: "/project-listing?bhk=2&q=Sector+57" },
  { label: "3 BHK Golf Course Road", href: "/project-listing?bhk=3&micromarket=golf-course-road" },
  { label: "Ready to Move Flats Gurgaon", href: "/project-listing?status=ready-to-move" },
  { label: "Commercial Shops Sector 65", href: "/project-listing?type=Commercial&q=Sector+65" },
  { label: "Plots on Sohna Road", href: "/project-listing?type=Plot&micromarket=sohna-road" },
  { label: "Villas in Sector 92", href: "/project-listing?type=Villa&q=Sector+92" },
  { label: "Office Space Dwarka Expressway", href: "/project-listing?type=Office+Space&micromarket=dwarka-expressway" },
  { label: "Luxury Apartments Under 2 Cr", href: "/project-listing?type=Apartment&budget=under-2cr" },
  { label: "New Launch Projects", href: "/project-listing?status=new-launch" },
  { label: "Studio Apartments Gurgaon", href: "/project-listing?type=Apartment" },
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

      <div className="flex flex-wrap gap-2.5">
        {SEARCHES.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-full border border-white/10 bg-[#141416] px-4.5 py-2.5 text-[13px] font-semibold text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268] transition"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularSearches;
