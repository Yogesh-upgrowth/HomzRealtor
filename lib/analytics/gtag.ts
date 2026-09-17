"use client";

import { getConsent } from "./consent";
import { validateEvent } from "./schema";

const ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function sendGaEvent(
  name: string,
  params: Record<string, unknown>
): void {
  const result = validateEvent(name, params);

  if (!result.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[analytics] dropped "${name}": ${result.reason}`);
    }
    return;
  }

  if (!ANALYTICS_ENABLED || getConsent() !== "granted") {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    event: name,
    ...result.params,
  });
}