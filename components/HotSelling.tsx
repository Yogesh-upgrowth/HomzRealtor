"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import getValidImage from "./utils/helper/getValidImage";
import { slugify } from "./utils/slugify";

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

  const [selectedCity, setSelectedCity] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
    <section className="py-16 bg-white">
      <div className="max-w-[1444px] mx-auto px-4 md:px-6 text-center mt-8">
        {/* Heading */}
        <div className="flex items-center justify-center w-full">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-black via-gray-400 to-transparent" />

          <h2 className="mx-4 text-2xl md:text-4xl font-corbert font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent uppercase tracking-wide">
            Hot Selling Real Estate Projects <br />
          </h2>

          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-gray-400 to-black" />
        </div>

        <p className="mt-3 text-gray-600 text-lg font-sans max-w-3xl mx-auto">
          Discover the Best Opportunities in Residential & Commercial Spaces
        </p>

        {/* ✅ City Selector */}
        <div className="mt-6 flex justify-center text-black">
          {isMobile ? (
            // 📱 Mobile Dropdown
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option className="cursor-pointer" value="all">All</option>
              <option value="gurgaon">Gurgaon</option>
              <option value="delhi">Delhi</option>
              <option value="faridabad">Faridabad</option>
              <option value="greaternoida">Greater Noida</option>
              <option value="noida">Noida</option>
            </select>
          ) : (
            // 🖥 Desktop Tabs
            <div className="flex gap-4 text-black flex-wrap justify-center">
              {[
                "all",
                "gurgaon",
                "delhi",
                "faridabad",
                "greaternoida",
                "noida",
              ].map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-5 py-2 border rounded-md cursor-pointer capitalize transition ${
                    selectedCity === city
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project Cards */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg shadow-sm animate-pulse">
                <div className="h-60 w-full bg-gray-200" />
                <div className="py-4 pl-6 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
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
                  className="group overflow-hidden rounded-xs shadow-sm hover:shadow-lg transition block"
                >
                  <div className="relative h-60 w-full overflow-hidden">
                    {image ? (
                      <Image
                        src={image}
                        alt={p.projectTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="py-4 pl-6 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 py-2 group-hover:text-[#B77D2B] transition">
                      {p.projectTitle}
                    </h3>
                    <p className="text-[#B77D2B] font-semibold">
                      {p.price || "View Details"}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="col-span-3 text-center text-gray-500">No projects found</p>
          )}
        </div>

        {/* View All Button */}
        <div className="mt-10">
          <Link
            href="/project-listing"
            className="px-12 py-4 bg-gradient-to-b from-[#FDF094] to-[#B77D2B] text-black font-medium rounded-md shadow-md hover:opacity-90 transition"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}