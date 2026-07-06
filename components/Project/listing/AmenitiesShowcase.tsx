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

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Amenities - ${title}`}
      </h2>

      <div className="space-y-5">
        {data.map((cat) => (
          <div key={cat.category} className="rounded-2xl bg-black border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{cat.category}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-3 gap-x-4 text-sm text-gray-300">
              {cat.amenities.map((a, i) => {
                const Icon = iconFor(a);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Icon size={16} className="text-[#CEA44E] shrink-0" />
                    <span className="line-clamp-1">{a}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AmenitiesShowcase;
