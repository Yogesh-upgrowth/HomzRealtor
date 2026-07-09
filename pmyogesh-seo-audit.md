# SEO Audit — pmyogesh.com

**Date:** 8 July 2026
**Audited by:** Intekhab (upGrowth Marketing)
**Site:** https://pmyogesh.com — personal brand / consulting site for Yogesh Yadav (Product Growth & Monetisation Consultant)
**Stack observed:** Vite + React single-page app (SPA), hosted on Vercel

---

## Executive summary

The site has well-written meta tags and unusually good structured data (JSON-LD) — but almost none of it matters right now, because of two blocking problems:

1. **Only the homepage exists as far as Google is concerned.** Every other page (`/blog`, `/work`, `/case-studies`, `/contact`, and all blog/case-study detail pages) returns an HTTP **404 from the server**. They only work when a user navigates there by clicking inside the app. Google, LinkedIn previews, and anyone opening a shared link get a "not found" error.
2. **The entire site content is rendered by JavaScript.** The HTML Google first downloads contains zero content — no headings, no text, just an empty `<div id="root">`. Google can eventually render JS, but it's slower and less reliable; Bing, social media scrapers, and AI crawlers see a blank page.

On top of that, **social sharing is broken in an embarrassing way**: the share image and Twitter handle are Replit's defaults, so sharing pmyogesh.com on LinkedIn/WhatsApp shows Replit's logo instead of Yogesh's brand.

There is also **no sitemap.xml and no robots.txt** (both 404).

**Bottom line:** fix the routing 404s and social image first (days, not weeks), then invest in pre-rendering. Until then, blog posts and case studies are invisible to search — the content marketing effort earns zero organic traffic.

---

## Critical issues (blockers — fix first)

### 1. Internal pages return 404 from the server
| URL | Server response |
|---|---|
| `/` | 200 OK |
| `/blog` | **404** |
| `/work`, `/case-studies`, `/contact` | **404** (same SPA routing gap) |
| `/blog/<any-post>`, `/case-study/<any>` | **404** |

The app defines 8 routes internally (`/`, `/blog`, `/blog/:slug`, `/case-studies`, `/case-study/:slug`, `/contact`, `/work`, `/work/:slug`) but the Vercel deployment has no SPA fallback rewrite, so direct visits to any route other than `/` hit a real 404.

**Impact:** Google cannot index any page except the homepage. Shared links to posts break. Refreshing the browser on any inner page breaks.
**Quick fix (1 line):** add `vercel.json` with a rewrite of all paths to `/index.html`. This makes pages load (200) but they're still JS-rendered — see issue 2.
**Proper fix:** see recommendation R1.

### 2. Fully client-side rendered — empty HTML
The server HTML body is just `<a href="#main-content">Skip to content</a><div id="root"></div>`. No H1, no text, no links. All content, including the blog posts, arrives only after JavaScript executes.

**Impact:** delayed/partial indexing on Google; effectively invisible to Bing, social scrapers, and AI/LLM crawlers (increasingly a real discovery channel for consultants).
**Fix:** pre-render or server-render (recommendation R1).

### 3. No sitemap.xml and no robots.txt
Both return 404. Without a sitemap Google has no way to discover blog posts (which, per issue 1, it can't crawl by following links either — the links don't exist in the HTML).

**Fix:** generate a sitemap listing all static routes + every blog/case-study slug; add a robots.txt that references it; submit in Google Search Console.

---

## High-priority issues

### 4. Social share image and Twitter handle belong to Replit
```html
<meta property="og:image" content="https://replit.com/public/images/opengraph.png" />
<meta name="twitter:image" content="https://replit.com/public/images/opengraph.png" />
<meta name="twitter:site" content="@replit" />
```
The Organization logo in the structured data also points to the Replit image. Anyone sharing the site on LinkedIn/WhatsApp/X sees Replit branding, not Yogesh's.

**Fix:** create a branded 1200×630 OG image, host it on pmyogesh.com, update all four references (og:image, twitter:image, twitter:site, Organization.logo in JSON-LD).

### 5. www and non-www both serve the site with no redirect
`https://pmyogesh.com` and `https://www.pmyogesh.com` both return 200. The canonical tag (points to non-www) partially mitigates duplicate-content risk, but the standard fix is a 301.

**Fix:** in Vercel domain settings, set `www.pmyogesh.com` to redirect (301/308) to `pmyogesh.com`. (HTTP→HTTPS redirect already works correctly.)

---

## Medium-priority issues

### 6. Favicon / profile image is a raw screenshot
The favicon, apple-touch-icon, and the Person image in structured data all point to
`/attached_assets/Screenshot_2024-08-25_at_11.05.00_AM_1768743221046.png` — a screenshot with a machine-generated filename, not a proper square icon.
**Fix:** export a real favicon set (32px/180px/512px) and a professional headshot with a descriptive filename (e.g. `yogesh-yadav.jpg`).

### 7. Structured-data SearchAction points to a 404
The WebSite JSON-LD declares a site search at `https://pmyogesh.com/blog?q={search_term_string}` — a URL that currently 404s.
**Fix:** remove the SearchAction block (simplest) or make the blog search actually work at that URL.

### 8. Title tag slightly too long
`Yogesh Yadav | Product Growth & Monetisation Consultant | Fintech & Consumer Tech` is ~84 characters; Google truncates around 60.
**Fix (optional):** trim to e.g. `Yogesh Yadav — Product Growth & Monetisation Consultant` (56 chars). Same for the meta description (currently ~215 chars; ideal ≤160).

---

## What's already good (keep)

- **Meta tags:** title, description, canonical, robots directives all present and sensibly written.
- **Structured data:** a proper JSON-LD `@graph` with Person, WebSite, Organization, and ProfessionalService — better than most agency sites. (Just fix the Replit logo URL and the SearchAction.)
- **Open Graph / Twitter Card markup** structure is complete (only the image/handle values are wrong).
- **Performance hygiene:** font preloading with `display=swap`, preconnect hints, critical inline CSS, theme-color.
- **HTTPS** enforced with a proper 308 redirect from HTTP.

---

## Recommended action plan (in order)

| # | Action | Effort | Impact |
|---|---|---|---|
| R1 | **Fix routing + rendering.** Short-term: add SPA fallback rewrite in `vercel.json` so inner pages stop 404ing. Real fix: migrate to a framework that ships HTML (Next.js) or add pre-rendering to the Vite build — every blog/case-study page becomes crawlable static HTML. | Rewrite: 30 min. Pre-render/Next.js: 2–5 days | 🔴 Unblocks all indexing |
| R2 | **Replace Replit OG image, Twitter handle, and Org logo** with branded assets | 1–2 hrs | 🔴 Fixes every social share |
| R3 | **Add sitemap.xml + robots.txt**, submit to Google Search Console | 1–2 hrs | 🟠 Discovery of all pages |
| R4 | **301 redirect www → non-www** in Vercel | 15 min | 🟠 Consolidates signals |
| R5 | Proper favicon + headshot with clean filenames; update JSON-LD Person image | 1 hr | 🟡 Professional polish |
| R6 | Remove/fix the SearchAction; trim title & description lengths | 30 min | 🟡 Clean rich results |
| R7 | After R1–R3 ship: verify indexing in Search Console (`site:pmyogesh.com`), request indexing of key pages | ongoing | 🟢 Measurement |

**Note on R1:** the one-line rewrite makes the site *usable*, but Google still has to execute JS to see anything. If the blog is meant to drive organic traffic (which the SEO-strategist positioning suggests), pre-rendered HTML is not optional — it's the whole ballgame.
