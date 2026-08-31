import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Crear categoría
export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "El nombre y el slug son obligatorios." },
        { status: 400 }
      );
    }

    // Validar duplicados
    const existing = await db.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre o slug." },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: { name, slug: slug.toLowerCase().trim() },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { error: "Error en el servidor al crear la categoría." },
      { status: 500 }
    );
  }
}
