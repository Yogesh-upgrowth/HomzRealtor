"use client";

import { useEffect, type RefObject } from "react";

// R19-02 (2026-09-19): the same ~45-line modal focus lifecycle was pasted into
// three components with three *different* focusable-element selectors --
// FormComponent.tsx queried inputs/textareas/selects, Header/index.tsx omitted
// all three, QuickSearchPanel.tsx omitted textarea. Whether Tab reached a form
// field inside a dialog therefore depended on which copy you happened to be in,
// which is exactly the drift a shared hook prevents. Four further overlays
// (AuthModal, BottomSheet, Amenities, AgentProfileEditModal) had no lifecycle at
// all beyond, at best, an Escape handler.
//
// Behavior per the WAI-ARIA modal dialog pattern:
//   - move focus to a nominated element on open, remembering what had focus
//   - contain Tab / Shift+Tab within the dialog
//   - close on Escape
//   - make everything outside the dialog inert
//   - lock body scroll, saving and restoring the previous value rather than
//     assuming "auto" (Header's copy used to clobber other overlays' saved
//     value on every close)
//   - return focus to the original element on any exit path
//
// https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

/** One selector, used by every dialog. Includes form controls -- a dialog whose
 *  Tab cycle skips its own inputs is worse than no trap at all. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    // offsetParent is null for display:none / visibility:hidden subtrees, so
    // this also skips controls hidden behind a collapsed section.
  ).filter((el) => el.offsetParent !== null);
}

type Options = {
  /** Whether the dialog is currently open. Everything below is a no-op while false. */
  open: boolean;
  /** The dialog element itself — bounds the focus trap and the inert pass. */
  dialogRef: RefObject<HTMLElement | null>;
  /** Called on Escape and whenever the caller should close. */
  onClose: () => void;
  /**
   * What receives focus on open. Defaults to the first focusable element in the
   * dialog. Pass a heading ref (with tabIndex={-1}) where focusing the first
   * input would pop a mobile keyboard immediately — QuickSearchPanel does this
   * deliberately.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function useDialogLifecycle({
  open,
  dialogRef,
  onClose,
  initialFocusRef,
}: Options): void {
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Make everything outside the dialog unreachable. Only elements we set
    // inert ourselves are un-set on cleanup, so nested dialogs don't clear
    // each other's.
    const inerted: HTMLElement[] = [];
    Array.from(document.body.children).forEach((child) => {
      if (
        child instanceof HTMLElement &&
        !child.contains(dialog) &&
        !child.hasAttribute("inert")
      ) {
        child.setAttribute("inert", "");
        inerted.push(child);
      }
    });

    const target = initialFocusRef?.current ?? getFocusableElements(dialog)[0];
    target?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        // Nothing to cycle through: keep focus inside rather than letting Tab
        // escape to the inert page behind.
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      // Also covers focus having drifted outside the dialog entirely.
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = previousOverflow;
      inerted.forEach((el) => el.removeAttribute("inert"));
      // Only restore to an element still in the document — a trigger inside a
      // menu that closed behind this dialog is gone, and focusing a detached
      // node silently drops focus to <body>.
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open, dialogRef, onClose, initialFocusRef]);
}
