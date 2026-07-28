import Image from "next/image";
import discoverImage2 from "@/assets/images/discoverImage2.jpg";
import discoverImage3 from "@/assets/images/discoverImage3.png";
import discoverImage4 from "@/assets/images/discoverImage4.png";
import discoverImage5 from "@/assets/images/discoverImage5.png";

// Placeholder guide teasers — no real blog/article pages exist yet, so these
// are non-interactive (no href), same treatment as LatestNews.
const GUIDES = [
  { title: "A Complete Guide to Buying Under-Construction Property", read: "6 min read", img: discoverImage2 },
  { title: "Understanding RERA: What Every Gurgaon Buyer Should Know", read: "5 min read", img: discoverImage3 },
  { title: "Home Loan Documentation Checklist for First-Time Buyers", read: "4 min read", img: discoverImage4 },
  { title: "5 Micro-Markets Delivering the Best Rental Yields in 2026", read: "7 min read", img: discoverImage5 },
];

const PropertyInsights = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Buyer&apos;s guides
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Property Insights
      </h2>

      <div className="grid grid-cols-1 gap-x-10 gap-y-1 md:grid-cols-2">
        {GUIDES.map((g) => (
          <div key={g.title} className="flex gap-4 border-b border-white/[0.08] py-4.5">
            <div className="relative h-[76px] w-[100px] shrink-0 overflow-hidden rounded-xl">
              <Image src={g.img} alt={g.title} fill className="object-cover" />
            </div>
            <div>
              <h4 className="mb-1.5 text-[14.5px] font-bold leading-snug text-white">{g.title}</h4>
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-600">{g.read}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PropertyInsights;
