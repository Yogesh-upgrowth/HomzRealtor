"use client";

import { useState } from "react";
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
import type { Badge, PersonaReasons, InvestmentScore as Score } from "@/lib/intelligence/view-model";
import SegmentedTabs from "@/components/Project/listing/SegmentedTabs";
import InvestmentScore from "@/components/Project/listing/InvestmentScore";

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

type Props = {
  title: string;
  personaReasons: PersonaReasons;
  isCommercial: boolean;
  investmentScore: Score | null;
};

const BadgeCard = ({ badge }: { badge: Badge }) => {
  const Icon = ICONS[badge.icon] || ShieldCheck;
  return (
    <div className="rounded-[18px] border border-white/[0.07] bg-[#141416] p-5">
      <span className="mb-3 inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-[#D9B268]/30 bg-[#D9B268]/14 text-[#D9B268]">
        <Icon size={15} />
      </span>
      <p className="mb-1 text-[15px] font-bold text-white">{badge.label}</p>
      {badge.note && <p className="text-[13px] leading-relaxed text-gray-500">{badge.note}</p>}
    </div>
  );
};

// Investor/End-user toggle built entirely from view.personaReasons, which was
// already computed (real, non-fabricated) in view-model.ts but rendered
// nowhere in the app until now.
const InvestmentCase = ({ title, personaReasons, isCommercial, investmentScore }: Props) => {
  const [tab, setTab] = useState<"investor" | "endUser">("investor");
  const reasons = tab === "investor" ? personaReasons.investor : personaReasons.endUser;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 my-12">
      <h2 className="text-2xl bg-gradient-to-b from-[#F2D79B] to-[#C99A4B] font-bold bg-clip-text text-transparent mb-6">
        Built for two kinds of buyer.
      </h2>

      <div className="mb-6 max-w-xs">
        <SegmentedTabs
          tabs={[
            { id: "investor", label: "For Investors" },
            { id: "endUser", label: isCommercial ? "For End Users" : "For Home Buyers" },
          ]}
          active={tab}
          onChange={(id) => setTab(id as "investor" | "endUser")}
        />
      </div>

      {reasons.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reasons.map((r) => (
            <BadgeCard key={r.label} badge={r} />
          ))}
        </div>
      )}

      {investmentScore && (
        <div className="mt-2">
          <InvestmentScore title={title} data={investmentScore} heading="Homz Investment Score" />
        </div>
      )}
    </section>
  );
};

export default InvestmentCase;
