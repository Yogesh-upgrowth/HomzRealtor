import Link from "next/link";
import type { NormalizedProject } from "@/lib/intelligence/normalize";
import { formatInr, slugify } from "@/lib/intelligence/normalize";
import { projectCorridorSlug } from "@/lib/intelligence/developerViews";
import { GURGAON_CORRIDORS } from "@/lib/listings/listingLocation";

// "Where {Developer} Builds in Gurgaon" (2026-09-22).
//
// The developer hubs already showed sector chips. Chips tell a reader where a
// name appears; a table with counts, category split and a median entry price
// tells them where the developer is actually concentrated and what it costs to
// enter there — which is the question behind "DLF Golf Course Road projects".
//
// This is also the module a competitor cannot copy by writing more words: it
// is a cross-tabulation of our own catalogue, and it changes every time the
// inventory does.
//
// Corridors come first and sectors second, deliberately. A corridor is how
// people search ("Golf Course Road", "Dwarka Expressway"); a sector is how the
// records are filed. Both are shown because both are looked for.

type Row = {
  label: string;
  href: string | null;
  total: number;
  residential: number;
  commercial: number;
  medianEntryInr: number | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function toRow(label: string, href: string | null, projects: NormalizedProject[]): Row {
  const priced = projects
    .map((p) => p.min_price_inr)
    .filter((v): v is number => typeof v === "number" && v > 0);
  return {
    label,
    href,
    total: projects.length,
    residential: projects.filter((p) => p.property_category === "Residential").length,
    commercial: projects.filter((p) => p.property_category === "Commercial").length,
    // Four is the same floor the sector pages use. A median of two asking
    // prices is not a market signal, it is two numbers.
    medianEntryInr: priced.length >= 4 ? median(priced) : null,
  };
}

type Props = {
  developerName: string;
  developerSlug: string;
  projects: NormalizedProject[];
  /** Corridor slugs that have their own indexable page for this developer, so
   *  the table links to them rather than to a generic hub. */
  linkedCorridors: Set<string>;
  citySlug: string;
};

export default function DeveloperLocations({
  developerName,
  developerSlug,
  projects,
  linkedCorridors,
  citySlug,
}: Props) {
  const byCorridor = new Map<string, NormalizedProject[]>();
  for (const p of projects) {
    const slug = projectCorridorSlug(p);
    if (!slug) continue;
    if (!byCorridor.has(slug)) byCorridor.set(slug, []);
    byCorridor.get(slug)!.push(p);
  }

  const corridorRows = Array.from(byCorridor.entries())
    .map(([slug, list]) => {
      const label = GURGAON_CORRIDORS.find((c) => c.slug === slug)?.label ?? slug;
      const href = linkedCorridors.has(slug)
        ? `/developer/${developerSlug}/${slug}`
        : `/buy-property/gurgaon/${slug}`;
      return toRow(label, href, list);
    })
    .sort((a, b) => b.total - a.total);

  const bySector = new Map<string, NormalizedProject[]>();
  for (const p of projects) {
    if (!p.sector) continue;
    if (!bySector.has(p.sector)) bySector.set(p.sector, []);
    bySector.get(p.sector)!.push(p);
  }
  const sectorRows = Array.from(bySector.entries())
    .map(([label, list]) => toRow(label, `/project-listing/${citySlug}/sectors/${slugify(label)}`, list))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  if (corridorRows.length === 0 && sectorRows.length === 0) return null;

  const Table = ({ rows, caption }: { rows: Row[]; caption: string }) => (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="w-full min-w-[620px] text-left text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#141416] text-[12px] uppercase tracking-wider text-gray-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Location</th>
            <th scope="col" className="px-4 py-3 font-semibold">Projects</th>
            <th scope="col" className="px-4 py-3 font-semibold">Residential</th>
            <th scope="col" className="px-4 py-3 font-semibold">Commercial</th>
            <th scope="col" className="px-4 py-3 font-semibold">Median entry price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-white/[0.06]">
              <th scope="row" className="px-4 py-3 font-medium text-gray-200">
                {r.href ? (
                  <Link href={r.href} className="hover:text-[#CEA44E]">
                    {r.label}
                  </Link>
                ) : (
                  r.label
                )}
              </th>
              <td className="px-4 py-3 text-gray-300">{r.total}</td>
              <td className="px-4 py-3 text-gray-400">{r.residential}</td>
              <td className="px-4 py-3 text-gray-400">{r.commercial}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[#D9B268]">
                {r.medianEntryInr ? formatInr(r.medianEntryInr) : <span className="text-gray-600">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mt-12">
      <h2 className="mb-1 text-2xl font-bold text-white">
        Where {developerName} Builds in Gurgaon
      </h2>
      <p className="mb-5 text-[13px] text-gray-500">
        A median is shown only where at least four {developerName} projects in that location carry
        a price. Entry prices, asking rather than transacted.
      </p>

      {corridorRows.length > 0 && (
        <section aria-labelledby="dev-corridors" className="mb-8">
          <h3 id="dev-corridors" className="mb-3 text-[15px] font-semibold text-gray-300">
            By corridor
          </h3>
          <Table rows={corridorRows} caption={`${developerName} projects by Gurgaon corridor`} />
        </section>
      )}

      {sectorRows.length > 0 && (
        <section aria-labelledby="dev-sectors">
          <h3 id="dev-sectors" className="mb-3 text-[15px] font-semibold text-gray-300">
            By sector
          </h3>
          <Table rows={sectorRows} caption={`${developerName} projects by Gurgaon sector`} />
        </section>
      )}
    </div>
  );
}
