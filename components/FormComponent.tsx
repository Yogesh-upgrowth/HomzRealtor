"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { X, ShieldCheck, Sparkles, Leaf } from "lucide-react";
import { FormContext } from "@/context/FormContext";
import { sendGaEvent } from "@/lib/analytics/gtag";
import { resolvePageContext } from "@/lib/analytics/pageContext";
import { getConsent, subscribeConsent } from "@/lib/analytics/consent";

// GA4 spec (HOMZ-GA4-DYNAMIC-EVENTS-2026-09-15): this is the site's one
// global enquiry modal, opened from many different places (header, hero,
// property pages, footer CTAs) via FormContext's openForm(), which
// currently takes no arguments -- so this component has no way to know
// *why* it was opened. form_id/lead_type/placement below are therefore a
// single generic identity for all of them, not per-placement. Passing real
// context through would mean extending openForm()'s signature and updating
// every call site -- flagged as a follow-up, not guessed at here.
const FORM_ID = "general_enquiry";
const LEAD_TYPE = "callback";
const PLACEMENT = "modal";

type FormState = {
  name: string;
  email: string;
  phone: string;
  terms: boolean;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-3.5 text-[14.5px] text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors";

const HIGHLIGHTS = [
  { icon: Sparkles, title: "Exclusive Location", text: "Located in Gurgaon's most prestigious areas." },
  { icon: ShieldCheck, title: "World Class Amenities", text: "Curated for comfort, security and lifestyle." },
  { icon: Leaf, title: "Sustainable Living", text: "Thoughtfully designed, future-ready spaces." },
];

export default function FormComponent({
  initial,
}: {
  onClose?: () => void;
  onSubmit?: (data: FormState) => void;
  initial?: Partial<FormState>;
}) {
  const { isOpen, closeForm } = useContext(FormContext);
  const [portalReady, setPortalReady] = useState(false);
  const pathname = usePathname();

  // MI-10: focus lifecycle for the modal -- overlayRef identifies this
  // dialog's own portal node so the background-inertness pass below never
  // touches it; dialogRef bounds the Tab-trap to elements actually inside
  // the dialog; headingRef is where focus lands on open; previouslyFocused
  // is who gets focus back on close.
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    terms: initial?.terms ?? false,
  });

  const [loading, setLoading] = useState(false);

  // Analytics dedup guards for this one modal "instance" (reset every time
  // it reopens, per spec: lead_form_start fires once per form instance,
  // and generate_lead must fire at most once per accepted enquiry even
  // across a double-click/duplicate callback).
  //
  // Deliberately NOT retried on a later consent grant, unlike
  // hasOpenedFired below: each of these describes one specific past action
  // (the first keystroke, a submit attempt, an accepted enquiry) that
  // either happened after consent already, or didn't happen at all from
  // GA4's perspective if consent wasn't granted yet -- retrying them later
  // would mean replaying a historical action, which the spec explicitly
  // forbids (section 8/11: "no queued historical events replayed later").
  // A genuinely new action (a real retyped input, a real corrected
  // resubmit, a real second enquiry after reopening the modal) still gets
  // its own event normally; nothing here suppresses that.
  const hasStarted = useRef(false);
  const hasEmittedLead = useRef(false);
  const hasOpenedFired = useRef(false);
  const isSubmittingRef = useRef(false);

  const formEventContext = () => ({
    ...resolvePageContext(pathname),
    form_id: FORM_ID,
    lead_type: LEAD_TYPE,
    contact_method: "web_form",
    placement: PLACEMENT,
  });

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    hasStarted.current = false;
    hasEmittedLead.current = false;
    hasOpenedFired.current = false;

    // lead_form_open describes current state ("the form is visibly open
    // right now"), not a discrete past action -- same category as
    // page_view, unlike lead_form_start/submit/error/generate_lead below.
    // The spec explicitly forbids replaying historical form actions on
    // consent grant ("no queued historical events replayed later" --
    // section 8/11), but recording that the form is still open *now* that
    // consent exists isn't a replay. Fixed 2026-09-17: if the modal opens
    // before the visitor has accepted the consent banner (nothing stops
    // them interacting with the rest of the page first) and they grant
    // consent while it's still open, this used to never fire at all.
    function attemptOpen() {
      if (hasOpenedFired.current) return;
      if (getConsent() !== "granted") return;
      sendGaEvent("lead_form_open", formEventContext());
      hasOpenedFired.current = true;
    }

    attemptOpen();
    return subscribeConsent((state) => {
      if (state === "granted") attemptOpen();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // MI-10 (2026-09-18): background inertness. This dialog is portaled to
    // document.body as a sibling of the rest of the app (Header/main/
    // Footer/Toaster/other modals), not a descendant of it -- so making the
    // *dialog* aria-hidden would be wrong (the spec explicitly calls that
    // out), but every OTHER top-level child of body genuinely needs to
    // become unreachable while this is open, for keyboard, screen-reader
    // and touch users alike -- the backdrop only ever stopped mouse clicks.
    const inertedSiblings: HTMLElement[] = [];
    Array.from(document.body.children).forEach((child) => {
      if (child === overlayRef.current) return;
      if (child instanceof HTMLElement && !child.hasAttribute("inert")) {
        child.setAttribute("inert", "");
        inertedSiblings.push(child);
      }
    });

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeForm();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
      inertedSiblings.forEach((el) => el.removeAttribute("inert"));
      // Return focus to whatever opened the dialog -- unless it's gone
      // (e.g. the page navigated while the dialog was still open).
      if (previouslyFocusedRef.current && document.body.contains(previouslyFocusedRef.current)) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [closeForm, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (!hasStarted.current) {
      hasStarted.current = true;
      sendGaEvent("lead_form_start", formEventContext());
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // MI-11 (2026-09-18): `loading` is React state, not applied to the
    // button's `disabled` attribute until the next render/paint -- two
    // taps close enough together (a real risk on a double-tap or an
    // impatient double-click) could both call handleSubmit and both POST
    // before that render happens. A ref updates synchronously, so this
    // guard is airtight regardless of render timing.
    if (isSubmittingRef.current) return;

    if (!form.terms) {
      toast.error("Please accept the terms");
      sendGaEvent("lead_form_error", {
        ...formEventContext(),
        error_type: "validation",
        error_code: "required_field",
      });
      return;
    }

    isSubmittingRef.current = true;
    sendGaEvent("lead_form_submit", formEventContext());

    try {
      setLoading(true);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      // MI-11: check response.ok alongside data.success rather than
      // data.success alone -- app/api/contact/route.ts always sets
      // success:false on its own error paths (400/502) today, but this is
      // a cheap, correct second signal against a non-2xx response that
      // somehow carries a body shaped like success. It does NOT change
      // what a real upstream success looks like: this repo has no
      // visibility into whether the Google Apps Script webhook's response
      // body reliably includes success:true on every real delivery --
      // that gap is pre-existing and documented, not something to guess
      // at here.
      if (response.ok && data.success) {
        toast.success("Form submitted successfully!");

        // GA4 spec: generate_lead only on durable API acceptance, at most
        // once per accepted enquiry. `data.success` is the best acceptance
        // signal this endpoint currently exposes -- it is NOT a confirmed
        // idempotent/durable-write guarantee (app/api/contact/route.ts has
        // no idempotency key and just forwards the Apps Script webhook's
        // own response); see docs/analytics/ga4-implementation.md for that
        // gap. hasEmittedLead guards this specific instance against a
        // double-click/duplicate callback still producing two lead events.
        if (!hasEmittedLead.current) {
          hasEmittedLead.current = true;
          sendGaEvent("generate_lead", formEventContext());
        }

        setForm({
          name: "",
          email: "",
          phone: "",
          terms: false,
        });

        closeForm();
      } else {
        toast.error("Something went wrong");
        sendGaEvent("lead_form_error", {
          ...formEventContext(),
          error_type: "server",
          error_code: "rejected",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
      sendGaEvent("lead_form_error", {
        ...formEventContext(),
        error_type: "network",
        error_code: "unavailable",
      });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen || !portalReady) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 pt-6 md:items-center md:px-4 md:py-8"
      onClick={closeForm}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative flex max-h-[calc(100dvh-24px)] w-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-t-[28px] border border-b-0 border-white/10 bg-[#141416] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-10 text-white shadow-[0_-24px_80px_rgba(0,0,0,0.65)] scrollbar-hide md:max-h-[95vh] md:max-w-4xl md:flex-row md:gap-10 md:rounded-[24px] md:border-b md:p-12 md:shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expert-form-title"
      >
        <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/15 md:hidden" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeForm}
          aria-label="Close"
          data-testid="button-close-expert-sheet"
          className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-[#D9B268] hover:text-[#D9B268]"
        >
          <X size={18} />
        </button>

        {/* LEFT SIDE */}
        <div className="flex flex-1 flex-col md:mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
            Talk to an expert
          </p>
          <h2
            id="expert-form-title"
            ref={headingRef}
            tabIndex={-1}
            className="mb-3 max-w-[17ch] bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-2xl font-bold text-transparent outline-none md:mb-6 md:max-w-none md:text-3xl"
          >
            Get a Personalised Property &amp; Loan Estimate
          </h2>

          <div className="hidden md:flex flex-col gap-5">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D9B268]/25 bg-[#D9B268]/10 text-[#D9B268]">
                  <h.icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-white">{h.title}</p>
                  <p className="text-sm text-gray-400">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Owner recheck (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17,
              P1-G): "25500+ Happy Customers" / "45 Mn+ Sq.Ft. Area Sold"
              removed here -- unsubstantiated, no evidence supplied. Not
              replaced with different invented figures; restore only with
              real, owner-approved numbers. */}
        </div>

        {/* RIGHT SIDE FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col gap-3.5 text-sm"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            aria-label="Name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
            className={inputClass}
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            aria-label="Phone number"
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            onChange={handleChange}
            required
            className={inputClass}
          />

          <label className="flex items-start gap-2.5 text-xs text-gray-400 mt-1">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#D9B268] cursor-pointer"
            />

            <span>
              I accept the{" "}
              <span className="text-[#D9B268] font-medium">Terms &amp; Conditions</span>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 font-bold text-[#1c1608] hover:brightness-105 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
