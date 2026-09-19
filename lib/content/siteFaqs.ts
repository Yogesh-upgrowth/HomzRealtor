import type { FaqItem } from "@/lib/intelligence/content";

// The full /faq set (2026-09-19).
//
// Audit item 11: "/faq repeats the homepage's 5 FAQs, FAQPage schema on both.
// Expand to 25 to 30 grouped questions or remove." The duplicate schema was
// removed from the homepage in an earlier commit; this gives /faq a reason to
// exist as its own page.
//
// Every answer here is grounded in something the site actually does or
// something independently checkable. Deliberately absent:
//   - stamp duty, registration charges and tax rates. They change, they vary by
//     buyer, and this codebase has no qualified reviewer. Answers point at the
//     official source instead of quoting a number that could be wrong by the
//     time someone acts on it.
//   - any claim about outcomes, appreciation or "best" anything.
//   - the "in-house loan desk works with 15+ banks and NBFCs" claim the old
//     homepage FAQ carried. Nothing evidences it and the owner has not
//     restated it.
//
// The channel-partner question IS answered here, but only with the three
// developers the owner actually named (lib/content/channelPartners.ts). The
// version removed from HOME_FAQS named five that nothing supported.
//
// Grouped so the page can render sections rather than one long list; the group
// names double as the on-page headings.

export type FaqGroup = { heading: string; items: FaqItem[] };

export const SITE_FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Working with HomzRealtor",
    items: [
      {
        q: "Is HomzRealtor a broker or a direct seller?",
        a: "HomzRealtor is a real estate agent, not the seller. We are registered with the Haryana Real Estate Regulatory Authority under registration number HRERA-PKL-REA-2548-2024, granted to Sunita Singhvi and valid to February 2029. You can verify that number yourself on the HARERA portal.",
      },
      {
        q: "Does HomzRealtor charge buyers or tenants a fee to view a property?",
        a: "No. There is no charge to view a property or to talk to an advisor. Brokerage is payable only on a completed transaction, and the rates are published below rather than raised at the end.",
      },
      {
        q: "What does HomzRealtor charge?",
        a: "On a sale — house, villa or plot — our brokerage is 1% of the transaction value from the buyer and 1% from the seller. On a letting it is half of one month's rent from the owner and half of one month's rent from the tenant, payable once. Nothing is payable unless the transaction completes.",
      },
      {
        q: "Is HomzRealtor a channel partner for any developers?",
        a: "Yes. HomzRealtor is an authorised channel partner for DLF, M3M and Central Park, among other Gurgaon developers. Authorisation is granted per developer and often per project, so ask us which projects that covers before you rely on it for a specific booking.",
      },
      {
        q: "Which areas does HomzRealtor cover?",
        a: "Gurgaon. Our catalogue spans the city's sectors and the main corridors: Dwarka Expressway, Golf Course Road, Golf Course Extension Road, Sohna Road, Southern Peripheral Road and New Gurgaon. We do not currently service other NCR cities, and we would rather say so than take an enquiry we cannot serve well.",
      },
      {
        q: "What are your contact hours?",
        a: "We are contactable 24 hours a day, every day, on +91 84479 09227. You can also send an enquiry from any property page and an advisor will call you back.",
      },
      {
        q: "How do I schedule a site visit?",
        a: "Use the enquiry form on any property or project page, or call us directly. Tell us which unit you want to see — quoting the HomzRealtor reference shown on the page is the fastest way — and an advisor will arrange access with the owner or the developer.",
      },
      {
        q: "Can you help if I live outside India?",
        a: "Yes. Plenty of owners and buyers we work with are not in the city, or not in the country. Viewings can be handled on your behalf and shared by video. You will still need to be reachable for decisions, and present or formally represented for the paperwork.",
      },
    ],
  },
  {
    heading: "About the listings on this site",
    items: [
      {
        q: "Where do the listings on HomzRealtor come from?",
        a: "From the inventory we broker, aggregated from our own mandates and from listing feeds we track across Gurgaon. Each listing is rebuilt as a HomzRealtor record: we compute its price against its sector, join it to the project it belongs to, and give it our own reference number.",
      },
      {
        q: "What is the HomzRealtor reference on each listing?",
        a: "It is our own identifier for that specific unit — a code like HZ-GGN-S-4K2P9A shown in the HomzRealtor record section at the bottom of every property page. It stays the same for that unit even if the listing is reposted, so it is the most reliable thing to quote when you call.",
      },
      {
        q: "Why do some listings say several postings were consolidated?",
        a: "The same flat is often advertised by more than one broker, with different wording and sometimes different prices. Where we can confidently identify those as the same physical unit, we merge them into one record and show you the range of prices being quoted rather than three near-identical pages.",
      },
      {
        q: "What does \"listing last checked\" mean, and how is it different from verified?",
        a: "\"Last checked\" means the listing was still present in our tracked inventory on that date. \"Confirmed with the owner\" means an advisor actually called the owner and confirmed the unit is available at the stated price on that date. They are different claims and the page never conflates them.",
      },
      {
        q: "Are the prices on HomzRealtor the final price?",
        a: "No. Everything shown is an asking price, not a transacted price, and asking prices are negotiable. The sector comparison on each page tells you where that asking price sits against others we currently track in the same sector, which is a useful starting point for that conversation.",
      },
      {
        q: "How current are the prices?",
        a: "Listings refresh from our tracked inventory continuously, and each property page shows when it was last checked. Sector medians are computed from whatever is live at the time the page is generated. Always confirm the current price with an advisor before acting on it.",
      },
      {
        q: "Why do some listings show no price?",
        a: "Because the seller has listed it as price on request. We would rather show that honestly than publish a guess. Ask us and we will find out.",
      },
      {
        q: "Some photos look like they came from elsewhere. Whose are they?",
        a: "Some listing photography is supplied by the developer or originates from the listing feed. We are progressively replacing it with our own photography, starting with the properties people view most.",
      },
    ],
  },
  {
    heading: "RERA, checks and paperwork",
    items: [
      {
        q: "Are all listings on HomzRealtor RERA registered?",
        a: "Not automatically, and any site telling you otherwise is overstating it. Every project page shows that project's actual status — registered, lapsed, unverified or not registered — as sourced from available records. Confirm the current registration on the official HARERA portal before making any payment.",
      },
      {
        q: "How do I check a project's RERA registration myself?",
        a: "Search the registration number on the Haryana RERA portal at haryanarera.gov.in. Check that the number matches the specific project and phase you are buying into, not just the developer, and that the registration has not lapsed. A number appearing in marketing material is not the same as a current, matching registration.",
      },
      {
        q: "What should I check before paying a booking amount?",
        a: "The project's current RERA registration and that it covers your specific phase, the developer's title to the land, the approved building plan and occupation certificate where the project is complete, and exactly what the payment schedule commits you to. Ask for the developer's latest quarterly progress report if construction is ongoing.",
      },
      {
        q: "What documents will I need to buy a resale property?",
        a: "Typically the sale deed and prior title chain, the possession certificate, an encumbrance check, latest maintenance and utility receipts, and a no-objection certificate from the society or builder where applicable. Your lawyer should confirm what applies to the specific property — this list is a starting point, not legal advice.",
      },
      {
        q: "What are the stamp duty and registration charges in Gurgaon?",
        a: "They depend on the property value, the buyer's gender and whether the property is urban or rural, and the rates are set by the Haryana government rather than by us. Check the current rates on the Haryana revenue department's site or with your lawyer before budgeting — we will not quote a figure that might be out of date when you act on it.",
      },
      {
        q: "Does HomzRealtor verify property titles?",
        a: "No, and you should be wary of any agent that claims to. We surface the RERA status and the project-level facts we hold, and we will flag anything that looks inconsistent. Title due diligence is a job for your own lawyer, and it is worth doing properly.",
      },
    ],
  },
  {
    heading: "Renting, selling and letting",
    items: [
      {
        q: "Can I rent a property through HomzRealtor?",
        a: "Yes. The rental catalogue covers apartments, builder floors and independent houses across Gurgaon, filterable by sector, configuration and monthly budget.",
      },
      {
        q: "I own a property in Gurgaon and want to sell it. What happens first?",
        a: "Tell us about the property and an advisor will call to discuss realistic pricing against comparable listings in your sector and how we would market it. We handle the sale end to end from there — pricing, listing, viewings, negotiation and paperwork. Our brokerage is 1% of the transaction value, payable on completion.",
      },
      {
        q: "Can HomzRealtor find me a tenant?",
        a: "Yes, and we handle the letting end to end: pricing, listing, viewings, tenant selection and the rent agreement. Our brokerage is half of one month's rent, payable once the tenancy is agreed.",
      },
      {
        q: "How long does it take to sell or let a property in Gurgaon?",
        a: "It varies with the sector, the asking price and the time of year, and anyone giving you a single number without seeing the property is guessing. An advisor will give you a realistic view for your specific unit.",
      },
    ],
  },
  {
    heading: "Data and privacy",
    items: [
      {
        q: "What happens to my details when I submit an enquiry?",
        a: "They go to our advisory team so someone can respond to your enquiry. We do not sell your details. See our privacy policy for the full position.",
      },
      {
        q: "Does HomzRealtor track me on this site?",
        a: "Only with your consent. Analytics does not load until you accept the cookie banner, and you can change that choice at any time using the Cookie Preferences link in the footer.",
      },
      {
        q: "How do I report something wrong on a listing?",
        a: "Call or email us with the HomzRealtor reference shown on the page. Wrong data is worth telling us about — a corrected record helps the next person looking at that unit as much as it helps you.",
      },
    ],
  },
];

/** Flattened, for FAQPage structured data. */
export const SITE_FAQS: FaqItem[] = SITE_FAQ_GROUPS.flatMap((g) => g.items);
