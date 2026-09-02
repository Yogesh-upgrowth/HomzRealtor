---
name: Mobile overlay layering
description: How full-screen mobile overlays should avoid the homepage hero stacking context
---

Render full-screen mobile sheets and their backdrops through a portal attached directly to `document.body`.

**Why:** The homepage hero content creates its own stacking context. Increasing a descendant sheet's z-index cannot make it outrank body-level fixed controls such as the mobile navigation and floating contact button.

**How to apply:** Keep desktop panels inline, but portal mobile overlays to `body` after client mount. Give the portal layer a z-index above global fixed controls and verify with hit-testing at the bottom of the viewport.

Public-facing dialogs should default to a bottom sheet below the desktop breakpoint and retain a centered dialog presentation on larger screens.

**Why:** The mobile bottom-sheet interaction is the confirmed product convention, including authentication flows.

**How to apply:** Use a rounded top edge, drag handle, dimmed backdrop, internal overflow, safe-area bottom padding, background scroll lock, and backdrop/Escape dismissal.

Compact mobile dialog content should fit without sheet scrolling at a standard phone viewport. Longer content may use a tall internally scrollable sheet; navigation drawers and media lightboxes keep their specialized presentation.

**Why:** The site-wide rule is content-sensitive, not a blanket replacement of every overlay.

**How to apply:** Audit content length before choosing the variant. Keep compact forms tightly spaced, but preserve internal overflow as a small-screen safety fallback.