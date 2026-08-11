import Link from "next/link";

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
    </div>
  );
}
