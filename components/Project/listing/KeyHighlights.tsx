import { Check } from "lucide-react";

const KeyHighlights = ({ title, highlights }: { title: string; highlights: string[] }) => {
  if (!highlights || highlights.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Key Highlights - ${title}`}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {highlights.map((h, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 rounded-full bg-[#CEA44E]/15 p-1">
              <Check size={16} className="text-[#B77D2B]" />
            </span>
            <p className="text-[15px] leading-7 text-gray-700">{h}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default KeyHighlights;
