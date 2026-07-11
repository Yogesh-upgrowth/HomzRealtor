---
name: backend-and-port-facts
description: CLAUDE.md is stale about data source and dev port — the real facts
metadata:
  type: project
---

CLAUDE.md is out of date on two points that matter:

1. **There IS a real backend.** Project data is fetched live from
   `https://homzbackend.vercel.app/api/data?city=<cityKey><Category>Projects` (e.g.
   `ggnResidentialProjects`), normalized in `lib/intelligence/normalize.ts`, cached 1h
   via `getProjectsForCity` in `lib/intelligence/projects.ts`. The static objects in
   `context/utils/ProjectDetails.tsx` are legacy/unused for the listing flow.

2. **Dev/prod port is 3000, not 5000.** `package.json` runs `next start -p 3000`
   (and dev likewise). CLAUDE.md says 5000 — wrong.

Also: the repo ships ~51 pre-existing `@typescript-eslint/no-explicit-any` lint errors;
`next build` (Next 16) does not gate on them, so lint failures ≠ broken build.

The backend has **no structured `sector` field** — sector is derived by regex
(`extractSector`) from the project title + about text. Coverage varies by city:
Gurgaon ~86%, Noida ~90%, Faridabad ~78%, Greater Noida ~47%, Delhi only ~17%
(Delhi is colony/locality-based, not sector-based). See [[sector-browsing-feature]].
