import Image from "next/image";
import Link from "next/link";
import golfImg from "@/assets/images/discoverImage1.png";
import readyImg from "@/assets/images/discoverImage2.jpg";
import underConstructionImg from "@/assets/images/discoverImage3.png";
import brandedImg from "@/assets/images/discoverImage4.png";
import commercialImg from "@/assets/images/discoverImage5.png";
import { getProjectsForCity } from "@/lib/intelligence/projects";
import { deriveStatus } from "@/lib/intelligence/view-model";
import { slugify } from "@/lib/intelligence/normalize";

const GURGAON_CITY_KEY = "ggn";

// The only real "branded residence" name present in the KNOWN_BUILDERS list —
// deliberately narrow rather than treating every known developer as "branded"
// (that would match almost everything and defeat the point of the category).
const BRANDED_BUILDERS = ["Trump Towers"];

function propertyLabel(count: number): string {
  return `${count} propert${count === 1 ? "y" : "ies"}`;
}

const Collections = async () => {
  const projects = await getProjectsForCity(GURGAON_CITY_KEY);

  const golf = projects.filter(
    (p) => p.micro_market === "Golf Course Road" || p.micro_market === "Golf Course Extension Road"
  );
  const readyToMove = projects.filter((p) => deriveStatus(p) === "Ready to Move");
  const underConstruction = projects.filter((p) => deriveStatus(p) === "Under Construction");
  const branded = projects.filter((p) => BRANDED_BUILDERS.includes(p.builder));
  const commercial = projects.filter((p) => p.property_category === "Commercial");

  const collections = [
    {
      title: "Golf-Facing Homes",
      note: `Golf Course Road · ${propertyLabel(golf.length)}`,
      img: golfImg,
      href: "/project-listing?micromarket=golf-course-road",
      count: golf.length,
    },
    {
      title: "Ready to Move",
      note: propertyLabel(readyToMove.length),
      img: readyImg,
      href: "/project-listing?status=ready-to-move",
      count: readyToMove.length,
    },
    {
      title: "Under Construction",
      note: propertyLabel(underConstruction.length),
      img: underConstructionImg,
      href: "/project-listing?status=under-construction",
      count: underConstruction.length,
    },
    {
      title: "Branded Residences",
      note: propertyLabel(branded.length),
      img: brandedImg,
      href: `/project-listing?builder=${slugify(BRANDED_BUILDERS[0])}`,
      count: branded.length,
    },
    {
      title: "Investment Grade Commercial",
      note: propertyLabel(commercial.length),
      img: commercialImg,
      href: "/project-listing?type=Commercial",
      count: commercial.length,
    },
  ].filter((c) => c.count > 0);

  if (collections.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Curated for every lifestyle
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Collections
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:h-[456px]">
        {collections.map((c, i) => (
          <Link
            key={c.title}
            href={c.href}
            className={`group relative overflow-hidden rounded-[20px] border border-white/[0.08] ${
              i === 0 ? "lg:col-span-2 lg:row-span-2" : ""
            }`}
          >
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
              <Image
                src={c.img}
                alt={c.title}
                fill
                sizes={
                  i === 0
                    ? "(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
                    : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                }
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
