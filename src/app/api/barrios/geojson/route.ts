import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { FeatureCollection, Feature, Geometry } from 'geojson'

export const revalidate = 60

/**
 * GET /api/barrios/geojson
 * Devuelve un GeoJSON FeatureCollection con los barrios activos
 * que tienen polígono definido en la BD, incluyendo el conteo de negocios activos.
 */
export async function GET() {
  try {
    const barrios = await prisma.barrio.findMany({
      where: {
        activo: true,
        NOT: [{ geojson: { equals: null as any } }],
      },
      select: {
        id: true,
        nombre: true,
        slug: true,
        geojson: true,
        _count: {
          select: { negocios: { where: { activo: true } } },
        },
      },
    })

    const features: Feature[] = barrios
      .map((b) => {
        const raw = b.geojson as Record<string, unknown> | null
        if (!raw) return null

        // Admitimos Feature guardada (leaflet-draw la guarda así) o Geometry directa
        const geometry: Geometry =
          raw.type === 'Feature'
            ? (raw.geometry as Geometry)
            : (raw as unknown as Geometry)

        return {
          type: 'Feature' as const,
          geometry,
          properties: {
            id: b.id,
            nombre: b.nombre,
            slug: b.slug,
            negocios: b._count.negocios,
          },
        } satisfies Feature
      })
      .filter(Boolean) as Feature[]

    const fc: FeatureCollection = { type: 'FeatureCollection', features }
    return NextResponse.json(fc)
  } catch (error) {
    console.error('Error fetching barrios geojson:', error)
    return NextResponse.json(
      { error: 'Error al obtener los barrios' },
      { status: 500 }
    )
  }
}
