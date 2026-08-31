import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Crear zona
export async function POST(request: Request) {
  try {
    const { name, slug, description, seoTitle, seoDescription } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "El nombre y el slug de URL son obligatorios." },
        { status: 400 }
      );
    }

    // Validar duplicados
    const existing = await db.zone.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una zona con ese nombre o slug." },
        { status: 400 }
      );
    }

    const zone = await db.zone.create({
      data: {
        name,
        slug: slug.toLowerCase().trim(),
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error("Error al crear zona:", error);
    return NextResponse.json(
      { error: "Error en el servidor al crear la zona." },
      { status: 500 }
    );
  }
}
