# Homz SEO Implementation — Status

Tracks work against `HOMZ-CLAUDE-CODE-HANDOFF-2026-09-13.md`. One row per ticket; updated as each is done, not written once at the end.

## DEV-05 — Intent-aware metadata and truthful schema (2026-09-16)

**Duplicate-title root cause found and fixed**: `buildPropertyTitle` only ever used bedroom count + type + location (e.g. "3 BHK Apartment, Sector 45 Gurgaon") — many genuinely different listings in the same sector/bedroom count share that exact combination, which is what produced the handoff's confirmed 18-of-83 duplicate-title groups. Added `extractProjectName()` (`lib/intelligence/property-view.ts`): checks a structured `"Project"` specification field first (present on ~2% of listings sampled), falls back to extracting "... in {Project}, {Sector}" from the raw title text (~25% of titles sampled), returns `null` — never a guess — when neither is found. `buildPropertyTitle`/`buildPropertyDescription` now include it when available, following the handoff's own suggested pattern ("{config} for {Sale/Rent} in {Project}, {Sector} | Homz"); the previous fixed 52-58 char truncation gate was relaxed to a soft cap per the handoff's explicit "reject fixed character build gate" guidance.

**Missing listing-specific schema, confirmed and fixed**: `PropertyDetailView.tsx` had zero `<script type="application/ld+json">` output — confirmed by grep across the whole `components/` tree; hub-level `CollectionPage`/`ItemList` schema exists but nothing per-listing. Added `PropertyJsonLd.tsx` (`BreadcrumbList` + `RealEstateListing` + `FAQPage` when real FAQs exist), wired into `propertyDetailRoute.tsx`. No `Offer`/price block when the listing has no confirmed price — matches the handoff's explicit "Unknown price is not an Offer with zero price" guardrail. Verified live: `"@type":"RealEstateListing"` present in a real property page's rendered HTML.

## DEV-06 — Mobile image delivery (2026-09-16, partial — logic only, not asset rights)

**Dual hero fetch, confirmed and fixed**: `components/Hero.tsx` renders two `<Image priority>` elements (desktop + mobile, CSS-hidden per breakpoint) — `priority` injects a `<link rel="preload">` regardless of which is actually visible, so both were fetched on every device (matches the handoff's own measured evidence: "both mobile and desktop heroes downloaded"). next/image has no media-query-aware preload for this "different photo per breakpoint" pattern in this version. Since the audit specifically measured mobile LCP (7.04s), kept `priority` only on the mobile hero — the desktop one still renders via the same CSS swap, just no longer preloaded with the same urgency. Verified live: exactly 1 hero `<link rel="preload">` now present (was 2).

**Not done**: asset-rights/licensing (the broken best-areas-guide image, competitor-sourced photos) — needs real licensed replacements or owner confirmation of usage rights, not a code fix. Below-fold carousel/discovery-image deferral was not audited this pass.

## DEV-10 — Blog/content hygiene (2026-09-16, partial — the two confirmed items only)

Both confirmed items from the handoff fixed directly in `lib/content/blog/best-3-bhk-flats-in-gurgaon.ts`:
- **Math error**: the article claimed the 3→4 BHK price jump (77%) was "proportionally steeper" than the 2→3 BHK jump (108%) — backwards, since 108% > 77%. Corrected the claim to identify the 2→3 BHK jump as the steeper one (the underlying percentages were already computed correctly from the stated medians; only the comparative claim was wrong).
- **Wrong internal link**: two CTAs whose own anchor text names "3 BHK" specifically ("Browse live 3 BHK listings", "Browse 3 BHK Listings") linked to the generic `/buy-property` hub instead of the real, already-working `/buy-property/gurgaon/3-bhk` facet hub. Fixed both; left the one genuinely-generic anchor ("Browse all Gurgaon property listings") pointing at the generic hub, since that one is correctly generic by its own wording.

**Not investigated this pass**: the ₹2 Cr vs ₹2.92 Cr "median comparison" error the handoff cites — checked `best-property-investment-in-gurgaon-under-2-crore.ts` (the likely candidate) and found it already correctly frames Golf Course Extension Road's ₹2.92 Cr median as *above* the ₹2 Cr budget line, not contradicting it — this appears to have already been fixed in an earlier session, not a currently-live bug. Category-archive hygiene, freshness dates, and topic-overlap review (the rest of DEV-10's scope) not started.

## DEV-04 — Coherent server-rendered inventory (2026-09-16)

**Duplicate-grid bug, confirmed and fixed** on all three of `/buy-property`, `/rent-property`, `/commercial`: `PropertyListingPage` (client component, fetches its own page-1 grid on mount — 8 desktop/4 mobile) rendered alongside `ListingPreviewSection` (server component, showed the first 24 results) — a real visitor with JS enabled saw the same top listings twice. Fixed by:
- `PropertyListingPage` now accepts `initialResults`/`initialTotal`/`initialFacets` props; `hooks/useListingsPage.ts` seeds its state from them and skips the one redundant client fetch when they still match the current (no-filter, page-1, desktop-default) key.
- The three hub pages became `async` server components, fetching the first 8 results via the already-cached `getAllSorted()` and passing them in directly — so those 8 cards are now genuinely present in the server-rendered HTML, not just after a client fetch.
- `ListingPreviewSection` gained a `skip` param; the hubs now pass `skip={8}` so it covers records 8–24 instead of 0–24 — together, still the exact same `PAGE_SIZE=24` "page 1" the `/page/2` route boundary already assumes, just with no record ever rendered twice.
- Verified against a local prod build: each hub's server-rendered HTML now contains exactly 24 unique property-detail links (was 24 total but with real overlap between the two mechanisms once hydrated) — confirmed via a script parsing the actual HTML, not assumed.
- Note: full client-side hydration/interaction behavior (filter clicks, pagination) was **not** verified in a real browser — only the server-rendered HTML and the (unit-testable) hook logic were checked. Flagging this explicitly per the "do not invent successful test results" guardrail.

**PG hub — confirmed genuinely empty, not a one-session fluke**: fetched the live `Pg` segment directly; it has zero real records right now. Per the handoff's own guidance for this exact case, added a reversible, automatic (not manually-flagged) fix: `app/pg-property/page.tsx`'s `generateMetadata` now sets `noindex,follow` only while inventory is actually empty, and `app/sitemap.ts`'s `buildContentSegment` excludes `/pg-property` under the same condition — both revert to normal the moment real PG listings exist in the feed, no flag to remember to flip back. Verified live: `<meta name="robots" content="noindex, follow">` present; `pg-property` absent from `/sitemap/content.xml`.

**Project selector 500-record cap, confirmed and fixed**: `components/PropertyListing/ProjectListingClient.tsx` (the interactive `/project-listing` city browser) still hardcoded `limit: 500` per category — the exact truncation bug SEO audit C-02 (2026-09-08) already fixed everywhere else in the codebase (`homzDataUrl`'s own default, `lib/intelligence/projects.ts`'s `fetchCityRaw`), just missed in this one client component. Its own comment claiming it "matches fetchCityRaw" was stale/wrong — `fetchCityRaw` hasn't capped at 500 since that same fix. Raised to 5000, matching the established convention. Given ~2,098 combined projects confirmed live for Gurgaon, this was silently truncating hundreds of real projects from the interactive selector specifically.

**Not done / deferred:** a full graph report identifying orphaned eligible detail records (would need the full-site crawl `scripts/check-sitemap-404s.mjs` supports but wasn't run exhaustively — see DEV-01's own note on this); formal mobile filter/pagination interaction tests (no test framework yet — DEV-12 scope, and no browser available to verify by hand either).

## DEV-03 — Crawler, comparison and canonical rules (2026-09-16)

**The core conflict**: this ticket asks for compare pages to be crawlable (so Google can see their `noindex` tag and cleanly deindex stale ones) with the pair-generation bounded first. The 2026-09-12 session had done the opposite — blocked `/project-listing/compare/` entirely in `robots.txt` — for real, measured cost reasons (see the CPU-baseline section below). Resolving this required an actual design, not just flipping the block back:

- Added `getComparePairKeys()` (`lib/intelligence/projects.ts`) — computes the exact set of project pairs actually linked from real pages (`ProjectIntelligenceSections.tsx`'s "More by {builder}", up to 6 cross-city, and "Similar Projects", up to 3 same-city sector/category match) via one grouped O(n) pass, cached 30 min. **Benchmarked before committing to this approach**: the naive alternative (calling the existing per-project `getBuilderProjects`/`getSimilarProjects`/`getSectorProjects` helpers once per project, ~7,500+ times each) costs ~625ms CPU; the grouped version is sub-millisecond.
- The compare route now calls this as a cheap gate *before* either expensive `getProjectBySlug` lookup, in both `generateMetadata` and the page component. Deliberately did **not** enumerate the pairs via `generateStaticParams` — with ~11,000+ real pairs (×2 for slug ordering), that would mean Next tries to statically pre-render all of them at build time, i.e. the same class of build-time OOM `MAX_STATIC_PAGES` was already added elsewhere to avoid. `generateStaticParams` stays `[]`; unlisted pairs still render on-demand via ISR after passing the gate, same as before, just now gated.
- Verified live against a local prod build: a real linked pair (`emaar-emerald-floors-premier` × `m3m-latitude`, pulled from that page's own actual rendered links) returns 200 in 165ms; a garbage pair and a real-but-unrelated pair both 404 in ~40ms, before any project lookup runs.
- `robots.txt`'s `/project-listing/compare/` disallow removed now that the route gates itself.

**Anthropic crawler tokens** (explicit user decision, 2026-09-16): the handoff's own reference confirms Anthropic splits crawlers the same way OpenAI does — `Claude-SearchBot` (search), `Claude-User` (user-retrieval), `ClaudeBot` (possible training) — but `robots.txt` only allowed `ClaudeBot`, missing the two retrieval tokens entirely. Since I'm Claude, and this is specifically about how my own crawler gets treated, I flagged it rather than deciding it silently. Confirmed: allow `Claude-SearchBot`/`Claude-User`, block `ClaudeBot` — matching the training-vs-retrieval split already applied to every other vendor (GPTBot blocked, OAI-SearchBot/ChatGPT-User allowed).

**Not done / deferred:** a formal route-policy table with tests (no test framework exists yet — DEV-12 scope); `llms.txt` (explicitly optional per the handoff itself, "not a required AI-search format or release blocker" — left unimplemented rather than fabricated). UTM canonicalization and page-one-alias redirects were already correct (verified by reading, not just assumed) — no change needed.

## DEV-02 — Property data validation (2026-09-16)

All three evidence items the handoff cites were confirmed live against the real backend (not assumed) before fixing:

- **Commercial/Residential misclassification**: M3M Latitude, SS Camasa, DLF The Summit are all fetched from the `ggnCommercialProjects` segment, yet all three are unambiguous residential apartment projects ("3-4 BHK apartments", "512 spacious homes", "residential towers" — confirmed via their raw `aboutProject` text). Fixed in `lib/intelligence/normalize.ts`: `BHKType` containing "BHK" is a reliable, narrow signal (that configuration format only ever describes a residential unit) — `normalizeProject()` now corrects `property_category` from Commercial to Residential when both are true. **One-directional only** (never Residential→Commercial — that direction has far weaker evidence, e.g. incidental mentions of "commercial hubs nearby"). Verified live: M3M Latitude's "Property Type" chip now reads "Residential".
- **Conflicting RERA IDs**: ATS Triumph Villas' structured `reraId` field says `RERA-GRG-2073-2025`, while its own `aboutProject` narrative text separately asserts "...is registered under GGM/1051/783/2026/23" — a different number. Which is actually correct is a regulatory-lookup question this codebase can't answer (owner-queue item), so rather than guess, added `redactEmbeddedRegulatoryIds()` (`lib/intelligence/normalize.ts`, also applied in `lib/intelligence/property-view.ts` for individual listings) which strips only the embedded "is registered under X" clause from free text, since the app already has one dedicated, status-aware place (`rera_id`/`rera_status`) to assert a registration number. Verified live: the contaminated `GGM/1051/783/2026/23` is gone from the page; the FAQ still correctly and consistently shows `RERA-GRG-2073-2025` throughout.
- **Contaminated selector text**: an Ambience Creacions rental (id ending `38373139`) shows a "Super Built-up Area" specification of `"1350 sqft sqft sqyrd sqm acre bigha hectare marla kanal biswa1 biswa2 ground aankadam rood chatak kottah marla cent perch guntha are katha gaj killa kuncham ₹ 56/sqft"` — an entire scraped `<select>` dropdown's unit-option list concatenated onto the real value. Added `sanitizeSpecifications()`/`looksLikeUnitSelectorDump()` (`lib/intelligence/property-view.ts`) — filters out any specification value naming 3+ distinct land/area units (a real value never legitimately does), rather than trying to guess which token was the real one. The clean area is already shown separately via `areaText`/the snapshot chip, so dropping the contaminated row loses no real information. Verified live: the contaminated spec row no longer renders.

**Also found and fixed, not explicitly named in the handoff's evidence but the same class of bug**: `extractSizeRange()` discarded the area's unit entirely, and `normalizeProject()` then hardcoded `size_unit: "sq.ft"` whenever *any* size text was present — silently mislabeling a project actually measured in Sq.Yd, Sq.M, or acres (real listings in this same feed do use Sq.Yd, per the property-detail examples fixed in DEV-01). Now detects the actual unit from the text (`sq.ft`/`sq.yd`/`sq.m`/`acre`) and returns `null` when none is confirmed. `FlatOverview.tsx` had its own separate silent `sizeUnit || "sq.ft"` fallback that would have re-introduced the same guess — fixed to omit the unit suffix entirely rather than fabricate one when unconfirmed.

**Not done / deferred (owner-dependent per the ticket's own guardrails):** which of the two RERA numbers on ATS Triumph Villas is actually correct (regulatory lookup); the 1,950 name-based project/buy overlaps (the handoff itself says this "does not prove all pairs are duplicates" — needs identity/traffic evidence to resolve individual cases, not a blanket rule); provenance/last-confirmed-fact tracking across the data model (a larger schema change, not attempted here).

## DEV-01 — Sitemap publication, route resolution, record lifecycle (2026-09-16)

**Root cause of the 39 known 404 URLs, found and fixed:** `lib/intelligence/get-property.ts` hardcoded `limit: 10_000` when fetching a property segment to resolve a detail-page slug. Live segments are now 20,957 (Sale) and 12,945 (Rent) records — every truncation-affected record is a real, correctly-slugged, still-live listing sitting past position 10,000 in feed order, silently excluded from ever matching. Verified against the live backend (now back online): fetched the real `ggnSaleProperties`/`ggnRentProperties` segments directly, confirmed every one of the 39 appendix URLs' underlying property IDs still exist with unchanged slugs at positions 9,644–19,639. Fixed by raising the limit to 25,000, matching the `UPSTREAM_LIMIT` convention already established in `lib/listings/segmentCache.ts` (SEO audit C-02, 2026-09-08) for the same reason. **Re-verified all 39 appendix URLs against a local prod build post-fix: 39/39 now return 200.**

One apparent second category turned out to be a false read from my own quick diagnostic (not a real second bug): two Rent listings share an identical last-8-character id-tail purely by coincidence of how MagicBricks IDs hex-encode; checking by tail alone made one look "moved," but the actual lookup matches on the *full* slug (title-slug + tail together), which still correctly disambiguates them. Both resolve correctly. Worth flagging as a latent risk in the slug scheme (last-8-chars isn't provably unique, only empirically hasn't collided *with a matching title* yet) — not fixed, since there's no current observable bug to fix, just documented here as a risk for future data growth.

**Other DEV-01 work:**
- **Shared eligibility/slug contract**: `app/sitemap.ts`'s Projects segment used to independently re-fetch raw city/category data and recompute its own inline slug regex — a second, driftable copy of `lib/intelligence/normalize.ts`'s `slugify()`, the one `getProjectBySlug` (route resolution) actually uses. Refactored to read through `getProjectsForCity()` instead, so the sitemap and route resolution now share one pipeline. Properties already shared this correctly via `slugForProperty()` — no change needed there.
  - Added `updated_at` to `NormalizedProject` (carrying the raw feed's `updatedAt` through the shared pipeline) so the sitemap's per-record `lastModified` didn't regress when it stopped reading the raw feed directly.
- **Durable `/sitemap.xml` index — added, then reverted the same window**: tried a real `<sitemapindex>` at `app/sitemap.xml/route.ts` (Next's `generateSitemaps()` only auto-serves that path for a single segment; this project has 7). Broke the actual Vercel production build: Next.js/Turbopack reserves the literal name `sitemap.xml` for its own metadata-route conventions, and creating a route at that exact path fails with "Conflicting route and metadata at /sitemap.xml" — caught by Vercel's build (which uses Turbopack) but **not** by this repo's own `--webpack` verification builds, which is how it shipped once before being caught. Removed; the 7 direct segment entries in `robots.txt` remain the actual index (already documented as a Google-supported equivalent). **Process note**: verify any future change touching Next's reserved file-routing conventions (`sitemap.xml`, `robots.txt`, `favicon.ico`, `manifest.json`, `opengraph-image`, etc.) with a plain `npx next build` (Turbopack, matching Vercel) before pushing, not only `--webpack`.
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
| DEV-02 | Done — see section above (3 evidence items + 1 related bug fixed) |
| DEV-03 | Done — see section above (compare-page gate + crawler tokens; route-policy table and llms.txt deferred) |
| DEV-04 | Done — see section above (duplicate grid, PG noindex, selector 500-cap; full orphan-graph crawl deferred) |
| DEV-05 | Done — see section above (duplicate titles, missing listing schema) |
| DEV-06 | Partial — dual hero fetch fixed; asset rights not code-fixable |
| DEV-07 | Blocked — needs real seller/landlord process, fee and inventory content from owner |
| DEV-08 | Not started — form/validation logic is fixable; CRM delivery needs owner credentials |
| DEV-09 | Not started — config wiring is fixable; real identity data needs owner input ([[company-info-pending]]) |
| DEV-10 | Partial — the 2 confirmed items fixed; category/freshness/topic-overlap review not started |
| DEV-11–12 | Not started |
