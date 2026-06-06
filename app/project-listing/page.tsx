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
import customer from "@/assets/images/customer.png";

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

const CardSkeleton = () => (
  <div className="w-full rounded-sm overflow-hidden shadow-sm bg-white animate-pulse">
    <div className="w-full h-[230px] md:h-[304px] bg-gray-200" />
    <div className="flex py-2 pl-2 gap-2">
      <div className="h-5 w-28 bg-gray-200 rounded" />
    </div>
    <div className="p-4 space-y-3">
      <div className="h-5 w-3/4 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
    <div className="p-3 border-t">
      <div className="h-9 bg-gray-200 rounded" />
    </div>
  </div>
);

const ProjectListing = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCity, setSelectedCity] = useState("all");

  const isMobile = useIsMobile();
  const cardsPerPage = isMobile ? 4 : 8;

  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;

  const currentProjects = projects.slice(startIndex, endIndex);
  const totalPages = Math.ceil(projects.length / cardsPerPage);

  // ✅ Helpers
  const getValidImage = (images: string[] = []) => {
    return images.find(
      (url) =>
        typeof url === "string" &&
        /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
    );
  };

  const hasValidImage = (images: string[] = []) => {
    return images.some(
      (url) =>
        typeof url === "string" &&
        /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
    );
  };

  // ✅ Pagination
  const getVisiblePages = () => {
    if (!isMobile) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const maxVisible = 4;
    let start = currentPage;
    let end = currentPage + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  // ✅ Fetch API
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let finalData: any[] = [];

        const fetchCityData = async (key: string, limit = 20) => {
          const res = await fetch(
            `https://homzbackend.vercel.app/api/data?city=${key}&page=1&limit=${limit}`
          );
          const data = await res.json();
          return data?.results || [];
        };

        const cityKeyMap: any = {
          gurgaon: "ggn",
          delhi: "delhi",
          faridabad: "faridabad",
          greaternoida: "gNoida",
          noida: "noida",
        };

        // 🔥 ALL cities
        if (selectedCity === "all") {
          const bases = ["ggn", "delhi", "faridabad", "gNoida", "noida"];

          const promises = bases.flatMap((base) => [
            fetchCityData(`${base}CommercialProjects`),
            fetchCityData(`${base}ResidentialProjects`),
          ]);

          const results = await Promise.all(promises);

          // ✅ attach city properly
          finalData = results.flatMap((arr, index) => {
            const baseIndex = Math.floor(index / 2);
            const city = bases[baseIndex];

            return arr.map((item: any) => ({
              ...item,
              city,
            }));
          });
        } else {
          const base = cityKeyMap[selectedCity];

          if (!base) return;

          const keys = [
            `${base}CommercialProjects`,
            `${base}ResidentialProjects`,
          ];

          const results = await Promise.all(
            keys.map((key) => fetchCityData(key))
          );

          finalData = results.flat().map((item: any) => ({
            ...item,
            city: base,
          }));
        }

        // ✅ Sort: images first
        finalData.sort((a, b) => {
          const aHas = hasValidImage(a.images);
          const bHas = hasValidImage(b.images);
          return Number(bHas) - Number(aHas);
        });

        setProjects(finalData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedCity]);

  // ✅ Format for card
  const formatProject = (project: any) => ({
    imgUrl: getValidImage(project.images) || "/fallback.jpg",
    location: project.location || "N/A",
    reranumber: project.reraId || "N/A",
    title: project.projectTitle || "Untitled Project",
    btntag: project.price || "View Details",
    specifications: [
      {
        icon: areaImg,
        label: "Area",
        value: project.size || "N/A",
      },
      {
        icon: unitImg,
        label: "Type",
        value: project.BHKType || "Retail",
      },
      {
        icon: statusImg,
        label: "RERA",
        value: project.reraId || "N/A",
      },
      {
        icon: devImg,
        label: "Developer",
        value: "N/A",
      },
    ],
  });

  return (
    <div className="max-w-2xl md:max-w-7xl text-black px-4 md:px-0 mx-auto mt-10">

      {/* Title + Dropdown */}
      <div className="flex flex-col items-center gap-4 mb-6 mt-32">
        <div className="flex items-center gap-4 w-full justify-center">
          <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-r from-black/50 to-transparent" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest">
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
            className="w-full bg-white border px-4 py-2 rounded-lg shadow-sm"
          >
            <option value="all">All</option>
            <option value="gurgaon">Gurgaon</option>
            <option value="delhi">Delhi</option>
            <option value="faridabad">Faridabad</option>
            <option value="greaternoida">Greater Noida</option>
            <option value="noida">Noida</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        {loading ? (
          [...Array(isMobile ? 4 : 8)].map((_, i) => <CardSkeleton key={i} />)
        ) : currentProjects.length > 0 ? (
          currentProjects.map((project: any, index: number) => (
            <Link
              key={index}
              href={`/project-listing/${project.city}/${slugify(
                project?.projectTitle || "project"
              )}`}
            >
              <HomesCard {...formatProject(project)} />
            </Link>
          ))
        ) : (
          <p className="text-center col-span-2 text-gray-500 py-16">No projects found</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6 mb-2 text-sm sm:text-base">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-[#CEA44E] font-bold disabled:opacity-30"
        >
          ‹
        </button>

        {getVisiblePages().map((p) => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`px-3 py-2 rounded-md ${
              currentPage === p
                ? "bg-[#CEA44E] text-black"
                : "bg-black text-white"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(p + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-[#CEA44E] font-bold disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* Banner */}
      <PromoBanner
        heading="SPACES CRAFTED FOR YOUR NEXT CHAPTER"
        text="Step into homes that resonate with your aspirations."
        buttonText="CONTACT NOW"
        buttonLink="/contact"
        imageSrc={customer}
      />
    </div>
  );
};

export default ProjectListing;