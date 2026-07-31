// State-aware RERA portal lookup. project.state only ever takes the three
// values in CITY_META (normalize.ts) — Haryana, Delhi, Uttar Pradesh — since
// those are the only states this site's five cities fall in. Previously every
// project linked to haryanarera.gov.in regardless of state, which told buyers
// on Noida/Greater Noida projects (Uttar Pradesh, a different regulator) to
// verify on the wrong government portal — a compliance defect, not just a
// broken link.
const RERA_PORTALS: Record<string, { name: string; url: string }> = {
  Haryana: { name: "Haryana RERA", url: "https://haryanarera.gov.in/" },
  "Uttar Pradesh": { name: "UP RERA", url: "https://up-rera.in/" },
  Delhi: { name: "Delhi RERA", url: "https://rera.delhi.gov.in/" },
};

export function reraPortalFor(state: string | null | undefined): { name: string; url: string } | null {
  if (!state) return null;
  return RERA_PORTALS[state] || null;
}
