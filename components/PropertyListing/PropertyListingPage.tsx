"use client";

// Shared listing page for the four individual-listing categories (Sale/Rent/
// Pg/Commercial) — one component parametrized by `category` instead of four
// near-identical page files. Filtering and pagination are server-side, via
// /api/listings (see lib/listings/filters.ts, app/api/listings/route.ts) —
// this component just turns URL search params into a filters object and
// renders whatever page of results comes back.

import React, { Suspense, useEffect, useState } from "react";
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
import { useListingsPage } from "@/hooks/useListingsPage";
import {
  propertySegment,
  type PropertyCategory,
  type RawHomzProperty,
} from "@/lib/scraping/homzbackend";
import { PROPERTY_TYPE_LABELS, type ListingFilters } from "@/lib/listings/filters";
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

const getValidImage = (images: string[] = []) => validImages(images)[0];

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

  const segment = propertySegment(cityKey, category);

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

  const filters: ListingFilters = {
    q,
    propertyType,
    bedrooms,
    budget,
    possession,
    saleType,
    golf,
    investmentGrade,
  };

  const {
    results: currentProperties,
    total,
    facets,
    loading,
    error,
    retry,
  } = useListingsPage(segment, category, filters, currentPage, cardsPerPage);

  const totalPages = Math.max(1, Math.ceil(total / cardsPerPage));

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
    bedrooms && {
      key: "bedrooms",
      label: bedrooms.endsWith("rk") ? `${bedrooms.slice(0, -2)} RK` : `${bedrooms} BHK`,
    },
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
            {facets.propertyTypes.length > 0 && (
              <select
                value={propertyType}
                onChange={(e) => setParam("type", e.target.value || null)}
                className={selectClass}
              >
                <option value="">All Property Types</option>
                {facets.propertyTypes.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.count})
                  </option>
                ))}
              </select>
            )}

            {(facets.bedrooms.length > 0 || facets.rk.length > 0) && (
              <select
                value={bedrooms}
                onChange={(e) => setParam("bedrooms", e.target.value || null)}
                className={selectClass}
              >
                <option value="">Any BHK</option>
                {Array.from(new Set([...facets.bedrooms, ...facets.rk]))
                  .sort((a, b) => a - b)
                  .map((b) => (
                    <React.Fragment key={b}>
                      {facets.bedrooms.includes(b) && <option value={b}>{b} BHK</option>}
                      {/* Distinct chip for the same bedroom count's RK listings — see
                          isRkConfiguration() in lib/listings/filters.ts. Selecting "1 BHK"
                          still includes 1 RK units; this just adds an RK-only option too. */}
                      {facets.rk.includes(b) && <option value={`${b}rk`}>{b} RK</option>}
                    </React.Fragment>
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
