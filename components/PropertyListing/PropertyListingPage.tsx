"use client";

// Shared listing page for the four individual-listing categories (Sale/Rent/
// Pg/Commercial) — one component parametrized by `category` instead of four
// near-identical page files. Mirrors app/project-listing/page.tsx's
// architecture (URL-param-driven filters, one useMemo filter pipeline,
// client-side pagination) but is simpler in one respect: the backend already
// provides clean structured fields (propertyType, bedrooms, listingType,
// investmentScore) directly, so — unlike Projects — there's no need to
// regex-extract sector/builder/status from free text.

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import HomesCard from "@/components/HomeCards";
import PromoBanner from "@/components/Common/PromoBanner";
import LoadError from "@/components/Common/LoadError";
import SaveToggleButton from "@/components/Common/SaveToggleButton";
import areaImg from "@/public/Apartment.svg";
import unitImg from "@/public/bedroom.svg";
import statusImg from "@/public/developmentSize.svg";
import devImg from "@/public/totalUnit.svg";
import customer from "@/assets/images/customer.png";
import { slugify } from "@/components/utils/slugify";
import { instrumentSerif, manrope } from "@/lib/fonts";
import { useHomzProperties } from "@/hooks/useHomzProperties";
import {
  propertySegment,
  type PropertyCategory,
  type RawHomzProperty,
} from "@/lib/scraping/homzbackend";
import { canonicalCitySlug } from "@/lib/intelligence/projects";
import { validImages } from "@/lib/intelligence/view-model";

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
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

// Same budget keys as app/project-listing/page.tsx's BUDGET_RANGES, in rupees.
// Sale/Commercial listings are priced via priceValue (crore scale — Commercial
// has zero rentMonthly records in the feed, confirmed against live data: every
// priced commercial listing carries priceValue, none carry rentMonthly).
const BUDGET_RANGES_SALE: Record<string, { min: number; max: number | null }> = {
  "under-50l": { min: 0, max: 50_00_000 },
  "50l-1cr": { min: 50_00_000, max: 1_00_00_000 },
  "1cr-2cr": { min: 1_00_00_000, max: 2_00_00_000 },
  "above-2cr": { min: 2_00_00_000, max: null },
  "under-1cr": { min: 0, max: 1_00_00_000 },
  "under-2cr": { min: 0, max: 2_00_00_000 },
};

// Rent/PG listings are priced via rentMonthly (rupee scale, confirmed range
// ~6,000-8,30,000/month in the live feed) — filtering these against the
// crore-scale ranges above meant a "value >= min" check against e.g.
// 2,00,00,000 could never pass for any real monthly rent, so every budget
// filter on /rent-property silently returned zero results no matter what
// else was searched.
const BUDGET_RANGES_RENT: Record<string, { min: number; max: number | null }> = {
  "under-25k": { min: 0, max: 25_000 },
  "25k-50k": { min: 25_000, max: 50_000 },
  "50k-1l": { min: 50_000, max: 1_00_000 },
  "1l-3l": { min: 1_00_000, max: 3_00_000 },
  "above-3l": { min: 3_00_000, max: null },
};

const ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

const CATEGORY_HEADING: Record<PropertyCategory, string> = {
  Sale: "Properties for Sale in Gurgaon",
  Rent: "Properties for Rent in Gurgaon",
  Pg: "PG Accommodations in Gurgaon",
  Commercial: "Commercial Properties in Gurgaon",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  builder_floor: "Builder Floor",
  independent_house: "Independent House",
  villa: "Villa",
  plot: "Plot",
  penthouse: "Penthouse",
  studio: "Studio",
  office: "Office",
  retail_shop: "Retail Shop",
  showroom: "Showroom",
  warehouse: "Warehouse",
  co_working: "Co-working Space",
  farmhouse: "Farmhouse",
  serviced_apartment: "Serviced Apartment",
  other: "Other",
};

// investmentScore is 0-100 from the backend's real enrichment pipeline
// (homz enrich scores) — not a heuristic. 60 is a reasonable "worth a closer
// look" bar; revisit once there's usage data on the actual score distribution.
const INVESTMENT_GRADE_THRESHOLD = 60;

const getValidImage = (images: string[] = []) => validImages(images)[0];

const hasValidImage = (images: string[] = []) => validImages(images).length > 0;

// Individual listings don't have unique titles the way projects do (many
// units share "3 BHK Flat for Sale in Sector 60"), so the slug must include
// part of the backend's stable id to avoid collisions — see
// docs/listings-feed-contract.md in Homz-Scrape.
function slugFor(property: RawHomzProperty): string {
  const idTail = (property.id || "").split(":").pop()?.slice(-8) || "";
  return `${slugify(property.title || "property")}-${idTail}`;
}

function PropertyListingInner({
  category,
  cityKey = "ggn",
}: {
  category: PropertyCategory;
  cityKey?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeBase = ROUTE_BASE[category];
  const citySlug = canonicalCitySlug(cityKey);
  const isRentScale = category === "Rent" || category === "Pg";
  const budgetRanges = isRentScale ? BUDGET_RANGES_RENT : BUDGET_RANGES_SALE;

  // limit=10000: this segment is exported in full by the backend (no 500-cap
  // truncation — that was a real bug fixed earlier), so this must ask for
  // more than any segment's real size rather than silently re-truncating it
  // client-side.
  const SOURCES = useMemo(
    () => [{ segment: propertySegment(cityKey, category), limit: 10_000 }],
    [cityKey, category]
  );
  const { data, loading, error, retry } = useHomzProperties(SOURCES);

  const [currentPage, setCurrentPage] = useState(1);

  const q = searchParams.get("q") || "";
  const propertyType = searchParams.get("type") || "";
  const budget = searchParams.get("budget") || "";
  const bedrooms = searchParams.get("bedrooms") || "";
  const possession = searchParams.get("possession") || "";
  const saleType = searchParams.get("saleType") || ""; // Sale category only: resale | new_launch
  const golf = searchParams.get("golf") === "1";
  const investmentGrade = searchParams.get("investmentGrade") === "1"; // Commercial only

  const hasActiveFilters = Boolean(
    q || propertyType || budget || bedrooms || possession || saleType || golf || investmentGrade
  );

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.push(query ? `/${routeBase}?${query}` : `/${routeBase}`);
  };

  const clearFilter = (key: string) => setParam(key, null);

  const isMobile = useIsMobile();
  const cardsPerPage = isMobile ? 4 : 8;

  const properties = useMemo(() => {
    const flat = data.flat();
    // Images first, same as Projects — a card with no photo reads as broken.
    return [...flat].sort(
      (a, b) => Number(hasValidImage(b.images)) - Number(hasValidImage(a.images))
    );
  }, [data]);

  const propertyTypeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of properties) {
      if (!p.propertyType) continue;
      counts.set(p.propertyType, (counts.get(p.propertyType) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count, label: PROPERTY_TYPE_LABELS[value] || value }))
      .sort((a, b) => b.count - a.count);
  }, [properties]);

  const bedroomOptions = useMemo(() => {
    const values = new Set<number>();
    for (const p of properties) {
      if (typeof p.bedrooms === "number" && p.bedrooms > 0) values.add(p.bedrooms);
    }
    return Array.from(values).sort((a, b) => a - b);
  }, [properties]);

  const visibleProperties = useMemo(() => {
    let list = properties;

    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(needle) || p.location?.toLowerCase().includes(needle)
      );
    }

    if (propertyType) list = list.filter((p) => p.propertyType === propertyType);
    if (bedrooms) {
      // "4+" (the homepage search's top BHK option) means "4 or more" — an
      // exact string match against bedrooms would never match a listing with
      // 5 bedrooms, silently hiding real inventory from that search.
      if (bedrooms.endsWith("+")) {
        const min = parseInt(bedrooms, 10);
        list = list.filter((p) => typeof p.bedrooms === "number" && p.bedrooms >= min);
      } else {
        list = list.filter((p) => String(p.bedrooms ?? "") === bedrooms);
      }
    }

    if (budget && budgetRanges[budget]) {
      const { min, max } = budgetRanges[budget];
      list = list.filter((p) => {
        const value = p.priceValue ?? p.rentMonthly;
        if (value == null) return false;
        return value >= min && (max == null || value < max);
      });
    }

    if (possession) {
      const target =
        possession === "ready-to-move"
          ? "Ready to Move"
          : possession === "under-construction"
          ? "Under Construction"
          : possession === "new-launch"
          ? "New Launch"
          : null;
      if (target) list = list.filter((p) => p.projectStatus === target);
    }

    // Resale vs. New Launch is a sub-filter within Sale, not a separate
    // top-level category — Sale pools sale/resale/new_launch/project together
    // by design (see docs/listings-feed-contract.md).
    if (category === "Sale" && saleType) {
      list = list.filter((p) => p.listingType === saleType);
    }

    if (golf) {
      list = list.filter((p) =>
        `${p.location || ""} ${(p.aboutProject || []).join(" ")}`.toLowerCase().includes("golf")
      );
    }

    if (category === "Commercial" && investmentGrade) {
      list = list.filter((p) => (p.investmentScore ?? 0) >= INVESTMENT_GRADE_THRESHOLD);
    }

    return list;
  }, [
    properties,
    q,
    propertyType,
    bedrooms,
    budget,
    possession,
    saleType,
    golf,
    investmentGrade,
    category,
  ]);

  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentProperties = visibleProperties.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(visibleProperties.length / cardsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, propertyType, budget, bedrooms, possession, saleType, golf, investmentGrade]);

  const formatProperty = (property: RawHomzProperty) => ({
    imgUrl: getValidImage(property.images) || "/dummy.svg",
    location: property.location || "N/A",
    reranumber: property.reraId || "N/A",
    title: property.title || "Untitled Listing",
    btntag: property.price || "View Details",
    specifications: [
      { icon: areaImg, label: "Area", value: property.size || "N/A" },
      {
        icon: unitImg,
        label: "Config",
        value: property.configuration || (property.bedrooms ? `${property.bedrooms} BHK` : "N/A"),
      },
      { icon: statusImg, label: "Status", value: property.projectStatus || "N/A" },
      {
        icon: devImg,
        label: "Type",
        value: PROPERTY_TYPE_LABELS[property.propertyType || ""] || "N/A",
      },
    ],
  });

  const activeFilterChips = [
    q && { key: "q", label: `"${q}"` },
    propertyType && { key: "type", label: PROPERTY_TYPE_LABELS[propertyType] || propertyType },
    budget && { key: "budget", label: budget.replace(/-/g, " ") },
    bedrooms && { key: "bedrooms", label: `${bedrooms} BHK` },
    possession && { key: "possession", label: possession.replace(/-/g, " ") },
    saleType && { key: "saleType", label: saleType === "new_launch" ? "New Launch" : "Resale" },
    golf && { key: "golf", label: "Near Golf Course" },
    investmentGrade && { key: "investmentGrade", label: "Investment Grade" },
  ].filter(Boolean) as { key: string; label: string }[];

  const selectClass =
    "rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D9B268] transition-colors";
  const toggleClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
      active
        ? "border-[#D9B268]/60 bg-[#D9B268]/15 text-[#D9B268]"
        : "border-white/10 text-gray-300 hover:border-[#D9B268]/40"
    }`;

  return (
    <div
      className={`${instrumentSerif.variable} ${manrope.variable} font-ui min-h-screen bg-[#0B0B0C] text-white`}
    >
      <div className="max-w-2xl md:max-w-7xl px-4 md:px-2 mx-auto pt-32 pb-16">
        <div className="flex flex-col items-center gap-5 mb-10">
          <div className="flex items-center gap-4 w-full justify-center">
            <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-r from-white/25 to-transparent" />
            <h1 className="font-display text-3xl md:text-5xl font-normal tracking-tight text-center text-white">
              {CATEGORY_HEADING[category]}
            </h1>
            <div className="md:w-[200px] w-[100px] h-px bg-gradient-to-l from-white/25 to-transparent" />
          </div>

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
              <Link href={`/${routeBase}`} className="text-[12.5px] text-gray-500 hover:text-gray-300 underline">
                Clear all
              </Link>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {propertyTypeOptions.length > 0 && (
              <select
                value={propertyType}
                onChange={(e) => setParam("type", e.target.value || null)}
                className={selectClass}
              >
                <option value="">All Property Types</option>
                {propertyTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.count})
                  </option>
                ))}
              </select>
            )}

            {bedroomOptions.length > 0 && (
              <select
                value={bedrooms}
                onChange={(e) => setParam("bedrooms", e.target.value || null)}
                className={selectClass}
              >
                <option value="">Any BHK</option>
                {bedroomOptions.map((b) => (
                  <option key={b} value={b}>
                    {b} BHK
                  </option>
                ))}
              </select>
            )}

            <select
              value={budget}
              onChange={(e) => setParam("budget", e.target.value || null)}
              className={selectClass}
            >
              <option value="">Any Budget</option>
              {isRentScale ? (
                <>
                  <option value="under-25k">Under ₹25k/mo</option>
                  <option value="25k-50k">₹25k - ₹50k/mo</option>
                  <option value="50k-1l">₹50k - ₹1L/mo</option>
                  <option value="1l-3l">₹1L - ₹3L/mo</option>
                  <option value="above-3l">Above ₹3L/mo</option>
                </>
              ) : (
                <>
                  <option value="under-50l">Under 50 L</option>
                  <option value="50l-1cr">50 L - 1 Cr</option>
                  <option value="1cr-2cr">1 Cr - 2 Cr</option>
                  <option value="above-2cr">Above 2 Cr</option>
                </>
              )}
            </select>

            <select
              value={possession}
              onChange={(e) => setParam("possession", e.target.value || null)}
              className={selectClass}
            >
              <option value="">Any Possession Status</option>
              <option value="ready-to-move">Ready to Move</option>
              <option value="under-construction">Under Construction</option>
              <option value="new-launch">New Launch</option>
            </select>

            {category === "Sale" && (
              <select
                value={saleType}
                onChange={(e) => setParam("saleType", e.target.value || null)}
                className={selectClass}
              >
                <option value="">Resale &amp; New Launch</option>
                <option value="resale">Resale Only</option>
                <option value="new_launch">New Launch Only</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => setParam("golf", golf ? null : "1")}
              className={toggleClass(golf)}
            >
              Near Golf Course
            </button>

            {category === "Commercial" && (
              <button
                type="button"
                onClick={() => setParam("investmentGrade", investmentGrade ? null : "1")}
                className={toggleClass(investmentGrade)}
              >
                Investment Grade Only
              </button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
          {error ? (
            <div className="col-span-1 md:col-span-2">
              <LoadError message={error} onRetry={retry} />
            </div>
          ) : loading ? (
            [...Array(isMobile ? 4 : 8)].map((_, i) => <CardSkeleton key={i} />)
          ) : currentProperties.length > 0 ? (
            currentProperties.map((property) => (
              <div key={property.id || property.listingUrl} className="relative">
                <Link href={`/${routeBase}/${citySlug}/${slugFor(property)}`}>
                  <HomesCard {...formatProperty(property)} />
                </Link>
                <div className="absolute top-3 right-3 z-10">
                  <SaveToggleButton
                    item={{
                      itemType: "property",
                      citySegment: citySlug,
                      slug: slugFor(property),
                      propertyId: property.id || null,
                      category,
                      title: property.title || "Untitled Listing",
                      imageUrl: getValidImage(property.images) || null,
                      priceText: property.price || null,
                      locationText: property.location || null,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center col-span-2 py-16">
              <p className="text-gray-400 mb-3">
                {hasActiveFilters ? "No listings match your search." : "No listings found"}
              </p>
              {hasActiveFilters && (
                <Link href={`/${routeBase}`} className="text-sm font-medium text-[#D9B268] hover:opacity-80">
                  Clear filters and browse all listings →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pagination — prev/next arrows only. A row of numbered page buttons
            used to render here, one per page, which overflowed badly once a
            category had enough listings to need dozens of pages. */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6 mb-2 text-sm sm:text-base">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#D9B268] hover:border-[#D9B268] disabled:opacity-30 disabled:hover:border-white/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-gray-400">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#D9B268] hover:border-[#D9B268] disabled:opacity-30 disabled:hover:border-white/10 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <PromoBanner
          heading="SPACES CRAFTED FOR YOUR NEXT CHAPTER"
          text="Step into homes that resonate with your aspirations."
          buttonText="CONTACT NOW"
          buttonLink="/#consult"
          imageSrc={customer}
        />
      </div>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary in a client-rendered page.
export default function PropertyListingPage({
  category,
  cityKey,
}: {
  category: PropertyCategory;
  cityKey?: string;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0C]" />}>
      <PropertyListingInner category={category} cityKey={cityKey} />
    </Suspense>
  );
}
