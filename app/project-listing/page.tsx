"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import HomesCard from "@/components/HomeCards";
import PromoBanner from "@/components/Common/PromoBanner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import areaImg from "@/public/Apartment.svg";
import unitImg from "@/public/bedroom.svg";
import statusImg from "@/public/developmentSize.svg";
import devImg from "@/public/totalUnit.svg";
import { slugify } from "@/components/utils/slugify";
import {
  extractSector,
  extractPriceRange,
  extractMicroMarket,
  extractBuilder,
  slugify as toSlug,
} from "@/lib/intelligence/normalize";
import { deriveStatusFromText } from "@/lib/intelligence/view-model";
import customer from "@/assets/images/customer.png";
import { instrumentSerif, manrope } from "@/lib/fonts";

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
  <div className="w-full rounded-[18px] overflow-hidden border border-white/[0.08] bg-[#141416] animate-pulse">
    <div className="w-full h-[230px] md:h-[304px] bg-white/5" />
    <div className="flex py-2 pl-2 gap-2">
      <div className="h-5 w-28 bg-white/5 rounded" />
    </div>
    <div className="p-4 space-y-3">
      <div className="h-5 w-3/4 bg-white/5 rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-white/5 rounded" />
        ))}
      </div>
    </div>
    <div className="p-3 border-t border-white/[0.08]">
      <div className="h-9 bg-white/5 rounded" />
    </div>
  </div>
);

// Budget range keys (shared with QuickSearchPanel) → min/max in rupees.
const BUDGET_RANGES: Record<string, { min: number; max: number | null }> = {
  "under-50l": { min: 0, max: 50_00_000 },
  "50l-1cr": { min: 50_00_000, max: 1_00_00_000 },
  "1cr-2cr": { min: 1_00_00_000, max: 2_00_00_000 },
  "above-2cr": { min: 2_00_00_000, max: null },
  "under-1cr": { min: 0, max: 1_00_00_000 },
  "under-2cr": { min: 0, max: 2_00_00_000 },
};

const COMMERCIAL_TYPES = new Set(["Commercial", "Office Space", "Retail"]);
const RESIDENTIAL_TYPES = new Set(["Apartment", "Villa"]);

function ProjectListingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSector, setSelectedSector] = useState("all");

  // Search filters — seeded from the URL so a search from the homepage hero
  // (or any shared/bookmarked link) actually lands on filtered results.
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const budget = searchParams.get("budget") || "";
  const bhk = searchParams.get("bhk") || "";
  const status = searchParams.get("status") || "";
  const micromarket = searchParams.get("micromarket") || "";
  const builder = searchParams.get("builder") || "";
  const hasActiveFilters = Boolean(q || type || budget || bhk || status || micromarket || builder);

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const query = params.toString();
    router.push(query ? `/project-listing?${query}` : "/project-listing");
  };

  const isMobile = useIsMobile();
  const cardsPerPage = isMobile ? 4 : 8;

  // Sector options within Gurgaon, derived from the fetched projects
  // (the backend has no sector field — it's extracted from title + about text).
  const sectorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      if (!p?._sector) continue;
      counts.set(p._sector, (counts.get(p._sector) || 0) + 1);
    }
    const sortKey = (s: string) => {
      const m = s.match(/(\d+)/);
      return m ? parseInt(m[1], 10) : 9999;
    };
    return Array.from(counts.entries())
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => sortKey(a.sector) - sortKey(b.sector));
  }, [projects]);

  // Apply the sector filter, then the search filters (q / type / budget / bhk),
  // before paginating. Every filter here is genuinely applied — nothing is a
  // no-op default. `type` only constrains results when it maps to something
  // real in the data (commercial vs. residential); "Plot" does a best-effort
  // text match since the feed has no explicit property-type field.
  const visibleProjects = useMemo(() => {
    let list =
      selectedSector === "all"
        ? projects
        : projects.filter((p) => p?._sector === selectedSector);

    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.projectTitle?.toLowerCase().includes(needle) ||
          p.location?.toLowerCase().includes(needle) ||
          p._sector?.toLowerCase().includes(needle)
      );
    }

    if (type) {
      if (COMMERCIAL_TYPES.has(type)) {
        list = list.filter((p) => p._category === "commercial");
      } else if (RESIDENTIAL_TYPES.has(type)) {
        list = list.filter((p) => p._category === "residential");
      } else if (type === "Plot") {
        list = list.filter((p) =>
          `${p.projectTitle || ""} ${(p.aboutProject || []).join(" ")}`
            .toLowerCase()
            .match(/\bplot|\bland\b/)
        );
      }
    }

    if (bhk) {
      list = list.filter((p) => p.BHKType?.toLowerCase().includes(bhk.toLowerCase()));
    }

    if (budget && BUDGET_RANGES[budget]) {
      const { min, max } = BUDGET_RANGES[budget];
      list = list.filter((p) => {
        const { min: priceMin } = extractPriceRange(p.price);
        if (priceMin == null) return false;
        return priceMin >= min && (max == null || priceMin < max);
      });
    }

    if (status) {
      const target =
        status === "ready-to-move"
          ? "Ready to Move"
          : status === "under-construction"
          ? "Under Construction"
          : status === "new-launch"
          ? "New Launch"
          : null;
      if (target) list = list.filter((p) => p._status === target);
    }

    if (micromarket === "golf-course-road") {
      // Both Golf Course Road and Golf Course Extension Road count as
      // "golf-facing" — matches the homepage Collections tile's grouping.
      list = list.filter((p) => p._microMarket?.toLowerCase().includes("golf"));
    } else if (micromarket) {
      list = list.filter((p) => p._microMarket && toSlug(p._microMarket) === micromarket);
    }

    if (builder) {
      list = list.filter((p) => toSlug(p._builder || "") === builder);
    }

    return list;
  }, [projects, selectedSector, q, type, budget, bhk, status, micromarket, builder]);

  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;

  const currentProjects = visibleProjects.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(visibleProjects.length / cardsPerPage));

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

  useEffect(() => {
    setCurrentPage(1);
  }, [q, type, budget, bhk, status, micromarket, builder]);

  // ✅ Fetch API
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Each call catches its own error and resolves to [] rather than
        // rejecting — otherwise Promise.all fails fast on the first
        // rejection and blanks out the whole page even when most of the
        // endpoints succeeded.
        // limit=500 matches lib/intelligence/projects.ts's fetchCityRaw — keeps
        // this page's filtered counts consistent with the homepage Collections
        // tiles, which query the full catalogue via getProjectsForCity.
        const fetchCityData = async (key: string, limit = 500) => {
          try {
            const res = await fetch(
              `https://homzbackend.vercel.app/api/data?city=${key}&page=1&limit=${limit}`
            );
            if (!res.ok) return [];
            const data = await res.json();
            return data?.results || [];
          } catch {
            return [];
          }
        };

        // Gurgaon-only — the site's sole focus market. "ggn" is the raw API
        // city key; "gurgaon" is the canonical URL slug used in card links
        // (must match canonicalCitySlug() in lib/intelligence/projects.ts).
        const results = await Promise.all([
          fetchCityData("ggnCommercialProjects"),
          fetchCityData("ggnResidentialProjects"),
        ]);

        const finalData: any[] = results.flatMap((arr, index) =>
          arr.map((item: any) => ({
            ...item,
            city: "gurgaon",
            _category: index === 0 ? "commercial" : "residential",
          }))
        );

        // ✅ Sort: images first
        finalData.sort((a, b) => {
          const aHas = hasValidImage(a.images);
          const bHas = hasValidImage(b.images);
          return Number(bHas) - Number(aHas);
        });

        // ✅ Derive sector / micro-market / status / builder for each project
        // (title + about text + feed status/possession) for filtering
        const withSector = finalData.map((item) => ({
          ...item,
          _sector: extractSector(
            item.projectTitle,
            item.aboutProject,
            item.location
          ),
          _microMarket: extractMicroMarket(
            item.projectTitle,
            item.aboutProject,
            item.location
          ),
          _status: deriveStatusFromText(item.projectStatus, item.possession),
          _builder: extractBuilder(item.projectTitle),
        }));

        setProjects(withSector);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ✅ Format for card
  const formatProject = (project: any) => ({
    imgUrl: getValidImage(project.images) || "/dummy.svg",
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

  const activeFilterChips = [
    q && { key: "q", label: `"${q}"` },
    type && { key: "type", label: type },
    budget && { key: "budget", label: BUDGET_RANGES[budget] ? budget.replace(/-/g, " ") : budget },
    bhk && { key: "bhk", label: `${bhk} BHK` },
    status && { key: "status", label: status.replace(/-/g, " ") },
    micromarket && { key: "micromarket", label: micromarket.replace(/-/g, " ") },
    builder && { key: "builder", label: builder.replace(/-/g, " ") },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className={`${instrumentSerif.variable} ${manrope.variable} font-ui min-h-screen bg-[#0B0B0C] text-white`}>
      <div className="max-w-2xl md:max-w-7xl px-4 md:px-2 mx-auto pt-32 pb-16">

        {/* Title + Dropdown */}
        <div className="flex flex-col items-center gap-5 mb-10">
          <div className="flex items-center gap-4 w-full justify-center">
            <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-r from-white/25 to-transparent" />
            <h1 className="font-display text-3xl md:text-5xl font-normal tracking-tight text-center text-white">
              Residential &amp; Commercial Projects in Gurgaon
            </h1>
            <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-l from-white/25 to-transparent" />
          </div>

          {/* Active search filters — confirms the user's search was received */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => clearFilter(chip.key)}
                  className="flex items-center gap-1.5 rounded-full border border-[#D9B268]/30 bg-[#D9B268]/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#D9B268]"
                >
                  {chip.label}
                  <X size={12} />
                </button>
              ))}
              <Link href="/project-listing" className="text-[12.5px] text-gray-500 hover:text-gray-300 underline">
                Clear all
              </Link>
            </div>
          )}

          {/* Sector filter — Gurgaon-only */}
          {sectorOptions.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="relative w-[220px]">
                <select
                  value={selectedSector}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-2.5 text-white outline-none focus:border-[#D9B268] transition-colors"
                >
                  <option value="all">All Sectors</option>
                  {sectorOptions.map((s) => (
                    <option key={s.sector} value={s.sector}>
                      {s.sector} ({s.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Link through to the dedicated sector page(s) */}
          {sectorOptions.length > 0 && (
            <Link
              href={
                selectedSector === "all"
                  ? `/project-listing/gurgaon/sectors`
                  : `/project-listing/gurgaon/sectors/${slugify(
                      selectedSector
                    )}`
              }
              className="text-sm font-medium text-[#D9B268] hover:opacity-80 transition"
            >
              {selectedSector === "all"
                ? "Browse all sectors →"
                : `Open ${selectedSector} page →`}
            </Link>
          )}
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
            <div className="text-center col-span-2 py-16">
              <p className="text-gray-400 mb-3">
                {hasActiveFilters
                  ? "No projects match your search."
                  : "No projects found"}
              </p>
              {hasActiveFilters && (
                <Link href="/project-listing" className="text-sm font-medium text-[#D9B268] hover:opacity-80">
                  Clear filters and browse all projects →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {visibleProjects.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-6 mb-2 text-sm sm:text-base">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#D9B268] hover:border-[#D9B268] disabled:opacity-30 disabled:hover:border-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {getVisiblePages().map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`h-10 w-10 rounded-full font-semibold transition-colors ${
                  currentPage === p
                    ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                    : "border border-white/10 text-gray-300 hover:border-[#D9B268]/40"
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#D9B268] hover:border-[#D9B268] disabled:opacity-30 disabled:hover:border-white/10 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Banner */}
        <PromoBanner
          heading="SPACES CRAFTED FOR YOUR NEXT CHAPTER"
          text="Step into homes that resonate with your aspirations."
          buttonText="CONTACT NOW"
          buttonLink="/contact"
          imageSrc={customer}
        />
      </div>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary in a client-rendered page.
export default function ProjectListing() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0C]" />}>
      <ProjectListingInner />
    </Suspense>
  );
}
