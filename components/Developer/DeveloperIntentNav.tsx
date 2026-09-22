import Link from "next/link";
import type { AvailableView } from "@/lib/intelligence/developerViews";

// The intent navigation, directly under the hero (2026-09-22).
//
// Plain crawlable <a> links, never a JavaScript filter. That is the whole
// requirement: a filter that only exists after hydration is invisible to a
// crawler, so the child pages would be built and then never discovered.
// Next's <Link> renders a real anchor with a real href in the server HTML.
//
// A view appears here at ONE project — it is a useful filter for a person
// browsing a portfolio long before it is worth indexing. Whether it is offered
// to Google is a separate decision made on the child page itself. Conflating
// the two would either hide useful navigation or index thin pages; keeping
// them apart lets both be right.

type Props = {
  developerName: string;
  developerSlug: string;
  views: AvailableView[];
  /** The view currently being shown, so it renders as state rather than a
   *  link to itself. Undefined on the parent page. */
  activeSlug?: string;
  totalCount: number;
};

export default function DeveloperIntentNav({
  developerName,
  developerSlug,
  views,
  activeSlug,
  totalCount,
}: Props) {
  if (views.length === 0) return null;

  const base = `/developer/${developerSlug}`;
  const pill =
    "rounded-full border px-4 py-1.5 text-sm font-medium transition whitespace-nowrap";
  const inactive = "border-gray-700 bg-black text-gray-300 hover:border-[#B77D2B] hover:text-[#CEA44E]";
  const active = "border-[#B77D2B] bg-[#B77D2B]/15 text-[#CEA44E]";

  return (
    <nav aria-label={`${developerName} project categories`} className="mt-6">
      <div className="flex flex-wrap gap-2">
        {activeSlug ? (
          <Link href={base} className={`${pill} ${inactive}`}>
            All {developerName} projects <span className="text-gray-500">({totalCount})</span>
          </Link>
        ) : (
          <span aria-current="page" className={`${pill} ${active}`}>
            All {developerName} projects <span className="opacity-70">({totalCount})</span>
          </span>
        )}

        {views.map(({ view, count }) =>
          view.slug === activeSlug ? (
            <span key={view.slug} aria-current="page" className={`${pill} ${active}`}>
              {view.label} <span className="opacity-70">({count})</span>
            </span>
          ) : (
            <Link key={view.slug} href={`${base}/${view.slug}`} className={`${pill} ${inactive}`}>
              {view.label} <span className="text-gray-500">({count})</span>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
