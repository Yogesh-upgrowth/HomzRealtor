function RichText({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h3 key={i} className="text-lg font-semibold text-gray-900 mt-5 mb-2">
            {b.slice(3)}
          </h3>
        ) : (
          <p key={i} className="mb-3">
            {b}
          </p>
        )
      )}
    </>
  );
}

type Props = {
  title: string;
  microMarket: string | null;
  cityName: string;
  text?: string;
};

const AreaMarketInsights = ({ title, microMarket, cityName, text }: Props) => {
  if (!text) return null;

  const area = microMarket || cityName;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <article className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-1">
          {area} – Market Insights
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          How the local market looks for {title}
        </p>

        <div className="border-b border-gray-300 mb-4" />

        <div className="text-gray-700 text-[15px] leading-7">
          <RichText text={text} />
        </div>
      </article>
    </section>
  );
};

export default AreaMarketInsights;
