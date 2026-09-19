import Link from "next/link";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";
import { BROKERAGE_TERMS } from "@/lib/content/brokerageTerms";
import { CHANNEL_PARTNER_STATEMENT } from "@/lib/content/channelPartners";

// The checkable facts about this business, in one place (2026-09-19).
//
// The 19 Sep audit scored trust and local 15/100, and the reason was not that
// the facts were wrong -- it was that nothing on the site stated who the
// operator is, what it is registered as, where it works from, or what it
// charges. Every value below comes from lib/seo/companyInfo.ts, verified
// against the GST and HARERA certificates, or from
// lib/content/brokerageTerms.ts, and every one is rendered conditionally, so
// clearing a field removes the row rather than shipping a blank.
//
// Both registration numbers print the holder's name. They belong to the
// proprietor, not to a company, and anyone who checks either number sees that
// name on the portal -- stating it is the difference between inviting a check
// and failing one.

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/[0.07] py-4 sm:grid sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6">
      <dt className="text-[13px] font-bold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-[15px] leading-relaxed text-gray-300 sm:mt-0">{children}</dd>
    </div>
  );
}

export default function Credentials() {
  return (
    <section
      id="credentials"
      aria-labelledby="credentials-heading"
      className="mx-auto w-full max-w-[1444px] px-4 scroll-mt-24"
    >
      <h2
        id="credentials-heading"
        className="mb-2 text-[clamp(24px,3.2vw,34px)] font-bold tracking-tight text-white"
      >
        Who you are actually dealing with
      </h2>
      <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-gray-400">
        Property is a high-stakes purchase and you are entitled to check who is
        advising you. Every number below can be verified on the issuing
        authority&rsquo;s own portal.
      </p>

      <dl className="border-b border-white/[0.07]">
        {COMPANY_INFO.legalStructure && (
          <Row label="Who we are">{COMPANY_INFO.legalStructure}</Row>
        )}

        {COMPANY_INFO.hararaAgentNumber && (
          <Row label="HARERA agent registration">
            {COMPANY_INFO.hararaAgentNumber}
            {COMPANY_INFO.hareraHolder ? `, registered to ${COMPANY_INFO.hareraHolder}` : ""}
            {COMPANY_INFO.hareraValidUntil
              ? `, valid to ${new Date(COMPANY_INFO.hareraValidUntil).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
            . Check it on the Haryana RERA portal at haryanarera.gov.in.
          </Row>
        )}

        {COMPANY_INFO.gstNumber && (
          <Row label="GST registration">
            {COMPANY_INFO.gstNumber}
            {COMPANY_INFO.gstHolder ? `, registered to ${COMPANY_INFO.gstHolder}` : ""}.
          </Row>
        )}

        {COMPANY_INFO.officeAddress && <Row label="Office">{COMPANY_INFO.officeAddress}</Row>}

        <Row label="Contact">
          <a href={`tel:${COMPANY_INFO.phone}`} className="text-[#D9B268] hover:underline">
            {COMPANY_INFO.phoneDisplay}
          </a>{" "}
          &middot;{" "}
          <a href={`mailto:${COMPANY_INFO.email}`} className="text-[#D9B268] hover:underline">
            {COMPANY_INFO.email}
          </a>
          {COMPANY_INFO.hours ? ` · ${COMPANY_INFO.hours}` : ""}
        </Row>

        <Row label="Where we work">
          Gurgaon only. Our catalogue spans the city&rsquo;s sectors and the main
          corridors — Dwarka Expressway, Golf Course Road, Golf Course Extension
          Road, Sohna Road, Southern Peripheral Road and New Gurgaon. We do not
          service other NCR cities.
        </Row>

        <Row label="Developer relationships">{CHANNEL_PARTNER_STATEMENT}</Row>

        <Row label="What we charge">
          {BROKERAGE_TERMS.viewingSummary} {BROKERAGE_TERMS.sale.summary}{" "}
          {BROKERAGE_TERMS.rent.summary}{" "}
          <Link href="/faq" className="text-[#D9B268] hover:underline">
            More in our FAQs
          </Link>
          .
        </Row>

        {COMPANY_INFO.team.length > 0 && (
          <Row label="Advisors">
            {COMPANY_INFO.team.map((m) => `${m.name}, ${m.role}`).join(" · ")}
          </Row>
        )}
      </dl>
    </section>
  );
}
