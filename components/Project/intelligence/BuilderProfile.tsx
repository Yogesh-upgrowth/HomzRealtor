import Link from "next/link";

type Props = {
  builder: string;
  text: string;
  slug?: string; // when set, the developer name links to /developer/[slug]
};

function RichText({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => (
        <p key={i} className="mb-3">
          {b}
        </p>
      ))}
    </>
  );
}

const BuilderProfile = ({ builder, text, slug }: Props) => {
  if (!text) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <div className="bg-black border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FDF094] to-[#B77D2B] flex items-center justify-center shrink-0">
            <span className="text-black font-bold text-base">
              {builder.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Developer</p>
            <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent leading-tight">
              {slug ? (
                <Link href={`/developer/${slug}`} className="hover:opacity-80 transition-opacity">
                  {builder}
                </Link>
              ) : (
                builder
              )}
            </h2>
          </div>
        </div>

        <div className="border-b border-gray-700 mb-4" />

        <div className="text-gray-300 text-[15px] leading-7">
          <RichText text={text} />
        </div>

        {slug && (
          <Link
            href={`/developer/${slug}`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FDF094] to-[#B77D2B] px-5 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
          >
            View all projects by {builder} →
          </Link>
        )}
      </div>
    </section>
  );
};

export default BuilderProfile;
