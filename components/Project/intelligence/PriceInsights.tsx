"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { PriceInsightsData } from "@/lib/intelligence/projects";
import { formatInr } from "@/lib/intelligence/normalize";

const GOLD = "#CEA44E";
const GRAY = "#4B5563";

// Parse price strings like "₹ 1.58 Cr" or "₹ 85 Lakh" → absolute INR
function parsePriceStr(priceStr: string): number | null {
  if (!priceStr) return null;
  const cr = priceStr.match(/([\d.]+)\s*Cr/i);
  if (cr) return Math.round(parseFloat(cr[1]) * 1e7);
  const lakh = priceStr.match(/([\d.]+)\s*(?:L(?:akh)?|lac)/i);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 1e5);
  return null;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 mb-1 text-xs">{label}</p>
      <p className="text-[#CEA44E] font-bold">{formatter(payload[0].value)}</p>
    </div>
  );
}

type PriceRow = { bhkType: string; size: string; price: string };

type Props = {
  title: string;
  data: PriceInsightsData;
  priceList?: PriceRow[];
};

const PriceInsights = ({ title, data, priceList = [] }: Props) => {
  const {
    project_min_inr,
    city_avg_inr,
    micro_market_avg_inr,
    city_name,
    micro_market,
  } = data;

  // ── Chart 1: ₹/sqft per unit type ────────────────────────────────────────
  const rawUnitData = priceList
    .map((row) => {
      const priceInr = parsePriceStr(row.price);
      const size = parseFloat(row.size);
      if (!priceInr || !size || isNaN(size) || size <= 0) return null;
      return { name: row.bhkType, psf: Math.round(priceInr / size) };
    })
    .filter((d): d is { name: string; psf: number } => d !== null && d.psf > 0);

  // Average ₹/sqft when same unit type appears multiple times
  const unitChartData = rawUnitData.reduce(
    (acc: { name: string; psf: number; count: number }[], cur) => {
      const existing = acc.find((a) => a.name === cur.name);
      if (existing) {
        existing.psf = Math.round(
          (existing.psf * existing.count + cur.psf) / (existing.count + 1)
        );
        existing.count++;
      } else {
        acc.push({ ...cur, count: 1 });
      }
      return acc;
    },
    []
  );

  // ── Chart 2: Market comparison (starting price) ───────────────────────────
  const compareData = [
    { name: "This Project", value: project_min_inr, highlight: true },
    ...(micro_market_avg_inr
      ? [{ name: micro_market || "Micro Market", value: micro_market_avg_inr, highlight: false }]
      : []),
    ...(city_avg_inr
      ? [{ name: `${city_name} Avg`, value: city_avg_inr, highlight: false }]
      : []),
  ].filter((d): d is { name: string; value: number; highlight: boolean } =>
    d.value != null && d.value > 0
  );

  const hasUnitChart = unitChartData.length > 0;
  const hasCompareChart = compareData.length >= 1;

  if (!hasUnitChart && !hasCompareChart) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        Price Insights – {title}
      </h2>

      <div
        className={`grid gap-4 ${
          hasUnitChart && hasCompareChart
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* ── Chart 1: Asking price per sqft by unit type ── */}
        {hasUnitChart && (
          <div className="bg-black border border-gray-700 rounded-xl p-5">
            <h3 className="text-gray-300 text-sm font-medium mb-1">
              Asking Price per Sq.Ft. by Unit Type
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              Computed from listed unit sizes &amp; prices
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={unitChartData}
                margin={{ top: 5, right: 10, left: 5, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                  width={52}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v) => `₹${(v / 1000).toFixed(1)}K / sq.ft.`}
                    />
                  }
                  cursor={{ fill: "rgba(206,164,78,0.08)" }}
                />
                <Bar dataKey="psf" radius={[4, 4, 0, 0]}>
                  {unitChartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? GOLD : `${GOLD}BB`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Chart 2: Starting price vs market averages ── */}
        {hasCompareChart && (
          <div className="bg-black border border-gray-700 rounded-xl p-5">
            <h3 className="text-gray-300 text-sm font-medium mb-1">
              Starting Price vs {micro_market || city_name} Market
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              Averages based on {city_name} listings on HomzRealtor
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={compareData}
                margin={{ top: 5, right: 10, left: 5, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  tickFormatter={(v) => formatInr(v) ?? ""}
                  width={70}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v) => formatInr(v) ?? "—"}
                    />
                  }
                  cursor={{ fill: "rgba(206,164,78,0.08)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {compareData.map((entry, i) => (
                    <Cell key={i} fill={entry.highlight ? GOLD : GRAY} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
};

export default PriceInsights;
