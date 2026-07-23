import type { HighlightStat } from "@/lib/intelligence/view-model";

const HighlightStats = ({ title, stats }: { title: string; stats: HighlightStat[] }) => {
  if (!stats || stats.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Why ${title} — Three Reasons It Stands Out`}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-3xl font-bold bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent">
              {s.big}
            </p>
            <p className="mt-1 font-semibold text-gray-900">{s.title}</p>
            <p className="mt-0.5 text-sm text-gray-500">{s.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HighlightStats;
