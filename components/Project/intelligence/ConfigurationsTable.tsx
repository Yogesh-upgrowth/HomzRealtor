import { formatInr, formatInrExact } from "@/lib/intelligence/normalize";

// Parse "₹ 1.31 Cr" / "85 Lakh" → absolute rupees.
function parsePriceStr(s: string): number | null {
  if (!s) return null;
  const cr = s.match(/([\d.]+)\s*Cr/i);
  if (cr) return Math.round(parseFloat(cr[1]) * 1e7);
  const lakh = s.match(/([\d.]+)\s*(?:L(?:akh)?|lac)/i);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 1e5);
  return null;
}

type PriceRow = {
  bhkType?: string;
  unitType?: string;
  type?: string;
  size?: string;
  area?: string;
  price?: string;
};

type Props = {
  title: string;
  priceList: PriceRow[];
};

// Real, per-configuration size/price/₹-per-sq.ft table sourced directly from
// the listing's price list — no projections, no fabricated rows.
const ConfigurationsTable = ({ title, priceList }: Props) => {
  const rows = (Array.isArray(priceList) ? priceList : [])
    .map((r) => {
      const unit = r.bhkType || r.unitType || r.type || "Unit";
      const sizeNum = parseFloat(String(r.size ?? r.area ?? "").replace(/[^\d.]/g, ""));
      const priceInr = parsePriceStr(String(r.price ?? ""));
      const psf = priceInr && sizeNum > 0 ? Math.round(priceInr / sizeNum) : null;
      return {
        unit,
        sizeNum: sizeNum > 0 ? sizeNum : null,
        priceInr,
        psf,
        priceStr: r.price ?? null,
      };
    })
    .filter((r) => r.priceInr || r.sizeNum);

  if (rows.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Configurations – ${title}`}
      </h2>

      <div className="rounded-2xl bg-black border border-gray-700 p-6 md:p-8 overflow-x-auto">
        <h3 className="text-gray-300 text-sm font-medium mb-1">Configuration-wise Pricing</h3>
        <p className="text-gray-500 text-xs mb-4">Current listed prices &amp; price per sq.ft by unit type</p>
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 pr-4 font-medium">Configuration</th>
              <th className="py-2 pr-4 font-medium">Size</th>
              <th className="py-2 pr-4 font-medium">Starting Price</th>
              <th className="py-2 font-medium">₹ / sq.ft</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-800 text-gray-200">
                <td className="py-2.5 pr-4 font-medium">{r.unit}</td>
                <td className="py-2.5 pr-4">
                  {r.sizeNum ? `${r.sizeNum.toLocaleString("en-IN")} sq.ft` : "—"}
                </td>
                <td className="py-2.5 pr-4">
                  {r.priceInr ? formatInr(r.priceInr) : r.priceStr || "—"}
                </td>
                <td className="py-2.5 text-[#CEA44E]">{r.psf ? formatInrExact(r.psf) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ConfigurationsTable;
