import type { Metadata } from "next";

const title = "Terms of Use";
const description =
  "The terms governing your use of the HomzRealtor website and the property information listed on it.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
  openGraph: { title, description },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="mb-3 text-xl font-bold text-white">{title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-gray-400">{children}</div>
  </section>
);

const TermsPage = () => {
  return (
    <div className="bg-[#0B0B0C] text-white">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">Legal</p>
        <h1 className="mb-3 text-[clamp(28px,4vw,42px)] font-bold tracking-tight text-white">
          Terms of Use
        </h1>
        <p className="mb-10 text-sm text-gray-500">Last updated: July 2026</p>

        <Section title="1. Who we are">
          <p>
            HomzRealtor is a real estate advisory and channel-partner platform. We help buyers
            and investors discover residential and commercial projects, and connect them with
            the relevant developers. We are not the developer, builder, or seller of any project
            listed on this site unless explicitly stated.
          </p>
        </Section>

        <Section title="2. Nature of the information provided">
          <p>
            Project details — including price, availability, possession timelines, floor plans,
            amenities and images — are provided for general informational purposes and are
            subject to change without notice. This information should always be independently
            verified with the developer and the relevant state RERA authority before making any
            purchase decision.
          </p>
        </Section>

        <Section title="3. No warranty">
          <p>
            While we make reasonable efforts to keep information accurate and current, we make
            no representation or warranty as to its completeness, accuracy, or timeliness. Use of
            this site and reliance on any information on it is at your own discretion and risk.
          </p>
        </Section>

        <Section title="4. Calculators and projections">
          <p>
            Tools on this site — including EMI calculators, rental-yield estimates, and
            illustrative price-projection charts — are for general guidance only. They rely on
            assumptions and inputs you or we provide and are not financial advice, a guarantee of
            returns, or a substitute for independent financial or legal counsel.
          </p>
        </Section>

        <Section title="5. Third-party links and content">
          <p>
            This site may reference or link to third-party sources, developer websites, or
            government portals (such as RERA regulator websites) for verification purposes. We
            are not responsible for the content or availability of external sites.
          </p>
        </Section>

        <Section title="6. Limitation of liability">
          <p>
            To the maximum extent permitted by law, HomzRealtor shall not be liable for any
            direct or indirect loss arising from your use of, or reliance on, this website or the
            information it contains.
          </p>
        </Section>

        <Section title="7. Governing law">
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the
            jurisdiction of the courts of Gurgaon, Haryana.
          </p>
        </Section>
      </div>
    </div>
  );
};

export default TermsPage;
