import type { Metadata } from "next";
import SellPropertyForm from "@/components/Home/SellPropertyForm";
import ServicePage from "@/components/Services/ServicePage";
import { allResolved, type OwnerPendingKey } from "@/lib/content/ownerPending";

const title = "Sell Your Property in Gurgaon | HomzRealtor";
const description =
  "List your Gurgaon property with HomzRealtor: how the process works, what to have ready, and what it costs. Speak to an advisor about selling.";

// R19-08 (2026-09-19). DEV-07's blocker has not changed -- the real fee,
// mandate, withdrawal and verification terms are still owner-pending -- so
// this page stays noindex. What changed is that it is no longer a bare
// holding page: the structure, the process steps, the document checklist and
// the FAQ set are all in place and reviewable, with every commercial term
// rendered through OWNER_PENDING so nothing reads as a commitment Homz has
// not made. Publishing is then a content change, not a build.
//
// The gate below is deliberately derived rather than a hand-flipped flag: the
// page becomes indexable exactly when no placeholder is left on it, so it
// cannot be published while still showing "Owner input needed".
const PENDING_KEYS: OwnerPendingKey[] = [
  "seller.feeAmount",
  "seller.feePayer",
  "seller.mandate",
  "seller.withdrawal",
  "seller.verification",
  "seller.timeline",
];

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
      intro="If you own a flat, floor, villa or plot in Gurgaon and want to sell, an advisor can talk you through what your property is likely to fetch, what paperwork you will need, and how we would market it. Our full seller terms are being finalised, so the fee and mandate details below are not published yet, and nothing on this page is an offer."
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
          a: "That depends on the mandate terms, which are not published yet. See the fees and terms section above.",
        },
        {
          q: "Will HomzRealtor verify my property's title?",
          a: "What we check before listing is set out in the fees and terms section above, and is not yet published. Whatever the answer, a listing check is not a substitute for your own legal due diligence or your buyer's.",
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
