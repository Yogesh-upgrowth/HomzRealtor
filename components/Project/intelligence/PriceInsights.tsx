import type { PriceInsightsData } from "@/lib/intelligence/projects";
import { formatInr } from "@/lib/intelligence/normalize";

type Props = {
  title: string;
  data: PriceInsightsData;
};

function Bar({
  label,
  value,
  max,
  displayValue,
  highlight,
}: {
  label: string;
  value: number | null;
  max: number;
  displayValue: string;
  highlight?: boolean;
}) {
  const pct = value && max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-medium ${highlight ? "text-[#CEA44E]" : "text-gray-300"}`}>
          {label}
        </span>
        <span className={`text-sm font-bold ${highlight ? "text-[#CEA44E]" : "text-gray-200"}`}>
          {displayValue}
        </span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            highlight
              ? "bg-gradient-to-r from-[#FDF094] to-[#B77D2B]"
              : "bg-gray-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const PriceInsights = ({ title, data }: Props) => {
  const { project_min_inr, city_avg_inr, micro_market_avg_inr, city_name, micro_market, project_price_text } = data;

  // Need at least one comparable value to render
  if (!project_min_inr && !city_avg_inr) return null;

  const allValues = [project_min_inr, city_avg_inr, micro_market_avg_inr].filter(
    (v): v is number => v != null && v > 0
  );
  const max = allValues.length > 0 ? Math.max(...allValues) : 1;

  const projectDisplay = project_min_inr ? formatInr(project_min_inr)! : project_price_text || "—";
  const cityDisplay = city_avg_inr ? formatInr(city_avg_inr)! : "—";
  const mmDisplay = micro_market_avg_inr ? formatInr(micro_market_avg_inr)! : null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        Price Insights – {title}
      </h2>

      <div className="bg-black border border-gray-700 rounded-xl p-6">
        <p className="text-gray-400 text-sm mb-6">
          Starting price comparison across {micro_market ? `${micro_market} and ` : ""}
          {city_name} market.
        </p>

        <Bar
          label="This Project"
          value={project_min_inr}
          max={max}
          displayValue={projectDisplay}
          highlight
        />
        {micro_market_avg_inr && mmDisplay && (
          <Bar
            label={`${micro_market} Avg`}
            value={micro_market_avg_inr}
            max={max}
            displayValue={mmDisplay}
          />
        )}
        <Bar
          label={`${city_name} City Avg`}
          value={city_avg_inr}
          max={max}
          displayValue={cityDisplay}
        />

        <p className="text-gray-600 text-xs mt-4">
          * Based on starting prices of listed projects. Prices are indicative.
        </p>
      </div>
    </section>
  );
};

export default PriceInsights;
