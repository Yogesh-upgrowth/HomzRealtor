"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import getValidImage from "./utils/helper/getValidImage";
import { slugify } from "./utils/slugify";
import SafeProjectImage from "./Home/SafeProjectImage";

interface Project {
  name: string;
  location: string;
  price?: string;
  image: string;
}

export default function HotSelling() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Each call catches its own error and resolves to [] rather than
        // rejecting — otherwise a single flaky endpoint (Promise.all fails
        // fast on the first rejection) would blank out the entire section
        // even when the other call succeeded.
        const fetchCityData = async (cityKey: string, citySlug: string, limit = 3) => {
          try {
            const url = `https://homzbackend.vercel.app/api/data?city=${cityKey}&page=1&limit=${limit}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data?.results || [])
              .filter((item: any) => Array.isArray(item.images) && item.images.length > 0)
              .map((item: any) => ({ ...item, citySlug }));
          } catch {
            return [];
          }
        };

        // Gurgaon-only — the site's sole focus market. "ggn" is the raw API
        // city key; "gurgaon" is the canonical URL slug used in card links
        // (must match canonicalCitySlug() in lib/intelligence/projects.ts).
        const [commercial, residential] = await Promise.all([
          fetchCityData("ggnCommercialProjects", "gurgaon"),
          fetchCityData("ggnResidentialProjects", "gurgaon"),
        ]);

        setProjects([...commercial, ...residential].slice(0, 4));
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
          <Link href="/project-listing" className="text-[13px] font-bold text-[#D9B268] whitespace-nowrap">
            View All →
          </Link>
        </div>
      </div>

      {/* Project cards — responsive grid, no horizontal scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#141416] animate-pulse">
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
                className="group overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#141416] hover:border-[#D9B268]/35 hover:-translate-y-1 transition"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  {image ? (
                    <SafeProjectImage
                      src={image}
                      alt={p.projectTitle}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
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