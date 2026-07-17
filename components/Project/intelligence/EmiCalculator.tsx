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
      <p className="text-[#CEA44E] font-bold">{formatInr(p.value) ?? "—"}</p>
    </div>
  );
}

const EmiCalculator = ({ title, defaultPrice }: Props) => {
  const { openForm } = useContext(FormContext);

  const [price, setPrice] = useState<number>(defaultPrice ?? 10000000);
  const [downPct, setDownPct] = useState<number>(20);
  const [rate, setRate] = useState<number>(8.5);
  const [years, setYears] = useState<number>(20);

  const { emi, loanAmount, totalInterest, totalPayment } = useMemo(() => {
    const loan = Math.max(0, price * (1 - downPct / 100));
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
  }, [price, downPct, rate, years]);

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
                <label className="text-gray-200 font-medium">Property Price</label>
                <span className="text-[#CEA44E] font-semibold">{formatInr(price) ?? "—"}</span>
              </div>
              <input
                type="number"
                min={0}
                step={100000}
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white text-sm focus:border-[#B77D2B] outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label className="text-gray-200 font-medium">Down Payment</label>
                <span className="text-[#CEA44E] font-semibold">
                  {downPct}% · {formatInrExact(Math.round((price * downPct) / 100)) ?? "—"}
                </span>
              </div>
              <input
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
                <label className="text-gray-200 font-medium">Interest Rate (p.a.)</label>
                <span className="text-[#CEA44E] font-semibold">{rate}%</span>
              </div>
              <input
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
                <label className="text-gray-200 font-medium">Loan Tenure</label>
                <span className="text-[#CEA44E] font-semibold">{years} years</span>
              </div>
              <input
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
              <p className="text-4xl font-bold text-white mt-1">{formatInrExact(emi) ?? "—"}</p>
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
                <p className="text-sm font-semibold text-white">{formatInr(loanAmount) ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Total Interest</p>
                <p className="text-sm font-semibold text-white">{formatInr(totalInterest) ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Total Payable</p>
                <p className="text-sm font-semibold text-white">{formatInr(totalPayment) ?? "—"}</p>
              </div>
            </div>

            <button
              onClick={openForm}
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
