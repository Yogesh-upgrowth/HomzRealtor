"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  // ✅ Fetch API (same logic as ProjectListing)
  useEffect(() => {
    async function fetchData() {
      try {
        let finalData: Project[] = [];

        const fetchCityData = async (cityKey: string, limit = 10) => {
          const url = `https://homzbackend.vercel.app/api/data?city=${cityKey}&page=1&limit=${limit}`;
          const res = await fetch(url);
          const data = await res.json();
          return data?.results || [];
        };

        if (selectedCity === "all") {
          const cities = ["ggn", "delhi", "faridabad", "gNoida", "noida"];

          const promises = cities.flatMap((city) => [
            fetchCityData(`${city}CommercialProjects`, 3),
            fetchCityData(`${city}ResidentialProjects`, 3),
          ]);

          const results = await Promise.all(promises);
          finalData = results.flat();
        } else {
          const cityKeyMap: any = {
            gurgaon: "ggn",
            delhi: "delhi",
            faridabad: "faridabad",
            greaternoida: "gNoida",
            noida: "noida",
          };

          const base = cityKeyMap[selectedCity];

          const [commercial, residential] = await Promise.all([
            fetchCityData(`${base}CommercialProjects`, 3),
            fetchCityData(`${base}ResidentialProjects`, 3),
          ]);

          finalData = [...commercial, ...residential];
        }

        // ✅ Only keep top 3 (Hot Selling feel)
        setProjects(finalData.slice(0, 3));
      } catch (error) {
        console.error("Error fetching projects:", error);
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

          <h1 className="mx-4 text-2xl md:text-4xl font-corbert font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent uppercase tracking-wide">
            Hot Selling Real Estate Projects <br />
          </h1>

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

        {/* ✅ Project Cards */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {projects.length > 0 ? (
            projects.map((p: any, index: number) => (
              <div
                key={index}
                className="group overflow-hidden rounded-xs border-0 shadow-sm hover:shadow-lg transition"
              >
                <div className="relative h-60 w-full">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                  />
                </div>

                <div className="py-4 pl-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 py-2">
                    {p.name}
                  </h3>

                  <p className="text-sm text-gray-600 py-1">
                    {p.location || "N/A"}
                  </p>

                  <p className="mt-2 text-purple-700 font-semibold">
                    {p.price || "View Details"}
                  </p>

                  <Link
                    href={`/project-listing/${p.name
                      ?.toLowerCase()
                      .replace(/\s+/g, "-")}`}
                    className="mt-3 inline-flex items-center text-sm text-gray-900 font-medium hover:underline"
                  >
                    Read more <span className="ml-1">›</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-3 text-center">Loading projects...</p>
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