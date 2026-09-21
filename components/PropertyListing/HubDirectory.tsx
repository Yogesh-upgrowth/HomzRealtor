import Link from "next/link";
import { getAllSorted } from "./PaginatedListingPage";
import type { PropertyCategory } from "@/lib/listings/filters";
import {
  buildLocationHubs,
  ROUTE_BASE_BY_CATEGORY,
  staticFacetsFor,
} from "@/lib/listings/facets";
import { corridorBySlug, sectorLabelFromToken } from "@/lib/listings/listingLocation";

// The entry point into the location hubs (2026-09-21).
//
// Without this block the hubs would be reachable only from each other and from
// the sitemap, and the whole point of building them would be lost: a sitemap
// is a hint, and crawl priority comes from the site's own link graph. Mounted
// on the citywide hub, it makes every sector and corridor two clicks from the
// homepage, against the ~875-page pagination chain that was previously the
// only path to most of the catalogue.
//
// Counts are real and live — they come from the same filter the hub itself
// runs — so this doubles as an honest index of where the inventory actually
// is, rather than a wall of links to pages that may be empty. Hubs below the
// inventory floor are absent here for the same reason they 404: see
// MIN_HUB_LISTINGS in lib/listings/facets.ts.

export default async function HubDirectory({ category }: { category: PropertyCategory }) {
  const routeBase = ROUTE_BASE_BY_CATEGORY[category];
  const all = await getAllSorted(category);
  if (all.length === 0) return null;

  const hubs = buildLocationHubs(all, category);
  if (hubs.length === 0) return null;

  const sectors = hubs.filter((h) => h.facet.location?.kind === "sector");
  const corridors = hubs.filter((h) => h.facet.location?.kind === "corridor");
  const staticFacets = Object.values(staticFacetsFor(category));

  const renting = category === "Rent";
  const label = (h: (typeof hubs)[number]) =>
    h.facet.location?.kind === "sector"
      ? sectorLabelFromToken(h.facet.location.token)
      : corridorBySlug(h.facet.location!.slug)?.label ?? h.facet.slug;

  return (
    <section className="w-full bg-[#0B0B0C] py-12 border-t border-white/[0.06]">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="mb-1 text-2xl font-bold text-white">
          {renting ? "Rentals by area in Gurgaon" : "Property by area in Gurgaon"}
        </h2>
        <p className="mb-6 max-w-2xl text-[14px] leading-relaxed text-gray-400">
          Every sector and corridor where we currently hold inventory, with live listing counts.
          Each page carries that area&rsquo;s own {renting ? "rents" : "prices"}, connectivity and
          nearby schools and hospitals.
        </p>

        {corridors.length > 0 && (
          <div className="mb-7">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              By corridor
            </p>
            <div className="flex flex-wrap gap-2">
              {corridors.map((h) => (
                <Link
                  key={h.facet.slug}
                  href={`/${routeBase}/gurgaon/${h.facet.slug}`}
                  className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
                >
                  {label(h)} <span className="text-gray-500">({h.count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {sectors.length > 0 && (
          <div className="mb-7">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              By sector
            </p>
            <div className="flex flex-wrap gap-2">
              {sectors.map((h) => (
                <Link
                  key={h.facet.slug}
                  href={`/${routeBase}/gurgaon/${h.facet.slug}`}
                  className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
                >
                  {label(h)} <span className="text-gray-500">({h.count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {staticFacets.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              By {renting ? "budget and size" : "budget, size and status"}
            </p>
            <div className="flex flex-wrap gap-2">
              {staticFacets.map((f) => (
                <Link
                  key={f.slug}
                  href={`/${routeBase}/gurgaon/${f.slug}`}
                  className="rounded-full border border-gray-700 bg-black px-4 py-1.5 text-sm text-gray-300 transition hover:border-[#B77D2B] hover:text-[#CEA44E]"
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-[13px] text-gray-500">
          <Link href="/property-rates-in-gurgaon" className="text-[#D9B268] hover:underline">
            Gurgaon property rates, sector by sector
          </Link>{" "}
          — median asking rates across every sector we track.
        </p>
      </div>
    </section>
  );
}
