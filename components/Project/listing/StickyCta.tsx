"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { scrollToHash } from "@/lib/scrollToHash";

type Props = {
  name: string;
  priceText: string;
  priceSubtext: string | null;
  enquireHref: string;
};

const StickyCta = ({ name, priceText, priceSubtext, enquireHref }: Props) => {
  // Reported live: on some mobile browsers this bar "floats above the
  // bottom" instead of staying pinned. `position: fixed; bottom: 0` is
  // computed against the layout viewport, not the visual one — when a
  // mobile browser's address/toolbar chrome collapses or expands (or the
  // on-screen keyboard opens for the enquiry form's own inputs further up
  // the page), those two viewports diverge, and a handful of mobile
  // browsers leave a gap under a plain `bottom: 0` element instead of
  // tracking the true visible edge. The VisualViewport API reports the
  // real gap directly — offsetting by it keeps the bar pinned to what's
  // actually visible instead of trusting one CSS value to always match it.
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const gap = window.innerHeight - (vv.height + vv.offsetTop);
      setBottomOffset(Math.max(0, Math.round(gap)));
    };
    update();

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      style={{ bottom: bottomOffset }}
      className="fixed inset-x-0 z-40 border-t border-white/10 bg-[#121214]/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.35)] lg:hidden"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 line-clamp-1">
            {priceSubtext || name}
          </p>
          <p className="text-lg font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent line-clamp-1">
            {priceText}
          </p>
        </div>
        <Link
          href={enquireHref}
          onClick={(e) => scrollToHash(enquireHref, e)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-5 py-2.5 text-sm font-semibold text-[#1c1608] cursor-pointer"
        >
          <CalendarCheck size={16} /> Enquire
        </Link>
      </div>
    </div>
  );
};

export default StickyCta;
