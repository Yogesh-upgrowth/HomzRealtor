import Link from "next/link";

// Checklist items 13 and 14, as one reusable standard (2026-09-22).
//
// Item 13: "Add visible 'Data updated' dates to dynamic pages — Property
// Rates, Sector pages, Developer pages, Project pages where prices are
// dynamic, Commercial inventory pages. This reinforces that pricing is
// live/current rather than evergreen copy."
//
// Item 14: "Distinguish asking price from transaction price everywhere. You've
// already done this well on Property Rates. Now make it a reusable standard
// anywhere you show market statistics. Use 'Current asking price', not simply
// 'Market price', unless it genuinely comes from transaction/registry data.
// For calculated median figures: 'Median asking price based on active
// HomzRealtor inventory.'"
//
// The two belong together: a price figure with no date is as misleading as a
// median labelled "market price". /property-rates-in-gurgaon already did both
// in hand-written prose; this is that treatment extracted so the sector,
// developer, project and commercial pages carry it identically rather than
// each inventing its own wording.
//
// WHY A COMPONENT AND NOT A STRING. The date has to be a real <time> element
// for the markup to be worth anything, and the asking-price note has to be
// able to link to where the methodology is explained. Both are easy to get
// subtly wrong (a date with no dateTime, a note that says "market") and the
// point of a standard is that no page has to get it right on its own.

/** The one phrase for a price that is being asked, not one that was paid. */
export const ASKING_PRICE_LABEL = "Current asking price";

/** The one sentence for a computed median. Item 14 quotes this wording. */
export function medianAskingNote(scope?: string): string {
  return scope
    ? `Median asking price based on active HomzRealtor inventory in ${scope}.`
    : "Median asking price based on active HomzRealtor inventory.";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type DataUpdatedProps = {
  /** ISO date the figures on this page were computed from. */
  date: string;
  /** What was updated, when "Market data" is not the right noun. */
  label?: string;
  className?: string;
};

/**
 * "Market data updated: 21 September 2026".
 *
 * Rendered as a real <time datetime="..."> so the date is machine-readable,
 * which is the half of item 13 that a hand-written sentence usually misses.
 */
export function DataUpdated({ date, label = "Market data updated", className }: DataUpdatedProps) {
  return (
    <p className={className ?? "text-[13px] text-gray-500"}>
      {label}:{" "}
      <time dateTime={date} className="text-gray-400">
        {formatDate(date)}
      </time>
    </p>
  );
}

type AskingPriceNoteProps = {
  /** Sector, corridor or city these figures cover. */
  scope?: string;
  /** Set when the figures are medians rather than individual asking prices. */
  median?: boolean;
  /** ISO date, when the note should carry the freshness line too. */
  date?: string;
  className?: string;
};

/**
 * The asking-vs-transaction disclosure, in the same words everywhere.
 *
 * The second sentence is the one that matters and it is deliberately blunt:
 * a reader who takes a median asking price for a market price will open a
 * negotiation from the wrong number.
 */
export function AskingPriceNote({ scope, median = true, date, className }: AskingPriceNoteProps) {
  return (
    <p className={className ?? "text-[12.5px] leading-relaxed text-gray-500"}>
      {median ? medianAskingNote(scope) : `${ASKING_PRICE_LABEL}s from active HomzRealtor inventory${scope ? ` in ${scope}` : ""}.`}{" "}
      These are prices being asked, not prices recorded at registration, and transacted
      prices are routinely lower.{" "}
      {date && (
        <>
          Computed{" "}
          <time dateTime={date} className="text-gray-400">
            {formatDate(date)}
          </time>
          .{" "}
        </>
      )}
      <Link href="/property-rates-in-gurgaon" className="text-gray-400 underline hover:text-[#D9B268]">
        How we compute these
      </Link>
      .
    </p>
  );
}
