import {
  BadgeCheck,
  Building2,
  KeyRound,
  Sparkles,
  TrainFront,
  Plane,
  MapPin,
  Briefcase,
  Gem,
  Dumbbell,
  TreePine,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { Badge } from "@/lib/intelligence/view-model";

const ICONS: Record<string, LucideIcon> = {
  BadgeCheck,
  Building2,
  KeyRound,
  Sparkles,
  TrainFront,
  Plane,
  MapPin,
  Briefcase,
  Gem,
  Dumbbell,
  TreePine,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
};

type Props = { title: string; badges: Badge[]; heading?: string };

const WhyThisProject = ({ title, badges, heading }: Props) => {
  if (!badges || badges.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#FDF094] to-[#B77D2B] font-bold bg-clip-text text-transparent mb-6">
        {heading ?? `Why ${title}`}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon] || ShieldCheck;
          return (
            <div
              key={badge.label}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="shrink-0 rounded-lg bg-gradient-to-b from-[#FDF094] to-[#B77D2B] p-2">
                <Icon size={20} className="text-black" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">{badge.label}</p>
                {badge.note && (
                  <p className="text-sm text-gray-500 mt-0.5">{badge.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default WhyThisProject;
