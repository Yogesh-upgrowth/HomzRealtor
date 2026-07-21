import { LayoutGrid, Ruler } from "lucide-react";

type Props = {
  title: string;
  propertyType: string | null;
  minSize: number | null;
  maxSize: number | null;
  sizeUnit: string | null;
};

// High-level flat stats — only the fields the listing actually carries.
// No tower/unit counts are shown since the source data never carries them.
const FlatOverview = ({ title, propertyType, minSize, maxSize, sizeUnit }: Props) => {
  const configs = propertyType
    ? propertyType.split(/[,/]/).map((c) => c.trim()).filter(Boolean)
    : [];

  const sizeText =
    minSize && maxSize
      ? minSize === maxSize
        ? `${minSize.toLocaleString("en-IN")} ${sizeUnit || "sq.ft"}`
        : `${minSize.toLocaleString("en-IN")} – ${maxSize.toLocaleString("en-IN")} ${sizeUnit || "sq.ft"}`
      : null;

  if (configs.length === 0 && !sizeText) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Flat Overview – ${title}`}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {configs.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <LayoutGrid size={18} className="text-[#B77D2B]" />
              <span className="font-medium text-sm">Configurations Available</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {configs.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-800"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {sizeText && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <Ruler size={18} className="text-[#B77D2B]" />
              <span className="font-medium text-sm">Size Range</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{sizeText}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FlatOverview;
