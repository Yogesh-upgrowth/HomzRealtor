import type { ReactNode } from "react";
import OwnerPending from "./OwnerPending";
import type { OwnerPendingKey } from "@/lib/content/ownerPending";

// R19-08 (2026-09-19): one layout for both owner-side journeys (selling and
// letting), so the two pages cannot drift the way the four lead forms did.
//
// The section set is modelled on how the pages that currently rank for these
// queries are organised -- what the service is, how it works step by step,
// what the owner has to provide, what it costs, how long it takes, then the
// questions people actually ask. That structure is a legitimate thing to
// learn from a competitor. The *content* of the commercial sections is not:
// fees, mandates and withdrawal terms come from OWNER_PENDING or they do not
// appear at all.

export type Step = { title: string; body: string };
export type Faq = { q: string; a: ReactNode };

export type ServicePageProps = {
  eyebrow: string;
  h1: string;
  intro: string;
  /** The honest status line shown while the page is unpublished. */
  steps: Step[];
  /** What the owner needs to have ready. Plain facts, no policy claims. */
  checklist: string[];
  /** Commercial terms — each one an OWNER_PENDING key. */
  terms: { label: string; keyName: OwnerPendingKey }[];
  faqs: Faq[];
  /** The lead form for this journey. */
  form: ReactNode;
  formHeading: string;
};

export default function ServicePage({
  eyebrow,
  h1,
  intro,
  steps,
  checklist,
  terms,
  faqs,
  form,
  formHeading,
}: ServicePageProps) {
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="mx-auto max-w-5xl px-4 pt-32 pb-20">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
          {eyebrow}
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">{h1}</h1>
        <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-gray-400">{intro}</p>

        <section className="mb-14" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="mb-5 text-xl font-bold text-white md:text-2xl">
            How it works
          </h2>
          <ol className="grid gap-4 md:grid-cols-2">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5"
              >
                <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D9B268]/30 bg-[#D9B268]/10 text-[12px] font-bold text-[#D9B268]">
                  {i + 1}
                </span>
                <p className="mb-1.5 text-[15.5px] font-bold text-white">{step.title}</p>
                <p className="text-[13.5px] leading-relaxed text-gray-400">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-14" aria-labelledby="what-you-need">
          <h2 id="what-you-need" className="mb-5 text-xl font-bold text-white md:text-2xl">
            What to have ready
          </h2>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[14px] leading-relaxed text-gray-300"
              >
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9B268]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-gray-500">
            Do not send identity documents, title deeds or bank details through the form
            below. An advisor will tell you what is needed and how to share it securely.
          </p>
        </section>

        <section className="mb-14" aria-labelledby="terms">
          <h2 id="terms" className="mb-5 text-xl font-bold text-white md:text-2xl">
            Fees and terms
          </h2>
          <dl className="space-y-4">
            {terms.map((term) => (
              <div
                key={term.keyName}
                className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5"
              >
                <dt className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gray-400">
                  {term.label}
                </dt>
                <dd className="text-[14.5px] leading-relaxed text-gray-300">
                  <OwnerPending keyName={term.keyName} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-14" aria-labelledby="faqs">
          <h2 id="faqs" className="mb-5 text-xl font-bold text-white md:text-2xl">
            Common questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5"
              >
                <summary className="cursor-pointer text-[15px] font-semibold text-white">
                  {faq.q}
                </summary>
                <div className="mt-3 text-[14px] leading-relaxed text-gray-400">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="enquire">
          <h2 id="enquire" className="mb-5 text-xl font-bold text-white md:text-2xl">
            {formHeading}
          </h2>
          <div className="max-w-xl">{form}</div>
        </section>
      </div>
    </main>
  );
}
