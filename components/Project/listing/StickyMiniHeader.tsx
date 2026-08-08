"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

// Fades in once the hero (marked by a sentinel div the page renders just below
// it) scrolls out of view. Sits below the always-present global Navbar
// (#site-navbar, fixed, top-0, z-50) rather than at top-0, so the two don't
// overlap. No wishlist icon here — ProjectCtas in the hero already has a
// working Save/Heart toggle, so a second one would be redundant.
const StickyMiniHeader = ({ name }: { name: string }) => {
  const [visible, setVisible] = useState(false);
  // Measured from the real navbar rather than assumed via a hardcoded
  // top-16/top-24 offset — the navbar's own height changes (~101px -> ~65px
  // on desktop) once its promo bar is dismissed (persisted in localStorage
  // for 7 days), and a stale hardcoded offset left a real gap of exposed,
  // unmasked page content between the shrunk navbar and this bar.
  const [navHeight, setNavHeight] = useState(96);

  useLayoutEffect(() => {
    const navEl = document.getElementById("site-navbar");
    if (!navEl) return;
    const update = () => setNavHeight(navEl.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(navEl);
    return () => observer.disconnect();
  }, []);

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
      style={{ top: navHeight }}
      className={`fixed inset-x-0 z-40 border-b border-white/[0.08] bg-[#0B0B0C]/90 backdrop-blur-xl transition-transform duration-200 ${
        visible ? "translate-y-0" : "-translate-y-[calc(100%+6rem)]"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button
          onClick={() => window.history.back()}
          aria-label="Back"
          className="shrink-0 rounded-full p-1.5 text-white hover:bg-white/10 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white">
          {name}
        </p>
      </div>
    </div>
  );
};

export default StickyMiniHeader;
