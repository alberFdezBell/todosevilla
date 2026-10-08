import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import booleanIntersects from '@turf/boolean-intersects'
import type { FeatureCollection, Feature, Geometry } from 'geojson'

function getFeatureBarrioName(feature: Feature<Geometry>): string {
  const props = (feature.properties as Record<string, unknown>) || {}
  const rawName =
    props.barrio ||
    props.Barrio ||
    props.BARRIO ||
    props.nombre ||
    props.Nombre ||
    props.name ||
    props.NAME ||
    props.title ||
    ''

  return String(rawName).trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { geojson } = body

    if (!geojson) {
      return NextResponse.json(
        { error: 'No se ha proporcionado un objeto o archivo GeoJSON válido.' },
        { status: 400 }
      )
    }

    let features: Feature<Geometry>[] = []

    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      features = geojson.features
    } else if (geojson.type === 'Feature') {
      features = [geojson]
    } else if (Array.isArray(geojson)) {
      features = geojson.filter((f) => f && f.type === 'Feature')
    } else {
      return NextResponse.json(
        { error: 'El formato GeoJSON debe ser un FeatureCollection o una lista de Features.' },
        { status: 400 }
      )
    }

    if (features.length === 0) {
      return NextResponse.json(
        { error: 'El archivo GeoJSON no contiene elementos (features) para importar.' },
        { status: 400 }
      )
    }

    // Cargar todos los barrios existentes en la BD
    const dbBarrios = await prisma.barrio.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        geojson: true,
      },
    })

    // Preparar lista de barrios existentes con geometría GeoJSON válida
    const existingGeometries: { id: string; nombre: string; slug: string; feature: Feature }[] = []

    for (const b of dbBarrios) {
      if (!b.geojson) continue
      const raw = b.geojson as Record<string, unknown>
      const geom: Geometry | null =
        raw.type === 'Feature'
          ? ((raw.geometry as Geometry) ?? null)
          : (raw as unknown as Geometry)

      if (geom) {
        existingGeometries.push({
          id: b.id,
          nombre: b.nombre,
          slug: b.slug,
          feature: {
            type: 'Feature',
            geometry: geom,
            properties: { id: b.id, nombre: b.nombre, slug: b.slug },
          },
        })
      }
    }

    // Analizar cada feature entrante
    const items = features.map((feature, index) => {
      const extractedName = getFeatureBarrioName(feature) || `Barrio ${index + 1}`
      const generatedSlug = slugify(extractedName)

      // Comprobar si ya existe un barrio con este slug en la BD
      const existingMatch = dbBarrios.find(
        (b) => b.slug === generatedSlug || b.nombre.toLowerCase() === extractedName.toLowerCase()
      )

      // Comprobar choques / solapamientos espaciales con los barrios actuales en la BD
      const conflictingBarrios: { id: string; nombre: string; slug: string }[] = []

      if (feature.geometry) {
        for (const exist of existingGeometries) {
          // Si es el mismo barrio (coincidencia de slug), no lo contamos como conflicto de solapamiento nuevo
          if (existingMatch && exist.id === existingMatch.id) {
            continue
          }

          try {
            const intersects = booleanIntersects(feature as any, exist.feature as any)
            if (intersects) {
              conflictingBarrios.push({
                id: exist.id,
                nombre: exist.nombre,
                slug: exist.slug,
              })
            }
          } catch (err) {
            console.warn('Error calculando booleanIntersects en import:', err)
          }
        }
      }

      const hasConflict = conflictingBarrios.length > 0

      return {
        id: `import-${index}-${Date.now()}`,
        index,
        nombre: extractedName,
        slug: generatedSlug,
        feature,
        existingBarrioId: existingMatch?.id ?? null,
        existingBarrioNombre: existingMatch?.nombre ?? null,
        conflicts: conflictingBarrios,
        hasConflict,
        approved: !hasConflict, // Aprobar por defecto si no tiene choques
      }
    })

    const conflictsCount = items.filter((i) => i.hasConflict).length

    return NextResponse.json({
      total: items.length,
      conflictsCount,
      items,
    })
  } catch (error) {
    console.error('Error procesando check-import:', error)
    return NextResponse.json(
      { error: 'Error al analizar el archivo GeoJSON.' },
      { status: 500 }
    )
  }
}
