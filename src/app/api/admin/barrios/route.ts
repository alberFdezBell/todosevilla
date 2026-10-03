import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  try {
    const barrios = await prisma.barrio.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { negocios: true },
        },
      },
    })
    return NextResponse.json(barrios)
  } catch (error) {
    console.error('Error fetching barrios:', error)
    return NextResponse.json({ error: 'Error al obtener barrios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, slug: customSlug, descripcion, imagen, activo, geojson } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre del barrio es obligatorio' }, { status: 400 })
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(nombre)

    // Check slug uniqueness
    const existing = await prisma.barrio.findUnique({
      where: { slug: finalSlug },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un barrio con el slug "${finalSlug}"` },
        { status: 400 }
      )
    }

    const newBarrio = await prisma.barrio.create({
      data: {
        nombre: nombre.trim(),
        slug: finalSlug,
        descripcion: descripcion?.trim() || null,
        imagen: imagen?.trim() || null,
        geojson: geojson ?? null,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
    })

    return NextResponse.json(newBarrio, { status: 201 })
  } catch (error) {
    console.error('Error creating barrio:', error)
    return NextResponse.json({ error: 'Error al crear el barrio' }, { status: 500 })
  }
}
