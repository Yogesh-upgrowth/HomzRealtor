"use client";

import { createContext, useCallback, useMemo, useState, ReactNode } from "react";

// R19-05 / R19-03 (2026-09-19): openForm() used to take no arguments at all, so
// the one global enquiry modal was opened identically from the header, the
// hero, every property page, the footer CTAs and "Schedule Site Visit" -- and
// had no way to know which. Two consequences, both confirmed:
//
//   - Lead quality. A visitor pressing "Schedule Site Visit" on a specific
//     project sent {name, email, phone} with no property identity and no visit
//     intent, so the enquiry arrived indistinguishable from a footer callback
//     request. EnquiryRail.tsx already sends project/source/pageUrl; the modal
//     that far more CTAs point at sent less.
//   - Measurement. components/FormComponent.tsx hardcoded FORM_ID
//     "general_enquiry", LEAD_TYPE "callback" and PLACEMENT "modal" with a
//     comment saying it could not do better, which is why the recheck found
//     lead_type reported as "callback" even for a Site Visit trigger.
//
// The context now carries an optional intent describing why it was opened.
// Every field is optional and openForm() still works with no arguments, so
// existing call sites keep compiling and simply describe themselves as
// unspecified until updated.

export type LeadIntent = {
  /** What the visitor asked for. Drives both the dialog copy and lead_type. */
  kind?: "callback" | "site_visit" | "price_enquiry" | "general";
  /** Where in the UI the modal was opened from, e.g. "hero", "project_rail". */
  placement?: string;
  /** Human-readable subject of the enquiry (project or listing name). */
  subject?: string | null;
  /** Stable identifier for that subject, when the call site has one. */
  subjectId?: string | null;
  /** Canonical URL of the thing being enquired about. */
  subjectUrl?: string | null;
};

type FormContextType = {
  isOpen: boolean;
  intent: LeadIntent;
  openForm: (intent?: LeadIntent) => void;
  closeForm: () => void;
};

const DEFAULT_INTENT: LeadIntent = { kind: "callback", placement: "modal" };

// create context with dummy defaults (so TS is happy)
export const FormContext = createContext<FormContextType>({
  isOpen: false,
  intent: DEFAULT_INTENT,
  openForm: () => {},
  closeForm: () => {},
});

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [intent, setIntent] = useState<LeadIntent>(DEFAULT_INTENT);

  const openForm = useCallback((next?: LeadIntent) => {
    setIntent({ ...DEFAULT_INTENT, ...(next || {}) });
    setIsOpen(true);
  }, []);

  // Intent is deliberately left in place on close: the submit handler reads it
  // while the closing transition runs, and resetting here would race that.
  const closeForm = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, intent, openForm, closeForm }),
    [isOpen, intent, openForm, closeForm]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
