import type { Metadata } from "next";
import SellPropertyForm from "@/components/Home/SellPropertyForm";
import ServicePage from "@/components/Services/ServicePage";
import { allResolved, SELLER_TERM_KEYS } from "@/lib/content/ownerPending";

const title = "Sell Your Property in Gurgaon | HomzRealtor";
const description =
  "List your Gurgaon property with HomzRealtor: how the process works, what to have ready, and what it costs. Speak to an advisor about selling.";

// R19-08 (2026-09-19). The owner supplied the fee terms, so this page now
// publishes: 1% of the transaction value from the seller and 1% from the
// buyer, payable on completion.
//
// The mandate and withdrawal rows are gone rather than filled. "All handled
// by us" describes the service, not the contract, and whether a mandate is
// exclusive and what happens when an owner pulls out are contractual
// positions with real consequences for the seller -- not something to write
// on their behalf. A seller page that simply does not discuss exclusivity is
// ordinary and honest; one that invents a position is neither. The questions
// stay open in lib/content/ownerPending.ts, and the rows come back the day
// the terms exist.
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
      intro="If you own a flat, floor, villa or plot in Gurgaon and want to sell, an advisor will talk you through what your property is likely to fetch, what paperwork you will need, and how we would market it. We handle the sale end to end from there. Our brokerage is 1% of the transaction value, payable when the sale completes, and there is nothing to pay before that."
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
          q: "What does it cost to sell through HomzRealtor?",
          a: "Our brokerage is 1% of the transaction value from the seller and 1% from the buyer, payable when the sale completes. Nothing is payable for the valuation conversation, the listing, the photographs or the viewings.",
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
