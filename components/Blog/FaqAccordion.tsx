import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// details/summary, ALL collapsed by default — never flat <p> stacks, never
// all-open (see _closing_structure.faqs_as_index). <summary> text must match
// faqs[].q verbatim since it's also what FAQPage JSON-LD echoes as
// Question.name (lib/seo/blogJsonLd.ts) — markup for text not visible on the
// page is a spam-policy violation the schema explicitly calls out.
// Dark styling mirrors components/Project/intelligence/Faq.tsx, the site's
// existing dark FAQ pattern.
const FaqAccordion = ({ faqs }: { faqs: BlogPostV27["faqs"] }) => {
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">Tap any question to expand.</p>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl border border-gray-700 bg-black px-5 py-4 open:border-[#B77D2B]/50"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white [&::-webkit-details-marker]:hidden">
              <span>{faq.q}</span>
              <span className="shrink-0 text-xl leading-none text-[#CEA44E] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-7 text-gray-300">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
};

export default FaqAccordion;
