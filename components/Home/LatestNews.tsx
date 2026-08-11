import Image from "next/image";
import discoverImage4 from "@/assets/images/discoverImage4.png";
import discoverImage1 from "@/assets/images/discoverImage1.png";
import discoverImage5 from "@/assets/images/discoverImage5.png";

// Illustrative placeholder articles — no blog/news section exists in this app
// yet, so these are non-interactive cards (no href) rather than links that
// would 404 or scroll-to-top as a no-op.
const LEAD = {
  tag: "Policy",
  title: "Haryana Eases Circle Rates Across Dwarka Expressway Corridor",
  text: "The revision is expected to boost transaction volumes in Sectors 88–115 through the next fiscal year.",
  date: "July 20, 2026 · 4 min read",
  img: discoverImage4,
};

const OTHERS = [
  {
    tag: "Infrastructure",
    title: "Golf Course Extension Metro Line Gets Final Nod",
    text: "Six new stations will connect Sectors 58–74 to Cyber City by 2029.",
    date: "July 16, 2026 · 3 min read",
    img: discoverImage1,
  },
  {
    tag: "Market",
    title: "Commercial Rentals in New Gurgaon Cross Pre-Pandemic Highs",
    text: "Grade-A office rents on Golf Course Road are up 14% year on year.",
    date: "July 10, 2026 · 5 min read",
    img: discoverImage5,
  },
];

const LatestNews = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Stay informed
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Latest News
      </h2>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <article className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#141416]">
          <div className="relative aspect-video">
            <Image
              src={LEAD.img}
              alt={LEAD.title}
              fill
              sizes="(min-width: 1024px) 57vw, 100vw"
              className="object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[#1c1608]">
              {LEAD.tag}
            </span>
          </div>
          <div className="p-6">
            <h3 className="mb-2.5 text-[17px] font-bold leading-snug text-white">{LEAD.title}</h3>
            <p className="mb-3 text-[14px] leading-relaxed text-gray-400">{LEAD.text}</p>
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-600">{LEAD.date}</span>
          </div>
        </article>

        <div className="flex flex-col gap-5">
          {OTHERS.map((n) => (
            <article key={n.title} className="flex gap-4 overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#141416] p-3">
              <div className="relative h-[92px] w-[120px] shrink-0 overflow-hidden rounded-xl">
                <Image src={n.img} alt={n.title} fill sizes="120px" className="object-cover" />
              </div>
              <div className="py-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#D9B268]">{n.tag}</span>
                <h3 className="mt-1.5 text-[14.5px] font-bold leading-snug text-white">{n.title}</h3>
                <span className="mt-1.5 block text-[11px] text-gray-600">{n.date}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestNews;
