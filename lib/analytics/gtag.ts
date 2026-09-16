"use client";

// GA4 direct-gtag transport. The site already had a partial gtag
// integration (components/GoogleAnalyticsTracker.tsx calling
// `window.gtag("config", ...)` on every route) but the actual
// googletagmanager.com/gtag/js script that defines `window.gtag` was never
// added anywhere in this codebase -- confirmed by searching the whole repo.
// That call has always been a no-op; this site has never sent GA4 a real
// event. Per the spec's own instruction ("if the site already has a direct
// Google tag integration, retain one transport rather than adding GTM"),
// this fixes and extends that existing direct-gtag approach rather than
// introducing GTM, which nothing in this repo currently uses.

import { getConsent, subscribeConsent } from "./consent";
import { validateEvent } from "./schema";

// Falls back to the ID that was already hardcoded in
// GoogleAnalyticsTracker.tsx so behavior doesn't silently change for
// anyone who hasn't set the env var yet -- but the spec is explicit that
// the *production* ID must come from the owner, not be invented, so this
// should be moved to NEXT_PUBLIC_GA_MEASUREMENT_ID and confirmed before
// this is treated as final. See docs/analytics/ga4-implementation.md.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-5C24236F2Z";

// Kill switch independent of consent -- flip to "false" to stop all
// analytics regardless of user consent state (e.g. while verifying a
// change), without touching consent logic. Defaults on: the site owner
// asked to start seeing real GA4 data with the current ID.
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let scriptLoaded = false;

function initDataLayer() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
}

/** Injects the real gtag.js script and sends the initial config. Only ever
 *  called after consent is granted (see ensureLoaded below) -- this is the
 *  actual fix for the "never loads" bug described above. */
function loadScript(): void {
  if (scriptLoaded || typeof window === "undefined") return;
  scriptLoaded = true;

  initDataLayer();
  window.gtag!("js", new Date());
  // send_page_view: false -- this app owns page_view manually (spec
  // section 4/8), firing it once per real navigation with sanitized
  // location/title/referrer, not on every hydration or filter change.
  window.gtag!("config", GA_MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

function ensureLoaded(): boolean {
  if (!ANALYTICS_ENABLED) return false;
  if (getConsent() !== "granted") return false;
  if (!scriptLoaded) loadScript();
  return true;
}

// Load immediately if consent was already granted in a previous visit, and
// react to a live grant during this session (the consent banner calls
// setConsent(), which notifies this subscriber).
if (typeof window !== "undefined") {
  ensureLoaded();
  subscribeConsent((state) => {
    if (state === "granted") ensureLoaded();
    // "denied" intentionally does nothing further here once a script is
    // already loaded for this page load -- true mid-session withdrawal
    // (stopping an already-loaded tag) is the documented follow-up in
    // docs/analytics/ga4-implementation.md, not implemented in this pass.
  });
}

/** Validates and sends one event. Silently drops (logging a safe reason in
 *  development only, never the rejected values -- those could contain
 *  accidental PII) rather than ever throwing or blocking the caller's real
 *  action, per spec section 7/9. */
export function sendGaEvent(name: string, params: Record<string, unknown>): void {
  const result = validateEvent(name, params);
  if (!result.ok) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[analytics] dropped "${name}": ${result.reason}`);
    }
    return;
  }
  if (!ensureLoaded()) return;
  window.gtag!("event", name, result.params);
}
