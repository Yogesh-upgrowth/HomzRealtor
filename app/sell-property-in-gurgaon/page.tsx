import type { Metadata } from "next";
import SellPropertyForm from "@/components/Home/SellPropertyForm";
import ServicePage from "@/components/Services/ServicePage";
import { allResolved, SELLER_TERM_KEYS } from "@/lib/content/ownerPending";

const title = "Sell Your Property in Gurgaon";
const description =
  "List your Gurgaon property with HomzRealtor: how the process works, what to have ready, and what it costs. Speak to an advisor about selling.";

// R19-08 (2026-09-19). The owner supplied the fee terms, so this page now
// publishes: 1% of the transaction value from the seller and 1% from the
// buyer, plus GST, payable on completion.
//
// The mandate and withdrawal rows were held back at first, on the ground
// that "all handled by us" describes the service and not the contract. The
// owner then asked for them to be written to best judgement: an open mandate,
// no notice period, no cancellation fee, protected only by a six-month
// introduction period on a buyer we brought. The reasoning is in
// lib/content/brokerageTerms.ts. They are the terms on this page most worth
// the owner re-reading, because they are the ones nobody dictated.
//
// The gate below stays derived rather than a hand-flipped flag: the page is
// indexable exactly when nothing it renders is still a placeholder, so it can
// never be published while showing "Owner input needed".
const PENDING_KEYS = SELLER_TERM_KEYS;

const READY_TO_INDEX = allResolved(PENDING_KEYS);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sell-property-in-gurgaon" },
  robots: READY_TO_INDEX ? undefined : { index: false, follow: true },
};

export default function SellPropertyPage() {
  return (
    <ServicePage
      eyebrow="For property owners"
      h1="Sell Your Property in Gurgaon"
      intro="If you own a flat, floor, villa or plot in Gurgaon and want to sell, an advisor will talk you through what your property is likely to fetch, what paperwork you will need, and how we would market it. We handle the sale end to end from there. Our brokerage is 1% of the transaction value plus GST, payable when the sale completes, and there is nothing to pay before that. We do not ask for an exclusive mandate, and you can withdraw at any time."
      steps={[
        {
          title: "Tell us about the property",
          body: "Sector or society, configuration, approximate size, and what you are hoping to achieve. A few lines is enough to start.",
        },
        {
          title: "Talk to an advisor",
          body: "We come back to you to understand the property properly, discuss realistic pricing against comparable listings in your sector, and explain how we would market it.",
        },
        {
          title: "Prepare and list",
          body: "Photographs, a written description and the specification details buyers ask for, published to the Gurgaon catalogue and shared with matched buyers.",
        },
        {
          title: "Viewings and offers",
          body: "We handle enquiries and accompany viewings, pass on offers, and stay with you through negotiation to closure.",
        },
      ]}
      checklist={[
        "Sector or society name and the unit's configuration",
        "Approximate carpet or super built-up area, and which basis it is",
        "Year of possession, and whether the property is currently occupied",
        "Whether it is a freehold or leasehold title",
        "Any existing home loan or encumbrance on the property",
        "The RERA registration number, if the project has one",
      ]}
      terms={[
        { label: "What it costs", keyName: "seller.feeAmount" },
        { label: "Who pays the fee, and when", keyName: "seller.feePayer" },
        { label: "Mandate and exclusivity", keyName: "seller.mandate" },
        { label: "Withdrawing your listing", keyName: "seller.withdrawal" },
        { label: "What we verify before listing", keyName: "seller.verification" },
        { label: "How long it usually takes", keyName: "seller.timeline" },
      ]}
      faqs={[
        {
          q: "What is my Gurgaon property worth?",
          a: "There is no honest answer to that without looking at the specific unit. What an advisor can do is show you what comparable listings in your sector and society are currently asking, and where your property sits against them. Bear in mind that asking prices and transacted prices are not the same thing.",
        },
        {
          q: "Do I need to be in Gurgaon to sell through HomzRealtor?",
          a: "No. Plenty of owners are not resident in the city. Viewings can be handled on your behalf; you will need to be reachable for decisions, and present or represented for the paperwork.",
        },
        {
          q: "What documents will I eventually need?",
          a: "Typically the sale deed or allotment letter, possession certificate, latest maintenance and utility receipts, and a no-objection certificate from the society or builder where applicable. An advisor will confirm exactly what applies to your property. Do not send any of these through the form on this page.",
        },
        {
          q: "Can I list with HomzRealtor and with other agents at the same time?",
          a: "Yes. We work on an open mandate, not an exclusive one, so you are free to list with other agents and to sell privately while we are marketing the property. There is no minimum listing period. Our brokerage is payable only if the buyer who completes was introduced by us.",
        },
        {
          q: "What if I change my mind and want to take the property off the market?",
          a: "Tell your advisor, or put it in writing, and we stop. There is no notice period and nothing is payable. The one exception is a buyer we introduced to you: if that sale completes within six months of you withdrawing, the brokerage is still payable on it.",
        },
        {
          q: "What does it cost to sell through HomzRealtor?",
          a: "Our brokerage is 1% of the transaction value from the seller and 1% from the buyer, plus GST at the applicable rate, payable when the sale completes. Nothing is payable for the valuation conversation, the listing, the photographs or the viewings.",
        },
        {
          q: "Will HomzRealtor verify my property's title?",
          a: "No, and be wary of any agent that says otherwise. We surface the project's RERA status and the project-level facts we hold, and we will flag anything that looks inconsistent. Title due diligence is a job for your own lawyer, and for your buyer's, and it is worth doing properly.",
        },
      ]}
      formHeading="Talk to us about selling"
      form={
        <SellPropertyForm
          interest="Sell your property"
          source="sell-property-in-gurgaon"
          idPrefix="sell"
          messageLabel="Tell us about your property (optional)"
          messagePlaceholder="Type, size, expected price, or anything else useful"
        />
      }
    />
  );
}
