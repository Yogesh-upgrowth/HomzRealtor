"use client";

import Link from "next/link";
import { CalendarCheck } from "lucide-react";

type Props = {
  name: string;
  priceText: string;
  priceSubtext: string | null;
  enquireHref: string;
};

const StickyCta = ({ name, priceText, priceSubtext, enquireHref }: Props) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 line-clamp-1">
            {priceSubtext || name}
          </p>
          <p className="text-lg font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent line-clamp-1">
            {priceText}
          </p>
        </div>
        <Link
          href={enquireHref}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
        >
          <CalendarCheck size={16} /> Enquire
        </Link>
      </div>
    </div>
  );
};

export default StickyCta;
