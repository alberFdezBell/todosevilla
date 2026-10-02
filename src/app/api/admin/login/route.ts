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

    // 1. Look up admin user in database
    let admin = await prisma.adminUser.findUnique({
      where: { username },
    })

    // If database doesn't have admin user yet, fall back to ADMIN_PASSWORD env var for fallback
    let isValid = false
    if (admin) {
      isValid = await bcrypt.compare(password, admin.passwordHash)
    } else if (username === 'admin') {
      const fallbackPass = process.env.ADMIN_PASSWORD || 'AdminSevilla2026!ChangeMe'
      if (password === fallbackPass) {
        // Create user in db automatically
        const hash = await bcrypt.hash(password, 10)
        admin = await prisma.adminUser.create({
          data: { username: 'admin', passwordHash: hash },
        })
        isValid = true
      }
    }

    if (!isValid || !admin) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = await createAdminToken({ username: admin.username, id: admin.id })

    const response = NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
    })

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno en la autenticación' },
      { status: 500 }
    )
  }
}
