"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatInr, formatInrExact } from "@/lib/intelligence/normalize";

const GOLD = "#CEA44E";
const GRAY = "#4B5563";

type Props = {
  title: string;
  defaultPrice: number | null;
  state: string;
  propertyCategory: string;
  readyToMove: boolean;
};

// Indicative default rates by state / category / construction stage. Editable in
// the UI — these are starting points, not authoritative values.
function defaultRates(state: string, propertyCategory: string, readyToMove: boolean) {
  const s = (state || "").toLowerCase();
  let stampDuty = 7;
  if (s.includes("delhi")) stampDuty = 6;
  else if (s.includes("uttar")) stampDuty = 7;
  else if (s.includes("haryana")) stampDuty = 7;
  // GST applies to under-construction only; ready-to-move (with OC) is exempt.
  const gst = readyToMove ? 0 : propertyCategory === "Commercial" ? 12 : 5;
  return { stampDuty, registration: 1, gst, other: 2 };
}

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

const AcquisitionCostCalculator = ({
  title,
  defaultPrice,
  state,
  propertyCategory,
  readyToMove,
}: Props) => {
  const preset = defaultRates(state, propertyCategory, readyToMove);

  const [price, setPrice] = useState<number>(defaultPrice ?? 10000000);
  const [stampDuty, setStampDuty] = useState<number>(preset.stampDuty);
  const [registration, setRegistration] = useState<number>(preset.registration);
  const [gst, setGst] = useState<number>(preset.gst);
  const [other, setOther] = useState<number>(preset.other);

  const { stampAmt, regAmt, gstAmt, otherAmt, total, charges } = useMemo(() => {
    const p = Math.max(0, price);
    const stampAmt = Math.round((p * stampDuty) / 100);
    const regAmt = Math.round((p * registration) / 100);
    const gstAmt = Math.round((p * gst) / 100);
    const otherAmt = Math.round((p * other) / 100);
    const charges = stampAmt + regAmt + gstAmt + otherAmt;
    return { stampAmt, regAmt, gstAmt, otherAmt, total: p + charges, charges };
  }, [price, stampDuty, registration, gst, other]);

  const pieData = [
    { name: "Base Price", value: Math.max(0, price) },
    { name: "Charges & Taxes", value: charges },
  ];

  const rateRow = (
    label: string,
    rate: number,
    setRate: (n: number) => void,
    amount: number,
    max: number
  ) => (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <label className="text-gray-200 font-medium">
          {label} <span className="text-gray-500">({rate}%)</span>
        </label>
        <span className="text-[#CEA44E] font-semibold">{formatInrExact(amount) ?? "—"}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={0.5}
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        className="w-full accent-[#B77D2B]"
      />
    </div>
  );

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        Total Acquisition Cost – {title}
      </h2>

      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Inputs */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <label className="text-gray-200 font-medium">Base Property Price</label>
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

            {rateRow("Stamp Duty", stampDuty, setStampDuty, stampAmt, 10)}
            {rateRow("Registration", registration, setRegistration, regAmt, 5)}
            {rateRow("GST", gst, setGst, gstAmt, 18)}
            {rateRow("Other Charges", other, setOther, otherAmt, 10)}
          </div>

          {/* Results */}
          <div className="flex-1 w-full">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                Total Acquisition Cost
              </p>
              <p className="text-4xl font-bold text-white mt-1">{formatInr(total) ?? "—"}</p>
              <p className="text-sm text-[#CEA44E] mt-1">
                {formatInrExact(charges) ?? "—"} over the base price
              </p>
            </div>

            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={66}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? GOLD : GRAY} />
                  ))}
                </Pie>
                <Tooltip content={<InrTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Base Price</span>
                <span>{formatInrExact(Math.max(0, price)) ?? "—"}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Stamp Duty</span>
                <span>{formatInrExact(stampAmt) ?? "—"}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Registration</span>
                <span>{formatInrExact(regAmt) ?? "—"}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>GST</span>
                <span>{formatInrExact(gstAmt) ?? "—"}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Other Charges</span>
                <span>{formatInrExact(otherAmt) ?? "—"}</span>
              </div>
              <div className="flex justify-between text-white font-semibold border-t border-gray-700 pt-2 mt-2">
                <span>Total</span>
                <span>{formatInr(total) ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-600 mt-6">
          Stamp duty, registration and GST rates are indicative and vary by state, buyer category
          and current government policy. GST applies to under-construction properties only. Figures
          exclude home-loan interest and brokerage. Verify actual charges before transacting.
        </p>
      </div>
    </section>
  );
};

export default AcquisitionCostCalculator;
