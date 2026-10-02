import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    if (!query || query.length < 2) {
      return NextResponse.json({
        query,
        negocios: [],
        barrios: [],
      })
    }

    const cleanQuery = query.toLowerCase()

    // 1. Search active barrios
    const barrios = await prisma.barrio.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: cleanQuery, mode: 'insensitive' } },
          { descripcion: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        imagen: true,
        _count: { select: { negocios: { where: { activo: true } } } },
      },
    })

    // 2. Search active businesses matching name, description, neighborhood name, or category name
    const negocios = await prisma.negocio.findMany({
      where: {
        activo: true,
        barrio: { activo: true },
        OR: [
          { nombre: { contains: cleanQuery, mode: 'insensitive' } },
          { descripcion: { contains: cleanQuery, mode: 'insensitive' } },
          { direccion: { contains: cleanQuery, mode: 'insensitive' } },
          { barrio: { nombre: { contains: cleanQuery, mode: 'insensitive' } } },
          {
            categorias: {
              some: {
                categoria: {
                  nombre: { contains: cleanQuery, mode: 'insensitive' },
                  activa: true,
                },
              },
            },
          },
        ],
      },
      include: {
        barrio: {
          select: { id: true, nombre: true, slug: true },
        },
        categorias: {
          where: { categoria: { activa: true } },
          include: {
            categoria: { select: { id: true, nombre: true, slug: true } },
          },
        },
      },
      orderBy: { nombre: 'asc' },
      take: 50,
    })

    return NextResponse.json({
      query,
      barrios,
      negocios,
      totalCount: negocios.length + barrios.length,
    })
  } catch (error) {
    console.error('Error in search route:', error)
    return NextResponse.json({ error: 'Error al procesar la búsqueda' }, { status: 500 })
  }
}
