---
name: Preview workflow ports
description: The local web preview's workflow and application port convention
---

Web preview workflows use port 5000. Application start scripts should honor `PORT` and default to 5000 so workflow restarts reliably expose the preview.

**Why:** A hardcoded port mismatch lets the server start successfully while the workflow reports that it never opened its configured port.

**How to apply:** When changing or restoring npm dev/start scripts, use `${PORT:-5000}` (or an equivalent framework configuration) and bind to `0.0.0.0`.