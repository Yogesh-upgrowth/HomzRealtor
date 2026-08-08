import type { NormalizedProject } from "@/lib/intelligence/normalize";

// "## " subheadings (e.g. "Location & Connectivity", "What's Nearby") come
// from the AI-generated text itself, not from this component's own markup —
// their color has to follow `variant` or they render illegibly: text-gray-900
// is correct on the light variant's white card, but on the dark project
// page (variant="dark") it was rendering near-black text on a near-black
// background.
function RichText({ text, variant = "light" }: { text: string; variant?: "light" | "dark" }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  const headingClass =
    variant === "dark"
      ? "text-lg font-semibold text-[#D9B268] mt-5 mb-2"
      : "text-lg font-semibold text-gray-900 mt-5 mb-2";
  return (
    <>
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h3 key={i} className={headingClass}>
            {b.slice(3)}
          </h3>
        ) : (
          <p key={i} className="mb-3">
            {b}
          </p>
        ),
      )}
    </>
  );
}

type Props = {
  project: NormalizedProject;
  text?: string;
  // Additive — default "light" keeps /flat's usage (FlatIntelligenceSections)
  // unchanged. The redesigned main project page passes variant="dark".
  variant?: "light" | "dark";
};

const LocationIntelligence = ({ project, text, variant = "light" }: Props) => {
  if (!text) return null;

  const chips = [
    project.sector,
    project.micro_market,
    project.city_name,
    project.state,
  ].filter(Boolean) as string[];

  if (variant === "dark") {
    return (
      <div className="rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-[#D9B268]/[0.06] to-transparent p-6 md:p-8">
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {chips.map((c) => (
              <span
                key={c}
                className="text-xs font-medium text-gray-300 bg-[#141416] border border-white/10 rounded-full px-3 py-1.5"
              >
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="text-gray-300 text-[15px] leading-7">
          <RichText text={text} variant="dark" />
        </div>
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <div className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-3">
          {`Location Intelligence - ${project.project_name}`}
        </h2>

        <div className="border-b border-gray-300 mb-4" />

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {chips.map((c) => (
              <span
                key={c}
                className="text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full px-3 py-1"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="text-gray-700 text-[15px] leading-7">
          <RichText text={text} />
        </div>
      </div>
    </section>
  );
};

export default LocationIntelligence;
