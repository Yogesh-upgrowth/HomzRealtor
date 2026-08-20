import Image from "next/image";
import type { NewsItem } from "@/lib/intelligence/news";

type Props = {
  items: NewsItem[];
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// Real, live articles only (see lib/intelligence/news.ts's getGurgaonRealEstateNews)
// — no fabricated placeholder headlines. Hides entirely rather than showing
// fake "news" when the feed has nothing relevant right now. Cards link
// straight out to the original source article — no local blog page.
const LatestNews = ({ items }: Props) => {
  if (items.length === 0) return null;
  const [lead, ...others] = items;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-14 md:py-20 border-b border-white/[0.06]">
      <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
        Stay informed
      </p>
      <h2 className="mb-8 text-[clamp(26px,3.6vw,38px)] font-bold tracking-tight text-white">
        Latest News
      </h2>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <a
          href={lead.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#141416] hover:border-[#D9B268]/35 transition"
        >
          <div className="relative aspect-video bg-[#1a1a1d]">
            {lead.image ? (
              <Image
                src={lead.image}
                alt={lead.title}
                fill
                sizes="(min-width: 1024px) 57vw, 100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-600">
                {lead.sourceName || "News"}
              </div>
            )}
            {lead.sourceName && (
              <span className="absolute left-4 top-4 rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[#1c1608]">
                {lead.sourceName}
              </span>
            )}
          </div>
          <div className="p-6">
            <h3 className="mb-2.5 text-[17px] font-bold leading-snug text-white group-hover:text-[#D9B268] transition-colors">
              {lead.title}
            </h3>
            {lead.description && (
              <p className="mb-3 text-[14px] leading-relaxed text-gray-400 line-clamp-2">{lead.description}</p>
            )}
            {formatDate(lead.publishedAt) && (
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-600">
                {formatDate(lead.publishedAt)}
              </span>
            )}
          </div>
        </a>

        {others.length > 0 && (
          <div className="flex flex-col gap-5">
            {others.map((n) => (
              <a
                key={n.link}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#141416] p-3 hover:border-[#D9B268]/35 transition"
              >
                <div className="relative h-[92px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-[#1a1a1d]">
                  {n.image ? (
                    <Image src={n.image} alt={n.title} fill sizes="120px" className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-gray-600 text-center px-1">
                      {n.sourceName || "News"}
                    </div>
                  )}
                </div>
                <div className="py-1">
                  {n.sourceName && (
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#D9B268]">
                      {n.sourceName}
                    </span>
                  )}
                  <h3 className="mt-1.5 text-[14.5px] font-bold leading-snug text-white group-hover:text-[#D9B268] transition-colors">
                    {n.title}
                  </h3>
                  {formatDate(n.publishedAt) && (
                    <span className="mt-1.5 block text-[11px] text-gray-600">{formatDate(n.publishedAt)}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestNews;
