import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

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
        const res = await fetch(
          `https://homzbackend.vercel.app/api/data?city=${cityKey}&page=1&limit=200`,
          { next: { revalidate: 3600 } }
        )
        const json = await res.json()
        const projects: any[] = json?.results || []

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

  return [
    { url: baseUrl,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${baseUrl}/project-listing`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/about-us`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...cityUrls,
    ...projectUrls,
  ]
}