import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// Sticky rail on desktop, collapsible block on mobile — rendered as two
// separate blocks (rather than one <details lg:open>) because Tailwind has
// no utility that sets the native `open` attribute responsively; a
// details element with no `open` attribute starts closed on every
// viewport, so the old single-block version showed an empty "On this
// page" header on desktop with the list never actually visible.
const TocList = ({ sections }: { sections: BlogPostV27["sections"] }) => (
  <ol className="space-y-2 text-sm">
    {sections.map((s) => (
      <li key={s.id}>
        <a href={`#${s.id}`} className="text-gray-400 hover:text-[#CEA44E]">
          {s.h2}
        </a>
      </li>
    ))}
  </ol>
);

const TableOfContents = ({ sections }: { sections: BlogPostV27["sections"] }) => {
  return (
    <>
      {/* Mobile / tablet: collapsed by default */}
      <details className="mb-8 rounded-xl border border-gray-700 bg-black p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-gray-400 [&::-webkit-details-marker]:hidden">
          On this page
        </summary>
        <nav aria-label="Table of contents" className="mt-3">
          <TocList sections={sections} />
        </nav>
      </details>

      {/* Desktop: always-expanded sticky rail */}
      <nav
        aria-label="Table of contents"
        className="hidden rounded-xl border border-gray-700 bg-black p-4 lg:sticky lg:top-24 lg:block"
      >
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">On this page</p>
        <TocList sections={sections} />
      </nav>
    </>
  );
};

export default TableOfContents;
