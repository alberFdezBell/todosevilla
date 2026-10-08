import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ids } = body as { action: 'delete' | 'activate' | 'deactivate'; ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un negocio.' }, { status: 400 })
    }

    if (action === 'activate') {
      const res = await prisma.negocio.updateMany({
        where: { id: { in: ids } },
        data: { activo: true },
      })
      return NextResponse.json({
        success: true,
        message: `${res.count} negocio(s) activados correctamente.`,
        count: res.count,
      })
    }

    if (action === 'deactivate') {
      const res = await prisma.negocio.updateMany({
        where: { id: { in: ids } },
        data: { activo: false },
      })
      return NextResponse.json({
        success: true,
        message: `${res.count} negocio(s) desactivados correctamente.`,
        count: res.count,
      })
    }

    if (action === 'delete') {
      const res = await prisma.negocio.deleteMany({
        where: { id: { in: ids } },
      })
      return NextResponse.json({
        success: true,
        message: `${res.count} negocio(s) eliminados correctamente.`,
        count: res.count,
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error en bulk negocios:', error)
    return NextResponse.json({ error: 'Error interno al procesar la acción grupal' }, { status: 500 })
  }
}
