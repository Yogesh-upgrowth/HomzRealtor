import Link from "next/link";
import type { SellingNowCard } from "@/lib/intelligence/developerPage";
import SectorPinTile from "./SectorPinTile";

// "Selling now" (developer-page brief §1.1 and §3): new launches and
// under-construction projects as full cards. Images are Homz-owned or a
// generated position tile, never the feed's portal images.

export default function SellingNowCards({
  developerName,
  cards,
  asOfLabel,
}: {
  developerName: string;
  cards: SellingNowCard[];
  asOfLabel: string;
}) {
  return (
    <section aria-labelledby="selling-now" className="w-full max-w-7xl mx-auto px-4 mt-12">
      <h2 id="selling-now" className="mb-1 text-2xl font-bold text-white">
        {developerName} projects selling now
      </h2>
      <p className="mb-5 text-[13px] text-gray-500">
        New launches and projects under construction, newest first.
      </p>
      {cards.length === 0 ? (
        <p className="rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[14px] text-gray-400">
          No active launches in our catalogue as of {asOfLabel}.
        </p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li
              key={`${c.project.city_key}-${c.project.slug}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416]"
            >
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image}
                  alt={`${c.project.project_name}, ${c.location}`}
                  width={640}
                  height={360}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
              ) : c.pin ? (
                <div className="aspect-video w-full">
                  <SectorPinTile lat={c.pin.lat} lng={c.pin.lng} label={c.project.sector || c.project.project_name} />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[17px] font-bold text-white">
                  <Link href={c.href} className="hover:text-[#CEA44E]">
                    {c.project.project_name}
                  </Link>
                </h3>
                <p className="mt-1 text-[13px] text-gray-400">{c.location}</p>
                <p className="mt-2 text-[13px] text-gray-300">
                  <span className="font-semibold text-[#D9B268]">{c.statusLabel}</span>
                  {c.possession ? ` · Possession ${c.possession}` : ""}
                </p>
                {c.configs.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[13px] text-gray-300">
                    {c.configs.map((cfg) => (
                      <li key={cfg.label} className="flex justify-between gap-3">
                        <span>{cfg.label}</span>
                        <span className="text-right text-gray-400">
                          {[cfg.priceText, cfg.perSqFt].filter(Boolean).join(" · ") || "Price on request"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {(c.units || c.landArea) && (
                  <p className="mt-2 text-[12.5px] text-gray-500">
                    {[c.units && `${c.units} units`, c.landArea && `${c.landArea} land`].filter(Boolean).join(" · ")}
                  </p>
                )}
                {c.chips.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11.5px] text-gray-300"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
                {c.score != null && (
                  <p className="mt-auto pt-3 text-[12.5px] text-gray-500">
                    Homz Investment Score{" "}
                    <Link href="/homz-investment-score-methodology" className="font-semibold text-gray-200 hover:text-[#CEA44E]">
                      {c.score}/100
                    </Link>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
