import type { PriceSplit } from "@/lib/intelligence/developerPage";
import { formatInr, formatInrExact } from "@/lib/intelligence/normalize";
import { AskingPriceNote } from "@/components/Common/DataUpdated";

// Price snapshot (developer-page brief §1.2): residential only, with
// commercial stated on its own line, and the sample always shown.

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function PriceSnapshot({ developerName, split }: { developerName: string; split: PriceSplit }) {
  const r = split.residential;
  const c = split.commercial;
  if (!r && !c) return null;
  return (
    <section aria-labelledby="price-snapshot" className="w-full max-w-7xl mx-auto px-4 mt-12">
      <h2 id="price-snapshot" className="mb-1 text-2xl font-bold text-white">
        {developerName} price snapshot
      </h2>
      {r ? (
        <>
          <p className="mb-4 text-[13px] text-gray-500">
            Residential entry asking prices, {r.pricedCount} priced of {split.residentialTotal} residential projects.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Median" value={formatInr(r.medianInr) ?? "—"} />
            <Stat label="Lowest" value={formatInr(r.minInr) ?? "—"} />
            <Stat label="Highest" value={formatInr(r.maxInr) ?? "—"} />
            {r.perSqFtInr ? (
              <Stat label={`Per sq ft (${r.perSqFtSample} sized)`} value={formatInrExact(r.perSqFtInr) ?? "—"} />
            ) : null}
          </div>
        </>
      ) : (
        <p className="mb-4 text-[13px] text-gray-500">
          Too few priced residential projects ({split.residentialTotal} in total) for a meaningful median.
        </p>
      )}
      {c && (
        <p className="mt-4 text-[14px] text-gray-300">
          Commercial: {c.pricedCount} priced of {split.commercialTotal}, entry prices {formatInr(c.minInr)} to{" "}
          {formatInr(c.maxInr)}, median {formatInr(c.medianInr)}.
        </p>
      )}
      <div className="mt-3 max-w-3xl">
        <AskingPriceNote scope={`${developerName}'s portfolio`} />
      </div>
    </section>
  );
}
