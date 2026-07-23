import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FaqItem } from "@/lib/intelligence/content";

type Props = {
  title: string;
  items: FaqItem[];
  citySlug: string;
  slug: string;
};

const FaqTeaser = ({ title, items, citySlug, slug }: Props) => {
  if (!items || items.length === 0) return null;
  const preview = items.slice(0, 2);

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Questions, Answered – ${title}`}
      </h2>

      <div className="flex flex-col gap-3 mb-4">
        {preview.map((item, i) => (
          <div key={i} className="bg-black border border-gray-700 rounded-xl px-5 py-4">
            <p className="text-white font-medium mb-2">{item.q}</p>
            <p className="text-gray-300 text-[15px] leading-7">{item.a}</p>
          </div>
        ))}
      </div>

      <Link
        href={`/project-listing/${citySlug}/${slug}/flat`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B77D2B] hover:opacity-80"
      >
        See all FAQs on the Flats page <ArrowRight size={15} />
      </Link>
    </section>
  );
};

export default FaqTeaser;
