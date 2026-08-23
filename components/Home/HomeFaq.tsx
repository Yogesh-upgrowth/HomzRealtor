import { HOME_FAQS } from "@/lib/content/homeFaq";

// Dark accordion mirroring components/Project/intelligence/Faq.tsx's pattern.
const HomeFaq = () => {
  return (
    <section id="faq" className="w-full max-w-4xl mx-auto px-4 py-14 md:py-20 scroll-mt-24 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Questions, answered
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Frequently Asked Questions
      </h2>

      <div className="flex flex-col gap-3">
        {HOME_FAQS.map((item, i) => (
          <details key={i} className="group rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white">
              <h3 className="text-inherit font-medium">{item.q}</h3>
              <span className="shrink-0 text-xl text-[#D9B268] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-400">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default HomeFaq;
