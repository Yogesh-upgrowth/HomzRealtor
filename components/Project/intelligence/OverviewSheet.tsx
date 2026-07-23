"use client";

import { useContext, useState } from "react";
import BottomSheet from "@/components/Project/listing/BottomSheet";
import { FormContext } from "@/context/FormContext";

export type Chapter = { kicker: string; title: string; body: string };

function RichText({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h4 key={i} className="mt-4 mb-2 text-base font-semibold text-white">
            {b.slice(3)}
          </h4>
        ) : (
          <p key={i} className="mb-3">
            {b}
          </p>
        )
      )}
    </>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  chapters: Chapter[];
};

const OverviewSheet = ({ open, onClose, title, chapters }: Props) => {
  const { openForm } = useContext(FormContext);
  const [progress, setProgress] = useState(0);

  if (chapters.length === 0) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title={title} progress={progress} onBodyScroll={setProgress}>
      <div className="space-y-8 pt-2">
        {chapters.map((ch, i) => (
          <div key={i}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#CEA44E]">
              {ch.kicker}
            </p>
            <h3 className="mb-3 text-xl font-bold text-white">{ch.title}</h3>
            <div className="text-[15px] leading-7 text-gray-300">
              <RichText text={ch.body} />
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            onClose();
            openForm();
          }}
          className="w-full rounded-lg bg-gradient-to-b from-[#FDF094] to-[#B77D2B] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 transition cursor-pointer"
        >
          Talk to an advisor →
        </button>
      </div>
    </BottomSheet>
  );
};

export default OverviewSheet;
