import type { InvestmentScore as Score } from "@/lib/intelligence/view-model";

const Gauge = ({ score, grade }: { score: number; grade: string }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative h-[180px] w-[180px] shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="score-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDF094" />
            <stop offset="100%" stopColor="#B77D2B" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#2a2a2a" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="url(#score-gold)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400">out of 100</span>
        <span className="mt-1 text-sm font-semibold text-[#CEA44E]">{grade}</span>
      </div>
    </div>
  );
};

type Props = { title: string; data: Score | null; heading?: string };

const InvestmentScore = ({ title, data, heading }: Props) => {
  if (!data) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {heading ?? `Investment Score - ${title}`}
      </h2>

      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <Gauge score={data.score} grade={data.grade} />

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

        <p className="text-[11px] text-gray-600 mt-6">
          HomzRealtor Investment Score is an indicative rating derived from location,
          connectivity, developer profile, product quality and entry timing. It is not
          financial advice.
        </p>
      </div>
    </section>
  );
};

export default InvestmentScore;
