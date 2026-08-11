"use client";

import Link from "next/link";
import { Building2, Check, ChevronLeft } from "lucide-react";
import { STEP_DEFINITIONS } from "./constants";
import { useListPropertyForm } from "./ListPropertyFormContext";

export default function WizardSidebar() {
  const { currentStep, completedSteps, goToStep, isDirty } = useListPropertyForm();
  const progressPct = Math.round((currentStep / STEP_DEFINITIONS.length) * 100);

  const handleBackClick = (e: React.MouseEvent) => {
    if (isDirty && !window.confirm("Discard this listing? Your progress will be lost.")) {
      e.preventDefault();
    }
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block sticky top-28 rounded-2xl border border-white/10 bg-[#141416] p-6 h-fit">
        <Link
          href="/dashboard/my-property"
          onClick={handleBackClick}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[#D9B268] hover:opacity-80 transition mb-5"
        >
          <ChevronLeft size={14} />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a1a1d] border border-white/10">
            <Building2 size={18} className="text-[#D9B268]" />
          </div>
          <div>
            <p className="font-bold text-white text-[15px]">List Your Property</p>
            <p className="text-[12.5px] text-gray-500">Complete the form to get your property listed</p>
          </div>
        </div>

        <div className="relative mb-7">
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-[#F2D79B] to-[#C99A4B] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="mt-1.5 inline-block rounded-full border border-[#D9B268]/40 bg-[#1a1a1d] px-2 py-0.5 text-[11px] text-[#D9B268]">
            {progressPct}%
          </span>
        </div>

        <div className="flex flex-col">
          {STEP_DEFINITIONS.map((s, i) => {
            const isCurrent = s.step === currentStep;
            const isCompleted = completedSteps.has(s.step);
            const isClickable = isCompleted || isCurrent;
            return (
              <div key={s.step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => goToStep(s.step)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0 transition-colors ${
                      isCurrent
                        ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                        : isCompleted
                        ? "border border-[#D9B268]/50 text-[#D9B268] cursor-pointer"
                        : "border border-white/10 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isCompleted && !isCurrent ? <Check size={14} /> : s.step}
                  </button>
                  {i < STEP_DEFINITIONS.length - 1 && (
                    <div
                      className={`w-px flex-1 min-h-[24px] ${
                        completedSteps.has(s.step) ? "bg-[#D9B268]/50" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">
                    Step {s.step}
                  </p>
                  <p className={`text-[13.5px] font-semibold ${isCurrent ? "text-white" : "text-gray-400"}`}>
                    {s.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden mb-4">
        <div className="flex items-center gap-2 justify-between mb-2">
          <Link
            href="/dashboard/my-property"
            onClick={handleBackClick}
            className="flex items-center gap-1 shrink-0 text-[12.5px] font-semibold text-[#D9B268]"
          >
            <ChevronLeft size={13} />
            Back
          </Link>
          <p className="min-w-0 truncate text-right text-[13px] font-semibold text-white">
            Step {currentStep} of {STEP_DEFINITIONS.length} — {STEP_DEFINITIONS[currentStep - 1].title}
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-[#F2D79B] to-[#C99A4B] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </>
  );
}
