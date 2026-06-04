# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at 0.0.0.0:5000 (not the default port 3000)
npm run build    # Production build
npm start        # Production server at port 5000
npm run lint     # ESLint
```

## Architecture

**Next.js 16 App Router** real estate listing platform with TypeScript and Tailwind CSS 4.

### Key directories

- **`/app`** — Pages and API routes
  - `layout.tsx` — Root layout; wraps everything in `FormProvider`, mounts `Header`, `Footer`, `GoogleAnalyticsTracker`
  - `page.tsx` — Home page composing section components
  - `project-listing/[city]/[slug]/[enquiry]/` — Dynamic property detail pages
  - `api/contact/route.ts` — POSTs form submissions to a Google Apps Script webhook
  - `sitemap.ts` — Auto-generated XML sitemap

- **`/components`** — All UI components; no sub-grouping convention, flat directory
- **`/context`** — React context + static data
  - `FormContext.tsx` — Global modal form state (`isOpen`, `openForm`, `closeForm`)
  - `utils/ProjectDetails.tsx` — Static project/property data (source of truth for listings)
  - `utils/AboutPageData.tsx` — Testimonials and about page content
- **`/models/types.tsx`** — Shared TypeScript interfaces (`PropertyItem`, `PropertyDetails`, `FeatureSectionProps`, etc.)

### Data flow

Property data lives as static objects in `context/utils/ProjectDetails.tsx` and is consumed directly by page/components — there is no external CMS or database. Form submissions go through `/api/contact` → Google Apps Script → Google Sheets.

### Image handling

Remote images are allowed only from `static.squareyards.com` and `loangateway.urbanmoney.com` (configured in `next.config.ts`). Always use Next.js `<Image>` for these sources.

### Styling

Tailwind CSS 4 (PostCSS plugin). Custom font family `"Zolina"` defined in `tailwind.config.ts`. No CSS Modules or styled-components.

### Notable packages

| Package | Role |
|---|---|
| `embla-carousel-react` | Image gallery/slider |
| `sonner` | Toast notifications |
| `lucide-react` / `react-icons` | Icons |
