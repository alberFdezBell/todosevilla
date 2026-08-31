import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT: Editar categoría
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "El nombre y el slug son obligatorios." },
        { status: 400 }
      );
    }

    // Validar duplicados excluyendo la categoría actual
    const existing = await db.category.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { OR: [{ name }, { slug: slug.toLowerCase().trim() }] },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe otra categoría con ese nombre o slug." },
        { status: 400 }
      );
    }

    const updated = await db.category.update({
      where: { id },
      data: { name, slug: slug.toLowerCase().trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al editar categoría:", error);
    return NextResponse.json(
      { error: "Error en el servidor al editar la categoría." },
      { status: 500 }
    );
  }
}

// DELETE: Borrar categoría
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar si tiene negocios asociados
    const count = await db.business.count({
      where: { categoryId: id },
    });

    if (count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar la categoría porque tiene negocios asociados." },
        { status: 400 }
      );
    }

    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Categoría eliminada." });
  } catch (error) {
    console.error("Error al borrar categoría:", error);
    return NextResponse.json(
      { error: "Error en el servidor al eliminar la categoría." },
      { status: 500 }
    );
  }
}
