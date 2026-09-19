// What HomzRealtor charges, and who pays it (2026-09-19).
//
// Supplied by the owner. Before this, the site asserted a fee position in one
// place (HomzRecordSections) and a contradictory one in another (the old
// homepage FAQ claimed buyers pay nothing because the developer pays us).
// Both cannot be true, and a wrong fee claim is a consumer problem before it
// is an SEO one, so the terms live here once and every surface reads them.
//
// Deliberately not stated anywhere below, because the owner has not stated
// them and inventing commercial terms is not a gap this file may fill:
//   - whether a mandate is exclusive, and for how long
//   - withdrawal or cancellation terms
//   - when the fee becomes payable, and whether any part is refundable
//   - whether GST is charged on top of these rates (the business is GST
//     registered, so it probably is, but "probably" is not a term)
// A page that needs one of these says nothing about it rather than guessing.
// Ask the owner, add it here, and it appears everywhere at once.

export const BROKERAGE_TERMS = {
  /** Sale of a house, villa or plot. */
  sale: {
    /** Percentage of the transaction value, charged to each side. */
    percentOfValue: 1,
    payers: "both the buyer and the seller",
    summary:
      "On a sale — house, villa or plot — our brokerage is 1% of the transaction value from the buyer and 1% from the seller.",
  },
  /** Letting a property. */
  rent: {
    /** Share of the first month's rent, charged to each side. */
    percentOfFirstMonthRent: 50,
    payers: "both the owner and the tenant",
    summary:
      "On a letting, our brokerage is half of one month's rent from the owner and half of one month's rent from the tenant, payable once, on the first month's rent.",
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
