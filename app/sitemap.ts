import { MetadataRoute } from 'next'
import { getSectorsForCity, getProjectsForCity, canonicalCitySlug, getAllBuilders, isIndexableDeveloper } from '@/lib/intelligence/projects'
import {
  homzDataUrl,
  propertySegment,
  type PropertyCategory,
  type RawHomzProperty,
} from '@/lib/scraping/homzbackend'
import { slugForProperty } from '@/lib/intelligence/property-view'
import { reviewListing, reviewProject } from '@/lib/intelligence/publishGate'
import { sanitizeSegment } from '@/lib/intelligence/dataQuality'
import { filterProperties } from '@/lib/listings/filters'
import {
  buildLocationHubs,
  LISTING_PAGE_SIZE,
  staticFacetsFor,
} from '@/lib/listings/facets'
import { getAllSorted } from '@/components/PropertyListing/PaginatedListingPage'
import { BUYER_GUIDES } from '@/lib/content/buyerGuides'
import { BLOG_POSTS_V27 } from '@/lib/content/blogRegistry'
import { BLOG_CATEGORIES } from '@/lib/content/blogPostSchema'
import { allResolved, SELLER_TERM_KEYS, LANDLORD_TERM_KEYS } from '@/lib/content/ownerPending'
import { AUTHORS } from '@/lib/content/authors'

// Was `force-dynamic` — that recomputed every segment (full catalogue
// fetch + JSON parse + facet filtering over tens of thousands of records)
// on every single crawl hit, with zero caching benefit; Next's own
// fetch-data-cache can't help here since it silently refuses to store
// payloads over 2MB and these segments run 5-48MB live (see
// lib/listings/segmentCache.ts's comment). `revalidate` instead caches the
// whole computed sitemap output and regenerates it in the background at
// most once an hour — same freshness (no redeploy needed to pick up new
// listings), without paying the full compute cost per request.
export const revalidate = 3600

const BASE_URL = 'https://www.homzrealtor.com'

// SEO audit H-05 (2026-09-08) split this single 2,967-URL sitemap into
// segments via generateSitemaps() so Search Console can report indexation
// per segment — the C-02 orphan problem becomes measurable per URL type
// instead of buried in one aggregate number. Next.js's generateSitemaps
// doesn't support arbitrary flat filenames (no "sitemap-projects.xml" —
// see the file-conventions docs): the fixed URL shape is
// /sitemap/[id].xml, so these serve at /sitemap/projects.xml,
// /sitemap/sectors.xml, etc. Next also doesn't auto-build a <sitemapindex>
// referencing them — they're registered individually in app/robots.ts's
// sitemap field instead, which Google treats as equivalent for discovery.
const SEGMENT_IDS = ['projects', 'sectors', 'developers', 'buy', 'rent', 'commercial', 'content'] as const
type SegmentId = (typeof SEGMENT_IDS)[number]

export async function generateSitemaps() {
  return SEGMENT_IDS.map((id) => ({ id }))
}

// Sale/Rent/Pg/Commercial listing pages — same city scope as the Projects
// pages above (ggn/Gurgaon only, matching the current frontend scope
// decision).
const PROPERTY_ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: 'buy-property',
  Rent: 'rent-property',
  Pg: 'pg-property',
  Commercial: 'commercial',
}

const CITY_KEYS = ['ggn', 'delhi', 'faridabad', 'gNoida', 'noida']

type ProjectEntry = { slug: string; city: string; updatedAt: string | null }

// DEV-01 (2026-09-16): this used to independently fetch each city/category
// segment raw and recompute its own slug via an inline regex copy of
// lib/intelligence/normalize.ts's slugify() — a second, driftable
// implementation of the exact slug route resolution (getProjectBySlug)
// actually uses. Reading through getProjectsForCity() instead means the
// sitemap and route resolution now share one eligibility/slug contract, and
// it also picks up that function's own cache (lib/intelligence/projects.ts)
// rather than re-fetching+re-parsing raw JSON here.
async function fetchProjectEntries(): Promise<ProjectEntry[]> {
  const entries: ProjectEntry[] = []
  const seen = new Set<string>()

  await Promise.all(
    CITY_KEYS.map(async (cityKey) => {
      try {
        const citySlug = canonicalCitySlug(cityKey)
        const projects = await getProjectsForCity(cityKey)
        for (const p of projects) {
          const key = `${citySlug}/${p.slug}`
          if (seen.has(key)) continue
          // Checklist items 9 and 15: a project the pre-publish gate blocks
          // emits noindex on its own page, so listing it here would put the
          // sitemap and the page in direct contradiction.
          if (!reviewProject(p).indexable) continue
          seen.add(key)
          entries.push({ slug: p.slug, city: citySlug, updatedAt: p.updated_at })
        }
      } catch {
        // Skip on fetch error — sitemap degrades gracefully
      }
    })
  )

  return entries
}

// Real per-record updatedAt only — SEO audit H-05 (2026-09-08) found the
// live sitemap stamping every URL with request-time new Date(), which
// Google treats as noise and stops trusting lastmod for entirely. Omitting
// the field (rather than falling back to new Date()) is the honest option
// when no real signal exists — Next's Sitemap type already makes
// lastModified optional for exactly this.
function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function maxDate(values: (string | null | undefined)[]): Date | undefined {
  const dates = values.map(toDate).filter((d): d is Date => d !== undefined)
  if (dates.length === 0) return undefined
  return new Date(Math.max(...dates.map((d) => d.getTime())))
}

async function buildProjectsSegment(): Promise<MetadataRoute.Sitemap> {
  const entries = await fetchProjectEntries()

  const projectUrls: MetadataRoute.Sitemap = entries.map(({ slug, city, updatedAt }) => ({
    url: `${BASE_URL}/project-listing/${city}/${slug}`,
    lastModified: toDate(updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // City landing pages — real signal: the most recent update among that
  // city's own projects, not "right now".
  const byCity = new Map<string, ProjectEntry[]>()
  for (const e of entries) {
    if (!byCity.has(e.city)) byCity.set(e.city, [])
    byCity.get(e.city)!.push(e)
  }
  const cityUrls: MetadataRoute.Sitemap = Array.from(byCity.entries()).map(([city, cityEntries]) => ({
    url: `${BASE_URL}/project-listing/${city}`,
    lastModified: maxDate(cityEntries.map((e) => e.updatedAt)),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  // Server-rendered paginated project pages (app/project-listing/[city]/page/[page]/page.tsx)
  // — same page size as that route (PAGE_SIZE = 24). lastModified per page
  // uses the max among that specific page's own projects, not the whole city.
  //
  // Starts at page 2 — SEO audit 2026-09-07 P1: page 1 duplicated the base
  // city hub URL above (same content, two self-canonical URLs); the route
  // itself now 404s on page 1, so a sitemap entry for it would be broken.
  const PROJECT_PAGE_SIZE = 24
  const pageUrls: MetadataRoute.Sitemap = Array.from(byCity.entries()).flatMap(([city, cityEntries]) => {
    const totalPages = Math.max(1, Math.ceil(cityEntries.length / PROJECT_PAGE_SIZE))
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => {
      const pageNum = i + 2
      const pageEntries = cityEntries.slice((pageNum - 1) * PROJECT_PAGE_SIZE, pageNum * PROJECT_PAGE_SIZE)
      return {
        url: `${BASE_URL}/project-listing/${city}/page/${pageNum}`,
        lastModified: maxDate(pageEntries.map((e) => e.updatedAt)),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    })
  })

  return [...cityUrls, ...pageUrls, ...projectUrls]
}

async function buildSectorsSegment(): Promise<MetadataRoute.Sitemap> {
  // No cheap, reliable per-sector updatedAt signal is available —
  // getSectorsForCity() returns pre-aggregated {sector, slug, count}
  // summaries, not per-project timestamps, and deriving one properly needs
  // the full normalization pipeline this file otherwise avoids for
  // performance. Omitting lastModified here is the honest choice over
  // approximating from data this route doesn't have.
  const sectorEntries = await Promise.all(
    CITY_KEYS.map(async (cityKey) => {
      const citySegment = canonicalCitySlug(cityKey)
      try {
        const sectors = await getSectorsForCity(cityKey)
        if (sectors.length === 0) return [] as MetadataRoute.Sitemap
        const urls: MetadataRoute.Sitemap = [
          {
            url: `${BASE_URL}/project-listing/${citySegment}/sectors`,
            changeFrequency: 'daily',
            priority: 0.7,
          },
          ...sectors.map((s) => ({
            url: `${BASE_URL}/project-listing/${citySegment}/sectors/${s.slug}`,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          })),
        ]
        return urls
      } catch {
        return [] as MetadataRoute.Sitemap
      }
    })
  )
  return sectorEntries.flat()
}

async function buildDevelopersSegment(): Promise<MetadataRoute.Sitemap> {
  // Same reasoning as sectors — getAllBuilders() has no per-project
  // timestamps to aggregate from cheaply.
  let developerUrls: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/developer`,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]
  try {
    const developers = await getAllBuilders()
    // Only hubs the developer page itself offers for indexing. 2026-09-21,
    // per the 21 Sep audit: a hub holding a single project is noindex there
    // (see isIndexableDeveloper), and a sitemap entry for a noindex URL is a
    // contradiction Search Console reports as an error.
    developerUrls = developerUrls.concat(
      developers.filter(isIndexableDeveloper).map((d) => ({
        url: `${BASE_URL}/developer/${d.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    )
  } catch {
    // Skip per-developer entries on fetch error — sitemap degrades gracefully.
  }
  return developerUrls
}

async function fetchPropertyEntries(category: PropertyCategory): Promise<RawHomzProperty[]> {
  try {
    // 25000, not 500 — the old 500 cap left Sale (20,957 real listings) and
    // Rent (12,945 real) almost entirely out of the sitemap. Same limit as
    // lib/listings/segmentCache.ts's UPSTREAM_LIMIT, which the live
    // pagination pages read from, so the sitemap and what's actually
    // reachable stay in sync.
    const res = await fetch(homzDataUrl(propertySegment('ggn', category), 1, 25000), {
      next: { revalidate: 3600 },
    })
    const json = await res.json()
    const raw: RawHomzProperty[] = (json?.results || []).filter((p: RawHomzProperty) => !!p?.title)
    // 2026-09-22. This fetch bypassed lib/listings/segmentCache.ts, so the
    // sitemap was built from UNCORRECTED records while the pages were built
    // from corrected ones — a flat reclassified out of Commercial was still
    // listed under the commercial segment here. Sanitising first puts the two
    // back in agreement.
    const corrected = sanitizeSegment(raw)
    // Checklist items 9 and 15: a record the pre-publish gate blocks is
    // noindex on its own page, and a sitemap entry for a noindex URL is a
    // contradiction Search Console reports as an error. Same rule the thin
    // developer hubs already follow.
    return corrected.filter((p) => reviewListing(p).indexable)
  } catch {
    return []
  }
}

async function buildPropertyCategorySegment(category: PropertyCategory): Promise<MetadataRoute.Sitemap> {
  const routeBase = PROPERTY_ROUTE_BASE[category]
  const properties = await fetchPropertyEntries(category)

  const indexUrl: MetadataRoute.Sitemap[number] = {
    url: `${BASE_URL}/${routeBase}`,
    // Real signal: most recent update among this category's own listings.
    lastModified: maxDate(properties.map((p) => p.updatedAt)),
    changeFrequency: 'daily',
    priority: 0.8,
  }

  const detailUrls: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${BASE_URL}/${routeBase}/gurgaon/${slugForProperty(p)}`,
    lastModified: toDate(p.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Landing pages: the hand-written facets (content audit B-04, 2026-09-08)
  // and, since 2026-09-21, the sector and corridor hubs. Both now come from
  // lib/listings/facets.ts, which is deliberately React-free so this module
  // can import it directly — LISTING_PAGE_SIZE included, so the 24 no longer
  // has to be duplicated here.
  //
  // Sale and Rent both carry landing pages now. Rent previously had none at
  // all: ~13,000 listings whose only entry point was a ~540-page pagination
  // chain.
  const staticFacets = Object.values(staticFacetsFor(category))

  // Only hubs that clear MIN_HUB_LISTINGS, because only those actually render
  // — below the floor the route 404s. A sitemap entry pointing at a 404 is a
  // Search Console error, and listing hubs we deliberately suppress would be
  // exactly that.
  const locationHubs = buildLocationHubs(properties, category).map((h) => h.facet)

  const facetUrls: MetadataRoute.Sitemap = [...staticFacets, ...locationHubs].flatMap(
    (facet) => {
      const filtered = filterProperties(properties, facet.filters, category)
      if (filtered.length === 0) return []
      const totalPages = Math.max(1, Math.ceil(filtered.length / LISTING_PAGE_SIZE))
      const base = `${BASE_URL}/${routeBase}/gurgaon/${facet.slug}`
      const lastMod = maxDate(filtered.map((p) => p.updatedAt))
      return Array.from({ length: totalPages }, (_, i) => ({
        url: i === 0 ? base : `${base}/page/${i + 1}`,
        lastModified: lastMod,
        changeFrequency: 'daily' as const,
        // Location hubs outrank the citywide facets on page 1: they are the
        // pages that serve a real query ("3 BHK in Sector 65") and the pages
        // that carry area-specific computed content.
        priority: i === 0 ? (facet.location ? 0.8 : 0.75) : 0.6,
      }))
    }
  )

  return [indexUrl, ...facetUrls, ...detailUrls]
}

async function buildContentSegment(): Promise<MetadataRoute.Sitemap> {
  const byCategory = new Map<string, typeof BLOG_POSTS_V27>()
  for (const p of BLOG_POSTS_V27) {
    const cat = p.meta.category
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(p)
  }

  // DEV-04 (2026-09-16): confirmed live — PG has zero real listings right
  // now. /pg-property was unconditionally sitemapped despite rendering "No
  // listings found" with no cards. Matches app/pg-property/page.tsx's own
  // generateMetadata, which sets noindex,follow for the same reason — a
  // noindex page has nothing to earn from a sitemap entry either. Both
  // revert automatically the moment real PG inventory exists.
  const pgHasInventory = (await getAllSorted('Pg').catch(() => [])).length > 0

  return [
    // Pure static/utility pages — no underlying record, so no lastModified
    // rather than a fabricated one.
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/project-listing`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about-us`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, changeFrequency: 'yearly', priority: 0.3 },
    // Higher priority than the other policy pages on purpose: this one states
    // the data methodology and the corrections process, which is trust content
    // rather than boilerplate.
    { url: `${BASE_URL}/editorial-policy`, changeFrequency: 'monthly', priority: 0.5 },
    // Checklist item 8 (2026-09-22): the Investment Score methodology page.
    { url: `${BASE_URL}/homz-investment-score-methodology`, changeFrequency: 'monthly', priority: 0.5 },
    // Not /api-docs — it's noindex,follow (see app/api-docs/page.tsx), so
    // it has nothing to earn from a sitemap entry.
    { url: `${BASE_URL}/property-insights`, changeFrequency: 'monthly', priority: 0.5 },
    ...(pgHasInventory ? [{ url: `${BASE_URL}/pg-property`, changeFrequency: 'daily' as const, priority: 0.6 }] : []),
    // SEO audit M-08 (2026-09-08) — real standalone page, real FAQ content.
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },

    // 2026-09-21: the rates table. A head-term page ("property rates in
    // gurgaon", "property price sector 65") computed entirely from our own
    // catalogue, and the master internal-link hub for every area page. High
    // priority and daily: the figures move as inventory moves.
    { url: `${BASE_URL}/property-rates-in-gurgaon`, changeFrequency: 'daily', priority: 0.85 },

    // Author profiles. Every guide was bylined to a slug with no page behind
    // it, so the byline linked nowhere and blogPostSchema's own
    // author.profileUrl contract could not be satisfied.
    ...Object.keys(AUTHORS).map((slug) => ({
      url: `${BASE_URL}/author/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),

    // The owner-side journeys. Both were noindex while their commercial terms
    // were unpublished; the owner supplied the fee terms on 2026-09-19 and
    // both pages now publish. The entries are gated on the same derived
    // check the pages themselves use, so a sitemap entry can never point at a
    // page that has gone back to noindex because a term was cleared.
    ...(allResolved(SELLER_TERM_KEYS)
      ? [{ url: `${BASE_URL}/sell-property-in-gurgaon`, changeFrequency: 'monthly' as const, priority: 0.7 }]
      : []),
    ...(allResolved(LANDLORD_TERM_KEYS)
      ? [{ url: `${BASE_URL}/rent-out-property-in-gurgaon`, changeFrequency: 'monthly' as const, priority: 0.7 }]
      : []),

    // Buyer guides — real, deliberately-maintained updatedAt already exists
    // in lib/content/buyerGuides.ts (bumped only on an actual text edit,
    // per that file's own comment) and was simply unused here before.
    ...BUYER_GUIDES.map((g) => ({
      url: `${BASE_URL}/property-insights/${g.slug}`,
      lastModified: toDate(g.updatedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),

    { url: `${BASE_URL}/blog`, changeFrequency: 'monthly', priority: 0.5 },
    // Already correct before this fix — real per-post updatedAt.
    ...BLOG_POSTS_V27.map((p) => ({
      url: `${BASE_URL}/blog/${p.meta.slug}`,
      lastModified: toDate(p.meta.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Only categories that actually have a published post — an empty
    // archive page has nothing to earn from a sitemap entry. lastModified
    // is the most recent post in that category — real, cheap to compute,
    // data already in hand.
    ...BLOG_CATEGORIES.filter((c) => byCategory.has(c)).map((c) => ({
      url: `${BASE_URL}/blog/${c}`,
      lastModified: maxDate((byCategory.get(c) || []).map((p) => p.meta.updatedAt)),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const segment = (await id) as SegmentId

  switch (segment) {
    case 'projects':
      return buildProjectsSegment()
    case 'sectors':
      return buildSectorsSegment()
    case 'developers':
      return buildDevelopersSegment()
    case 'buy':
      return buildPropertyCategorySegment('Sale')
    case 'rent':
      return buildPropertyCategorySegment('Rent')
    case 'commercial':
      return buildPropertyCategorySegment('Commercial')
    case 'content':
      return buildContentSegment()
    default:
      return []
  }
}
