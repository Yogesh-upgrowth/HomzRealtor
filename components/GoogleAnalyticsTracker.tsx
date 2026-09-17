"use client";

// Fires the manual `page_view` event once per real navigation (spec
// section 4/8: "once after the initial page or a genuine route navigation
// has committed... not on hydration, modal open, filter changes within a
// collection, or re-render"). Deduped on pathname only -- a query-only
// change (a filter, a page number) does NOT count as a new page_view here,
// matching the spec's own acceptance test ("query-only filter change...
// no extra page_view"); returning to a previously-visited pathname (a real
// back/forward navigation) does fire again, since it's compared against
// only the immediately-preceding pathname, not a permanent visited-set.
//
// This replaces the previous version, which called `gtag("config", ...)`
// on every render with no gate at all -- and which never actually ran
// anyway, since the gtag.js script that defines `window.gtag` was never
// loaded anywhere in this codebase (see lib/analytics/gtag.ts's own
// comment). That bug is what's actually fixed here; this component is now
// just the page_view trigger, not the transport.
//
// Bug fixed 2026-09-17 (confirmed live: gtag.js loaded, consent granted,
// zero data ever reached GA4): the very first render of this effect
// usually runs *before* the visitor has accepted the consent banner --
// sendGaEvent() correctly no-ops in that case, but the previous version
// still marked that pathname as "handled" regardless, and nothing ever
// retried once consent was actually granted a moment later on the same
// page. Since gtag is configured with send_page_view:false, that meant
// literally zero events could ever be sent for a visit that grants
// consent without also navigating to a new route afterward -- which is
// the ordinary case (banner, accept, stay put). Now retries via
// subscribeConsent() when a grant arrives, for whichever pathname is
// current at that moment, and only marks a pathname "handled" once the
// event actually got past the consent gate, not on every attempt.

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { sendGaEvent } from "@/lib/analytics/gtag";
import { resolvePageContext } from "@/lib/analytics/pageContext";
import { getConsent, subscribeConsent } from "@/lib/analytics/consent";

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const sentForPathname = useRef<string | null>(null);
  const previousSentPathname = useRef<string | null>(null);

  useEffect(() => {
    function attempt() {
      if (sentForPathname.current === pathname) return;
      if (getConsent() !== "granted") return; // subscription below retries on grant

      const referrer = previousSentPathname.current
        ? `https://www.homzrealtor.com${previousSentPathname.current}`
        : undefined; // first successful send this session: falls back to document.referrer

      sendGaEvent("page_view", resolvePageContext(pathname, referrer));
      previousSentPathname.current = pathname;
      sentForPathname.current = pathname;
    }

    attempt();
    return subscribeConsent((state) => {
      if (state === "granted") attempt();
    });
  }, [pathname]);

  return null;
}
