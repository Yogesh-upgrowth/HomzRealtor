"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { slugify } from "@/components/utils/slugify";
import Carousel from "@/components/Carousel";

import {
  Zap,
  Utensils,
  Droplets,
  Car,
  Shield,
  Waves,
  Trees,
  Building2,
} from "lucide-react";

function EnquiryContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const city = (params?.city as string) || "";
  const slug = (params?.slug as string) || "";
  const enquiry = (params?.enquiry as string) || "";

  const unit = searchParams.get("unit") || "";
  const price = searchParams.get("price") || "";

  const [project, setProject] = useState<any>(null);

  const getCachedProject = (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };

  const setCachedProject = (key: string, value: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  };

  useEffect(() => {
    async function fetchProject() {
      try {
        if (!city || !slug) return;

        const cacheKey = `${city}-${slug}`;

        const cached = getCachedProject(cacheKey);
        if (cached) {
          setProject(cached);
          return;
        }

        const cityKeyMap: Record<string, string> = {
          ggn: "ggn",
          gurgaon: "ggn",
          delhi: "delhi",
          faridabad: "faridabad",
          greaternoida: "gNoida",
          gnoida: "gNoida",
          gNoida: "gNoida",
          noida: "noida",
        };

        const base = cityKeyMap[city];
        if (!base) return;

        const fetchData = async (type: string) => {
          const res = await fetch(
            `https://homzbackend.vercel.app/api/data?city=${base}${type}&page=1&limit=200`
          );
          const data = await res.json();
          return data?.results || [];
        };

        const [commercial, residential] = await Promise.all([
          fetchData("CommercialProjects"),
          fetchData("ResidentialProjects"),
        ]);

        const allProjects = [...commercial, ...residential];

        const matched = allProjects.find(
          (p) => slugify(p?.projectTitle || "") === slug
        );

        if (matched) {
          setProject(matched);
          setCachedProject(cacheKey, matched);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      }
    }

    fetchProject();
  }, [city, slug]);

  const images =
    project?.interiorImages?.filter((img: string) =>
      img.match(/\.(jpg|jpeg|png|webp)/)
    ) || [];

  const convenience = project?.amenities?.find(
    (item: any) => item.category?.toLowerCase() === "convenience"
  );

  const specifications = project?.specifications || [];

  const getAmenityIcon = (item: string) => {
    const key = item.toLowerCase();

    if (key.includes("power")) return Zap;
    if (key.includes("restaurant")) return Utensils;
    if (key.includes("water")) return Droplets;
    if (key.includes("parking") || key.includes("car")) return Car;
    if (key.includes("security") || key.includes("cctv")) return Shield;
    if (key.includes("pool")) return Waves;
    if (key.includes("park") || key.includes("green")) return Trees;

    return Building2;
  };

  return (
    <div className="max-w-7xl mx-auto mt-20 p-4 text-black">

      {/* Title */}
      <h1 className="text-3xl mx-auto mt-10 text-center font-bold tracking-tight text-gray-900 mb-6">
        {project?.projectTitle || "Loading..."}
      </h1>

      {/* Carousel */}
      <div className="mb-8">
        {project && <Carousel images={images} />}
      </div>

      {/* Amenities */}
      {convenience && (
        <>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Amenities
        </h2>
        <div className="bg-black border border-gray-700 rounded-xl p-5 mb-8">
            

          <h2 className="text-xl font-semibold text-white mb-4">
            {convenience.category}
          </h2>

          <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-300">
            {convenience.amenities.map((item: string, index: number) => {
              const Icon = getAmenityIcon(item);

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-zinc-900 transition"
                >
                  <Icon size={16} className="text-yellow-400 shrink-0" />
                  <span>{item}</span>
                </div>
              );
            })}
          </div>

        </div>
        </>
      )}

      {/* Specifications */}
      {specifications.length > 0 && (
        <div className="mb-10">

          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Specifications
          </h2>

          <div className="overflow-x-auto border border-gray-300 rounded-md">
            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-yellow-600/80 text-white text-left">
                  <th className="px-6 py-4 border-r border-gray-700">
                    CATEGORY
                  </th>
                  <th className="px-6 py-4">
                    DETAILS
                  </th>
                </tr>
              </thead>

              <tbody>
                {specifications.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="bg-black text-white border-t transition"
                  >
                    <td className="px-6 py-4 border-r border-gray-200 font-medium">
                      {item.heading}
                    </td>
                    <td className="px-6 py-4">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>
      )}

    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <EnquiryContent />
    </Suspense>
  );
}