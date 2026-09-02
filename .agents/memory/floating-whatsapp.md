---
name: Floating WhatsApp behavior
description: Visibility and icon rules for the homepage WhatsApp action
---

The floating WhatsApp action should not appear on initial load or while the visitor scrolls down. It appears after the visitor has moved down the page and then scrolls upward, and hides again on downward scrolling or near the top.

**Why:** The control should support return navigation without immediately covering homepage content.

**How to apply:** Keep the hidden state non-interactive and out of keyboard order, animate visibility changes, use the recognizable WhatsApp logo, and preserve the existing `wa.me` destination.