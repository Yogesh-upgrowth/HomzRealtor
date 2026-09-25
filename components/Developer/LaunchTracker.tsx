import Link from "next/link";
import { MIN_TRACKER_ROWS, type TrackerRow } from "@/lib/intelligence/developerPage";

// Launch tracker (developer-page brief §1.3): dated rows, newest first, from
// developer news naming Gurgaon and from our own catalogue events. Hidden
// below five rows, where it would read as a stub.

function day(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function LaunchTracker({ developerName, rows }: { developerName: string; rows: TrackerRow[] }) {
  if (rows.length < MIN_TRACKER_ROWS) return null;
  return (
    <section aria-labelledby="launch-tracker" className="w-full max-w-7xl mx-auto px-4 mt-12">
      <h2 id="launch-tracker" className="mb-1 text-2xl font-bold text-white">
        {developerName} launch tracker
      </h2>
      <p className="mb-4 text-[13px] text-gray-500">
        News about {developerName} in Gurgaon and changes in our own catalogue, newest first.
      </p>
      <ol className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08]">
        {rows.map((r, i) => (
          <li key={`${r.date}-${i}`} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-5">
            <time dateTime={r.date} className="shrink-0 text-[12.5px] text-gray-500 sm:w-28">
              {day(r.date)}
            </time>
            <span className="text-[14px] text-gray-200">
              {r.external ? (
                <a href={r.href} rel="nofollow noopener noreferrer" target="_blank" className="hover:text-[#CEA44E]">
                  {r.headline}
                </a>
              ) : (
                <Link href={r.href} className="hover:text-[#CEA44E]">
                  {r.headline}
                </Link>
              )}
              <span className="ml-2 text-[12px] text-gray-500">{r.source}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
