import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secreto-cambiar-en-produccion-32-chars-min'
)

export const ADMIN_COOKIE_NAME = 'todo_sevilla_admin_token'

export async function createAdminToken(payload: { username: string; id: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyAdminToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as { username: string; id: string }
  } catch {
    return null
  }
}

export async function getAdminSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null
  return await verifyAdminToken(token)
}

/**
 * Checks whether client IP is allowed when RESTRICT_ADMIN_IP is true
 */
export function isIpAllowed(clientIp: string | null): boolean {
  if (process.env.RESTRICT_ADMIN_IP !== 'true') {
    return true
  }

  if (!clientIp) return false

  const allowedIpsStr = process.env.ALLOWED_ADMIN_IPS || '127.0.0.1,::1,192.168.1.0/24,10.0.0.0/8'
  const allowedList = allowedIpsStr.split(',').map((s) => s.trim())

  // Exact check or local loopback check
  if (allowedList.includes(clientIp) || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    return true
  }

  // Basic subnet prefix matching for local subnets (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const cleanIp = clientIp.replace(/^::ffff:/, '')
  if (cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.') || cleanIp.startsWith('127.')) {
    return true
  }

  return false
}
