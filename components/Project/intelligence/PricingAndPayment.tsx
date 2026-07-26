import type { PriceInsightsData } from "@/lib/intelligence/projects";
import PriceTrendChart from "./PriceTrendChart";
import PriceInsights from "./PriceInsights";
import PaymentPlanCards from "./PaymentPlanCards";

type Props = {
  title: string;
  slug: string;
  priceText: string;
  priceSubtext: string | null;
  minPriceInr: number | null;
  priceData: PriceInsightsData | null;
  // Raw price-list rows straight from NormalizedProject.price_list (typed any[]
  // at the source — scraped data with inconsistent field names), passed through
  // unchanged to PriceInsights/PriceTrendChart which each do their own parsing.
  priceList: any[];
  possessionText: string | null;
};

// Below-market comparison is only ever shown when it's genuinely favorable —
// never fabricated, computed straight from the same real averages PriceInsights
// already fetches (getPriceInsights in lib/intelligence/projects.ts).
function belowMarketBadge(minPriceInr: number | null, priceData: PriceInsightsData | null) {
  if (!minPriceInr || !priceData) return null;
  const avg = priceData.micro_market_avg_inr || priceData.city_avg_inr;
  if (!avg || avg <= minPriceInr) return null;
  const pct = Math.round(((avg - minPriceInr) / avg) * 100);
  if (pct < 1) return null;
  const area = priceData.micro_market || priceData.city_name;
  return `↓ ${pct}% below ${area} avg`;
}

const PricingAndPayment = ({
  title,
  slug,
  priceText,
  priceSubtext,
  minPriceInr,
  priceData,
  priceList,
  possessionText,
}: Props) => {
  const badge = belowMarketBadge(minPriceInr, priceData);

  return (
    <section id="pricing" className="w-full max-w-7xl mx-auto px-2 my-12 scroll-mt-24">
      <h2 className="text-2xl bg-gradient-to-b from-[#F2D79B] to-[#C99A4B] font-bold bg-clip-text text-transparent mb-6">
        {`Pricing & Payment – ${title}`}
      </h2>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.09] pb-6">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.15em] text-gray-500">
            {priceSubtext || "Starting price"}
          </p>
          <p className="font-display text-4xl leading-none text-white md:text-5xl">{priceText}</p>
        </div>
        {badge && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#63C08D]/30 bg-[#63C08D]/12 px-4 py-2.5 text-[13.5px] font-bold text-[#7fd3a5]">
            {badge}
          </span>
        )}
      </div>

      {priceData && (
        <PriceInsights title={title} data={priceData} priceList={priceList} bare />
      )}
      <div className="mt-4">
        <PriceTrendChart
          title={title}
          priceList={priceList}
          defaultPrice={minPriceInr}
          possessionText={possessionText}
          bare
        />
      </div>

      <div className="mt-8">
        <PaymentPlanCards slug={slug} />
      </div>
    </section>
  );
};

export default PricingAndPayment;
