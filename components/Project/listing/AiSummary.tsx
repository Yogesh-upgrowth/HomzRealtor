import { Sparkles } from "lucide-react";

type Props = {
  title: string;
  aiText?: string;
  about?: string[];
};

/**
 * Overview / AI Summary. Prefers the AI-generated location narrative, then falls
 * back to the project's own "about" paragraphs. Renders nothing only when both
 * are empty (the page still has plenty of other sections in that case).
 */
const AiSummary = ({ title, aiText, about = [] }: Props) => {
  const paragraphs = (() => {
    if (aiText && aiText.trim()) {
      return aiText.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
    }
    return about.map((s) => s.trim()).filter(Boolean);
  })();

  if (paragraphs.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <div className="rounded-2xl bg-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={20} className="text-[#B77D2B]" />
          <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent">
            {`Overview - ${title}`}
          </h2>
        </div>
        <div className="border-b border-gray-300 mb-4" />
        <div className="text-gray-700 text-[15px] leading-7 space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AiSummary;
