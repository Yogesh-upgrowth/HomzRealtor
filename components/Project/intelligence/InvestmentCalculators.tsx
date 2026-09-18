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

  // MI-13 (2026-09-18): each of these is number | "" rather than plain
  // number so clearing the field to retype doesn't force it back to 0 on
  // every keystroke (Number("") || 0 evaluates to 0, fighting anyone who
  // selects the field to type a new value) -- same fix as EmiCalculator.
  const [rPrice, setRPrice] = useState<number | "">(basePrice);
  const [monthlyRent, setMonthlyRent] = useState<number | "">(Math.round(basePrice * 0.003));
  const [maintenance, setMaintenance] = useState<number | "">(Math.round(basePrice * 0.005));
  const [vacancy, setVacancy] = useState<number>(1);

  const rPriceValue = rPrice === "" ? 0 : rPrice;
  const monthlyRentValue = monthlyRent === "" ? 0 : monthlyRent;
  const maintenanceValue = maintenance === "" ? 0 : maintenance;

  const rental = useMemo(() => {
    const annualGross = monthlyRentValue * 12;
    const effective = monthlyRentValue * Math.max(0, 12 - vacancy);
    const netAnnual = effective - maintenanceValue;
    return {
      annualGross,
      grossYield: rPriceValue > 0 ? (annualGross / rPriceValue) * 100 : 0,
      netYield: rPriceValue > 0 ? (netAnnual / rPriceValue) * 100 : 0,
      netAnnual,
    };
  }, [rPriceValue, monthlyRentValue, maintenanceValue, vacancy]);

  // Shared onChange for the three "" | number fields above -- allows a
  // blank intermediate state, otherwise clamps to a non-negative finite
  // number.
  const numericField = (setter: (v: number | "") => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setter("");
      return;
    }
    const n = Number(raw);
    setter(Number.isFinite(n) ? Math.max(0, n) : 0);
  };
  const commitBlank = (value: number | "", setter: (v: number | "") => void) => () => {
    if (value === "") setter(0);
  };

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
                <label htmlFor="rental-price" className="text-gray-200 font-medium">Purchase Price</label>
                <span className="text-[#CEA44E] font-semibold">{formatInrExact(rPriceValue) ?? "N/A"}</span>
              </div>
              <input
                id="rental-price"
                type="number"
                min={0}
                step={100000}
                inputMode="numeric"
                value={rPrice}
                onChange={numericField(setRPrice)}
                onBlur={commitBlank(rPrice, setRPrice)}
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="rental-monthly-rent" className="text-gray-200 font-medium">Expected Monthly Rent</label>
                <span className="text-[#CEA44E] font-semibold">{formatInrExact(monthlyRentValue) ?? "N/A"}</span>
              </div>
              <input
                id="rental-monthly-rent"
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={monthlyRent}
                onChange={numericField(setMonthlyRent)}
                onBlur={commitBlank(monthlyRent, setMonthlyRent)}
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="rental-maintenance" className="text-gray-200 font-medium">Annual Maintenance</label>
                <span className="text-[#CEA44E] font-semibold">{formatInrExact(maintenanceValue) ?? "N/A"}</span>
              </div>
              <input
                id="rental-maintenance"
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                value={maintenance}
                onChange={numericField(setMaintenance)}
                onBlur={commitBlank(maintenance, setMaintenance)}
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="rental-vacancy" className="text-gray-200 font-medium">Vacancy (months/yr)</label>
                <span className="text-[#CEA44E] font-semibold">{vacancy}</span>
              </div>
              <input
                id="rental-vacancy"
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
              <p className="text-xs text-gray-500 mt-1">{formatInrExact(rental.annualGross) ?? "N/A"} / year</p>
            </div>
            <div className="rounded-xl border border-gray-700 p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Est. Net Rental Yield</p>
              <p className="text-3xl font-bold text-[#CEA44E] mt-1">{rental.netYield.toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatInrExact(rental.netAnnual) ?? "N/A"} / year after maintenance &amp; vacancy
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-600 mt-6">
          Illustrative estimate based on your assumptions, not a guarantee of returns. Not financial advice.
        </p>
      </div>
    </section>
  );
};

export default InvestmentCalculators;
