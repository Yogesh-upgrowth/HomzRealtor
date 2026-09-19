// Single source of truth for the business's Name/Address/Phone (NAP) and
// registration details — referenced by the footer, the /contact page, and
// the Organization JSON-LD in app/layout.tsx, so all three ever say the same
// thing. Real estate is a YMYL category; Google and buyers both weight
// consistent NAP plus a visible RERA registration number heavily here.
//
// officeAddress / hararaAgentNumber / gstNumber / social / hours are
// deliberately blank — fill these in with the company's actual registered
// details. Every consumer of this object renders each field conditionally
// (omitted, not faked) wherever it's blank, so leaving one empty degrades
// gracefully instead of shipping a placeholder value.
export const COMPANY_INFO = {
  name: "HomzRealtor",
  // Supplied by the owner 2026-09-19. If the registered entity carries a
  // suffix (Pvt Ltd / LLP) or differs from the trading name, replace this
  // with the exact registered string -- Organization.legalName is matched
  // against registry and directory records, so an approximation is worse
  // than the trading name alone.
  legalName: "Homz Realtor",
  phone: "+91-8447909227",
  phoneDisplay: "+91 84479 09227",
  email: "hello@homzrealtor.com",
  officeAddress: "",
  city: "Gurgaon",
  state: "Haryana",
  country: "IN",
  gstNumber: "",
  // HARERA agent registration (Haryana RERA — the relevant authority for the
  // Gurgaon market this site serves). Verified 2026-09-19 against the
  // certificate issued by HARERA Panchkula.
  //
  // IMPORTANT, and the reason `hareraHolder` exists: this registration is held
  // by an individual, Ms. Sunita Singhvi, not by the entity "Homz Realtor".
  // That is a normal and valid arrangement under section 9(3)(a), but it means
  // the site must not imply the company itself is the registered agent --
  // anyone checking the number on the HARERA portal will see the individual's
  // name, and a mismatch between what a site claims and what the registry
  // shows is worse than not quoting the number at all. Every surface that
  // renders this number renders the holder with it.
  hararaAgentNumber: "HRERA-PKL-REA-2548-2024",
  /** The natural person the registration is granted to. */
  hareraHolder: "Sunita Singhvi",
  /** Date of registration, as printed on the certificate. */
  hareraIssuedOn: "2024-02-27",
  /** The certificate states five years from the date of registration. */
  hareraValidUntil: "2029-02-26",
  hours: "Open 24 hours, all week", // confirmed by the owner 2026-09-19
  mapEmbedUrl: "", // Google Maps embed src, once officeAddress is set

  // 2026-09-19, Trust & local. The 19 Sep audit scored this area 15/100 and
  // named it "the biggest gap outside content" -- Google cannot verify Homz
  // as a real Gurgaon business, which also blocks the map pack entirely.
  // Everything below is consumed conditionally, so filling any single field
  // takes effect immediately with no code change.

  /** Machine-readable opening hours for openingHoursSpecification. `hours`
   *  above stays the human string shown in the footer; this is what schema
   *  and the Google Business Profile need to agree on.
   *  e.g. { days: ["Mo","Tu","We","Th","Fr","Sa"], opens: "10:00", closes: "19:00" } */
  // 24-hour operation. schema.org expresses that as a full-day span across
  // every day; keep this identical to what the Google Business Profile
  // publishes, because Google reconciles the two and a mismatch is worse than
  // an omission.
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  } as null | { days: string[]; opens: string; closes: string },

  /** Office coordinates, for LocalBusiness.geo. Only set these alongside a
   *  real officeAddress -- a geo point with no address is not a location. */
  geo: null as null | { lat: number; lng: number },

  /** The Gurgaon sectors Homz actually services, for areaServed. An explicit
   *  list is stronger than the bare city name and is honest about coverage.
   *  e.g. ["Sector 65", "Sector 81", "Golf Course Extension Road"] */
  serviceAreas: [] as string[],

  /** Named, real people for E-E-A-T. A YMYL property page carrying no human
   *  author is a trust gap Google weights. Do not invent these.
   *  e.g. [{ name: "...", role: "Principal Advisor", reraId: "..." }] */
  // Supplied by the owner 2026-09-19. Note reraId is deliberately absent here:
  // the HARERA registration above belongs to Sunita Singhvi, and attaching it
  // to a different person would be a false regulatory claim.
  team: [
    { name: "Renu Singh", role: "Property Consultant" },
  ] as { name: string; role: string; reraId?: string }[],
  social: {
    // Supplied by the owner 2026-09-19. Tracking/session parameters were
    // stripped: sameAs wants the canonical, stable profile URL, and an
    // Instagram `stkn` or a Facebook `mibextid` is per-share and can expire.
    instagram: "https://www.instagram.com/homzcomgurgaon",
    // This is a /share/ redirect rather than the page's own vanity URL. It
    // resolves, but swap it for facebook.com/<pagename> when convenient --
    // a redirect is a weaker sameAs target than the canonical page.
    facebook: "https://www.facebook.com/share/1YLE162vPn/",
    linkedin: "https://www.linkedin.com/company/homz-com/",
    youtube: "",
    // Added for SEO audit C-05 (2026-09-08) — Organization.sameAs needs
    // these plus a claimed Google Business Profile to disambiguate the
    // brand from unrelated "Homz"-named entities (HOMZ Real Estate Mission
    // Viejo CA, Houzz, the HOMZ ETF ticker, etc.). Claiming the actual
    // profiles is an ops task, not a code one — see the memory note this
    // session saved for the full list and what's still needed.
    justdial: "",
    crunchbase: "",
    // Supplied by the owner 2026-09-19. This is a share.google short link;
    // it resolves, but the canonical profile URL (g.page/<name> once a short
    // name is set, or the full Maps URL carrying the CID) is the more stable
    // thing to put in sameAs/hasMap, because a share link can be regenerated.
    // Worth swapping when convenient.
    googleBusiness: "https://share.google/kOsUxGd3PcDBraquC",
  },
};

export function hasSocialLinks(): boolean {
  return Object.values(COMPANY_INFO.social).some(Boolean);
}
