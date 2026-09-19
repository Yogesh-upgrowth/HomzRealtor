import type { FaqItem } from "@/lib/intelligence/content";
import { SITE_FAQS } from "@/lib/content/siteFaqs";

// The five questions the homepage shows. These are a *selection* from the
// full /faq set rather than their own copy (2026-09-19).
//
// They used to be independent text, and it had drifted into three problems:
//
//   1. A live typo in the first question: "s HomzRealtor a broker or a direct
//      seller??" — visible on the homepage and inside the FAQPage markup.
//   2. Two claims nothing in this business can currently evidence: that Homz
//      is an "authorized channel partner for M3M, DLF, Emaar, Godrej and Tata
//      Realty", and that an "in-house loan desk works with 15+ banks and
//      NBFCs". Both are owner-pending (ownerInputs.ts →
//      authority.channelPartnerProof). An unprovable partner claim in a YMYL
//      category is a trust liability, not a trust signal, so neither is
//      restated here. The channel-partner FAQ returns the day the proof does.
//   3. /faq rendered exactly these five and nothing else, so the page had no
//      reason to exist next to the homepage section.
//
// Selecting by question text keeps the two surfaces from diverging again: an
// answer is edited in one place, siteFaqs.ts, and the homepage follows.
const HOMEPAGE_QUESTIONS = [
  "Is HomzRealtor a broker or a direct seller?",
  "Are all listings on HomzRealtor RERA registered?",
  "Does HomzRealtor charge buyers or tenants a fee to view a property?",
  "Where do the listings on HomzRealtor come from?",
  "How do I schedule a site visit?",
];

export const HOME_FAQS: FaqItem[] = HOMEPAGE_QUESTIONS.map((q) => {
  const found = SITE_FAQS.find((f) => f.q === q);
  // Fails the build rather than silently shrinking the homepage section if a
  // question is ever reworded in siteFaqs.ts.
  if (!found) throw new Error(`homeFaq: no /faq entry matches "${q}"`);
  return found;
});
