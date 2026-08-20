import Image from "next/image";
import Link from "next/link";
import { BUYER_GUIDES } from "@/lib/content/buyerGuides";

// Real, original HomzRealtor guides — see lib/content/buyerGuides.ts. Each
// card links to its full write-up at /property-insights/[slug].
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
        {BUYER_GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/property-insights/${g.slug}`}
            className="group flex gap-4 border-b border-white/[0.08] py-4.5"
          >
            <div className="relative h-[76px] w-[100px] shrink-0 overflow-hidden rounded-xl">
              <Image src={g.img} alt={g.title} fill unoptimized sizes="100px" className="object-cover" />
            </div>
            <div>
              <h3 className="mb-1.5 text-[14.5px] font-bold leading-snug text-white group-hover:text-[#D9B268] transition-colors">
                {g.title}
              </h3>
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-600">{g.read}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PropertyInsights;
