import type { SectionMedia as SectionMediaItem } from "@/lib/content/blogPostSchema";
import BarChartDiagram from "./diagrams/BarChartDiagram";
import ComparisonSplitDiagram from "./diagrams/ComparisonSplitDiagram";
import BlogImageOrFallback from "./BlogImageOrFallback";

// diagram.data's shape depends on diagramKind (the content schema only
// guarantees "some object" — see blogPostSchema.ts's comment on
// sectionMediaSchema) so each kind is narrowed defensively at render time
// rather than trusted blindly.
function renderDiagram(media: Extract<SectionMediaItem, { type: "diagram" }>) {
  const { data, alt, caption, diagramKind } = media;
  if (diagramKind === "bar_chart" && Array.isArray((data as Record<string, unknown>).bars)) {
    const bars = (data as { bars: { label: string; value: number }[]; unit?: string }).bars;
    const unit = (data as { unit?: string }).unit;
    return <BarChartDiagram bars={bars} unit={unit} alt={alt} caption={caption} />;
  }
  if (diagramKind === "comparison_split") {
    const d = data as { total?: number; left?: { label: string; value: number }; right?: { label: string; value: number } };
    if (d.total != null && d.left && d.right) {
      return <ComparisonSplitDiagram total={d.total} left={d.left} right={d.right} alt={alt} caption={caption} />;
    }
  }
  // timeline / location_map: not used by the current article set. Falls
  // back to a plain described note rather than silently rendering nothing.
  return (
    <figure className="my-2 rounded-xl border border-dashed border-gray-700 bg-black p-4 text-sm text-gray-500">
      {alt}
      {caption && <figcaption className="mt-1 text-xs text-gray-600">{caption}</figcaption>}
    </figure>
  );
}

const CALLOUT_STYLES: Record<string, string> = {
  tip: "border-emerald-800 bg-emerald-950/40 text-emerald-200",
  pro_tip: "border-emerald-800 bg-emerald-950/40 text-emerald-200",
  warning: "border-amber-800 bg-amber-950/40 text-amber-200",
  note: "border-gray-700 bg-black text-gray-300",
};

const CALLOUT_LABELS: Record<string, string> = {
  tip: "Tip",
  pro_tip: "Pro tip",
  warning: "Warning",
  note: "Note",
};

const SectionMedia = ({ items }: { items: SectionMediaItem[] }) => {
  return (
    <div className="my-5 space-y-5">
      {items.map((media, i) => {
        if (media.type === "image") {
          return (
            <figure key={i} className="my-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
                <BlogImageOrFallback src={media.src} alt={media.alt} sizes="(min-width: 768px) 720px, 100vw" />
              </div>
              {media.caption && <figcaption className="mt-2 text-xs text-gray-500">{media.caption}</figcaption>}
            </figure>
          );
        }
        if (media.type === "diagram") {
          return <div key={i}>{renderDiagram(media)}</div>;
        }
        if (media.type === "callout") {
          const style = CALLOUT_STYLES[media.variant] ?? CALLOUT_STYLES.note;
          return (
            <aside key={i} role="note" className={`rounded-xl border p-4 ${style}`}>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide opacity-80">
                {media.title ?? CALLOUT_LABELS[media.variant]}
              </p>
              <p className="text-[14.5px] leading-relaxed">{media.body}</p>
            </aside>
          );
        }
        if (media.type === "table") {
          return (
            <div key={i} className="overflow-x-auto rounded-2xl border border-gray-700 bg-black p-1">
              <table className="w-full min-w-[420px] text-sm">
                <caption className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                  {media.caption}
                </caption>
                <thead>
                  <tr className="border-b border-gray-700 text-left text-gray-400">
                    {media.headers.map((h, hi) => (
                      <th key={hi} scope="col" className="px-4 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {media.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-gray-800 last:border-0">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`px-4 py-2.5 ${ci === 0 ? "font-medium text-gray-100" : "text-[#CEA44E]"}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // product_cta
        return (
          <a
            key={i}
            href={media.url}
            className={
              media.variant === "inline"
                ? "inline-block rounded-md bg-[#B77D2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a06d24]"
                : "block rounded-xl bg-[#B77D2B] px-5 py-4 text-center font-semibold text-white hover:bg-[#a06d24]"
            }
          >
            {media.text} →
          </a>
        );
      })}
    </div>
  );
};

export default SectionMedia;
