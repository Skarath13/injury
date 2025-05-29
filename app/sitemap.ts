import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable or detect the current domain
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://californiasettlementcalculator.com'
  
  // Specific last modified dates for better SEO (Google uses this if consistent)
  // Use the actual deployment date for accurate lastModified
  const lastModified = new Date('2025-05-28T00:00:00.000Z')
  
  // Define all pages that should be included in sitemap
  const pages = [
    {
      url: baseUrl,
      lastModified: lastModified,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: lastModified,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: lastModified,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: lastModified,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: lastModified,
    },
  ]

  // Filter out any pages that shouldn't be indexed
  // Only include pages that return 200 status and are not noindex
  return pages.filter(page => {
    // Add any filtering logic here if needed
    return true
  })
}