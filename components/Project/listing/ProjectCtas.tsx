"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, IndianRupee, Share2, Heart, Check } from "lucide-react";

type Props = {
  name: string;
  enquireHref: string;
  variant?: "hero" | "compact";
};

const ProjectCtas = ({ name, enquireHref, variant = "hero" }: Props) => {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const storageKey = `homz-saved-${enquireHref}`;

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(storageKey) === "1");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    try {
      if (next) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user cancelled */
    }
  };

  const isHero = variant === "hero";

  return (
    <div className={isHero ? "space-y-3" : "flex gap-2"}>
      <div className={isHero ? "grid grid-cols-2 gap-3" : "flex gap-2"}>
        <Link
          href={enquireHref}
          className={
            isHero
              ? "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 text-[15px] font-bold text-[#1c1608] shadow-[0_12px_34px_rgba(201,154,75,0.3)] hover:brightness-105 transition"
              : "flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#FDF094] to-[#B77D2B] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
          }
        >
          <CalendarCheck size={18} /> Site Visit
        </Link>
        <Link
          href={enquireHref}
          className={
            isHero
              ? "flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 text-[15px] font-semibold text-white hover:border-[#D9B268] transition-colors"
              : "flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
          }
        >
          <IndianRupee size={18} /> Best Price
        </Link>
      </div>

      {isHero && (
        <div className="flex gap-3">
          <button
            onClick={toggleSave}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              saved
                ? "border-[#D9B268] bg-[#D9B268]/10 text-[#D9B268]"
                : "border-white/15 text-gray-300 hover:border-white/30"
            }`}
          >
            <Heart size={16} className={saved ? "fill-[#D9B268]" : ""} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={share}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-gray-300 hover:border-white/30 transition-colors"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectCtas;
