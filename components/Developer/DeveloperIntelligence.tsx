import Link from "next/link";
import type { DeveloperProfile } from "@/lib/intelligence/developerProfile";
import { formatInr } from "@/lib/intelligence/normalize";

// Audit item 9 (2026-09-19): developer hubs were a name, one templated
// sentence and nine cards. Everything below is computed from Homz's own
// catalogue (lib/intelligence/developerProfile.ts) -- the builder's actual
// listed price band, where they build, how much of the portfolio is finished
// and how much carries a live registration. It is substance the card grid
// never carried and it stays true as inventory moves.
//
// Each block renders only when its figure could be computed, so a builder
// with four projects gets a short honest page rather than a padded one.

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 text-[12px] text-gray-500">{note}</p>}
    </div>
  );
}

export default function DeveloperIntelligence({
  name,
  cityLabel,
  profile,
}: {
  name: string;
  cityLabel: string;
  profile: DeveloperProfile;
}) {
  const statusKnown = profile.readyToMove + profile.underConstruction + profile.newLaunch;
  const hasAnything =
    profile.price || statusKnown > 0 || profile.reraWithId > 0 || profile.sectors.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {profile.price && (
        <section aria-labelledby="dev-prices" className="mt-12">
          <h2 id="dev-prices" className="mb-4 text-2xl font-bold text-white">
            {name} prices on HomzRealtor
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {profile.price.perSqFtInr && (
              <Stat
                label="Median rate"
                value={`₹${profile.price.perSqFtInr.toLocaleString("en-IN")}/sq ft`}
                note={`from ${profile.price.perSqFtSample} projects with a confirmed size`}
              />
            )}
            <Stat
              label="Median entry price"
              value={formatInr(profile.price.medianInr) || "—"}
              note={`across ${profile.price.pricedCount} priced projects`}
            />
            <Stat
              label="Entry prices from"
              value={formatInr(profile.price.minInr) || "—"}
              note="lowest listed starting price"
            />
            <Stat
              label="Up to"
              value={formatInr(profile.price.maxInr) || "—"}
              note="highest listed starting price"
            />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
            Asking prices from our own catalogue, not transacted prices.
            {profile.price.totalCount - profile.price.pricedCount > 0 && (
              <>
                {" "}
                {profile.price.totalCount - profile.price.pricedCount} of{" "}
                {profile.price.totalCount} {name} projects are listed as price on request and are
                not in these figures.
              </>
            )}{" "}
            Confirm the current price with an advisor before acting on it.
          </p>
        </section>
      )}

      {statusKnown > 0 && (
        <section aria-labelledby="dev-status" className="mt-12">
          <h2 id="dev-status" className="mb-4 text-2xl font-bold text-white">
            Delivery status across the portfolio
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {profile.readyToMove > 0 && (
              <Stat label="Ready to move" value={String(profile.readyToMove)} note="possession available" />
            )}
            {profile.underConstruction > 0 && (
              <Stat label="Under construction" value={String(profile.underConstruction)} note="possession pending" />
            )}
            {profile.newLaunch > 0 && (
              <Stat label="New launch" value={String(profile.newLaunch)} note="recently launched" />
            )}
            {profile.statusUnknown > 0 && (
              <Stat
                label="Status not stated"
                value={String(profile.statusUnknown)}
                note="ask an advisor rather than assuming"
              />
            )}
          </div>
        </section>
      )}

      {profile.reraWithId > 0 && (
        <section aria-labelledby="dev-rera" className="mt-12">
          <h2 id="dev-rera" className="mb-4 text-2xl font-bold text-white">
            RERA registration
          </h2>
          <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-6">
            <p className="text-[15px] leading-relaxed text-gray-300">
              {profile.reraWithId} {name}{" "}
              {profile.reraWithId === 1 ? "project carries" : "projects carry"} a HARERA
              registration number in our records, of which {profile.reraActive} show as currently
              active.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
              Registration is granted per project and per phase, never per developer. Check the
              number shown on the project page against the official HARERA portal, and confirm it
              covers the specific phase you are buying into, before making any payment.
            </p>
          </div>
        </section>
      )}

      {(profile.sectors.length > 0 || profile.microMarkets.length > 0) && (
        <section aria-labelledby="dev-where" className="mt-12">
          <h2 id="dev-where" className="mb-4 text-2xl font-bold text-white">
            Where {name} builds in {cityLabel}
          </h2>
          {profile.sectors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.sectors.map((s) =>
                s.href ? (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
                  >
                    {s.label} <span className="text-gray-500">({s.count})</span>
                  </Link>
                ) : (
                  <span
                    key={s.label}
                    className="rounded-full border border-gray-800 bg-black px-4 py-1.5 text-sm text-gray-400"
                  >
                    {s.label} <span className="text-gray-600">({s.count})</span>
                  </span>
                )
              )}
            </div>
          )}
          {profile.microMarkets.length > 0 && (
            <p className="mt-4 text-[14px] leading-relaxed text-gray-400">
              By corridor:{" "}
              {profile.microMarkets
                .map((m) => `${m.name} (${m.count})`)
                .join(", ")}
              .
            </p>
          )}
        </section>
      )}

      {(profile.types.length > 0 || profile.sizeRange) && (
        <section aria-labelledby="dev-mix" className="mt-12">
          <h2 id="dev-mix" className="mb-4 text-2xl font-bold text-white">
            What they build
          </h2>
          <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-6">
            {profile.types.length > 0 && (
              <p className="text-[15px] leading-relaxed text-gray-300">
                Portfolio mix:{" "}
                {profile.types.map((t) => `${t.label} (${t.count})`).join(", ")}.
              </p>
            )}
            {profile.sizeRange && profile.sizeRange.sample >= 3 && (
              <p className="mt-3 text-[15px] leading-relaxed text-gray-300">
                Listed unit sizes run from{" "}
                {profile.sizeRange.minSqFt.toLocaleString("en-IN")} to{" "}
                {profile.sizeRange.maxSqFt.toLocaleString("en-IN")} sq ft, across the{" "}
                {profile.sizeRange.sample} projects carrying a confirmed size.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
