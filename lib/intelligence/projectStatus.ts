// One definition of what a project's construction status means (2026-09-21).
//
// Checklist item 5: "A ready-to-move property should never talk about waiting
// for possession." Several modules had to agree on when that is true, and they
// did not — the payment-plan gate matched the exact string "Ready to Move",
// the projection gate matched a regex, and anything else compared ad hoc. A
// feed value of "Completed", "Delivered" or "RTM" therefore passed some gates
// and failed others, so a completed project could still be offered a
// construction-linked plan.
//
// The feed's projectStatus is free text from an aggregated source, so matching
// has to be tolerant. It is also the field the classification work depends on,
// which is why it gets its own module rather than another local regex.

export type ProjectStatusKind =
  | "ready-to-move"
  | "under-construction"
  | "new-launch"
  | "unknown";

const READY = /ready\s*to\s*move|\brtm\b|\bcompleted?\b|\bdelivered\b|possession\s*(given|done)/i;
const UNDER_CONSTRUCTION = /under\s*construction|\bongoing\b|nearing\s*completion|mid\s*stage/i;
const NEW_LAUNCH = /new\s*launch|pre\s*launch|\blaunch(ed|ing)?\b|upcoming/i;

/**
 * Classify a raw status string.
 *
 * Order matters. "Ready to Move" is checked first because a completed
 * project's copy sometimes still mentions its launch; and "under construction"
 * before "new launch" because "newly launched, under construction" is a real
 * feed value and the construction fact is the one that governs which modules
 * may render.
 */
export function projectStatusKind(status: string | null | undefined): ProjectStatusKind {
  const s = String(status ?? "");
  if (!s.trim()) return "unknown";
  if (READY.test(s)) return "ready-to-move";
  if (UNDER_CONSTRUCTION.test(s)) return "under-construction";
  if (NEW_LAUNCH.test(s)) return "new-launch";
  return "unknown";
}

export function isReadyToMove(status: string | null | undefined): boolean {
  return projectStatusKind(status) === "ready-to-move";
}

/**
 * May this project show possession-dependent content — an expected possession
 * date, a possession timeline, a value-at-possession projection, or a payment
 * plan tied to construction milestones?
 *
 * False for ready-to-move, because the wait is over, and false for unknown,
 * because the checklist is explicit that an unknown status must not generate
 * possession or investment assumptions. Guessing on a missing field is how a
 * completed project ended up with a three-year possession projection in the
 * first place.
 */
export function allowsPossessionContent(status: string | null | undefined): boolean {
  const kind = projectStatusKind(status);
  return kind === "under-construction" || kind === "new-launch";
}
