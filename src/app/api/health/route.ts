import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Endpoint de comprobación de salud del servidor para Docker Swarm.
 * Verifica que la aplicación responde y que la base de datos conecta.
 * Docker ejecuta este endpoint automáticamente según la configuración del healthcheck.
 */
export async function GET() {
  try {
    // Verificar conexión activa a la base de datos con una consulta mínima
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: process.env.GIT_COMMIT_SHA || "unknown",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check fallido - Error de base de datos:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "No se puede conectar a la base de datos.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
