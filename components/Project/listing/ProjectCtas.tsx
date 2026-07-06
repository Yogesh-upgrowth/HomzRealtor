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

  return (
    <div className={variant === "hero" ? "space-y-3" : "flex gap-2"}>
      <div className={variant === "hero" ? "grid grid-cols-2 gap-3" : "flex gap-2"}>
        <Link
          href={enquireHref}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#FDF094] to-[#B77D2B] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
        >
          <CalendarCheck size={18} /> Site Visit
        </Link>
        <Link
          href={enquireHref}
          className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
        >
          <IndianRupee size={18} /> Best Price
        </Link>
      </div>

      {variant === "hero" && (
        <div className="flex gap-3">
          <button
            onClick={toggleSave}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              saved
                ? "border-[#B77D2B] bg-[#CEA44E]/10 text-[#B77D2B]"
                : "border-gray-300 text-gray-700 hover:border-gray-400"
            }`}
          >
            <Heart size={16} className={saved ? "fill-[#B77D2B]" : ""} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={share}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 transition"
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
