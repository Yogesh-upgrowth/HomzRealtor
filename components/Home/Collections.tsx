import Image from "next/image";
import Link from "next/link";
import golfImg from "@/assets/images/discoverImage1.png";
import readyImg from "@/assets/images/discoverImage2.jpg";
import underConstructionImg from "@/assets/images/discoverImage3.png";
import brandedImg from "@/assets/images/discoverImage4.png";
import commercialImg from "@/assets/images/discoverImage5.png";

// Illustrative counts (curated editorial content, same precedent as
// Testimonials) — property counts here aren't backed by a live query.
const COLLECTIONS = [
  { title: "Golf-Facing Homes", note: "Golf Course Road", img: golfImg, span: true },
  { title: "Ready to Move", note: "32 properties", img: readyImg },
  { title: "Under Construction", note: "27 properties", img: underConstructionImg },
  { title: "Branded Residences", note: "9 properties", img: brandedImg },
  { title: "Investment Grade Commercial", note: "21 properties", img: commercialImg },
];

const Collections = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Curated for every lifestyle
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Collections
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:h-[456px]">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.title}
            href="/project-listing"
            className={`group relative overflow-hidden rounded-[20px] border border-white/[0.08] ${
              c.span ? "lg:col-span-2 lg:row-span-2" : ""
            }`}
          >
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
              <Image
                src={c.img}
                alt={c.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-bold text-white">{c.title}</h3>
                <p className="mt-1 text-[12.5px] text-gray-300">{c.note}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Collections;
