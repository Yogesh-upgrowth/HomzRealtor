# Deployment

## SEO-00 — production was frozen 18 Sep → 19 Sep

**Symptom:** every deploy after `88a4983` failed. Eight commits sat unshipped,
including `ec7906c` (which removes the "#1 Trusted" badge, the 25,500+ customers
claim, the market snapshot and Homz Intelligence). The live homepage kept serving
all of them. The same failure had already happened once, on 8 Aug (`6a7e9a8`).

**Cause:** `88a4983` added a second cron to `vercel.json`:

```json
{ "path": "/api/cron/warm-cache", "schedule": "*/25 * * * *" }
```

Vercel's **Hobby plan only runs cron jobs once per day**. A sub-daily schedule
is rejected at build time, so the deployment never completed — it was not a code
error, which is why nothing in the app pointed at it.

**Fix applied (2026-09-19):** the warm-cache cron now runs daily at 04:00 UTC,
one hour after the existing status sync. Both crons are within Hobby's limits.

**If you move to Pro**, restore the original cadence by setting that schedule
back to `*/25 * * * *`. Note the warm-cache cron only ever papered over the real
problem: `/buy-property`, `/commercial` and `/project-listing` are
`force-dynamic` and parse the full listings feed (~48MB for sale) per cold
instance. Fixing that is the durable answer; the cron is not.

**Also worth confirming with Vercel:** Hobby is limited to non-commercial use
under their terms. HomzRealtor is a commercial site, so Pro is likely the
correct plan regardless of cron cadence.

## Verifying a deploy actually shipped

A green commit on `main` is not evidence the site changed. After pushing:

1. Check the Vercel dashboard for the deployment status, not just the commit.
2. Fetch a string you know the commit changed, e.g.
   `curl -s https://www.homzrealtor.com/ | grep -c "25,500"` — expect `0`.
3. If a deploy fails, Vercel comments on the PR; check there before assuming
   the change is live.

This matters because two separate audits (8 Aug, 19 Sep) both reported "fixed"
issues as still live, when the real problem was that no build had shipped.
