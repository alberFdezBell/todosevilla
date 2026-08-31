import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT: Editar documento legal
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "El título y el contenido son obligatorios." },
        { status: 400 }
      );
    }

    const updated = await db.legalDocument.update({
      where: { id },
      data: {
        title,
        content,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al editar documento legal:", error);
    return NextResponse.json(
      { error: "Error en el servidor al editar el documento legal." },
      { status: 500 }
    );
  }
}
