type Spec = { heading?: string; value?: string };

type Props = {
  title: string;
  specifications: Spec[];
};

// First-time on the project page — /flat's specs table is bespoke inline JSX,
// not this component, so there's no collision.
const SpecificationsAccordion = ({ title, specifications }: Props) => {
  const rows = (specifications || []).filter((s) => s.heading && s.value);
  if (rows.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Specifications – ${title}`}
      </h2>

      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <details
            key={i}
            className="group bg-black border border-gray-700 rounded-xl px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-white font-medium">
              <span>{row.heading}</span>
              <span className="text-[#CEA44E] text-xl transition-transform group-open:rotate-45 shrink-0">
                +
              </span>
            </summary>
            <p className="mt-3 text-gray-300 text-[15px] leading-7">{row.value}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default SpecificationsAccordion;
