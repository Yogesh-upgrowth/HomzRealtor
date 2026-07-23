import { formatInr } from "@/lib/intelligence/normalize";
import type { SectorAverages } from "@/lib/intelligence/projects";

type Row = { label: string; a: string | null; b: string | null };

function buildCompareRows(
  minPriceInr: number | null,
  unitCount: number,
  amenityCount: number,
  averages: SectorAverages
): Row[] {
  const rows: Row[] = [
    {
      label: "Starting Price",
      a: minPriceInr ? formatInr(minPriceInr) : null,
      b: averages.avg_min_price_inr ? formatInr(averages.avg_min_price_inr) : null,
    },
    {
      label: "Unit Options",
      a: unitCount > 0 ? `${unitCount}` : null,
      b: averages.avg_unit_options ? `${averages.avg_unit_options}` : null,
    },
    {
      label: "Amenities",
      a: amenityCount > 0 ? `${amenityCount}+` : null,
      b: averages.avg_amenity_count ? `${averages.avg_amenity_count}+` : null,
    },
  ];
  return rows.filter((r) => r.a || r.b);
}

type Props = {
  title: string;
  minPriceInr: number | null;
  unitCount: number;
  amenityCount: number;
  averages: SectorAverages | null;
};

// Independent from the /project-listing/compare/[a]/[b] project-vs-project
// feature — this compares the current project against a synthesized
// sector-average "opponent" built from real aggregated data (getSectorAverages),
// not another named project. Hides cleanly below the minimum sample size.
const SectorCompareTeaser = ({ title, minPriceInr, unitCount, amenityCount, averages }: Props) => {
  if (!averages) return null;
  const rows = buildCompareRows(minPriceInr, unitCount, amenityCount, averages);
  if (rows.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`How ${title} Stacks Up`}
      </h2>

      <div className="overflow-x-auto border border-gray-700 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-left">
              <th className="p-3 font-medium">Detail</th>
              <th className="p-3 font-medium text-white">{title}</th>
              <th className="p-3 font-medium text-white">{averages.sector} Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="bg-black border-t border-gray-800">
                <td className="p-3 text-gray-400">{row.label}</td>
                <td className="p-3 text-white">{row.a || "—"}</td>
                <td className="p-3 text-white">{row.b || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-600 mt-3">
        Sector average computed across {averages.sampleSize} other listed projects in{" "}
        {averages.sector}.
      </p>
    </section>
  );
};

export default SectorCompareTeaser;
