import type { FaqItem } from "@/lib/intelligence/content";

type Props = {
  title: string;
  items?: FaqItem[];
};

const Faq = ({ title, items }: Props) => {
  if (!items || items.length === 0) return null;

  return (
    <section id="faq" className="w-full max-w-7xl mx-auto px-2 my-12 scroll-mt-24">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Frequently Asked Questions - ${title}`}
      </h2>

      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <details
            key={i}
            className="group bg-black border border-gray-700 rounded-xl px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-white font-medium">
              <span>{item.q}</span>
              <span className="text-[#CEA44E] text-xl transition-transform group-open:rotate-45 shrink-0">
                +
              </span>
            </summary>
            <p className="mt-3 text-gray-300 text-[15px] leading-7">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default Faq;
