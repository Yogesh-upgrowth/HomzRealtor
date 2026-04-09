"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "G-5C24236F2Z", {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}