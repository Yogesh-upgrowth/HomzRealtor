"use client";

import { useContext, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FormContext } from "@/context/FormContext";
import { formatInr, formatInrExact } from "@/lib/intelligence/normalize";

const GOLD = "#CEA44E";
const GRAY = "#4B5563";

type Props = {
  title: string;
  defaultPrice: number | null;
};

function InrTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 text-xs">{p.name}</p>
      <p className="text-[#CEA44E] font-bold">{formatInr(p.value) ?? "N/A"}</p>
    </div>
  );
}

const EmiCalculator = ({ title, defaultPrice }: Props) => {
  const { openForm } = useContext(FormContext);

  // MI-13 (2026-09-18): price is `number | ""` rather than plain `number`
  // so clearing the field to retype a value doesn't force it back to 0 on
  // every keystroke (Number("") || 0 used to do exactly that, fighting
  // anyone trying to select-all and type a new price). "" is a real,
  // honest blank-editing state -- the calculation below just treats it as
  // 0 rather than crashing or showing NaN.
  const [price, setPrice] = useState<number | "">(defaultPrice ?? 10000000);
  const [downPct, setDownPct] = useState<number>(20);
  const [rate, setRate] = useState<number>(8.5);
  const [years, setYears] = useState<number>(20);
  const priceValue = price === "" ? 0 : price;

  const { emi, loanAmount, totalInterest, totalPayment } = useMemo(() => {
    const loan = Math.max(0, priceValue * (1 - downPct / 100));
    const r = rate / 100 / 12;
    const n = years * 12;
    let monthly: number;
    if (r === 0) {
      monthly = n > 0 ? loan / n : 0;
    } else {
      const factor = Math.pow(1 + r, n);
      monthly = (loan * r * factor) / (factor - 1);
    }
    const total = monthly * n;
    return {
      emi: Math.round(monthly),
      loanAmount: Math.round(loan),
      totalInterest: Math.round(total - loan),
      totalPayment: Math.round(total),
    };
  }, [priceValue, downPct, rate, years]);

  const pieData = [
    { name: "Principal", value: loanAmount },
    { name: "Total Interest", value: Math.max(0, totalInterest) },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        EMI Calculator – {title}
      </h2>

      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Inputs */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="emi-price" className="text-gray-200 font-medium">Property Price</label>
                <span className="text-[#CEA44E] font-semibold">{formatInr(priceValue) ?? "N/A"}</span>
              </div>
              <input
                id="emi-price"
                type="number"
                min={0}
                step={100000}
                inputMode="numeric"
                value={price}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setPrice("");
                    return;
                  }
                  const n = Number(raw);
                  setPrice(Number.isFinite(n) ? Math.max(0, n) : 0);
                }}
                onBlur={() => {
                  if (price === "") setPrice(0);
                }}
                className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white text-sm focus:border-[#B77D2B] outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="emi-down-payment" className="text-gray-200 font-medium">Down Payment</label>
                <span className="text-[#CEA44E] font-semibold">
                  {downPct}% · {formatInrExact(Math.round((priceValue * downPct) / 100)) ?? "N/A"}
                </span>
              </div>
              <input
                id="emi-down-payment"
                type="range"
                min={0}
                max={80}
                step={1}
                value={downPct}
                onChange={(e) => setDownPct(Number(e.target.value))}
                className="w-full accent-[#B77D2B]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="emi-rate" className="text-gray-200 font-medium">Interest Rate (p.a.)</label>
                <span className="text-[#CEA44E] font-semibold">{rate}%</span>
              </div>
              <input
                id="emi-rate"
                type="range"
                min={5}
                max={15}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-[#B77D2B]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label htmlFor="emi-tenure" className="text-gray-200 font-medium">Loan Tenure</label>
                <span className="text-[#CEA44E] font-semibold">{years} years</span>
              </div>
              <input
                id="emi-tenure"
                type="range"
                min={1}
                max={30}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-[#B77D2B]"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 w-full">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Monthly EMI</p>
              <p className="text-4xl font-bold text-white mt-1">{formatInrExact(emi) ?? "N/A"}</p>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? GOLD : GRAY} />
                  ))}
                </Pie>
                <Tooltip content={<InrTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div>
                <p className="text-[11px] text-gray-500">Loan Amount</p>
                <p className="text-sm font-semibold text-white">{formatInr(loanAmount) ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Total Interest</p>
                <p className="text-sm font-semibold text-white">{formatInr(totalInterest) ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Total Payable</p>
                <p className="text-sm font-semibold text-white">{formatInr(totalPayment) ?? "N/A"}</p>
              </div>
            </div>

            <button
              onClick={() => openForm({ kind: "price_enquiry", placement: "emi_calculator" })}
              className="mt-6 w-full rounded-lg bg-gradient-to-b from-[#FDF094] to-[#B77D2B] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
            >
              Get a Home-Loan Estimate
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-600 mt-6">
          Indicative EMI based on your inputs. Actual loan amount, interest rate and eligibility
          are decided by the lender. Not financial advice.
        </p>
      </div>
    </section>
  );
};

export default EmiCalculator;
