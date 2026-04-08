import { MetadataRoute } from 'next'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.homzrealtor.com'

  const cityKeys = [
    'delhiCommercialProjects',
    'delhiResidentialProjects',
    'faridabadCommercialProjects',
    'faridabadResidentialProjects',
    'ggnCommercialProjects',
    'ggnResidentialProjects',
    'gNoidaCommercialProjects',
    'gNoidaResidentialProjects',
    'noidaCommercialProjects',
    'noidaResidentialProjects',
  ]

  let allProjects: any[] = []

  await Promise.all(
    cityKeys.map(async (city) => {
      try {
        const res = await fetch(
          `https://homzbackend.vercel.app/api/data?city=${city}&page=1&limit=200`,
        )

        const json = await res.json()
        const projects = json?.results || []

        allProjects.push(...projects)
      } catch (err) {
        console.error(`Error fetching ${city}`, err)
      }
    })
  )

  // ✅ Remove duplicates
  const uniqueProjects = Array.from(
    new Map(
      allProjects.map((item) => [
        item.name.toLowerCase().replace(/\s+/g, '-'),
        item,
      ])
    ).values()
  )

  // ✅ Dynamic URLs
  const projectUrls = uniqueProjects.map((item: any) => {
    const slug = item.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')

    return {
      url: `${baseUrl}/project-listing/${slug}`,
      lastModified: new Date(item.updatedAt || Date.now()),
    }
  })

  return [
    // ✅ Static pages
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/project-listing`,
      lastModified: new Date(),
    },

    // ✅ Dynamic pages
    ...projectUrls,
  ]
}