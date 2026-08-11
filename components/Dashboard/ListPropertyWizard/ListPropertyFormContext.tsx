"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { INITIAL_FORM_STATE, type ListPropertyFormState, type StepErrors } from "./types";
import { validateStep } from "./validation";
import { toApiPayload } from "./toApiPayload";

const SESSION_STORAGE_KEY = "homz_list_property_draft";
const TOTAL_STEPS = 5;

type ListPropertyFormContextType = {
  formState: ListPropertyFormState;
  updateBasicInfo: (patch: Partial<ListPropertyFormState["basicInfo"]>) => void;
  updateConfiguration: (patch: Partial<ListPropertyFormState["configuration"]>) => void;
  updateMedia: (patch: Partial<ListPropertyFormState["media"]>) => void;
  updateDetailedConfig: (patch: Partial<ListPropertyFormState["detailedConfig"]>) => void;
  updateDescription: (patch: Partial<ListPropertyFormState["description"]>) => void;
  clientTempId: string;
  currentStep: number;
  errors: StepErrors;
  completedSteps: Set<number>;
  isDirty: boolean;
  goToStep: (step: number) => void;
  goNext: () => boolean;
  goPrevious: () => void;
  isSubmitting: boolean;
  submit: () => Promise<void>;
};

const ListPropertyFormContext = createContext<ListPropertyFormContextType | null>(null);

function loadDraft(): ListPropertyFormState {
  if (typeof window === "undefined") return INITIAL_FORM_STATE;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return INITIAL_FORM_STATE;
    const parsed = JSON.parse(raw);
    // Uploaded-file previews (object URLs, in-flight File objects) can't
    // survive a reload — only restore text/chip fields plus media entries
    // that already finished uploading (their real Blob URL still works).
    return {
      ...INITIAL_FORM_STATE,
      ...parsed,
      media: {
        ...INITIAL_FORM_STATE.media,
        ...parsed.media,
        images: (parsed.media?.images ?? []).filter((i: { status: string }) => i.status === "done"),
        videos: (parsed.media?.videos ?? []).filter((i: { status: string }) => i.status === "done"),
      },
    };
  } catch {
    return INITIAL_FORM_STATE;
  }
}

export function ListPropertyFormProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [formState, setFormState] = useState<ListPropertyFormState>(loadDraft);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientTempId = useRef(crypto.randomUUID()).current;

  useEffect(() => {
    if (!isDirty) return;
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(formState));
    } catch {
      // Storage full/unavailable — draft persistence is best-effort only.
    }
  }, [formState, isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const updateBasicInfo = useCallback((patch: Partial<ListPropertyFormState["basicInfo"]>) => {
    setIsDirty(true);
    setFormState((prev) => ({ ...prev, basicInfo: { ...prev.basicInfo, ...patch } }));
  }, []);
  const updateConfiguration = useCallback((patch: Partial<ListPropertyFormState["configuration"]>) => {
    setIsDirty(true);
    setFormState((prev) => ({ ...prev, configuration: { ...prev.configuration, ...patch } }));
  }, []);
  const updateMedia = useCallback((patch: Partial<ListPropertyFormState["media"]>) => {
    setIsDirty(true);
    setFormState((prev) => ({ ...prev, media: { ...prev.media, ...patch } }));
  }, []);
  const updateDetailedConfig = useCallback((patch: Partial<ListPropertyFormState["detailedConfig"]>) => {
    setIsDirty(true);
    setFormState((prev) => ({ ...prev, detailedConfig: { ...prev.detailedConfig, ...patch } }));
  }, []);
  const updateDescription = useCallback((patch: Partial<ListPropertyFormState["description"]>) => {
    setIsDirty(true);
    setFormState((prev) => ({ ...prev, description: { ...prev.description, ...patch } }));
  }, []);

  const goToStep = (step: number) => {
    if (step < 1 || step > TOTAL_STEPS) return;
    // Only allow jumping to a completed step or the very next one — prevents
    // skipping ahead of validation via the sidebar.
    if (step > currentStep && !completedSteps.has(step - 1)) return;
    setErrors({});
    setCurrentStep(step);
  };

  const goNext = () => {
    const result = validateStep(currentStep, formState);
    if (!result.valid) {
      setErrors(result.errors);
      toast.error("Please fill in the required fields");
      return false;
    }
    setErrors({});
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
    return true;
  };

  const goPrevious = () => {
    setErrors({});
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const submit = async () => {
    const result = validateStep(TOTAL_STEPS, formState);
    if (!result.valid) {
      setErrors(result.errors);
      toast.error("Please fill in the required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toApiPayload(formState)),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      toast.success("Listing submitted!");
      try {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // best-effort cleanup
      }
      router.push("/dashboard/my-property");
      router.refresh();
    } catch {
      toast.error("Server error — please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ListPropertyFormContext.Provider
      value={{
        formState,
        updateBasicInfo,
        updateConfiguration,
        updateMedia,
        updateDetailedConfig,
        updateDescription,
        clientTempId,
        currentStep,
        errors,
        completedSteps,
        isDirty,
        goToStep,
        goNext,
        goPrevious,
        isSubmitting,
        submit,
      }}
    >
      {children}
    </ListPropertyFormContext.Provider>
  );
}

export function useListPropertyForm() {
  const ctx = useContext(ListPropertyFormContext);
  if (!ctx) {
    throw new Error("useListPropertyForm must be used within ListPropertyFormProvider");
  }
  return ctx;
}
