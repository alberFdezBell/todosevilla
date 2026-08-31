import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST: Crear negocio
export async function POST(request: Request) {
  try {
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

    // Validar slug duplicado
    const existing = await db.business.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un negocio con ese slug de URL." },
        { status: 400 }
      );
    }

    const business = await db.business.create({
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

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error al crear negocio:", error);
    return NextResponse.json(
      { error: "Error en el servidor al crear el negocio." },
      { status: 500 }
    );
  }
}
