import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT: Editar negocio
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();
    const {
      name,
      slug,
      description,
      address,
      phone,
      schedule,
      website,
      published,
      categoryId,
      zoneId,
      ownerId,
    } = data;

    if (!name || !slug || !categoryId || !zoneId) {
      return NextResponse.json(
        { error: "Nombre, slug, categoría y zona son obligatorios." },
        { status: 400 }
      );
    }

    // Validar duplicados de slug excluyendo el actual
    const existing = await db.business.findFirst({
      where: {
        AND: [{ id: { not: id } }, { slug: slug.toLowerCase().trim() }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe otro negocio con ese slug de URL." },
        { status: 400 }
      );
    }

    const updated = await db.business.update({
      where: { id },
      data: {
        name,
        slug: slug.toLowerCase().trim(),
        description: description || null,
        address: address || null,
        phone: phone || null,
        schedule: schedule || null,
        website: website || null,
        published: published !== undefined ? published : true,
        categoryId,
        zoneId,
        ownerId: ownerId || null,
      },
      include: {
        category: true,
        zone: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al editar negocio:", error);
    return NextResponse.json(
      { error: "Error en el servidor al editar el negocio." },
      { status: 500 }
    );
  }
}

// DELETE: Borrar negocio
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await db.business.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Negocio eliminado." });
  } catch (error) {
    console.error("Error al borrar negocio:", error);
    return NextResponse.json(
      { error: "Error en el servidor al eliminar el negocio." },
      { status: 500 }
    );
  }
}
