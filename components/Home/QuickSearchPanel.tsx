"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Building2, IndianRupee, BedDouble, Search } from "lucide-react";

const TABS = ["Buy", "Rent", "Commercial", "Plots"];

const TRENDING = [
  { label: "Sector 65", href: "/project-listing?q=Sector+65" },
  { label: "Golf Course Road", href: "/project-listing?q=Golf+Course+Road" },
  { label: "Ready to move", href: "/project-listing?status=ready-to-move" },
  { label: "Commercial spaces", href: "/project-listing?type=Commercial" },
  { label: "Under ₹1 Cr", href: "/project-listing?budget=under-1cr" },
];

const PROPERTY_TYPES = ["Any Type", "Apartment", "Villa", "Plot", "Office Space", "Retail"];
const BUDGETS = [
  { label: "Any Budget", value: "" },
  { label: "Under ₹50 Lakh", value: "under-50l" },
  { label: "₹50L – ₹1 Cr", value: "50l-1cr" },
  { label: "₹1 Cr – ₹2 Cr", value: "1cr-2cr" },
  { label: "Above ₹2 Cr", value: "above-2cr" },
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
  const [tab, setTab] = useState("Buy");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [budget, setBudget] = useState(BUDGETS[0].value);
  const [bhk, setBhk] = useState(BHKS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    "flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#1a1a1d] px-4 h-[52px] text-[14px] text-white";

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#121214]/72 backdrop-blur-xl p-5 md:p-6 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2.5 text-[13.5px] font-bold transition ${
              tab === t
                ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
        </label>

        <label className={fieldCls}>
          <IndianRupee size={16} className="shrink-0 text-gray-500" />
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full appearance-none bg-transparent text-white outline-none"
          >
            {BUDGETS.map((b) => (
              <option key={b.value} value={b.value} className="bg-[#1a1a1d]">
                {b.label}
              </option>
            ))}
          </select>
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
        </label>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-5 h-[52px] text-[14px] font-bold text-[#1c1608] hover:brightness-105 transition sm:col-span-2 lg:col-span-5"
        >
          <Search size={17} /> Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mr-1">Trending</span>
        {TRENDING.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-full border border-white/[0.08] bg-[#D9B268]/[0.06] px-3.5 py-1.5 text-[12.5px] font-semibold text-gray-300 hover:border-[#D9B268]/40 hover:text-[#D9B268] transition"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickSearchPanel;
