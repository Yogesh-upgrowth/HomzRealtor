"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import getValidImage from "./utils/helper/getValidImage";
import { slugify } from "./utils/slugify";
import SafeProjectImage from "./Home/SafeProjectImage";

// ✅ Mobile hook
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
};

interface Project {
  name: string;
  location: string;
  price?: string;
  image: string;
}

export default function HotSelling() {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedCity, setSelectedCity] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollByCards = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const fetchCityData = async (cityKey: string, citySlug: string, limit = 3) => {
          const url = `https://homzbackend.vercel.app/api/data?city=${cityKey}&page=1&limit=${limit}`;
          const res = await fetch(url);
          const data = await res.json();
          return (data?.results || [])
            .filter((item: any) => Array.isArray(item.images) && item.images.length > 0)
            .map((item: any) => ({ ...item, citySlug }));
        };

        const cityKeyMap: Record<string, string> = {
          gurgaon: "ggn",
          delhi: "delhi",
          faridabad: "faridabad",
          greaternoida: "gNoida",
          noida: "noida",
        };

        let finalData: any[] = [];

        if (selectedCity === "all") {
          const cities: [string, string][] = [
            ["ggn", "ggn"],
            ["delhi", "delhi"],
            ["faridabad", "faridabad"],
            ["gNoida", "greaternoida"],
            ["noida", "noida"],
          ];
          const results = await Promise.all(
            cities.flatMap(([key, slug]) => [
              fetchCityData(`${key}CommercialProjects`, slug),
              fetchCityData(`${key}ResidentialProjects`, slug),
            ])
          );
          finalData = results.flat();
        } else {
          const base = cityKeyMap[selectedCity];
          const [commercial, residential] = await Promise.all([
            fetchCityData(`${base}CommercialProjects`, selectedCity),
            fetchCityData(`${base}ResidentialProjects`, selectedCity),
          ]);
          finalData = [...commercial, ...residential];
        }

        setProjects(finalData.slice(0, 3));
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedCity]);

  return (
    <section id="featured-projects" className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 scroll-mt-24 border-b border-white/[0.06]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Handpicked for you
          </p>
          <h2 className="text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
            Featured Projects in Gurgaon
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => scrollByCards(-1)}
            aria-label="Previous"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-gray-300 hover:border-[#D9B268] hover:text-[#D9B268] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scrollByCards(1)}
            aria-label="Next"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-gray-300 hover:border-[#D9B268] hover:text-[#D9B268] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <Link href="/project-listing" className="ml-2 text-[13px] font-bold text-[#D9B268] whitespace-nowrap">
            View All →
          </Link>
        </div>
      </div>

      {/* City selector */}
      <div className="mb-7 flex justify-start">
        {isMobile ? (
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#1a1a1d] px-4 py-2.5 text-sm text-white"
          >
            <option value="all">All Cities</option>
            <option value="gurgaon">Gurgaon</option>
            <option value="delhi">Delhi</option>
            <option value="faridabad">Faridabad</option>
            <option value="greaternoida">Greater Noida</option>
            <option value="noida">Noida</option>
          </select>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {["all", "gurgaon", "delhi", "faridabad", "greaternoida", "noida"].map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`rounded-full px-4.5 py-2 text-[13px] font-bold capitalize transition ${
                  selectedCity === city
                    ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                    : "border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project cards — horizontal scroll-snap row */}
      <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="w-[300px] shrink-0 snap-start overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#141416] animate-pulse">
              <div className="h-52 w-full bg-white/5" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 rounded bg-white/5" />
                <div className="h-4 w-1/3 rounded bg-white/5" />
              </div>
            </div>
          ))
        ) : projects.length > 0 ? (
          projects.map((p: any, index: number) => {
            const image = getValidImage(p.images);
            const href = `/project-listing/${p.citySlug}/${slugify(p.projectTitle || "project")}`;

            return (
              <Link
                key={index}
                href={href}
                className="group w-[300px] shrink-0 snap-start overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#141416] hover:border-[#D9B268]/35 hover:-translate-y-1 transition"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  {image ? (
                    <SafeProjectImage src={image} alt={p.projectTitle} sizes="300px" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#1a1a1d] text-gray-600">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="mb-1.5 text-[15.5px] font-bold text-white group-hover:text-[#D9B268] transition-colors">
                    {p.projectTitle}
                  </h3>
                  {p.location && (
                    <p className="mb-3 flex items-center gap-1.5 text-[12px] text-gray-500">
                      <MapPin size={12} className="text-[#D9B268]" /> {p.location}
                    </p>
                  )}
                  <p className="font-display text-lg text-[#D9B268]">
                    {p.price || "View Details"}
                  </p>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-gray-500">No projects found</p>
        )}
      </div>
    </section>
  );
}