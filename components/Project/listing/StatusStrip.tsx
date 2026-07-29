// Server component — live listing status for a property, fed by the status
// sync engine (lib/status). Shows the current status, when it was last
// verified against the source, and the most recent meaningful change. Viewing
// the page also schedules a background re-check when the city's data is stale.
// Self-hides when the property isn't tracked yet (or Mongo isn't configured).

import { after } from "next/server";
import { getPropertyStatus, refreshCityStatusIfStale } from "@/lib/status/queries";
import type { StatusEventDoc } from "@/lib/status/types";

type Props = {
  cityKey: string;
  slug: string;
};

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  "Ready to Move": { dot: "bg-emerald-400", text: "text-emerald-300" },
  "New Launch": { dot: "bg-[#D9B268]", text: "text-[#D9B268]" },
  "Under Construction": { dot: "bg-sky-400", text: "text-sky-300" },
  Rented: { dot: "bg-amber-400", text: "text-amber-300" },
  Taken: { dot: "bg-amber-400", text: "text-amber-300" },
  Vacant: { dot: "bg-emerald-400", text: "text-emerald-300" },
};

const DEFAULT_STYLE = { dot: "bg-gray-400", text: "text-gray-300" };

function timeAgo(date: Date): string {
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}mo ago` : `${Math.floor(mo / 12)}y ago`;
}

function describeEvent(e: StatusEventDoc): string | null {
  switch (e.type) {
    case "price_change":
      return e.from && e.to
        ? `Price updated ${timeAgo(e.at)}: ${e.from} → ${e.to}`
        : `Price updated ${timeAgo(e.at)}`;
    case "status_change":
      return `Status changed ${timeAgo(e.at)}: ${e.from ?? "—"} → ${e.to ?? "—"}`;
    case "delisted":
      return `Removed from listings ${timeAgo(e.at)}`;
    case "listed":
      return null; // first-seen noise — the strip already shows the status
  }
}

const StatusStrip = async ({ cityKey, slug }: Props) => {
  // The "someone's looking at this — go verify it" trigger. Runs after the
  // response is sent; at most one refresh per city at a time (locked).
  after(() => refreshCityStatusIfStale(cityKey));

  const view = await getPropertyStatus(cityKey, slug, 5);
  if (!view) return null;

  const { status, events } = view;
  const style = status.listed
    ? STATUS_STYLES[status.status] ?? DEFAULT_STYLE
    : { dot: "bg-red-400", text: "text-red-300" };
  const label = status.listed ? status.status : "No longer listed";

  const lastChange = events.map(describeEvent).find(Boolean) ?? null;

  return (
    <section className="relative z-[5]">
      <div className="max-w-7xl mx-auto px-2 mt-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/10 bg-[#121214]/80 px-5 py-3.5 backdrop-blur-xl">
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
            <span className={`text-[13px] font-bold tracking-wide ${style.text}`}>
              {label}
            </span>
          </span>

          <span className="text-[12px] text-gray-500">
            Verified {timeAgo(status.last_checked_at)}
          </span>

          {!status.listed && (
            <span className="text-[12px] text-gray-500">
              Last seen {timeAgo(status.last_seen_at)}
            </span>
          )}

          {lastChange && (
            <span className="text-[12px] text-gray-400">{lastChange}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default StatusStrip;
