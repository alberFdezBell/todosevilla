import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Sesión cerrada correctamente." });
  
  // Borrar cookie
  response.cookies.delete("token");

  return response;
}
