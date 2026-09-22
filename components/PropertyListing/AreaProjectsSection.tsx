import Link from "next/link";
import type { AreaProjects } from "@/lib/listings/areaProjects";
import { formatInr } from "@/lib/intelligence/normalize";

// Checklist items 22 and 23 (2026-09-22): the project-side facts a sector or
// corridor hub was missing — project count, ready-to-move count,
// under-construction count, new-launch count, top developers, top projects,
// and for a corridor the sectors it covers.
//
// Everything here is a count of records we hold, linked to the page that holds
// them. Nothing is ranked by quality, because we have no basis for a quality
// ranking: "top projects" is ordered by how completely we can present them
// (images, then a price, then alphabetically), and the heading says "Projects
// in" rather than "Best projects in" for that reason.

type Props = {
  label: string;
  data: AreaProjects;
  /** The hub's own route base, for the sector links on a corridor page. */
  routeBase: string;
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{note}</p>}
    </div>
  );
}

export default function AreaProjectsSection({ label, data, routeBase }: Props) {
  const statusTotal = data.readyToMove + data.underConstruction + data.newLaunch;

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <section aria-labelledby="area-projects" className="mt-12">
        <h2 id="area-projects" className="mb-1 text-2xl font-bold text-white">
          Projects in {label}
        </h2>
        <p className="mb-5 text-[13px] text-gray-500">
          Whole developments, as distinct from the individual resale and rental listings above.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Projects tracked"
            value={data.projectCount.toLocaleString("en-IN")}
            note={`${data.residentialCount} residential, ${data.commercialCount} commercial`}
          />
          <Stat
            label="Ready to move"
            value={data.readyToMove.toLocaleString("en-IN")}
            note={statusTotal > 0 ? `of ${statusTotal} with a stated status` : undefined}
          />
          <Stat
            label="Under construction"
            value={data.underConstruction.toLocaleString("en-IN")}
            note={data.newLaunch > 0 ? `plus ${data.newLaunch} new launch` : undefined}
          />
          <Stat
            label="Developers active"
            value={data.topDevelopers.length >= 8 ? "8+" : String(data.topDevelopers.length)}
            note={data.topDevelopers[0] ? `most projects: ${data.topDevelopers[0].name}` : undefined}
          />
        </div>

        {data.statusUnknown > 0 && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-gray-500">
            {data.statusUnknown} project{data.statusUnknown === 1 ? " does" : "s do"} not state a
            construction status in our records and {data.statusUnknown === 1 ? "is" : "are"} not
            counted in the split above. We would rather show the gap than put them in a bucket.
          </p>
        )}
      </section>

      {data.topDevelopers.length > 0 && (
        <section aria-labelledby="area-developers" className="mt-10">
          <h2 id="area-developers" className="mb-4 text-xl font-bold text-white">
            Developers building in {label}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.topDevelopers.map((d) =>
              d.slug ? (
                <Link
                  key={d.slug}
                  href={`/developer/${d.slug}`}
                  className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
                >
                  {d.name} <span className="text-gray-500">({d.count})</span>
                </Link>
              ) : (
                <span
                  key={d.name}
                  className="rounded-full border border-gray-800 bg-black px-4 py-1.5 text-sm text-gray-400"
                >
                  {d.name} <span className="text-gray-600">({d.count})</span>
                </span>
              )
            )}
          </div>
        </section>
      )}

      {data.topProjects.length > 0 && (
        <section aria-labelledby="area-top-projects" className="mt-10">
          <h2 id="area-top-projects" className="mb-4 text-xl font-bold text-white">
            Projects to look at in {label}
          </h2>
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {data.topProjects.map((p) => (
              <li key={p.href} className="border-b border-white/[0.05] pb-2.5">
                <Link
                  href={p.href}
                  className="text-[14.5px] text-gray-300 transition hover:text-[#CEA44E]"
                >
                  {p.name}
                </Link>
                <span className="block text-[12px] text-gray-600">
                  {[p.status, p.priceInr ? `from ${formatInr(p.priceInr)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.sectors.length > 0 && (
        <section aria-labelledby="area-sectors" className="mt-10">
          <h2 id="area-sectors" className="mb-1 text-xl font-bold text-white">
            Sectors along {label}
          </h2>
          <p className="mb-4 text-[13px] text-gray-500">
            A corridor is a set of sectors, and prices move between them. These are the ones
            with projects on this corridor, by project count.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {data.sectors.map((s) => (
              <Link
                key={s.slug}
                href={`/${routeBase}/gurgaon/${s.slug}`}
                className="text-[13.5px] text-gray-400 transition hover:text-[#CEA44E]"
              >
                {s.label} <span className="text-gray-600">({s.count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
