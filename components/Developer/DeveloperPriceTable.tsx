import Link from "next/link";
import type { NormalizedProject } from "@/lib/intelligence/normalize";
import { formatInr } from "@/lib/intelligence/normalize";
import { projectStatusKind } from "@/lib/intelligence/projectStatus";
import { DataUpdated } from "@/components/Common/DataUpdated";

// The developer price list (2026-09-22).
//
// The single biggest content module missing from the developer hubs, and the
// one the competing DLF landing pages lead with. A visitor searching "DLF
// price list Gurgaon" wants one table, not nine cards they have to open in
// turn.
//
// Every cell comes from the record. Nothing is written by hand, so this table
// exists identically for M3M, Emaar and every other developer the moment they
// have priced projects — and it cannot go stale in the way a hand-maintained
// price list does.
//
// TWO HONESTY RULES, both load-bearing:
//
//   1. Only priced projects appear. A row reading "Price on Request" in a
//      table headed "Price List" wastes the reader's time; the count of
//      omitted projects is stated below the table instead, so the table is
//      never quietly a subset.
//   2. The header says "Current asking price", and the note underneath says
//      these are not registered transaction prices. Same wording as every
//      other price surface on the site — see components/Common/DataUpdated.

type Props = {
  developerName: string;
  projects: NormalizedProject[];
  citySlug: string;
  asOf: string;
  /** Cap, so a 109-project developer does not render a 109-row table above the
   *  fold. The full list is always linked below. */
  limit?: number;
};

const STATUS_LABEL: Record<string, string> = {
  "ready-to-move": "Ready to move",
  "under-construction": "Under construction",
  "new-launch": "New launch",
  unknown: "Not stated",
};

function configurationOf(p: NormalizedProject): string {
  return p.property_type?.trim() || "—";
}

function locationOf(p: NormalizedProject): string {
  return [p.sector, p.micro_market].filter(Boolean)[0] ?? p.city_name;
}

function reraCell(p: NormalizedProject): string {
  if (p.rera_status === "active") return "Registered";
  if (p.rera_status === "lapsed") return "Lapsed";
  if (p.rera_id) return "On file, unverified";
  return "Not on file";
}

export default function DeveloperPriceTable({
  developerName,
  projects,
  citySlug,
  asOf,
  limit = 25,
}: Props) {
  const priced = projects
    .filter((p) => p.min_price_inr != null && p.min_price_inr > 0)
    .sort((a, b) => (b.min_price_inr ?? 0) - (a.min_price_inr ?? 0));

  if (priced.length < 3) return null;

  const rows = priced.slice(0, limit);
  const unpriced = projects.length - priced.length;

  return (
    <section aria-labelledby="dev-price-list" className="w-full max-w-7xl mx-auto px-4 mt-12">
      <h2 id="dev-price-list" className="mb-1 text-2xl font-bold text-white">
        {developerName} Projects in Gurgaon — Current Price List
      </h2>
      <p className="mb-4 text-[13px] text-gray-500">
        Entry asking price per project, highest first.
        {rows.length < priced.length ? ` Showing ${rows.length} of ${priced.length} priced projects.` : ""}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <caption className="sr-only">
            {developerName} projects in Gurgaon with current asking prices, configurations,
            construction status and RERA registration state
          </caption>
          <thead className="bg-[#141416] text-[12px] uppercase tracking-wider text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Project</th>
              <th scope="col" className="px-4 py-3 font-semibold">Location</th>
              <th scope="col" className="px-4 py-3 font-semibold">Configuration</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Current asking price</th>
              <th scope="col" className="px-4 py-3 font-semibold">RERA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={`${p.city_key}-${p.slug}`} className="border-t border-white/[0.06]">
                <th scope="row" className="px-4 py-3 font-medium">
                  <Link
                    href={`/project-listing/${citySlug}/${p.slug}`}
                    className="text-gray-200 hover:text-[#CEA44E]"
                  >
                    {p.project_name}
                  </Link>
                </th>
                <td className="px-4 py-3 text-gray-400">{locationOf(p)}</td>
                <td className="px-4 py-3 text-gray-400">{configurationOf(p)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                  {STATUS_LABEL[projectStatusKind(p.project_status)]}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#D9B268]">
                  {formatInr(p.min_price_inr)}
                  {p.max_price_inr && p.max_price_inr > (p.min_price_inr ?? 0) ? (
                    <span className="font-normal text-gray-500"> – {formatInr(p.max_price_inr)}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-gray-400">{reraCell(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 max-w-3xl space-y-1.5">
        <DataUpdated date={asOf} label="Prices updated" />
        <p className="text-[12.5px] leading-relaxed text-gray-500">
          These are current asking prices from HomzRealtor&apos;s catalogue, not registered
          transaction prices, and they are negotiable.
          {unpriced > 0 && (
            <>
              {" "}
              {unpriced} further {developerName} project{unpriced === 1 ? " is" : "s are"} price on
              request and {unpriced === 1 ? "is" : "are"} not in this table.
            </>
          )}{" "}
          A RERA entry of &quot;Registered&quot; means an active registration in our records —
          confirm the number on the HARERA portal before relying on it.
        </p>
      </div>
    </section>
  );
}
