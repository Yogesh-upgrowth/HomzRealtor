// "About this page's data" — the declared defaults (2026-09-22).
//
// "Every page should end with something like:
//    Homz catalogue snapshot: 22 September 2026
//    Price type: Listed asking price
//    Transactions: Not claimed unless sourced
//    Project status: Homz catalogue + project/RERA verification
//    RERA source: Haryana RERA
//    Infrastructure: Official/public sources where available
//    Editorial review: Date
//  Then: Sources. Actual references.
//  This is far more powerful than writing 'According to industry experts…'"
//
// Every line above is already true of the platform pages TODAY, before a word
// of editorial copy is written — the catalogue is the catalogue, the prices
// are asking prices, RERA comes from the Haryana register, the POI data comes
// from OSM. So the block ships now rather than waiting for the prose, and the
// two rows that depend on a writer ("Editorial review" and the Sources list)
// simply do not render until there is a writer to name.
//
// THE SNAPSHOT DATE IS NOT DECLARED HERE. It is passed in at render time from
// the same computation that produced the page's figures. A snapshot date typed
// into a constant is wrong the first time the feed refreshes, and this block's
// entire purpose is to be the part of the page a sceptical reader can trust.

import type { PageProvenanceDeclaration } from "./types";

/**
 * What every platform page can truthfully say about its own data, with no
 * editorial copy involved.
 *
 * A page with editorial copy overrides these where it has something more
 * specific to say — a sector page whose infrastructure section cites a named
 * municipal source should name it — but nothing here is a placeholder, and
 * none of it needs a writer.
 */
export const PLATFORM_PROVENANCE: PageProvenanceDeclaration = {
  priceType: "Listed asking price",
  transactionsNote:
    "Transacted prices are not claimed. Everything on this page is what sellers, landlords and developers are currently asking; registered transaction values are routinely lower and are not published here unless a named source is cited.",
  statusSource:
    "HomzRealtor catalogue, cross-checked against the project's own RERA registration where one is recorded.",
  reraSource: "Haryana Real Estate Regulatory Authority (Gurugram), https://haryanarera.gov.in",
  reraCheckedAt: "",
  infrastructureSource:
    "OpenStreetMap extracts for points of interest, with distances computed from project coordinates. Straight-line distance and driving time are reported separately and never interchanged.",
};

export const HARYANA_RERA_URL = "https://haryanarera.gov.in";

/** Sources every platform page references, regardless of editorial copy. The
 *  page's own claim-level sources are appended to these at render. */
export const PLATFORM_SOURCES: { label: string; url: string }[] = [
  { label: "Haryana Real Estate Regulatory Authority (Gurugram)", url: HARYANA_RERA_URL },
  { label: "OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright" },
  { label: "HomzRealtor pricing methodology", url: "/property-rates-in-gurgaon" },
  { label: "Homz Investment Score methodology", url: "/homz-investment-score-methodology" },
];
