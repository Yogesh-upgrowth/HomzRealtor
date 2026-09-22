import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// Checklist item 24 (2026-09-22): "Every important article should answer:
// What data are we using? When was it collected? How many listings/projects
// are included? Are these asking prices or transaction prices? What can't we
// conclude from the dataset? This is one of HomzRealtor's strongest
// differentiators now."
//
// Three of those five were already answered somewhere on a post — the
// first-hand data note, the verified date, the productDataHook counts. Two
// were not, and the gap was measurable: of the 25 published guides, 20 never
// stated anywhere that their prices are ASKING prices. Every one of them
// quotes medians.
//
// Rewriting twenty articles' prose was the other option and it is the wrong
// one: it would mean putting new sentences into published, dated, fact-checked
// copy, at scale, with no source for the edits beyond my own reading. This
// block instead renders the answers from what each post already DECLARES, so
// every article answers all five questions from data rather than from prose
// someone remembered to write.
//
// The schema check added alongside this (see validatePost) holds new posts to
// answering them in their own words too. The block is the floor, not the
// ceiling.

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DataProvenance({ post }: { post: BlogPostV27 }) {
  const hook = post.eeat.productDataHook;

  const answers: { q: string; a: React.ReactNode }[] = [
    {
      q: "What data is this built from?",
      a: (
        <>
          HomzRealtor&apos;s own live catalogue of Gurgaon listings and projects, plus the
          named sources at the end of this guide. {post.eeat.firstHandDataNote}
        </>
      ),
    },
    {
      q: "When was it collected?",
      a: (
        <>
          {hook.dateRange}. Facts in this guide were last verified{" "}
          <time dateTime={post.eeat.lastVerifiedAt}>{formatDate(post.eeat.lastVerifiedAt)}</time>,
          and the page was last updated{" "}
          <time dateTime={post.meta.updatedAt}>{formatDate(post.meta.updatedAt)}</time>. Figures
          quoted in the text are from that snapshot, not from today&apos;s catalogue — our{" "}
          <a href="/property-rates-in-gurgaon" className="text-[#D9B268] hover:underline">
            live rates page
          </a>{" "}
          always carries the current numbers.
        </>
      ),
    },
    {
      q: "How many records are included?",
      // localityCount is optional in the schema, so a post that does not
      // declare one says how many records rather than inventing a locality
      // figure to fill the sentence.
      a: hook.localityCount != null ? (
        <>
          {hook.propertyCount.toLocaleString("en-IN")} records across{" "}
          {hook.localityCount.toLocaleString("en-IN")}{" "}
          {hook.localityCount === 1 ? "locality" : "localities"}.
        </>
      ) : (
        <>{hook.propertyCount.toLocaleString("en-IN")} records.</>
      ),
    },
    {
      q: "Are these asking prices or transaction prices?",
      a: (
        <>
          <span className="text-gray-100">Asking prices, without exception.</span> Every price
          in this guide is what a seller or landlord is currently asking across our catalogue.
          Transaction prices are recorded at registration, are not public in the same way, and
          are routinely lower than asking. Treat any figure here as the start of a negotiation,
          not its outcome.
        </>
      ),
    },
    {
      q: "What can't be concluded from this?",
      a: (
        <>
          Nothing here establishes what a specific property is worth, what it will be worth, or
          what it last sold for. We publish no appreciation rate and no rental yield, because we
          hold no transaction history to compute either from. A median describes the middle of
          what is listed, and what is listed changes month to month — so a movement in a median
          is not by itself a movement in the market.
        </>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="data-provenance"
      className="mt-12 rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-6"
    >
      <h2 id="data-provenance" className="text-xl font-bold tracking-tight text-white">
        How to read the numbers in this guide
      </h2>
      <dl className="mt-4 space-y-4">
        {answers.map(({ q, a }) => (
          <div key={q}>
            <dt className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#D9B268]">
              {q}
            </dt>
            <dd className="mt-1 text-[14.5px] leading-relaxed text-gray-300">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
