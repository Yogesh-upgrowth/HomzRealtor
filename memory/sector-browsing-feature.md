---
name: sector-browsing-feature
description: Sector-wise project browsing (city → sector → projects) — how it's built
metadata:
  type: project
---

Sector-wise browsing added 2026-07-11: URLs `/project-listing/[city]/sectors` (index)
and `/project-listing/[city]/sectors/[sector]` (projects in that sector, e.g.
`.../gurgaon/sectors/sector-66`).

- Data helpers in `lib/intelligence/projects.ts`: `getSectorsForCity`,
  `getProjectsForSector`, `sectorLabelFromSlug`, type `SectorSummary`. They group the
  already-cached normalized projects by their **derived** `sector` field — no extra
  fetches, no Google APIs needed.
- Sector slug = `slugify(p.sector)`; matching filters on `slugify(p.sector) === param`.
- City hub page (`[city]/page.tsx`) links to `/sectors` and shows a chip grid.
- `app/sitemap.ts` emits the `/sectors` index + one URL per derived sector per city.
- Sector detail reuses the `SimilarProjects` card component.
- The main `/project-listing` client page (`app/project-listing/page.tsx`) also has a
  sector dropdown that appears once a specific city is picked: it derives sectors
  client-side via `extractSector` (attached as `_sector` on each fetched project),
  filters the grid in-place, and links through to the dedicated sector page(s).

Caveat: sector coverage is low for Delhi (~17%) — see [[backend-and-port-facts]].
Untagged projects stay reachable via the city page; they just don't appear under a sector.
