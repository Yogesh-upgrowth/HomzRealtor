import {
  Dumbbell,
  Waves,
  ShieldCheck,
  Camera,
  TreePine,
  Building2,
  Bike,
  HeartPulse,
  Gamepad2,
  Users,
  Zap,
  Droplets,
  ArrowUpDown,
  CreditCard,
  CircleDot,
  type LucideIcon,
} from "lucide-react";

type Category = { category: string; amenities: string[] };

const iconFor = (text: string): LucideIcon => {
  const key = text.toLowerCase();
  if (key.includes("gym")) return Dumbbell;
  if (key.includes("pool") || key.includes("swim")) return Waves;
  if (key.includes("security")) return ShieldCheck;
  if (key.includes("cctv") || key.includes("surveillance")) return Camera;
  if (key.includes("park") || key.includes("green") || key.includes("garden")) return TreePine;
  if (key.includes("club")) return Building2;
  if (key.includes("cycle") || key.includes("jog")) return Bike;
  if (key.includes("yoga") || key.includes("spa")) return HeartPulse;
  if (key.includes("indoor") || key.includes("game")) return Gamepad2;
  if (key.includes("kid") || key.includes("child")) return Users;
  if (key.includes("power")) return Zap;
  if (key.includes("water")) return Droplets;
  if (key.includes("lift") || key.includes("elevator")) return ArrowUpDown;
  if (key.includes("atm")) return CreditCard;
  return CircleDot;
};

const AmenitiesShowcase = ({ title, data }: { title: string; data: Category[] }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((n, c) => n + c.amenities.length, 0);

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#F2D79B] to-[#C99A4B] font-bold bg-clip-text text-transparent mb-1">
        {`Amenities – ${title}`}
      </h2>
      <p className="text-[15px] text-gray-500 mb-6">
        {total} features across {data.length} categories.
      </p>

      <div className="border-t border-white/[0.09]">
        {data.map((cat) => {
          const CatIcon = iconFor(cat.category);
          return (
            <div
              key={cat.category}
              className="grid grid-cols-1 gap-4 border-b border-white/[0.09] py-6 sm:grid-cols-[minmax(150px,220px)_1fr] sm:gap-8 md:py-7"
            >
              <div>
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
                  <CatIcon size={18} />
                </span>
                <p className="font-display text-xl leading-tight text-[#F1F0ED]">{cat.category}</p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#D9B268]">
                  {cat.amenities.length} amenities
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2.5">
                {cat.amenities.map((a, i) => (
                  <span
                    key={i}
                    className="rounded-[11px] border border-white/[0.09] bg-[#141416] px-4 py-2.5 text-[13.5px] text-gray-300"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AmenitiesShowcase;
