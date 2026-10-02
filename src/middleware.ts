import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken, ADMIN_COOKIE_NAME, isIpAllowed } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check routes under /admin
  if (pathname.startsWith('/admin')) {
    // Allow login page & login API route
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      return NextResponse.next()
    }

    // 1. IP restriction check (if enabled)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '127.0.0.1'
    if (!isIpAllowed(clientIp)) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado: El panel de administración está restringido a la red local.' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    }

    // 2. Authentication check
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    let isValidToken = false

    if (token) {
      const session = await verifyAdminToken(token)
      if (session) {
        isValidToken = true
      }
    }

    if (!isValidToken) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
