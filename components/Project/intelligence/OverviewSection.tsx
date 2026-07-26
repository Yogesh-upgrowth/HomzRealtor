"use client";

import { useState } from "react";
import AiSummary from "@/components/Project/listing/AiSummary";
import QuickSnapshot from "@/components/Project/listing/QuickSnapshot";
import OverviewSheet, { type Chapter } from "./OverviewSheet";
import type { Chip } from "@/lib/intelligence/view-model";

type Props = {
  title: string;
  about: string[];
  chapters: Chapter[];
  chips: Chip[];
};

const OverviewSection = ({ title, about, chapters, chips }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <section id="overview" className="w-full max-w-7xl mx-auto px-2 py-10 md:py-12 scroll-mt-24">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">Overview</p>

      <AiSummary title={title} about={about.slice(0, 2)} />

      {chapters.length > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.03] px-5 py-3 text-sm font-bold text-white hover:border-[#D9B268] transition-colors cursor-pointer"
        >
          Read full overview <span className="text-[#D9B268]">→</span>
        </button>
      )}

      <QuickSnapshot chips={chips} />

      <OverviewSheet open={open} onClose={() => setOpen(false)} title={title} chapters={chapters} />
    </section>
  );
};

export default OverviewSection;
