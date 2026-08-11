"use client";

import { ListPropertyFormProvider, useListPropertyForm } from "./ListPropertyFormContext";
import WizardSidebar from "./WizardSidebar";
import WizardFooter from "./WizardFooter";
import Step1BasicInfo from "./steps/Step1BasicInfo";
import Step2BasicConfiguration from "./steps/Step2BasicConfiguration";
import Step3MediaHighlights from "./steps/Step3MediaHighlights";
import Step4DetailedConfiguration from "./steps/Step4DetailedConfiguration";
import Step5Description from "./steps/Step5Description";
import { STEP_DEFINITIONS } from "./constants";

const STEP_COMPONENTS = [
  Step1BasicInfo,
  Step2BasicConfiguration,
  Step3MediaHighlights,
  Step4DetailedConfiguration,
  Step5Description,
];

function WizardBody() {
  const { currentStep } = useListPropertyForm();
  const StepComponent = STEP_COMPONENTS[currentStep - 1];
  const stepTitle = STEP_DEFINITIONS[currentStep - 1].title;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      <WizardSidebar />
      <div className="rounded-2xl border border-white/10 bg-[#141416] p-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Step {currentStep}</p>
        <h2 className="text-lg font-bold text-white mb-4">{stepTitle}</h2>
        <div className="h-px bg-white/[0.08] mb-6" />
        <StepComponent />
        <WizardFooter />
      </div>
    </div>
  );
}

export default function ListPropertyWizard() {
  return (
    <ListPropertyFormProvider>
      <WizardBody />
    </ListPropertyFormProvider>
  );
}
