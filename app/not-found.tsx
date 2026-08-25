import type { Metadata } from "next";
import Link from "next/link";

// No metadata export here previously meant this page fell back to the root
// layout's default title ("HomzRealtor — Residential & Commercial Property
// in Gurgaon") — every 404 claimed to be the homepage. noindex is also
// correct here regardless: a 404 should never be indexed.
export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

// Rendered for any unmatched route, and by any page that calls notFound()
// (e.g. an unknown project/property slug) — Next.js serves this with a real
// HTTP 404 status either way, so this is the one place to get that right
// sitewide instead of pages quietly returning 200 with "not found" text.
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#0B0B0C] px-4 text-center text-white">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        404 error
      </p>
      <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mb-8 max-w-md text-gray-400">
        The page or listing you&apos;re looking for may have been removed, renamed, or never existed.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-3 text-sm font-bold text-[#1c1608] hover:brightness-105 transition"
        >
          Back to Home
        </Link>
        <Link
          href="/project-listing"
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:border-[#D9B268] transition-colors"
        >
          Browse All Projects
        </Link>
        <Link
          href="/project-listing/gurgaon/sectors"
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:border-[#D9B268] transition-colors"
        >
          Browse by Sector
        </Link>
      </div>

      {/* Plain-text recovery links for crawlers/agents, not just human CTAs. */}
      <p className="mt-8 text-xs text-gray-500">
        Looking for something specific?{" "}
        <Link href="/sitemap.xml" className="underline hover:text-[#D9B268]">
          Sitemap
        </Link>{" "}
        ·{" "}
        <Link href="/llms.txt" className="underline hover:text-[#D9B268]">
          llms.txt
        </Link>
      </p>
    </div>
  );
}
