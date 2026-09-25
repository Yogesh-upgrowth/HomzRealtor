import Markdown from "markdown-to-jsx";

import { SECTION_SPECS } from "@/lib/content/editorial/standard";
import { publishedSections, type EditorialPage } from "@/lib/content/editorial/types";

// Homz Content Standard v1 — the render path (2026-09-22).
//
// Renders a page's human-written sections in the frozen standard's order, and
// renders NOTHING when there is no publishable copy. That second half is the
// important one: every sector and developer hub mounts this component today,
// and every one of them renders an empty fragment, because no editorial copy
// has been written yet.
//
// That is the design. The slots exist so a writer's work is additive — copy
// lands in a registry and appears, with no route change, no template change
// and no rebuild of the page around it. It is also why nothing here has a
// fallback: a section with no prose shows no heading, no placeholder and no
// "coming soon". A heading with nothing under it is worse than no heading.
//
// ORDERING comes from the standard, not from the registry, so "freeze the
// structure" holds even when copy is entered section by section in whatever
// order it gets written.

const markdownOptions = {
  overrides: {
    p: { props: { className: "mb-4 last:mb-0 text-[15px] leading-relaxed text-gray-300" } },
    ul: { props: { className: "mb-4 list-disc space-y-1.5 pl-5 text-[15px] text-gray-300" } },
    ol: { props: { className: "mb-4 list-decimal space-y-1.5 pl-5 text-[15px] text-gray-300" } },
    h3: { props: { className: "mt-6 mb-2 text-lg font-semibold text-white" } },
    strong: { props: { className: "font-semibold text-white" } },
    a: { props: { className: "text-[#CEA44E] underline hover:no-underline" } },
    table: { props: { className: "mb-4 w-full text-left text-[14px] text-gray-300" } },
    th: { props: { className: "border-b border-white/10 py-2 pr-4 font-semibold text-white" } },
    td: { props: { className: "border-b border-white/[0.05] py-2 pr-4" } },
  },
};

/** Section id → its position in the frozen standard, per page type. A section
 *  id absent from the standard sorts last rather than throwing: the registry's
 *  load-time assertion is what rejects those, and the render path should not
 *  be a second place that can fail. */
const SPEC_ORDER: Record<string, Map<string, number>> = Object.fromEntries(
  Object.entries(SECTION_SPECS).map(([type, specs]) => [
    type,
    new Map(specs.map((s, i) => [s.id, i] as const)),
  ])
);

export default function EditorialSections({ page }: { page: EditorialPage | null }) {
  if (!page) return null;
  const sections = publishedSections(page);
  if (sections.length === 0) return null;

  const order = SPEC_ORDER[page.pageType] ?? new Map<string, number>();
  const ordered = [...sections].sort(
    (a, b) => (order.get(a.specId) ?? 999) - (order.get(b.specId) ?? 999)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {ordered.map((section) => (
        <section
          key={section.specId}
          id={`editorial-${section.specId}`}
          className="my-10 max-w-3xl scroll-mt-28"
        >
          <h2 className="mb-3 text-2xl font-bold text-white">{section.heading}</h2>
          <Markdown options={markdownOptions}>{section.bodyMarkdown}</Markdown>
        </section>
      ))}
    </div>
  );
}
