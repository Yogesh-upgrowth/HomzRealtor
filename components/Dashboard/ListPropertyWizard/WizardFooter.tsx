"use client";

import { STEP_DEFINITIONS } from "./constants";
import { useListPropertyForm } from "./ListPropertyFormContext";

export default function WizardFooter() {
  const { currentStep, goNext, goPrevious, submit, isSubmitting } = useListPropertyForm();
  const isLastStep = currentStep === STEP_DEFINITIONS.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-white/[0.08]">
      <button
        type="button"
        onClick={goPrevious}
        disabled={currentStep === 1 || isSubmitting}
        className="rounded-xl border border-white/10 px-5 sm:px-6 py-3 font-semibold text-gray-300 hover:border-[#D9B268]/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Previous
      </button>
      <button
        type="button"
        onClick={isLastStep ? submit : () => goNext()}
        disabled={isSubmitting}
        className="rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 sm:px-8 py-3 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting..." : isLastStep ? "Submit Listing" : "Next"}
      </button>
    </div>
  );
}
