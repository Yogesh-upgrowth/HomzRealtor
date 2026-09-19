import type { SectorContext } from "@/lib/intelligence/sectorContext";
import { formatInr } from "@/lib/intelligence/normalize";

// Audit item 7 (2026-09-19): sector pages were a title, one templated sentence
// and a grid of cards. The pages beating them for "property in sector 65
// gurgaon" are small broker guides leading with a per-sq-ft rate. Everything
// below is computed from Homz's own catalogue and the committed OSM dataset --
// see lib/intelligence/sectorContext.ts -- so it is substance the grid alone
// never carried, and it stays true as inventory changes rather than being
// written once and going stale.
//
// Each block renders only when its figure could actually be computed. A sector
// with four projects gets a short honest page.

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 text-[12px] text-gray-500">{note}</p>}
    </div>
  );
}

export default function SectorIntelligence({
  sectorLabel,
  cityName,
  ctx,
}: {
  sectorLabel: string;
  cityName: string;
  ctx: SectorContext;
}) {
  const hasAnything =
    ctx.price || ctx.anchors.length || ctx.schools.length || ctx.hospitals.length || ctx.builders.length;
  if (!hasAnything) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {ctx.price && (
        <section aria-labelledby="sector-prices" className="mt-12">
          <h2 id="sector-prices" className="mb-4 text-2xl font-bold text-white">
            Property prices in {sectorLabel}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ctx.price.perSqFtInr && (
              <Stat
                label="Median rate"
                value={`₹${ctx.price.perSqFtInr.toLocaleString("en-IN")}/sq ft`}
                note={`from ${ctx.price.perSqFtSample} projects with a confirmed size`}
              />
            )}
            <Stat
              label="Median entry price"
              value={formatInr(ctx.price.medianInr) ?? "—"}
              note={`across ${ctx.price.pricedCount} priced projects`}
            />
            <Stat label="Lowest entry price" value={formatInr(ctx.price.minInr) ?? "—"} />
            <Stat label="Highest entry price" value={formatInr(ctx.price.maxInr) ?? "—"} />
          </div>
          <p className="mt-3 text-[12.5px] text-gray-500">
            Computed by HomzRealtor from {ctx.price.totalCount} projects tracked in{" "}
            {sectorLabel}
            {ctx.price.totalCount - ctx.price.pricedCount > 0
              ? `, of which ${ctx.price.totalCount - ctx.price.pricedCount} are listed as price on request`
              : ""}
            . These are listed asking prices, not transacted prices.
          </p>
        </section>
      )}

      {(ctx.readyToMove > 0 || ctx.underConstruction > 0 || ctx.newLaunch > 0) && (
        <section aria-labelledby="sector-status" className="mt-12">
          <h2 id="sector-status" className="mb-4 text-2xl font-bold text-white">
            What stage is {sectorLabel} at?
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Ready to move" value={String(ctx.readyToMove)} />
            <Stat label="Under construction" value={String(ctx.underConstruction)} />
            <Stat label="New launch" value={String(ctx.newLaunch)} />
          </div>
        </section>
      )}

      {ctx.anchors.length > 0 && (
        <section aria-labelledby="sector-connectivity" className="mt-12">
          <h2 id="sector-connectivity" className="mb-4 text-2xl font-bold text-white">
            Connectivity from {sectorLabel}
          </h2>
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
            Straight-line distances from the sector centre, not driving times.
          </p>
        </section>
      )}

      {(ctx.schools.length > 0 || ctx.hospitals.length > 0 || ctx.malls.length > 0) && (
        <section aria-labelledby="sector-infra" className="mt-12">
          <h2 id="sector-infra" className="mb-4 text-2xl font-bold text-white">
            Social infrastructure near {sectorLabel}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Schools", items: ctx.schools },
              { title: "Hospitals", items: ctx.hospitals },
              { title: "Shopping", items: ctx.malls },
            ]
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div
                  key={g.title}
                  className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5"
                >
                  <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-gray-400">
                    {g.title}
                  </p>
                  <ul className="space-y-1.5">
                    {g.items.map((i) => (
                      <li
                        key={i.name}
                        className="flex justify-between gap-3 text-[14px] text-gray-300"
                      >
                        <span>{i.name}</span>
                        <span className="shrink-0 text-gray-500">{i.distanceKm} km</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}

      {ctx.builders.length > 0 && (
        <section aria-labelledby="sector-builders" className="mt-12">
          <h2 id="sector-builders" className="mb-4 text-2xl font-bold text-white">
            Builders active in {sectorLabel}
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {ctx.builders.map((b) => (
              <span
                key={b.name}
                className="rounded-full border border-white/10 bg-[#141416] px-4 py-2 text-[13px] text-gray-300"
              >
                {b.name}
                <span className="ml-1.5 text-gray-500">
                  {b.count} project{b.count === 1 ? "" : "s"}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-[12.5px] text-gray-500">
        Every figure on this page is computed from HomzRealtor&apos;s own catalogue of
        projects in {sectorLabel}, {cityName}, and updates as that catalogue does.
      </p>
    </div>
  );
}
