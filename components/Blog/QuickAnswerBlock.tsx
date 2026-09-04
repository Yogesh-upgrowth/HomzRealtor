import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// Visually distinct block immediately after the hero, inside the first 30%
// of the document — the most-cited block for AI-Overview/PAA eligibility
// (_seo_contract.front_loaded_answer).
const QuickAnswerBlock = ({ quickAnswer }: { quickAnswer: BlogPostV27["quickAnswer"] }) => {
  return (
    <div className="rounded-2xl border-l-4 border-[#B77D2B] bg-black p-5 md:p-6">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#CEA44E]">Quick answer</p>
      <p className="mb-1 font-semibold text-white">{quickAnswer.question}</p>
      <p className="text-[15px] leading-relaxed text-gray-300">{quickAnswer.answer}</p>
    </div>
  );
};

export default QuickAnswerBlock;
