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

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { sendGaEvent } from "@/lib/analytics/gtag";
import { resolvePageContext } from "@/lib/analytics/pageContext";

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const previousLocation = useRef<string>("");

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    const referrer = previousPathname.current
      ? `https://www.homzrealtor.com${previousPathname.current}`
      : undefined; // first load: resolvePageContext falls back to document.referrer (external origin, sanitized)

    const context = resolvePageContext(pathname, referrer);
    sendGaEvent("page_view", context);

    previousPathname.current = pathname;
    previousLocation.current = context.page_location;
  }, [pathname]);

  return null;
}
