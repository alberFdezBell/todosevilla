import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ids } = body as { action: 'delete' | 'activate' | 'deactivate'; ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un barrio.' }, { status: 400 })
    }

    if (action === 'activate') {
      const res = await prisma.barrio.updateMany({
        where: { id: { in: ids } },
        data: { activo: true },
      })
      return NextResponse.json({
        success: true,
        message: `${res.count} barrio(s) activados correctamente.`,
        count: res.count,
      })
    }

    if (action === 'deactivate') {
      const res = await prisma.barrio.updateMany({
        where: { id: { in: ids } },
        data: { activo: false },
      })
      return NextResponse.json({
        success: true,
        message: `${res.count} barrio(s) desactivados correctamente.`,
        count: res.count,
      })
    }

    if (action === 'delete') {
      // Verificar si alguno de los barrios seleccionados tiene negocios vinculados
      const barriosConNegocios = await prisma.barrio.findMany({
        where: {
          id: { in: ids },
          negocios: { some: {} },
        },
        select: { id: true, nombre: true },
      })

      if (barriosConNegocios.length > 0) {
        const nombres = barriosConNegocios.map((b) => b.nombre).join(', ')
        return NextResponse.json(
          {
            error: `No se pueden eliminar los siguientes barrios porque tienen negocios asociados: ${nombres}.`,
          },
          { status: 400 }
        )
      }

      const res = await prisma.barrio.deleteMany({
        where: { id: { in: ids } },
      })

      return NextResponse.json({
        success: true,
        message: `${res.count} barrio(s) eliminados correctamente.`,
        count: res.count,
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error en bulk barrios:', error)
    return NextResponse.json({ error: 'Error interno al procesar la acción grupal' }, { status: 500 })
  }
}
