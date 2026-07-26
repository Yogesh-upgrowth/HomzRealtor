"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Building2, IndianRupee, BedDouble, Search } from "lucide-react";

const TABS = ["Buy", "Rent", "Commercial", "Plots"];

const TRENDING = [
  { label: "Sector 65", href: "/project-listing" },
  { label: "Golf Course Road", href: "/project-listing" },
  { label: "Ready to move", href: "/project-listing" },
  { label: "Commercial spaces", href: "/commercial" },
  { label: "Under ₹1 Cr", href: "/project-listing" },
];

// Presentational quick-search UI embedded in the Hero. No backend filtering —
// submitting just navigates to the real /project-listing browse page.
const QuickSearchPanel = () => {
  const router = useRouter();
  const [tab, setTab] = useState("Buy");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    const query = params.toString();
    router.push(query ? `/project-listing?${query}` : "/project-listing");
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
          <select className="w-full appearance-none bg-transparent text-white outline-none" defaultValue="Apartment">
            <option>Apartment</option>
            <option>Villa</option>
            <option>Plot</option>
            <option>Office Space</option>
            <option>Retail</option>
          </select>
        </label>

        <label className={fieldCls}>
          <IndianRupee size={16} className="shrink-0 text-gray-500" />
          <select className="w-full appearance-none bg-transparent text-white outline-none" defaultValue="Under ₹50 Lakh">
            <option>Under ₹50 Lakh</option>
            <option>₹50L – ₹1 Cr</option>
            <option>₹1 Cr – ₹2 Cr</option>
            <option>Above ₹2 Cr</option>
          </select>
        </label>

        <label className={fieldCls}>
          <BedDouble size={17} className="shrink-0 text-gray-500" />
          <select className="w-full appearance-none bg-transparent text-white outline-none" defaultValue="Any BHK">
            <option>Any BHK</option>
            <option>1 BHK</option>
            <option>2 BHK</option>
            <option>3 BHK</option>
            <option>4+ BHK</option>
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
