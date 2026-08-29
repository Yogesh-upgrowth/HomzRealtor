import { MetadataRoute } from 'next'
import { getSectorsForCity, canonicalCitySlug, getAllBuilders } from '@/lib/intelligence/projects'
import {
  homzDataUrl,
  propertySegment,
  type PropertyCategory,
  type RawHomzProject,
  type RawHomzProperty,
} from '@/lib/scraping/homzbackend'
import { slugForProperty } from '@/lib/intelligence/property-view'
import { BUYER_GUIDES } from '@/lib/content/buyerGuides'
import { BLOG_POSTS } from '@/lib/content/blogPosts'

export const dynamic = 'force-dynamic'

// Sale/Rent/Pg/Commercial listing pages — same city scope as the Projects
// pages above (ggn/Gurgaon only, matching the current frontend scope
// decision), same 200-per-segment cap as the Projects loop below to keep
// the sitemap size reasonable.
const PROPERTY_ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: 'buy-property',
  Rent: 'rent-property',
  Pg: 'pg-property',
  Commercial: 'commercial',
}

// city API key → CANONICAL URL segment. Used to enumerate the sector hub pages.
const CITY_KEYS = ['ggn', 'delhi', 'faridabad', 'gNoida', 'noida']

// city API key → CANONICAL URL segment used in /project-listing/[city]/[slug].
// These must match the <link rel="canonical"> the project pages emit, otherwise
// the sitemap advertises non-canonical URLs (e.g. /ggn/ instead of /gurgaon/).
const CITY_ENDPOINT_MAP: Record<string, string> = {
  delhiCommercialProjects:     'delhi',
  delhiResidentialProjects:    'delhi',
  faridabadCommercialProjects: 'faridabad',
  faridabadResidentialProjects:'faridabad',
  ggnCommercialProjects:       'gurgaon',
  ggnResidentialProjects:      'gurgaon',
  gNoidaCommercialProjects:    'greaternoida',
  gNoidaResidentialProjects:   'greaternoida',
  noidaCommercialProjects:     'noida',
  noidaResidentialProjects:    'noida',
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.homzrealtor.com'

  const entries: { slug: string; city: string; updatedAt: string | null }[] = []
  const seen = new Set<string>()

  await Promise.all(
    Object.entries(CITY_ENDPOINT_MAP).map(async ([cityKey, citySegment]) => {
      try {
        const res = await fetch(homzDataUrl(cityKey, 1, 500), {
          next: { revalidate: 3600 },
        })
        const json = await res.json()
        const projects: RawHomzProject[] = json?.results || []

        for (const p of projects) {
          if (!p?.projectTitle || typeof p.projectTitle !== 'string') continue
          const slug = p.projectTitle
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
          const key = `${citySegment}/${slug}`
          if (seen.has(key)) continue
          seen.add(key)
          entries.push({ slug, city: citySegment, updatedAt: p.updatedAt || null })
        }
      } catch {
        // Skip on fetch error — sitemap degrades gracefully
      }
    })
  )

  const projectUrls: MetadataRoute.Sitemap = entries.map(({ slug, city, updatedAt }) => ({
    url: `${baseUrl}/project-listing/${city}/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // City landing pages (programmatic hubs) — one per city that returned projects.
  const cityUrls: MetadataRoute.Sitemap = Array.from(
    new Set(entries.map((e) => e.city))
  ).map((city) => ({
    url: `${baseUrl}/project-listing/${city}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  // Server-rendered paginated project pages (app/project-listing/[city]/page/[page]/page.tsx)
  // — a real crawl path to every project independent of the client-fetched
  // /project-listing hub. Same page size as that route (PAGE_SIZE = 24).
  const PROJECT_PAGE_SIZE = 24
  const pageUrls: MetadataRoute.Sitemap = Array.from(
    entries.reduce((counts, e) => counts.set(e.city, (counts.get(e.city) || 0) + 1), new Map<string, number>())
  ).flatMap(([city, count]) => {
    const totalPages = Math.max(1, Math.ceil(count / PROJECT_PAGE_SIZE))
    return Array.from({ length: totalPages }, (_, i) => ({
      url: `${baseUrl}/project-listing/${city}/page/${i + 1}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  })

  // Sector hub pages: /sectors index + one page per derived sector, per city.
  const sectorEntries = await Promise.all(
    CITY_KEYS.map(async (cityKey) => {
      const citySegment = canonicalCitySlug(cityKey)
      try {
        const sectors = await getSectorsForCity(cityKey)
        // A city with no derived sectors yet has nothing to hub — advertising
        // its empty /sectors index page just to have Google index a "being
        // updated" placeholder is exactly the sitemap/reality mismatch this
        // was flagged for.
        if (sectors.length === 0) return [] as MetadataRoute.Sitemap
        const urls: MetadataRoute.Sitemap = [
          {
            url: `${baseUrl}/project-listing/${citySegment}/sectors`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
          },
          ...sectors.map((s) => ({
            url: `${baseUrl}/project-listing/${citySegment}/sectors/${s.slug}`,
            lastModified: new Date(),
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
  const sectorUrls: MetadataRoute.Sitemap = sectorEntries.flat()

  // Developer hub pages: /developer index + one page per derived developer.
  let developerUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/developer`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]
  try {
    const developers = await getAllBuilders()
    developerUrls = developerUrls.concat(
      developers.map((d) => ({
        url: `${baseUrl}/developer/${d.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    )
  } catch {
    // Skip per-developer entries on fetch error — sitemap degrades gracefully.
  }

  // Sale/Rent/Pg/Commercial listings — index page per category plus one
  // detail-page entry per listing, mirroring the Projects loop above.
  const propertyEntries: MetadataRoute.Sitemap = []
  await Promise.all(
    (Object.entries(PROPERTY_ROUTE_BASE) as [PropertyCategory, string][]).map(
      async ([category, routeBase]) => {
        try {
          const res = await fetch(homzDataUrl(propertySegment('ggn', category), 1, 500), {
            next: { revalidate: 3600 },
          })
          const json = await res.json()
          const properties: RawHomzProperty[] = json?.results || []
          for (const p of properties) {
            if (!p?.title) continue
            propertyEntries.push({
              url: `${baseUrl}/${routeBase}/gurgaon/${slugForProperty(p)}`,
              lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
              changeFrequency: 'weekly',
              priority: 0.7,
            })
          }
        } catch {
          // Skip on fetch error — sitemap degrades gracefully
        }
      }
    )
  )
  const propertyIndexUrls: MetadataRoute.Sitemap = Object.values(PROPERTY_ROUTE_BASE).map(
    (routeBase) => ({
      url: `${baseUrl}/${routeBase}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    })
  )

  return [
    { url: baseUrl,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${baseUrl}/project-listing`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about-us`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/disclaimer`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    // Not /api-docs — it's noindex,follow (see app/api-docs/page.tsx), so
    // it has nothing to earn from a sitemap entry.
    { url: `${baseUrl}/property-insights`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...BUYER_GUIDES.map((g) => ({
      url: `${baseUrl}/property-insights/${g.slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...BLOG_POSTS.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...cityUrls,
    ...pageUrls,
    ...sectorUrls,
    ...developerUrls,
    ...projectUrls,
    ...propertyIndexUrls,
    ...propertyEntries,
  ]
}