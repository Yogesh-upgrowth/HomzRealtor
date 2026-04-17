"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { slugify } from "@/components/utils/slugify";

export default function Page() {
  const params = useParams();
  const searchParams = useSearchParams();

  const city = params.city as string;
  const slug = params.slug as string;
  const enquiry = params.enquiry as string;

  const unit = searchParams.get("unit") || "";
  const price = searchParams.get("price") || "";

  const [project, setProject] = useState<any>(null);

  // ---------- cache helpers ----------
  const getCachedProject = (key: string) => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem(key) || "null");
  };

  const setCachedProject = (key: string, value: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  };

  // ---------- fetch logic ----------
  useEffect(() => {
    async function fetchProject() {
      try {
        if (!city || !slug) return;

        const cacheKey = `${city}-${slug}`;

        // cache check
        const cached = getCachedProject(cacheKey);
        if (cached) {
          setProject(cached);
          return;
        }

        const cityKeyMap: Record<string, string> = {
          ggn: "ggn",
          delhi: "delhi",
          faridabad: "faridabad",
          greaternoida: "gNoida",
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

  // ---------- UI ----------
  return (
    <div className="max-w-7xl mx-auto mt-20 p-4 text-black">
      <h1 className="text-xl font-bold">
        {project?.projectTitle || "Loading..."}
      </h1>

      <div className="mt-4 space-y-2">
        <p><b>City:</b> {city}</p>
        <p><b>Slug:</b> {slug}</p>
        <p><b>Enquiry:</b> {enquiry}</p>
        <p><b>Unit:</b> {unit}</p>
        <p><b>Price:</b> {price}</p>
      </div>
    </div>
  );
}