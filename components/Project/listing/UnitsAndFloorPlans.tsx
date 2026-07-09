import Link from "next/link";
import { LayoutGrid, ArrowRight } from "lucide-react";
import type { UnitRow } from "@/lib/intelligence/view-model";

type Props = {
  title: string;
  citySlug: string;
  slug: string;
  units: UnitRow[];
  propertyType: string | null;
};

/**
 * Floor Plans ↔ Available Units, with a graceful fallback:
 *  • If we have structured unit rows → show the availability table.
 *  • Else if we know the configuration types → show a configuration summary + CTA.
 *  • Else → render nothing (never an empty table).
 */
const UnitsAndFloorPlans = ({ title, citySlug, slug, units, propertyType }: Props) => {
  const enquireHref = `/project-listing/${citySlug}/${slug}/enquire`;

  // Available Units table intentionally disabled — uncomment this block to restore it.
  /*
  if (units.length > 0) {
    return (
      <section className="w-full max-w-7xl mx-auto px-2 my-12">
        <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
          {`Available Units - ${title}`}
        </h2>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead className="bg-gradient-to-b from-[#FDF094] to-[#B77D2B] text-black">
              <tr>
                <th className="p-3 text-left font-semibold">Configuration</th>
                <th className="p-3 text-left font-semibold">Size</th>
                <th className="p-3 text-left font-semibold">Price</th>
                <th className="p-3 text-center font-semibold">Enquire</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {units.map((u, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="p-3 font-medium text-gray-900">{u.unitType}</td>
                  <td className="p-3 text-gray-700">{u.size}</td>
                  <td className="p-3 text-gray-700">{u.price}</td>
                  <td className="p-3 text-center">
                    <Link
                      href={enquireHref}
                      className="inline-flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-xs md:text-sm text-white hover:bg-gray-800 transition"
                    >
                      Enquire <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  */

  if (propertyType) {
    const configs = propertyType.split(/[,/]/).map((c) => c.trim()).filter(Boolean);
    return (
      <section className="w-full max-w-7xl mx-auto px-2 my-12">
        <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
          {`Configurations - ${title}`}
        </h2>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center gap-2 text-gray-700 mb-4">
            <LayoutGrid size={18} className="text-[#B77D2B]" />
            <span className="font-medium">Available configurations at {title}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {configs.map((c) => (
              <span
                key={c}
                className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-800"
              >
                {c}
              </span>
            ))}
          </div>
          <Link
            href={enquireHref}
            className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Get Floor Plans &amp; Pricing <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return null;
};

export default UnitsAndFloorPlans;
