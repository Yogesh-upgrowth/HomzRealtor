import Link from "next/link";

const SEARCHES = [
  "2 BHK in Sector 57",
  "3 BHK Golf Course Road",
  "Ready to Move Flats Gurgaon",
  "Commercial Shops Sector 65",
  "Plots on Sohna Road",
  "Villas in Sector 92",
  "Office Space Dwarka Expressway",
  "Luxury Apartments Under 2 Cr",
  "Rental Yield Properties",
  "New Launch Projects 2026",
  "Pre-Leased Retail Gurgaon",
  "Studio Apartments Gurgaon",
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
            key={s}
            href="/project-listing"
            className="rounded-full border border-white/10 bg-[#141416] px-4.5 py-2.5 text-[13px] font-semibold text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268] transition"
          >
            {s}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularSearches;
