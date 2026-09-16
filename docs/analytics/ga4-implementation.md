# GA4 Implementation — Status

Tracks work against `HOMZ-GA4-DYNAMIC-EVENTS-2026-09-15.md` (the dynamic event tracking spec). Pragmatic first pass, explicitly scoped down from the full spec — see "Deliberately simplified" below.

## What was found before any code changed

- **The site's existing "GA4 integration" has never actually worked.** `components/GoogleAnalyticsTracker.tsx` called `window.gtag("config", "G-5C24236F2Z", ...)` on every route change, but the actual `googletagmanager.com/gtag/js` script that defines `window.gtag` was nowhere in the codebase — confirmed by searching the whole repo. That call has always been a silent no-op. **This site has never sent GA4 a single real event**, despite looking configured.
- No Google Tag Manager container is in use anywhere — this is (was meant to be) a direct-gtag integration. Per the spec's own instruction ("if the site already has a direct Google tag integration, retain one transport rather than adding GTM"), this fixes and extends that existing approach rather than introducing GTM.
- No consent-management mechanism existed at all (no cookie/consent banner anywhere in `components/`).
- `app/api/contact/route.ts` (the enquiry endpoint, used by at least 3 separate forms — the global modal, `Home/ExpertConsultation.tsx`, `Project/listing/EnquiryRail.tsx`) has no idempotency key and just forwards whatever a Google Apps Script webhook returns. `data.success` is the only "did this work" signal available.
- No seller/landlord pages or forms exist yet (DEV-07, separate SEO handoff work — still blocked on real business content).

## What's implemented now

- **`lib/analytics/schema.ts`** — the full parameter dictionary and per-event field allowlists from spec sections 2-5, as a runtime `validateEvent()` function: enforces known event names, known fields per event, enum values, the 100/300/420/1000-char length caps, the 25-populated-parameter budget, and drops `undefined`/`null`/empty-string values rather than sending placeholders.
- **`lib/analytics/consent.ts` + `components/Analytics/ConsentBanner.tsx`** — a real consent gate. Nothing in `gtag.ts` loads or fires before the visitor explicitly clicks Accept. Choice persists in `localStorage`.
- **`lib/analytics/gtag.ts`** — the actual fix: loads `gtag.js` for real (only after consent), initializes `window.dataLayer`, sends `send_page_view: false` (this app owns page views manually), and exposes `sendGaEvent(name, params)` — validates via schema.ts, silently drops invalid events (logging a safe reason in development only, never rejected values), never throws or blocks the caller's real action.
- **`lib/analytics/pageContext.ts`** — resolves `page_type`/`actor_intent`/`transaction_type`/`asset_class`/`city`/sanitized `page_location`/`page_title`/`page_referrer` from the route pattern, never from DOM text.
- **`components/GoogleAnalyticsTracker.tsx`** — rewritten to fire one `page_view` per real pathname change (deduped so query-only changes — filters, pagination — don't count), not on every render.
- **Full lead funnel wired into `components/FormComponent.tsx`** (the site's global enquiry modal): `lead_form_open` (on modal open), `lead_form_start` (first field change), `lead_form_submit` (valid submit attempt), `lead_form_error` (validation failure or API failure), `generate_lead` (only on `data.success`, guarded against double-firing on a double-click/duplicate callback within one modal session).

All of the above verified against a local production build: the consent-storage key and event names are present in the actual client JS bundle, the gtag script correctly does NOT appear in server-rendered HTML (confirming it can't load before consent), and the full site still builds and serves normally. **Full interactive behavior (does the banner actually appear on click, does GA4 DebugView show real events) was not verified in a live browser or a real GA4 property — that needs manual verification once deployed.**

## Deliberately simplified vs. the full spec

- **Consent is a hard gate, not full Google Consent Mode v2.** The spec's reference docs describe a default-denied/update-on-grant signal pattern that keeps `gtag.js` loaded at all times (for cookieless modeling while denied). This implementation instead never loads the script until consent is granted — simpler to reason about and verify without a live browser/Tag Assistant session, same practical privacy outcome, but loses the "conversion modeling for denied users" capability. Documented here as a follow-up, not implemented.
- **Mid-session consent withdrawal isn't wired.** Granting consent mid-session correctly starts tracking; clicking Reject after a prior Grant in the same page load doesn't stop an already-loaded script (the spec's `ga-disable-<id>` pattern). Low-risk gap since the banner only shows once per browser until a choice is made, but a real gap against the spec's own acceptance tests.
- **`form_id`/`lead_type`/`placement` are generic (`general_enquiry`/`callback`/`modal`) for all uses of the global form.** `FormContext.openForm()` takes no arguments, so every trigger point across the site (header, hero, property pages, footer) opens the identical modal with no way to distinguish *why*. Giving each placement its own `form_id`/`lead_type` needs extending `openForm()`'s signature and updating every call site — a real, larger change, not attempted here.

## Not yet wired (explicit, per the spec's own "list unavailable components" instruction)

- `search`, `filter_apply`, `sort_change`, `property_list_view`, `property_select`, `property_view` — the discovery/browsing funnel. Needs hooking into `PropertyListingPage.tsx`/`useListingsPage.ts` (search/filter/sort/list-view) and the property/project detail route factories (`property_view`). Not started.
- `contact_click` — phone/WhatsApp/email link activations across property pages. Needs locating every `tel:`/`wa.me`/`mailto:` link in the codebase and wrapping each with the event.
- `cta_click` — non-contact CTAs (Schedule Visit, article links to inventory, etc.).
- Section 5 secondary events (`property_save`, `property_compare`, `property_media_view`, `property_share`, `brochure_click`, `calculator_complete`) and section 6 optional extensions (`property_impression`, `faq_expand`, `article_read`) — schemas already defined in `schema.ts` so they'll validate correctly whenever wired, but nothing calls them yet. The spec itself calls these later-phase, not launch blockers.
- Seller/landlord event hooks — no such pages/forms exist in this repo (DEV-07 dependency).

## Owner inputs still needed before this is fully "production correct"

- **Confirm `G-5C24236F2Z` is actually the intended production GA4 property.** It was already hardcoded before this session; nobody has confirmed it's the right one, just that it's present. `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var overrides it if not.
- **A separate test GA4 property + test lead destination**, per the spec's own explicit requirement — none currently exists to verify against before real users hit this.
- **Confirm what `data.success` from the Apps Script webhook actually guarantees** (durably written to the sheet vs. just "request received") — `generate_lead` currently trusts this signal as-is.
- **A kill switch exists** (`NEXT_PUBLIC_ANALYTICS_ENABLED=false`) if this needs to be turned off without a code change.

## How to verify once deployed

1. Open the site in an incognito window, accept the consent banner, open GA4's **Realtime** report or **DebugView** (with `?_dbg=1`-style debug or a debug extension) for property `G-5C24236F2Z` — confirm `page_view` fires once per real navigation.
2. Submit the enquiry modal end to end — confirm `lead_form_open` → `lead_form_start` → `lead_form_submit` → `generate_lead` appear in that order, once each.
3. Reject consent in a fresh incognito window — confirm zero GA4 network requests fire (check the browser Network tab for `google-analytics.com`/`googletagmanager.com` calls).
