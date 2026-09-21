import Link from "next/link";
import type { HubIntel } from "@/lib/listings/hubIntel";
import type { PropertyCategory } from "@/lib/listings/filters";
import { isRentScale, PROPERTY_TYPE_LABELS } from "@/lib/listings/filters";
import { formatInr } from "@/lib/intelligence/normalize";

// What a location hub says about its own sector or corridor (2026-09-21).
//
// This is the part that makes a per-sector page defensible rather than a
// doorway page: the asking-price median, the configuration mix, the
// connectivity and the social infrastructure are all specific to this patch of
// Gurgaon and all computed from records the site already holds
// (lib/listings/hubIntel.ts). Swap the sector name and every number changes.
//
// Each block renders only when its figure could actually be computed, so a
// sector with nine listings and no confirmed sizes gets a short honest page
// instead of a padded one.

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 text-[12px] text-gray-500">{note}</p>}
    </div>
  );
}

export default function HubIntelligence({
  locationLabel,
  category,
  intel,
  bedroomHref,
}: {
  locationLabel: string;
  category: PropertyCategory;
  intel: HubIntel;
  /** Builds the citywide BHK hub link for a bedroom count, when one exists.
   *  Returning null leaves the count as plain text rather than a dead link. */
  bedroomHref?: (bedrooms: number) => string | null;
}) {
  const renting = isRentScale(category);
  const hasAnything =
    intel.price ||
    intel.anchors.length > 0 ||
    intel.schools.length > 0 ||
    intel.hospitals.length > 0 ||
    intel.bedroomMix.length > 0;
  if (!hasAnything) return null;

  const per = renting ? " a month" : "";

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {intel.price && (
        <section aria-labelledby="hub-prices" className="mt-12">
          <h2 id="hub-prices" className="mb-4 text-2xl font-bold text-white">
            {renting ? "Rents" : "Prices"} in {locationLabel}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {intel.price.perSqFtInr && (
              <Stat
                label="Median rate"
                value={`₹${intel.price.perSqFtInr.toLocaleString("en-IN")}/sq ft`}
                note={`from ${intel.price.perSqFtSample} listings with a confirmed size`}
              />
            )}
            <Stat
              label={renting ? "Median rent" : "Median asking price"}
              value={`${formatInr(intel.price.medianInr) ?? "—"}${per}`}
              note={`across ${intel.price.pricedCount} priced listings`}
            />
            <Stat
              label="From"
              value={`${formatInr(intel.price.minInr) ?? "—"}${per}`}
              note={renting ? "lowest listed rent" : "lowest listed price"}
            />
            <Stat
              label="Up to"
              value={`${formatInr(intel.price.maxInr) ?? "—"}${per}`}
              note={renting ? "highest listed rent" : "highest listed price"}
            />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
            Asking {renting ? "rents" : "prices"} from our own catalogue, not transacted figures,
            and negotiable.
            {intel.price.totalCount - intel.price.pricedCount > 0 && (
              <>
                {" "}
                {intel.price.totalCount - intel.price.pricedCount} of {intel.price.totalCount}{" "}
                listings here are {renting ? "rent" : "price"} on request and are not in these
                figures.
              </>
            )}{" "}
            Confirm the current figure with an advisor before acting on it.
          </p>
        </section>
      )}

      {intel.bedroomMix.length > 0 && (
        <section aria-labelledby="hub-mix" className="mt-12">
          <h2 id="hub-mix" className="mb-4 text-2xl font-bold text-white">
            What is available in {locationLabel}
          </h2>
          <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-6">
            <p className="text-[15px] leading-relaxed text-gray-300">
              By configuration:{" "}
              {intel.bedroomMix.map((b, i) => {
                const href = bedroomHref?.(b.bedrooms) ?? null;
                const text = `${b.count} × ${b.bedrooms} BHK`;
                return (
                  <span key={b.bedrooms}>
                    {i > 0 && ", "}
                    {href ? (
                      <Link href={href} className="text-[#D9B268] hover:underline">
                        {text}
                      </Link>
                    ) : (
                      text
                    )}
                  </span>
                );
              })}
              .
            </p>
            {intel.typeMix.length > 0 && (
              <p className="mt-3 text-[15px] leading-relaxed text-gray-300">
                By property type:{" "}
                {intel.typeMix
                  .map((t) => `${PROPERTY_TYPE_LABELS[t.type] ?? t.type} (${t.count})`)
                  .join(", ")}
                .
              </p>
            )}
          </div>
        </section>
      )}

      {intel.anchors.length > 0 && (
        <section aria-labelledby="hub-connectivity" className="mt-12">
          <h2 id="hub-connectivity" className="mb-4 text-2xl font-bold text-white">
            Getting around from {locationLabel}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {intel.anchors.map((a) => (
              <Stat key={a.key} label={a.label} value={`${a.km} km`} />
            ))}
          </div>
          <p className="mt-3 text-[13px] text-gray-500">
            Straight-line distances from the centre of {locationLabel}, not driving times — in
            Gurgaon traffic the two can differ a lot.
          </p>
        </section>
      )}

      {(intel.schools.length > 0 || intel.hospitals.length > 0 || intel.malls.length > 0) && (
        <section aria-labelledby="hub-nearby" className="mt-12">
          <h2 id="hub-nearby" className="mb-4 text-2xl font-bold text-white">
            Schools, hospitals and shopping nearby
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { heading: "Schools", items: intel.schools },
              { heading: "Hospitals", items: intel.hospitals },
              { heading: "Shopping", items: intel.malls },
            ]
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div
                  key={g.heading}
                  className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5"
                >
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    {g.heading}
                  </p>
                  <ul className="space-y-1.5">
                    {g.items.map((it) => (
                      <li
                        key={it.name}
                        className="flex justify-between gap-3 text-[14px] text-gray-300"
                      >
                        <span className="min-w-0 truncate">{it.name}</span>
                        <span className="shrink-0 text-gray-500">{it.distanceKm} km</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
