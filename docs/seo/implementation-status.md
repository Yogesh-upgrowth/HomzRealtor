# Homz SEO Implementation — Status

Tracks work against `HOMZ-CLAUDE-CODE-HANDOFF-2026-09-13.md`. One row per ticket; updated as each is done, not written once at the end.

## DEV-01 — Sitemap publication, route resolution, record lifecycle (2026-09-16)

**Root cause of the 39 known 404 URLs, found and fixed:** `lib/intelligence/get-property.ts` hardcoded `limit: 10_000` when fetching a property segment to resolve a detail-page slug. Live segments are now 20,957 (Sale) and 12,945 (Rent) records — every truncation-affected record is a real, correctly-slugged, still-live listing sitting past position 10,000 in feed order, silently excluded from ever matching. Verified against the live backend (now back online): fetched the real `ggnSaleProperties`/`ggnRentProperties` segments directly, confirmed every one of the 39 appendix URLs' underlying property IDs still exist with unchanged slugs at positions 9,644–19,639. Fixed by raising the limit to 25,000, matching the `UPSTREAM_LIMIT` convention already established in `lib/listings/segmentCache.ts` (SEO audit C-02, 2026-09-08) for the same reason. **Re-verified all 39 appendix URLs against a local prod build post-fix: 39/39 now return 200.**

One apparent second category turned out to be a false read from my own quick diagnostic (not a real second bug): two Rent listings share an identical last-8-character id-tail purely by coincidence of how MagicBricks IDs hex-encode; checking by tail alone made one look "moved," but the actual lookup matches on the *full* slug (title-slug + tail together), which still correctly disambiguates them. Both resolve correctly. Worth flagging as a latent risk in the slug scheme (last-8-chars isn't provably unique, only empirically hasn't collided *with a matching title* yet) — not fixed, since there's no current observable bug to fix, just documented here as a risk for future data growth.

**Other DEV-01 work:**
- **Shared eligibility/slug contract**: `app/sitemap.ts`'s Projects segment used to independently re-fetch raw city/category data and recompute its own inline slug regex — a second, driftable copy of `lib/intelligence/normalize.ts`'s `slugify()`, the one `getProjectBySlug` (route resolution) actually uses. Refactored to read through `getProjectsForCity()` instead, so the sitemap and route resolution now share one pipeline. Properties already shared this correctly via `slugForProperty()` — no change needed there.
  - Added `updated_at` to `NormalizedProject` (carrying the raw feed's `updatedAt` through the shared pipeline) so the sitemap's per-record `lastModified` didn't regress when it stopped reading the raw feed directly.
- **Durable `/sitemap.xml` index**: added `app/sitemap.xml/route.ts` — a real `<sitemapindex>` at the canonical path (Next's `generateSitemaps()` only auto-serves that path for a single segment; this project has 7). `robots.txt` now lists it first, alongside (not instead of) the 7 direct segment entries GSC uses for per-segment indexation reporting.
- **Reconciliation command**: `scripts/check-sitemap-404s.mjs` (`npm run check:sitemap [baseUrl] [maxUrls]`) — fetches all 7 live segments, dedupes/validates every `<loc>` is the canonical origin, then HEAD-checks each URL at concurrency 8 with retries, reporting redirects/404s/410s/other-errors/unverified separately. Confirmed it reproduces the handoff's own reported total (38,820 unique URLs) exactly. Supports checking a preview deployment's pages against the real canonical `<loc>` values (swaps origin, keeps the reported URL canonical) for DEV-12's release gate.
- **lastmod determinism**: already real per-record dates from the shared pipeline (not request-time) — no change needed, verified via live output.

**Not done / deferred:** the full 38,820-URL crawl (only sampled + the 39 known cases were checked here, per DEV-00's note that a full run is a DEV-12 release-gate step, not a per-ticket requirement); a formal "sold/let record" retention policy (distinguishing delisted-but-worth-a-historical-page from genuinely-gone) — no evidence yet of that case actually occurring, so nothing to build against.

## DEV-00 — Baseline (established 2026-09-16)

### Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS 4. `npm` as package manager.
- No CMS/database for listings — property/project data is fetched at request/build time from an external upstream (`homz-scrape.vercel.app`), itself a separate Vercel project. Auth/admin/wishlist/agent-profile data lives in MongoDB (`lib/mongodb.ts`).
- Deployment: Vercel, Hobby plan, auto-deploy on push to `main`. One cron (`/api/status/sync`, daily).

### Commands

| Command | Status |
|---|---|
| `npx next build --webpack` | **Passes.** ~2m26s locally. (Plain `npm run build` uses Turbopack and OOMs on this machine — known issue, use `--webpack`.) |
| `npx eslint .` | **Fails as a pre-existing baseline**: 24 errors, 10 warnings, all `@typescript-eslint/no-explicit-any` / unused-var / stale eslint-disable. None touch code changed in this session. Full list captured; not reproduced here to avoid this doc going stale as files change. |
| Type-check | No standalone `tsc --noEmit` script; type errors currently only surface via `next build`, which passes. |
| Test | **No test framework installed** — no Jest/Vitest/Playwright config, no `test` script in `package.json`. DEV-12 requires wiring one in; this is a gap, not a regression. |
| Lint script | `npm run lint` exists and runs `eslint` with no `--max-warnings`, so it currently exits non-zero (matches the 24 errors above). |

### Route map (captured 2026-09-16)

44 page routes, 25 API routes. Notable families:

- Transaction hubs + detail + pagination: `/buy-property`, `/rent-property`, `/commercial`, `/pg-property`, each with `[city]/[slug]`, `page/[page]`, and (buy only) `[city]/[slug]/page/[page]` facet-pagination variants.
- Projects: `/project-listing`, `/project-listing/[city]`, `[city]/[slug]`, `[city]/[slug]/flat`, `[city]/sectors`, `[city]/sectors/[sector]`, `[city]/page/[page]`, `compare/[city]/[slugA]/[slugB]`.
- Content: `/blog`, `/blog/[slug]`, `/property-insights`, `/property-insights/[slug]`, `/developer`, `/developer/[slug]`.
- Utility/identity: `/about-us`, `/contact`, `/faq`, `/terms`, `/privacy-policy`, `/disclaimer`, `/api-docs`, `/plots-and-lands`.
- Auth/account (noindex territory, not audited here): `/login`, `/signup`, `/account`, `/account/wishlist`, `/dashboard*`, `/admin*`.
- API: `/api/listings` (public, unauthenticated, powers all four transaction hubs' interactive filter UI — see CPU note below), `/api/contact`, `/api/status/*`, `/api/wishlist`, plus auth/admin/agent-profile/properties CRUD routes (session-gated, not SEO-relevant).
- `app/sitemap.ts` (7 segments via `generateSitemaps()`), `app/robots.ts`, `app/openapi.json/route.ts`.

### Current robots.txt (live, captured against local prod build)

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /project-listing/compare/
[+ explicit allow/disallow rules for named AI crawlers]

Sitemap: https://www.homzrealtor.com/sitemap/{projects,sectors,developers,buy,rent,commercial,content}.xml
```

`/project-listing/compare/` disallow was added 2026-09-12 for cost reasons (see "Active CPU baseline" below) — **this is the exact conflict DEV-03 flags** (noindex page blocked from the crawler that would read the noindex tag). Tracked, not yet resolved — needs a decision before DEV-03 work starts.

### Sitemap state (captured 2026-09-16)

- `homz-scrape.vercel.app` (the upstream data backend) was returning `402 Payment Required` as of 2026-09-12 (its own separate Vercel usage-limit pause); **confirmed back to `200` as of this baseline**, 2026-09-16.
- `/sitemap/buy.xml` returns `200`, 5.26MB — consistent with real ~21K Sale listings.
- This baseline does **not** include a full crawl of all 7 sitemap segments or the 39 known-404 URLs from the handoff appendix — that reconciliation is DEV-01 acceptance work, not DEV-00.

### Sample metadata (captured live, `/buy-property`)

```html
<title>Buy Property in Gurgaon — Price, Photos &amp; Floor Plans</title>
<meta name="description" content="Resale and new-launch properties for sale in Gurgaon — filter by property type, BHK, budget, and possession status."/>
<link rel="canonical" href="https://www.homzrealtor.com/buy-property"/>
```

Matches "keep improvements" section 3 of the handoff (clean hub metadata already in place).

### Known pre-existing failures (baseline, not regressions)

- Lint: 24 `no-explicit-any` errors (list above).
- No automated test suite exists yet (DEV-12 scope).
- `docs/seo/` did not exist before this file.

## Active CPU baseline (tracked per explicit instruction alongside this SEO work)

Current measured usage: **~25 min/day** Active CPU. Target: **under 10 min/day**. This section is maintained across every subsequent DEV ticket — no ticket below should land without checking it against this.

Already fixed this cycle (2026-09-12, before this handoff arrived):
- Sitemap segments were `force-dynamic` (recomputed full catalogue on every crawl hit) → now `revalidate=3600`.
- Pagination routes accepted unbounded page numbers, paying a full ~48MB fetch+parse before 404ing → now bounded (`MAX_REASONABLE_PAGE`).
- `/project-listing/compare/` combinatorial crawl space (real n²/2 URL space, ~1,165+ projects) → blocked in robots.txt.

**Fixed 2026-09-16: `/api/listings`** (`app/api/listings/route.ts`) — powers the interactive filter UI on all four transaction hubs, so it ran on **real user traffic**, not bot noise. It previously re-sorted the full segment twice (`sortByReraFirst(sortByImageFirst(...))`, up to ~21,000 records) and recomputed facets over the whole unfiltered segment again, on every single request, regardless of what was actually requested. `lib/listings/segmentCache.ts` now computes both once per segment refresh (same 1h TTL as the raw fetch) and caches them alongside it; `/api/listings` and `PaginatedListingPage.tsx`'s `getAllSorted()` (used by all buy/rent/commercial pagination pages) both read the cached result instead of recomputing. Verified against the local prod server — same output, repeat calls ~49ms. No behavior change, pure cost reduction.

**Fixed 2026-09-16: `lib/intelligence/projects.ts`** — same redundancy pattern, one level up. `getProjectsForCity()` cached the raw upstream fetch but re-ran `normalizeProject()` over the whole city's project list from scratch on every call; `buildDeveloperIndex()` (backing `getAllBuilders`/`getBuilderBySlug`/the sitemap's developers segment) rebuilt its full 5-city index from scratch every call too. The homepage alone calls `getProjectsForCity('ggn')` indirectly 3-4 times in one render (`getAllBuilders`, `getSectorsForCity`, `getNewLaunchProjects`, `getFeaturedProjects`) — bounded by the homepage's own 6h ISR revalidate (confirmed via build output: `/` is static, revalidate 6h, not per-request), so smaller in absolute terms than the `/api/listings` fix, but still real waste on every regeneration. Both now cached (30min TTL, matching the underlying raw-fetch cache). Verified: `/`, `/developer` (576 real builders, unchanged), `/project-listing/gurgaon`, `/project-listing/gurgaon/sectors` all return 200 with correct output against a local prod build.

Ruled out: `lib/intelligence/news.ts` — small payload, already properly covered by Next's own fetch data cache (well under the 2MB ceiling), negligible compute. Not yet investigated: AI content generation (`lib/intelligence/content.ts`) cache-hit rate in practice, and ISR regeneration cost across real (non-bot) traffic to individual detail/listing pages generally.

## Ticket status

| Ticket | Status |
|---|---|
| DEV-00 | Done — this document |
| CPU fix: `/api/listings` + `getAllSorted` cache sort/facets | Done 2026-09-16 |
| CPU fix: `getProjectsForCity`/`buildDeveloperIndex` cache normalization | Done 2026-09-16 |
| Backend redeploy: `Homz-Scrape`'s already-committed Cache-Control fix | Done 2026-09-16 |
| DEV-01 | Done — see section above |
| DEV-02–12 | In progress / not started |
