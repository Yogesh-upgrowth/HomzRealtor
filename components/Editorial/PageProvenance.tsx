import Link from "next/link";

import { PLATFORM_PROVENANCE, PLATFORM_SOURCES } from "@/lib/content/editorial/provenance";
import type { EditorialPage } from "@/lib/content/editorial/types";

// "About this page's data" + Sources (2026-09-22).
//
// The block that ends every platform page. It states, in one place, what the
// numbers above it are and are not: an asking price is an asking price, a
// status came from the catalogue and the RERA register, a distance came from
// OSM. It then names actual references.
//
// The standard's own argument for it is the right one — this is "far more
// powerful than writing 'According to industry experts…'", because it is
// checkable. A reader who doubts a median can follow the methodology link; a
// reader who doubts a registration can open the Haryana register. Neither can
// do anything with an unnamed expert.
//
// TWO ROWS ARE CONDITIONAL and that is the honest part: "Editorial review"
// renders only when a person actually reviewed the copy, and RERA's
// checked-on date renders only when someone actually checked. An empty date
// is left out rather than filled with today's.

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

type Props = {
  /** When the catalogue figures on this page were computed. Passed in from
   *  the same computation that produced them — never a stored constant. */
  snapshotAt: Date | string;
  /** The editorial page, when one is published. Supplies the review date and
   *  the copy's own sources. */
  page?: EditorialPage | null;
  /** Extra references this page cites beyond the platform-wide ones. */
  extraSources?: { label: string; url: string }[];
};

export default function PageProvenance({ snapshotAt, page, extraSources = [] }: Props) {
  const declared = page?.provenance ?? PLATFORM_PROVENANCE;
  const snapshotIso =
    typeof snapshotAt === "string" ? snapshotAt : snapshotAt.toISOString().slice(0, 10);

  const rows: { k: string; v: React.ReactNode }[] = [
    {
      k: "Homz catalogue snapshot",
      v: <time dateTime={snapshotIso}>{formatDate(snapshotIso)}</time>,
    },
    { k: "Price type", v: declared.priceType },
    { k: "Transactions", v: declared.transactionsNote },
    { k: "Project status", v: declared.statusSource },
    {
      k: "RERA source",
      v: declared.reraCheckedAt
        ? `${declared.reraSource} — last checked for this page on ${formatDate(declared.reraCheckedAt)}`
        : declared.reraSource,
    },
    { k: "Infrastructure", v: declared.infrastructureSource },
  ];

  if (declared.editorialReviewedAt) {
    rows.push({
      k: "Editorial review",
      v: <time dateTime={declared.editorialReviewedAt}>{formatDate(declared.editorialReviewedAt)}</time>,
    });
  }

  // Claim-level sources from the copy, de-duplicated against each other and
  // against the platform list. A source cited in four sections is one entry.
  const claimSources = (page?.sections ?? [])
    .flatMap((s) => s.claims ?? [])
    .concat((page?.faqs ?? []).flatMap((f) => f.claims ?? []))
    .filter((c) => c.sourceUrl)
    .map((c) => ({ label: c.sourceLabel ?? c.sourceUrl!, url: c.sourceUrl! }));

  const sources: { label: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const s of [...PLATFORM_SOURCES, ...(declared.sources ?? []), ...claimSources, ...extraSources]) {
    if (seen.has(s.url)) continue;
    seen.add(s.url);
    sources.push(s);
  }

  return (
    <section
      aria-labelledby="page-provenance"
      className="w-full max-w-7xl mx-auto px-4 my-12"
    >
      <div className="max-w-3xl rounded-[20px] border border-white/[0.07] bg-[#141416] p-6">
        <h2 id="page-provenance" className="text-lg font-semibold text-white">
          About this page&rsquo;s data
        </h2>

        <dl className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <div key={r.k} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
              <dt className="text-[13px] font-medium text-gray-400">{r.k}</dt>
              <dd className="text-[13px] leading-relaxed text-gray-300">{r.v}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-6 text-[15px] font-semibold text-white">Sources</h3>
        <ul className="mt-2 space-y-1.5">
          {sources.map((s) => (
            <li key={s.url} className="text-[13px] leading-relaxed">
              {s.url.startsWith("/") ? (
                <Link href={s.url} className="text-gray-400 underline hover:text-[#D9B268]">
                  {s.label}
                </Link>
              ) : (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-gray-400 underline hover:text-[#D9B268]"
                >
                  {s.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
