import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT: Editar zona
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, slug, description, seoTitle, seoDescription } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "El nombre y el slug de URL son obligatorios." },
        { status: 400 }
      );
    }

    // Validar duplicados excluyendo la zona actual
    const existing = await db.zone.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { OR: [{ name }, { slug: slug.toLowerCase().trim() }] },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe otra zona con ese nombre o slug de URL." },
        { status: 400 }
      );
    }

    const updated = await db.zone.update({
      where: { id },
      data: {
        name,
        slug: slug.toLowerCase().trim(),
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al editar zona:", error);
    return NextResponse.json(
      { error: "Error en el servidor al editar la zona." },
      { status: 500 }
    );
  }
}

// DELETE: Borrar zona
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar si tiene negocios asociados
    const count = await db.business.count({
      where: { zoneId: id },
    });

    if (count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar la zona porque tiene negocios asociados." },
        { status: 400 }
      );
    }

    await db.zone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Zona eliminada." });
  } catch (error) {
    console.error("Error al borrar zona:", error);
    return NextResponse.json(
      { error: "Error en el servidor al eliminar la zona." },
      { status: 500 }
    );
  }
}
