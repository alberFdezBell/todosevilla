import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: params.id },
      include: { _count: { select: { negocios: true } } },
    })

    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error fetching categoria:', error)
    return NextResponse.json({ error: 'Error al consultar categoría' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nombre, slug: customSlug, descripcion, icono, activa } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre de la categoría es obligatorio' }, { status: 400 })
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(nombre)

    const existing = await prisma.categoria.findFirst({
      where: {
        slug: finalSlug,
        NOT: { id: params.id },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe otra categoría con el slug "${finalSlug}"` },
        { status: 400 }
      )
    }

    const updated = await prisma.categoria.update({
      where: { id: params.id },
      data: {
        nombre: nombre.trim(),
        slug: finalSlug,
        descripcion: descripcion?.trim() || null,
        icono: icono?.trim() || null,
        activa: Boolean(activa),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating categoria:', error)
    return NextResponse.json({ error: 'Error al actualizar la categoría' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: params.id },
    })

    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    await prisma.categoria.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Categoría eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting categoria:', error)
    return NextResponse.json({ error: 'Error al eliminar la categoría' }, { status: 500 })
  }
}
