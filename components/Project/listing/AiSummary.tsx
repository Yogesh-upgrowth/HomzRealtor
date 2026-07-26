type Props = {
  title: string;
  aiText?: string;
  about?: string[];
};

/**
 * Overview body copy. Prefers the AI-generated location narrative, then falls
 * back to the project's own "about" paragraphs. Renders nothing only when both
 * are empty. Sole consumer is OverviewSection, which owns the section chrome
 * (kicker, heading, snapshot grid) — this component is just the paragraphs.
 */
const AiSummary = ({ aiText, about = [] }: Props) => {
  const paragraphs = (() => {
    if (aiText && aiText.trim()) {
      return aiText.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
    }
    return about.map((s) => s.trim()).filter(Boolean);
  })();

  if (paragraphs.length === 0) return null;

  return (
    <div className="text-gray-300 text-[15px] leading-7 space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
};

export default AiSummary;
