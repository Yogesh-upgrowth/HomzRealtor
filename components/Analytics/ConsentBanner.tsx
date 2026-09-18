"use client";

// Minimal real consent gate for analytics -- not the full Google Consent
// Mode v2 default/update signal pattern the GA4 spec's own reference docs
// describe (see lib/analytics/consent.ts's comment for why this simpler
// version was chosen for a first pass). Shows once per browser until the
// visitor makes an explicit choice; gtag.ts never loads anything before
// that choice is "granted".

import { useEffect, useState } from "react";
import { getConsent, setConsent, subscribeConsent } from "@/lib/analytics/consent";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === "unknown");
    // MI-18: reopen if something elsewhere (the footer's "Cookie
    // Preferences" link) resets the stored choice back to "unknown" --
    // this used to only ever check once, on mount.
    return subscribeConsent((state) => setVisible(state === "unknown"));
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-[#0B0B0C]/98 px-4 py-4 backdrop-blur-sm md:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <p className="text-[13px] leading-relaxed text-gray-300">
          We use analytics cookies to understand how visitors use HomzRealtor and improve the
          site. We only turn them on with your consent — see our{" "}
          <a href="/privacy-policy" className="text-[#D9B268] underline hover:opacity-80">
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setConsent("denied");
              setVisible(false);
            }}
            className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-gray-300 transition-colors hover:border-white/30"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => {
              setConsent("granted");
              setVisible(false);
            }}
            className="rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-5 py-2 text-[13px] font-bold text-[#1c1608] transition-opacity hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
