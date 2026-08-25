import type { Metadata } from "next";
import Link from "next/link";

const title = "Privacy Policy";
const description =
  "How HomzRealtor collects, uses and protects the personal information you share through enquiry forms and site usage.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
  openGraph: { title, description },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="mb-3 text-xl font-bold text-white">{title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-gray-400">{children}</div>
  </section>
);

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-[#0B0B0C] text-white">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">Legal</p>
        <h1 className="mb-3 text-[clamp(28px,4vw,42px)] font-bold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-gray-500">Last updated: July 2026</p>

        <Section title="1. What we collect">
          <p>
            When you submit an enquiry, request a callback, or contact us through this website
            (including via WhatsApp), we collect the information you provide — typically your
            name, phone number, email address, and details of the property you are enquiring
            about. We also collect standard usage data (pages visited, device/browser type,
            approximate location) through analytics tools.
          </p>
        </Section>

        <Section title="2. How we use it">
          <p>
            We use this information to respond to your enquiry, share relevant property
            information, and — where you have consented — to follow up by phone, email or
            WhatsApp. We do not sell your personal information to third parties.
          </p>
        </Section>

        <Section title="3. Sharing with developers and partners">
          <p>
            As a channel partner, we may share your enquiry details with the specific
            developer(s) whose project you enquired about, so they or their sales team can
            assist you directly. We do not share your information with unrelated third parties
            for marketing purposes.
          </p>
        </Section>

        <Section title="4. Cookies and analytics">
          <p>
            This site uses cookies and analytics tools (such as Google Analytics) to understand
            how visitors use the site and to improve it. You can control or disable cookies
            through your browser settings.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p>
            We retain enquiry information for as long as reasonably necessary to assist you with
            your property search, and to comply with applicable legal or regulatory
            requirements.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            You may request access to, correction of, or deletion of your personal information
            at any time by contacting us using the details on our{" "}
            <Link href="/contact" className="text-[#D9B268] underline underline-offset-2">
              contact page
            </Link>
            .
          </p>
        </Section>

        <Section title="7. Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes will be reflected on
            this page with an updated revision date.
          </p>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
