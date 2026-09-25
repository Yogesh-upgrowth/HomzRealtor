// Per-project corrections to the feed (2026-09-25, developer-page brief §2).
//
// The feed places some projects wrongly or not at all: DLF Privana North came
// through with no sector and no corridor, so the DLF page could not put its
// most important launch where buyers look for it. This file is the owner's
// correction layer, applied once at the normalisation boundary
// (lib/intelligence/projects.ts) so the project page, the developer page, the
// sector pages and the sitemap all agree.
//
// RULES
//   - Every entry names its source and the date it was checked.
//   - `ship: false` keeps an entry on file without applying it. Use it for
//     anything the owner has not yet confirmed on the HARERA portal.
//   - Only the fields present are overridden; everything else stays feed data.
//   - `hareraId` is recorded for the owner's check, and is only rendered once
//     `hareraConfirmed` is true — a number copied from a broker's page is not
//     something to print as a registration.

export type ProjectOverride = {
  cityKey: string;
  /** slugify(project_name), as in lib/intelligence/normalize.ts. */
  slug: string;
  sector?: string;
  /** Written into micro_market, which is what the corridor matchers read. */
  corridor?: string;
  /** Feed-style status text, e.g. "New Launch". */
  status?: string;
  possession?: string;
  hareraId?: string;
  hareraConfirmed?: boolean;
  note: string;
  source: string;
  verifiedAt: string | null;
  ship: boolean;
};

export const PROJECT_OVERRIDES: ProjectOverride[] = [
  {
    cityKey: "ggn",
    slug: "dlf-privana-north",
    sector: "Sector 76",
    corridor: "Southern Peripheral Road",
    status: "New Launch",
    // Reported as March 2029 by third-party listings; not stated here until
    // the HARERA record is read, because a possession date is a promise.
    hareraId: "RC/REP/HARERA/GGM/954/686/2025/57",
    hareraConfirmed: false,
    note:
      "Sector 76 per DLF's own project page (dlf.in/homes/luxury/privananorth, titled 'Luxury Homes in Sector 76, Gurgaon'); " +
      "brokers describe the site as Sector 76-77. HARERA number is from third-party listings and awaits the owner's check on haryanarera.gov.in.",
    source: "https://www.dlf.in/homes/luxury/privananorth/",
    verifiedAt: "2026-09-25",
    ship: true,
  },
  {
    cityKey: "ggn",
    slug: "dlf-privana-enclave",
    sector: "Sector 76",
    status: "New Launch",
    note:
      "Plotted launch in the Privana township. Found only on a broker's page (sarthakestates.com), not on dlf.in or HARERA, so it is held " +
      "until the owner confirms it on the HARERA portal. Also absent from the feed: shipping it needs the record to exist, not only this override.",
    source: "https://www.sarthakestates.com/projects/dlf-privana-enclave-sector-76-77-gurugram/",
    verifiedAt: null,
    ship: false,
  },
];

const SHIPPED = new Map(
  PROJECT_OVERRIDES.filter((o) => o.ship).map((o) => [`${o.cityKey}:${o.slug}`, o])
);

export function projectOverrideFor(cityKey: string, slug: string): ProjectOverride | null {
  return SHIPPED.get(`${cityKey}:${slug}`) ?? null;
}
