// R19-08 (2026-09-19): the seller and landlord service pages need real
// commercial terms -- fee amount and payer, mandate/exclusivity, withdrawal
// rights, verification steps, response times, routing. Those are business
// facts only Homz can supply, and the recheck is explicit that a developer
// "must not invent these business rules". Competitor pages are a legitimate
// model for *structure* (what sections a seller expects, what questions to
// answer, which queries the page should target) but not a source for Homz's
// own fees or contractual terms: copying that text would both publish terms
// Homz has not agreed to and duplicate a competitor's page, which works
// against the ranking the page exists for.
//
// So every such fact is represented here, and only here, as a typed pending
// item. Pages render them through <OwnerPending> (components/Services/
// OwnerPending.tsx), which is visually unmistakable, so nothing ships
// looking like a real commitment. Fill in `value` to publish a fact; a page
// is only ready to be indexed once nothing it renders is still pending.
//
// 2026-09-19: the owner supplied the fee terms ("1% from buyer and seller on
// a sale, 50% of the first month's rent from owner and tenant on a letting")
// and "all handled by us" for the process. Everything answerable from that,
// or from facts the site already publishes, is filled in below.
//
// The mandate and withdrawal terms were left open at first, on the ground
// that "all handled by us" describes the service and not the contract. The
// owner then asked for them to be written to best judgement, and confirmed
// the sale fee is payable on completion. They are filled in below and the
// rows are back on both service pages.
//
// Those four values are chosen rather than supplied, so they are the ones to
// review: an open mandate with no notice period and no cancellation fee,
// protected only by a six-month introduction period on a buyer or tenant Homz
// brought. The full reasoning, including why the introduction period is the
// clause that makes the open mandate safe to offer, is in
// lib/content/brokerageTerms.ts, which is the single source they are copied
// from -- change it there.

import { BROKERAGE_TERMS } from "./brokerageTerms";

export type OwnerPendingKey =
  | "seller.feeAmount"
  | "seller.feePayer"
  | "seller.mandate"
  | "seller.withdrawal"
  | "seller.verification"
  | "seller.timeline"
  | "seller.routing"
  | "landlord.feeAmount"
  | "landlord.feePayer"
  | "landlord.mandate"
  | "landlord.withdrawal"
  | "landlord.tenantScreening"
  | "landlord.agreementSupport"
  | "landlord.routing"
  | "shared.responseHours"
  | "shared.legalOperator"
  | "shared.registrations";

export type OwnerPendingItem = {
  /** What Homz needs to decide or confirm, in plain words. */
  question: string;
  /** Who is expected to answer it. */
  owner: "business" | "legal" | "operations";
  /** Filled-in answer. While null the page shows the pending marker. */
  value: string | null;
};

export const OWNER_PENDING: Record<OwnerPendingKey, OwnerPendingItem> = {
  "seller.feeAmount": {
    question: "What does Homz charge to sell a property, as a percentage or a flat fee?",
    owner: "business",
    value:
      "1% of the transaction value, plus GST at the applicable rate.",
  },
  "seller.feePayer": {
    question: "Who pays that fee, the seller or the buyer, and at what point does it become payable?",
    owner: "business",
    value:
      "1% from the seller and 1% from the buyer, payable when the transaction completes. Nothing is payable before that -- not for the valuation conversation, the listing, the photographs or the viewings.",
  },
  // The four contractual terms below are read from BROKERAGE_TERMS rather
  // than copied, so the service pages, the property detail pages and the FAQs
  // cannot drift apart on what the same clause says.
  "seller.mandate": {
    question:
      "Is a listing mandate exclusive or open? If exclusive, for how long, and can the owner list elsewhere during it?",
    owner: "legal",
    value:
      BROKERAGE_TERMS.sale.mandate,
  },
  "seller.withdrawal": {
    question: "How does an owner withdraw a listing, with what notice, and is anything payable on withdrawal?",
    owner: "legal",
    value:
      BROKERAGE_TERMS.sale.withdrawal,
  },
  "seller.verification": {
    question:
      "What does Homz actually verify before listing (title, RERA, ownership proof, encumbrance), and what does it explicitly not verify?",
    owner: "operations",
    value:
      "We surface the project's RERA status and the project-level facts we hold, and we will flag anything that looks inconsistent. We do not verify title, and no agent honestly can: title due diligence is a job for your own lawyer, and for your buyer's.",
  },
  "seller.timeline": {
    question: "Realistically, how long from first contact to a live listing, and to a typical closure?",
    owner: "operations",
    value:
      "It varies with the sector, the asking price and the time of year, and anyone quoting a single number without seeing the property is guessing. An advisor will give you a realistic view for your specific unit.",
  },
  "seller.routing": {
    question: "Which inbox, CRM queue or phone line should seller enquiries reach, and who owns response?",
    owner: "operations",
    value:
      "Enquiries reach our advisory team, who call back on +91 84479 09227. We are contactable 24 hours a day, every day.",
  },
  "landlord.feeAmount": {
    question: "What does Homz charge to let a property, as a percentage of rent, a flat fee or a month's rent?",
    owner: "business",
    value:
      "Half of one month's rent, plus GST at the applicable rate.",
  },
  "landlord.feePayer": {
    question: "Who pays the letting fee, the landlord or the tenant, and when?",
    owner: "business",
    value:
      "Half of one month's rent from the owner and half from the tenant, payable once, when the tenancy agreement is signed. Nothing is payable before that.",
  },
  "landlord.mandate": {
    question: "Is a letting mandate exclusive, and for how long?",
    owner: "legal",
    value:
      BROKERAGE_TERMS.rent.mandate,
  },
  "landlord.withdrawal": {
    question: "How does a landlord withdraw a letting instruction, and is anything payable?",
    owner: "legal",
    value:
      BROKERAGE_TERMS.rent.withdrawal,
  },
  "landlord.tenantScreening": {
    question:
      "What tenant screening does Homz perform (identity, employment, references, police verification), and what is the landlord's own responsibility?",
    owner: "operations",
    value:
      "We find and select the tenant and handle the letting end to end. The specific checks for a given tenancy are agreed with the landlord rather than fixed here, so ask your advisor what will be run on your property.",
  },
  "landlord.agreementSupport": {
    question:
      "Does Homz draft or assist with the rent agreement and registration, and is that included in the fee or charged separately?",
    owner: "legal",
    value:
      "Yes. We handle the rent agreement as part of the letting. Government charges such as stamp duty and registration fees are set by the state and are payable separately.",
  },
  "landlord.routing": {
    question: "Which inbox, CRM queue or phone line should landlord enquiries reach, and who owns response?",
    owner: "operations",
    value:
      "Enquiries reach our advisory team, who call back on +91 84479 09227. We are contactable 24 hours a day, every day.",
  },
  "shared.responseHours": {
    question: "What are Homz's actual contactable hours, and what response time can be promised?",
    owner: "operations",
    value:
      "We are contactable 24 hours a day, every day, on +91 84479 09227.",
  },
  "shared.legalOperator": {
    question: "What is the registered legal entity operating HomzRealtor, and its relationship to the brand?",
    owner: "legal",
    value:
      "HomzRealtor is the trading name of a sole proprietorship registered in the name of Sunita Singhvi.",
  },
  "shared.registrations": {
    question: "Which registrations apply and can be quoted (HARERA agent number, GST, others)?",
    owner: "legal",
    value:
      "HARERA real estate agent registration HRERA-PKL-REA-2548-2024, valid to 26 February 2029, and GSTIN 06BANPS9686L1ZI. Both are registered to Sunita Singhvi and can be checked on the HARERA and GST portals.",
  },
};

/**
 * The terms each service page actually renders.
 *
 * Kept here rather than inside the page files so the sitemap can gate its
 * entry on exactly the same check the page's own robots tag uses. A sitemap
 * entry pointing at a noindex page is a contradiction Search Console reports,
 * and it would happen the moment someone cleared a value in this file.
 */
export const SELLER_TERM_KEYS: OwnerPendingKey[] = [
  "seller.feeAmount",
  "seller.feePayer",
  "seller.mandate",
  "seller.withdrawal",
  "seller.verification",
  "seller.timeline",
];

export const LANDLORD_TERM_KEYS: OwnerPendingKey[] = [
  "landlord.feeAmount",
  "landlord.feePayer",
  "landlord.mandate",
  "landlord.withdrawal",
  "landlord.tenantScreening",
  "landlord.agreementSupport",
];

/** True when every listed key has a real answer, i.e. the page no longer
 *  renders a placeholder and may be considered for indexing. */
export function allResolved(keys: OwnerPendingKey[]): boolean {
  return keys.every((k) => OWNER_PENDING[k].value !== null);
}
