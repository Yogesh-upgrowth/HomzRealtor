import type { Metadata } from "next";
import SellPropertyForm from "@/components/Home/SellPropertyForm";
import ServicePage from "@/components/Services/ServicePage";
import { allResolved, type OwnerPendingKey } from "@/lib/content/ownerPending";

const title = "Rent Out Your Property in Gurgaon | HomzRealtor";
const description =
  "Let your Gurgaon flat, floor or villa through HomzRealtor: how the process works, what to have ready, and what it costs. Speak to an advisor about letting.";

// R19-08 (2026-09-19): the landlord journey did not exist at all -- the
// recheck's point that "selling and letting are still not equal to buying"
// was most obvious here, since /rent-out-property-in-gurgaon simply 404'd.
// Same posture as the seller page: full structure, real process copy, every
// commercial term deferred to OWNER_PENDING, and noindex until none of them
// is still a placeholder. See app/sell-property-in-gurgaon/page.tsx.
const PENDING_KEYS: OwnerPendingKey[] = [
  "landlord.feeAmount",
  "landlord.feePayer",
  "landlord.mandate",
  "landlord.withdrawal",
  "landlord.tenantScreening",
  "landlord.agreementSupport",
];

const READY_TO_INDEX = allResolved(PENDING_KEYS);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/rent-out-property-in-gurgaon" },
  robots: READY_TO_INDEX ? undefined : { index: false, follow: true },
};

export default function RentOutPropertyPage() {
  return (
    <ServicePage
      eyebrow="For landlords"
      h1="Rent Out Your Property in Gurgaon"
      intro="If you own a flat, builder floor or villa in Gurgaon and want to let it, an advisor can talk you through achievable rent for your sector, how we find and screen tenants, and what the paperwork involves. Our full letting terms are being finalised, so the fee and mandate details below are not published yet, and nothing on this page is an offer."
      steps={[
        {
          title: "Tell us about the property",
          body: "Sector or society, configuration, furnishing level, and when it is available. A few lines is enough to start.",
        },
        {
          title: "Agree an asking rent",
          body: "We come back to you with what comparable units in your society and sector are currently listed at, and what that means for your expectations on rent and deposit.",
        },
        {
          title: "List and find tenants",
          body: "Photographs, a written description and the details tenants actually ask about, published to the Gurgaon rental catalogue and shared with matched tenants.",
        },
        {
          title: "Viewings, screening and agreement",
          body: "We accompany viewings, put forward tenants, and stay with you through the rent agreement and handover.",
        },
      ]}
      checklist={[
        "Sector or society name and the unit's configuration",
        "Furnishing level: unfurnished, semi-furnished or fully furnished",
        "The date the property is actually available from",
        "Expected monthly rent, and the deposit you have in mind",
        "Whether maintenance is included in the rent or billed separately",
        "Any society restrictions on tenants, pets or usage",
      ]}
      terms={[
        { label: "What it costs", keyName: "landlord.feeAmount" },
        { label: "Who pays the fee, and when", keyName: "landlord.feePayer" },
        { label: "Mandate and exclusivity", keyName: "landlord.mandate" },
        { label: "Withdrawing your instruction", keyName: "landlord.withdrawal" },
        { label: "Tenant screening", keyName: "landlord.tenantScreening" },
        { label: "Rent agreement and registration", keyName: "landlord.agreementSupport" },
      ]}
      faqs={[
        {
          q: "What rent can I expect for my Gurgaon property?",
          a: "It depends on the society, the floor, the furnishing and how the unit compares to what is currently available nearby. An advisor can show you what comparable units in your sector are listed at. Listed rent and agreed rent are not always the same.",
        },
        {
          q: "How long does it usually take to find a tenant?",
          a: "It varies with the sector, the asking rent and the time of year. An advisor will give you a realistic view for your specific property rather than a headline number.",
        },
        {
          q: "Do you screen tenants?",
          a: "What screening we carry out, and what remains your responsibility as the landlord, is set out in the fees and terms section above and is not yet published.",
        },
        {
          q: "Who handles the rent agreement?",
          a: "See the fees and terms section above. Whatever the arrangement, a rent agreement in Haryana should be stamped and, above the applicable duration, registered. Take your own legal advice on your specific agreement.",
        },
        {
          q: "Can I let the property while I am abroad?",
          a: "Yes, many owners do. Viewings can be handled on your behalf. You will need to be reachable for decisions, and to arrange how the agreement is signed, which may need a representative or a power of attorney.",
        },
      ]}
      formHeading="Talk to us about letting"
      form={
        <SellPropertyForm
          interest="Rent out your property"
          source="rent-out-property-in-gurgaon"
          idPrefix="let"
          messageLabel="Tell us about your property (optional)"
          messagePlaceholder="Configuration, furnishing, expected rent, available from"
        />
      }
    />
  );
}
