// What HomzRealtor charges, who pays it, and on what terms (2026-09-19).
//
// Rates supplied by the owner. Before this, the site asserted a fee position
// in one place (HomzRecordSections) and a contradictory one in another (the
// old homepage FAQ claimed buyers pay nothing because the developer pays us).
// Both cannot be true, and a wrong fee claim is a consumer problem before it
// is an SEO one, so the terms live here once and every surface reads them.
//
// ---------------------------------------------------------------------------
// MANDATE AND WITHDRAWAL — WRITTEN TO THE OWNER'S BEST-JUDGEMENT INSTRUCTION,
// AND THE ONE PART OF THIS FILE THAT NEEDS CONFIRMING
// ---------------------------------------------------------------------------
// The owner gave the rates and said "all handled by us", which describes the
// service and not the contract. Asked for the contractual terms, they asked
// for my judgement. So these are chosen, not supplied, and the reasoning is
// here rather than in a commit message because whoever changes them next
// needs it:
//
//   Open mandate, not exclusive. An exclusive mandate restricts the seller or
//   landlord, and nobody has agreed to impose that on them. An open mandate
//   also costs Homz nothing it does not already have, because the fee is
//   earned on introduction (below) rather than on exclusivity -- which is the
//   clause that actually protects the brokerage.
//
//   Withdraw at any time, no notice, nothing payable. Same reasoning: a
//   cancellation fee on a service that has not produced a buyer is
//   indefensible, and a notice period on an unpaid instruction buys Homz
//   nothing.
//
//   One carve-out: a buyer or tenant Homz introduced, whose transaction
//   completes within six months of withdrawal, still carries the brokerage.
//   Without it, an owner could take an introduction and cancel the next day,
//   and the open mandate above would be unsafe to offer. Six months is the
//   conventional introduction period; it is the only number here that is a
//   convention rather than a derivation, and it is the thing to change if the
//   owner wants a different one.
//
// The terms are deliberately generous to the client and narrow in what they
// protect. A seller reading them should find nothing that traps them, and
// Homz should find nothing that lets a completed introduction go unpaid.
//
// GST: confirmed by the owner 2026-09-19 as charged on top of these rates,
// not included in them. Every published rate now says so.
//
// The rate itself is deliberately NOT quoted. It is set by the government,
// not by Homz, and a percentage written into a page in September is a number
// nobody remembers to change when it moves -- the same reason the FAQs point
// at the Haryana revenue department for stamp duty rather than printing a
// figure. "Plus GST at the applicable rate" is accurate the day it is written
// and stays accurate. A client who wants the exact number gets it on the
// invoice, where it is correct by definition.

/** The introduction period in the withdrawal carve-out, in months. */
export const INTRODUCTION_PERIOD_MONTHS = 6;

/** Appended to every published rate. See the note above on why no percentage
 *  appears here. */
export const GST_NOTE = "plus GST at the applicable rate";

export const BROKERAGE_TERMS = {
  /** Sale of a house, villa or plot. */
  sale: {
    /** Percentage of the transaction value, charged to each side. */
    percentOfValue: 1,
    payers: "both the buyer and the seller",
    /** True when GST is charged on top of the rate rather than included. */
    gstExtra: true,
    summary:
      "On a sale — house, villa or plot — our brokerage is 1% of the transaction value from the buyer and 1% from the seller, plus GST at the applicable rate, payable when the transaction completes.",
    mandate:
      "Open, not exclusive. You can list with other agents and sell privately while we are marketing the property, and there is no minimum listing period. Our brokerage is payable only if the buyer who completes was introduced by us.",
    withdrawal:
      "Withdraw at any time, by telling your advisor or in writing. There is no notice period and nothing is payable on withdrawal. The one exception: if we introduced the buyer and that sale completes within six months of you withdrawing, the brokerage is still payable on it.",
  },
  /** Letting a property. */
  rent: {
    /** Share of the first month's rent, charged to each side. */
    percentOfFirstMonthRent: 50,
    payers: "both the owner and the tenant",
    gstExtra: true,
    summary:
      "On a letting, our brokerage is half of one month's rent from the owner and half of one month's rent from the tenant, plus GST at the applicable rate, payable once, when the tenancy agreement is signed.",
    mandate:
      "Open, not exclusive. You can instruct other agents and let privately while we are marketing the property, and there is no minimum instruction period. Our brokerage is payable only if the tenant who signs was introduced by us.",
    withdrawal:
      "Withdraw at any time, by telling your advisor or in writing. There is no notice period and nothing is payable on withdrawal. The one exception: if we introduced the tenant and that tenancy is signed within six months of you withdrawing, the brokerage is still payable on it.",
  },
  /** True for viewings and advice, which is what the detail pages assert. */
  noViewingFee: true,
  viewingSummary:
    "There is no charge to view a property or to talk to an advisor. Brokerage is payable only on a completed transaction.",
} as const;

/** One short paragraph for a property detail page. */
export function brokerageSummary(kind: "sale" | "rent"): string {
  return `${BROKERAGE_TERMS.viewingSummary} ${
    kind === "sale" ? BROKERAGE_TERMS.sale.summary : BROKERAGE_TERMS.rent.summary
  }`;
}
