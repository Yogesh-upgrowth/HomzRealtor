"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

// Fades in once the hero (marked by a sentinel div the page renders just below
// it) scrolls out of view. No wishlist icon here — ProjectCtas in the hero
// already has a working Save/Heart toggle, so a second one would be redundant.
const StickyMiniHeader = ({ name }: { name: string }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("hero-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 border-b border-gray-800 bg-black/95 backdrop-blur transition-transform duration-200 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          onClick={() => window.history.back()}
          aria-label="Back"
          className="shrink-0 rounded-full p-1.5 text-white hover:bg-white/10 cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="truncate text-base font-semibold text-white">{name}</h1>
      </div>
    </div>
  );
};

export default StickyMiniHeader;
