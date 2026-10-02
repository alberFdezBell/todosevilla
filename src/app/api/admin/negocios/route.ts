import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  try {
    const negocios = await prisma.negocio.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        barrio: {
          select: { id: true, nombre: true, slug: true },
        },
        categorias: {
          include: {
            categoria: { select: { id: true, nombre: true, slug: true } },
          },
        },
      },
    })
    return NextResponse.json(negocios)
  } catch (error) {
    console.error('Error fetching negocios:', error)
    return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    // Validation
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre del negocio es obligatorio' }, { status: 400 })
    }

    if (!barrioId || typeof barrioId !== 'string') {
      return NextResponse.json({ error: 'Debe seleccionar un barrio' }, { status: 400 })
    }

    // Verify barrio exists
    const barrioExists = await prisma.barrio.findUnique({
      where: { id: barrioId },
    })

    if (!barrioExists) {
      return NextResponse.json({ error: 'El barrio seleccionado no existe' }, { status: 400 })
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(nombre)

    // Check slug collision within the same barrio
    const existing = await prisma.negocio.findFirst({
      where: {
        barrioId,
        slug: finalSlug,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un negocio con el slug "${finalSlug}" en este barrio` },
        { status: 400 }
      )
    }

    // Create negocio
    const newNegocio = await prisma.negocio.create({
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
        activo: activo !== undefined ? Boolean(activo) : true,
      },
    })

    // Assign categories if provided
    if (Array.isArray(categoriaIds) && categoriaIds.length > 0) {
      for (const catId of categoriaIds) {
        await prisma.negocioCategoria.create({
          data: {
            negocioId: newNegocio.id,
            categoriaId: catId,
          },
        })
      }
    }

    const createdWithRelations = await prisma.negocio.findUnique({
      where: { id: newNegocio.id },
      include: {
        barrio: true,
        categorias: { include: { categoria: true } },
      },
    })

    return NextResponse.json(createdWithRelations, { status: 201 })
  } catch (error) {
    console.error('Error creating negocio:', error)
    return NextResponse.json({ error: 'Error al crear el negocio' }, { status: 500 })
  }
}
