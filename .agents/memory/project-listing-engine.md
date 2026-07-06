---
name: Project listing Missing Data Engine
description: Rules for the /project-listing/[city]/[slug] Dynamic Listing Engine so pages never show junk.
---

# Project listing "Missing Data Engine"

Core rule: the listing page must NEVER render blank / NULL / N/A / TBA / undefined / bare 0. Each section renders, hides, replaces, or generates.

## Single sanitizer boundary
`clean(v)` in `lib/intelligence/view-model.ts` (exported) is the one place that strips junk (`BAD` set: n/a, na, null, undefined, -, —, nil, none, tba, 0). Every user-visible string — including fallback FAQ answers (`content.ts buildFallbackFaqs`) and SimilarProjects card fields — must pass through it, not just the fields resolved by `resolveProjectView`.
**Why:** raw normalized fields (price_text, possession_text, rera_id, property_category) can be literal "N/A"/"TBA" from the upstream API and will leak if rendered directly.

## Canonical city URLs
Internal `project.city_key` is NOT the route slug (`ggn` → `gurgaon`, `gNoida` → `greaternoida`). JSON-LD, canonical links, and internal links must map key→slug (see `citySlug` map / `CITY_PARAM_FROM_KEY`), or you emit URLs that don't match the actual `/project-listing/[city]/[slug]` routes.

## Data path
Uses live-cached `getProjectBySlug` (homzbackend API via unstable_cache), works for all cities — NOT the DB path which was only backfilled for Gurgaon (ggn).
