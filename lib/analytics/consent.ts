"use client";

// Lightweight analytics-consent gate. Deliberately simpler than the full
// Google Consent Mode v2 default/update signal pattern the GA4 spec's
// reference docs describe (G5) -- that needs the gtag library present
// before any user choice (to send consent-aware cookieless pings while
// denied), which is harder to verify correctness of without a real browser
// and Tag Assistant session. This version is a hard gate instead: nothing
// from gtag.ts loads or fires until the user has explicitly granted
// consent. Simpler to reason about and verify, achieves the same practical
// outcome (no analytics collection without consent) for a first
// implementation; the fuller Consent Mode API is a documented follow-up in
// docs/analytics/ga4-implementation.md, not implemented here.

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export type ConsentState = "unknown" | "granted" | "denied";

const STORAGE_KEY = "homz_analytics_consent";

const listeners = new Set<(state: ConsentState) => void>();

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw === "granted" || raw === "denied") {
      return raw;
    }

    return "unknown";
  } catch {
    // Storage blocked/unavailable (private mode, disabled storage) -- treat
    // as unknown rather than granted; the banner will just keep showing,
    // which is the safe direction to fail in.
    return "unknown";
  }
}

export function setConsent(state: "granted" | "denied"): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, state);
  } catch {
    // If we can't persist it, still notify listeners for this session.
  }
  updateGoogleConsent(state);

  listeners.forEach((fn) => fn(state));
}

export function subscribeConsent(
  fn: (state: ConsentState) => void
): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// MI-18 (2026-09-18): the banner only ever asked once -- there was no way
// for a visitor who already chose Accept/Reject to come back and change
// that choice short of manually clearing site data. This clears the
// stored choice and notifies listeners as "unknown" so ConsentBanner
// (subscribed below) reopens; it does not itself push a Google Consent
// signal, since "unknown" isn't a valid analytics_storage value -- that
// only happens once the visitor makes a new explicit choice via the
// banner, exactly as it already does today.
export function resetConsent(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to remove/notify about if storage was never reachable.
  }

  listeners.forEach((fn) => fn("unknown"));
}

export function updateGoogleConsent(
  state: "granted" | "denied"
): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    event: "consent_update",
    analytics_storage: state,
  });
}
