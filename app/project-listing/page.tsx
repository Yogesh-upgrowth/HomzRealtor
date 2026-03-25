"use client";
import React, { useEffect, useState } from "react";
import HomesCard from "@/components/HomeCards";
import PromoBanner from "@/components/Common/PromoBanner";
import Link from "next/link";
import areaImg from "@/public/Apartment.svg";
import unitImg from "@/public/bedroom.svg";
import statusImg from "@/public/developmentSize.svg";
import devImg from "@/public/totalUnit.svg";
import { slugify } from "@/components/utils/slugify";

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
};

const cityApiMap: Record<string, string> = {
  all: "allProjects",
  gurgaon: "ggnCommercialProjects",
  delhi: "delhiCommercialProjects",
  faridabad: "faridabadCommercialProjects",
  greaternoida: "gNoida",
  noida: "noidaProjects",
};

const ProjectListing = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCity, setSelectedCity] = useState("all");

  const isMobile = useIsMobile();
  const cardsPerPage = isMobile ? 4 : 8;

  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;

  const currentProjects = projects.slice(startIndex, endIndex);
  const totalPages = Math.ceil(projects.length / cardsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  // ✅ Fetch API
useEffect(() => {
  async function fetchData() {
    try {
      let finalData: any[] = [];

      // 🔥 Helper to fetch & return results
      const fetchCityData = async (cityKey: string, limit = 200) => {
        const url = `https://homzbackend.vercel.app/api/data?city=${cityKey}&page=1&limit=${limit}`;
        const res = await fetch(url);
        const data = await res.json();
        return data?.results || [];
      };

      if (selectedCity === "all") {
        // ✅ ALL → 10 from each API
        const cities = [
          "ggn",
          "delhi",
          "faridabad",
          "gNoida",
          "noida",
        ];

        const promises = cities.flatMap((city) => [
          fetchCityData(`${city}CommercialProjects`, 10),
          fetchCityData(`${city}ResidentialProjects`, 10),
        ]);

        const results = await Promise.all(promises);

        finalData = results.flat(); // merge all
      } else {
        // ✅ Single city → merge commercial + residential
        const cityKeyMap: any = {
          gurgaon: "ggn",
          delhi: "delhi",
          faridabad: "faridabad",
          greaternoida: "gNoida",
          noida: "noida",
        };

        const base = cityKeyMap[selectedCity];

        const [commercial, residential] = await Promise.all([
          fetchCityData(`${base}CommercialProjects`),
          fetchCityData(`${base}ResidentialProjects`),
        ]);

        finalData = [...commercial, ...residential];
      }

      setProjects(finalData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  fetchData();
}, [selectedCity]);

  // ✅ Transform API → Card Props
  const formatProject = (project: any) => ({
    imgUrl: project.image,
    location: project.location,
    reranumber: "N/A", // not available in API
    title: project.name,
    btntag: project.price || "View Details",
    specifications: [
      {
        icon: areaImg,
        label: "Area",
        value: project.totalArea || "N/A",
      },
      {
        icon: unitImg,
        label: "Units",
        value: project.noOfUnits || "N/A",
      },
      {
        icon: statusImg,
        label: "Status",
        value: project.projectStatus || "N/A",
      },
      {
        icon: devImg,
        label: "Developer",
        value: project.developer || "N/A",
      },
    ],
  });

  return (
    <div className="max-w-2xl md:max-w-7xl px-4 md:px-0 mx-auto mt-10">

      {/* Title + Dropdown */}
      <div className="flex flex-col items-center gap-4 mb-6 mt-32">
        <div className="flex items-center gap-4 w-full justify-center">
          <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-r from-black/50 to-transparent" />
          <h1 className="text-2xl md:text-3xl text-black font-corbert tracking-widest">
            Explore Homes
          </h1>
          <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-l from-black/50 to-transparent" />
        </div>

        {/* Dropdown */}
        <div className="relative w-[220px]">
        <select
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full appearance-none bg-white border border-gray-300 text-black px-4 py-2 pr-10 rounded-lg shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-black transition"
        >
          <option value="all">All</option>
          <option value="gurgaon">Gurgaon</option>
          <option value="delhi">Delhi</option>
          <option value="faridabad">Faridabad</option>
          <option value="greaternoida">Greater Noida</option>
          <option value="noida">Noida</option>
        </select>

        {/* Custom Arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-black">
          ▼
        </div>
      </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        {currentProjects.length > 0 ? (
          currentProjects.map((project: any, index: number) => (
            <Link
              key={index}
              href={`/project-listing/${slugify(project.name)}`}
            >
              <HomesCard {...formatProject(project)} />
            </Link>
          ))
        ) : (
          <p className="text-center col-span-2">No projects found</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center text-2xl items-center space-x-4 mt-8 mb-2">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 disabled:opacity-20 text-[#CEA44E] cursor-pointer font-bold"
        >
          ˂
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`px-4 py-2 text-white ${
              currentPage === pageNumber ? "bg-[#CEA44E] cursor-pointer" : "bg-black cursor-pointer"
            }`}
            onClick={() => setCurrentPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 disabled:opacity-20 text-[#CEA44E] cursor-pointer font-bold"
        >
          ˃
        </button>
      </div>

      {/* Banner */}
      <PromoBanner
        heading="SPACES CRAFTED FOR YOUR NEXT CHAPTER"
        text="Step into homes that resonate with your aspirations..."
        buttonText="CONTACT NOW"
        buttonLink="/contact"
        imageSrc="/appointmentBG.jpg"
      />
    </div>
  );
};

export default ProjectListing;