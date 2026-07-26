function RichText({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h3 key={i} className="text-lg font-semibold text-white mt-5 mb-2">
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
    <article className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-6 md:p-7">
      <h3 className="text-lg font-bold text-white mb-1">{area} – Market Insights</h3>
      <p className="text-gray-500 text-sm mb-4">How the local market looks for {title}</p>
      <div className="text-gray-300 text-[15px] leading-7">
        <RichText text={text} />
      </div>
    </article>
  );
};

export default AreaMarketInsights;
