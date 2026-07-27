type Props = {
  priceText: string;
  priceSubtext: string | null;
  possession: string | null;
  status: string;
  unitCount: number;
};

// Floating glass "key facts" ribbon overlapping the hero's bottom edge. Only
// 100%-real values are shown here (no fabricated rental-yield stat) — the
// fuller, properly-caveated yield estimate lives in "Investment tools".
//
// Deliberately does NOT show a Homz Score: this ribbon renders from the fast,
// geo-free view computed synchronously in page.tsx (before the async
// connectivity/landmarks lookup resolves), while the real Homz Score shown in
// the "Investment case" section further down is computed from the fuller view
// (with connectivity/landmarks). Showing the score in both places produced two
// different numbers for the same project — one score, computed once, shown
// once.
const KeyFactsRibbon = ({
  priceText,
  priceSubtext,
  possession,
  status,
  unitCount,
}: Props) => {
  const items = [
    { label: "Starting Price", value: priceText, note: priceSubtext },
    (possession || status) && {
      label: "Possession",
      value: possession || status,
      note: possession ? status : null,
    },
    unitCount > 0 && {
      label: "Unit Options",
      value: `${unitCount}`,
      note: "configurations",
    },
  ].filter(Boolean) as { label: string; value: string; note?: string | null }[];

  if (items.length === 0) return null;

  return (
    <section className="relative z-[6]">
      <div className="max-w-7xl mx-auto px-2 -mt-8 md:-mt-10">
        <div className="grid grid-cols-1 divide-x divide-y divide-white/[0.07] overflow-hidden rounded-[20px] border border-white/10 bg-[#121214]/80 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:grid-cols-3 md:flex md:divide-y-0">
          {items.map((it) => (
            <div key={it.label} className="min-w-0 flex-1 px-5 py-5 md:px-6">
              <p className="mb-1.5 truncate text-[10.5px] uppercase tracking-[0.14em] text-gray-500">
                {it.label}
              </p>
              <p className="truncate font-display text-2xl leading-none text-white">{it.value}</p>
              {it.note && <p className="mt-1 truncate text-xs text-gray-500">{it.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFactsRibbon;
