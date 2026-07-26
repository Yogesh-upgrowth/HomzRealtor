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
        ),
      )}
    </>
  );
}

type Props = {
  title: string;
  text?: string;
};

const InvestmentAnalysis = ({ title, text }: Props) => {
  if (!text) return null;

  return (
    <article className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-6 md:p-7">
      <h3 className="text-lg font-bold text-white mb-3">Investment Analysis – {title}</h3>
      <div className="text-gray-300 text-[15px] leading-7">
        <RichText text={text} />
      </div>
    </article>
  );
};

export default InvestmentAnalysis;
