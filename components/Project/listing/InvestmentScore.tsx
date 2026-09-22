import Link from "next/link";
import type { InvestmentScore as Score } from "@/lib/intelligence/view-model";
import {
  INVESTMENT_SCORE_PATH,
  SCORE_CEILING,
  SCORE_FLOOR,
} from "@/lib/intelligence/investmentScoreMeta";
import ScoreRing from "./ScoreRing";

type Props = { title: string; data: Score | null; heading?: string };

const InvestmentScore = ({ title, data, heading }: Props) => {
  if (!data) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {heading ?? `Investment Score - ${title}`}
      </h2>

      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        {/* Checklist item 8 (2026-09-22): "link 'How is this score
            calculated?' from every project page". The inline summary stays —
            it answers the question without a navigation — and the page behind
            the link carries the input data, point logic, missing-data
            handling and limitations in full. */}
        <details className="mb-5 group">
          <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#CEA44E] hover:text-[#e8c88a] transition-colors">
            How is this score calculated?
            <span className="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <p className="mt-2.5 text-[13px] leading-relaxed text-gray-400">
            The {data.score}/100 score is the sum of five weighted factors, shown below with
            their individual scores: Developer Reputation (out of 20), Connectivity (out of 25),
            Social Infrastructure (out of 20), Product &amp; Compliance (out of 20), and Entry
            Timing (out of 15), {data.factors.reduce((s, f) => s + f.max, 0)} points total,
            scaled to 100. A floor of {SCORE_FLOOR} and a ceiling of {SCORE_CEILING} apply, so
            the practical range is {SCORE_FLOOR}&ndash;{SCORE_CEILING}. Asking price is not an
            input.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-400">
            <Link href={INVESTMENT_SCORE_PATH} className="text-[#CEA44E] hover:underline">
              Full methodology: what feeds each factor, and what this score cannot tell you
            </Link>
          </p>
        </details>

        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ScoreRing score={data.score} grade={data.grade} size={180} />

          <div className="flex-1 w-full">
            <p className="text-gray-300 text-[15px] leading-7 mb-6">{data.verdict}</p>

            <div className="space-y-4">
              {data.factors.map((f) => {
                const pct = Math.round((f.earned / f.max) * 100);
                return (
                  <div key={f.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-200 font-medium">{f.label}</span>
                      <span className="text-[#CEA44E] font-semibold">
                        {f.earned}/{f.max}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FDF094] to-[#B77D2B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{f.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-gray-600 mt-6">
          The Homz Investment Score measures what our catalogue records about a project&apos;s
          location, connectivity, developer, product and construction status. It does not read
          the asking price, and it forecasts no yield, return or appreciation. It is not
          financial advice.{" "}
          <Link href={INVESTMENT_SCORE_PATH} className="text-gray-500 underline hover:text-[#CEA44E]">
            Methodology and limitations
          </Link>
          .
        </p>
      </div>
    </section>
  );
};

export default InvestmentScore;
