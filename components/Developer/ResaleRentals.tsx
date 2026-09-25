import Link from "next/link";
import type { ResaleSummary } from "@/lib/intelligence/developerPage";

// Resale and rentals inside the developer's own projects (developer-page
// brief §1.5) — counts matched by project name across the live buy and rent
// catalogues, linked to the sector hubs that hold them.

export default function ResaleRentals({ developerName, data }: { developerName: string; data: ResaleSummary | null }) {
  if (!data) return null;
  return (
    <section aria-labelledby="dev-resale" className="w-full max-w-7xl mx-auto px-4 mt-12">
      <h2 id="dev-resale" className="mb-1 text-2xl font-bold text-white">
        Resale and rentals in {developerName} projects
      </h2>
      <p className="mb-4 text-[14px] text-gray-400">
        {data.sale} resale {data.sale === 1 ? "listing" : "listings"} and {data.rent} rental{" "}
        {data.rent === 1 ? "listing" : "listings"} in our catalogue are in {developerName} projects.
      </p>
      {data.sectors.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.sectors.map((s) => (
            <li key={s.label} className="rounded-xl border border-white/[0.08] bg-[#141416] px-4 py-3">
              <p className="text-[14.5px] font-semibold text-white">{s.label}</p>
              <p className="mt-1 text-[13px] text-gray-400">
                {s.buyHref ? (
                  <Link href={s.buyHref} className="text-[#D9B268] hover:underline">
                    {s.sale} for sale
                  </Link>
                ) : (
                  <>{s.sale} for sale</>
                )}
                {" · "}
                {s.rentHref ? (
                  <Link href={s.rentHref} className="text-[#D9B268] hover:underline">
                    {s.rent} to rent
                  </Link>
                ) : (
                  <>{s.rent} to rent</>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
