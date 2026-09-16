# Homz SEO Implementation — Status

Tracks work against `HOMZ-CLAUDE-CODE-HANDOFF-2026-09-13.md`. One row per ticket; updated as each is done, not written once at the end.

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

Not yet investigated: ISR regeneration cost across real (non-bot) traffic to detail/listing pages, AI content generation (`lib/intelligence/content.ts`) cache-hit rate, and `lib/intelligence/news.ts` (6h revalidate). Will fold into the relevant DEV ticket as touched.

## Ticket status

| Ticket | Status |
|---|---|
| DEV-00 | Done — this document |
| CPU fix: `/api/listings` + `getAllSorted` cache sort/facets | Done 2026-09-16 (ahead of DEV-01, per explicit request) |
| DEV-01–12 | Not started |
