"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Building2, IndianRupee, BedDouble, Search, X } from "lucide-react";

const TABS = ["Buy", "Rent", "Commercial", "Plots"];

const TRENDING = [
  { label: "Sector 65", href: "/project-listing?q=Sector+65" },
  { label: "Golf Course Road", href: "/project-listing?q=Golf+Course+Road" },
  { label: "Ready to move", href: "/project-listing?status=ready-to-move" },
  { label: "Commercial spaces", href: "/project-listing?type=Commercial" },
  { label: "Under ₹1 Cr", href: "/project-listing?budget=under-1cr" },
];

const PROPERTY_TYPES = ["Any Type", "Apartment", "Villa", "Plot", "Office Space", "Retail"];

// Sale/Commercial listings are priced in crores (priceValue); Rent listings
// are priced in monthly rupees (rentMonthly, ~6k-8.3L/month in the live feed).
// These used to share one crore-scale dropdown regardless of tab, so every
// budget-filtered Rent search silently returned zero results — a value like
// ₹40,000/month can never satisfy "min: 2,00,00,000". Key values here must
// match PropertyListingPage.tsx's BUDGET_RANGES_SALE/BUDGET_RANGES_RENT.
const BUDGETS_SALE = [
  { label: "Any Budget", value: "" },
  { label: "Under ₹50 Lakh", value: "under-50l" },
  { label: "₹50L – ₹1 Cr", value: "50l-1cr" },
  { label: "₹1 Cr – ₹2 Cr", value: "1cr-2cr" },
  { label: "Above ₹2 Cr", value: "above-2cr" },
];
const BUDGETS_RENT = [
  { label: "Any Budget", value: "" },
  { label: "Under ₹25k/mo", value: "under-25k" },
  { label: "₹25k – ₹50k/mo", value: "25k-50k" },
  { label: "₹50k – ₹1L/mo", value: "50k-1l" },
  { label: "₹1L – ₹3L/mo", value: "1l-3l" },
  { label: "Above ₹3L/mo", value: "above-3l" },
];
const BHKS = ["Any BHK", "1 BHK", "2 BHK", "3 BHK", "4+ BHK"];

// Each tab searches a genuinely different dataset — individual resale/CGHS
// listings (e.g. a 2 BHK flat in a Sector 56 society) live in the Sale
// Properties feed behind /buy-property, NOT the Projects feed behind
// /project-listing. Every tab used to route to /project-listing regardless
// of selection, so real inventory in the other three feeds was completely
// unreachable from this search panel. "Plots" has no listing feed of its
// own yet (/plots-and-lands is a placeholder), so it just navigates there.
const TAB_ROUTE: Record<string, string> = {
  Buy: "/buy-property",
  Rent: "/rent-property",
  Commercial: "/commercial",
  Plots: "/plots-and-lands",
};

// /buy-property, /rent-property and /commercial (PropertyListingPage.tsx)
// filter on the backend's raw propertyType key, not this panel's display
// label — passing "Apartment" straight through would never match anything.
const PROPERTY_TYPE_KEY: Record<string, string> = {
  Apartment: "apartment",
  Villa: "villa",
  Plot: "plot",
  "Office Space": "office",
  Retail: "retail_shop",
};

const QuickSearchPanel = () => {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState("Buy");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [budget, setBudget] = useState("");
  const [bhk, setBhk] = useState(BHKS[0]);
  const budgets = tab === "Rent" ? BUDGETS_RENT : BUDGETS_SALE;

  // The two budget scales use disjoint value sets (e.g. "above-2cr" vs
  // "above-3l") — switching tabs without resetting could carry a crore-scale
  // value into a Rent search (or vice versa), silently matching nothing.
  const handleTabChange = (nextTab: string) => {
    setTab(nextTab);
    setBudget("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    const base = TAB_ROUTE[tab] || "/project-listing";

    // The Plots page is a placeholder with no filters to apply yet.
    if (tab === "Plots") {
      router.push(base);
      return;
    }

    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    if (propertyType !== "Any Type") {
      const key = PROPERTY_TYPE_KEY[propertyType];
      if (key) params.set("type", key);
    }
    if (budget) params.set("budget", budget);
    // PropertyListingPage.tsx's filter param is "bedrooms", not "bhk".
    if (bhk !== "Any BHK") params.set("bedrooms", bhk.replace(" BHK", ""));
    const query = params.toString();
    router.push(query ? `${base}?${query}` : base);
  };

  const fieldCls =
    "flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#1a1a1d] px-4 h-[50px] md:h-[52px] text-[14px] text-white";

  // Custom corner-arrow chevron for `appearance-none` selects — same shape as
  // the reference's `.select-wrap::after` (and the mobile CTA's own chevron):
  // an 8x8px rotated corner, not a lucide icon.
  const arrowCls =
    "h-2 w-2 shrink-0 rotate-45 border-b-[1.5px] border-r-[1.5px] border-[#8a8986]";

  return (
    <>
      {/* Mobile-only CTA — opens the search panel in a modal. Desktop keeps the panel inline below.
          Values below (radius, padding, colors, font sizes) are lifted exactly from the reference
          build's css/sections.css `.hero-search` / `.hero-search-trigger` / `.hss-*` rules, not
          eyeballed — see design tokens in css/base.css (--r-card-lg:24px, --r-pill:999px,
          --surface-input:#1a1a1d, --text-2/-7/-8, --accent-2/-deep). */}
      <div className="rounded-[22px] border border-white/10 bg-[#121214]/72 p-2.5 backdrop-blur-[20px] md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex min-h-[56px] w-full items-center gap-3 rounded-full border border-white/10 bg-[#1a1a1d] px-2.5 py-2 text-left transition hover:border-[#D9B268]/30"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B]">
            <Search size={18} className="text-[#1c1608]" />
          </span>
          <span className="min-w-0 flex-1 leading-[1.35]">
            <span className="block truncate text-[14px] font-bold text-[#ececea]">Search properties in Gurgaon</span>
            <span className="block truncate text-[11.5px] text-[#7d7c79]">Sector · budget · BHK</span>
          </span>
          <span
            aria-hidden="true"
            className="mr-2.5 h-2 w-2 shrink-0 rotate-45 border-b-[1.5px] border-r-[1.5px] border-[#8a8986] transition-transform duration-200"
          />
        </button>
      </div>

      <div
        className={`${
          mobileOpen
            ? "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            : "hidden"
        } md:static md:z-auto md:bg-transparent md:p-0 md:block`}
      >
        <div className="relative w-full max-h-[92vh] overflow-y-auto scrollbar-hide rounded-[24px] border border-white/10 bg-[#121214] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.6)] md:max-h-none md:overflow-visible md:bg-[#121214]/72 md:backdrop-blur-xl md:p-6">
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close search"
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 hover:border-[#D9B268] hover:text-[#D9B268] transition-colors md:hidden"
            >
              <X size={16} />
            </button>
          )}

          <div className="mb-3 flex flex-wrap gap-1.5 md:mb-4 md:gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTabChange(t)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition md:px-5 md:py-2.5 md:text-[13.5px] ${
                  tab === t
                    ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
            <label className={`${fieldCls} lg:col-span-2`}>
              <MapPin size={17} className="shrink-0 text-gray-500" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location or Sector"
                className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none"
              />
            </label>

            <label className={fieldCls}>
              <Building2 size={17} className="shrink-0 text-gray-500" />
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full appearance-none bg-transparent text-white outline-none"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} className="bg-[#1a1a1d]">
                    {t}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className={arrowCls} />
            </label>

            <label className={fieldCls}>
              <IndianRupee size={16} className="shrink-0 text-gray-500" />
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full appearance-none bg-transparent text-white outline-none"
              >
                {budgets.map((b) => (
                  <option key={b.value} value={b.value} className="bg-[#1a1a1d]">
                    {b.label}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className={arrowCls} />
            </label>

            <label className={fieldCls}>
              <BedDouble size={17} className="shrink-0 text-gray-500" />
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full appearance-none bg-transparent text-white outline-none"
              >
                {BHKS.map((b) => (
                  <option key={b} className="bg-[#1a1a1d]">
                    {b}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className={arrowCls} />
            </label>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-5 h-[50px] md:h-[52px] text-[14px] font-bold text-[#1c1608] hover:brightness-105 transition sm:col-span-2 lg:col-span-5"
            >
              <Search size={17} /> Search
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3 md:mt-4 md:gap-2 md:pt-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mr-1">Trending</span>
            {TRENDING.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="rounded-full border border-white/[0.08] bg-[#D9B268]/[0.06] px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268] transition md:px-3.5 md:py-1.5 md:text-[12.5px]"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickSearchPanel;
