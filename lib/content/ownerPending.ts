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
    value: null,
  },
  "seller.feePayer": {
    question: "Who pays that fee, the seller or the buyer, and at what point does it become payable?",
    owner: "business",
    value: null,
  },
  "seller.mandate": {
    question:
      "Is a listing mandate exclusive or open? If exclusive, for how long, and can the owner list elsewhere during it?",
    owner: "legal",
    value: null,
  },
  "seller.withdrawal": {
    question: "How does an owner withdraw a listing, with what notice, and is anything payable on withdrawal?",
    owner: "legal",
    value: null,
  },
  "seller.verification": {
    question:
      "What does Homz actually verify before listing (title, RERA, ownership proof, encumbrance), and what does it explicitly not verify?",
    owner: "operations",
    value: null,
  },
  "seller.timeline": {
    question: "Realistically, how long from first contact to a live listing, and to a typical closure?",
    owner: "operations",
    value: null,
  },
  "seller.routing": {
    question: "Which inbox, CRM queue or phone line should seller enquiries reach, and who owns response?",
    owner: "operations",
    value: null,
  },
  "landlord.feeAmount": {
    question: "What does Homz charge to let a property, as a percentage of rent, a flat fee or a month's rent?",
    owner: "business",
    value: null,
  },
  "landlord.feePayer": {
    question: "Who pays the letting fee, the landlord or the tenant, and when?",
    owner: "business",
    value: null,
  },
  "landlord.mandate": {
    question: "Is a letting mandate exclusive, and for how long?",
    owner: "legal",
    value: null,
  },
  "landlord.withdrawal": {
    question: "How does a landlord withdraw a letting instruction, and is anything payable?",
    owner: "legal",
    value: null,
  },
  "landlord.tenantScreening": {
    question:
      "What tenant screening does Homz perform (identity, employment, references, police verification), and what is the landlord's own responsibility?",
    owner: "operations",
    value: null,
  },
  "landlord.agreementSupport": {
    question:
      "Does Homz draft or assist with the rent agreement and registration, and is that included in the fee or charged separately?",
    owner: "legal",
    value: null,
  },
  "landlord.routing": {
    question: "Which inbox, CRM queue or phone line should landlord enquiries reach, and who owns response?",
    owner: "operations",
    value: null,
  },
  "shared.responseHours": {
    question: "What are Homz's actual contactable hours, and what response time can be promised?",
    owner: "operations",
    value: null,
  },
  "shared.legalOperator": {
    question: "What is the registered legal entity operating HomzRealtor, and its relationship to the brand?",
    owner: "legal",
    value: null,
  },
  "shared.registrations": {
    question: "Which registrations apply and can be quoted (HARERA agent number, GST, others)?",
    owner: "legal",
    value: null,
  },
};

/** True when every listed key has a real answer, i.e. the page no longer
 *  renders a placeholder and may be considered for indexing. */
export function allResolved(keys: OwnerPendingKey[]): boolean {
  return keys.every((k) => OWNER_PENDING[k].value !== null);
}
