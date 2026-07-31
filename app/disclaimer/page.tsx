import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Important disclaimers about project information, pricing, RERA status and imagery shown on HomzRealtor.",
  alternates: { canonical: "/disclaimer" },
  robots: { index: true, follow: true },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="mb-3 text-xl font-bold text-white">{title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-gray-400">{children}</div>
  </section>
);

const DisclaimerPage = () => {
  return (
    <div className="bg-[#0B0B0C] text-white">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">Legal</p>
        <h1 className="mb-3 text-[clamp(28px,4vw,42px)] font-bold tracking-tight text-white">
          Disclaimer
        </h1>
        <p className="mb-10 text-sm text-gray-500">Last updated: July 2026</p>

        <Section title="Project information">
          <p>
            Prices, floor plans, possession dates, amenities, specifications and other project
            details displayed on this site are indicative, sourced from developers and public
            project listings, and are subject to change by the developer at any time without
            notice. They do not constitute an offer or a legally binding representation. Please
            confirm current details directly with the developer before making any decision.
          </p>
        </Section>

        <Section title="RERA registration">
          <p>
            Where a RERA registration number is shown, it is provided as available at the time of
            listing. Buyers must independently verify a project&apos;s current RERA status on the
            official portal of the state RERA authority where the project is located before
            proceeding with any transaction.
          </p>
        </Section>

        <Section title="Images and renders">
          <p>
            Project images, including exterior and interior visuals, master plans and floor
            plans, may include artist&apos;s impressions, computer-generated renders, or images
            of a show unit/sample flat, and may not represent the actual, final product. Actual
            unit finishes, dimensions and views may vary.
          </p>
        </Section>

        <Section title="Investment and pricing tools">
          <p>
            The Investment Score, price-trend projections, EMI calculator and rental-yield
            calculator on project pages are illustrative tools based on stated assumptions. They
            are not financial advice, valuations, or guarantees of future price movement, rental
            yield, or investment return.
          </p>
        </Section>

        <Section title="No developer affiliation implied">
          <p>
            Unless a project page explicitly states HomzRealtor as an authorised channel partner
            for that developer, mention of any developer or project name does not imply
            endorsement, partnership, or affiliation beyond that of an information listing.
          </p>
        </Section>
      </div>
    </div>
  );
};

export default DisclaimerPage;
