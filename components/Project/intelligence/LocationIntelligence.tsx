import type { NormalizedProject } from "@/lib/intelligence/normalize";

function RichText({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h3
            key={i}
            className="text-lg font-semibold text-gray-900 mt-5 mb-2"
          >
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
};

const LocationIntelligence = ({ project, text }: Props) => {
  if (!text) return null;

  const chips = [
    project.sector,
    project.micro_market,
    project.city_name,
    project.state,
  ].filter(Boolean) as string[];

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
