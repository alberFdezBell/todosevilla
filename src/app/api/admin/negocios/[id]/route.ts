import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: params.id },
      include: {
        barrio: true,
        categorias: { include: { categoria: true } },
      },
    })

    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    return NextResponse.json(negocio)
  } catch (error) {
    console.error('Error fetching negocio:', error)
    return NextResponse.json({ error: 'Error al consultar el negocio' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      nombre,
      slug: customSlug,
      barrioId,
      descripcion,
      direccion,
      telefono,
      email,
      web,
      horario,
      imagen,
      activo,
      categoriaIds,
    } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre del negocio es obligatorio' }, { status: 400 })
    }

    if (!barrioId || typeof barrioId !== 'string') {
      return NextResponse.json({ error: 'Debe seleccionar un barrio' }, { status: 400 })
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(nombre)

    // Check slug collision
    const existing = await prisma.negocio.findFirst({
      where: {
        barrioId,
        slug: finalSlug,
        NOT: { id: params.id },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe otro negocio con el slug "${finalSlug}" en este barrio` },
        { status: 400 }
      )
    }

    const updated = await prisma.negocio.update({
      where: { id: params.id },
      data: {
        nombre: nombre.trim(),
        slug: finalSlug,
        barrioId,
        descripcion: descripcion?.trim() || null,
        direccion: direccion?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        web: web?.trim() || null,
        horario: horario?.trim() || null,
        imagen: imagen?.trim() || null,
        activo: Boolean(activo),
      },
    })

    // Update categories
    if (Array.isArray(categoriaIds)) {
      // Delete old relations
      await prisma.negocioCategoria.deleteMany({
        where: { negocioId: params.id },
      })

      // Add new relations
      for (const catId of categoriaIds) {
        await prisma.negocioCategoria.create({
          data: {
            negocioId: params.id,
            categoriaId: catId,
          },
        })
      }
    }

    const updatedWithRelations = await prisma.negocio.findUnique({
      where: { id: params.id },
      include: {
        barrio: true,
        categorias: { include: { categoria: true } },
      },
    })

    return NextResponse.json(updatedWithRelations)
  } catch (error) {
    console.error('Error updating negocio:', error)
    return NextResponse.json({ error: 'Error al actualizar el negocio' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id: params.id },
    })

    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    await prisma.negocio.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Negocio eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting negocio:', error)
    return NextResponse.json({ error: 'Error al eliminar el negocio' }, { status: 500 })
  }
}
