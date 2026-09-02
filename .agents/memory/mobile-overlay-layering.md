---
name: Mobile overlay layering
description: How full-screen mobile overlays should avoid the homepage hero stacking context
---

Render full-screen mobile sheets and their backdrops through a portal attached directly to `document.body`.

**Why:** The homepage hero content creates its own stacking context. Increasing a descendant sheet's z-index cannot make it outrank body-level fixed controls such as the mobile navigation and floating contact button.

**How to apply:** Keep desktop panels inline, but portal mobile overlays to `body` after client mount. Give the portal layer a z-index above global fixed controls and verify with hit-testing at the bottom of the viewport.