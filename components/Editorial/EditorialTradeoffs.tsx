import { isPublishable, type EditorialPage } from "@/lib/content/editorial/types";

// "Who should and should not consider this" (2026-09-22).
//
// "Every place should have disadvantages. If every sector is described as
//  'ideal investment destination', the entire website loses credibility."
//
// Structured rather than prose so the rubric can actually check it: the
// 10-point tradeoffs test reads these two arrays and scores zero when the
// second one is empty. Grepping a paragraph for the word "however" would be a
// check that passes on copy that says nothing, which is worse than no check.
//
// The weighting is deliberate on both sides. The "may not suit" column is
// rendered with the same prominence as "may suit", not as a hedge underneath
// it, because a buyer deciding between two sectors is looking for exactly the
// thing every other property site omits.

export default function EditorialTradeoffs({
  page,
  subject,
}: {
  page: EditorialPage | null;
  /** "Sector 65", "DLF" — used in the two column headings. */
  subject: string;
}) {
  if (!isPublishable(page) || !page.tradeoffs) return null;
  const { suits, doesNotSuit } = page.tradeoffs;
  if (suits.length === 0 && doesNotSuit.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 my-10">
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
          <h3 className="text-[15px] font-semibold text-white">{subject} may suit</h3>
          <ul className="mt-3 space-y-2">
            {suits.map((s) => (
              <li key={s} className="text-[14px] leading-relaxed text-gray-300">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
          <h3 className="text-[15px] font-semibold text-white">{subject} may not suit</h3>
          <ul className="mt-3 space-y-2">
            {doesNotSuit.map((s) => (
              <li key={s} className="text-[14px] leading-relaxed text-gray-300">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
