import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import type { Feature, Geometry } from 'geojson'

interface ImportItemPayload {
  nombre: string
  slug: string
  feature: Feature<Geometry>
  existingBarrioId?: string | null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items } = body as { items: ImportItemPayload[] }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron áreas aprobadas para importar.' },
        { status: 400 }
      )
    }

    let createdCount = 0
    let updatedCount = 0

    for (const item of items) {
      const { nombre, slug, feature, existingBarrioId } = item
      if (!nombre || !feature) continue

      const finalSlug = slug ? slugify(slug) : slugify(nombre)
      const geojsonPayload = feature

      if (existingBarrioId) {
        // Actualizar el barrio existente
        await prisma.barrio.update({
          where: { id: existingBarrioId },
          data: {
            nombre: nombre.trim(),
            slug: finalSlug,
            geojson: geojsonPayload as any,
            activo: true,
          },
        })
        updatedCount++
      } else {
        // Buscar por si existe un barrio con ese slug exactamente
        const existingBySlug = await prisma.barrio.findUnique({
          where: { slug: finalSlug },
        })

        if (existingBySlug) {
          await prisma.barrio.update({
            where: { id: existingBySlug.id },
            data: {
              nombre: nombre.trim(),
              geojson: geojsonPayload as any,
              activo: true,
            },
          })
          updatedCount++
        } else {
          await prisma.barrio.create({
            data: {
              nombre: nombre.trim(),
              slug: finalSlug,
              geojson: geojsonPayload as any,
              activo: true,
            },
          })
          createdCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proceso completado con éxito: ${createdCount} áreas creadas, ${updatedCount} áreas actualizadas.`,
      createdCount,
      updatedCount,
      totalImported: createdCount + updatedCount,
    })
  } catch (error) {
    console.error('Error al importar áreas en BD:', error)
    return NextResponse.json(
      { error: 'Error interno al guardar las áreas importadas en la base de datos.' },
      { status: 500 }
    )
  }
}
