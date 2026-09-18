import type { Metadata } from "next";
import SellPropertyForm from "@/components/Home/SellPropertyForm";

const title = "Sell Your Property in Gurgaon | HomzRealtor";
const description =
  "Share your property details with HomzRealtor's team to sell your property in Gurgaon.";

// DEV-07/DEV-08 (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17): the real
// seller service/fee/verification rules are still owner-pending (DEV-07),
// so this page deliberately makes no claims about process, fees,
// exclusivity or verification -- noindex until that content exists and is
// approved, per that audit's own instruction not to publish guessed
// policy. `follow` so it doesn't block crawl of anything linked from it.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sell-property-in-gurgaon" },
  robots: { index: false, follow: true },
};

export default function SellPropertyPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="mx-auto max-w-5xl px-4 pt-32 pb-20">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
          For property owners
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Sell Your Property in Gurgaon
        </h1>
        <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-gray-400">
          We&apos;re still finalising our full seller process, fees and verification
          steps. Share a few details below and our team will get in touch to
          discuss your property and how we can help, no commitment required.
        </p>

        <div className="max-w-xl">
          <SellPropertyForm />
        </div>
      </div>
    </main>
  );
}
