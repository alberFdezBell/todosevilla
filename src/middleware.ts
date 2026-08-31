import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "un_secreto_super_seguro_y_largo_para_firmar_los_tokens_jwt_12345";
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas las rutas del panel
  if (pathname.startsWith("/panel")) {
    
    // REQUISITO CRÍTICO DE SEGURIDAD: Bloquear acceso al panel desde el túnel de Cloudflare.
    // Cloudflare inyecta cabeceras específicas como 'cf-connecting-ip' o 'cf-ray'.
    // Si estas cabeceras existen, significa que la petición proviene de internet a través de Cloudflare.
    const isCloudflare = request.headers.get("cf-connecting-ip") || request.headers.get("cf-ray");
    
    if (isCloudflare) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Acceso Prohibido. El panel de administración solo es accesible desde la red local privada." 
        }),
        { 
          status: 403, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    // Permitir el acceso libre a la página de login del panel
    if (pathname === "/panel/login") {
      return NextResponse.next();
    }

    // Verificar autenticación
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/panel/login", request.url));
    }

    try {
      // Verificar el JWT usando 'jose' (compatible con Next.js Edge/Middleware)
      await jwtVerify(token, key);
      return NextResponse.next();
    } catch (err) {
      // Token inválido o expirado, redirigir a login
      const response = NextResponse.redirect(new URL("/panel/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

// Ejecutar middleware solo en rutas de panel e inicio de sesión
export const config = {
  matcher: ["/panel/:path*"],
};
