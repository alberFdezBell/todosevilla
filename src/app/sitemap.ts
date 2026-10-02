import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/sevilla`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sevilla/barrios`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sevilla/buscar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/aviso-legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terminos-y-condiciones`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Dynamic Barrio routes
    const barrios = await prisma.barrio.findMany({
      where: { activo: true },
      select: { slug: true, updated_at: true },
    })

    barrios.forEach((b) => {
      routes.push({
        url: `${baseUrl}/sevilla/${b.slug}`,
        lastModified: b.updated_at,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })

    // Dynamic Negocio routes
    const negocios = await prisma.negocio.findMany({
      where: { activo: true, barrio: { activo: true } },
      select: {
        slug: true,
        updated_at: true,
        barrio: { select: { slug: true } },
      },
    })

    negocios.forEach((n) => {
      routes.push({
        url: `${baseUrl}/sevilla/${n.barrio.slug}/${n.slug}`,
        lastModified: n.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return routes
}
