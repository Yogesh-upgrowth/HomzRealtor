import Link from "next/link";
import type { DeveloperProfileFacts } from "@/lib/content/developerProfiles";
import { independenceNote } from "@/lib/content/developerProfiles";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";

// The "About {Developer}" entity block and the independence disclosure
// (2026-09-22).
//
// Two things that belong together, because they answer the two questions a
// visitor arriving from a brand search actually has: who is this company, and
// is this their website.
//
// The About section renders only when we hold VERIFIED facts for the developer
// (lib/content/developerProfiles.ts). No facts, no section — never a generated
// paragraph of plausible corporate history. A developer hub with a data-rich
// portfolio and no About block is honest; one with an invented founding story
// is the thing we have spent this whole project removing.
//
// The independence note renders for EVERY developer, verified or not, and does
// not depend on the registry. It is the more important of the two: a page
// titled "DLF Projects in Gurgaon" on homzrealtor.com should say what it is
// before the reader has to work it out.

type Props = {
  developerName: string;
  facts: DeveloperProfileFacts | null;
  /** "About {Developer}" paragraphs from lib/intelligence/developerPage.ts
   *  (verified facts + catalogue footprint). When given, they replace the
   *  facts' own summary lines and the section renders even without a
   *  verified record — the footprint is our data and needs no verification. */
  about?: string[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DeveloperEntity({ developerName, facts, about }: Props) {
  const paragraphs = about && about.length > 0 ? about : facts?.summary ?? [];
  return (
    <div className="w-full max-w-7xl mx-auto px-4 mt-12">
      {!facts && paragraphs.length > 0 && (
        <section aria-labelledby="dev-about" className="mb-6">
          <h2 id="dev-about" className="mb-4 text-2xl font-bold text-white">
            About {developerName}
          </h2>
          <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5">
            {paragraphs.map((line) => (
              <p key={line} className="text-[15px] leading-relaxed text-gray-300">
                {line}
              </p>
            ))}
          </div>
        </section>
      )}
      {facts && (
        <section aria-labelledby="dev-about" className="mb-6">
          <h2 id="dev-about" className="mb-4 text-2xl font-bold text-white">
            About {facts.officialName}
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5">
            <div className="space-y-3">
              {paragraphs.map((line) => (
                <p key={line} className="text-[15px] leading-relaxed text-gray-300">
                  {line}
                </p>
              ))}
            </div>

            <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {facts.foundedYear && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Founded</dt>
                  <dd className="mt-0.5 text-[14.5px] text-gray-300">{facts.foundedYear}</dd>
                </div>
              )}
              {facts.founder && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Founder</dt>
                  <dd className="mt-0.5 text-[14.5px] text-gray-300">{facts.founder}</dd>
                </div>
              )}
              {facts.headquarters && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Headquarters
                  </dt>
                  <dd className="mt-0.5 text-[14.5px] text-gray-300">{facts.headquarters}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Official website
                </dt>
                <dd className="mt-0.5 text-[14.5px]">
                  <a
                    href={facts.officialWebsite}
                    rel="noopener noreferrer nofollow"
                    target="_blank"
                    className="text-[#D9B268] hover:underline"
                  >
                    {facts.officialWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </dd>
              </div>
            </dl>

            <p className="mt-5 text-[12.5px] leading-relaxed text-gray-500">
              These details are recorded from{" "}
              <a
                href={facts.sourceUrl}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="text-gray-400 underline hover:text-[#D9B268]"
              >
                the developer&apos;s own site
              </a>
              , last checked{" "}
              <time dateTime={facts.lastVerifiedAt}>{formatDate(facts.lastVerifiedAt)}</time>. Everything
              else on this page is computed from our own catalogue.
            </p>
          </div>
        </section>
      )}

      {/* Developer-page brief §1.8: how a buyer checks a project for
          themselves. Generic, procedural, and true for every developer. */}
      <section aria-labelledby="dev-verify" className="mb-6 rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-5">
        <h2 id="dev-verify" className="text-[15px] font-bold text-white">
          How to verify a {developerName} project
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-gray-400">
          <li>
            Open the{" "}
            <a
              href="https://haryanarera.gov.in/"
              rel="noopener noreferrer"
              target="_blank"
              className="text-[#D9B268] hover:underline"
            >
              HARERA portal
            </a>{" "}
            and go to the list of registered projects for Gurugram.
          </li>
          <li>Search by the project name, or by the promoter&apos;s company name.</li>
          <li>
            Match the registration number, its validity date and the promoter&apos;s name to {developerName}.
            A registration issued to a different company is a warning sign.
          </li>
          <li>
            Confirm the project on {facts ? "the developer's official website" : `${developerName}'s own website`} before
            paying any booking amount.
          </li>
        </ol>
      </section>

      <section
        aria-labelledby="dev-independence"
        className="rounded-2xl border border-[#B77D2B]/30 bg-[#111113] px-6 py-5"
      >
        <h2 id="dev-independence" className="text-[15px] font-bold text-white">
          This is not {developerName}&apos;s official website
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-gray-400">
          {independenceNote(developerName, facts?.officialWebsite)}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
          {COMPANY_INFO.legalStructure} HARERA agent registration{" "}
          {COMPANY_INFO.hararaAgentNumber}
          {COMPANY_INFO.hareraHolder ? `, registered to ${COMPANY_INFO.hareraHolder}` : ""}.{" "}
          <Link href="/about-us#credentials" className="text-[#D9B268] hover:underline">
            Our registration details
          </Link>
        </p>
      </section>
    </div>
  );
}
