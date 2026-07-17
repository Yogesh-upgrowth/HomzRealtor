"use client";

import { useMemo, useState } from "react";
import { formatInrExact } from "@/lib/intelligence/normalize";

type Props = {
  title: string;
  defaultPrice: number | null;
};

// Rental-yield calculator. (Appreciation / price-growth now lives in the
// "Pricing in Detail" section's projected price journey.)
const InvestmentCalculators = ({ title, defaultPrice }: Props) => {
  const basePrice = defaultPrice ?? 10000000;

  const [rPrice, setRPrice] = useState<number>(basePrice);
  const [monthlyRent, setMonthlyRent] = useState<number>(Math.round(basePrice * 0.003));
  const [maintenance, setMaintenance] = useState<number>(Math.round(basePrice * 0.005));
  const [vacancy, setVacancy] = useState<number>(1);

  const rental = useMemo(() => {
    const annualGross = monthlyRent * 12;
    const effective = monthlyRent * Math.max(0, 12 - vacancy);
    const netAnnual = effective - maintenance;
    return {
      annualGross,
      grossYield: rPrice > 0 ? (annualGross / rPrice) * 100 : 0,
      netYield: rPrice > 0 ? (netAnnual / rPrice) * 100 : 0,
      netAnnual,
    };
  }, [rPrice, monthlyRent, maintenance, vacancy]);

  const inputCls =
    "w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white text-sm focus:border-[#B77D2B] outline-none";

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        Rental Yield Calculator – {title}
      </h2>

      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label className="text-gray-200 font-medium">Purchase Price</label>
                <span className="text-[#CEA44E] font-semibold">{formatInrExact(rPrice) ?? "—"}</span>
              </div>
              <input
                type="number"
                min={0}
                step={100000}
                value={rPrice}
                onChange={(e) => setRPrice(Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label className="text-gray-200 font-medium">Expected Monthly Rent</label>
                <span className="text-[#CEA44E] font-semibold">{formatInrExact(monthlyRent) ?? "—"}</span>
              </div>
              <input
                type="number"
                min={0}
                step={1000}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label className="text-gray-200 font-medium">Annual Maintenance</label>
                <span className="text-[#CEA44E] font-semibold">{formatInrExact(maintenance) ?? "—"}</span>
              </div>
              <input
                type="number"
                min={0}
                step={1000}
                value={maintenance}
                onChange={(e) => setMaintenance(Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label className="text-gray-200 font-medium">Vacancy (months/yr)</label>
                <span className="text-[#CEA44E] font-semibold">{vacancy}</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={vacancy}
                onChange={(e) => setVacancy(Number(e.target.value))}
                className="w-full accent-[#B77D2B]"
              />
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col justify-center gap-4">
            <div className="rounded-xl border border-gray-700 p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Gross Rental Yield</p>
              <p className="text-4xl font-bold text-white mt-1">{rental.grossYield.toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-1">{formatInrExact(rental.annualGross) ?? "—"} / year</p>
            </div>
            <div className="rounded-xl border border-gray-700 p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Est. Net Rental Yield</p>
              <p className="text-3xl font-bold text-[#CEA44E] mt-1">{rental.netYield.toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatInrExact(rental.netAnnual) ?? "—"} / year after maintenance &amp; vacancy
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-600 mt-6">
          Illustrative estimate based on your assumptions — not a guarantee of returns. Not financial advice.
        </p>
      </div>
    </section>
  );
};

export default InvestmentCalculators;
