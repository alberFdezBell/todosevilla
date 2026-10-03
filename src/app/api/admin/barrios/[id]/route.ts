import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const barrio = await prisma.barrio.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { negocios: true },
        },
      },
    })

    if (!barrio) {
      return NextResponse.json({ error: 'Barrio no encontrado' }, { status: 404 })
    }

    return NextResponse.json(barrio)
  } catch (error) {
    console.error('Error fetching barrio:', error)
    return NextResponse.json({ error: 'Error al consultar el barrio' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nombre, slug: customSlug, descripcion, imagen, activo, geojson } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre del barrio es obligatorio' }, { status: 400 })
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(nombre)

    // Check slug collision with other barrios
    const existing = await prisma.barrio.findFirst({
      where: {
        slug: finalSlug,
        NOT: { id: params.id },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe otro barrio con el slug "${finalSlug}"` },
        { status: 400 }
      )
    }

    const updated = await prisma.barrio.update({
      where: { id: params.id },
      data: {
        nombre: nombre.trim(),
        slug: finalSlug,
        descripcion: descripcion?.trim() || null,
        imagen: imagen?.trim() || null,
        geojson: geojson !== undefined ? geojson : undefined,
        activo: Boolean(activo),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating barrio:', error)
    return NextResponse.json({ error: 'Error al actualizar el barrio' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if barrio exists and has associated businesses
    const barrio = await prisma.barrio.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { negocios: true },
        },
      },
    })

    if (!barrio) {
      return NextResponse.json({ error: 'Barrio no encontrado' }, { status: 404 })
    }

    if (barrio._count.negocios > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el barrio "${barrio.nombre}" porque tiene ${barrio._count.negocios} negocio(s) asociado(s). Elimina o reasigna los negocios primero.`,
        },
        { status: 400 }
      )
    }

    await prisma.barrio.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Barrio eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting barrio:', error)
    return NextResponse.json({ error: 'Error al eliminar el barrio' }, { status: 500 })
  }
}
