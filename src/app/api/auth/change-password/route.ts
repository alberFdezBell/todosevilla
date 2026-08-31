import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "un_secreto_super_seguro_y_largo_para_firmar_los_tokens_jwt_12345";
const key = new TextEncoder().encode(JWT_SECRET);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    // Verificar el token para obtener el userId
    let userId = "";
    try {
      const { payload } = await jwtVerify(token, key);
      userId = payload.userId as string;
    } catch {
      return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña es obligatoria y debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    // Hashear y actualizar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false, // Desactivar la obligación de cambio
      },
    });

    // Forzar el cierre de sesión tras el cambio de contraseña
    const response = NextResponse.json({
      success: true,
      message: "Contraseña actualizada con éxito. Por favor, inicie sesión de nuevo.",
    });

    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      expires: new Date(0), // Expirar cookie inmediatamente
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error al cambiar contraseña obligatoria:", error);
    return NextResponse.json(
      { error: "Ocurrió un error en el servidor." },
      { status: 500 }
    );
  }
}
