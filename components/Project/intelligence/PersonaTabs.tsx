"use client";

import { useState, type ReactNode } from "react";
import { TrendingUp, Home } from "lucide-react";

type Props = {
  investor: ReactNode;
  buyer: ReactNode;
  buyerLabel: string;
  projectName: string;
};

// Single-row toggle between the two persona views. Both panels are rendered in
// the DOM (server-rendered content) and shown/hidden via CSS, so switching is
// instant and the content stays crawlable.
export default function PersonaTabs({ investor, buyer, buyerLabel, projectName }: Props) {
  const [active, setActive] = useState<"investor" | "buyer">("investor");

  const tabBtn = (isActive: boolean) =>
    `flex items-center justify-center gap-2.5 rounded-xl border px-4 py-4 text-base md:text-lg font-semibold transition ${
      isActive
        ? "border-transparent bg-gradient-to-r from-[#FDF094] to-[#B77D2B] text-black shadow"
        : "border-gray-300 bg-white text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B]"
    }`;

  return (
    <>
      <section className="w-full max-w-7xl mx-auto px-2 mt-16 mb-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setActive("investor")}
            aria-pressed={active === "investor"}
            className={tabBtn(active === "investor")}
          >
            <TrendingUp size={20} /> For Investors
          </button>
          <button
            type="button"
            onClick={() => setActive("buyer")}
            aria-pressed={active === "buyer"}
            className={tabBtn(active === "buyer")}
          >
            <Home size={20} /> {buyerLabel}
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500 text-center">
          {active === "investor"
            ? `Returns, market position, price growth and rental potential for ${projectName}.`
            : `Location, connectivity, nearby essentials and monthly cost for ${projectName}.`}
        </p>
      </section>

      <div className={active === "investor" ? undefined : "hidden"}>{investor}</div>
      <div className={active === "buyer" ? undefined : "hidden"}>{buyer}</div>
    </>
  );
}
