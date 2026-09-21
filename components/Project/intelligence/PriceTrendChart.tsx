"use client";

import { useMemo, useState } from "react";
import { allowsPossessionContent, projectStatusKind } from "@/lib/intelligence/projectStatus";
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
  /** The project's construction status. Required to decide whether a
   *  possession projection is meaningful at all — see the gate in the
   *  component body. */
  projectStatus?: string | null;
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
      <p className="text-[#CEA44E] font-bold">{formatInr(payload[0].value) ?? "N/A"}</p>
    </div>
  );
}

// Projected price journey (current real price → possession estimate). Only the
// starting point is real (from the listing); the trajectory is an illustrative,
// user-adjustable appreciation estimate — never presented as historical data.
const PriceTrendChart = ({
  title,
  priceList,
  defaultPrice,
  possessionText,
  projectStatus = null,
  bare = false,
}: Props) => {
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

  // Three modes, one per project status — checklist item 5's conditional
  // logic, and the reason this component no longer decides anything from the
  // possession text alone.
  //
  // The original bug: futurePossessionYear was already correctly null for a
  // ready-to-move project, but `years` fell back to a flat 3, so the module
  // drew a three-year curve at an assumed 8% a year headed "projected value
  // at possession" — for a property that is already possessed.
  //
  //   under construction / new launch, with a real future date
  //     -> the possession projection, unchanged.
  //   ready to move
  //     -> illustrative 3- and 5-year values, with no possession language
  //        anywhere. The wait is over, so there is no possession to project
  //        to, but "what might this be worth if it appreciates at X%" is
  //        still a question an owner-occupier or investor asks, and it can be
  //        answered honestly as long as it is labelled as the assumption it
  //        is.
  //   unknown status
  //     -> nothing. The checklist is explicit that an unknown status must not
  //        generate possession or investment assumptions, and guessing on a
  //        missing field is how the original bug happened.
  //
  // allowsPossessionContent is false for both ready-to-move and unknown; see
  // lib/intelligence/projectStatus.ts.
  const statusKind = projectStatusKind(projectStatus);
  const canProject = Boolean(futurePossessionYear) && allowsPossessionContent(projectStatus);
  const illustrativeOnly = statusKind === "ready-to-move";
  const years =
    futurePossessionYear && futurePossessionYear - nowYear <= 15 ? futurePossessionYear - nowYear : 5;
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
  if (!canProject && !illustrativeOnly) return null;

  // Ready to move: the same real starting price and the same user-set rate,
  // presented as what it is. Deliberately no "At Possession", no possession
  // year, no timeline — a completed property has none of those.
  if (illustrativeOnly) {
    const at = (y: number) => Math.round(base * Math.pow(1 + rate / 100, y));
    const illustrative = [
      { year: String(nowYear), value: base },
      { year: String(nowYear + 3), value: at(3) },
      { year: String(nowYear + 5), value: at(5) },
    ];
    const rtmCard = (
      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-gray-300 text-sm font-medium">Illustrative Value Over Time</h3>
            <p className="text-gray-500 text-xs">
              Ready to move — current asking price at an appreciation rate you set
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label htmlFor="rtm-appreciation-rate" className="text-gray-400 whitespace-nowrap">
              Appreciation p.a.
            </label>
            <input
              id="rtm-appreciation-rate"
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-valuetext={`${rate} percent per year`}
              className="accent-[#B77D2B]"
            />
            <span className="text-[#CEA44E] font-semibold w-10 text-right">{rate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">
              Current Asking Price
            </p>
            <p className="text-xl font-bold text-white mt-1">{formatInr(base) ?? "N/A"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Real, from listing</p>
          </div>
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">After 3 Years</p>
            <p className="text-xl font-bold text-[#CEA44E] mt-1">{formatInr(at(3)) ?? "N/A"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Illustrative at {rate}% p.a.</p>
          </div>
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">After 5 Years</p>
            <p className="text-xl font-bold text-[#CEA44E] mt-1">{formatInr(at(5)) ?? "N/A"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Illustrative at {rate}% p.a.</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={illustrative} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="rtm-journey" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} fill="url(#rtm-journey)" />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-[11px] text-gray-600 mt-4">
          This property is ready to move, so there is no possession date to project to. Only the
          current asking price is real (from the listing); the 3- and 5-year figures apply the
          constant annual rate you set above and are illustrative only — not a forecast, not price
          history and not a guarantee of returns. We do not hold historical transaction data for
          this project.
        </p>
      </div>
    );

    if (bare) return rtmCard;
    return (
      <section className="w-full max-w-7xl mx-auto px-2 my-12">
        <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
          {`Value Over Time – ${title}`}
        </h2>
        {rtmCard}
      </section>
    );
  }

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
            {/* R19-12: was a bare <span>, so this slider had no accessible name
                at all -- a screen reader announced "slider, 8" with no label
                and no unit. MI-13 connected labels in the other three
                calculators and missed this one. */}
            <label htmlFor="trend-appreciation-rate" className="text-gray-400 whitespace-nowrap">
              Appreciation p.a.
            </label>
            <input
              id="trend-appreciation-rate"
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-valuetext={`${rate} percent per year`}
              className="accent-[#B77D2B]"
            />
            <span className="text-[#CEA44E] font-semibold w-10 text-right">{rate}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Current Price</p>
            <p className="text-xl font-bold text-white mt-1">{formatInr(base) ?? "N/A"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Real, from listing</p>
          </div>
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">
              At Possession{futurePossessionYear ? ` (${futurePossessionYear})` : ""}
            </p>
            <p className="text-xl font-bold text-[#CEA44E] mt-1">{formatInr(projected) ?? "N/A"}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Projected estimate</p>
          </div>
          <div className="rounded-xl border border-gray-700 p-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">Projected Gain</p>
            <p className="text-xl font-bold text-white mt-1">{formatInr(gain) ?? "N/A"}</p>
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
          appreciation you set and is an illustrative estimate, not price history or a guarantee of
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
