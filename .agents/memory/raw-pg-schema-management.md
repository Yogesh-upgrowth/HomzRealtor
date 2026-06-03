---
name: Raw pg schema management (no ORM)
description: How DB schema changes are made and reach prod in this Next.js + raw pg app
---

This app uses raw `pg` (lib/db.ts) — there is NO ORM, NO drizzle.config, NO
migration files. The schema source of truth is effectively the live development
database itself.

**Rule:** to add/alter a column, run the DDL directly against the dev DB
(e.g. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`). The column reaches prod
via Replit's publish-time schema diff (dev vs prod), applied when the user
publishes. Do NOT write migration scripts or run DDL against prod.

**Why:** there is no schema file to edit, so the dev DB is the only declaration.
The app reads with `SELECT *` (lib/projects/queries.ts) so adding nullable
columns is non-breaking.

**Scheduled jobs vs the website:** the website is the primary deployment.
A periodic job (e.g. `scripts/ingest.mjs` via `npm run ingest`) must be a
SEPARATE Replit Scheduled Deployment created in the Publish UI — do not point
the primary `.replit` [deployment] at the script, or you break the website
deployment. `deployConfig` writes only the primary deployment, so don't use it
for the scheduled job here.
