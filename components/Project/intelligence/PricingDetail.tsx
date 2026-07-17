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
import { formatInr, formatInrExact } from "@/lib/intelligence/normalize";

const GOLD = "#CEA44E";

// Parse "₹ 1.31 Cr" / "85 Lakh" → absolute rupees.
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

const PricingDetail = ({ title, priceList, defaultPrice, possessionText }: Props) => {
  // ── Real configuration-wise pricing ────────────────────────────────────────
  const rows = (Array.isArray(priceList) ? priceList : [])
    .map((r) => {
      const unit = r.bhkType || r.unitType || r.type || "Unit";
      const sizeNum = parseFloat(String(r.size ?? r.area ?? "").replace(/[^\d.]/g, ""));
      const priceInr = parsePriceStr(String(r.price ?? ""));
      const psf = priceInr && sizeNum > 0 ? Math.round(priceInr / sizeNum) : null;
      return {
        unit,
        sizeNum: sizeNum > 0 ? sizeNum : null,
        priceInr,
        psf,
        priceStr: r.price ?? null,
      };
    })
    .filter((r) => r.priceInr || r.sizeNum);

  const configPrices = rows.map((r) => r.priceInr).filter((n): n is number => !!n);
  const base = configPrices.length ? Math.min(...configPrices) : defaultPrice ?? 10000000;
  const possYear = possessionYear(possessionText);

  // ── Projected price journey (current → possession) ─────────────────────────
  const [rate, setRate] = useState<number>(8);
  const nowYear = new Date().getFullYear();
  const years =
    possYear && possYear > nowYear && possYear - nowYear <= 15 ? possYear - nowYear : 3;

  const journey = useMemo(() => {
    const data: { year: string; value: number }[] = [];
    for (let y = 0; y <= years; y++) {
      data.push({ year: String(nowYear + y), value: Math.round(base * Math.pow(1 + rate / 100, y)) });
    }
    return data;
  }, [base, rate, years, nowYear]);

  const projected = journey[journey.length - 1]?.value ?? base;
  const gain = projected - base;
  const growthPct = base > 0 ? Math.round((projected / base - 1) * 100) : 0;
  const hasTable = rows.length > 0;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        Pricing in Detail – {title}
      </h2>

      {/* Configuration-wise pricing (real) */}
      {hasTable && (
        <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8 mb-6 overflow-x-auto">
          <h3 className="text-gray-300 text-sm font-medium mb-1">Configuration-wise Pricing</h3>
          <p className="text-gray-500 text-xs mb-4">Current listed prices &amp; price per sq.ft by unit type</p>
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="py-2 pr-4 font-medium">Configuration</th>
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">Price</th>
                <th className="py-2 font-medium">₹ / sq.ft</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-800 text-gray-200">
                  <td className="py-2.5 pr-4 font-medium">{r.unit}</td>
                  <td className="py-2.5 pr-4">
                    {r.sizeNum ? `${r.sizeNum.toLocaleString("en-IN")} sq.ft` : "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    {r.priceInr ? formatInr(r.priceInr) : r.priceStr || "—"}
                  </td>
                  <td className="py-2.5 text-[#CEA44E]">{r.psf ? formatInrExact(r.psf) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projected price journey (current real → possession estimate) */}
      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-gray-300 text-sm font-medium">Projected Price Journey</h3>
            <p className="text-gray-500 text-xs">
              Current price today → projected value at possession
              {possYear ? ` (${possYear})` : ""}
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
              At Possession{possYear ? ` (${possYear})` : ""}
            </p>
            <p className="text-xl font-bold text-[#CEA44E] mt-1">{formatInr(projected) ?? "—"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Projected estimate</p>
          </div>
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Projected Gain</p>
            <p className="text-xl font-bold text-white mt-1">{formatInr(gain) ?? "—"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {growthPct}% over {years} yr{years === 1 ? "" : "s"}
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
    </section>
  );
};

export default PricingDetail;
