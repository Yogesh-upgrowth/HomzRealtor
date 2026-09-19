import type { Metadata } from "next";
import SellPropertyForm from "@/components/Home/SellPropertyForm";
import ServicePage from "@/components/Services/ServicePage";
import { allResolved, LANDLORD_TERM_KEYS } from "@/lib/content/ownerPending";

const title = "Rent Out Your Property in Gurgaon | HomzRealtor";
const description =
  "Let your Gurgaon flat, floor or villa through HomzRealtor: how the process works, what to have ready, and what it costs. Speak to an advisor about letting.";

// R19-08 (2026-09-19): the landlord journey did not exist at all -- the
// recheck's point that "selling and letting are still not equal to buying"
// was most obvious here, since /rent-out-property-in-gurgaon simply 404'd.
// Same posture as the seller page, and the same 2026-09-19 sequence: the
// owner supplied the letting fee, then asked for the mandate and withdrawal
// terms to be written to best judgement. Both mirror the sale side -- open
// instruction, no notice, no cancellation fee, a six-month introduction
// period on a tenant we brought. Reasoning in lib/content/brokerageTerms.ts.
const PENDING_KEYS = LANDLORD_TERM_KEYS;

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
      intro="If you own a flat, builder floor or villa in Gurgaon and want to let it, an advisor will talk you through achievable rent for your sector, how we find tenants, and what the paperwork involves. We handle the letting end to end, rent agreement included. Our brokerage is half of one month\u2019s rent, payable once the agreement is signed. We do not ask for an exclusive instruction, and you can withdraw at any time."
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
          q: "Can I instruct other agents at the same time?",
          a: "Yes. We work on an open instruction, not an exclusive one, so you are free to instruct other agents and to let privately while we are marketing the property. There is no minimum instruction period. Our brokerage is payable only if the tenant who signs was introduced by us.",
        },
        {
          q: "What if I want to take the property off the market?",
          a: "Tell your advisor, or put it in writing, and we stop. There is no notice period and nothing is payable. The one exception is a tenant we introduced: if that tenancy is signed within six months of you withdrawing, the brokerage is still payable on it.",
        },
        {
          q: "What does it cost to let through HomzRealtor?",
          a: "Half of one month's rent from you and half from the tenant, payable once, when the tenancy agreement is signed. Nothing is payable for the rent conversation, the listing, the photographs or the viewings.",
        },
        {
          q: "Do you screen tenants?",
          a: "We find and select the tenant and handle the letting end to end. The specific checks run on a given tenancy are agreed with you rather than fixed here, so ask your advisor what will be done on your property before you rely on it.",
        },
        {
          q: "Who handles the rent agreement?",
          a: "We do, as part of the letting. A rent agreement in Haryana should be stamped and, above the applicable duration, registered; those government charges are set by the state and payable separately. Take your own legal advice on your specific agreement.",
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
