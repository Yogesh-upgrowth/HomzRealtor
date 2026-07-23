"use client";

import { useState } from "react";
import AiSummary from "@/components/Project/listing/AiSummary";
import OverviewSheet, { type Chapter } from "./OverviewSheet";

type Props = {
  title: string;
  about: string[];
  chapters: Chapter[];
};

const OverviewSection = ({ title, about, chapters }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AiSummary title={title} about={about.slice(0, 2)} />

      {chapters.length > 0 && (
        <div className="w-full max-w-7xl mx-auto px-2 mb-8 flex justify-center">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B77D2B] hover:opacity-80 cursor-pointer"
          >
            Read full overview →
          </button>
        </div>
      )}

      <OverviewSheet open={open} onClose={() => setOpen(false)} title={title} chapters={chapters} />
    </>
  );
};

export default OverviewSection;
