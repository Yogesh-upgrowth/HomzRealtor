import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_FAQ_GROUPS, SITE_FAQS } from "@/lib/content/siteFaqs";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";

// SEO audit M-08 (2026-09-08): a FAQPage schema already existed on the
// homepage (built from the same five questions this page rendered), but /faq
// itself 404'd. It was given a page — which then repeated those five and
// nothing more.
//
// Audit item 11 (2026-09-19): "/faq repeats the homepage's 5 FAQs. Expand to
// 25 to 30 grouped questions or remove." This renders the full grouped set
// from lib/content/siteFaqs.ts; the homepage now selects its five from that
// same source, so the page is a superset rather than a duplicate.
const SITE = "https://www.homzrealtor.com";
const PAGE_URL = `${SITE}/faq`;

const DESCRIPTION =
  "Answers about buying, renting and letting property in Gurgaon through HomzRealtor: how our listings are built, what our RERA registration covers, what to check before paying a booking amount, fees, and how site visits work.";

export const metadata: Metadata = {
  title: "Property FAQs for Gurgaon Buyers, Tenants and Owners | HomzRealtor",
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Property FAQs for Gurgaon Buyers, Tenants and Owners",
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

// Stable, readable fragment ids so a specific question can be linked to
// directly — both for our own internal links and for the jump list below.
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const FaqPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "FAQs", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        url: PAGE_URL,
        mainEntity: SITE_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="bg-[#0B0B0C] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <div className="w-full max-w-4xl mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-24">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">FAQs</span>
        </nav>

        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
          Questions, answered
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Property FAQs for Gurgaon buyers, tenants and owners
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-400">
          {SITE_FAQS.length} questions about how HomzRealtor works, where our
          listings come from and what to check before you commit money. Where an
          answer depends on a figure set by someone else — a tax rate, a
          registration status — we point you at the official source instead of
          quoting a number that may have moved.
        </p>

        {/* Jump list: at this length the page needs a way in, and it gives the
            group headings real internal links. */}
        <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
          {SITE_FAQ_GROUPS.map((g) => (
            <a
              key={g.heading}
              href={`#${slug(g.heading)}`}
              className="rounded-full border border-white/[0.1] bg-[#141416] px-3.5 py-1.5 text-[13px] text-gray-300 transition-colors hover:border-[#D9B268]/50 hover:text-[#D9B268]"
            >
              {g.heading}
            </a>
          ))}
        </nav>

        {SITE_FAQ_GROUPS.map((group) => (
          <section key={group.heading} id={slug(group.heading)} className="mt-12 scroll-mt-28">
            <h2 className="mb-5 text-[clamp(20px,2.6vw,26px)] font-bold tracking-tight text-white">
              {group.heading}
            </h2>
            <div className="flex flex-col gap-3">
              {group.items.map((item) => (
                <details
                  key={item.q}
                  id={slug(item.q)}
                  className="group scroll-mt-28 rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white">
                    <h3 className="text-inherit font-medium">{item.q}</h3>
                    <span className="shrink-0 text-xl text-[#D9B268] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-gray-400">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-14 rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-7">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Still need an answer?
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-gray-400">
            Call an advisor on{" "}
            <a href={`tel:${COMPANY_INFO.phone}`} className="text-[#D9B268] hover:underline">
              {COMPANY_INFO.phoneDisplay}
            </a>{" "}
            — {COMPANY_INFO.hours.toLowerCase()} — or{" "}
            <Link href="/contact" className="text-[#D9B268] hover:underline">
              send us the question
            </Link>
            . If it is about a specific property, quoting the HomzRealtor
            reference from that page gets you a straight answer fastest.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 text-[13.5px]">
            <Link href="/buy-property" className="rounded-full bg-[#D9B268] px-4 py-2 font-medium text-[#0B0B0C] hover:opacity-90">
              Browse properties for sale
            </Link>
            <Link href="/rent-property" className="rounded-full border border-white/[0.12] px-4 py-2 text-gray-200 hover:border-[#D9B268]/50 hover:text-[#D9B268]">
              Browse rentals
            </Link>
            <Link href="/project-listing" className="rounded-full border border-white/[0.12] px-4 py-2 text-gray-200 hover:border-[#D9B268]/50 hover:text-[#D9B268]">
              Browse projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
