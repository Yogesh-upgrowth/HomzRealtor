# Programmatic SEO — Full Flow for HomzRealtor (Replit Stack)

A complete strategy + implementation for HomzRealtor (verified residential &
commercial projects across Delhi NCR — Gurgaon, Noida, Greater Noida, Delhi,
Faridabad; buy / rent / plots & land / new-launch projects / commercial;
lead-gen through local experts), written for the **standard Replit Agent
stack**:

```
client/           Vite + React SPA (wouter, TanStack Query, shadcn/Tailwind)
server/           Express (index.ts, routes.ts)
shared/schema.ts  Drizzle ORM schema
PostgreSQL        Replit-provisioned (Neon)
```

> If your Replit app is actually Next.js (Replit runs it fine), use the
> Next.js version of this document instead — `generateStaticParams` +
> `generateMetadata` do everything below more directly.

---

## Read this first — the one thing the Replit stack changes

**A Vite + React SPA is the wrong place to render SEO pages.** The SPA ships an
empty `index.html` and paints content with client-side JavaScript. Google *can*
render JS, but at pSEO scale (hundreds of pages) rendering is queued, delayed,
inconsistently indexed — and every page shares one `<title>`/meta description.
That kills programmatic SEO before it starts.

**The fix is simple on this stack:** render the pSEO pages as plain
server-generated HTML **directly from Express routes**, registered *before* the
Vite/static catch-all. Your SPA keeps doing what it does (listings UI, enquiry
flows); the SEO pages are fast, fully-formed HTML documents with their own
meta, JSON-LD and content, backed by the same PostgreSQL database via Drizzle.

Bonus over static-site approaches: prices and inventory live in Postgres, so a
quarterly price refresh is a DB update — **pages are fresh instantly, no
rebuild, no redeploy.**

One strategy note (unchanged from any stack): HomzRealtor is a local business,
so "[thing] in [place]" is exactly right — but the unit of "place" is the
**sector/locality, not the city**. City-level head terms ("property in
gurgaon") are owned by 99acres, MagicBricks, Housing.com and NoBroker; their
locality pages, however, are shallow, auto-generated and stale. Buyers search
**"2 bhk flats in sector 79 gurgaon"**, **"plots in greater noida west"**,
**"[project name] price"** — that long tail is where a focused NCR player wins.
Multiply **locality × segment × configuration** to build the keyword matrix.

---

## The opportunity map (ranked build order)

| Tier | Page type | URL pattern | Keyword examples | Why |
|---|---|---|---|---|
| **1** | Locality × segment pages | `/property/:city/:locality/:segment` | "2 bhk flats in sector 79 gurgaon", "plots in greater noida west", "commercial property in sector 150 noida" | Massive long-tail volume, portals are weak here |
| **2** | Project detail pages | `/projects/:slug` | "[project] price", "[project] floor plan", "[project] possession date", "[project] rera number" | **Highest intent** — a project-name search is days from a site visit. You already hold this data. **Build first.** |
| **3** | Developer pages | `/developers/:slug` | "dlf new projects in gurgaon", "kalpataru projects delhi ncr" | Branded demand, easy from data you have |
| **4** | Guides & comparisons | `/guides/:topic`, `/compare/:slug` | "best sectors to invest in gurgaon 2026", "noida vs gurgaon property investment" | Top-of-funnel authority that lifts Tiers 1–3 |

**Recommended sequence:** Ship **Tier 2 first** (fastest to build from existing
inventory, converts immediately), then scale **Tier 1** (the volume engine).
Tiers 3–4 after those prove out.

---

## HomzRealtor's unfair advantage (your anti-thin-content moat)

Google aggressively de-ranks thin, auto-generated real-estate pages — the big
portals survive it on domain authority; a newer domain won't. You can win
anyway, for three reasons:

1. **Real inventory and transaction data.** 45M+ sq ft sold means you can
   publish *actual* price bands and ₹/sqft trends — data portals approximate
   and blogs invent.
2. **People on the ground.** 500+ professionals and 750+ channel associates
   know which sector floods, where the next metro lands, whose possession
   slipped. Two sentences of that per page is uniqueness no scraper can copy.
3. **Every page ends in a one-tap action.** "Talk to a local expert about
   Sector 79" → prefilled enquiry / WhatsApp click-to-chat / site-visit
   booking. Converts SEO traffic into leads (your real KPI) *and* makes the
   page a tool, not filler — the "satisfies the task" signal Google rewards.

**Design principle:** every programmatic page must be genuinely useful to read
*or* let the visitor do something in one tap. Ideally both. If a page is
neither, don't publish it.

---

## TIER 1 — Locality × segment pages (the volume engine)

### Keyword patterns to target
- `{n} bhk flats in {locality}` → "2 bhk flats in sector 79 gurgaon"
- `flats in {locality}` / `property in {locality}`
- `plots in {locality}` / `commercial property in {locality}`
- `ready to move flats in {locality}` / `new launch projects in {locality}`
- `property rates in {locality}` (a price-trend section inside the page — not a
  separate tier)

Generate a page per **locality × segment** — but **only** segments where you
actually have inventory (see guardrails).

### The data model (three buckets)

**A. Locality data (structural)** — slug, name, city, lat/lng, pincode,
connectivity list, landmarks.

**B. Product-hook data (drives leads)** — inventory counts, price bands per
segment, avg ₹/sqft, quarterly ₹/sqft trend **from your own transactions**,
featured projects (linking into Tier 2).

**C. Uniqueness data (keeps you off the thin-content list)** — a 2–3 sentence
unique intro, a ground-truth note from your channel associates, honest
pros/cons, infra updates with dates, locality FAQs. Structured quarterly input
from your 750+ associates (a Google Form per locality is enough), lightly
edited. AI-assisted drafting is fine **but always fed real data and
human-reviewed** (see guardrails).

### Where the data comes from
- **Locality metadata**: Google Maps / OSM + your team.
- **Inventory, price bands, ₹/sqft trends**: **your listings DB and 45M sqft
  transaction history** — your edge.
- **RERA numbers**: Haryana RERA / UP RERA / DDA registries (verify — never
  guess).
- **Expert notes, pros/cons, infra**: quarterly channel-associate inputs.

---

## Implementation on the Replit stack (Express + Drizzle + PostgreSQL)

### 1. Drizzle schema

```ts
// shared/schema.ts  (add to your existing schema)
import {
  pgTable, serial, text, integer, doublePrecision, jsonb, timestamp,
} from "drizzle-orm/pg-core";

export const localities = pgTable("localities", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),          // "sector-79-gurgaon"
  name: text("name").notNull(),                   // "Sector 79"
  city: text("city").notNull(),                   // "Gurgaon"
  citySlug: text("city_slug").notNull(),          // "gurgaon"
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  pincode: text("pincode"),
  connectivity: jsonb("connectivity").$type<string[]>().notNull().default([]),
  segments: jsonb("segments").$type<string[]>().notNull().default([]),
  // e.g. ["2-bhk-flats","3-bhk-flats","ready-to-move"] — ONLY with inventory
  priceBands: jsonb("price_bands")
    .$type<Record<string, [number, number]>>().notNull().default({}),   // ₹
  avgPsf: integer("avg_psf"),                     // ₹/sqft, from YOUR deals
  psfTrend: jsonb("psf_trend")
    .$type<{ quarter: string; psf: number }[]>().notNull().default([]),
  pricesAsOf: text("prices_as_of"),               // "June 2026"
  intro: text("intro").notNull(),
  expertNote: text("expert_note"),
  prosCons: jsonb("pros_cons")
    .$type<{ pro?: string; con?: string }[]>().notNull().default([]),
  infraUpdates: jsonb("infra_updates").$type<string[]>().notNull().default([]),
  faqs: jsonb("faqs")
    .$type<{ q: string; a: string }[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoProjects = pgTable("seo_projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),          // "example-heights"
  name: text("name").notNull(),
  developer: text("developer").notNull(),
  developerSlug: text("developer_slug").notNull(),
  localitySlug: text("locality_slug").notNull(),  // → joins to localities
  status: text("status").notNull(),               // "Ready to Move" | …
  possessionDate: text("possession_date"),        // "Dec 2027" — keep updated
  rera: text("rera").notNull(),                   // verified, never guessed
  reraUrl: text("rera_url"),                      // link to state RERA listing
  priceList: jsonb("price_list")
    .$type<{ config: string; size: string; price: number }[]>()
    .notNull().default([]),
  amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
  expertTake: text("expert_take"),
  faqs: jsonb("faqs")
    .$type<{ q: string; a: string }[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

Push it: `npm run db:push`. Seed with a script (`server/seed-localities.ts`)
that maps your listings DB + transaction exports into these tables. Every
number in production comes from real data — the ₹ values in examples below are
illustrative only.

### 2. Server-rendered SEO routes

Create `server/seo.ts` and register it in `server/routes.ts` **before** the
Vite dev middleware / static catch-all (in the Replit template,
`registerRoutes(app)` already runs before `setupVite`/`serveStatic`, so adding
these inside `registerRoutes` is enough — the catch-all `*` must stay last).

```ts
// server/seo.ts
import type { Express, Request, Response } from "express";
import { db } from "./db";
import { localities, seoProjects } from "@shared/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.homzrealtor.com";

const SEGMENT_LABEL: Record<string, string> = {
  "2-bhk-flats": "2 BHK Flats",
  "3-bhk-flats": "3 BHK Flats",
  "plots": "Plots",
  "commercial": "Commercial Property",
  "ready-to-move": "Ready to Move Flats",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;");

const inr = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(2)} Cr`
                  : `₹${(n / 100_000).toFixed(0)} L`;

// One shared HTML shell: real <title>, meta, canonical, OG, JSON-LD.
// Keep styles minimal/inline (or link your brand stylesheet) — these pages
// must be fast; most property search in India is on mobile.
function shell(o: {
  title: string; description: string; canonical: string;
  jsonLd: object[]; body: string;
}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${o.canonical}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${o.canonical}">
<meta property="og:site_name" content="HomzRealtor">
${o.jsonLd.map(ld =>
  `<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n")}
<style>
  body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;
       padding:16px;line-height:1.55;color:#1a1a1a}
  .cta{background:#f5f0e8;border-radius:12px;padding:16px;margin:20px 0}
  .cta a{display:inline-block;background:#1a1a1a;color:#fff;padding:10px 18px;
       border-radius:8px;text-decoration:none;font-weight:600}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #ddd;padding:8px;text-align:left}
  nav.bc{font-size:14px;color:#666;margin-bottom:12px}
</style>
</head>
<body>${o.body}
<footer><p><a href="/">HomzRealtor</a> · Verified residential &amp; commercial
projects across Delhi NCR.</p></footer>
</body></html>`;
}

export function registerSeoRoutes(app: Express) {
  // ---------- TIER 1: /property/:city/:locality/:segment ----------
  app.get("/property/:city/:locality/:segment",
    async (req: Request, res: Response, next) => {
    const { locality, segment } = req.params;
    const [loc] = await db.select().from(localities)
      .where(eq(localities.slug, locality));
    if (!loc || !loc.segments.includes(segment)) return next(); // → SPA/404

    const label = SEGMENT_LABEL[segment] ?? segment;
    const band = loc.priceBands[segment];
    const canonical = `${BASE_URL}/property/${loc.citySlug}/${loc.slug}/${segment}`;
    const enquiry = `/contact?locality=${loc.slug}&segment=${segment}&src=pseo`;

    const projs = await db.select().from(seoProjects)
      .where(eq(seoProjects.localitySlug, loc.slug));

    const jsonLd: object[] = [
      { "@context": "https://schema.org", "@type": "Place",
        name: `${loc.name}, ${loc.city}`,
        geo: { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lng },
        address: { "@type": "PostalAddress", addressLocality: loc.city,
                   postalCode: loc.pincode, addressCountry: "IN" } },
      { "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: loc.faqs.map(f => ({ "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      { "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: loc.city,
            item: `${BASE_URL}/property/${loc.citySlug}` },
          { "@type": "ListItem", position: 3, name: loc.name,
            item: `${BASE_URL}/property/${loc.citySlug}/${loc.slug}` },
          { "@type": "ListItem", position: 4, name: label } ] },
    ];

    const body = `
<nav class="bc"><a href="/">Home</a> ›
  <a href="/property/${loc.citySlug}">${esc(loc.city)}</a> ›
  <a href="/property/${loc.citySlug}/${loc.slug}">${esc(loc.name)}</a> ›
  ${esc(label)}</nav>

<h1>${esc(label)} in ${esc(loc.name)}, ${esc(loc.city)}</h1>
<p>${esc(loc.intro)}</p>
${loc.expertNote ? `<p><em>From our local team:</em> ${esc(loc.expertNote)}</p>` : ""}

<div class="cta">
  <p>Want current availability and honest advice on ${esc(loc.name)}?</p>
  <a href="${enquiry}">Talk to a ${esc(loc.city)} expert →</a>
  <p><small>Verified listings · RERA-checked projects · free.</small></p>
</div>

<h2>${esc(label)} prices in ${esc(loc.name)} (${esc(loc.pricesAsOf ?? "")})</h2>
${band ? `<p>Current range: <strong>${inr(band[0])} – ${inr(band[1])}</strong>,
  averaging <strong>₹${loc.avgPsf?.toLocaleString("en-IN")}/sq ft</strong> —
  based on HomzRealtor transactions, not asking prices.</p>` : ""}
<table><thead><tr><th>Quarter</th><th>Avg ₹/sq ft</th></tr></thead><tbody>
${loc.psfTrend.map(p =>
  `<tr><td>${esc(p.quarter)}</td><td>₹${p.psf.toLocaleString("en-IN")}</td></tr>`
).join("")}
</tbody></table>

<h2>Top projects in ${esc(loc.name)}</h2>
<ul>${projs.map(p => `<li><a href="/projects/${p.slug}">
  <strong>${esc(p.name)}</strong></a> by ${esc(p.developer)} · ${esc(p.status)}
  · RERA: ${esc(p.rera)}</li>`).join("")}</ul>

<h2>Living in ${esc(loc.name)}: the honest view</h2>
<ul>${loc.prosCons.map(pc =>
  `<li>${pc.pro ? "✓ " + esc(pc.pro) : "✗ " + esc(pc.con ?? "")}</li>`).join("")}
</ul>
<h3>Connectivity</h3>
<ul>${loc.connectivity.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
<h3>What's coming</h3>
<ul>${loc.infraUpdates.map(u => `<li>${esc(u)}</li>`).join("")}</ul>

<h2>Also in ${esc(loc.name)}</h2>
<ul>${loc.segments.filter(s => s !== segment).map(s =>
  `<li><a href="/property/${loc.citySlug}/${loc.slug}/${s}">
   ${esc(SEGMENT_LABEL[s] ?? s)} in ${esc(loc.name)}</a></li>`).join("")}</ul>

<h2>${esc(loc.name)} FAQs</h2>
${loc.faqs.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}

<p><a href="${enquiry}">Get today's ${esc(label.toLowerCase())} options in
${esc(loc.name)} — talk to a local expert, free</a></p>`;

    res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    res.type("html").send(shell({
      title: `${label} in ${loc.name}, ${loc.city}` +
             (band ? ` from ${inr(band[0])}` : "") + ` | HomzRealtor`,
      description:
        `Verified ${label.toLowerCase()} in ${loc.name}, ${loc.city}. ` +
        `Real price data (avg ₹${loc.avgPsf?.toLocaleString("en-IN")}/sq ft, ` +
        `${loc.pricesAsOf}), RERA-verified projects, honest local advice. ` +
        `Talk to a HomzRealtor expert — free.`,
      canonical, jsonLd, body,
    }));
  });

  // ---------- TIER 2: /projects/:slug — same pattern ----------
  // Sections: price list table, possession date, RERA no. + link, amenities,
  // expert take, FAQs. JSON-LD: ApartmentComplex (address+geo via its
  // locality) + FAQPage + BreadcrumbList. Avoid Product/Offer markup —
  // Google's real-estate rich-result support is inconsistent and misuse
  // risks a manual action.

  // ---------- Hubs: /property/:city and /property/:city/:locality ----------
  // City hub lists localities grouped by corridor (SPR, Dwarka Expressway,
  // Noida Expressway…); locality hub links every segment page + featured
  // projects + 3–4 nearby localities. Same shell() helper.

  // ---------- sitemap.xml ----------
  app.get("/sitemap.xml", async (_req, res) => {
    const locs = await db.select().from(localities);
    const projs = await db.select().from(seoProjects);
    const urls: string[] = [];
    for (const c of new Set(locs.map(l => l.citySlug)))
      urls.push(`${BASE_URL}/property/${c}`);
    for (const l of locs) {
      urls.push(`${BASE_URL}/property/${l.citySlug}/${l.slug}`);
      for (const s of l.segments)
        urls.push(`${BASE_URL}/property/${l.citySlug}/${l.slug}/${s}`);
    }
    for (const p of projs) urls.push(`${BASE_URL}/projects/${p.slug}`);

    res.type("application/xml").send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join("\n")}
</urlset>`);
  });

  // ---------- robots.txt ----------
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
`User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`);
  });
}
```

```ts
// server/routes.ts — inside registerRoutes(app), before the catch-all:
import { registerSeoRoutes } from "./seo";
// …
registerSeoRoutes(app);
```

### 3. Replit-specific gotchas

- **Route order is everything.** SEO routes must be registered before the Vite
  middleware / `serveStatic` catch-all (`*`). If the catch-all wins, Google
  gets the empty SPA shell and the whole project is dead on arrival. Verify
  with `curl -s https://…/property/gurgaon/sector-79-gurgaon/2-bhk-flats | head`
  — you should see your full HTML, not the SPA's `<div id="root">`.
- **Deployment type:** use **Autoscale** (or Reserved VM). A *Static*
  deployment has no server — these routes won't exist. Your custom domain
  (homzrealtor.com) attaches to the deployment as usual.
- **Caching:** Express renders per-request; the `Cache-Control` header above
  lets Replit's edge/CDN and browsers cache for a day. For extra safety at
  scale, add a tiny in-memory `Map<url, {html, ts}>` with a 1-hour TTL —
  remember Autoscale runs multiple instances, so treat it as best-effort.
- **Dev vs prod URL:** keep `BASE_URL` in an env var (Replit Secrets) so
  preview deployments don't emit wrong canonicals.
- **Data entry:** a simple admin page in your SPA (protected route) that edits
  the `localities` / `seo_projects` rows is enough for quarterly price
  refreshes — updates are live instantly, no redeploy.

---

## TIER 2 — Project detail pages (build these FIRST)

Someone searching **"[project name] price"** or **"[project name] possession
date"** has already shortlisted that project — the closest a real-estate query
gets to a purchase. You hold the inventory, the `seo_projects` table above is
ready, and the Express pattern is identical — so these ship in days and
produce leads first.

**Angle that wins:** be the page that tells the truth. Developer microsites
hide prices; portals show stale asking rates. Publish the real current price
list with a "prices as of {month}" stamp, the *actual* possession outlook, the
RERA number linked to the state registry, and your expert's honest take
("strong construction pace, but the ₹/sqft premium over the sector average is
~12%; negotiable on bulk floors"). That's why the visitor enquires with you.

Each page's `<h2>` sections should map to query patterns: price list, floor
plans, possession date, RERA details, location & connectivity, amenities,
payment plan, "[project] review". Link back to the project's locality pages
(Tier 1) and its developer page (Tier 3).

---

## TIER 3 — Developer pages (quick wins)

`/developers/:slug` — target "dlf new projects gurgaon", "kalpataru projects
delhi ncr". Data: a 2–3 sentence unique bio including your team's
delivery-track-record view, cards for their projects you sell (linking to
Tier 2), FAQs. These catch branded demand and thicken the internal-link mesh.
One more Express route, same `shell()` helper.

---

## TIER 4 — Guides & comparisons (topical authority)

- `/guides/best-sectors-to-invest-in-gurgaon` (refresh yearly; keep the URL
  evergreen — no year in the slug)
- `/guides/ready-to-move-vs-under-construction`
- `/compare/noida-vs-gurgaon-property-investment`
- `/compare/dwarka-expressway-vs-sohna-road`

These rank slower but catch researchers 6–12 months before they buy and pass
authority into locality and project pages. Every guide should cite your own
transaction data ("per HomzRealtor data, ₹/sqft on Dwarka Expressway rose X%
in 2025") — quotable, linkable, and impossible to copy.

---

## Internal linking architecture

Orphan pages don't rank. Build the mesh:

- **`/property/:city`** hub → all localities, grouped by corridor (SPR, Dwarka
  Expressway, Noida Expressway…).
- **`/property/:city/:locality`** hub → every segment page + featured projects
  + 3–4 **nearby localities** (add a `nearby` jsonb column).
- **Segment pages ↔ each other** within a locality (done in template).
- **Locality → project → developer → other projects → their localities** — the
  triangle that keeps crawlers and users circulating.
- Link into city hubs from your **SPA's homepage, footer, and the existing
  `/project-listing` page** — plain `<a href>` links in the React app are fine;
  they're real URLs the server answers.
- **Breadcrumbs everywhere** (visible + `BreadcrumbList` JSON-LD — done in
  template).

---

## Technical SEO checklist

- ✅ Unique `<title>` + meta description per page (done in `shell()`); include
  the price band in titles where you have it — numbers lift CTR.
- ✅ Self-referencing **canonical** on every page (watch `BASE_URL` in dev).
- ✅ Server-rendered HTML → nothing depends on JS execution; pages are a few KB
  and fast. Most Indian property search is mobile; speed matters a lot.
- ✅ Structured data: **Place / ApartmentComplex** + **FAQPage** +
  **BreadcrumbList**; add **RealEstateAgent** (org-level, with NAP) on the
  homepage. Validate in Google's Rich Results Test.
- ✅ One `<h1>`, logical `<h2>` hierarchy phrased close to queries ("2 BHK
  prices in Sector 79", "Is Sector 79 good for investment?").
- ✅ Real photos with descriptive alt text (project shots, not stock) — Google
  Images is a real discovery channel for property. Serve compressed WebP from
  `client/public` or object storage.
- ✅ `sitemap.xml` + `robots.txt` served from Express (done above).
- ✅ **Google Business Profile** linked and consistent with on-site NAP — the
  map pack matters for "property dealer in gurgaon" queries, separately from
  organic.

---

## Indexing & rollout

1. Deploy (Autoscale) → verify with `curl` that SEO routes return full HTML →
   submit the sitemap in **Google Search Console**.
2. **Batch the rollout.** Don't seed 1,000 locality rows overnight — Google
   dampens quality on huge sudden batches. Ship all live **project pages**
   (Tier 2) + your **top ~30 localities** (start with Gurgaon, your strongest
   market).
3. Watch the **Pages (indexing)** report. Lots of "Crawled – currently not
   indexed" = thin-content signal → improve those pages before scaling.
4. Expand in waves: Gurgaon → Noida/Greater Noida → Delhi → Faridabad, as
   pages index and gather impressions. Since pages are DB rows, a "wave" is
   just an INSERT batch — no redeploy.

---

## Monitor & iterate

In GSC Performance, filter by pattern (`/property/`, `/projects/`) and track
impressions, clicks, average position, **and** your real KPI: **leads per
page** — enquiry submits, call taps, WhatsApp click-to-chats, site-visit
bookings. Every CTA carries `?src=pseo&locality=…`, so attribution lands in
your existing enquiry table automatically. Then:
- Impressions, no clicks → sharpen titles/descriptions (add price bands).
- Clicks, no leads → weak trust layer; add price data, RERA numbers, expert
  notes.
- No impressions after weeks → thin or no demand; improve or prune (DELETE the
  row — the route 404s into your SPA automatically).
- Winning localities/segments → deepen them; add their neighbors next.

Expect months, not weeks — pSEO compounds slowly.

---

## Guardrails (real-estate specific)

1. **Never fabricate prices, possession dates, or RERA numbers.** Wrong
   numbers here don't just hurt rankings — they burn buyer trust and can
   create legal exposure. Every price carries an "as of {month year}" stamp
   and a quarterly refresh job.
2. **RERA on every project page**, linked to the state registry — the
   strongest trust signal in Indian real estate, and advertising projects
   without it invites regulatory trouble.
3. **No pages for localities/segments with zero inventory.** A "2 BHK in
   Sector X" page with nothing to show is a doorway page — Google's spam
   policies target exactly this. Empty `segments` array = route falls through
   to the SPA (already handled by the `return next()`).
4. **Never publish bulk unedited AI text.** Draft with AI if you like, but
   feed it your real price/inventory/ground data and have a human review.
   Generic "Sector X is a rapidly developing locality with excellent
   connectivity" filler is what gets locality pages ignored.
5. **Don't paste developer brochure copy** — every competitor has the same
   PDF; duplicated text buries your page. Rewrite; add your expert take.
6. **Stale = worse than absent.** A price table showing 2024 rates in 2026
   actively loses trust. If a locality can't be refreshed quarterly, drop its
   price section rather than let it rot.
7. **Validate before scaling** — prove ~30 localities perform before making
   hundreds.
8. **No orphan pages** — everything reachable via hubs + internal links.

---

## Build order (TL;DR)

- [ ] **Schema:** add `localities` + `seo_projects` to `shared/schema.ts` →
      `npm run db:push`.
- [ ] **Week 1 — Tier 2:** seed all live projects (real price lists,
      possession dates, verified RERA numbers, expert takes) + the
      `/projects/:slug` Express route with ApartmentComplex/FAQ/Breadcrumb
      JSON-LD.
- [ ] **Data pipeline:** script listings DB + transaction history + quarterly
      channel-associate inputs into `localities` (price bands, ₹/sqft trends,
      pros/cons, infra updates).
- [ ] **Tier 1 route:** `server/seo.ts` as above — registered **before** the
      Vite/static catch-all; verify with `curl`.
- [ ] **Hubs + internal links:** `/property/:city` and locality hubs, nearby
      links, breadcrumbs; link hubs from the SPA homepage/footer/
      `/project-listing`.
- [ ] **`/sitemap.xml` + `/robots.txt`** Express routes.
- [ ] Deploy on **Autoscale** → submit sitemap in GSC → roll out all project
      pages + top ~30 Gurgaon localities.
- [ ] Monitor GSC weekly (impressions **and** leads per page); improve/prune;
      then expand to Noida/Greater Noida/Delhi/Faridabad and add Tier 3
      (developers) + Tier 4 (guides & comparisons).
