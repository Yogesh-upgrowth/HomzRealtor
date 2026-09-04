import { CheckCircle2 } from "lucide-react";
import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// Renders conclusion as a tinted panel with a checkmark heading and a
// checklist — NOT a plain h2 + paragraph. On a 10+ minute read the payoff
// needs visual weight or it disappears into the scroll (_closing_structure).
const TakeawayCard = ({ conclusion }: { conclusion: BlogPostV27["conclusion"] }) => {
  return (
    <div className="rounded-2xl border border-[#B77D2B]/40 bg-gradient-to-b from-[#2a2010] to-black p-6 md:p-8">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 size={22} className="text-[#CEA44E]" />
        <h2 className="text-xl font-bold text-white">{conclusion.heading ?? "The short version"}</h2>
      </div>
      <p className="mb-4 text-[15px] leading-relaxed text-gray-300">{conclusion.lead}</p>
      <ul className="space-y-2">
        {conclusion.checklist.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[15px] text-gray-300">
            <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#CEA44E]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {conclusion.closer && (
        <p className="mt-4 text-sm italic text-gray-500">{conclusion.closer}</p>
      )}
    </div>
  );
};

export default TakeawayCard;
