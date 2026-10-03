import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Debe indicar usuario y contraseña' },
        { status: 400 }
      )
    }

    // 1. Buscar usuario admin en base de datos
    let admin = await prisma.adminUser.findUnique({
      where: { username },
    })

    let isValid = false

    if (admin) {
      isValid = await bcrypt.compare(password, admin.passwordHash)
    } else if (username === 'admin') {
      // Si no existe admin en BD, usar ADMIN_PASSWORD de entorno como fallback y crearlo
      const fallbackPass = process.env.ADMIN_PASSWORD || 'AdminSevilla2026!ChangeMe'
      if (password === fallbackPass) {
        const hash = await bcrypt.hash(password, 10)
        admin = await prisma.adminUser.create({
          data: { username: 'admin', passwordHash: hash },
        })
        isValid = true
      }
    }

    if (!isValid || !admin) {
      console.warn(`[AUTH] Intento de login fallido para usuario: "${username}"`)
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Generar token JWT
    const token = await createAdminToken({ username: admin.username, id: admin.id })

    const response = NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
    })

    // Detectar si la conexión entrante es HTTPS
    const isHttps =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.url.startsWith('https://')

    // Establecer Cookie HTTP-Only
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps, // Solo poner secure: true si la conexión realmente es HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    })

    console.log(`[AUTH] Login exitoso para usuario: "${admin.username}" (HTTPS: ${isHttps})`)
    return response
  } catch (error) {
    console.error('[AUTH] Error en el servidor durante el login:', error)
    return NextResponse.json(
      { error: 'Error interno en el servidor de autenticación' },
      { status: 500 }
    )
  }
}
