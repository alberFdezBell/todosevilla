import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { negocios: true } },
      },
    })
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error fetching categorias:', error)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, slug: customSlug, descripcion, icono, activa } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre de la categoría es obligatorio' }, { status: 400 })
    }

    const finalSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(nombre)

    const existing = await prisma.categoria.findUnique({
      where: { slug: finalSlug },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una categoría con el slug "${finalSlug}"` },
        { status: 400 }
      )
    }

    const newCategoria = await prisma.categoria.create({
      data: {
        nombre: nombre.trim(),
        slug: finalSlug,
        descripcion: descripcion?.trim() || null,
        icono: icono?.trim() || null,
        activa: activa !== undefined ? Boolean(activa) : true,
      },
    })

    return NextResponse.json(newCategoria, { status: 201 })
  } catch (error) {
    console.error('Error creating categoria:', error)
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 })
  }
}
