"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatInr } from "@/lib/intelligence/normalize";

const GOLD = "#CEA44E";

function parsePriceStr(s: string): number | null {
  if (!s) return null;
  const cr = s.match(/([\d.]+)\s*Cr/i);
  if (cr) return Math.round(parseFloat(cr[1]) * 1e7);
  const lakh = s.match(/([\d.]+)\s*(?:L(?:akh)?|lac)/i);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 1e5);
  return null;
}

function possessionYear(possessionText: string | null): number | null {
  const m = possessionText?.match(/(20\d{2})/);
  return m ? parseInt(m[1], 10) : null;
}

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Months remaining from today to possession — the actual holding period,
// not a rounded whole-year count. Without this, a project possessing in 7
// months (e.g. "Feb 2027" from a "Jul 2026" today) was treated as a full
// 1-year horizon since only the possession YEAR was compared, overstating
// the projected appreciation.
function monthsToPossession(possessionText: string | null): number | null {
  const year = possessionYear(possessionText);
  if (!year) return null;
  const lower = (possessionText || "").toLowerCase();
  const monthIdx = MONTH_NAMES.findIndex((m) => lower.includes(m));
  const now = new Date();
  const months = (year - now.getFullYear()) * 12 + ((monthIdx >= 0 ? monthIdx : 0) - now.getMonth());
  return months > 0 ? months : null;
}

type PriceRow = {
  bhkType?: string;
  unitType?: string;
  type?: string;
  size?: string;
  area?: string;
  price?: string;
};

type Props = {
  title: string;
  priceList: PriceRow[];
  defaultPrice: number | null;
  possessionText: string | null;
  // When true, skips the outer section wrapper + heading so this can be
  // nested inside another composite section (e.g. PricingAndPayment) without
  // a duplicate heading. Default false keeps /flat's usage unchanged.
  bare?: boolean;
};

function InrTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 mb-1 text-xs">{label}</p>
      <p className="text-[#CEA44E] font-bold">{formatInr(payload[0].value) ?? "—"}</p>
    </div>
  );
}

// Projected price journey (current real price → possession estimate). Only the
// starting point is real (from the listing); the trajectory is an illustrative,
// user-adjustable appreciation estimate — never presented as historical data.
const PriceTrendChart = ({ title, priceList, defaultPrice, possessionText, bare = false }: Props) => {
  const configPrices = (Array.isArray(priceList) ? priceList : [])
    .map((r) => parsePriceStr(String(r.price ?? "")))
    .filter((n): n is number => !!n);

  const base = configPrices.length ? Math.min(...configPrices) : defaultPrice;
  const possYear = possessionYear(possessionText);
  const monthsOut = monthsToPossession(possessionText);

  const [rate, setRate] = useState<number>(8);
  const nowYear = new Date().getFullYear();
  // A possession date already in the past (e.g. a Ready to Move project) is
  // not a real future target — only treat it as one for display/labeling
  // when it's genuinely ahead of today. The illustrative projection itself
  // still needs a horizon, so it falls back to a plain 3-year window rather
  // than being framed as "at possession" for a year that has already happened.
  const futurePossessionYear = possYear && possYear > nowYear ? possYear : null;
  const years =
    futurePossessionYear && futurePossessionYear - nowYear <= 15 ? futurePossessionYear - nowYear : 3;
  // The exact holding period used for the "at possession" figure — a
  // fractional year (e.g. 0.58 for 7 months) rather than the rounded whole
  // year used for the chart's x-axis ticks, so the projected gain isn't
  // overstated when possession is under a year away.
  const preciseYears = monthsOut != null ? monthsOut / 12 : years;

  const journey = useMemo(() => {
    if (!base) return [];
    const data: { year: string; value: number }[] = [];
    for (let y = 0; y < years; y++) {
      data.push({ year: String(nowYear + y), value: Math.round(base * Math.pow(1 + rate / 100, y)) });
    }
    data.push({
      year: futurePossessionYear ? String(futurePossessionYear) : String(nowYear + years),
      value: Math.round(base * Math.pow(1 + rate / 100, preciseYears)),
    });
    return data;
  }, [base, rate, years, nowYear, preciseYears, futurePossessionYear]);

  if (!base || journey.length === 0) return null;

  const projected = journey[journey.length - 1]?.value ?? base;
  const gain = projected - base;
  const growthPct = base > 0 ? Math.round((projected / base - 1) * 100) : 0;
  const holdingPeriodLabel =
    monthsOut != null && monthsOut < 12
      ? `${monthsOut} month${monthsOut === 1 ? "" : "s"}`
      : `${Math.round(preciseYears * 10) / 10} yr${Math.round(preciseYears * 10) / 10 === 1 ? "" : "s"}`;

  const card = (
      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-gray-300 text-sm font-medium">Projected Price Journey</h3>
            <p className="text-gray-500 text-xs">
              Current price today → projected value at possession
              {futurePossessionYear ? ` (${futurePossessionYear})` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 whitespace-nowrap">Appreciation p.a.</span>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="accent-[#B77D2B]"
            />
            <span className="text-[#CEA44E] font-semibold w-10 text-right">{rate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Current Price</p>
            <p className="text-xl font-bold text-white mt-1">{formatInr(base) ?? "—"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Real — from listing</p>
          </div>
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">
              At Possession{futurePossessionYear ? ` (${futurePossessionYear})` : ""}
            </p>
            <p className="text-xl font-bold text-[#CEA44E] mt-1">{formatInr(projected) ?? "—"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Projected estimate</p>
          </div>
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Projected Gain</p>
            <p className="text-xl font-bold text-white mt-1">{formatInr(gain) ?? "—"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {growthPct}% over {holdingPeriodLabel}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={journey} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="price-journey" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="year" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickFormatter={(v) => formatInr(v) ?? ""}
              width={70}
            />
            <Tooltip content={<InrTooltip />} />
            <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} fill="url(#price-journey)" />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-[11px] text-gray-600 mt-4">
          Only the current price is real (from the listing). The journey assumes a constant annual
          appreciation you set and is an illustrative estimate — not price history or a guarantee of
          returns. Launch-price and historical transaction data are not available for this project.
        </p>
      </div>
  );

  if (bare) return card;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Price Trends – ${title}`}
      </h2>
      {card}
    </section>
  );
};

export default PriceTrendChart;
