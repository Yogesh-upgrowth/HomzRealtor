import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import type { LinkItem } from "@/lib/intelligence/view-model";

type Props = {
  similarSearches: LinkItem[];
  internalLinks: LinkItem[];
};

const InternalLinking = ({ similarSearches, internalLinks }: Props) => {
  if (similarSearches.length === 0 && internalLinks.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {similarSearches.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search size={18} className="text-[#B77D2B]" />
              <h3 className="font-semibold text-gray-900">Popular Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {similarSearches.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-[#B77D2B] hover:text-[#B77D2B] transition"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {internalLinks.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight size={18} className="text-[#B77D2B]" />
              <h3 className="font-semibold text-gray-900">Explore More</h3>
            </div>
            <ul className="space-y-2">
              {internalLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-[#B77D2B] transition"
                  >
                    <ArrowUpRight size={14} /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default InternalLinking;
