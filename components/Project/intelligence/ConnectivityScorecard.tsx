import { Plane, TrainFront, Milestone, Building2, MapPin } from "lucide-react";
import type { ConnectivityItem } from "@/lib/intelligence/geo";

const iconFor = (category: string | null) => {
  switch ((category || "").toLowerCase()) {
    case "airport":
      return Plane;
    case "metro":
      return TrainFront;
    case "highway":
      return Milestone;
    case "business":
      return Building2;
    default:
      return MapPin;
  }
};

type Props = {
  title: string;
  items: ConnectivityItem[];
};

const ConnectivityScorecard = ({ title, items }: Props) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {`Connectivity Scorecard - ${title}`}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, i) => {
          const Icon = iconFor(item.category);
          return (
            <div
              key={i}
              className="bg-black border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 text-gray-400">
                <Icon size={18} className="text-[#CEA44E] shrink-0" />
                <span className="text-sm text-gray-300 line-clamp-2">
                  {item.label}
                </span>
              </div>

              <div className="mt-auto">
                {item.travel_time && (
                  <div className="text-xl font-bold text-[#CEA44E]">
                    {item.travel_time}
                  </div>
                )}
                {item.distance_km != null && (
                  <div className="text-sm text-gray-400">
                    {Number(item.distance_km).toFixed(1)} km away
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ConnectivityScorecard;
