import type { Metadata } from "next";
import Link from "next/link";

const title = "HomzRealtor Developers — Public API";
const description =
  "HomzRealtor's public, unauthenticated API for Gurgaon property listings and status tracking — OpenAPI spec, endpoints, and usage.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/developers" },
  openGraph: { title, description },
};

const codeCls =
  "block overflow-x-auto rounded-lg border border-white/10 bg-[#141416] px-4 py-3 text-[13px] text-gray-300";

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
          For developers &amp; agents
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          HomzRealtor API
        </h1>
        <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-gray-400">
          HomzRealtor publishes two read-only, unauthenticated JSON endpoints —
          the same ones its own listing pages call. Full machine-readable spec:{" "}
          <Link href="/openapi.json" className="text-[#D9B268] underline">
            /openapi.json
          </Link>
          . Agent guidance and when-to-use notes:{" "}
          <Link href="/llms.txt" className="text-[#D9B268] underline">
            /llms.txt
          </Link>
          .
        </p>

        <h2 className="mb-3 text-xl font-bold text-white">
          GET /api/listings
        </h2>
        <p className="mb-3 text-[14px] text-gray-400">
          Paginated, filterable individual property listings (sale, rent, PG,
          commercial) for Gurgaon.
        </p>
        <code className={`${codeCls} mb-8`}>
          GET https://www.homzrealtor.com/api/listings?segment=ggnSaleProperties&amp;category=Sale&amp;bedrooms=3&amp;budget=1cr-2cr&amp;page=1&amp;limit=8
        </code>

        <h2 className="mb-3 text-xl font-bold text-white">
          GET /api/status/&#123;city&#125;/&#123;slug&#125;
        </h2>
        <p className="mb-3 text-[14px] text-gray-400">
          Current status and change history for one tracked property —
          check whether a listing is still live before re-fetching it.
        </p>
        <code className={`${codeCls} mb-8`}>
          GET https://www.homzrealtor.com/api/status/gurgaon/reach-buzz-114
        </code>

        <h2 className="mb-3 text-xl font-bold text-white">Scope</h2>
        <p className="text-[14px] leading-relaxed text-gray-400">
          These two endpoints are the whole public surface. Everything else
          under <code className="text-gray-300">/api/*</code> (accounts,
          agent property management, admin review) requires an authenticated
          session and isn&apos;t intended for third-party integration.
          Rate limits aren&apos;t currently enforced beyond response caching —
          treat this as a best-effort feed, not an SLA-backed API.
        </p>
      </div>
    </div>
  );
}
