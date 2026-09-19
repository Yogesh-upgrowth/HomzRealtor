import Link from "next/link";
import type { ListingRecord } from "@/lib/intelligence/get-listing-record";
import { formatInr } from "@/lib/intelligence/normalize";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";

// The HomzRealtor half of a detail page (2026-09-19).
//
// Everything here is computed in lib/intelligence/listingContext.ts and
// lib/intelligence/listingNarrative.ts from Homz's own dataset. None of it
// exists on the source portal's posting, which is the entire point: a visitor
// (and a crawler) should be able to tell at a glance that this is Homz's
// record of the unit, not a copy of someone else's listing.

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-10">
      <h2 id={`${id}-h`} className="mb-4 text-xl font-bold text-white md:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function HomzRecordSections({ record }: { record: ListingRecord }) {
  const { context: ctx, verification: v } = record;

  const verifiedOn = formatDate(v.verifiedAt);
  const checkedOn = formatDate(v.lastCheckedAt);
  const since = formatDate(v.trackingSince);

  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      {/* Homz's own description, composed from structured fields. Replaces the
          source portal's prose entirely — see listingNarrative.ts. */}
      {record.narrative.length > 0 && (
        <Section id="about-this-unit" title="About this unit">
          <div className="space-y-3">
            {record.narrative.map((para, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-gray-300">
                {para}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* Price against the sector — computed across the live segment. */}
      {ctx.price && (
        <Section id="price-context" title="How this price compares">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Sector {ctx.price.sector.toUpperCase()} median
              </p>
              <p className="mt-1.5 text-2xl font-bold text-white">
                {formatInr(ctx.price.medianInr) ?? "—"}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                This unit vs median
              </p>
              <p
                className={`mt-1.5 text-2xl font-bold ${
                  ctx.price.deltaPct < 0 ? "text-[#7fd3a5]" : "text-[#f0967f]"
                }`}
              >
                {ctx.price.deltaPct > 0 ? "+" : ""}
                {ctx.price.deltaPct}%
              </p>
            </div>
            <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Comparables used
              </p>
              <p className="mt-1.5 text-2xl font-bold text-white">{ctx.price.sampleSize}</p>
              <p className="mt-1 text-[12px] text-gray-500">
                {ctx.price.bedroomMatched ? "same BHK, same sector" : "same sector"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] text-gray-500">
            Computed by HomzRealtor from listings we currently track in this sector, on
            the same sale-or-rent basis. Asking prices, not transacted prices.
          </p>
        </Section>
      )}

      {/* Real distances from the unit's sector centre. */}
      {ctx.anchors.length > 0 && (
        <Section id="connectivity" title="Distances from this sector">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {ctx.anchors.map((a) => (
              <li
                key={a.key}
                className="flex items-baseline justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#141416] px-4 py-3"
              >
                <span className="text-[14px] text-gray-300">{a.label}</span>
                <span className="text-[14px] font-semibold text-white">{a.km} km</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-gray-500">
            Straight-line distances measured from the sector centre, not driving time.
          </p>
        </Section>
      )}

      {(ctx.schools.length > 0 || ctx.hospitals.length > 0) && (
        <Section id="nearby" title="Schools and hospitals nearby">
          <div className="grid gap-4 sm:grid-cols-2">
            {ctx.schools.length > 0 && (
              <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
                <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gray-400">
                  Schools
                </p>
                <ul className="space-y-1.5">
                  {ctx.schools.map((s) => (
                    <li key={s.name} className="flex justify-between gap-3 text-[14px] text-gray-300">
                      <span>{s.name}</span>
                      <span className="shrink-0 text-gray-500">{s.distanceKm} km</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ctx.hospitals.length > 0 && (
              <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
                <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gray-400">
                  Hospitals
                </p>
                <ul className="space-y-1.5">
                  {ctx.hospitals.map((h) => (
                    <li key={h.name} className="flex justify-between gap-3 text-[14px] text-gray-300">
                      <span>{h.name}</span>
                      <span className="shrink-0 text-gray-500">{h.distanceKm} km</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Hard links out — every listing reaches its project and its sector hub,
          so nothing on this template is an orphan. */}
      {(ctx.project || ctx.sectorHref) && (
        <Section id="part-of" title="Part of">
          <div className="flex flex-wrap gap-3">
            {ctx.project && (
              <Link
                href={ctx.project.href}
                className="rounded-xl border border-[#D9B268]/30 bg-[#D9B268]/10 px-4 py-2.5 text-[14px] font-semibold text-[#D9B268] hover:border-[#D9B268]/60"
              >
                {ctx.project.name} project page →
              </Link>
            )}
            {ctx.sectorHref && ctx.sectorLabel && (
              <Link
                href={ctx.sectorHref}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-[14px] font-semibold text-gray-200 hover:border-white/35"
              >
                All projects in {ctx.sectorLabel} →
              </Link>
            )}
          </div>
        </Section>
      )}

      {/* Homz's own record: reference, how long tracked, verification state and
          the history the source portal does not publish. */}
      <Section id="homz-record" title="HomzRealtor record">
        <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Reference
              </dt>
              <dd className="mt-1 font-mono text-[15px] text-white">{record.listingId}</dd>
            </div>
            {since && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Tracked since
                </dt>
                <dd className="mt-1 text-[15px] text-white">{since}</dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Availability
              </dt>
              {/* Deliberately two different claims. "Verified" means an advisor
                  spoke to the owner; "checked" only means the listing was still
                  in the feed. Conflating them would be the same unsupported
                  trust claim the recheck flagged elsewhere. */}
              <dd className="mt-1 text-[15px] text-white">
                {verifiedOn ? (
                  <>Confirmed with the owner on {verifiedOn}</>
                ) : checkedOn ? (
                  <>Listing last checked {checkedOn}</>
                ) : (
                  <>Call us to confirm current availability</>
                )}
              </dd>
            </div>
            {record.postingCount > 1 && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Consolidated listings
                </dt>
                <dd className="mt-1 text-[15px] text-white">
                  {record.postingCount} postings of this unit
                  {record.postingPriceRange && (
                    <span className="block text-[13px] text-gray-400">
                      quoted between {formatInr(record.postingPriceRange.min)} and{" "}
                      {formatInr(record.postingPriceRange.max)}
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>

          {record.verification.priceHistory.length > 0 && (
            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gray-400">
                Price history
              </p>
              <ul className="space-y-1.5">
                {record.verification.priceHistory.slice(-5).map((p, i) => (
                  <li key={i} className="flex justify-between gap-3 text-[14px] text-gray-300">
                    <span>{formatDate(p.at)}</span>
                    <span className="text-white">{p.priceText ?? "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-5 border-t border-white/[0.07] pt-4 text-[12.5px] leading-relaxed text-gray-500">
            HomzRealtor brokers this unit. Quote reference {record.listingId} when you
            call {COMPANY_INFO.phone}. We do not charge buyers or tenants a fee to view a
            property.
          </p>
        </div>
      </Section>
    </div>
  );
}
